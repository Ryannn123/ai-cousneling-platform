from __future__ import annotations

from .current_truth_draft import CurrentTruthDraft, direction_rank, same_text
from .current_truth_schema import CurrentTruthProjection, DirectionOption, RejectedOption


class CurrentTruthDeriver:
    def derive(self, draft: CurrentTruthDraft) -> CurrentTruthProjection:
        projection = build_projection(draft)
        finalize_direction(projection)
        finalize_active_direction(projection)
        finalize_readiness(projection)
        return projection


def build_projection(draft: CurrentTruthDraft) -> CurrentTruthProjection:
    projection = CurrentTruthProjection.empty(draft.student_id, draft.source_events)
    projection.academic = draft.academic
    projection.course = draft.course
    projection.university = draft.university
    projection.pathway = draft.pathway
    projection.preference = draft.preference
    projection.quality_context = draft.quality_context
    projection.decision_blockers = draft.decision_blockers
    projection.recommendation_history = draft.recommendation_history
    projection.handoff = draft.handoff
    projection.route_history = draft.route_history
    return projection


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
