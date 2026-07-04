import { OFFICIAL_ACTION_OUTPUTS } from "./constants.js";
import { RouteOutcomeValidator } from "./routeOutcomeValidator.js";
import { RouteResponseAlignmentValidator } from "./routeResponseAlignmentValidator.js";
import { routeGoal } from "./routeEpisodeCandidateResolver.js";

const OFFICIAL_COMPLETION_LANGUAGE = /\b(application submitted|registered you|registration completed|seat reserved|payment confirmed|enrollment confirmed|updated crm)\b/i;
const OLD_MINIMUM_PROFILE_LANGUAGE = /\b(prestige\/ranking|ranking.*budget|budget.*location|preferred study location)\b/i;
const NON_OFFICIAL_LANGUAGE = /\bnot (an|official)|does not submit|does not register|not application|not.*registration|not.*payment|not.*seat|not.*crm/i;

export class ValidationPipeline {
  constructor({
    routeOutcomeValidator = new RouteOutcomeValidator(),
    routeResponseAlignmentValidator = new RouteResponseAlignmentValidator()
  } = {}) {
    this.routeOutcomeValidator = routeOutcomeValidator;
    this.routeResponseAlignmentValidator = routeResponseAlignmentValidator;
  }

  validate({ aiExecutionResult, boundaryResult, operatingContext, skillSelection, acceptedSemanticDelta }) {
    const validationEvents = [];
    const blockedOutputs = [];
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

    if (operatingContext.primaryCounselingAction === "orient_initial_route" && OLD_MINIMUM_PROFILE_LANGUAGE.test(finalResponse)) {
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

    const routeResponseAlignment = this.routeResponseAlignmentValidator.validate({ finalResponse, operatingContext });
    validationEvents.push(...routeResponseAlignment.validationEvents);
    if (routeResponseAlignment.status === "reject") {
      finalResponse = "Let me keep this focused on the current counseling route. We can continue safely with one next step without treating the route as complete yet.";
      status = "safe_fallback";
    }

    for (const output of aiExecutionResult.proposedOutputs.memoryOutputs || []) {
      if (OFFICIAL_ACTION_OUTPUTS.has(output.type)) {
        blockedOutputs.push({ output, reason: "official_action_output_not_commit_eligible" });
      }
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

    const routeOutcomeValidation = this.routeOutcomeValidator.validate({ operatingContext, acceptedSemanticDelta, boundaryResult });
    validationEvents.push(...routeOutcomeValidation.validationEvents);
    const acceptedOperatingContext = routeOutcomeValidation.status === "reject"
      ? contextAfterRejectedRouteOutcome(operatingContext, routeOutcomeValidation)
      : operatingContext;

    if (blockedOutputs.length && status === "accepted") status = "blocked";
    if (boundaryResult.allowedNextBehavior === "clarify") status = "clarify";

    return {
      status,
      finalResponse,
      acceptedContextUpdate: aiExecutionResult.proposedContextUpdate || {},
      acceptedOutputs: {
        recommendationOutputs: acceptedRecommendationOutputs,
        handoffOutput: acceptedHandoffOutput,
        routeOutcomeOutput: routeOutcomeValidation.routeOutcomeOutput
      },
      blockedOutputs,
      validationEvents,
      routeOutcomeValidation,
      acceptedOperatingContext
    };
  }
}

function contextAfterRejectedRouteOutcome(operatingContext, routeOutcomeValidation) {
  const context = structuredClone(operatingContext);
  const route = context.activeRouteEpisode;
  if (!route) return context;

  const previousRoute = route.transitionDecision?.previousRoute;
  const activeRoute = previousRoute || route.routeType;
  const progressState = route.progressState === "confirmed_preference" ? "decision_support" : route.progressState;
  const evidence = route.transitionDecision?.evidence || [];

  route.routeType = activeRoute;
  route.routeGoal = routeGoal(activeRoute);
  route.progressState = progressState;
  delete route.routeOutcomeCandidate;
  delete route.nextRouteCandidate;
  route.transitionDecision = {
    ...(previousRoute ? { previousRoute } : {}),
    decision: "continue_active_route",
    priority: "continue_active_route",
    activeRoute,
    progressState,
    evidence,
    requiresValidation: false,
    auditReason: `Rejected route outcome (${routeOutcomeValidation.errors.join(", ")}); continuing active route.`
  };

  if (context.primaryCounselingAction === "confirm_counseling_preference") context.primaryCounselingAction = "support_decision";
  if (context.counselorResponseMode === "milestone_confirmation") context.counselorResponseMode = "decision_support";
  context.summaryCheckpointStatus = "not_required";
  context.milestoneConfirmationStatus = "not_applicable";
  context.validationRequirements = (context.validationRequirements || [])
    .filter((requirement) => !["route_outcome_validation", "route_transition_validation"].includes(requirement));
  context.nextBestCounselingMove = "Continue the active route without treating the outcome as complete.";
  context.routeOutcomeRejection = {
    status: routeOutcomeValidation.status,
    errors: routeOutcomeValidation.errors
  };
  return context;
}
