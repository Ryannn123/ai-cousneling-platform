from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Literal

from .contracts import JsonObject, TurnInput
from .schemas import FlowDrivingDeltas, MemoryDeltaCandidates, QualityEnhancingDelta, RuntimeOnlySignal, SemanticDeltaResult, dump


SemanticDeltaStatus = Literal["accepted", "accepted_with_downgrades", "requires_clarification"]


@dataclass(slots=True, frozen=True)
class Extractor:
    provider: str
    model: str


@dataclass(slots=True, frozen=True)
class Metadata:
    conversationId: str | None
    turnId: str | None
    messageId: str | None
    createdAt: str
    extractor: Extractor


@dataclass(slots=True, frozen=True)
class ValidationEvent:
    type: str
    severity: Literal["info", "warning", "error"]
    message: str


@dataclass(slots=True, frozen=True)
class RejectedCandidate:
    candidatePath: str
    proposedCandidate: object
    reason: str
    severity: Literal["warning"] = "warning"


@dataclass(slots=True, frozen=True)
class DowngradedCandidate:
    candidatePath: str
    originalCandidate: object
    downgradedCandidate: object
    reason: str


@dataclass(slots=True, frozen=True)
class AcceptedSemanticDelta:
    platform_metadata: Metadata
    accepted_memory_deltas: MemoryDeltaCandidates
    accepted_runtime_only_signals: list[RuntimeOnlySignal]
    rejected_candidates: list[RejectedCandidate]
    downgraded_candidates: list[DowngradedCandidate]
    validation_events: list[ValidationEvent]
    status: SemanticDeltaStatus

    def to_json_dict(self) -> JsonObject:
        return {
            "platformMetadata": asdict(self.platform_metadata),
            "acceptedMemoryDeltas": dump(self.accepted_memory_deltas),
            "acceptedRuntimeOnlySignals": dump(self.accepted_runtime_only_signals),
            "rejectedCandidates": dump([asdict(candidate) for candidate in self.rejected_candidates]),
            "downgradedCandidates": dump([asdict(candidate) for candidate in self.downgraded_candidates]),
            "validationEvents": [asdict(event) for event in self.validation_events],
            "status": self.status,
        }


AcceptedSemanticDeltaInput = AcceptedSemanticDelta | JsonObject


class SemanticDeltaValidator:
    def validate(
        self,
        raw_semantic_delta: SemanticDeltaResult,
        turn_input: TurnInput | JsonObject,
        extractor: object | None = None,
    ) -> AcceptedSemanticDelta:
        rejected: list[RejectedCandidate] = []
        downgraded: list[DowngradedCandidate] = []
        events = [ValidationEvent("schema_validated", "info", "Semantic delta schema accepted.")]
        accepted_memory, accepted_signals = raw_semantic_delta.memoryDeltaCandidates, raw_semantic_delta.runtimeOnlySignalCandidates

        validate_flow(accepted_memory.flowDrivingDeltas, downgraded, events)
        validate_quality(accepted_memory.qualityEnhancingDeltas, rejected, events)
        record_runtime_signal_events(accepted_signals, events)

        if any(getattr(signal, "kind", None) == "boundary" and getattr(signal, "type", None) == "ambiguous_proceed_language" for signal in accepted_signals):
            events.append(ValidationEvent("clarification_required", "warning", "Ambiguous proceed language requires clarification."))

        requires_clarification = any(getattr(signal, "recommendedBehavior", None) == "clarify_once" or getattr(signal, "kind", None) == "ambiguity" for signal in accepted_signals)
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
    return dump(delta.accepted_memory_deltas) if isinstance(delta, AcceptedSemanticDelta) else delta.get("acceptedMemoryDeltas", {})


def accepted_runtime_only_signals(delta: AcceptedSemanticDeltaInput | None) -> list[JsonObject]:
    if delta is None:
        return []
    return dump(delta.accepted_runtime_only_signals) if isinstance(delta, AcceptedSemanticDelta) else delta.get("acceptedRuntimeOnlySignals", [])


def platform_metadata(delta: AcceptedSemanticDeltaInput) -> JsonObject:
    return asdict(delta.platform_metadata) if isinstance(delta, AcceptedSemanticDelta) else delta.get("platformMetadata", {})



def validate_flow(flow: FlowDrivingDeltas, downgraded: list[DowngradedCandidate], events: list[ValidationEvent]) -> None:
    for index, delta in enumerate(flow.directions):
        path = f"acceptedMemoryDeltas.flowDrivingDeltas.directions.{index}"
        if delta.status == "confirmed_counseling_preference" and delta.confidence == "low":
            downgraded_delta = delta.model_copy(update={"status": "preferred"})
            flow.directions[index] = downgraded_delta
            downgraded.append(DowngradedCandidate(path, delta, downgraded_delta, "confirmed_preference_low_confidence"))
            events.append(ValidationEvent("promotion_blocked", "warning", f"{path} downgraded: confirmed_preference_low_confidence."))


def validate_quality(deltas: list[QualityEnhancingDelta], rejected: list[RejectedCandidate], events: list[ValidationEvent]) -> None:
    for index in range(len(deltas) - 1, -1, -1):
        delta = deltas[index]
        path = f"acceptedMemoryDeltas.qualityEnhancingDeltas.{index}"
        if delta.usefulness == "low":
            reject(rejected, events, path, delta, "quality_signal_low_usefulness", "quality_signal_ignored")
            del deltas[index]


def record_runtime_signal_events(signals: list[RuntimeOnlySignal], events: list[ValidationEvent]) -> None:
    for index, _signal in enumerate(signals):
        path = f"acceptedRuntimeOnlySignals.{index}"
        events.append(ValidationEvent("runtime_signal_validated", "info", f"{path} accepted as runtime-only."))


def build_metadata(turn_input: TurnInput | JsonObject, extractor: object | None) -> Metadata:
    return Metadata(
        conversationId=turn_input.get("conversationId"),
        turnId=turn_input.get("turnId"),
        messageId=turn_input.get("messageId"),
        createdAt=datetime.now(UTC).isoformat(),
        extractor=Extractor(
            provider=getattr(extractor, "provider", "mock"),
            model=getattr(extractor, "model", "mock"),
        )
    )


def reject(rejected: list[RejectedCandidate], events: list[ValidationEvent], path: str, candidate: object, reason: str, event_type: str = "candidate_rejected") -> None:
    rejected.append(RejectedCandidate(path, candidate, reason))
    events.append(ValidationEvent(event_type, "warning", f"{path} rejected: {reason}."))
