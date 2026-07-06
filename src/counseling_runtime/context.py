from __future__ import annotations

from .contracts import ActiveRouteEpisode, JsonObject, TurnInput
from .boundary import BoundaryResult
from .current_truth_schema import CurrentTruthProjection
from .semantic_delta import AcceptedSemanticDeltaInput, accepted_runtime_only_signals


def build_operating_context(
    previous_state: JsonObject,
    turn_input: TurnInput,
    boundary_result: BoundaryResult,
    accepted_semantic_delta: AcceptedSemanticDeltaInput,
    current_truth: CurrentTruthProjection,
    active_route_episode: ActiveRouteEpisode,
) -> JsonObject:
    runtime_signals = accepted_runtime_only_signals(accepted_semantic_delta)
    has_ambiguity = any(signal.get("kind") == "ambiguity" for signal in runtime_signals)
    primary_action = (
        "clarify_ambiguity"
        if has_ambiguity and boundary_result.allowedNextBehavior == "continue"
        else action_from_route(boundary_result, active_route_episode)
    )
    posture = next((signal.get("posture") for signal in runtime_signals if signal.get("kind") == "student_posture"), None)
    posture = posture or posture_from_route(active_route_episode)
    mode = response_mode_from_route(boundary_result, active_route_episode, posture, has_ambiguity)
    context = {
        "currentZone": boundary_result.finalZone,
        "boundary": boundary_result.to_json_dict(),
        "activeRouteEpisode": active_route_episode,
        "primaryCounselingAction": primary_action,
        "recommendationReadiness": current_truth.readiness.recommendation_level,
        "preferenceStrength": current_truth.preference.strength,
        "handoffStatus": boundary_result.handoffStatus,
        "currentTruth": current_truth_summary(current_truth),
        "studentPosture": posture,
        "decisionSupportMode": decision_support_mode(active_route_episode),
        "summaryCheckpointStatus": "required" if mode in {"summary_checkpoint", "milestone_confirmation"} else "not_required",
        "milestoneConfirmationStatus": "required" if active_route_episode.get("progressState") == "confirmed_preference" else "not_applicable",
        "nextBestCounselingMove": next_best_move(boundary_result, active_route_episode),
        "validationRequirements": validation_requirements(boundary_result, active_route_episode),
        "counselorResponseMode": mode,
    }
    active_direction = active_direction_from_current_truth(current_truth)
    if active_direction:
        context["activeStudentDirection"] = active_direction
    return context


def action_from_route(boundary_result: BoundaryResult, route: ActiveRouteEpisode | JsonObject) -> str:
    if boundary_result.allowedNextBehavior == "handoff":
        return "prepare_handoff"
    if boundary_result.allowedNextBehavior == "clarify":
        return "clarify_ambiguity"
    if route.get("progressState") == "detour_resume":
        return "answer_detour"
    if route.get("progressState") == "comparison":
        return "compare_shortlist"
    if route.get("progressState") == "confirmed_preference":
        return "confirm_counseling_preference"
    if route.get("progressState") in {"deferral_indecision", "decision_support"}:
        return "support_decision"
    if route.get("progressState") == "recommendation_ready":
        return "recommend_directionally"
    if route.get("routeType") == "initial_route_selection":
        return "orient_initial_route"
    return "explore_route"


def response_mode_from_route(boundary_result: BoundaryResult, route: ActiveRouteEpisode | JsonObject, posture: str | None, has_ambiguity: bool = False) -> str:
    if boundary_result.allowedNextBehavior == "handoff":
        return "handoff_safe"
    if boundary_result.allowedNextBehavior == "clarify" or has_ambiguity:
        return "clarify_once"
    if route.get("progressState") == "confirmed_preference":
        return "milestone_confirmation"
    if route.get("progressState") in {"comparison", "decision_support", "deferral_indecision"}:
        return "decision_support"
    if route.get("progressState") == "detour_resume":
        return "standard"
    if posture == "lost_or_confused" or route.get("routeType") == "initial_route_selection":
        return "reassuring_orientation"
    if route.get("routeType") in {"university_exploration", "course_exploration_within_university_context"}:
        return "route_explanation"
    return "standard"


def posture_from_route(route: ActiveRouteEpisode | JsonObject) -> str:
    route_type = route.get("routeType")
    return {
        "university_exploration": "course_first",
        "course_exploration_within_university_context": "university_first",
        "pathway_exploration": "pathway_first",
        "combined_option_validation": "validation_seeking",
        "course_exploration": "lost_or_confused",
    }.get(route_type if isinstance(route_type, str) else "", "just_browsing")


def decision_support_mode(route: ActiveRouteEpisode | JsonObject) -> str | None:
    if route.get("progressState") == "comparison":
        return "clarify_tradeoff"
    if route.get("progressState") == "deferral_indecision":
        return "reflect_blocker"
    return None


def next_best_move(boundary_result: BoundaryResult, route: ActiveRouteEpisode | JsonObject) -> str:
    if boundary_result.allowedNextBehavior == "handoff":
        return "Prepare handoff without completing any official action."
    if boundary_result.allowedNextBehavior == "clarify":
        return "Clarify whether the student means counseling preference or official action."
    moves = {
        "detour_resume": "Answer factual detour with known facts or caveats, then resume the active route.",
        "comparison": "Compare or shortlist options inside the active route.",
        "confirmed_preference": "Confirm counseling preference without treating it as official action.",
        "deferral_indecision": "Support deferral or indecision without forcing a choice.",
        "recommendation_ready": "Give a directional recommendation or ask one route-fit question.",
    }
    progress_state = route.get("progressState")
    return moves.get(progress_state if isinstance(progress_state, str) else "", default_move(route))


def validation_requirements(boundary_result: BoundaryResult, route: ActiveRouteEpisode | JsonObject) -> list[str]:
    return [
        "official_action_boundary",
        *(["handoff_safe_response"] if boundary_result.allowedNextBehavior == "handoff" else []),
        *(["route_outcome_validation"] if route.get("routeOutcomeCandidate") else []),
        *(["route_transition_validation"] if route.get("transitionDecision", {}).get("requiresValidation") else []),
    ]


def current_truth_summary(current_truth: CurrentTruthProjection) -> JsonObject:
    return {
        "academicResultStatus": current_truth.academic.status,
        "courseDirectionStatus": current_truth.course.status,
        "universityDirectionStatus": current_truth.university.status,
        "pathwayDirectionStatus": current_truth.pathway.status,
        "activeDirection": current_truth.active_direction.to_json_dict(),
        "routeHistory": current_truth.route_history.to_json_dict(),
        "routeReadiness": current_truth.readiness.route_level,
        "preferenceStrength": current_truth.preference.strength,
        "recommendationReadiness": current_truth.readiness.recommendation_level,
        "handoffRequired": current_truth.handoff.required,
    }


def active_direction_from_current_truth(current_truth: CurrentTruthProjection) -> JsonObject | None:
    course = current_truth.active_direction.course
    university = current_truth.active_direction.university
    pathway = current_truth.active_direction.pathway
    return {**({"courseOrProgram": course} if course else {}), **({"university": university} if university else {}), **({"pathway": pathway} if pathway else {})} or None


def default_move(route: ActiveRouteEpisode | JsonObject) -> str:
    if route.get("routeType") == "initial_route_selection":
        return "Ask one useful question to identify the first counseling route."
    return "Explore the active route and ask one purposeful next question."
