from __future__ import annotations

from typing import Literal

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
from .memory_payloads import (
    AcademicPayload,
    CounselingPreferencePayload,
    DirectionPayload,
    HandoffReadinessPayload,
    QualitySignalPayload,
    RecommendationInteractionPayload,
    RejectedOptionPayload,
    RouteOutcomePayload,
)
from .memory_validation import DurableMemoryEvent


DirectionOptionType = Literal["course", "university", "pathway"]
QualityCategory = Literal["constraint", "quality_context", "concern"]


class CurrentTruthNormalizer:
    def facts_from_events(self, events: list[DurableMemoryEvent]) -> list[CurrentTruthFact]:
        facts: list[CurrentTruthFact] = []
        for event in events:
            if event.draft.operation != "add_new":
                continue
            fact = fact_from_event(event)
            if fact:
                facts.append(fact)
        return facts


def fact_from_event(event: DurableMemoryEvent) -> CurrentTruthFact | None:
    payload = event.draft.payload
    source = FactSource(event.event_id, event.draft.confidence, event.created_at)
    category = event.draft.category
    if category == "academic" and isinstance(payload, AcademicPayload):
        return AcademicResultFact(payload.raw_text, source)
    if category in {"course_direction", "university_direction", "pathway_direction"} and isinstance(payload, DirectionPayload):
        option_type = direction_option_type(category)
        return DirectionFact(option_type, payload.value, payload.status, payload.university_type, source) if option_type else None
    if category == "counseling_preference" and isinstance(payload, CounselingPreferencePayload):
        return CounselingPreferenceFact(payload.dimension, payload.value, source, payload.status, payload.university_type)
    if category == "rejected_option" and isinstance(payload, RejectedOptionPayload):
        return RejectedOptionFact(payload.option_type, payload.value, source)
    if category in {"constraint", "quality_context", "concern"} and isinstance(payload, QualitySignalPayload):
        quality_category = quality_signal_category(category)
        return QualitySignalFact(quality_category, payload.type, payload.value, source) if quality_category else None
    if category == "recommendation_interaction" and isinstance(payload, RecommendationInteractionPayload):
        return RecommendationInteractionFact(payload.value, source)
    if category == "handoff_readiness" and isinstance(payload, HandoffReadinessPayload):
        return HandoffReadinessFact(payload.type, payload.value, payload.status, source)
    if category == "route_outcome" and isinstance(payload, RouteOutcomePayload):
        return RouteOutcomeFact(payload.outcome, payload.route_type, payload.next_route_candidate, payload.to_json_dict(), source)
    return None


def direction_option_type(category: object) -> DirectionOptionType | None:
    if category == "course_direction":
        return "course"
    if category == "university_direction":
        return "university"
    if category == "pathway_direction":
        return "pathway"
    return None


def quality_signal_category(category: object) -> QualityCategory | None:
    if category == "constraint":
        return "constraint"
    if category == "quality_context":
        return "quality_context"
    if category == "concern":
        return "concern"
    return None
