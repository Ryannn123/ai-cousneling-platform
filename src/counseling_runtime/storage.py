from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from .settings import AUDIT_PATH, CONVERSATION_DIR, MEMORY_EVENTS_PATH


def ensure_runtime_dirs() -> None:
    CONVERSATION_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    MEMORY_EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)


def conversation_path(conversation_id: str) -> Path:
    return CONVERSATION_DIR / f"{conversation_id}.json"


def read_json(path: Path, fallback: Any = None) -> Any:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(jsonable(data), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def append_ndjson(path: Path, event: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(jsonable(event), ensure_ascii=False) + "\n")


def read_ndjson(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    return [json.loads(line) for line in raw.splitlines() if line.strip()]


def read_audit_events(conversation_id: str, limit: int = 50) -> list[dict[str, Any]]:
    return [event for event in read_ndjson(AUDIT_PATH) if event.get("conversationId") == conversation_id][-limit:]


def jsonable(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump(exclude_none=True)
    if isinstance(value, list):
        return [jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: jsonable(item) for key, item in value.items()}
    return value
