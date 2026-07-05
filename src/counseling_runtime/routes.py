from __future__ import annotations

from .contracts import ActiveRouteEpisode, BoundaryResult, JsonObject, RouteCandidate

class RouteEpisodeCandidateResolver:
    def resolve(self, current_truth_projection: JsonObject, accepted_semantic_delta: JsonObject | None = None, previous_operating_context: JsonObject | None = None, student_message: str = "") -> RouteCandidate:
        route_signal = next((signal for signal in route_signals(accepted_semantic_delta) if signal.get("routeHint") and signal.get("confidence") in {"medium", "high"}), None)
        route_hint = route_signal.get("routeHint") if route_signal else None
        route_type = route_hint if isinstance(route_hint, str) else derive_route_type(current_truth_projection, student_message)
        return RouteCandidate.model_validate({
            "routeType": route_type,
            "routeGoal": route_goal(route_type),
            "evidence": [*evidence_from_signal(route_signal), *candidate_evidence(current_truth_projection, student_message)],
            "source": {
                "derivedFromCurrentTruth": True,
                "usedAcceptedSemanticDelta": bool(route_signal),
                "usedPriorOperatingContext": bool((previous_operating_context or {}).get("activeRouteEpisode")),
                "usedBoundaryResult": False,
                "usedRouteOutcomeHistory": bool(current_truth_projection.get("routeEpisodeProjection", {}).get("routeOutcomeHistory")),
            },
            "auditReason": f"Route candidate came from route signal {route_signal.get('signalType')}." if route_signal else f"Route candidate derived from current truth as {route_type}.",
        })


