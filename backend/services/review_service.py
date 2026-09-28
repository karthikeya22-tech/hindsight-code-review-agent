"""Orchestrates Recall -> LLM review. Keeps a light in-process review store
for feedback attribution (prototype-friendly; Hindsight remains the durable memory)."""
import uuid

from prompts.review_prompt import build_project_recall_query, build_recall_query
from schemas import MemoryUsed, ReviewIssue
from services import project_service
from services.hindsight_service import hindsight_service
from services.llm_service import generate_review

# review_id -> list of issue dicts (for feedback retain text)
review_store: dict[str, dict] = {}


async def run_review(code: str, language: str, context: str | None):
    project = project_service.get_active()

    project_query = build_project_recall_query(code, language, context, project)
    team_query = build_recall_query(code, language, context)
    proj_raw, team_raw, available, hs_msg = await hindsight_service.recall_split(project_query, team_query)

    project_mems = [MemoryUsed(**m) for m in proj_raw if m.get("text")]
    team_mems = [MemoryUsed(**m) for m in team_raw if m.get("text")]
    memories = project_mems + team_mems

    try:
        data, _provider = generate_review(code, language, context, memories,
                                          project, project_mems, team_mems)
    except RuntimeError as e:
        raise e

    review_id = f"rev-{uuid.uuid4().hex[:8]}"
    issues: list[ReviewIssue] = []
    for i, raw in enumerate(data.get("issues", []) or []):
        try:
            if "id" not in raw or not raw["id"]:
                raw["id"] = f"iss-{review_id}-{i}"
            issues.append(ReviewIssue(**raw))
        except Exception:
            continue  # skip malformed issues rather than failing whole review

    summary = str(data.get("summary", "Review complete."))
    review_store[review_id] = {
        "code": code[:2000],
        "language": language,
        "issues": [iss.model_dump() for iss in issues],
    }

    if not available:
        hs_msg_out = (
            f"Hindsight unavailable: {hs_msg}. Memory-based review is temporarily "
            "unavailable. This review was generated without persistent project context."
        )
    elif not memories:
        hs_msg_out = ("No relevant project memory found. No relevant team memory found. "
                      "This review was generated without prior team-specific knowledge.")
    else:
        hs_msg_out = hs_msg

    return {
        "review_id": review_id,
        "summary": summary,
        "issues": issues,
        "memories_used": memories,
        "project_memories_used": project_mems,
        "team_memories_used": team_mems,
        "active_project": project,
        "hindsight_available": available,
        "hindsight_message": hs_msg_out,
        "recall_query": team_query,
        "project_recall_query": project_query,
    }
