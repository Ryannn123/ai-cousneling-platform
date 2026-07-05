from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal
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
            "merge": {"projectionIntent": self.projection_intent},
            "officialTruthBoundary": {"isOfficialTruth": False},
        }


@dataclass(slots=True, frozen=True)
class DurableMemoryEvent:
    event_id: str
    draft: MemoryEventDraft
    source: JsonObject
    created_at: str

    def to_json_dict(self) -> JsonObject:
        draft = self.draft.to_json_dict()
        return {
            "eventId": self.event_id,
            "studentId": draft["studentId"],
            "conversationId": self.draft.source.conversation_id,
            "turnId": self.draft.source.turn_id,
            "messageId": self.draft.source.message_id,
            "category": draft["category"],
            "operation": draft["operation"],
            "payload": draft["payload"],
            "confidence": draft["confidence"],
            "evidence": draft["evidence"],
            "source": self.source,
            "merge": draft["merge"],
            "officialTruthBoundary": {"isOfficialTruth": False},
            "createdAt": self.created_at,
        }


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
        "validatorVersion": "memory-event-validator.phase5.v1",
    }
    return DurableMemoryEvent(str(uuid4()), draft, source, datetime.now(UTC).isoformat())
