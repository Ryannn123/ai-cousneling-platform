from __future__ import annotations

from datetime import UTC, datetime
from .contracts import JsonObject, TurnInput
from .safety import contains_official_truth, has_explicit_counseling_choice
from .schemas import SemanticDeltaResult


BOUNDARY_TYPES = {
    "ready_to_apply_or_register",
    "official_action_request",
    "payment_or_seat_request",
    "exception_or_waiver_request",
    "sensitive_context",
    "human_requested_support",
    "ambiguous_proceed_language",
    "official_transaction",
    "complex_or_sensitive_case",
    "human_support_request",
}


class SemanticDeltaValidator:
    def validate(
        self,
        raw_semantic_delta: SemanticDeltaResult | JsonObject,
        turn_input: TurnInput | JsonObject,
        extractor: object | None = None,
        skill_context: JsonObject | None = None,
    ) -> JsonObject:
        rejected: list[JsonObject] = []
        downgraded: list[JsonObject] = []
        events = [{"type": "schema_validated", "severity": "info", "message": "Semantic delta schema accepted."}]
        accepted_memory, accepted_signals = schema_validated_delta(raw_semantic_delta)

        validate_flow(accepted_memory["flowDrivingDeltas"], rejected, downgraded, events)
        validate_quality(accepted_memory["qualityEnhancingDeltas"], rejected, events)
        validate_signals(accepted_signals, rejected, events)
        preserve_human_help_posture(accepted_signals, events)

        if any(signal.get("kind") == "boundary" and signal.get("type") == "ambiguous_proceed_language" for signal in accepted_signals):
            events.append({"type": "clarification_required", "severity": "warning", "message": "Ambiguous proceed language requires clarification."})

        requires_clarification = any(signal.get("recommendedBehavior") == "clarify_once" or signal.get("kind") == "ambiguity" for signal in accepted_signals)
        status = (
            "requires_clarification"
            if requires_clarification
            else "accepted_with_downgrades"
            if downgraded
            else "safe_fallback"
            if any(item.get("severity") == "error" for item in rejected)
            else "accepted"
        )
        return {
            "platformMetadata": build_metadata(turn_input, extractor, skill_context),
            "acceptedMemoryDeltas": accepted_memory,
            "acceptedRuntimeOnlySignals": accepted_signals,
            "rejectedCandidates": rejected,
            "downgradedCandidates": downgraded,
            "validationEvents": events,
            "status": status,
        }


def schema_validated_delta(raw: SemanticDeltaResult | JsonObject) -> tuple[JsonObject, list[JsonObject]]:
    parsed = raw if isinstance(raw, SemanticDeltaResult) else SemanticDeltaResult.model_validate(raw)
    normalized = parsed.model_dump()
    return normalized["memoryDeltaCandidates"], normalized["runtimeOnlySignalCandidates"]


def validate_flow(flow: JsonObject, rejected: list[JsonObject], downgraded: list[JsonObject], events: list[JsonObject]) -> None:
    for key in ["academicResults", "coursesConsidering", "universitiesConsidering", "pathwaysConsidering"]:
        validate_delta_list(f"acceptedMemoryDeltas.flowDrivingDeltas.{key}", flow[key], rejected, events)
    for label, list_key in [("Course", "coursesConsidering"), ("University", "universitiesConsidering"), ("Pathway", "pathwaysConsidering")]:
        validate_confirmed_preference(flow, label, list_key, rejected, downgraded, events)


def validate_quality(deltas: list[JsonObject], rejected: list[JsonObject], events: list[JsonObject]) -> None:
    for index in range(len(deltas) - 1, -1, -1):
        delta = deltas[index]
        path = f"acceptedMemoryDeltas.qualityEnhancingDeltas.{index}"
        if delta.get("usefulness") == "low":
            reject(rejected, events, path, delta, "quality_signal_low_usefulness", "quality_signal_ignored")
            del deltas[index]


def validate_signals(signals: list[JsonObject], rejected: list[JsonObject], events: list[JsonObject]) -> None:
    for index in range(len(signals) - 1, -1, -1):
        signal = signals[index]
        path = f"acceptedRuntimeOnlySignals.{index}"
        if signal.get("kind") == "boundary" and signal.get("type") not in BOUNDARY_TYPES:
            reject(rejected, events, path, signal, "boundary_type_invalid")
            del signals[index]
            continue
        events.append({"type": "runtime_signal_validated", "severity": "info", "message": f"{path} accepted as runtime-only."})


