import { routeGoal } from "./routeEpisodeCandidateResolver.js";
import { RouteTransitionValidator } from "./routeTransitionValidator.js";

const FACTUAL_DETOUR = /\b(fee|fees|cost|tuition|location|campus|ranking|rank|duration|intake)\b/i;
const COMPARE = /\b(compare|versus|vs|shortlist|better|between)\b/i;
const DEFERRAL = /\b(not sure|think about|later|maybe|undecided|confused|discuss with (my )?parents|pause this|more time)\b/i;
const ACCEPTED_FALLBACK = /\b(backup|fallback|working option|for now|sounds safer|keep that .+ for now)\b/i;

export class RouteEpisodePlanner {
  constructor({ transitionValidator = new RouteTransitionValidator() } = {}) {
    this.transitionValidator = transitionValidator;
  }

  plan({ boundaryResult, routeCandidate, currentTruthProjection, acceptedSemanticDelta, previousOperatingContext, studentMessage = "" } = {}) {
    if (!routeCandidate) throw new Error("routeCandidate is required");
    const prior = previousOperatingContext?.activeRouteEpisode;
    const runtimeSignals = acceptedSemanticDelta?.acceptedRuntimeOnlySignals || [];
    const routeSignals = runtimeSignals.filter((signal) => signal.kind === "route_episode");
    const previousRoute = prior?.routeType;
    const previousProgressState = prior?.progressState || "opening";

    let activeRoute = routeCandidate.routeType;
    let progressState = progressStateForRoute({ routeCandidate, currentTruthProjection, studentMessage });
    let decision = "continue_active_route";
    let priority = previousRoute ? "continue_active_route" : "initial_route_selection";
    let routeOutcomeCandidate;
    let nextRouteCandidate;
    let resumeRouteCandidate;
    let detourOverlay;
    let evidence = routeCandidate.evidence || [];
    let auditReason = routeCandidate.auditReason;

    if (prior && shouldContinuePriorRoute(prior, routeCandidate, routeSignals, boundaryResult, currentTruthProjection, studentMessage)) {
      activeRoute = prior.routeType;
      progressState = progressStateForRoute({ routeCandidate: { ...routeCandidate, routeType: activeRoute }, currentTruthProjection, studentMessage });
      auditReason = `Continuing sticky active route ${activeRoute}.`;
    }

    if (boundaryResult?.allowedNextBehavior === "handoff") {
      activeRoute = "handoff_preparation";
      progressState = "handoff";
      decision = "enter_handoff";
      priority = boundaryResult.detectedSignals?.includes("human_requested_support") ? "human_support_request" : "boundary_override";
      routeOutcomeCandidate = "handoff_required";
      evidence = boundaryEvidence(boundaryResult, studentMessage);
      auditReason = "Boundary override entered handoff preparation.";
    } else if (hasKnowledgeDetour(runtimeSignals, studentMessage)) {
      const resumeRoute = prior?.routeType || activeRoute;
      const resumeProgressState = prior?.progressState || progressState;
      activeRoute = resumeRoute;
      progressState = "detour_resume";
      decision = "enter_detour";
      priority = "detour_resume";
      resumeRouteCandidate = resumeRoute;
      detourOverlay = {
        detourKind: "factual_knowledge",
        resumeRoute,
        resumeProgressState,
        discoveredSignals: runtimeSignals.filter((signal) => signal.kind === "knowledge_need").map((signal) => signal.type)
      };
      auditReason = "Factual detour preserves active route and resume target.";
    } else {
      const switchSignal = routeSignals.find((signal) => signal.signalType === "student_led_route_switch_signal" && signal.routeHint);
      const deferralSignal = routeSignals.find((signal) => signal.signalType === "route_deferral_signal");
      const confirmationSignal = routeSignals.find((signal) => signal.signalType === "route_confirmation_signal");

      if (switchSignal && switchSignal.routeHint !== previousRoute) {
        decision = "switch_route";
        priority = "student_led_route_switch";
        routeOutcomeCandidate = "student_switched_route";
        nextRouteCandidate = switchSignal.routeHint;
        activeRoute = switchSignal.routeHint;
        progressState = "opening";
        evidence = switchSignal.evidence || evidence;
        auditReason = `Student explicitly switched route to ${activeRoute}.`;
      } else if (confirmationSignal || hasConfirmedPreferenceForRoute(currentTruthProjection, activeRoute)) {
        decision = "complete_route";
        priority = "active_route_outcome_reached";
        routeOutcomeCandidate = "confirmed_preference";
        progressState = "confirmed_preference";
        evidence = confirmationSignal?.evidence || evidence;
        auditReason = "Explicit confirmed counseling preference is a route outcome candidate.";
      } else if (ACCEPTED_FALLBACK.test(studentMessage)) {
        decision = "complete_route";
        priority = "active_route_outcome_reached";
        routeOutcomeCandidate = "accepted_fallback";
        progressState = "decision_support";
        auditReason = "Student appears to accept a fallback or working option.";
      } else if (deferralSignal || DEFERRAL.test(studentMessage)) {
        decision = "defer_route";
        priority = "loop_risk_or_deferral";
        routeOutcomeCandidate = "deferred_decision";
        progressState = "deferral_indecision";
        evidence = deferralSignal?.evidence || evidence;
        auditReason = "Student deferred or remained indecisive.";
      }
    }

    const transitionDecision = {
      decision,
      priority,
      ...(previousRoute ? { previousRoute } : {}),
      activeRoute,
      progressState,
      ...(routeOutcomeCandidate ? { routeOutcome: routeOutcomeCandidate } : {}),
      ...(nextRouteCandidate ? { nextRouteCandidate } : {}),
      ...(resumeRouteCandidate ? { resumeRouteCandidate } : {}),
      evidence,
      requiresValidation: Boolean(routeOutcomeCandidate || decision === "switch_route"),
      auditReason
    };

    const transitionValidation = this.transitionValidator.validate(transitionDecision);

    return {
      routeType: activeRoute,
      routeGoal: routeGoal(activeRoute),
      progressState,
      transitionDecision,
      recommendationReadiness: currentTruthProjection.recommendationReadiness.level,
      preferenceStrength: currentTruthProjection.preference.preferenceStrength,
      activeDirections: activeDirections(currentTruthProjection),
      routeConstraints: [
        ...currentTruthProjection.qualityContext.hardConstraints,
        ...currentTruthProjection.qualityContext.softPreferences
      ],
      decisionBlockers: currentTruthProjection.decisionContext.currentDecisionBlockers,
      ...(routeOutcomeCandidate ? { routeOutcomeCandidate } : {}),
      ...(nextRouteCandidate ? { nextRouteCandidate } : {}),
      ...(resumeRouteCandidate ? { resumeRouteCandidate } : {}),
      ...(detourOverlay ? { detourOverlay } : {}),
      transitionValidation,
      source: {
        ...routeCandidate.source,
        usedPriorOperatingContext: Boolean(prior),
        usedBoundaryResult: Boolean(boundaryResult)
      }
    };
  }
}

