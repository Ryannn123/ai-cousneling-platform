from __future__ import annotations

from .contracts import ActiveRouteEpisode, JsonObject, RouteCandidate, RouteDetourOverlay, RouteSource, RouteTransitionDecision, RouteTransitionValidation
from .boundary import BoundaryResult
from .current_truth_schema import CurrentTruthProjection
from .semantic_delta import AcceptedSemanticDelta
from .schemas import Evidence, KnowledgeNeedSignal, RouteEpisodeSignal, RuntimeOnlySignal, StudentPostureSignal, RouteType

class RouteEpisodeCandidateResolver:
    def resolve(self, current_truth_projection: CurrentTruthProjection, accepted_semantic_delta: AcceptedSemanticDelta, previous_operating_context: JsonObject | None = None, student_message: str = "") -> RouteCandidate:
        
        route_signal = next((signal for signal in route_signals(accepted_semantic_delta) if signal.routeHint and signal.confidence in {"medium", "high"}), None)
        
        route_hint = route_signal.routeHint if route_signal else None
        route_type = route_hint if route_hint else derive_route_type(current_truth_projection)
        
        return RouteCandidate(
            routeType=route_type,
            routeGoal=route_goal(route_type),
            evidence=[*evidence_from_signal(route_signal), *candidate_evidence(current_truth_projection, student_message)],
            source=RouteSource(
                derivedFromCurrentTruth=True,
                usedAcceptedSemanticDelta=bool(route_signal),
                usedPriorOperatingContext=bool((previous_operating_context or {}).get("activeRouteEpisode")),
                usedBoundaryResult=False,
                usedRouteOutcomeHistory=bool(current_truth_projection.route_history.outcomes),
            ),
            auditReason=f"Route candidate came from route signal {route_signal.signalType}." if route_signal else f"Route candidate derived from current truth as {route_type}.",
        )


