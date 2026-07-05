from __future__ import annotations

from dataclasses import dataclass, field

from .current_truth_facts import (
    AcademicResultFact,
    CounselingPreferenceFact,
    CurrentTruthFact,
    DirectionFact,
    FactSource,
    HandoffReadinessFact,
    QualitySignalFact,
    RecommendationInteractionFact,
    RejectedOptionFact,
    RouteOutcomeFact,
)
from .current_truth_schema import (
    AcademicProjection,
    AcademicResult,
    ConfirmedCounselingPreference,
    DirectionOption,
    DirectionTruth,
    HandoffProjection,
    PreferenceProjection,
    QualityContextProjection,
    RecommendationHistoryProjection,
    RecommendationItem,
    RejectedOption,
    RouteHistoryProjection,
    RouteOutcomeItem,
    SupportingValue,
)
from .memory_validation import DurableMemoryEvent


@dataclass(slots=True)
class CurrentTruthDraft:
    student_id: str | None
    source_events: list[DurableMemoryEvent]
    academic: AcademicProjection = field(default_factory=AcademicProjection)
    course: DirectionTruth = field(default_factory=DirectionTruth)
    university: DirectionTruth = field(default_factory=DirectionTruth)
    pathway: DirectionTruth = field(default_factory=DirectionTruth)
    preference: PreferenceProjection = field(default_factory=PreferenceProjection)
    quality_context: QualityContextProjection = field(default_factory=QualityContextProjection)
    decision_blockers: list[SupportingValue] = field(default_factory=list)
    recommendation_history: RecommendationHistoryProjection = field(default_factory=RecommendationHistoryProjection)
    handoff: HandoffProjection = field(default_factory=HandoffProjection)
    route_history: RouteHistoryProjection = field(default_factory=RouteHistoryProjection)

    @classmethod
    def empty(cls, student_id: str | None, events: list[DurableMemoryEvent]) -> CurrentTruthDraft:
        return cls(student_id, events)

    def apply(self, fact: CurrentTruthFact) -> None:
        if isinstance(fact, AcademicResultFact):
            self.record_academic_result(fact)
        elif isinstance(fact, DirectionFact):
            self.record_direction(fact)
        elif isinstance(fact, CounselingPreferenceFact):
            self.record_counseling_preference(fact)
        elif isinstance(fact, RejectedOptionFact):
            self.reject_option(fact.option_type, RejectedOption(fact.value, [fact.source.event_id]))
        elif isinstance(fact, QualitySignalFact):
            self.record_quality_signal(fact)
        elif isinstance(fact, HandoffReadinessFact):
            self.record_handoff_readiness(fact)
        elif isinstance(fact, RouteOutcomeFact):
            self.record_route_outcome(fact)
        elif isinstance(fact, RecommendationInteractionFact):
            self.record_recommendation_interaction(fact)

    def record_academic_result(self, fact: AcademicResultFact) -> None:
        self.academic.status = "known"
        self.academic.latest_usable_result = AcademicResult(
            raw_text=fact.raw_text,
            confidence=fact.source.confidence,
            supporting_event_ids=[fact.source.event_id],
        )

    def record_direction(self, fact: DirectionFact) -> None:
        target = self.direction_truth(fact.option_type)
        if target:
            upsert_direction(target, fact)

    def record_counseling_preference(self, fact: CounselingPreferenceFact) -> None:
        preference = self.preference.confirmed or ConfirmedCounselingPreference()
        self.preference.confirmed = preference
        self.preference.strength = "L4"
        if fact.dimension == "course":
            preference.course_or_program = fact.value
            upsert_direction(self.course, DirectionFact("course", fact.value, fact.status, None, fact.source))
        if fact.dimension == "university":
            preference.university = fact.value
            upsert_direction(self.course, DirectionFact("university", fact.value, fact.status, fact.university_type, fact.source))
        if fact.dimension == "pathway":
            preference.pathway = fact.value
            upsert_direction(self.course, DirectionFact("pathway", fact.value, fact.status, None, fact.source))
        preference.confidence = fact.source.confidence
        preference.supporting_event_ids = [*preference.supporting_event_ids, fact.source.event_id]

    def record_quality_signal(self, fact: QualitySignalFact) -> None:
        value = supporting_value(fact.value, fact.signal_type, fact.source)
        if fact.category == "constraint":
            self.quality_context.hard_constraints.append(value)
        elif fact.category == "quality_context":
            self.quality_context.soft_preferences.append(value)
        elif fact.category == "concern":
            self.decision_blockers.append(value)

    def record_handoff_readiness(self, fact: HandoffReadinessFact) -> None:
        self.handoff.required = True
        if fact.value.get("triggerType"):
            self.handoff.trigger_types.append(fact.value["triggerType"])
        preference = self.preference.confirmed
        self.handoff.context = {
            "selectedCounselingPreference": preference.course_or_program if preference else None,
            "reason": fact.value.get("reason") or fact.status or fact.signal_type,
            "supportingEventIds": [fact.source.event_id],
        }
        self.preference.strength = "L5"

    def record_route_outcome(self, fact: RouteOutcomeFact) -> None:
        if not fact.route_type:
            return
        item = RouteOutcomeItem(fact.route_type, fact.outcome, fact.value, fact.source.confidence, [fact.source.event_id])
        self.route_history.outcomes.append(item)
        self.route_history.latest_outcome_by_route[fact.route_type] = item
        if fact.outcome == "deferred_decision":
            self.route_history.deferrals.append(item)
            self.route_history.resume_route_hint = fact.route_type
        if fact.outcome == "student_switched_route":
            self.route_history.switches.append(item)
            if fact.next_route_candidate:
                self.route_history.resume_route_hint = fact.next_route_candidate
        if fact.outcome == "accepted_fallback":
            self.route_history.fallbacks.append(item)
        if fact.outcome == "handoff_required":
            self.route_history.handoffs.append(item)

    def record_recommendation_interaction(self, fact: RecommendationInteractionFact) -> None:
        item = RecommendationItem(fact.value, fact.source.confidence, [fact.source.event_id])
        self.recommendation_history.previous_outputs.append(item)
        self.recommendation_history.latest_shown = item

    def reject_option(self, option_type: str, rejected: RejectedOption) -> None:
        target = self.direction_truth(option_type)
        if target:
            target.rejected_options.append(rejected)

    def direction_truth(self, option_type: str) -> DirectionTruth | None:
        if option_type == "course":
            return self.course
        if option_type == "university":
            return self.university
        if option_type == "pathway":
            return self.pathway
        return None


def upsert_direction(target: DirectionTruth, fact: DirectionFact) -> None:
    existing = next((item for item in target.active_options if same_text(item.value, fact.value)), None)
    next_item = DirectionOption(
        value=fact.value,
        university_type=fact.university_type,
        status=fact.status,
        confidence=fact.source.confidence,
        supporting_event_ids=[*(existing.supporting_event_ids if existing else []), fact.source.event_id],
    )
    if not existing:
        target.active_options.append(next_item)
        return
    if direction_rank(next_item.status) >= direction_rank(existing.status):
        existing.value = next_item.value
        existing.university_type = next_item.university_type
        existing.status = next_item.status
        existing.confidence = next_item.confidence
    existing.supporting_event_ids = next_item.supporting_event_ids


def supporting_value(value: object, signal_type: str, source: FactSource) -> SupportingValue:
    return SupportingValue(value, source.confidence, [source.event_id], signal_type)


def same_text(a: object, b: object) -> bool:
    return str(a or "").lower() == str(b or "").lower()


def direction_rank(status: str) -> int:
    return {"considering": 1, "preferred": 2, "confirmed_counseling_preference": 3}.get(status, 0)
