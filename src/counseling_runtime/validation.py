from __future__ import annotations

from copy import deepcopy

from .contracts import JsonObject, SkillSelection, ValidationResult
from .boundary import BoundaryResult
from .routes import RouteOutcomeValidator, route_goal
from .safety import (
    claims_official_completion,
    claims_route_completion,
    contains_non_official_clarification,
    contains_old_minimum_profile_language,
)
from .schemas import AIExecutionResult
from .semantic_delta import AcceptedSemanticDelta


class ValidationPipeline:
    def __init__(self, route_outcome_validator: RouteOutcomeValidator | None = None) -> None:
        self.route_outcome_validator = route_outcome_validator or RouteOutcomeValidator()

    def validate(self, ai_execution_result: AIExecutionResult | JsonObject, boundary_result: BoundaryResult, operating_context: JsonObject, skill_selection: SkillSelection | JsonObject, accepted_semantic_delta: AcceptedSemanticDelta) -> ValidationResult:
        validation_events: list[JsonObject] = []
        blocked_outputs: list[JsonObject] = []
        accepted_recommendations: list[JsonObject] = []
        final_response = response_text(ai_execution_result)
        status = "accepted"

        if boundary_result.allowedNextBehavior == "handoff":
            status = "handoff_override"
            validation_events.append({"type": "boundary_override", "severity": "warning", "message": "Red-zone boundary overrides normal counseling."})
        if claims_official_completion(final_response):
            blocked_outputs.append({"type": "student_facing_response", "reason": "official_action_output_not_commit_eligible", "blockedValue": final_response})
            final_response = "I cannot complete application, registration, payment, enrollment, seat reservation, or CRM actions. I can prepare a handoff so a human counselor can continue."
            status = "safe_fallback"
            validation_events.append({"type": "official_action_language_blocked", "severity": "error", "message": "Student-facing response implied official completion."})
        if operating_context.get("primaryCounselingAction") == "orient_initial_route" and contains_old_minimum_profile_language(final_response):
            final_response = "To guide you properly, I only need the routing basics first: your academic result, whether you already have a course in mind, and whether you already have a university in mind."
            status = "safe_fallback"
            validation_events.append({"type": "old_minimum_profile_language_blocked", "severity": "warning", "message": "Minimum-profile response used old ranking/budget/location gate wording."})
        if operating_context.get("counselorResponseMode") == "milestone_confirmation" and not contains_non_official_clarification(final_response):
            final_response = f"{final_response} This is only a counseling preference, not an official application, registration, payment, enrollment, seat reservation, or CRM update."
            status = "downgraded" if status == "accepted" else status
            validation_events.append({"type": "milestone_non_official_clarification_added", "severity": "warning", "message": "Confirmed-preference milestone needed explicit non-official clarification."})

        alignment = validate_response_alignment(final_response, operating_context)
        validation_events.extend(alignment["validationEvents"])
        if alignment["status"] == "reject":
            final_response = "Let me keep this focused on the current counseling route. We can continue safely with one next step without treating the route as complete yet."
            status = "safe_fallback"

        proposed_outputs = proposed_outputs_dict(ai_execution_result)
        for output in proposed_outputs.get("recommendationOutputs", []):
            if output.get("confidence") == "high" and operating_context.get("recommendationReadiness") != "R3":
                accepted_recommendations.append({**output, "confidence": "medium"})
                status = "downgraded" if status == "accepted" else status
                validation_events.append({"type": "recommendation_confidence_downgraded", "severity": "warning", "message": "High confidence recommendation requires R3 readiness."})
            else:
                accepted_recommendations.append(output)

        accepted_handoff = None
        if boundary_result.allowedNextBehavior == "handoff":
            accepted_handoff = proposed_outputs.get("handoffOutput") or {"required": True, "triggerType": boundary_result.triggerType, "reason": boundary_result.aiBoundaryReason, "summary": "Red-zone handoff required."}

        route_outcome_validation = self.route_outcome_validator.validate(operating_context, accepted_semantic_delta, boundary_result)
        validation_events.extend(route_outcome_validation.get("validationEvents", []))
        accepted_operating_context = context_after_rejected_route_outcome(operating_context, route_outcome_validation) if route_outcome_validation["status"] == "reject" else operating_context
        if blocked_outputs and status == "accepted":
            status = "blocked"
        if boundary_result.allowedNextBehavior == "clarify":
            status = "clarify"
        return ValidationResult.model_validate({
            "status": status,
            "finalResponse": final_response,
            "acceptedContextUpdate": context_update(ai_execution_result),
            "acceptedOutputs": {"recommendationOutputs": accepted_recommendations, "handoffOutput": accepted_handoff, "routeOutcomeOutput": route_outcome_validation.get("routeOutcomeOutput")},
            "blockedOutputs": blocked_outputs,
            "validationEvents": validation_events,
            "routeOutcomeValidation": route_outcome_validation,
            "acceptedOperatingContext": accepted_operating_context,
        })


