from fastapi import APIRouter, HTTPException
from config import settings
from schemas import ReviewRequest, ReviewResponse
from services import review_service

router = APIRouter()


@router.post("/review", response_model=ReviewResponse)
async def create_review(req: ReviewRequest):
    if len(req.code) > settings.MAX_CODE_CHARS:
        raise HTTPException(status_code=413, detail=f"Code too large (max {settings.MAX_CODE_CHARS} chars).")
    language = (req.language or "python").strip().lower() or "python"
    try:
        result = await review_service.run_review(req.code, language, req.context)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Review failed: {e}")
    return ReviewResponse(
        review_id=result["review_id"],
        summary=result["summary"],
        issues=result["issues"],
        memories_used=result["memories_used"],
        project_memories_used=result["project_memories_used"],
        team_memories_used=result["team_memories_used"],
        active_project=result["active_project"],
        hindsight_available=result["hindsight_available"],
        hindsight_message=result["hindsight_message"],
    )
