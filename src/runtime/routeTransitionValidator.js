export class RouteTransitionValidator {
  validate(decision = {}) {
    const errors = [];
    if (!decision.decision) errors.push("transition_decision_missing");
    if (!decision.priority) errors.push("transition_priority_missing");
    if (!decision.activeRoute) errors.push("active_route_missing");
    if (!decision.progressState) errors.push("progress_state_missing");

    if (decision.decision === "switch_route" && !hasEvidence(decision)) {
      errors.push("student_led_switch_requires_evidence");
    }

    if (decision.priority === "boundary_override" && decision.activeRoute !== "handoff_preparation") {
      errors.push("boundary_override_must_enter_handoff_preparation");
    }

    return {
      status: errors.length ? "reject" : "valid",
      errors,
      warnings: []
    };
  }
}

function hasEvidence(decision) {
  return Array.isArray(decision.evidence)
    && decision.evidence.some((item) => typeof item?.quote === "string" && item.quote.trim());
}