def response_text(ai_execution_result: AIExecutionResult | JsonObject) -> str:
    if isinstance(ai_execution_result, AIExecutionResult):
        return ai_execution_result.response.studentMessage
    return ai_execution_result["response"]["studentMessage"]


def proposed_outputs_dict(ai_execution_result: AIExecutionResult | JsonObject) -> JsonObject:
    if isinstance(ai_execution_result, AIExecutionResult):
        return ai_execution_result.proposedOutputs.model_dump(exclude_none=True)
    return ai_execution_result.get("proposedOutputs", {})


def context_update(ai_execution_result: AIExecutionResult | JsonObject) -> JsonObject:
    if isinstance(ai_execution_result, AIExecutionResult):
        return ai_execution_result.proposedContextUpdate
    return ai_execution_result.get("proposedContextUpdate") or {}


def validate_response_alignment(final_response: str, operating_context: JsonObject) -> JsonObject:
    events = []
    route = operating_context.get("activeRouteEpisode")
    if not route:
        return {"status": "valid", "validationEvents": events}
    if claims_route_completion(final_response) and not route.get("routeOutcomeCandidate"):
        events.append({"type": "route_completion_language_blocked", "severity": "error", "message": "Response claimed route completion without a validated route outcome candidate."})
        return {"status": "reject", "validationEvents": events}
    if operating_context.get("counselorResponseMode") in {"decision_support", "reassuring_orientation", "route_explanation"} and final_response.count("?") > 1:
        events.append({"type": "too_many_questions_detected", "severity": "warning", "message": "Counselor-like flow should ask only one purposeful next question."})
    return {"status": "valid", "validationEvents": events}


def context_after_rejected_route_outcome(operating_context: JsonObject, route_outcome_validation: JsonObject) -> JsonObject:
    context = deepcopy(operating_context)
    route = context.get("activeRouteEpisode")
    if not route:
        return context
    previous_route = route.get("transitionDecision", {}).get("previousRoute")
    active_route = previous_route or route.get("routeType")
    progress_state = "decision_support" if route.get("progressState") == "confirmed_preference" else route.get("progressState")
    route["routeType"] = active_route
    route["routeGoal"] = route_goal(active_route)
    route["progressState"] = progress_state
    route.pop("routeOutcomeCandidate", None)
    route.pop("nextRouteCandidate", None)
    route["transitionDecision"] = {
        **({"previousRoute": previous_route} if previous_route else {}),
        "decision": "continue_active_route",
        "priority": "continue_active_route",
        "activeRoute": active_route,
        "progressState": progress_state,
        "evidence": route.get("transitionDecision", {}).get("evidence", []),
        "requiresValidation": False,
        "auditReason": f"Rejected route outcome ({', '.join(route_outcome_validation.get('errors', []))}); continuing active route.",
    }
    if context.get("primaryCounselingAction") == "confirm_counseling_preference":
        context["primaryCounselingAction"] = "support_decision"
    if context.get("counselorResponseMode") == "milestone_confirmation":
        context["counselorResponseMode"] = "decision_support"
    context["summaryCheckpointStatus"] = "not_required"
    context["milestoneConfirmationStatus"] = "not_applicable"
    context["validationRequirements"] = [item for item in context.get("validationRequirements", []) if item not in {"route_outcome_validation", "route_transition_validation"}]
    context["nextBestCounselingMove"] = "Continue the active route without treating the outcome as complete."
    context["routeOutcomeRejection"] = {"status": route_outcome_validation.get("status"), "errors": route_outcome_validation.get("errors")}
    return context