class RouteEpisodePlanner:
    def __init__(self, transition_validator: "RouteTransitionValidator | None" = None) -> None:
        self.transition_validator = transition_validator or RouteTransitionValidator()

    def plan(self, boundary_result: BoundaryResult, route_candidate: RouteCandidate, current_truth_projection: CurrentTruthProjection, accepted_semantic_delta: AcceptedSemanticDelta, previous_operating_context: JsonObject | None = None, student_message: str = "") -> ActiveRouteEpisode:
        
        prior = prior_route_episode(previous_operating_context)
        runtime_signals = accepted_semantic_delta.accepted_runtime_only_signals
        signals = route_signals(accepted_semantic_delta)
        
        previous_route = prior.routeType if prior else None
        active_route = route_candidate.routeType
        
        progress_state = progress_state_for_route(active_route, current_truth_projection, runtime_signals)
        
        decision = "continue_active_route"
        priority = "continue_active_route" if previous_route else "initial_route_selection"
        route_outcome_candidate: str | None = None
        next_route_candidate: str | None = None
        resume_route_candidate: str | None = None
        detour_overlay: RouteDetourOverlay | None = None
        evidence = route_candidate.evidence
        audit_reason = route_candidate.auditReason

        if prior and should_continue_prior_route(prior, route_candidate, signals, boundary_result, current_truth_projection):
            active_route = prior.routeType
            progress_state = progress_state_for_route(active_route, current_truth_projection, runtime_signals)
            audit_reason = f"Continuing sticky active route {active_route}."

        if boundary_result.allowedNextBehavior == "handoff":
            active_route = "handoff_preparation"
            progress_state = "handoff"
            decision = "enter_handoff"
            priority = "human_support_request" if "human_requested_support" in boundary_result.detectedSignals else "boundary_override"
            route_outcome_candidate = "handoff_required"
            evidence = boundary_evidence(boundary_result, student_message)
            audit_reason = "Boundary override entered handoff preparation."
        elif has_knowledge_detour(runtime_signals):
            resume_route = previous_route or active_route
            resume_progress_state = prior.progressState if prior else progress_state
            active_route = resume_route
            progress_state = "detour_resume"
            decision = "enter_detour"
            priority = "detour_resume"
            resume_route_candidate = resume_route
            detour_overlay = RouteDetourOverlay(
                detourKind="factual_knowledge",
                resumeRoute=resume_route,
                resumeProgressState=resume_progress_state,
                discoveredSignals=[signal.type for signal in runtime_signals if isinstance(signal, KnowledgeNeedSignal)],
            )
            audit_reason = "Factual detour preserves active route and resume target."
        else:
            switch_signal = next((signal for signal in signals if signal.signalType == "student_led_route_switch_signal" and signal.routeHint), None)
            deferral_signal = next((signal for signal in signals if signal.signalType == "route_deferral_signal"), None)
            confirmation_signal = next((signal for signal in signals if signal.signalType == "route_confirmation_signal"), None)
            if switch_signal and switch_signal.routeHint and switch_signal.routeHint != previous_route:
                route_hint = switch_signal.routeHint
                decision = "switch_route"
                priority = "student_led_route_switch"
                route_outcome_candidate = "student_switched_route"
                next_route_candidate = route_hint
                active_route = route_hint
                progress_state = "opening"
                evidence = evidence_from_signal(switch_signal) or evidence
                audit_reason = f"Student explicitly switched route to {active_route}."
            elif confirmation_signal or has_confirmed_preference_for_route(current_truth_projection, active_route):
                decision = "complete_route"
                priority = "active_route_outcome_reached"
                route_outcome_candidate = "confirmed_preference"
                progress_state = "confirmed_preference"
                evidence = evidence_from_signal(confirmation_signal) if confirmation_signal else evidence
                audit_reason = "Explicit confirmed counseling preference is a route outcome candidate."
            elif deferral_signal:
                decision = "defer_route"
                priority = "loop_risk_or_deferral"
                route_outcome_candidate = "deferred_decision"
                progress_state = "deferral_indecision"
                evidence = evidence_from_signal(deferral_signal) or evidence
                audit_reason = "Student deferred or remained indecisive."

        transition_decision = RouteTransitionDecision(
            decision=decision,
            priority=priority,
            previousRoute=previous_route,
            activeRoute=active_route,
            progressState=progress_state,
            routeOutcome=route_outcome_candidate,
            nextRouteCandidate=next_route_candidate,
            resumeRouteCandidate=resume_route_candidate,
            evidence=evidence,
            requiresValidation=bool(route_outcome_candidate or decision == "switch_route"),
            auditReason=audit_reason,
        )

        return ActiveRouteEpisode(
            routeType=active_route,
            routeGoal=route_goal(active_route),
            progressState=progress_state,
            transitionDecision=transition_decision,
            recommendationReadiness=current_truth_projection.readiness.recommendation_level,
            preferenceStrength=current_truth_projection.preference.strength,
            activeDirections=active_directions(current_truth_projection),
            routeConstraints=[item.to_json_dict() for item in [*current_truth_projection.quality_context.hard_constraints, *current_truth_projection.quality_context.soft_preferences]],
            decisionBlockers=[item.to_json_dict() for item in current_truth_projection.decision_blockers],
            routeOutcomeCandidate=route_outcome_candidate,
            nextRouteCandidate=next_route_candidate,
            resumeRouteCandidate=resume_route_candidate,
            detourOverlay=detour_overlay,
            transitionValidation=self.transition_validator.validate(transition_decision),
            source=route_candidate.source.model_copy(update={"usedPriorOperatingContext": bool(prior), "usedBoundaryResult": bool(boundary_result)}),
        )


class RouteTransitionValidator:
    def validate(self, decision: RouteTransitionDecision) -> RouteTransitionValidation:
        errors = []
        if not decision.decision:
            errors.append("transition_decision_missing")
        if not decision.priority:
            errors.append("transition_priority_missing")
        if not decision.activeRoute:
            errors.append("active_route_missing")
        if not decision.progressState:
            errors.append("progress_state_missing")
        if decision.decision == "switch_route" and not has_evidence(decision):
            errors.append("student_led_switch_requires_evidence")
        if decision.priority == "boundary_override" and decision.activeRoute != "handoff_preparation":
            errors.append("boundary_override_must_enter_handoff_preparation")
        return RouteTransitionValidation(status="reject" if errors else "valid", errors=errors, warnings=[])


