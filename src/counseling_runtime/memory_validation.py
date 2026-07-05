from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from .contracts import JsonObject, SkillSelection
from .safety import contains_official_truth


MEMORY_CATEGORIES = {
    "academic",
    "course_direction",
    "university_direction",
    "pathway_direction",
    "counseling_preference",
    "rejected_option",
    "constraint",
    "quality_context",
    "concern_or_blocker",
    "decision_support",
    "recommendation_interaction",
    "handoff_readiness",
    "route_outcome",
}
ROUTE_OUTCOMES = {"confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"}


class MemoryEventValidator:
    def validate(self, draft: JsonObject | None, selected_skill_context: SkillSelection | JsonObject | None = None) -> JsonObject:
        errors: list[str] = []
        warnings: list[str] = []
        invariant = {
            "schemaValid": True,
            "categoryPayloadCompatible": True,
            "operationSupported": (draft or {}).get("operation") == "add_new",
            "evidenceSufficient": has_evidence(draft),
            "promotionSafe": True,
            "officialTruthSafe": not contains_official_truth(draft or {}),
            "projectionIntentSafe": bool((draft or {}).get("merge", {}).get("projectionIntent")),
            "duplicatePolicySafe": True,
        }
        if not draft:
            errors.append("draft_missing")
        if not (draft or {}).get("studentId") or not (draft or {}).get("source", {}).get("conversationId") or not (draft or {}).get("source", {}).get("turnId") or not (draft or {}).get("source", {}).get("messageId"):
            errors.append("source_trace_missing")
        if (draft or {}).get("category") not in MEMORY_CATEGORIES:
            errors.append("category_invalid")
        if not isinstance((draft or {}).get("payload"), dict):
            invariant["categoryPayloadCompatible"] = False
            errors.append("payload_invalid")
        if not invariant["operationSupported"]:
            errors.append("operation_not_supported")
        if not invariant["evidenceSufficient"]:
            errors.append("evidence_missing")
        if not invariant["officialTruthSafe"]:
            errors.append("official_truth_not_memory")
        if not invariant["projectionIntentSafe"]:
            errors.append("projection_intent_missing")
        if (draft or {}).get("category") == "counseling_preference" and (draft or {}).get("payload", {}).get("status") != "confirmed_counseling_preference":
            invariant["promotionSafe"] = False
            errors.append("confirmed_preference_requires_explicit_status")
        if (draft or {}).get("category") == "route_outcome" and (draft or {}).get("payload", {}).get("outcome") not in ROUTE_OUTCOMES:
            invariant["categoryPayloadCompatible"] = False
            errors.append("route_outcome_invalid")
        status = "reject" if errors else "valid_with_warnings" if warnings else "valid"
        durable_event = self.to_durable_event(draft, selected_skill_context) if draft and not errors else None
        return {
            "status": status,
            "durableEvent": durable_event,
            "errors": errors,
            "warnings": warnings,
            "invariantChecks": invariant,
        }

    def to_durable_event(self, draft: JsonObject, selected_skill_context: SkillSelection | JsonObject | None) -> JsonObject:
        selected = (selected_skill_context or {}).get("selectedRuntimeSkill") or {}
        return {
            "eventId": str(uuid4()),
            "studentId": draft["studentId"],
            "conversationId": draft["source"]["conversationId"],
            "turnId": draft["source"]["turnId"],
            "messageId": draft["source"]["messageId"],
            "category": draft["category"],
            "operation": draft["operation"],
            "payload": draft["payload"],
            "confidence": draft.get("confidence"),
            "evidence": draft.get("evidence"),
            "source": {
                "acceptedSemanticDeltaId": draft["source"].get("acceptedSemanticDeltaId"),
                "acceptedDeltaId": draft["source"].get("acceptedDeltaId"),
                "skillName": selected.get("name"),
                "skillVersion": selected.get("version"),
                "skillHash": selected.get("contentHash"),
                "validatorVersion": "memory-event-validator.phase5.v1",
            },
            "merge": draft.get("merge"),
            "officialTruthBoundary": {"isOfficialTruth": False},
            "validation": {"validated": True, "validatorVersion": "memory-event-validator.phase5.v1"},
            "createdAt": datetime.now(UTC).isoformat(),
        }


def has_evidence(draft: JsonObject | None) -> bool:
    return any(isinstance(item, dict) and str(item.get("quote", "")).strip() for item in (draft or {}).get("evidence", []))
