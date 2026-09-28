from fastapi import APIRouter
from schemas import MemoryListResponse, MemoryUsed, TeachRequest, TeachResponse
from services.hindsight_service import hindsight_service

router = APIRouter()


@router.post("/memory/teach", response_model=TeachResponse)
async def teach(req: TeachRequest):
    content = req.content.strip()
    ok, msg = await hindsight_service.retain(content, context="team coding convention")
    if ok:
        return TeachResponse(success=True, message="CodeMind learned this preference.", hindsight_available=True)
    # Honest failure reporting: distinguish "unavailable" from other errors
    available, _ = await hindsight_service.check_available()
    if not available:
        return TeachResponse(
            success=False,
            message=f"Hindsight unavailable — preference not saved. ({msg})",
            hindsight_available=False,
        )
    return TeachResponse(success=False, message=f"Review completed, but learning could not be saved. ({msg})",
                         hindsight_available=True)


@router.get("/memory", response_model=MemoryListResponse)
async def get_memory():
    memories_raw, available, msg = await hindsight_service.list_recent(limit=20)
    if not available:
        # Fall back to a broad recall so the panel still reflects real Hindsight data
        memories_raw, available, msg = await hindsight_service.recall(
            "What coding conventions and review decisions has this development team established?"
        )
    memories = [MemoryUsed(**m) for m in memories_raw if m.get("text")]
    return MemoryListResponse(memories=memories, hindsight_available=available, message=msg)
