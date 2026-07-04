import { DEFAULT_CONTEXT } from "./constants.js";

const COMPARE = /\b(compare|versus|vs|shortlist|better|between)\b/i;
const DEFERRAL = /\b(not sure|think about|later|maybe|undecided|confused|discuss with (my )?parents|pause this|more time)\b/i;

export class OperatingContextManager {
  build(previousRuntimeState, turnInput, boundaryResult, acceptedSemanticDelta, currentTruthProjection, activeRouteEpisode) {
    if (!currentTruthProjection) throw new Error("currentTruthProjection is required");
    if (!activeRouteEpisode) throw new Error("activeRouteEpisode is required");

    const previous = previousRuntimeState?.operatingContext || DEFAULT_CONTEXT;
    const text = turnInput.studentMessage || "";
    const runtimeSignals = acceptedSemanticDelta?.acceptedRuntimeOnlySignals || [];
    const hasAmbiguity = runtimeSignals.some((signal) => signal.kind === "ambiguity");
    const primaryCounselingAction = hasAmbiguity && boundaryResult.allowedNextBehavior === "continue"
      ? "clarify_ambiguity"
      : actionFromRoute(boundaryResult, activeRouteEpisode);
    const context = {
      currentZone: boundaryResult.finalZone,
      boundary: boundaryResult,
      activeRouteEpisode,
      primaryCounselingAction,
      recommendationReadiness: currentTruthProjection.recommendationReadiness.level,
      preferenceStrength: currentTruthProjection.preference.preferenceStrength,
      handoffStatus: boundaryResult.handoffStatus,
      currentTruth: currentTruthSummary(currentTruthProjection),
      studentPosture: runtimeSignals.find((signal) => signal.kind === "student_posture")?.posture
        || postureFromRoute(activeRouteEpisode, text),
      decisionSupportMode: decisionSupportMode(text, activeRouteEpisode),
      summaryCheckpointStatus: ["summary_checkpoint", "milestone_confirmation"].includes(responseModeFromRoute(boundaryResult, activeRouteEpisode, text, undefined, hasAmbiguity))
        ? "required"
        : "not_required",
      milestoneConfirmationStatus: activeRouteEpisode.progressState === "confirmed_preference" ? "required" : "not_applicable",
      nextBestCounselingMove: nextBestMove(boundaryResult, activeRouteEpisode),
      validationRequirements: validationRequirements(boundaryResult, activeRouteEpisode)
    };
    context.counselorResponseMode = responseModeFromRoute(boundaryResult, activeRouteEpisode, text, context.studentPosture, hasAmbiguity);

    const activeDirection = activeDirectionFromCurrentTruth(currentTruthProjection);
    if (activeDirection) context.activeStudentDirection = activeDirection;

    return { context };
  }
}

function actionFromRoute(boundaryResult, route) {
  if (boundaryResult.allowedNextBehavior === "handoff") return "prepare_handoff";
  if (boundaryResult.allowedNextBehavior === "clarify") return "clarify_ambiguity";
  if (route.progressState === "detour_resume") return "answer_detour";
  if (route.progressState === "comparison") return "compare_shortlist";
  if (route.progressState === "confirmed_preference") return "confirm_counseling_preference";
  if (["deferral_indecision", "decision_support"].includes(route.progressState)) return "support_decision";
  if (route.progressState === "recommendation_ready") return "recommend_directionally";
  if (route.routeType === "initial_route_selection") return "orient_initial_route";
  return "explore_route";
}

function responseModeFromRoute(boundaryResult, route, text = "", posture, hasAmbiguity = false) {
  if (boundaryResult.allowedNextBehavior === "handoff") return "handoff_safe";
  if (boundaryResult.allowedNextBehavior === "clarify") return "clarify_once";
  if (hasAmbiguity) return "clarify_once";
  if (route.progressState === "confirmed_preference") return "milestone_confirmation";
  if (["comparison", "decision_support", "deferral_indecision"].includes(route.progressState)) return "decision_support";
  if (route.progressState === "detour_resume") return "standard";
  if (posture === "lost_or_confused" || route.routeType === "initial_route_selection") return "reassuring_orientation";
  if (["university_exploration", "course_exploration_within_university_context"].includes(route.routeType)) return "route_explanation";
  if (COMPARE.test(text) || DEFERRAL.test(text)) return "decision_support";
  return "standard";
}