class RouteEpisodePlanner:
    def __init__(self, transition_validator: "RouteTransitionValidator | None" = None) -> None:
        self.transition_validator = transition_validator or RouteTransitionValidator()

    def plan(self, boundary_result: BoundaryResult | JsonObject, route_candidate: RouteCandidate, current_truth_projection: JsonObject, accepted_semantic_delta: JsonObject | None = None, previous_operating_context: JsonObject | None = None, student_message: str = "") -> ActiveRouteEpisode:
        prior = (previous_operating_context or {}).get("activeRouteEpisode")
        runtime_signals = (accepted_semantic_delta or {}).get("acceptedRuntimeOnlySignals", [])
        signals = [signal for signal in runtime_signals if signal.get("kind") == "route_episode"]
        previous_route = (prior or {}).get("routeType")
        active_route = route_candidate["routeType"]
        progress_state = progress_state_for_route(route_candidate, current_truth_projection, runtime_signals)
        decision = "continue_active_route"
        priority = "continue_active_route" if previous_route else "initial_route_selection"
        route_outcome_candidate = None
        next_route_candidate = None
        resume_route_candidate = None
        detour_overlay = None
        evidence = route_candidate.get("evidence", [])
        audit_reason = route_candidate.get("auditReason")

        if prior and should_continue_prior_route(prior, route_candidate, signals, boundary_result, current_truth_projection, student_message):
            active_route = prior["routeType"]
            progress_state = progress_state_for_route({**route_candidate.to_json_dict(), "routeType": active_route}, current_truth_projection, runtime_signals)
            audit_reason = f"Continuing sticky active route {active_route}."

        if boundary_result.get("allowedNextBehavior") == "handoff":
            active_route = "handoff_preparation"
            progress_state = "handoff"
            decision = "enter_handoff"
            priority = "human_support_request" if "human_requested_support" in boundary_result.get("detectedSignals", []) else "boundary_override"
            route_outcome_candidate = "handoff_required"
            evidence = boundary_evidence(boundary_result, student_message)
            audit_reason = "Boundary override entered handoff preparation."
        elif has_knowledge_detour(runtime_signals):
            resume_route = previous_route or active_route
            resume_progress_state = (prior or {}).get("progressState") or progress_state
            active_route = resume_route
            progress_state = "detour_resume"
            decision = "enter_detour"
            priority = "detour_resume"
            resume_route_candidate = resume_route
            detour_overlay = {"detourKind": "factual_knowledge", "resumeRoute": resume_route, "resumeProgressState": resume_progress_state, "discoveredSignals": [signal.get("type") for signal in runtime_signals if signal.get("kind") == "knowledge_need"]}
            audit_reason = "Factual detour preserves active route and resume target."
        else:
            switch_signal = next((signal for signal in signals if signal.get("signalType") == "student_led_route_switch_signal" and signal.get("routeHint")), None)
            deferral_signal = next((signal for signal in signals if signal.get("signalType") == "route_deferral_signal"), None)
            confirmation_signal = next((signal for signal in signals if signal.get("signalType") == "route_confirmation_signal"), None)
            if switch_signal and switch_signal.get("routeHint") != previous_route:
                decision = "switch_route"
                priority = "student_led_route_switch"
                route_outcome_candidate = "student_switched_route"
                next_route_candidate = switch_signal["routeHint"]
                active_route = switch_signal["routeHint"]
                progress_state = "opening"
                evidence = switch_signal.get("evidence", evidence)
                audit_reason = f"Student explicitly switched route to {active_route}."
            elif confirmation_signal or has_confirmed_preference_for_route(current_truth_projection, active_route):
                decision = "complete_route"
                priority = "active_route_outcome_reached"
                route_outcome_candidate = "confirmed_preference"
                progress_state = "confirmed_preference"
                evidence = (confirmation_signal or {}).get("evidence", evidence)
                audit_reason = "Explicit confirmed counseling preference is a route outcome candidate."
            elif deferral_signal:
                decision = "defer_route"
                priority = "loop_risk_or_deferral"
                route_outcome_candidate = "deferred_decision"
                progress_state = "deferral_indecision"
                evidence = (deferral_signal or {}).get("evidence", evidence)
                audit_reason = "Student deferred or remained indecisive."

        transition_decision = {
            "decision": decision,
            "priority": priority,
            **({"previousRoute": previous_route} if previous_route else {}),
            "activeRoute": active_route,
            "progressState": progress_state,
            **({"routeOutcome": route_outcome_candidate} if route_outcome_candidate else {}),
            **({"nextRouteCandidate": next_route_candidate} if next_route_candidate else {}),
            **({"resumeRouteCandidate": resume_route_candidate} if resume_route_candidate else {}),
            "evidence": evidence,
            "requiresValidation": bool(route_outcome_candidate or decision == "switch_route"),
            "auditReason": audit_reason,
        }

        return ActiveRouteEpisode.model_validate({
            "routeType": active_route,
            "routeGoal": route_goal(active_route),
            "progressState": progress_state,
            "transitionDecision": transition_decision,
            "recommendationReadiness": current_truth_projection["recommendationReadiness"]["level"],
            "preferenceStrength": current_truth_projection["preference"]["preferenceStrength"],
            "activeDirections": active_directions(current_truth_projection),
            "routeConstraints": [*current_truth_projection["qualityContext"]["hardConstraints"], *current_truth_projection["qualityContext"]["softPreferences"]],
            "decisionBlockers": current_truth_projection["decisionContext"]["currentDecisionBlockers"],
            **({"routeOutcomeCandidate": route_outcome_candidate} if route_outcome_candidate else {}),
            **({"nextRouteCandidate": next_route_candidate} if next_route_candidate else {}),
            **({"resumeRouteCandidate": resume_route_candidate} if resume_route_candidate else {}),
            **({"detourOverlay": detour_overlay} if detour_overlay else {}),
            "transitionValidation": self.transition_validator.validate(transition_decision),
            "source": {**route_candidate.get("source", {}), "usedPriorOperatingContext": bool(prior), "usedBoundaryResult": bool(boundary_result)},
        })


class RouteTransitionValidator:
    def validate(self, decision: JsonObject) -> JsonObject:
        errors = []
        if not decision.get("decision"):
            errors.append("transition_decision_missing")
        if not decision.get("priority"):
            errors.append("transition_priority_missing")
        if not decision.get("activeRoute"):
            errors.append("active_route_missing")
        if not decision.get("progressState"):
            errors.append("progress_state_missing")
        if decision.get("decision") == "switch_route" and not has_evidence(decision):
            errors.append("student_led_switch_requires_evidence")
        if decision.get("priority") == "boundary_override" and decision.get("activeRoute") != "handoff_preparation":
            errors.append("boundary_override_must_enter_handoff_preparation")
        return {"status": "reject" if errors else "valid", "errors": errors, "warnings": []}


