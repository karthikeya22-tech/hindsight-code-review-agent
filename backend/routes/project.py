"""Project onboarding routes. Persistent knowledge goes to Hindsight;
the active project snapshot is held in-process (prototype-friendly)."""
from fastapi import APIRouter

from schemas import (
    ActiveProjectResponse,
    ProjectContext,
    ProjectCreateRequest,
    ProjectResponse,
)
from services import project_service
from services.hindsight_service import hindsight_service, project_slug

router = APIRouter()


def _clean_list(values: list[str]) -> list[str]:
    """Tolerate a single comma-separated string as well as real arrays."""
    out: list[str] = []
    for v in values:
        for part in str(v).split(","):
            part = part.strip().strip("-•* ").strip()
            if part:
                out.append(part)
    return out


@router.post("/project", response_model=ProjectResponse)
async def create_or_update_project(req: ProjectCreateRequest):
    project = ProjectContext(
        project_name=req.project_name.strip(),
        description=req.description.strip(),
        technology_stack=_clean_list(req.technology_stack),
        architecture=req.architecture.strip(),
        team_guidelines=_clean_list(req.team_guidelines),
    )
    if not project.technology_stack or not project.team_guidelines:
        return ProjectResponse(
            success=False,
            message="Technology stack and team guidelines must not be empty.",
            hindsight_available=True,
            project=None,
        )
    knowledge = project_service.build_project_knowledge_text(project)
    ok, msg = await hindsight_service.retain_project(knowledge, project_slug(project.project_name))
    # The active snapshot is always set (create/update succeeds locally);
    # Hindsight persistence is reported honestly.
    project_service.set_active(project)
    if ok:
        return ProjectResponse(
            success=True,
            message=f"Project '{project.project_name}' saved. Project memory retained in Hindsight.",
            hindsight_available=True,
            project=project,
        )
    available, _ = await hindsight_service.check_available()
    if not available:
        return ProjectResponse(
            success=False,
            message=f"Project created, but project memory could not be saved to Hindsight (unavailable). ({msg})",
            hindsight_available=False,
            project=project,
        )
    return ProjectResponse(
        success=False,
        message=f"Project created, but project memory could not be saved to Hindsight. ({msg})",
        hindsight_available=True,
        project=project,
    )


@router.get("/project", response_model=ActiveProjectResponse)
async def get_active_project():
    project = project_service.get_active()
    if project is None:
        return ActiveProjectResponse(
            project=None,
            hindsight_available=True,
            message="No active project. Create one via Project Setup.",
        )
    available, _ = await hindsight_service.check_available()
    return ActiveProjectResponse(
        project=project,
        hindsight_available=available,
        message="Project Memory: Connected" if available else "Project Memory: Hindsight unavailable",
    )
