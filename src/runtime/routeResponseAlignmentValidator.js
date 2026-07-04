const COMPLETION_LANGUAGE = /\b(route is complete|completed the route|we are done with this route|final choice is locked)\b/i;

export class RouteResponseAlignmentValidator {
  validate({ finalResponse = "", operatingContext } = {}) {
    const events = [];
    const route = operatingContext?.activeRouteEpisode;
    if (!route) return { status: "valid", validationEvents: events };

    if (COMPLETION_LANGUAGE.test(finalResponse) && !route.routeOutcomeCandidate) {
      events.push({
        type: "route_completion_language_blocked",
        severity: "error",
        message: "Response claimed route completion without a validated route outcome candidate."
      });
      return { status: "reject", validationEvents: events };
    }

    if (["decision_support", "reassuring_orientation", "route_explanation"].includes(operatingContext.counselorResponseMode)
      && questionCount(finalResponse) > 1) {
      events.push({
        type: "too_many_questions_detected",
        severity: "warning",
        message: "Counselor-like flow should ask only one purposeful next question."
      });
    }

    return { status: "valid", validationEvents: events };
  }
}

function questionCount(text = "") {
  return (text.match(/\?/g) || []).length;
}
