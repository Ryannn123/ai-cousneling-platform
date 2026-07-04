from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path.cwd()
PUBLIC_DIR = ROOT / "public"
SKILLS_DIR = ROOT / "skills"
DATA_DIR = ROOT / "data" / "runtime"
CONVERSATION_DIR = DATA_DIR / "conversations"
AUDIT_PATH = DATA_DIR / "audit.ndjson"
MEMORY_EVENTS_PATH = DATA_DIR / "memory-events.ndjson"
CATALOG_PATH = ROOT / "data" / "knowledge" / "catalog.json"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 3000
    gemini_api_key: str | None = None
    gemini_model: str | None = None
    ai_model: str | None = None

    @property
    def model_name(self) -> str:
        return self.gemini_model or self.ai_model or "gemini-3.1-flash-lite"

    @property
    def pydantic_ai_model(self) -> str:
        return f"google:{self.model_name.removeprefix('models/')}"

    def apply_gemini_env(self) -> None:
        if self.gemini_api_key and not os.environ.get("GOOGLE_API_KEY"):
            os.environ["GOOGLE_API_KEY"] = self.gemini_api_key


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.apply_gemini_env()
    return settings
