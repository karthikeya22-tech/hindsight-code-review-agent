"""CodeMind configuration — all secrets come from environment variables."""
import logging
import os
from dotenv import find_dotenv, load_dotenv

# find_dotenv() searches upward from the working directory, so a single
# repo-root .env works whether uvicorn starts in backend/ or the repo root.
load_dotenv(find_dotenv())

log = logging.getLogger("codemind.config")

# Hindsight Cloud (managed service — no local server required).
HINDSIGHT_CLOUD_URL = "https://api.hindsight.vectorize.io"


def _clean_key(value: str) -> str:
    """API keys never legitimately contain whitespace; a stray pasted space
    makes providers reject the key (e.g. OpenRouter 401 'User not found').
    Strip all whitespace defensively instead of failing opaquely."""
    return "".join(value.split())


class Settings:
    # Hindsight (mandatory long-term memory). HINDSIGHT_API_URL is accepted
    # as an alias for HINDSIGHT_BASE_URL; explicit BASE_URL wins.
    HINDSIGHT_BASE_URL: str = os.getenv(
        "HINDSIGHT_BASE_URL", os.getenv("HINDSIGHT_API_URL", HINDSIGHT_CLOUD_URL))
    HINDSIGHT_API_KEY: str = _clean_key(os.getenv("HINDSIGHT_API_KEY", ""))
    HINDSIGHT_BANK_ID: str = os.getenv("HINDSIGHT_BANK_ID", "codemind-team")

    # LLM (OpenRouter — model fully env-driven; no hard-coded model anywhere)
    LLM_API_KEY: str = _clean_key(os.getenv("LLM_API_KEY", ""))
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "cohere/north-mini-code:free")

    # App
    MAX_CODE_CHARS: int = int(os.getenv("MAX_CODE_CHARS", "12000"))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
