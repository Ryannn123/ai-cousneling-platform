import { OFFICIAL_ACTION_OUTPUTS } from "./constants.js";

const OFFICIAL_COMPLETION_LANGUAGE = /\b(application submitted|registered you|registration completed|seat reserved|payment confirmed|enrollment confirmed|updated crm)\b/i;

export class ValidationPipeline {
  validate({ aiExecutionResult, boundaryResult, operatingContext, skillSelection, acceptedInterpretation }) {
    const validationEvents = [];
    const blockedOutputs = [];
    const acceptedMemoryOutputs = [];
    const acceptedRecommendationOutputs = [];
    let finalResponse = aiExecutionResult.response.studentMessage;
    let status = "accepted";

    if (boundaryResult.allowedNextBehavior === "handoff") {
      status = "handoff_override";
      validationEvents.push({
        type: "boundary_override",
        severity: "warning",
        message: "Red-zone boundary overrides normal counseling."
      });
    }

    if (OFFICIAL_COMPLETION_LANGUAGE.test(finalResponse)) {
      finalResponse = "I cannot complete application, registration, payment, enrollment, seat reservation, or CRM actions. I can prepare a handoff so a human counselor can continue.";
      status = "safe_fallback";
      validationEvents.push({
        type: "official_action_language_blocked",
        severity: "error",
        message: "Student-facing response implied official completion."
      });
    }

    const allowedTypes = new Set(skillSelection.allowedMemoryOutputTypes || []);
    for (const output of aiExecutionResult.proposedOutputs.memoryOutputs || []) {
      if (OFFICIAL_ACTION_OUTPUTS.has(output.type)) {
        blockedOutputs.push({ output, reason: "official_action_output_not_commit_eligible" });
        continue;
      }
      if (allowedTypes.size && !allowedTypes.has(output.type)) {
        blockedOutputs.push({ output, reason: `memory_type_${output.type}_not_allowed_by_skill` });
        continue;
      }
      if (output.type === "confirmed_counseling_preference" && boundaryResult.allowedNextBehavior === "clarify") {
        blockedOutputs.push({ output, reason: "ambiguous_proceed_must_clarify_before_preference_promotion" });
        continue;
      }
      if (output.type === "confirmed_counseling_preference" && !supportsConfirmedPreference(acceptedInterpretation)) {
        blockedOutputs.push({ output, reason: "confirmed_preference_not_supported_by_accepted_interpretation" });
        continue;
      }
      acceptedMemoryOutputs.push(output);
    }

    for (const output of aiExecutionResult.proposedOutputs.recommendationOutputs || []) {
      if (output.confidence === "high" && operatingContext.recommendationReadiness !== "R3") {
        acceptedRecommendationOutputs.push({ ...output, confidence: "medium" });
        status = status === "accepted" ? "downgraded" : status;
        validationEvents.push({
          type: "recommendation_confidence_downgraded",
          severity: "warning",
          message: "High confidence recommendation requires R3 readiness."
        });
      } else {
        acceptedRecommendationOutputs.push(output);
      }
    }

    const acceptedHandoffOutput = boundaryResult.allowedNextBehavior === "handoff"
      ? aiExecutionResult.proposedOutputs.handoffOutput || {
        required: true,
        triggerType: boundaryResult.triggerType,
        reason: boundaryResult.aiBoundaryReason,
        summary: "Red-zone handoff required."
      }
      : undefined;

    if (blockedOutputs.length && status === "accepted") status = "blocked";
    if (boundaryResult.allowedNextBehavior === "clarify") status = "clarify";

    return {
      status,
      finalResponse,
      acceptedContextUpdate: aiExecutionResult.proposedContextUpdate || {},
      acceptedOutputs: {
        memoryOutputs: acceptedMemoryOutputs,
        recommendationOutputs: acceptedRecommendationOutputs,
        handoffOutput: acceptedHandoffOutput
      },
      blockedOutputs,
      validationEvents
    };
  }
}

function supportsConfirmedPreference(acceptedInterpretation) {
  const flowDriving = acceptedInterpretation?.accepted?.flowDriving;
  return Boolean(flowDriving?.confirmedCounselingCoursePreference
    || flowDriving?.confirmedCounselingUniversityPreference
    || flowDriving?.confirmedCounselingPathwayPreference);
}