function postureFromRoute(route, text = "") {
  if (/\b(human counselor|human counsellor|real person|talk to.*human)\b/i.test(text)) return "human_help_seeking";
  if (COMPARE.test(text)) return "comparison_oriented";
  if (DEFERRAL.test(text)) return "indecisive";
  if (route.routeType === "university_exploration") return "course_first";
  if (route.routeType === "course_exploration_within_university_context") return "university_first";
  if (route.routeType === "pathway_exploration") return "pathway_first";
  if (route.routeType === "combined_option_validation") return "validation_seeking";
  if (route.routeType === "course_exploration") return "lost_or_confused";
  return "just_browsing";
}

function decisionSupportMode(text = "", route) {
  if (COMPARE.test(text) || route.progressState === "comparison") return "clarify_tradeoff";
  if (DEFERRAL.test(text) || route.progressState === "deferral_indecision") return "reflect_blocker";
  return null;
}

function nextBestMove(boundaryResult, route) {
  if (boundaryResult.allowedNextBehavior === "handoff") return "Prepare handoff without completing any official action.";
  if (boundaryResult.allowedNextBehavior === "clarify") return "Clarify whether the student means counseling preference or official action.";
  if (route.progressState === "detour_resume") return "Answer factual detour with known facts or caveats, then resume the active route.";
  if (route.progressState === "comparison") return "Compare or shortlist options inside the active route.";
  if (route.progressState === "confirmed_preference") return "Confirm counseling preference without treating it as official action.";
  if (route.progressState === "deferral_indecision") return "Support deferral or indecision without forcing a choice.";
  if (route.progressState === "recommendation_ready") return "Give a directional recommendation or ask one route-fit question.";
  if (route.routeType === "initial_route_selection") return "Ask one useful question to identify the first counseling route.";
  return "Explore the active route and ask one purposeful next question.";
}

function validationRequirements(boundaryResult, route) {
  return [
    "official_action_boundary",
    ...(boundaryResult.allowedNextBehavior === "handoff" ? ["handoff_safe_response"] : []),
    ...(route.routeOutcomeCandidate ? ["route_outcome_validation"] : []),
    ...(route.transitionDecision?.requiresValidation ? ["route_transition_validation"] : [])
  ];
}

function currentTruthSummary(currentTruth) {
  return {
    academicResultStatus: currentTruth.academic.academicResultStatus,
    courseDirectionStatus: currentTruth.direction.courseDirectionStatus,
    universityDirectionStatus: currentTruth.direction.universityDirectionStatus,
    pathwayDirectionStatus: currentTruth.direction.pathwayDirectionStatus,
    routeEpisodeProjection: currentTruth.routeEpisodeProjection,
    routeReadiness: currentTruth.route.routeReadiness,
    preferenceStrength: currentTruth.preference.preferenceStrength,
    recommendationReadiness: currentTruth.recommendationReadiness.level,
    handoffRequired: currentTruth.handoffReadiness.handoffRequired
  };
}

function activeDirectionFromCurrentTruth(currentTruth) {
  const preference = currentTruth.preference.confirmedCounselingPreference;
  const course = preference?.courseOrProgram || bestDirection(currentTruth.direction.activeCourseDirections)?.value;
  const university = preference?.university || bestDirection(currentTruth.direction.activeUniversityDirections)?.value;
  const pathway = preference?.pathway || bestDirection(currentTruth.direction.activePathwayDirections)?.value;
  if (!course && !university && !pathway) return undefined;
  return {
    ...(course ? { courseOrProgram: course } : {}),
    ...(university ? { university } : {}),
    ...(pathway ? { pathway } : {})
  };
}

function bestDirection(directions = []) {
  return [...directions].sort((a, b) => directionRank(b.status) - directionRank(a.status)).at(0);
}

function directionRank(status) {
  return { confirmed_counseling_preference: 3, preferred: 2, considering: 1 }[status] || 0;
}
