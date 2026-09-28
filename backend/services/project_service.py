"""Project Context state and knowledge-text builder.

The persistent project knowledge lives in Hindsight (via hindsight_service).
The active project snapshot is held in-process (prototype-friendly) and is
always the validated representation that was retained in Hindsight — never
hard-coded values.
"""
from schemas import ProjectContext

# The single active project for this prototype (no multi-tenant system).
active_project: ProjectContext | None = None


def build_project_knowledge_text(p: ProjectContext) -> str:
    stack = ", ".join(p.technology_stack)
    guidelines = "\n".join(f"- {g}" for g in p.team_guidelines)
    return (
        f"Project: {p.project_name}\n"
        f"Purpose: {p.description}\n"
        f"Technology stack: {stack}.\n"
        f"Architecture: {p.architecture}\n"
        f"Team guidelines:\n{guidelines}"
    )


def set_active(p: ProjectContext) -> None:
    global active_project
    active_project = p


def get_active() -> ProjectContext | None:
    return active_project