class RouteOutcomeValidator:
    def validate(self, operating_context: JsonObject, accepted_semantic_delta: AcceptedSemanticDelta, boundary_result: BoundaryResult) -> JsonObject:
        route = active_route_episode_from_value(operating_context.get("activeRouteEpisode"))
        if not route or not route.routeOutcomeCandidate:
            return {"status": "not_applicable", "validationEvents": []}
        candidate = route.routeOutcomeCandidate
        errors = []
        if candidate not in {"confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"}:
            errors.append("route_outcome_invalid")
        if candidate == "confirmed_preference" and not supports_confirmed_preference(accepted_semantic_delta):
            errors.append("confirmed_route_outcome_requires_explicit_confirmation")
        if candidate == "handoff_required" and boundary_result.allowedNextBehavior != "handoff":
            errors.append("handoff_route_outcome_requires_red_boundary")
        if candidate == "student_switched_route" and not has_evidence(route.transitionDecision):
            errors.append("route_switch_outcome_requires_evidence")
        status = "reject" if errors else "accepted"
        return {
            "status": status,
            "errors": errors,
            "routeOutcomeOutput": None if errors else {
                "type": "route_outcome",
                "value": {
                    "outcome": candidate,
                    "routeType": route.routeType,
                    "progressState": route.progressState,
                    "previousRoute": route.transitionDecision.previousRoute,
                    "nextRouteCandidate": route.nextRouteCandidate,
                    "resumeRouteCandidate": route.resumeRouteCandidate,
                    "reason": route.transitionDecision.auditReason,
                },
                "confidence": "high" if candidate in {"confirmed_preference", "handoff_required"} else "medium",
                "evidence": route.transitionDecision.evidence,
            },
            "validationEvents": [{"type": "route_outcome_accepted" if status == "accepted" else "route_outcome_rejected", "severity": "info" if status == "accepted" else "warning", "message": f"{candidate} {'accepted' if status == 'accepted' else 'rejected'} for {route.routeType}."}],
        }


def derive_route_type(current_truth: CurrentTruthProjection) -> RouteType:
    has_academic = current_truth.academic.status == "known"
    course_known = is_known_direction(current_truth.course.status)
    university_known = is_known_direction(current_truth.university.status)
    pathway_known = is_known_direction(current_truth.pathway.status)
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


def route_signals(accepted_semantic_delta: AcceptedSemanticDelta) -> list[RouteEpisodeSignal]:
    return [signal for signal in accepted_semantic_delta.accepted_runtime_only_signals if isinstance(signal, RouteEpisodeSignal)]


def evidence_from_signal(signal: RouteEpisodeSignal | None) -> list[JsonObject]:
    return [evidence_to_json(item) for item in signal.evidence] if signal else []


def evidence_to_json(evidence: Evidence) -> JsonObject:
    return {"quote": evidence.quote}


def candidate_evidence(current_truth: CurrentTruthProjection, student_message: str) -> list[JsonObject]:
    return [{"quote": student_message or "current truth projection", "source": "current_truth_projection", "basis": {
        "academicResultStatus": current_truth.academic.status,
        "courseDirectionStatus": current_truth.course.status,
        "universityDirectionStatus": current_truth.university.status,
        "pathwayDirectionStatus": current_truth.pathway.status,
    }}]


def should_continue_prior_route(prior: ActiveRouteEpisode, route_candidate: RouteCandidate, route_signals_: list[RouteEpisodeSignal], boundary_result: BoundaryResult, current_truth_projection: CurrentTruthProjection) -> bool:
    if prior.routeType == "initial_route_selection" or prior.progressState == "completed":
        return False
    if boundary_result.allowedNextBehavior == "handoff":
        return False
    if any(signal.signalType == "student_led_route_switch_signal" for signal in route_signals_):
        return False
    if route_candidate.routeType == "handoff_preparation":
        return False
    if route_candidate.routeType != prior.routeType and route_is_resolved(current_truth_projection, prior.routeType):
        return False
    return True


