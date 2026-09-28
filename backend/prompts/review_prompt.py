"""LLM review prompt builder."""
from schemas import MemoryUsed, ProjectContext


def build_recall_query(code: str, language: str, context: str | None) -> str:
    snippet = code[:800]
    ctx = f"\nReviewer context: {context[:300]}" if context else ""
    return (
        "Find team coding preferences, previous review decisions, and recurring "
        f"review patterns relevant to this {language} code review.\n"
        "Focus on: coding conventions, architectural preferences, validation patterns, "
        "readability preferences, previously accepted recommendations, previously "
        f"rejected recommendations, similar review situations.\n{ctx}\n"
        f"Code under review:\n{snippet}"
    )


def build_project_recall_query(code: str, language: str, context: str | None,
                               project: ProjectContext | None) -> str:
    snippet = code[:800]
    proj = f"Active project: {project.project_name}." if project else "No active project."
    ctx = f"\nReviewer context: {context[:300]}" if context else ""
    return (
        "Find project architecture, technology constraints, team coding guidelines, "
        f"and project conventions relevant to this {language} code review. {proj}\n"
        "Focus on: project purpose, technology stack, architecture and layering rules "
        "(e.g. thin API routes, service-layer business logic), input validation "
        f"boundaries, team guidelines.\n{ctx}\n"
        f"Code under review:\n{snippet}"
    )


def _render_project_snapshot(project: ProjectContext | None) -> str:
    if project is None:
        return "No active project context."
    stack = ", ".join(project.technology_stack)
    guidelines = "\n".join(f"- {g}" for g in project.team_guidelines)
    return (
        f"Project name: {project.project_name}\n"
        f"Description: {project.description}\n"
        f"Technology stack: {stack}\n"
        f"Architecture: {project.architecture}\n"
        f"Team guidelines:\n{guidelines}"
    )


def build_review_prompt(code: str, language: str, context: str | None, memories: list[MemoryUsed],
                        project: ProjectContext | None = None,
                        project_memories: list[MemoryUsed] | None = None,
                        team_memories: list[MemoryUsed] | None = None) -> str:
    proj_mems = project_memories if project_memories is not None else []
    team_mems = team_memories if team_memories is not None else (memories or [])

    def block(items: list[MemoryUsed], empty_msg: str) -> str:
        if not items:
            return empty_msg
        return "\n".join(f"- [{m.type or 'memory'}] {m.text}" for m in items)

    ctx = f"\nAdditional context: {context}" if context else ""
    return f"""SYSTEM:
You are CodeMind, an AI code review agent for a specific development team.

PROJECT CONTEXT (active project, as saved via project onboarding):
{_render_project_snapshot(project)}

PROJECT KNOWLEDGE recalled from long-term memory (Hindsight):
{block(proj_mems, "No relevant project knowledge found.")}

TEAM KNOWLEDGE recalled from long-term memory (Hindsight):
{block(team_mems, "No relevant team memory found.")}

CURRENT CODE:
```{language}
{code}
```
LANGUAGE:
{language}{ctx}

TASK:
Review the code using the project architecture and team preferences where relevant.

Important:
- Do not invent project rules. Only use project knowledge actually provided above.
- If a recalled project or team memory is relevant to an issue, set memory_based=true and memory_reference to a short description of that memory.
- NEVER set memory_based=true if there are no relevant memories. Use memory_based=false then.
- Use severity exactly one of: critical, important, team_convention, suggestion.
- Use team_convention when the code conflicts with a recalled project rule or team memory.
- Return ONLY valid JSON matching this schema:
{{"summary": "...", "issues": [{{"id": "...", "severity": "...", "title": "...", "description": "...", "recommendation": "...", "reason": "...", "memory_based": true/false, "memory_reference": "..." or null}}]}}"""
