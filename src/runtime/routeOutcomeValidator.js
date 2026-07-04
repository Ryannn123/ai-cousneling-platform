const ROUTE_OUTCOME_TYPES = new Set([
  "confirmed_preference",
  "accepted_fallback",
  "deferred_decision",
  "student_switched_route",
  "blocked_by_boundary",
  "handoff_required"
]);

export class RouteOutcomeValidator {
  validate({ operatingContext, acceptedSemanticDelta, boundaryResult } = {}) {
    const route = operatingContext?.activeRouteEpisode;
    const candidate = route?.routeOutcomeCandidate;
    if (!candidate) {
      return { status: "not_applicable", validationEvents: [] };
    }

    const errors = [];
    if (!ROUTE_OUTCOME_TYPES.has(candidate)) errors.push("route_outcome_invalid");
    if (candidate === "confirmed_preference" && !supportsConfirmedPreference(acceptedSemanticDelta)) {
      errors.push("confirmed_route_outcome_requires_explicit_confirmation");
    }
    if (candidate === "handoff_required" && boundaryResult?.allowedNextBehavior !== "handoff") {
      errors.push("handoff_route_outcome_requires_red_boundary");
    }
    if (candidate === "student_switched_route" && !hasEvidence(route.transitionDecision)) {
      errors.push("route_switch_outcome_requires_evidence");
    }

    const status = errors.length ? "reject" : "accepted";
    return {
      status,
      errors,
      routeOutcomeOutput: errors.length ? undefined : {
        type: "route_outcome",
        value: {
          outcome: candidate,
          routeType: route.routeType,
          progressState: route.progressState,
          previousRoute: route.transitionDecision.previousRoute,
          nextRouteCandidate: route.nextRouteCandidate,
          resumeRouteCandidate: route.resumeRouteCandidate,
          reason: route.transitionDecision.auditReason
        },
        confidence: candidate === "confirmed_preference" || candidate === "handoff_required" ? "high" : "medium",
        evidence: route.transitionDecision.evidence
      },
      validationEvents: [{
        type: status === "accepted" ? "route_outcome_accepted" : "route_outcome_rejected",
        severity: status === "accepted" ? "info" : "warning",
        message: status === "accepted"
          ? `${candidate} accepted for ${route.routeType}.`
          : `${candidate} rejected: ${errors.join(", ")}.`
      }]
    };
  }
}

function supportsConfirmedPreference(acceptedSemanticDelta) {
  const flow = acceptedSemanticDelta?.acceptedMemoryDeltas?.flowDrivingDeltas || {};
  return Boolean(nonEmpty(flow.confirmedCounselingCoursePreferences)
    || nonEmpty(flow.confirmedCounselingUniversityPreferences)
    || nonEmpty(flow.confirmedCounselingPathwayPreferences));
}

function nonEmpty(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function hasEvidence(decision = {}) {
  return Array.isArray(decision.evidence)
    && decision.evidence.some((item) => typeof item?.quote === "string" && item.quote.trim());
}
