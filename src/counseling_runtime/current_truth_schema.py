from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from .contracts import JsonObject
from .memory_validation import DurableMemoryEvent
from .schemas import Confidence


@dataclass(slots=True)
class ProjectionMetadata:
    source_event_ids: list[str]
    generated_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    warnings: list[str] = field(default_factory=list)

    def to_json_dict(self) -> JsonObject:
        return {
            "projectorVersion": "current-truth-projector.phase5.v2",
            "generatedAt": self.generated_at,
            "sourceEventIds": self.source_event_ids,
            "derivationStatus": "complete",
            "warnings": self.warnings,
        }


@dataclass(slots=True)
class SupportingValue:
    value: Any
    confidence: Confidence
    supporting_event_ids: list[str]
    type: Any = None

    def to_json_dict(self) -> JsonObject:
        return {
            "type": self.type,
            "value": self.value,
            "confidence": self.confidence,
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class AcademicResult:
    raw_text: Any
    confidence: Confidence
    supporting_event_ids: list[str]

    def to_json_dict(self) -> JsonObject:
        return {
            "rawText": self.raw_text,
            "confidence": self.confidence,
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class AcademicProjection:
    status: str = "unknown"
    latest_usable_result: AcademicResult | None = None

    def to_json_dict(self) -> JsonObject:
        result: JsonObject = {"status": self.status}
        if self.latest_usable_result:
            result["latestUsableResult"] = self.latest_usable_result.to_json_dict()
        return result


@dataclass(slots=True)
class DirectionOption:
    value: Any
    university_type: Any
    status: str
    confidence: Confidence
    supporting_event_ids: list[str]

    def to_json_dict(self) -> JsonObject:
        return {
            "value": self.value,
            "universityType": self.university_type,
            "status": self.status,
            "confidence": self.confidence,
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class RejectedOption:
    value: Any
    supporting_event_ids: list[str]

    def to_json_dict(self) -> JsonObject:
        return {
            "value": self.value,
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class DirectionTruth:
    status: str = "unknown"
    active_options: list[DirectionOption] = field(default_factory=list)
    rejected_options: list[RejectedOption] = field(default_factory=list)
    best_option: DirectionOption | None = None
    confirmed_option: DirectionOption | None = None

    def to_json_dict(self) -> JsonObject:
        return {
            "status": self.status,
            "activeOptions": [item.to_json_dict() for item in self.active_options],
            "rejectedOptions": [item.to_json_dict() for item in self.rejected_options],
            "bestOption": self.best_option.to_json_dict() if self.best_option else None,
            "confirmedOption": self.confirmed_option.to_json_dict() if self.confirmed_option else None,
        }


@dataclass(slots=True)
class ActiveDirectionProjection:
    course: Any = None
    university: Any = None
    pathway: Any = None
    source_event_ids: list[str] = field(default_factory=list)

    def to_json_dict(self) -> JsonObject:
        return {
            **({"course": self.course} if self.course else {}),
            **({"university": self.university} if self.university else {}),
            **({"pathway": self.pathway} if self.pathway else {}),
            "sourceEventIds": self.source_event_ids,
        }


@dataclass(slots=True)
class ConfirmedCounselingPreference:
    course_or_program: Any = None
    university: Any = None
    pathway: Any = None
    confidence: Confidence | None = None
    supporting_event_ids: list[str] = field(default_factory=list)

    def to_json_dict(self) -> JsonObject:
        return {
            **({"courseOrProgram": self.course_or_program} if self.course_or_program else {}),
            **({"university": self.university} if self.university else {}),
            **({"pathway": self.pathway} if self.pathway else {}),
            **({"confidence": self.confidence} if self.confidence else {}),
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class PreferenceProjection:
    strength: str = "none"
    confirmed: ConfirmedCounselingPreference | None = None

    def to_json_dict(self) -> JsonObject:
        result: JsonObject = {"strength": self.strength}
        if self.confirmed:
            result["confirmed"] = self.confirmed.to_json_dict()
        return result


@dataclass(slots=True)
class ReadinessBasis:
    has_usable_academic_result: bool = False
    has_usable_course_direction: bool = False
    has_usable_university_direction: bool = False
    has_usable_pathway_direction: bool = False
    has_enough_fit_signals: bool = False

    def has_any_direction(self) -> bool:
        return self.has_usable_course_direction or self.has_usable_university_direction or self.has_usable_pathway_direction

    def to_json_dict(self) -> JsonObject:
        return {
            "hasUsableAcademicResult": self.has_usable_academic_result,
            "hasUsableCourseDirection": self.has_usable_course_direction,
            "hasUsableUniversityDirection": self.has_usable_university_direction,
            "hasUsablePathwayDirection": self.has_usable_pathway_direction,
            "hasEnoughFitSignals": self.has_enough_fit_signals,
        }


@dataclass(slots=True)
class ReadinessProjection:
    route_level: str = "incomplete"
    recommendation_level: str = "R1"
    missing_route_inputs: list[str] = field(default_factory=lambda: ["academic_result", "course_direction_status", "university_direction_status"])
    missing_recommendation_inputs: list[str] = field(default_factory=list)
    basis: ReadinessBasis = field(default_factory=ReadinessBasis)
    confidence: Confidence = "low"

    def to_json_dict(self) -> JsonObject:
        return {
            "routeLevel": self.route_level,
            "recommendationLevel": self.recommendation_level,
            "missingRouteInputs": self.missing_route_inputs,
            "missingRecommendationInputs": self.missing_recommendation_inputs,
            "basis": self.basis.to_json_dict(),
            "confidence": self.confidence,
        }


@dataclass(slots=True)
class QualityContextProjection:
    hard_constraints: list[SupportingValue] = field(default_factory=list)
    soft_preferences: list[SupportingValue] = field(default_factory=list)
    influence_or_context: list[SupportingValue] = field(default_factory=list)
    summary: str = ""

    def has_fit_signal(self) -> bool:
        return bool(self.hard_constraints or self.soft_preferences or self.influence_or_context)

    def all_items(self) -> list[SupportingValue]:
        return [*self.hard_constraints, *self.soft_preferences, *self.influence_or_context]

    def to_json_dict(self) -> JsonObject:
        return {
            "hardConstraints": [item.to_json_dict() for item in self.hard_constraints],
            "softPreferences": [item.to_json_dict() for item in self.soft_preferences],
            "influenceOrContext": [item.to_json_dict() for item in self.influence_or_context],
            "summary": self.summary,
        }


@dataclass(slots=True)
class RecommendationItem:
    value: Any
    confidence: Confidence
    supporting_event_ids: list[str]

    def to_json_dict(self) -> JsonObject:
        return {
            "value": self.value,
            "confidence": self.confidence,
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class RecommendationHistoryProjection:
    latest_shown: RecommendationItem | None = None
    previous_outputs: list[RecommendationItem] = field(default_factory=list)

    def to_json_dict(self) -> JsonObject:
        return {
            "latestShown": self.latest_shown.to_json_dict() if self.latest_shown else None,
            "previousOutputs": [item.to_json_dict() for item in self.previous_outputs],
        }


@dataclass(slots=True)
class HandoffProjection:
    required: bool = False
    trigger_types: list[Any] = field(default_factory=list)
    context: JsonObject | None = None

    def to_json_dict(self) -> JsonObject:
        return {
            "required": self.required,
            "triggerTypes": self.trigger_types,
            **({"context": self.context} if self.context else {}),
        }


@dataclass(slots=True)
class RouteOutcomeItem:
    route_type: str
    outcome: str
    value: JsonObject
    confidence: Confidence
    supporting_event_ids: list[str]

    def to_json_dict(self) -> JsonObject:
        return {
            "routeType": self.route_type,
            "outcome": self.outcome,
            "value": self.value,
            "confidence": self.confidence,
            "supportingEventIds": self.supporting_event_ids,
        }


@dataclass(slots=True)
class RouteHistoryProjection:
    latest_outcome_by_route: dict[str, RouteOutcomeItem] = field(default_factory=dict)
    outcomes: list[RouteOutcomeItem] = field(default_factory=list)
    deferrals: list[RouteOutcomeItem] = field(default_factory=list)
    switches: list[RouteOutcomeItem] = field(default_factory=list)
    fallbacks: list[RouteOutcomeItem] = field(default_factory=list)
    handoffs: list[RouteOutcomeItem] = field(default_factory=list)
    resume_route_hint: str | None = None

    def to_json_dict(self) -> JsonObject:
        return {
            "latestOutcomeByRoute": {route: item.to_json_dict() for route, item in self.latest_outcome_by_route.items()},
            "outcomes": [item.to_json_dict() for item in self.outcomes],
            "deferrals": [item.to_json_dict() for item in self.deferrals],
            "switches": [item.to_json_dict() for item in self.switches],
            "fallbacks": [item.to_json_dict() for item in self.fallbacks],
            "handoffs": [item.to_json_dict() for item in self.handoffs],
            "resumeRouteHint": self.resume_route_hint,
        }


@dataclass(slots=True)
class CurrentTruthProjection:
    student_id: str | None
    metadata: ProjectionMetadata
    academic: AcademicProjection = field(default_factory=AcademicProjection)
    course: DirectionTruth = field(default_factory=DirectionTruth)
    university: DirectionTruth = field(default_factory=DirectionTruth)
    pathway: DirectionTruth = field(default_factory=DirectionTruth)
    active_direction: ActiveDirectionProjection = field(default_factory=ActiveDirectionProjection)
    preference: PreferenceProjection = field(default_factory=PreferenceProjection)
    readiness: ReadinessProjection = field(default_factory=ReadinessProjection)
    quality_context: QualityContextProjection = field(default_factory=QualityContextProjection)
    decision_blockers: list[SupportingValue] = field(default_factory=list)
    recommendation_history: RecommendationHistoryProjection = field(default_factory=RecommendationHistoryProjection)
    handoff: HandoffProjection = field(default_factory=HandoffProjection)
    route_history: RouteHistoryProjection = field(default_factory=RouteHistoryProjection)

    @classmethod
    def empty(cls, student_id: str | None, events: list[DurableMemoryEvent]) -> CurrentTruthProjection:
        return cls(student_id=student_id, metadata=ProjectionMetadata([event.event_id for event in events]))

    def to_json_dict(self) -> JsonObject:
        return {
            "studentId": self.student_id,
            "metadata": self.metadata.to_json_dict(),
            "academic": self.academic.to_json_dict(),
            "course": self.course.to_json_dict(),
            "university": self.university.to_json_dict(),
            "pathway": self.pathway.to_json_dict(),
            "activeDirection": self.active_direction.to_json_dict(),
            "preference": self.preference.to_json_dict(),
            "readiness": self.readiness.to_json_dict(),
            "qualityContext": self.quality_context.to_json_dict(),
            "decisionBlockers": [item.to_json_dict() for item in self.decision_blockers],
            "recommendationHistory": self.recommendation_history.to_json_dict(),
            "handoff": self.handoff.to_json_dict(),
            "routeHistory": self.route_history.to_json_dict(),
        }
