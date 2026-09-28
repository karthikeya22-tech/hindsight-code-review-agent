"""LLM abstraction: OpenAI-compatible provider with a deterministic offline fallback.

The fallback is a transparent heuristic reviewer (not a fake LLM claim): it applies
generic checks plus memory-aware checks so the Recall -> Review -> Retain loop is
demonstrable even without an LLM API key. When LLM_API_KEY is set, the real
provider is used with structured JSON output.
"""
import json
import logging
import re
import uuid

from config import settings
from prompts.review_prompt import build_review_prompt
from schemas import MemoryUsed, ProjectContext

log = logging.getLogger("codemind.llm")


def llm_configured() -> bool:
    key = (settings.LLM_API_KEY or "").strip()
    return bool(key) and not key.startswith("paste-your-")


def _project_known_rules(project: ProjectContext | None,
                         project_memories: list[MemoryUsed]) -> list[str]:
    """Collect actual project rule texts (snapshot lines + recalled memories).

    Nothing here is hard-coded: every string comes from the stored project
    context or from Hindsight recall results.
    """
    rules: list[str] = []
    if project is not None:
        rules.append(f"Architecture: {project.architecture}")
        rules.extend(f"Guideline: {g}" for g in project.team_guidelines)
        rules.append(f"Stack: {', '.join(project.technology_stack)}")
    rules.extend(m.text for m in project_memories)
    return rules


