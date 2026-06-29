const BOUNDARY_RULES_BY_TYPE = {
  ready_to_apply_or_register: ["no-official-action-boundary", "ready-to-register-detection"],
  official_action_request: ["no-official-action-boundary", "ready-to-register-detection"],
  payment_or_seat_request: ["no-official-action-boundary", "ready-to-register-detection"],
  exception_or_waiver_request: ["no-official-action-boundary"],
  sensitive_context: ["no-official-action-boundary"],
  human_requested_support: ["no-official-action-boundary"],
  ambiguous_proceed_language: ["ambiguous-proceed-clarification", "preference-promotion-boundary"]
};

const REASONS_BY_TYPE = {
  ready_to_apply_or_register: "Student is asking to apply or register.",
  official_action_request: "Student is asking for an official action.",
  payment_or_seat_request: "Student is asking about payment, enrollment, or seat commitment.",
  exception_or_waiver_request: "Student is asking about an exception, appeal, waiver, or complex eligibility.",
  sensitive_context: "Student raised a sensitive or high-risk context.",
  human_requested_support: "Student explicitly requested human support.",
  ambiguous_proceed_language: "Proceed language may refer to preference confirmation or official action."
};

export class BoundaryResolver {
  resolve({ fastBoundarySignals = [], acceptedInterpretation } = {}) {
    const accepted = acceptedInterpretation?.accepted || acceptedInterpretation;
    const acceptedBoundarySignals = accepted?.boundaryCandidateSignals || [];
    const readiness = accepted?.flowDriving?.readinessToRegisterSignal;
    const boundarySignals = [...fastBoundarySignals, ...acceptedBoundarySignals];
    if (readiness) {
      boundarySignals.push({
        type: "ready_to_apply_or_register",
        triggerType: readiness.triggerType || "H1",
        severityCandidate: "red",
        recommendedBehavior: "handoff"
      });
    }

    const red = boundarySignals.find((signal) => signal.severityCandidate === "red" || signal.recommendedBehavior === "handoff");
    if (red) return this.redResult(red, boundarySignals);

    const yellow = boundarySignals.find((signal) => signal.type === "ambiguous_proceed_language" || signal.recommendedBehavior === "clarify_once");
    if (yellow) {
      return {
        finalZone: "yellow",
        handoffStatus: "possible_clarify",
        detectedSignals: detectedSignals(boundarySignals),
        aiBoundaryReason: REASONS_BY_TYPE[yellow.type] || "Boundary-sensitive ambiguity requires clarification.",
        requiredBoundaryRules: rulesFor(boundarySignals),
        allowedNextBehavior: "clarify"
      };
    }

    return {
      finalZone: "green",
      handoffStatus: "none",
      detectedSignals: detectedSignals(boundarySignals),
      requiredBoundaryRules: ["no-official-action-boundary"],
      allowedNextBehavior: "continue"
    };
  }

  redResult(signal, allSignals) {
    return {
      finalZone: "red",
      handoffStatus: "required",
      triggerType: signal.triggerType || "H1",
      detectedSignals: detectedSignals(allSignals),
      aiBoundaryReason: REASONS_BY_TYPE[signal.type] || "Student is asking for a red-zone official next step.",
      requiredBoundaryRules: rulesFor(allSignals),
      allowedNextBehavior: "handoff"
    };
  }
}

function detectedSignals(signals) {
  return Array.from(new Set(signals.map((signal) => signal.type)));
}

function rulesFor(signals) {
  const rules = ["no-official-action-boundary"];
  for (const signal of signals) rules.push(...(BOUNDARY_RULES_BY_TYPE[signal.type] || []));
  return Array.from(new Set(rules));
}
