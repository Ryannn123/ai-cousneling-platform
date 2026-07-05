from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal, cast
from uuid import uuid4

from .contracts import JsonObject, SkillSelection
from .safety import contains_official_truth
from .schemas import Confidence
from .semantic_delta import MemoryCategory


AIOutputMemoryCategory = Literal["recommendation_interaction", "handoff_readiness", "route_outcome"]
MemoryEventCategory = MemoryCategory | AIOutputMemoryCategory
MemoryOperation = Literal["add_new"]
MemoryValidationStatus = Literal["valid", "reject"]
ROUTE_OUTCOMES = {"confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"}
MEMORY_EVENT_CATEGORIES = {
    "academic",
    "course_direction",
    "university_direction",
    "pathway_direction",
    "counseling_preference",
    "rejected_option",
    "constraint",
    "quality_context",
    "concern",
    "recommendation_interaction",
    "handoff_readiness",
    "route_outcome",
}
CONFIDENCE_VALUES = {"low", "medium", "high"}


@dataclass(slots=True, frozen=True)
class MemoryEventSource:
    accepted_semantic_delta_id: str
    accepted_delta_id: str
    conversation_id: str | None
    turn_id: str | None
    message_id: str | None

    def has_trace(self) -> bool:
        return bool(self.conversation_id and self.turn_id and self.message_id)

    def to_json_dict(self) -> JsonObject:
        return {
            "acceptedSemanticDeltaId": self.accepted_semantic_delta_id,
            "acceptedDeltaId": self.accepted_delta_id,
            "conversationId": self.conversation_id,
            "turnId": self.turn_id,
            "messageId": self.message_id,
        }


@dataclass(slots=True, frozen=True)
class MemoryEventDraft:
    student_id: str
    category: MemoryEventCategory
    operation: MemoryOperation
    payload: JsonObject
    confidence: Confidence
    evidence: list[dict[str, str]]
    source: MemoryEventSource
    projection_intent: str

    def to_json_dict(self) -> JsonObject:
        return {
            "studentId": self.student_id,
            "category": self.category,
            "operation": self.operation,
            "payload": self.payload,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "source": self.source.to_json_dict(),
        }


@dataclass(slots=True, frozen=True)
class DurableMemoryEvent:
    event_id: str
    draft: MemoryEventDraft
    source: JsonObject
    created_at: str

    def to_json_dict(self) -> JsonObject:
        return {
            "eventId": self.event_id,
            "studentId": self.draft.student_id,
            "conversationId": self.draft.source.conversation_id,
            "turnId": self.draft.source.turn_id,
            "messageId": self.draft.source.message_id,
            "category": self.draft.category,
            "operation": self.draft.operation,
            "payload": self.draft.payload,
            "confidence": self.draft.confidence,
            "evidence": self.draft.evidence,
            "source": self.source,
            "merge": {"projectionIntent": self.draft.projection_intent},
            "officialTruthBoundary": {"isOfficialTruth": False},
            "validation": {"validated": True, "validatorVersion": "memory-event-validator.phase5.v1"},
            "createdAt": self.created_at,
        }

    @classmethod
    def from_json_dict(cls, event: JsonObject) -> DurableMemoryEvent:
        source = event.get("source", {})
        merge = event.get("merge", {})
        draft = MemoryEventDraft(
            student_id=str(event.get("studentId") or ""),
            category=memory_event_category(event.get("category")),
            operation=memory_operation(event.get("operation")),
            payload=event.get("payload", {}) if isinstance(event.get("payload"), dict) else {},
            confidence=confidence(event.get("confidence")),
            evidence=evidence_list(event.get("evidence")),
            source=MemoryEventSource(
                accepted_semantic_delta_id=str(source.get("acceptedSemanticDeltaId") or ""),
                accepted_delta_id=str(source.get("acceptedDeltaId") or ""),
                conversation_id=optional_str(event.get("conversationId")),
                turn_id=optional_str(event.get("turnId")),
                message_id=optional_str(event.get("messageId")),
            ),
            projection_intent=str(merge.get("projectionIntent") or "may_update_current_truth"),
        )
        return cls(
            event_id=str(event.get("eventId") or ""),
            draft=draft,
            source=source if isinstance(source, dict) else {},
            created_at=str(event.get("createdAt") or ""),
        )