class RouteOutcomeValidator:
    def validate(self, operating_context: JsonObject, accepted_semantic_delta: JsonObject, boundary_result: BoundaryResult | JsonObject) -> JsonObject:
        route = operating_context.get("activeRouteEpisode") or {}
        candidate = route.get("routeOutcomeCandidate")
        if not candidate:
            return {"status": "not_applicable", "validationEvents": []}
        errors = []
        if candidate not in {"confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"}:
            errors.append("route_outcome_invalid")
        if candidate == "confirmed_preference" and not supports_confirmed_preference(accepted_semantic_delta):
            errors.append("confirmed_route_outcome_requires_explicit_confirmation")
        if candidate == "handoff_required" and boundary_result.get("allowedNextBehavior") != "handoff":
            errors.append("handoff_route_outcome_requires_red_boundary")
        if candidate == "student_switched_route" and not has_evidence(route.get("transitionDecision", {})):
            errors.append("route_switch_outcome_requires_evidence")
        status = "reject" if errors else "accepted"
        return {
            "status": status,
            "errors": errors,
            "routeOutcomeOutput": None if errors else {
                "type": "route_outcome",
                "value": {
                    "outcome": candidate,
                    "routeType": route.get("routeType"),
                    "progressState": route.get("progressState"),
                    "previousRoute": route.get("transitionDecision", {}).get("previousRoute"),
                    "nextRouteCandidate": route.get("nextRouteCandidate"),
                    "resumeRouteCandidate": route.get("resumeRouteCandidate"),
                    "reason": route.get("transitionDecision", {}).get("auditReason"),
                },
                "confidence": "high" if candidate in {"confirmed_preference", "handoff_required"} else "medium",
                "evidence": route.get("transitionDecision", {}).get("evidence", []),
            },
            "validationEvents": [{"type": "route_outcome_accepted" if status == "accepted" else "route_outcome_rejected", "severity": "info" if status == "accepted" else "warning", "message": f"{candidate} {'accepted' if status == 'accepted' else 'rejected'} for {route.get('routeType')}."}],
        }


def derive_route_type(current_truth: JsonObject, text: str = "") -> str:
    has_academic = current_truth["academic"]["academicResultStatus"] == "known"
    course_known = is_known_direction(current_truth["direction"]["courseDirectionStatus"])
    university_known = is_known_direction(current_truth["direction"]["universityDirectionStatus"])
    pathway_known = is_known_direction(current_truth["direction"]["pathwayDirectionStatus"])
    if not has_academic:
        return "initial_route_selection"
    if pathway_known and not (course_known and university_known):
        return "pathway_exploration"
    if not course_known and not university_known:
        return "course_exploration"
    if course_known and not university_known:
        return "university_exploration"
    if not course_known and university_known:
        return "course_exploration_within_university_context"
    return "combined_option_validation"


def route_goal(route_type: str) -> str:
    return {
        "initial_route_selection": "Identify the first useful counseling route.",
        "course_exploration": "Help the student resolve course or program direction.",
        "university_exploration": "Help the student resolve university direction.",
        "course_exploration_within_university_context": "Help the student choose a course within the university context.",
        "pathway_exploration": "Help the student resolve pathway direction.",
        "combined_option_validation": "Validate the combined counseling option before confirmation.",
        "handoff_preparation": "Prepare safe human handoff context.",
    }.get(route_type, "Guide the current counseling route.")


def route_signals(accepted_semantic_delta: JsonObject | None) -> list[JsonObject]:
    return [signal for signal in (accepted_semantic_delta or {}).get("acceptedRuntimeOnlySignals", []) if signal.get("kind") == "route_episode"]


def evidence_from_signal(signal: JsonObject | None) -> list[JsonObject]:
    return (signal or {}).get("evidence", [])


def candidate_evidence(current_truth: JsonObject, student_message: str) -> list[JsonObject]:
    return [{"quote": student_message or "current truth projection", "source": "current_truth_projection", "basis": {
        "academicResultStatus": current_truth["academic"]["academicResultStatus"],
        "courseDirectionStatus": current_truth["direction"]["courseDirectionStatus"],
        "universityDirectionStatus": current_truth["direction"]["universityDirectionStatus"],
        "pathwayDirectionStatus": current_truth["direction"]["pathwayDirectionStatus"],
    }}]


def should_continue_prior_route(prior: JsonObject, route_candidate: RouteCandidate, route_signals_: list[JsonObject], boundary_result: BoundaryResult | JsonObject, current_truth_projection: JsonObject, student_message: str) -> bool:
    if not prior.get("routeType") or prior.get("routeType") == "initial_route_selection" or prior.get("progressState") == "completed":
        return False
    if boundary_result.get("allowedNextBehavior") == "handoff":
        return False
    if any(signal.get("signalType") == "student_led_route_switch_signal" for signal in route_signals_):
        return False
    if route_candidate.get("routeType") == "handoff_preparation":
        return False
    if route_candidate.get("routeType") != prior.get("routeType") and route_is_resolved(current_truth_projection, prior["routeType"], student_message):
        return False
    return True