def _fallback_review(code: str, language: str, memories: list[MemoryUsed],
                     project: ProjectContext | None = None,
                     project_memories: list[MemoryUsed] | None = None,
                     team_memories: list[MemoryUsed] | None = None) -> dict:
    """Deterministic reviewer: generic findings + memory-grounded team_convention."""
    proj_mems = project_memories if project_memories is not None else []
    team_mems = team_memories if team_memories is not None else list(memories)
    issues: list[dict] = []
    mem_texts = [m.text for m in team_mems]
    joined = " ".join(mem_texts).lower()

    def mem_ref_for(keywords: list[str]) -> str | None:
        for t in mem_texts:
            tl = t.lower()
            if any(k in tl for k in keywords):
                return t[:160]
        return None

    def project_ref_for(keywords: list[str]) -> str | None:
        for t in [m.text for m in proj_mems]:
            if any(k in t.lower() for k in keywords):
                return t[:200]
        if project is not None:
            hay = " ".join([project.architecture, *project.team_guidelines]).lower()
            if any(k in hay for k in keywords):
                for line in [project.architecture, *project.team_guidelines]:
                    if any(k in line.lower() for k in keywords):
                        return f"{project.project_name}: {line}"[:200]
        return None

    # --- generic heuristic: deeply nested conditionals ---
    nested = len(re.findall(r"^\s*if\s+", code, re.M)) >= 3 or code.count(":\n") >= 3 and "    if " in code
    # crude nesting depth estimate
    max_indent = 0
    for line in code.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("if ") and stripped.endswith(":"):
            max_indent = max(max_indent, (len(line) - len(stripped)) // 4)
    if max_indent >= 2 or code.count("\n        ") >= 2 and "if " in code:
        nested = True

    if nested:
        ref = mem_ref_for(["early return", "nested", "guard clause", "flat"])
        if ref:
            issues.append({
                "id": f"iss-{uuid.uuid4().hex[:6]}",
                "severity": "team_convention",
                "title": "Use early returns instead of nested conditionals",
                "description": "This code nests conditionals 3 levels deep, hurting readability.",
                "recommendation": "Refactor with guard clauses / early returns for each failing condition.",
                "reason": "This matches the team's previously retained coding preference.",
                "memory_based": True,
                "memory_reference": ref,
            })
        else:
            issues.append({
                "id": f"iss-{uuid.uuid4().hex[:6]}",
                "severity": "suggestion",
                "title": "Deeply nested conditionals",
                "description": "Multiple levels of nested `if` statements make this hard to follow.",
                "recommendation": "Consider guard clauses or early returns to flatten the logic.",
                "reason": "Flatter control flow is generally easier to read and test.",
                "memory_based": False,
                "memory_reference": None,
            })

    # --- memory-driven: validation preference ---
    if any(k in joined for k in ["validat", "sanitize", "boundary", "service boundary"]):
        if re.search(r"def\s+\w+\s*\([^)]*\):\s*\n(?!\s*(if|assert|raise|validate))", code):
            ref = mem_ref_for(["validat", "sanitize", "boundary"])
            issues.append({
                "id": f"iss-{uuid.uuid4().hex[:6]}",
                "severity": "team_convention",
                "title": "Add explicit input validation",
                "description": "No explicit validation at the function entry point.",
                "recommendation": "Validate inputs explicitly at the start of the function.",
                "reason": "This matches the team's retained validation convention.",
                "memory_based": True,
                "memory_reference": ref,
            })

    # --- memory-driven: simplicity / abstraction ---
    if any(k in joined for k in ["abstraction", "simple", "simplicity", "unnecessary"]):
        if len(code.splitlines()) < 25 and re.search(r"(class\s+\w+|def\s+\w+.*:.*\n.*def\s+)", code):
            ref = mem_ref_for(["abstraction", "simple"])
            if not any(i["severity"] == "team_convention" for i in issues):
                issues.append({
                    "id": f"iss-{uuid.uuid4().hex[:6]}",
                    "severity": "suggestion",
                    "title": "Keep it simple",
                    "description": "Small unit of code; extra abstraction may add indirection.",
                    "recommendation": "Prefer a plain function unless reuse is proven.",
                    "reason": "Team prefers simple functions over unnecessary abstractions.",
                    "memory_based": True,
                    "memory_reference": ref,
                })

    # --- generic: missing None/edge handling ---
    if re.search(r"if\s+\w+:", code) and "None" not in code and "is_valid" in code:
        issues.append({
            "id": f"iss-{uuid.uuid4().hex[:6]}",
            "severity": "important",
            "title": "Handle falsy/None edge cases explicitly",
            "description": "Truthiness checks silently swallow None, empty, and invalid states differently.",
            "recommendation": "Check explicitly (e.g. `is None`, `is_valid`) and handle each case.",
            "reason": "Explicit checks prevent subtle correctness bugs.",
            "memory_based": False,
            "memory_reference": None,
        })

    # --- project-aware: fat API route doing DB/business work ---
    rules_joined = " ".join(_project_known_rules(project, proj_mems)).lower()
    wants_thin_routes = any(
        k in rules_joined
        for k in ["thin", "service layer", "service-layer", "business logic"]
    )
    looks_like_route = bool(re.search(r"@\w+\.(get|post|put|patch|delete|route)\b", code))
    does_db_work = bool(re.search(r"\b(db\.(add|commit|query|execute|delete)|session\.(add|commit)|INSERT|SELECT)\b", code, re.I))
    if wants_thin_routes and looks_like_route and does_db_work:
        ref = project_ref_for(["thin", "service layer", "service-layer", "business logic"])
        issues.append({
            "id": f"iss-{uuid.uuid4().hex[:6]}",
            "severity": "team_convention",
            "title": "API route performs database/business operations directly",
            "description": "This API route talks to the database instead of delegating to the service layer.",
            "recommendation": "Move the database/business logic into the service layer and keep the route focused on request handling.",
            "reason": "This conflicts with the project's architecture as stored in project context.",
            "memory_based": True,
            "memory_reference": ref,
        })

    if not issues:
        issues.append({
            "id": f"iss-{uuid.uuid4().hex[:6]}",
            "severity": "suggestion",
            "title": "No major issues found",
            "description": "The code looks reasonable; consider adding tests and docstrings.",
            "recommendation": "Add a docstring and unit tests covering edge cases.",
            "reason": "General maintainability best practice.",
            "memory_based": False,
            "memory_reference": None,
        })

    if not memories:
        summary = "Generic review generated without prior team-specific knowledge."
    else:
        summary = f"Found {len(issues)} finding(s), {sum(1 for i in issues if i['memory_based'])} grounded in team memory."
    if project is not None and proj_mems:
        summary += f" Project context '{project.project_name}' applied ({len(proj_mems)} project memories)."
    elif project is not None:
        summary += f" Project context '{project.project_name}' applied."
    return {"summary": summary, "issues": issues}


def generate_review(code: str, language: str, context: str | None, memories: list[MemoryUsed],
                    project: ProjectContext | None = None,
                    project_memories: list[MemoryUsed] | None = None,
                    team_memories: list[MemoryUsed] | None = None) -> tuple[dict, str]:
    """Returns (parsed_review_dict, provider_name). Raises on provider failure."""
    settings.reload()
    if not llm_configured():
        return _fallback_review(code, language, memories, project, project_memories, team_memories), "heuristic-fallback"

    from openai import OpenAI

    base_url = (settings.LLM_BASE_URL or "").strip() or None
    api_key = (settings.LLM_API_KEY or "").strip()
    model = (settings.LLM_MODEL or "").strip()

    client = OpenAI(api_key=api_key, base_url=base_url)
    prompt = build_review_prompt(code, language, context, memories, project, project_memories, team_memories)

    messages = [
        {"role": "system", "content": "You are CodeMind, a code review agent. Return only valid JSON."},
        {"role": "user", "content": prompt},
    ]

    try:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000,
            )
        except Exception as e_rf:
            err_msg = str(e_rf).lower()
            if "response_format" in err_msg or "json_object" in err_msg or "unsupported" in err_msg:
                log.warning("Provider rejected response_format, retrying without response_format: %s", e_rf)
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=2000,
                )
            else:
                raise e_rf

        raw = (resp.choices[0].message.content or "{}").strip()
        # Clean any markdown code blocks if the model wrapped the JSON output
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw)
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()
        data = json.loads(cleaned)

        # Never trust memory_based=true when there were no memories.
        if not memories and isinstance(data.get("issues"), list):
            for iss in data["issues"]:
                iss["memory_based"] = False
                iss["memory_reference"] = None
        return data, model
    except Exception as e:
        log.exception("LLM review failed against %s (model: %s)", base_url, model)
        raise RuntimeError(f"LLM review failed: {e}") from e

