"""CodeMind FastAPI backend."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import feedback, memory, project, review

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="CodeMind", version="0.1.0",
              description="Hindsight-powered AI code review agent (prototype).")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(project.router, prefix="/api")


@app.on_event("shutdown")
async def shutdown_hindsight():
    from services.hindsight_service import hindsight_service
    await hindsight_service.aclose()


@app.get("/api/health")
async def health():
    from services import project_service
    from services.hindsight_service import hindsight_service
    available, msg = await hindsight_service.check_available()
    from services.llm_service import llm_configured
    active = project_service.get_active()
    return {
        "status": "ok",
        "service": "codemind",
        "hindsight_available": available,
        "hindsight_message": msg,
        "hindsight_bank": settings.HINDSIGHT_BANK_ID,
        "llm_configured": llm_configured(),
        "active_project": active.project_name if active else None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
