from __future__ import annotations

from .memory_payloads import AcademicPayload, CounselingPreferencePayload, DirectionPayload, HandoffReadinessPayload, QualitySignalPayload, RecommendationInteractionPayload, RejectedOptionPayload, RouteOutcomePayload
from .memory_validation import DurableMemoryEvent
from .current_truth_schema import (
    AcademicResult,
    ConfirmedCounselingPreference,
    CurrentTruthProjection,
    DirectionTruth,
    DirectionOption,
    RecommendationItem,
    RejectedOption,
    RouteOutcomeItem,
    SupportingValue,
)


class CurrentTruthProjector:
    def project(self, student_id: str, events: list[DurableMemoryEvent]) -> CurrentTruthProjection:
        projection = CurrentTruthProjection.empty(student_id, events)
        for event in events:
            if event.draft.operation == "add_new":
                apply_event(projection, event)
        finalize_direction(projection)
        finalize_active_direction(projection)
        finalize_readiness(projection)
        return projection


def apply_event(projection: CurrentTruthProjection, event: DurableMemoryEvent) -> None:
    payload = event.draft.payload
    category = event.draft.category
    if category == "academic" and isinstance(payload, AcademicPayload):
        projection.academic.status = "known"
        projection.academic.latest_usable_result = AcademicResult(
            raw_text=payload.raw_text,
            confidence=event.draft.confidence,
            supporting_event_ids=[event.event_id],
        )
    elif category == "course_direction" and isinstance(payload, DirectionPayload):
        upsert_direction(projection.course, event)
    elif category == "university_direction" and isinstance(payload, DirectionPayload):
        upsert_direction(projection.university, event)
    elif category == "pathway_direction" and isinstance(payload, DirectionPayload):
        upsert_direction(projection.pathway, event)
    elif category == "counseling_preference" and isinstance(payload, CounselingPreferencePayload):
        apply_counseling_preference(projection, event)
    elif category == "rejected_option" and isinstance(payload, RejectedOptionPayload):
        reject_option(projection, payload.option_type, RejectedOption(payload.value, [event.event_id]))
    elif category == "constraint" and isinstance(payload, QualitySignalPayload):
        projection.quality_context.hard_constraints.append(supporting_value(event))
    elif category == "quality_context" and isinstance(payload, QualitySignalPayload):
        target = projection.quality_context.influence_or_context if payload.type == "influence_or_context" else projection.quality_context.soft_preferences
        target.append(supporting_value(event))
    elif category == "concern" and isinstance(payload, QualitySignalPayload):
        projection.decision_blockers.append(supporting_value(event))
    elif category == "handoff_readiness" and isinstance(payload, HandoffReadinessPayload):
        apply_handoff_readiness(projection, event)
    elif category == "route_outcome" and isinstance(payload, RouteOutcomePayload):
        apply_route_outcome(projection, event)
    elif category == "recommendation_interaction" and isinstance(payload, RecommendationInteractionPayload):
        item = RecommendationItem(payload.value, event.draft.confidence, [event.event_id])
        projection.recommendation_history.previous_outputs.append(item)
        projection.recommendation_history.latest_shown = item


def supporting_value(event: DurableMemoryEvent) -> SupportingValue:
    payload = event.draft.payload
    if not isinstance(payload, QualitySignalPayload):
        raise ValueError("supporting value requires quality signal payload")
    return SupportingValue(payload.value, event.draft.confidence, [event.event_id], payload.type)