@dataclass(slots=True, frozen=True)
class MemoryValidationResult:
    status: MemoryValidationStatus
    durable_event: DurableMemoryEvent | None
    errors: list[str]
    invariant_checks: JsonObject

    def accepted(self) -> bool:
        return self.status == "valid"

    def to_json_dict(self) -> JsonObject:
        return {
            "status": self.status,
            "durableEvent": self.durable_event.to_json_dict() if self.durable_event else None,
            "errors": self.errors,
            "invariantChecks": self.invariant_checks,
        }


class MemoryEventValidator:
    def validate(self, draft: MemoryEventDraft, selected_skill_context: SkillSelection | JsonObject | None = None) -> MemoryValidationResult:
        checks = invariant_checks(draft)
        errors = validation_errors(draft, checks)
        status: MemoryValidationStatus = "reject" if errors else "valid"
        durable_event = to_durable_event(draft, selected_skill_context) if not errors else None
        return MemoryValidationResult(status, durable_event, errors, checks)


def invariant_checks(draft: MemoryEventDraft) -> JsonObject:
    return {
        "categoryPayloadCompatible": category_payload_compatible(draft),
        "operationSupported": draft.operation == "add_new",
        "confirmedPreferenceSafe": confirmed_preference_safe(draft),
        "officialTruthSafe": not contains_official_truth(draft.to_json_dict()),
        "projectionIntentSafe": bool(draft.projection_intent),
    }


def validation_errors(draft: MemoryEventDraft, checks: JsonObject) -> list[str]:
    errors: list[str] = []
    if not draft.student_id or not draft.source.has_trace():
        errors.append("source_trace_missing")
    if not checks["categoryPayloadCompatible"]:
        errors.append("route_outcome_invalid" if draft.category == "route_outcome" else "payload_invalid")
    if not checks["operationSupported"]:
        errors.append("operation_not_supported")
    if not checks["officialTruthSafe"]:
        errors.append("official_truth_not_memory")
    if not checks["projectionIntentSafe"]:
        errors.append("projection_intent_missing")
    if not checks["confirmedPreferenceSafe"]:
        errors.append("confirmed_preference_requires_explicit_status")
    return errors


def category_payload_compatible(draft: MemoryEventDraft) -> bool:
    if not isinstance(draft.payload, dict):
        return False
    if draft.category == "route_outcome":
        return draft.payload.get("outcome") in ROUTE_OUTCOMES
    return True


def confirmed_preference_safe(draft: MemoryEventDraft) -> bool:
    return draft.category != "counseling_preference" or draft.payload.get("status") == "confirmed_counseling_preference"


def to_durable_event(draft: MemoryEventDraft, selected_skill_context: SkillSelection | JsonObject | None) -> DurableMemoryEvent:
    selected = (selected_skill_context or {}).get("selectedRuntimeSkill") or {}
    source = {
        "acceptedSemanticDeltaId": draft.source.accepted_semantic_delta_id,
        "acceptedDeltaId": draft.source.accepted_delta_id,
        "skillName": selected.get("name"),
        "skillVersion": selected.get("version"),
        "skillHash": selected.get("contentHash"),
    }
    return DurableMemoryEvent(str(uuid4()), draft, source, datetime.now(UTC).isoformat())


def memory_event_category(value: object) -> MemoryEventCategory:
    if value not in MEMORY_EVENT_CATEGORIES:
        raise ValueError(f"invalid memory event category: {value}")
    return cast(MemoryEventCategory, value)


def memory_operation(value: object) -> MemoryOperation:
    if value != "add_new":
        raise ValueError(f"invalid memory operation: {value}")
    return "add_new"


def confidence(value: object) -> Confidence:
    if value not in CONFIDENCE_VALUES:
        raise ValueError(f"invalid confidence: {value}")
    return cast(Confidence, value)


def evidence_list(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    evidence: list[dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            quote = item.get("quote")
            if isinstance(quote, str):
                source = item.get("source")
                evidence.append({"quote": quote, **({"source": source} if isinstance(source, str) else {})})
    return evidence


def optional_str(value: object) -> str | None:
    return value if isinstance(value, str) else None
