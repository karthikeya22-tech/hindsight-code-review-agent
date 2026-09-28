"""Isolated Hindsight integration.

Verified against installed hindsight-client 0.10.1 (see SDK class docstring):
sync wrappers (retain/recall/...) call asyncio.run_until_complete internally
and MUST NOT be used inside FastAPI — a shared client reused across worker
threads/loops corrupts the underlying HTTP session and raises
"Timeout context manager should be used inside a task". The SDK directs
FastAPI users to the async variants, so this service exclusively uses:
    await client.aget_version()
    await client.acreate_bank(bank_id=..., name=..., mission=...)
    await client.aretain(bank_id=..., content=..., context=..., document_id=..., tags=...)
    await client.arecall(bank_id=..., query=..., max_tokens=..., budget=...)
    await client.alist_memories(bank_id=..., limit=..., search_query=...)
    await client.aclose()
All callers (FastAPI routes) are `async def` so everything runs on the single
uvicorn event loop the client's session is bound to.

Response shapes (verified):
    recall -> RecallResponse with .results: list[RecallResult]
        each result has .id, .text, .type, .context, .tags, ...
    retain -> RetainResponse with .success
"""
import logging
import uuid

from config import settings

log = logging.getLogger("codemind.hindsight")

BANK_MISSION = (
    "You are the long-term memory for CodeMind, an AI code review agent. "
    "Remember this development team's project context (purpose, technology stack, "
    "architecture, coding guidelines), coding preferences, review decisions "
    "(accepted/rejected recommendations), and recurring review patterns so "
    "future code reviews can be personalized to how this team writes code."
)

# Context labels used on retain — these are the honest basis for splitting
# recalled memories into "project knowledge" vs "team/review knowledge".
PROJECT_CONTEXT_LABEL = "project context"
TEAM_CONTEXT_LABELS = {
    "team coding convention",
    "accepted review decision",
    "rejected review decision",
}

# Tags are a supported retain/recall parameter (verified in SDK signature).
# Used as a secondary classification signal; recall is never filtered by tags
# so older untagged memories remain visible.
TAG_KIND_PROJECT = "kind:project"
TAG_KIND_TEAM = "kind:team"


def project_slug(name: str) -> str:
    import re

    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or "project"


def classify_memory(mem: dict) -> str:
    """Classify a recalled memory dict as 'project' or 'team'."""
    tags = [str(t).lower() for t in (mem.get("tags") or [])]
    if TAG_KIND_PROJECT in tags:
        return "project"
    if TAG_KIND_TEAM in tags:
        return "team"
    ctx = (mem.get("context") or "").strip().lower()
    if ctx == PROJECT_CONTEXT_LABEL:
        return "project"
    return "team"