def progress_state_for_route(route_type: RouteType, current_truth_projection: CurrentTruthProjection, runtime_signals: list[RuntimeOnlySignal]) -> str:
    if route_type == "initial_route_selection":
        return "opening"
    if has_student_posture(runtime_signals, "comparison_oriented"):
        return "comparison"
    if any(isinstance(signal, RouteEpisodeSignal) and signal.signalType == "route_deferral_signal" for signal in runtime_signals):
        return "deferral_indecision"
    if has_confirmed_preference_for_route(current_truth_projection, route_type):
        return "confirmed_preference"
    if current_truth_projection.readiness.recommendation_level in {"R2", "R3"} and route_type in {"university_exploration", "combined_option_validation"}:
        return "recommendation_ready"
    return "exploration"


def has_knowledge_detour(runtime_signals: list[RuntimeOnlySignal]) -> bool:
    return any(isinstance(signal, KnowledgeNeedSignal) for signal in runtime_signals)


def has_confirmed_preference_for_route(current_truth: CurrentTruthProjection, route_type: RouteType) -> bool:
    if current_truth.preference.strength != "L4":
        return False
    route_outcome = current_truth.route_history.latest_outcome_by_route.get(route_type)
    if route_outcome and route_outcome.outcome == "confirmed_preference":
        return False
    preference = current_truth.preference.confirmed
    if not preference:
        return False
    return bool(
        (route_type == "course_exploration" and preference.course_or_program)
        or (route_type == "university_exploration" and preference.university)
        or (route_type == "pathway_exploration" and preference.pathway)
        or (route_type == "course_exploration_within_university_context" and preference.course_or_program)
        or (route_type == "combined_option_validation" and preference.course_or_program and preference.university)
    )


def active_directions(current_truth: CurrentTruthProjection) -> JsonObject:
    return {
        **({"course": current_truth.active_direction.course} if current_truth.active_direction.course else {}),
        **({"university": current_truth.active_direction.university} if current_truth.active_direction.university else {}),
        **({"pathway": current_truth.active_direction.pathway} if current_truth.active_direction.pathway else {}),
    }


def route_is_resolved(current_truth: CurrentTruthProjection, route_type: RouteType) -> bool:
    if current_truth.route_history.latest_outcome_by_route.get(route_type):
        return True
    if route_type == "course_exploration":
        return current_truth.course.status == "confirmed_counseling_course_preference"
    if route_type == "university_exploration":
        return current_truth.university.status == "confirmed_counseling_university_preference"
    if route_type == "pathway_exploration":
        return current_truth.pathway.status == "confirmed_counseling_pathway_preference"
    return False


def supports_confirmed_preference(accepted_semantic_delta: AcceptedSemanticDelta) -> bool:
    if not isinstance(accepted_semantic_delta, AcceptedSemanticDelta):
        return False
    return any(delta.status == "confirmed_counseling_preference" for delta in accepted_semantic_delta.accepted_memory_deltas.flowDrivingDeltas.directions)


def has_evidence(decision: RouteTransitionDecision) -> bool:
    return any(str(item.get("quote", "")).strip() for item in decision.evidence)


def is_known_direction(status: str | None) -> bool:
    return bool(status and status != "unknown")


def boundary_evidence(boundary_result: BoundaryResult, student_message: str) -> list[JsonObject]:
    return [{"quote": student_message or boundary_result.aiBoundaryReason or "Boundary override", "source": "boundary_result", "triggerType": boundary_result.triggerType}]


def has_student_posture(runtime_signals: list[RuntimeOnlySignal], posture: str) -> bool:
    return any(isinstance(signal, StudentPostureSignal) and signal.posture == posture for signal in runtime_signals)


def prior_route_episode(previous_operating_context: JsonObject | None) -> ActiveRouteEpisode | None:
    return active_route_episode_from_value((previous_operating_context or {}).get("activeRouteEpisode"))


def active_route_episode_from_value(value: object) -> ActiveRouteEpisode | None:
    if value is None:
        return None
    if isinstance(value, ActiveRouteEpisode):
        return value
    return ActiveRouteEpisode.model_validate(value)
