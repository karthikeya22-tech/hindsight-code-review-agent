"""CodeMind configuration — all secrets come from environment variables."""
import logging
import os
from dotenv import find_dotenv, load_dotenv

# find_dotenv() searches upward from the working directory, so a single
# repo-root .env works whether uvicorn starts in backend/ or the repo root.
load_dotenv(find_dotenv(), override=True)

log = logging.getLogger("codemind.config")

# Hindsight Cloud (managed service — no local server required).
HINDSIGHT_CLOUD_URL = "https://api.hindsight.vectorize.io"


def _clean_key(value: str) -> str:
    """API keys never legitimately contain whitespace; a stray pasted space
    makes providers reject the key (e.g. OpenRouter 401 'User not found').
    Strip all whitespace defensively instead of failing opaquely."""
    return "".join(value.split())


class Settings:
    def reload(self) -> None:
        """Reload environment variables from .env with override=True."""
        dotenv_path = find_dotenv()
        if dotenv_path:
            load_dotenv(dotenv_path, override=True)

    @property
    def HINDSIGHT_BASE_URL(self) -> str:
        return os.getenv("HINDSIGHT_BASE_URL", os.getenv("HINDSIGHT_API_URL", HINDSIGHT_CLOUD_URL))

    @property
    def HINDSIGHT_API_KEY(self) -> str:
        return _clean_key(os.getenv("HINDSIGHT_API_KEY", ""))

    @property
    def HINDSIGHT_BANK_ID(self) -> str:
        return os.getenv("HINDSIGHT_BANK_ID", "codemind-team")

    # LLM (OpenAI-compatible: Hugging Face router, Groq, OpenRouter, etc.)
    @property
    def LLM_API_KEY(self) -> str:
        return _clean_key(os.getenv("LLM_API_KEY", ""))

    @property
    def LLM_BASE_URL(self) -> str:
        return os.getenv("LLM_BASE_URL", "https://router.huggingface.co/v1")

    @property
    def LLM_MODEL(self) -> str:
        return os.getenv("LLM_MODEL", "openai/gpt-oss-20b:groq")

    # App
    @property
    def MAX_CODE_CHARS(self) -> int:
        return int(os.getenv("MAX_CODE_CHARS", "12000"))

    @property
    def FRONTEND_ORIGIN(self) -> str:
        return os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