def upsert_direction(target: DirectionTruth, event: DurableMemoryEvent) -> None:
    payload = event.draft.payload
    if not isinstance(payload, DirectionPayload):
        raise ValueError("direction upsert requires direction payload")
    existing = next((item for item in target.active_options if same_text(item.value, payload.value)), None)
    next_item = DirectionOption(
        value=payload.value,
        university_type=payload.university_type,
        status=payload.status,
        confidence=event.draft.confidence,
        supporting_event_ids=[*(existing.supporting_event_ids if existing else []), event.event_id],
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


def apply_counseling_preference(projection: CurrentTruthProjection, event: DurableMemoryEvent) -> None:
    payload = event.draft.payload
    if not isinstance(payload, CounselingPreferencePayload):
        raise ValueError("counseling preference requires preference payload")
    preference = projection.preference.confirmed or ConfirmedCounselingPreference()
    projection.preference.confirmed = preference
    projection.preference.strength = "L4"
    if payload.dimension == "course":
        preference.course_or_program = payload.value
    if payload.dimension == "university":
        preference.university = payload.value
    if payload.dimension == "pathway":
        preference.pathway = payload.value
    preference.confidence = event.draft.confidence
    preference.supporting_event_ids = [*preference.supporting_event_ids, event.event_id]


def apply_handoff_readiness(projection: CurrentTruthProjection, event: DurableMemoryEvent) -> None:
    payload = event.draft.payload
    if not isinstance(payload, HandoffReadinessPayload):
        raise ValueError("handoff readiness requires handoff payload")
    value = payload.value
    projection.handoff.required = True
    if value.get("triggerType"):
        projection.handoff.trigger_types.append(value["triggerType"])
    preference = projection.preference.confirmed
    projection.handoff.context = {
        "selectedCounselingPreference": preference.course_or_program if preference else None,
        "reason": value.get("reason") or payload.status or payload.type,
        "supportingEventIds": [event.event_id],
    }
    projection.preference.strength = "L5"


def apply_route_outcome(projection: CurrentTruthProjection, event: DurableMemoryEvent) -> None:
    payload = event.draft.payload
    if not isinstance(payload, RouteOutcomePayload):
        raise ValueError("route outcome requires route outcome payload")
    if not payload.route_type:
        return
    value = payload.to_json_dict()
    item = RouteOutcomeItem(payload.route_type, payload.outcome, value, event.draft.confidence, [event.event_id])
    route_projection = projection.route_history
    route_projection.outcomes.append(item)
    route_projection.latest_outcome_by_route[payload.route_type] = item
    if payload.outcome == "deferred_decision":
        route_projection.deferrals.append(item)
        route_projection.resume_route_hint = payload.route_type
    if payload.outcome == "student_switched_route":
        route_projection.switches.append(item)
        if payload.next_route_candidate:
            route_projection.resume_route_hint = payload.next_route_candidate
    if payload.outcome == "accepted_fallback":
        route_projection.fallbacks.append(item)
    if payload.outcome == "handoff_required":
        route_projection.handoffs.append(item)


def finalize_direction(projection: CurrentTruthProjection) -> None:
    if not projection.university.active_options:
        location_signal = next((item for item in [*projection.quality_context.hard_constraints, *projection.quality_context.soft_preferences] if isinstance(item.value, dict) and item.value.get("location")), None)
        if location_signal:
            projection.university.active_options.append(DirectionOption("location-based universities", None, "considering", location_signal.confidence, location_signal.supporting_event_ids))
    for truth, option_type in [(projection.course, "course"), (projection.university, "university"), (projection.pathway, "pathway")]:
        truth.active_options = without_rejected(truth.active_options, truth.rejected_options)
        truth.best_option = best_direction(truth.active_options)
        truth.confirmed_option = next((item for item in truth.active_options if item.status == "confirmed_counseling_preference"), None)
        truth.status = direction_status(truth.active_options, option_type)
    preference = projection.preference.confirmed
    if preference and preference.course_or_program:
        projection.course.status = "confirmed_counseling_course_preference"
    if preference and preference.university:
        projection.university.status = "confirmed_counseling_university_preference"
    if preference and preference.pathway:
        projection.pathway.status = "confirmed_counseling_pathway_preference"
    if projection.preference.strength == "none" and has_any_direction(projection):
        projection.preference.strength = strongest_preference(projection)


def finalize_active_direction(projection: CurrentTruthProjection) -> None:
    preference = projection.preference.confirmed
    course = (preference.course_or_program if preference else None) or (projection.course.best_option.value if projection.course.best_option else None)
    university = (preference.university if preference else None) or (projection.university.best_option.value if projection.university.best_option else None)
    pathway = (preference.pathway if preference else None) or (projection.pathway.best_option.value if projection.pathway.best_option else None)
    source_event_ids = []
    for option in [projection.course.best_option, projection.university.best_option, projection.pathway.best_option]:
        if option:
            source_event_ids.extend(option.supporting_event_ids)
    if preference:
        source_event_ids.extend(preference.supporting_event_ids)
    projection.active_direction.course = course
    projection.active_direction.university = university
    projection.active_direction.pathway = pathway
    projection.active_direction.source_event_ids = list(dict.fromkeys(source_event_ids))


def finalize_readiness(projection: CurrentTruthProjection) -> None:
    missing = []
    if projection.academic.status != "known":
        missing.append("academic_result")
    if not is_known_direction(projection.course.status):
        missing.append("course_direction_status")
    if not is_known_direction(projection.university.status):
        missing.append("university_direction_status")
    projection.readiness.missing_route_inputs = missing
    projection.readiness.route_level = "incomplete" if missing else "ready"
    basis = projection.readiness.basis
    basis.has_usable_academic_result = projection.academic.status == "known"
    basis.has_usable_course_direction = is_known_direction(projection.course.status)
    basis.has_usable_university_direction = is_known_direction(projection.university.status)
    basis.has_usable_pathway_direction = is_known_direction(projection.pathway.status)
    basis.has_enough_fit_signals = projection.quality_context.has_fit_signal()
    has_direction = basis.has_any_direction()
    projection.readiness.recommendation_level = "R3" if basis.has_usable_academic_result and has_direction and basis.has_enough_fit_signals else "R2" if basis.has_usable_academic_result and has_direction else "R1"
    missing_recommendation = ([] if basis.has_usable_academic_result else ["academic_result"]) + ([] if has_direction else ["course_or_university_or_pathway_direction"])
    if not basis.has_enough_fit_signals:
        missing_recommendation.append("quality_fit_signal")
    projection.readiness.missing_recommendation_inputs = missing_recommendation
    projection.readiness.confidence = "low" if projection.readiness.recommendation_level == "R1" else "medium"
    projection.quality_context.summary = "; ".join(str(item.value) for item in projection.quality_context.all_items())


def is_known_direction(status: str | None) -> bool:
    return bool(status and status != "unknown")


def same_text(a: object, b: object) -> bool:
    return str(a or "").lower() == str(b or "").lower()


def direction_rank(status: str) -> int:
    return {"considering": 1, "preferred": 2, "confirmed_counseling_preference": 3}.get(status, 0)


def reject_option(projection: CurrentTruthProjection, option_type: str, rejected: RejectedOption) -> None:
    if option_type == "course":
        projection.course.rejected_options.append(rejected)
    elif option_type == "university":
        projection.university.rejected_options.append(rejected)
    elif option_type == "pathway":
        projection.pathway.rejected_options.append(rejected)


def direction_status(options: list[DirectionOption], option_type: str) -> str:
    if any(item.status == "confirmed_counseling_preference" for item in options):
        return f"confirmed_counseling_{option_type}_preference"
    if any(item.status == "preferred" for item in options):
        return f"preferred_{option_type}_exists"
    if options:
        return f"considering_some_{'universities' if option_type == 'university' else f'{option_type}s'}"
    return "unknown"


def without_rejected(options: list[DirectionOption], rejected_options: list[RejectedOption]) -> list[DirectionOption]:
    return [option for option in options if not any(same_text(item.value, option.value) for item in rejected_options)]


def has_any_direction(projection: CurrentTruthProjection) -> bool:
    return bool(projection.course.active_options or projection.university.active_options or projection.pathway.active_options)


def strongest_preference(projection: CurrentTruthProjection) -> str:
    all_directions = [
        *projection.course.active_options,
        *projection.university.active_options,
        *projection.pathway.active_options,
    ]
    return "L3" if any(item.status == "preferred" for item in all_directions) else "L2" if all_directions else "none"


def best_direction(directions: list[DirectionOption]) -> DirectionOption | None:
    return sorted(directions, key=lambda item: direction_rank(item.status), reverse=True)[0] if directions else None
