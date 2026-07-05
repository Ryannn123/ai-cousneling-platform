from __future__ import annotations

from .contracts import JsonObject
from .settings import MEMORY_EVENTS_PATH
from .storage import append_ndjson, read_ndjson


class MemoryEventStore:
    def __init__(self, memory_events_path=MEMORY_EVENTS_PATH) -> None:
        self.memory_events_path = memory_events_path

    def append_validated_event(self, event: JsonObject, idempotency_key: str) -> JsonObject:
        if not event.get("validation", {}).get("validated"):
            return {"status": "rejected_not_validated", "reasons": ["event_not_validated"]}
        duplicate = next((record for record in self.read_records() if record.get("idempotencyKey") == idempotency_key), None)
        if duplicate:
            return {"status": "already_exists", "existingEventId": duplicate["event"]["eventId"], "reasons": ["duplicate_idempotency_key"]}
        append_ndjson(self.memory_events_path, {"idempotencyKey": idempotency_key, "event": event})
        return {"status": "appended", "eventId": event["eventId"], "reasons": []}

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