function shouldContinuePriorRoute(prior, routeCandidate, routeSignals, boundaryResult, currentTruthProjection, studentMessage = "") {
  if (!prior?.routeType) return false;
  if (prior.routeType === "initial_route_selection") return false;
  if (prior.progressState === "completed") return false;
  if (boundaryResult?.allowedNextBehavior === "handoff") return false;
  if (routeSignals.some((signal) => signal.signalType === "student_led_route_switch_signal")) return false;
  if (routeCandidate.routeType === "handoff_preparation") return false;
  if (routeCandidate.routeType !== prior.routeType && routeIsResolved(currentTruthProjection, prior.routeType, studentMessage)) return false;
  return true;
}

function progressStateForRoute({ routeCandidate, currentTruthProjection, studentMessage = "" }) {
  if (routeCandidate.routeType === "initial_route_selection") return "opening";
  if (COMPARE.test(studentMessage)) return "comparison";
  if (DEFERRAL.test(studentMessage)) return "deferral_indecision";
  if (hasConfirmedPreferenceForRoute(currentTruthProjection, routeCandidate.routeType)) return "confirmed_preference";
  if (["R2", "R3"].includes(currentTruthProjection.recommendationReadiness.level)
    && ["university_exploration", "combined_option_validation"].includes(routeCandidate.routeType)) {
    return "recommendation_ready";
  }
  return "exploration";
}

function hasKnowledgeDetour(runtimeSignals, studentMessage) {
  return runtimeSignals.some((signal) => signal.kind === "knowledge_need") || FACTUAL_DETOUR.test(studentMessage);
}

function hasConfirmedPreferenceForRoute(currentTruth, routeType) {
  if (currentTruth.preference.preferenceStrength !== "L4") return false;
  if (currentTruth.routeEpisodeProjection?.latestRouteOutcomeByRoute?.[routeType]?.outcome === "confirmed_preference") return false;
  const preference = currentTruth.preference.confirmedCounselingPreference || {};
  if (routeType === "course_exploration") return Boolean(preference.courseOrProgram);
  if (routeType === "university_exploration") return Boolean(preference.university);
  if (routeType === "pathway_exploration") return Boolean(preference.pathway);
  if (routeType === "course_exploration_within_university_context") return Boolean(preference.courseOrProgram);
  if (routeType === "combined_option_validation") return Boolean(preference.courseOrProgram && preference.university);
  return false;
}

function activeDirections(currentTruth) {
  return {
    ...(bestDirection(currentTruth.direction.activeCourseDirections)?.value ? { course: bestDirection(currentTruth.direction.activeCourseDirections).value } : {}),
    ...(bestDirection(currentTruth.direction.activeUniversityDirections)?.value ? { university: bestDirection(currentTruth.direction.activeUniversityDirections).value } : {}),
    ...(bestDirection(currentTruth.direction.activePathwayDirections)?.value ? { pathway: bestDirection(currentTruth.direction.activePathwayDirections).value } : {})
  };
}

function routeIsResolved(currentTruth, routeType, studentMessage = "") {
  if (currentTruth.routeEpisodeProjection?.latestRouteOutcomeByRoute?.[routeType]) return true;
  if (routeType === "course_exploration") {
    return currentTruth.direction.courseDirectionStatus === "confirmed_counseling_course_preference"
      && /\b(compare|university|universities|campus|shortlist)\b/i.test(studentMessage);
  }
  if (routeType === "university_exploration") return currentTruth.direction.universityDirectionStatus === "confirmed_counseling_university_preference";
  if (routeType === "pathway_exploration") return currentTruth.direction.pathwayDirectionStatus === "confirmed_counseling_pathway_preference";
  return false;
}

function bestDirection(directions = []) {
  return [...directions].sort((a, b) => directionRank(b.status) - directionRank(a.status)).at(0);
}

function directionRank(status) {
  return { confirmed_counseling_preference: 3, preferred: 2, considering: 1 }[status] || 0;
}

function boundaryEvidence(boundaryResult, studentMessage) {
  return [{
    quote: studentMessage || boundaryResult?.aiBoundaryReason || "Boundary override",
    source: "boundary_result",
    triggerType: boundaryResult?.triggerType
  }];
}
