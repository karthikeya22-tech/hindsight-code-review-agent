"""Pydantic schemas for the CodeMind API."""
from typing import Literal, Optional
from pydantic import BaseModel, Field

Severity = Literal["critical", "important", "team_convention", "suggestion"]
Decision = Literal["accepted", "rejected"]


class ReviewRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=12000)
    language: str = Field(default="python")
    context: Optional[str] = Field(default=None, max_length=2000)


class ReviewIssue(BaseModel):
    id: str
    severity: Severity
    title: str
    description: str
    recommendation: str
    reason: str
    memory_based: bool = False
    memory_reference: Optional[str] = None


class MemoryUsed(BaseModel):
    id: Optional[str] = None
    text: str
    type: Optional[str] = None
    context: Optional[str] = None


# -- Project Context / Onboarding ------------------------------------------

class ProjectContext(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=120)
    description: str = Field(..., min_length=1, max_length=2000)
    technology_stack: list[str] = Field(..., min_length=1)
    architecture: str = Field(..., min_length=1, max_length=2000)
    team_guidelines: list[str] = Field(..., min_length=1)


class ProjectCreateRequest(BaseModel):
    """Accepts arrays; single comma-separated strings are also tolerated."""

    project_name: str = Field(..., min_length=1, max_length=120)
    description: str = Field(..., min_length=1, max_length=2000)
    technology_stack: list[str] = Field(..., min_length=1)
    architecture: str = Field(..., min_length=1, max_length=2000)
    team_guidelines: list[str] = Field(..., min_length=1)


class ProjectResponse(BaseModel):
    success: bool
    message: str
    hindsight_available: bool = True
    project: Optional[ProjectContext] = None


class ActiveProjectResponse(BaseModel):
    project: Optional[ProjectContext] = None
    hindsight_available: bool = True
    message: Optional[str] = None


class ReviewResponse(BaseModel):
    review_id: str
    summary: str
    issues: list[ReviewIssue]
    memories_used: list[MemoryUsed] = []
    # Split views of memories_used (project vs team/review knowledge)
    project_memories_used: list[MemoryUsed] = []
    team_memories_used: list[MemoryUsed] = []
    active_project: Optional[ProjectContext] = None
    hindsight_available: bool = True
    hindsight_message: Optional[str] = None


class TeachRequest(BaseModel):
    content: str = Field(..., min_length=3, max_length=2000)


class TeachResponse(BaseModel):
    success: bool
    message: str
    hindsight_available: bool = True


class FeedbackRequest(BaseModel):
    review_id: str = Field(..., min_length=1)
    issue_id: str = Field(..., min_length=1)
    decision: Decision
    comment: Optional[str] = Field(default="", max_length=2000)
    # Optional echoes so feedback memory is self-describing even without server history
    issue_title: Optional[str] = None
    issue_recommendation: Optional[str] = None
    language: Optional[str] = None


class FeedbackResponse(BaseModel):
    success: bool
    message: str
    hindsight_available: bool = True


class MemoryListResponse(BaseModel):
    memories: list[MemoryUsed] = []
    hindsight_available: bool = True
    message: Optional[str] = None
