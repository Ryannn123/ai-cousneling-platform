from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
from .contracts import JsonObject
from .memory_validation import DurableMemoryEvent
from .settings import MEMORY_EVENTS_PATH
from .storage import append_ndjson, read_ndjson


@dataclass
class MemoryAppendResult:
    status: Literal['already_exists', 'appended']
    eventId: str
    reason: list[str]


class MemoryEventStore:
    def __init__(self, memory_events_path=MEMORY_EVENTS_PATH) -> None:
        self.memory_events_path = memory_events_path

    def append_validated_event(self, event: DurableMemoryEvent, idempotency_key: str) -> MemoryAppendResult:
        duplicate = next((record for record in self.read_records() if record.get("idempotencyKey") == idempotency_key), None)
        if duplicate:
            return MemoryAppendResult(status='already_exists', eventId=duplicate["event"]["eventId"], reason=["duplicate_idempotency_key"])
        
        event_json = event.to_json_dict()
        append_ndjson(self.memory_events_path, {"idempotencyKey": idempotency_key, "event": event_json})
        return MemoryAppendResult(status='appended', eventId=event.event_id, reason=[])

    def get_events_for_projection(self, student_id: str | None = None, categories: list[str] | None = None) -> list[JsonObject]:
        category_set = set(categories or [])
        events = [
            event for event in self.read_events()
            if (not student_id or event.get("studentId") == student_id)
            and (not category_set or event.get("category") in category_set)
        ]
        return sorted(events, key=lambda event: (str(event.get("createdAt")), str(event.get("eventId"))))

    def read_events(self) -> list[JsonObject]:
        return [record.get("event", record) for record in self.read_records()]

    def read_records(self) -> list[JsonObject]:
        return read_ndjson(self.memory_events_path)