class HindsightService:
    def __init__(self):
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self._client = None
        self._available: bool | None = None
        self._unavailable_reason: str = ""
        self._init_error: str = ""
        try:
            from hindsight_client import Hindsight

            kwargs: dict = {"base_url": settings.HINDSIGHT_BASE_URL, "timeout": 15.0}
            if settings.HINDSIGHT_API_KEY:
                kwargs["api_key"] = settings.HINDSIGHT_API_KEY
            elif settings.HINDSIGHT_BASE_URL.startswith("https://"):
                log.warning("No HINDSIGHT_API_KEY set for %s — Hindsight Cloud calls will fail with 401.",
                            settings.HINDSIGHT_BASE_URL)
            self._client = Hindsight(**kwargs)
        except Exception as e:  # pragma: no cover - init failure path
            self._init_error = str(e)
            log.warning("Hindsight client init failed: %s", e)

    # -- status -----------------------------------------------------------
    @property
    def configured(self) -> bool:
        return self._client is not None and not self._init_error

    async def check_available(self) -> tuple[bool, str]:
        """Ping Hindsight. Returns (available, message)."""
        if not self.configured:
            reason = self._init_error or "Hindsight client not initialized."
            self._available = False
            self._unavailable_reason = reason
            return False, reason
        if not settings.HINDSIGHT_API_KEY and settings.HINDSIGHT_BASE_URL.startswith("https://"):
            reason = ("HINDSIGHT_API_KEY is not set. Add it to .env to use Hindsight Cloud — "
                      "memory calls will fail with 401 until then.")
            self._available = False
            self._unavailable_reason = reason
            return False, reason
        try:
            version = await self._client.aget_version()
            self._available = True
            self._unavailable_reason = ""
            api_v = getattr(version, "api_version", "unknown")
            return True, f"Hindsight reachable (api {api_v})."
        except Exception as e:
            self._available = False
            self._unavailable_reason = str(e)
            return False, str(e)

    async def aclose(self) -> None:
        """Close the underlying HTTP session (call on app shutdown)."""
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception as e:
                log.warning("Hindsight close failed: %s", e)

    async def ensure_bank(self) -> bool:
        """Create the team bank if it does not exist. Returns True if usable."""
        if not self.configured:
            return False
        try:
            await self._client.acreate_bank(
                bank_id=self.bank_id,
                name="CodeMind Team",
                mission=BANK_MISSION,
            )
            return True
        except Exception as e:
            msg = str(e).lower()
            # Bank already exists -> usable. Match common conflict phrasings.
            if "already" in msg or "exist" in msg or "conflict" in msg or "409" in msg:
                return True
            log.warning("ensure_bank failed: %s", e)
            return False

    # -- core ops ---------------------------------------------------------
    async def recall(self, query: str, max_tokens: int = 2048) -> tuple[list[dict], bool, str]:
        """Recall relevant memories. Returns (memories, available, message)."""
        if not self.configured:
            return [], False, self._init_error or "Hindsight not configured."
        try:
            response = await self._client.arecall(
                bank_id=self.bank_id,
                query=query,
                max_tokens=max_tokens,
                budget="mid",
            )
            results = getattr(response, "results", []) or []
            memories = []
            for r in results:
                memories.append(
                    {
                        "id": getattr(r, "id", None),
                        "text": getattr(r, "text", ""),
                        "type": getattr(r, "type", None),
                        "context": getattr(r, "context", None),
                        "tags": list(getattr(r, "tags", None) or []),
                    }
                )
            return memories, True, f"{len(memories)} relevant memories found."
        except Exception as e:
            msg = str(e).lower()
            if "not found" in msg or "no bank" in msg or "404" in msg:
                # Bank missing -> try to create, then report no memories yet.
                if await self.ensure_bank():
                    return [], True, "Memory bank initialized. No team memories yet."
            log.warning("Hindsight recall failed: %s", e)
            return [], False, str(e)

    async def retain(self, content: str, context: str = "team coding convention",
                     tags: list[str] | None = None) -> tuple[bool, str]:
        """Retain durable knowledge. Returns (success, message)."""
        if not self.configured:
            return False, self._init_error or "Hindsight not configured."
        try:
            kwargs: dict = {
                "bank_id": self.bank_id,
                "content": content,
                "context": context,
                "document_id": f"codemind-{uuid.uuid4().hex[:12]}",
            }
            if tags:
                kwargs["tags"] = tags
            result = await self._client.aretain(**kwargs)
            ok = bool(getattr(result, "success", True))
            return ok, "Memory retained in Hindsight." if ok else "Hindsight retain reported failure."
        except Exception as e:
            msg = str(e).lower()
            if "not found" in msg or "404" in msg:
                if await self.ensure_bank():
                    try:
                        result = await self._client.aretain(
                            bank_id=self.bank_id,
                            content=content,
                            context=context,
                            document_id=f"codemind-{uuid.uuid4().hex[:12]}",
                        )
                        ok = bool(getattr(result, "success", True))
                        return ok, "Memory retained in Hindsight." if ok else "Retain reported failure."
                    except Exception as e2:
                        log.warning("Hindsight retain retry failed: %s", e2)
                        return False, str(e2)
            log.warning("Hindsight retain failed: %s", e)
            return False, str(e)

    async def retain_project(self, content: str, slug: str) -> tuple[bool, str]:
        """Retain project knowledge with the project-context label + tags."""
        return await self.retain(
            content,
            context=PROJECT_CONTEXT_LABEL,
            tags=[TAG_KIND_PROJECT, f"project:{slug}"],
        )

    async def recall_split(self, project_query: str, team_query: str,
                           max_tokens: int = 2048) -> tuple[list[dict], list[dict], bool, str]:
        """Two targeted recalls; split results into (project, team) memories.

        Classification uses actual returned tags/context labels (see
        classify_memory). Untargeted leftovers are classified the same way.
        Returns (project_mems, team_mems, available, message).
        """
        proj, avail_p, msg_p = await self.recall(project_query, max_tokens=max_tokens)
        team, avail_t, msg_t = await self.recall(team_query, max_tokens=max_tokens)
        available = avail_p or avail_t
        if not available:
            return [], [], False, msg_p or msg_t
        seen: set[str] = set()
        project_mems: list[dict] = []
        team_mems: list[dict] = []
        for mem in proj + team:
            key = str(mem.get("id") or mem.get("text"))
            if key in seen:
                continue
            seen.add(key)
            if not mem.get("text"):
                continue
            (project_mems if classify_memory(mem) == "project" else team_mems).append(mem)
        return project_mems, team_mems, True, (
            f"{len(project_mems)} project memories, {len(team_mems)} team memories."
        )

    async def list_recent(self, limit: int = 20, search_query: str = "") -> tuple[list[dict], bool, str]:
        if not self.configured:
            return [], False, self._init_error or "Hindsight not configured."
        try:
            kwargs: dict = {"bank_id": self.bank_id, "limit": limit}
            if search_query:
                kwargs["search_query"] = search_query
            resp = await self._client.alist_memories(**kwargs)
            # Verified shape on hindsight-client 0.10.1: ListMemoryUnitsResponse
            # with .items (Cloud docs show {total, items}). Accept .memories or
            # a raw list too so other backends keep working.
            items = getattr(resp, "items", None)
            if items is None:
                items = getattr(resp, "memories", resp)
            if not isinstance(items, list):
                items = []
            memories = []
            for m in items:
                if isinstance(m, dict):
                    memories.append(
                        {
                            "id": m.get("id"),
                            "text": m.get("text", ""),
                            "type": m.get("type"),
                            "context": m.get("context"),
                            "tags": list(m.get("tags") or []),
                        }
                    )
                else:
                    memories.append(
                        {
                            "id": getattr(m, "id", None),
                            "text": getattr(m, "text", ""),
                            "type": getattr(m, "type", None),
                            "context": getattr(m, "context", None),
                            "tags": list(getattr(m, "tags", None) or []),
                        }
                    )
            return memories, True, f"{len(memories)} memories."
        except Exception as e:
            log.warning("Hindsight list_memories failed: %s", e)
            return [], False, str(e)


# Singleton used by routes
hindsight_service = HindsightService()
