import { OFFICIAL_ACTION_OUTPUTS } from "./constants.js";

const OFFICIAL_COMPLETION_LANGUAGE = /\b(application submitted|registered you|registration completed|seat reserved|payment confirmed|enrollment confirmed|updated crm)\b/i;
const OLD_MINIMUM_PROFILE_LANGUAGE = /\b(prestige\/ranking|ranking.*budget|budget.*location|preferred study location)\b/i;
const NON_OFFICIAL_LANGUAGE = /\bnot (an|official)|does not submit|does not register|not application|not.*registration|not.*payment|not.*seat|not.*crm/i;

export class ValidationPipeline {
  validate({ aiExecutionResult, boundaryResult, operatingContext, skillSelection, acceptedSemanticDelta }) {
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

    if (operatingContext.primaryCounselingAction === "A2" && OLD_MINIMUM_PROFILE_LANGUAGE.test(finalResponse)) {
      finalResponse = "To guide you properly, I only need the routing basics first: your academic result, whether you already have a course in mind, and whether you already have a university in mind.";
      status = "safe_fallback";
      validationEvents.push({
        type: "old_minimum_profile_language_blocked",
        severity: "warning",
        message: "Minimum-profile response used old ranking/budget/location gate wording."
      });
    }

    if (operatingContext.counselorResponseMode === "milestone_confirmation" && !NON_OFFICIAL_LANGUAGE.test(finalResponse)) {
      finalResponse = `${finalResponse} This is only a counseling preference, not an official application, registration, payment, enrollment, seat reservation, or CRM update.`;
      status = status === "accepted" ? "downgraded" : status;
      validationEvents.push({
        type: "milestone_non_official_clarification_added",
        severity: "warning",
        message: "Confirmed-preference milestone needed explicit non-official clarification."
      });
    }

    if (["reassuring_orientation", "route_explanation", "decision_support"].includes(operatingContext.counselorResponseMode)
      && questionCount(finalResponse) > 1) {
      validationEvents.push({
        type: "too_many_questions_detected",
        severity: "warning",
        message: "Counselor-like flow should ask only one purposeful next question."
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
      if (output.type === "confirmed_counseling_preference" && !supportsConfirmedPreference(acceptedSemanticDelta)) {
        blockedOutputs.push({ output, reason: "confirmed_preference_not_supported_by_accepted_semantic_delta" });
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

function questionCount(text = "") {
  return (text.match(/\?/g) || []).length;
}

function supportsConfirmedPreference(acceptedSemanticDelta) {
  const flowDriving = acceptedSemanticDelta?.acceptedMemoryDeltas?.flowDrivingDeltas;
  return Boolean(flowDriving?.confirmedCounselingCoursePreferences
    || flowDriving?.confirmedCounselingUniversityPreferences
    || flowDriving?.confirmedCounselingPathwayPreferences);
}
