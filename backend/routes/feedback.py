from fastapi import APIRouter
from schemas import FeedbackRequest, FeedbackResponse
from services import review_service
from services.hindsight_service import hindsight_service

router = APIRouter()


def _feedback_memory_text(req: FeedbackRequest) -> str:
    stored = review_service.review_store.get(req.review_id, {})
    issue = next((i for i in stored.get("issues", []) if i.get("id") == req.issue_id), {})
    title = req.issue_title or issue.get("title") or req.issue_id
    rec = req.issue_recommendation or issue.get("recommendation") or ""
    lang = req.language or stored.get("language") or "code"
    comment = f" Developer note: {req.comment.strip()}" if req.comment and req.comment.strip() else ""
    verb = "accepted" if req.decision == "accepted" else "rejected"
    base = f"The team {verb} the code review recommendation '{title}' for {lang} code."
    if rec:
        base += f" Recommendation was: {rec[:300]}."
    return base + comment


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackRequest):
    text = _feedback_memory_text(req)
    ctx = "accepted review decision" if req.decision == "accepted" else "rejected review decision"
    ok, msg = await hindsight_service.retain(text, context=ctx)
    if ok:
        return FeedbackResponse(success=True, message="Feedback recorded. CodeMind learned from this review.",
                                hindsight_available=True)
    available, _ = await hindsight_service.check_available()
    if not available:
        return FeedbackResponse(success=False,
                                message=f"Hindsight unavailable — feedback not retained. ({msg})",
                                hindsight_available=False)
    return FeedbackResponse(success=False,
                            message=f"Review completed, but learning could not be saved. ({msg})",
                            hindsight_available=True)