def validate_delta_list(path: str, deltas: list[JsonObject], rejected: list[JsonObject], events: list[JsonObject]) -> None:
    for index in range(len(deltas) - 1, -1, -1):
        delta = deltas[index]
        candidate_path = f"{path}.{index}"
        if contains_official_truth(delta):
            reject(rejected, events, candidate_path, delta, "official_action_not_memory_delta")
            del deltas[index]


def validate_confirmed_preference(flow: JsonObject, label: str, list_key: str, rejected: list[JsonObject], downgraded: list[JsonObject], events: list[JsonObject]) -> None:
    confirmed_key = f"confirmedCounseling{label}Preferences"
    delta = flow.get(confirmed_key)
    path = f"acceptedMemoryDeltas.flowDrivingDeltas.{confirmed_key}"
    if not delta:
        return
    if not has_meaningful_value(delta):
        reject(rejected, events, path, delta, "delta_value_missing")
        flow[confirmed_key] = None
        return
    direct_quote = " ".join(item.get("quote", "") for item in delta.get("evidence", []))
    if not has_explicit_counseling_choice(direct_quote):
        downgraded_delta = {**delta, "status": "preferred", "promotionRisk": "requires_confirmation"}
        if downgraded_delta.get("confidence") == "high":
            downgraded_delta["confidence"] = "medium"
        flow[list_key].append(downgraded_delta)
        flow[confirmed_key] = None
        downgraded.append({"candidatePath": path, "originalCandidate": delta, "downgradedCandidate": downgraded_delta, "reason": "value_confirmation_not_explicit"})
        events.append({"type": "promotion_blocked", "severity": "warning", "message": f"{path} downgraded: value_confirmation_not_explicit."})


def preserve_human_help_posture(signals: list[JsonObject], events: list[JsonObject]) -> None:
    posture = next((signal for signal in signals if signal.get("kind") == "student_posture" and signal.get("posture") == "human_help_seeking"), None)
    if posture and not any(signal.get("kind") == "boundary" and signal.get("type") == "human_requested_support" for signal in signals):
        signals.append({
            "kind": "boundary",
            "type": "human_requested_support",
            "triggerType": "H6",
            "severityCandidate": "red",
            "recommendedBehavior": "handoff",
            "confidence": posture.get("confidence", "medium"),
            "evidence": posture.get("evidence", []),
            "source": posture.get("source"),
            "promotionRisk": "official_action_risk",
        })
        events.append({"type": "posture_boundary_signal_preserved", "severity": "warning", "message": "Human-help posture preserved as H6 boundary candidate."})


def build_metadata(turn_input: TurnInput | JsonObject, extractor: object | None, skill_context: JsonObject | None) -> JsonObject:
    metadata = {
        "conversationId": turn_input.get("conversationId"),
        "turnId": turn_input.get("turnId"),
        "messageId": turn_input.get("messageId"),
        "createdAt": datetime.now(UTC).isoformat(),
        "extractor": {
            "provider": getattr(extractor, "provider", "mock"),
            "model": getattr(extractor, "model", "mock"),
            "promptVersion": "phase4.semantic-delta.v1.3",
            "schemaVersion": "phase4.semantic-delta.v1.3",
        },
        "validator": {
            "validatorVersion": "semantic-delta-validator.v1.3",
            "validationPolicyVersion": "phase4.semantic-delta-policy.v1.3",
        },
    }
    if skill_context:
        metadata["skillContext"] = skill_context
    return metadata


def reject(rejected: list[JsonObject], events: list[JsonObject], path: str, candidate: object, reason: str, event_type: str = "candidate_rejected") -> None:
    rejected.append({"candidatePath": path, "proposedCandidate": candidate, "reason": reason, "severity": "error" if reason == "missing_evidence" else "warning"})
    events.append({"type": event_type, "severity": "warning", "message": f"{path} rejected: {reason}."})


def has_meaningful_value(delta: JsonObject) -> bool:
    value = delta.get("value")
    return bool(value.strip()) if isinstance(value, str) else bool(isinstance(value, dict) and value)
