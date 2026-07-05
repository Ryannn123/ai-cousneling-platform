from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from .contracts import JsonObject, TurnInput
from .schemas import SemanticDeltaResult


SemanticDeltaStatus = Literal["accepted", "accepted_with_downgrades", "requires_clarification"]


@dataclass(slots=True)
class AcceptedSemanticDelta:
    platform_metadata: JsonObject
    accepted_memory_deltas: JsonObject
    accepted_runtime_only_signals: list[JsonObject]
    rejected_candidates: list[JsonObject]
    downgraded_candidates: list[JsonObject]
    validation_events: list[JsonObject]
    status: SemanticDeltaStatus

    def to_json_dict(self) -> JsonObject:
        return {
            "platformMetadata": self.platform_metadata,
            "acceptedMemoryDeltas": self.accepted_memory_deltas,
            "acceptedRuntimeOnlySignals": self.accepted_runtime_only_signals,
            "rejectedCandidates": self.rejected_candidates,
            "downgradedCandidates": self.downgraded_candidates,
            "validationEvents": self.validation_events,
            "status": self.status,
        }


AcceptedSemanticDeltaInput = AcceptedSemanticDelta | JsonObject


class SemanticDeltaValidator:
    def validate(
        self,
        raw_semantic_delta: SemanticDeltaResult | JsonObject,
        turn_input: TurnInput | JsonObject,
        extractor: object | None = None,
    ) -> AcceptedSemanticDelta:
        rejected: list[JsonObject] = []
        downgraded: list[JsonObject] = []
        events = [{"type": "schema_validated", "severity": "info", "message": "Semantic delta schema accepted."}]
        accepted_memory, accepted_signals = schema_validated_delta(raw_semantic_delta)

        validate_flow(accepted_memory["flowDrivingDeltas"], downgraded, events)
        validate_quality(accepted_memory["qualityEnhancingDeltas"], rejected, events)
        record_runtime_signal_events(accepted_signals, events)

        if any(signal.get("kind") == "boundary" and signal.get("type") == "ambiguous_proceed_language" for signal in accepted_signals):
            events.append({"type": "clarification_required", "severity": "warning", "message": "Ambiguous proceed language requires clarification."})

        requires_clarification = any(signal.get("recommendedBehavior") == "clarify_once" or signal.get("kind") == "ambiguity" for signal in accepted_signals)
        status = (
            "requires_clarification"
            if requires_clarification
            else "accepted_with_downgrades"
            if downgraded
            else "accepted"
        )
        return AcceptedSemanticDelta(
            platform_metadata=build_metadata(turn_input, extractor),
            accepted_memory_deltas=accepted_memory,
            accepted_runtime_only_signals=accepted_signals,
            rejected_candidates=rejected,
            downgraded_candidates=downgraded,
            validation_events=events,
            status=status,
        )


def accepted_semantic_delta_json(delta: AcceptedSemanticDeltaInput) -> JsonObject:
    return delta.to_json_dict() if isinstance(delta, AcceptedSemanticDelta) else delta


def accepted_memory_deltas(delta: AcceptedSemanticDeltaInput) -> JsonObject:
    return delta.accepted_memory_deltas if isinstance(delta, AcceptedSemanticDelta) else delta.get("acceptedMemoryDeltas", {})


def accepted_runtime_only_signals(delta: AcceptedSemanticDeltaInput | None) -> list[JsonObject]:
    if delta is None:
        return []
    return delta.accepted_runtime_only_signals if isinstance(delta, AcceptedSemanticDelta) else delta.get("acceptedRuntimeOnlySignals", [])


def platform_metadata(delta: AcceptedSemanticDeltaInput) -> JsonObject:
    return delta.platform_metadata if isinstance(delta, AcceptedSemanticDelta) else delta.get("platformMetadata", {})


def schema_validated_delta(raw: SemanticDeltaResult | JsonObject) -> tuple[JsonObject, list[JsonObject]]:
    parsed = raw if isinstance(raw, SemanticDeltaResult) else SemanticDeltaResult.model_validate(raw)
    normalized = parsed.model_dump()
    return normalized["memoryDeltaCandidates"], normalized["runtimeOnlySignalCandidates"]


def validate_flow(flow: JsonObject, downgraded: list[JsonObject], events: list[JsonObject]) -> None:
    for label, list_key in [("Course", "coursesConsidering"), ("University", "universitiesConsidering"), ("Pathway", "pathwaysConsidering")]:
        validate_confirmed_preference(flow, label, list_key, downgraded, events)


def validate_quality(deltas: list[JsonObject], rejected: list[JsonObject], events: list[JsonObject]) -> None:
    for index in range(len(deltas) - 1, -1, -1):
        delta = deltas[index]
        path = f"acceptedMemoryDeltas.qualityEnhancingDeltas.{index}"
        if delta.get("usefulness") == "low":
            reject(rejected, events, path, delta, "quality_signal_low_usefulness", "quality_signal_ignored")
            del deltas[index]


def record_runtime_signal_events(signals: list[JsonObject], events: list[JsonObject]) -> None:
    for index, _signal in enumerate(signals):
        path = f"acceptedRuntimeOnlySignals.{index}"
        events.append({"type": "runtime_signal_validated", "severity": "info", "message": f"{path} accepted as runtime-only."})


def validate_confirmed_preference(flow: JsonObject, label: str, list_key: str, downgraded: list[JsonObject], events: list[JsonObject]) -> None:
    confirmed_key = f"confirmedCounseling{label}Preferences"
    delta = flow.get(confirmed_key)
    path = f"acceptedMemoryDeltas.flowDrivingDeltas.{confirmed_key}"
    if not delta:
        return
    if delta.get("confidence") == "low":
        downgraded_delta = {**delta, "status": "preferred", "promotionRisk": "requires_confirmation"}
        flow[list_key].append(downgraded_delta)
        flow[confirmed_key] = None
        downgraded.append({"candidatePath": path, "originalCandidate": delta, "downgradedCandidate": downgraded_delta, "reason": "confirmed_preference_low_confidence"})
        events.append({"type": "promotion_blocked", "severity": "warning", "message": f"{path} downgraded: confirmed_preference_low_confidence."})


def build_metadata(turn_input: TurnInput | JsonObject, extractor: object | None) -> JsonObject:
    metadata = {
        "conversationId": turn_input.get("conversationId"),
        "turnId": turn_input.get("turnId"),
        "messageId": turn_input.get("messageId"),
        "createdAt": datetime.now(UTC).isoformat(),
        "extractor": {
            "provider": getattr(extractor, "provider", "mock"),
            "model": getattr(extractor, "model", "mock"),
        },
    }
    return metadata


def reject(rejected: list[JsonObject], events: list[JsonObject], path: str, candidate: object, reason: str, event_type: str = "candidate_rejected") -> None:
    rejected.append({"candidatePath": path, "proposedCandidate": candidate, "reason": reason, "severity": "warning"})
    events.append({"type": event_type, "severity": "warning", "message": f"{path} rejected: {reason}."})
