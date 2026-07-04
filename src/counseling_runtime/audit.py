from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from .settings import AUDIT_PATH
from .storage import append_ndjson, read_ndjson


class AuditEventStore:
    def __init__(self, audit_path= AUDIT_PATH) -> None:
        self.audit_path = audit_path

    def append_audit_event(self, event: dict[str, Any], idempotency_key: str | None = None) -> dict[str, Any]:
        records = read_ndjson(self.audit_path)
        if idempotency_key:
            duplicate = next((record for record in records if record.get("idempotencyKey") == idempotency_key), None)
            if duplicate:
                return {"status": "already_exists", "auditEventId": duplicate.get("auditEventId")}
        audit_event = {
            "auditEventId": event.get("auditEventId") or str(uuid4()),
            "createdAt": event.get("createdAt") or datetime.now(UTC).isoformat(),
            **event,
        }
        if idempotency_key:
            audit_event["idempotencyKey"] = idempotency_key
        append_ndjson(self.audit_path, audit_event)
        return {"status": "appended", "auditEventId": audit_event["auditEventId"]}


def write_audit_event(payload: dict[str, Any]) -> dict[str, Any]:
    validation_result = payload["validationResult"]
    boundary_result = payload["boundaryResult"]
    commit_result = payload["commitResult"]
    semantic_audit = payload.get("semanticDeltaAudit") or {}
    accepted_delta = semantic_audit.get("acceptedSemanticDelta") or {}
    meta = accepted_delta.get("platformMetadata") or {}
    event = {
        "eventType": "turn_audit",
        "conversationId": payload["conversationId"],
        "turnId": meta.get("turnId"),
        "timestamp": datetime.now(UTC).isoformat(),
        "studentMessage": payload["studentMessage"],
        "semanticDeltaAudit": semantic_audit,
        "memoryStateAudit": payload.get("memoryStateAudit"),
        "boundaryResult": boundary_result,
        "routeAudit": payload.get("routeAudit"),
        "operatingContextBefore": payload.get("operatingContextBefore"),
        "operatingContextAfter": payload.get("operatingContextAfter"),
        "skillSelection": payload.get("skillSelection"),
        "aiExecutionResult": payload.get("aiExecutionResult"),
        "validationResult": validation_result,
        "commitResult": commit_result,
        "fallbackUsed": validation_result.get("status") == "safe_fallback",
        "evaluationLabels": {
            "zone": boundary_result.get("finalZone"),
            "boundaryOverride": validation_result.get("status") == "handoff_override",
            "handoffPrepared": commit_result.get("handoffPrepared"),
            "blockedOutputCount": commit_result.get("blockedOutputCount"),
            "fallbackUsed": validation_result.get("status") == "safe_fallback",
        },
    }
    append_ndjson(AUDIT_PATH, event)
    return event
