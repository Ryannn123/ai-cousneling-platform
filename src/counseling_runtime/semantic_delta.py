from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Literal

from .contracts import JsonObject, TurnInput
from .schemas import AcademicResultDelta, BaseDelta, Confidence, DirectionDelta, FlowDrivingDeltas, MemoryDeltaCandidates, QualityEnhancingDelta, RuntimeOnlySignal, SemanticDeltaResult, dump


SemanticDeltaStatus = Literal["accepted", "accepted_with_downgrades", "requires_clarification"]
MemoryCategory = Literal[
    "academic",
    "course_direction",
    "university_direction",
    "pathway_direction",
    "counseling_preference",
    "rejected_option",
    "constraint",
    "quality_context",
    "concern",
]
MemoryOperation = Literal["add_new"]


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
class AcceptedStudentMemoryCandidate:
    accepted_delta_id: str
    category: MemoryCategory
    operation: MemoryOperation
    payload: JsonObject
    confidence: Confidence
    evidence: list[dict[str, str]]
    projection_intent: str

    def to_json_dict(self) -> JsonObject:
        return {
            "acceptedDeltaId": self.accepted_delta_id,
            "category": self.category,
            "operation": self.operation,
            "payload": self.payload,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "projectionIntent": self.projection_intent,
        }


@dataclass(slots=True, frozen=True)
class AcceptedSemanticDelta:
    platform_metadata: Metadata
    accepted_memory_deltas: MemoryDeltaCandidates
    accepted_student_memory_candidates: list[AcceptedStudentMemoryCandidate]
    accepted_runtime_only_signals: list[RuntimeOnlySignal]
    rejected_candidates: list[RejectedCandidate]
    downgraded_candidates: list[DowngradedCandidate]
    validation_events: list[ValidationEvent]
    status: SemanticDeltaStatus

    def to_json_dict(self) -> JsonObject:
        return {
            "platformMetadata": asdict(self.platform_metadata),
            "acceptedMemoryDeltas": dump(self.accepted_memory_deltas),
            "acceptedStudentMemoryCandidates": [candidate.to_json_dict() for candidate in self.accepted_student_memory_candidates],
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
            accepted_student_memory_candidates=student_memory_candidates(accepted_memory),
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


def accepted_student_memory_candidates(delta: AcceptedSemanticDeltaInput) -> list[AcceptedStudentMemoryCandidate]:
    return delta.accepted_student_memory_candidates if isinstance(delta, AcceptedSemanticDelta) else []


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


def student_memory_candidates(memory: MemoryDeltaCandidates) -> list[AcceptedStudentMemoryCandidate]:
    candidates: list[AcceptedStudentMemoryCandidate] = []
    flow = memory.flowDrivingDeltas
    for index, delta in enumerate(flow.academicResults):
        candidates.append(academic_memory_candidate(f"flow.academicResults.{index}", delta))
    for index, delta in enumerate(flow.directions):
        candidates.append(direction_memory_candidate(f"flow.directions.{index}", delta))
    for index, delta in enumerate(memory.qualityEnhancingDeltas):
        candidates.append(quality_memory_candidate(f"qualityEnhancingDeltas.{index}", delta))
    return candidates


def academic_memory_candidate(accepted_delta_id: str, delta: AcademicResultDelta) -> AcceptedStudentMemoryCandidate:
    return student_memory_candidate(accepted_delta_id, delta, "academic", {"rawText": delta.value, "status": "known"})


def direction_memory_candidate(accepted_delta_id: str, delta: DirectionDelta) -> AcceptedStudentMemoryCandidate:
    if delta.status == "rejected":
        return student_memory_candidate(accepted_delta_id, delta, "rejected_option", {"optionType": delta.dimension, "value": delta.value, "status": "rejected"})
    if delta.status == "confirmed_counseling_preference":
        return student_memory_candidate(accepted_delta_id, delta, "counseling_preference", {"dimension": delta.dimension, "value": delta.value, "status": delta.status})
    return student_memory_candidate(accepted_delta_id, delta, direction_category(delta), {"value": delta.value, "status": delta.status})


def quality_memory_candidate(accepted_delta_id: str, delta: QualityEnhancingDelta) -> AcceptedStudentMemoryCandidate:
    category = "constraint" if delta.type == "constraint" else "concern" if delta.type == "concern" else "quality_context"
    return student_memory_candidate(accepted_delta_id, delta, category, {
        "type": delta.type,
        "value": delta.value,
        "usefulness": delta.usefulness,
        "sensitivity": delta.sensitivity,
        "constraintStrength": delta.constraintStrength or ("hard_constraint" if category == "constraint" else "soft_preference"),
    })


def student_memory_candidate(accepted_delta_id: str, delta: BaseDelta, category: MemoryCategory, payload: JsonObject) -> AcceptedStudentMemoryCandidate:
    return AcceptedStudentMemoryCandidate(
        accepted_delta_id=accepted_delta_id,
        category=category,
        operation=delta.operation,
        payload=payload,
        confidence=delta.confidence,
        evidence=[{"quote": item.quote, "source": "student_message"} for item in delta.evidence if item.quote.strip()],
        projection_intent="may_update_current_truth",
    )


def direction_category(delta: DirectionDelta) -> MemoryCategory:
    if delta.dimension == "course":
        return "course_direction"
    if delta.dimension == "university":
        return "university_direction"
    return "pathway_direction"


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