def progress_state_for_route(route_candidate: RouteCandidate | JsonObject, current_truth_projection: JsonObject, runtime_signals: list[JsonObject]) -> str:
    if route_candidate["routeType"] == "initial_route_selection":
        return "opening"
    if has_student_posture(runtime_signals, "comparison_oriented"):
        return "comparison"
    if any(signal.get("kind") == "route_episode" and signal.get("signalType") == "route_deferral_signal" for signal in runtime_signals):
        return "deferral_indecision"
    if has_confirmed_preference_for_route(current_truth_projection, route_candidate["routeType"]):
        return "confirmed_preference"
    if current_truth_projection["recommendationReadiness"]["level"] in {"R2", "R3"} and route_candidate["routeType"] in {"university_exploration", "combined_option_validation"}:
        return "recommendation_ready"
    return "exploration"


def has_knowledge_detour(runtime_signals: list[JsonObject]) -> bool:
    return any(signal.get("kind") == "knowledge_need" for signal in runtime_signals)


def has_confirmed_preference_for_route(current_truth: JsonObject, route_type: str) -> bool:
    if current_truth["preference"]["preferenceStrength"] != "L4":
        return False
    if current_truth["routeEpisodeProjection"]["latestRouteOutcomeByRoute"].get(route_type, {}).get("outcome") == "confirmed_preference":
        return False
    preference = current_truth["preference"].get("confirmedCounselingPreference", {})
    return bool(
        (route_type == "course_exploration" and preference.get("courseOrProgram"))
        or (route_type == "university_exploration" and preference.get("university"))
        or (route_type == "pathway_exploration" and preference.get("pathway"))
        or (route_type == "course_exploration_within_university_context" and preference.get("courseOrProgram"))
        or (route_type == "combined_option_validation" and preference.get("courseOrProgram") and preference.get("university"))
    )


def active_directions(current_truth: JsonObject) -> JsonObject:
    course = best_direction(current_truth["direction"]["activeCourseDirections"])
    university = best_direction(current_truth["direction"]["activeUniversityDirections"])
    pathway = best_direction(current_truth["direction"]["activePathwayDirections"])
    return {**({"course": course["value"]} if course else {}), **({"university": university["value"]} if university else {}), **({"pathway": pathway["value"]} if pathway else {})}


def route_is_resolved(current_truth: JsonObject, route_type: str, student_message: str) -> bool:
    if current_truth["routeEpisodeProjection"]["latestRouteOutcomeByRoute"].get(route_type):
        return True
    if route_type == "course_exploration":
        return current_truth["direction"]["courseDirectionStatus"] == "confirmed_counseling_course_preference"
    if route_type == "university_exploration":
        return current_truth["direction"]["universityDirectionStatus"] == "confirmed_counseling_university_preference"
    if route_type == "pathway_exploration":
        return current_truth["direction"]["pathwayDirectionStatus"] == "confirmed_counseling_pathway_preference"
    return False


def supports_confirmed_preference(accepted_semantic_delta: JsonObject) -> bool:
    flow = accepted_semantic_delta.get("acceptedMemoryDeltas", {}).get("flowDrivingDeltas", {})
    return bool(flow.get("confirmedCounselingCoursePreferences") or flow.get("confirmedCounselingUniversityPreferences") or flow.get("confirmedCounselingPathwayPreferences"))


def has_evidence(decision: JsonObject) -> bool:
    return any(isinstance(item, dict) and str(item.get("quote", "")).strip() for item in decision.get("evidence", []))


def is_known_direction(status: str | None) -> bool:
    return bool(status and status != "unknown")


def best_direction(directions: list[JsonObject]) -> JsonObject | None:
    return sorted(directions, key=lambda item: direction_rank(str(item.get("status") or "")), reverse=True)[0] if directions else None


def direction_rank(status: str | None) -> int:
    return {"confirmed_counseling_preference": 3, "preferred": 2, "considering": 1}.get(status or "", 0)


def boundary_evidence(boundary_result: BoundaryResult | JsonObject, student_message: str) -> list[JsonObject]:
    return [{"quote": student_message or boundary_result.get("aiBoundaryReason") or "Boundary override", "source": "boundary_result", "triggerType": boundary_result.get("triggerType")}]


def has_student_posture(runtime_signals: list[JsonObject], posture: str) -> bool:
    return any(signal.get("kind") == "student_posture" and signal.get("posture") == posture for signal in runtime_signals)
