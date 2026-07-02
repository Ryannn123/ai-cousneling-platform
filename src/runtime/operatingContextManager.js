import { DEFAULT_CONTEXT } from "./constants.js";

const FACTUAL_DETOUR = /\b(fee|fees|cost|tuition|location|campus|ranking|rank|duration|pathway|intake)\b/i;
const COMPARE = /\b(compare|versus|vs|shortlist|better|between)\b/i;
const DEFERRAL = /\b(not sure|think about|later|maybe|undecided|confused)\b/i;
const CONFIRM_PREF = /\b(my choice|choose|let'?s go with|this option|for now|prefer .+ over)\b/i;
const NO_COURSE_DIRECTION = /\b(don'?t know what course|do not know what course|no course|not sure what to study|don't know what to study|do not know what to study)\b/i;
const NO_UNIVERSITY_DIRECTION = /\b(don'?t know (which )?university|do not know (which )?university|no university|not sure which university|haven'?t chosen.*university|have not chosen.*university|what course or university)\b/i;

export class OperatingContextManager {
  build(previousRuntimeState, turnInput, boundaryResult, acceptedSemanticDelta, currentTruthProjection) {
    if (!currentTruthProjection) throw new Error("currentTruthProjection is required");

    const previous = previousRuntimeState?.operatingContext || DEFAULT_CONTEXT;
    const context = structuredClone(previous);
    const text = turnInput.studentMessage || "";
    const runtimeSignals = acceptedSemanticDelta?.acceptedRuntimeOnlySignals || [];
    const route = routeWithCurrentTurnStatus(currentTruthProjection, text);
    const direction = currentTruthProjection.direction;
    const preference = currentTruthProjection.preference;

    context.currentZone = boundaryResult.finalZone;
    context.handoffStatus = boundaryResult.handoffStatus;
    context.profileCompleteness = route.minimumProfileCompletion;
    context.minimumProfileRoute = route.minimumProfileRoute;
    context.recommendationReadiness = currentTruthProjection.recommendationReadiness.level;
    context.preferenceStrength = preference.preferenceStrength === "none" ? undefined : preference.preferenceStrength;
    context.currentTruth = currentTruthSummary(currentTruthProjection);
    delete context.overlayState;

    const activeDirection = activeDirectionFromCurrentTruth(currentTruthProjection);
    if (activeDirection) context.activeStudentDirection = activeDirection;

    context.studentPosture = runtimeSignals.find((signal) => signal.kind === "student_posture")?.posture || postureFromContext(context.minimumProfileRoute, text);
    context.counselorResponseMode = responseModeFromContext(boundaryResult, context.studentPosture, context.minimumProfileRoute, text);
    context.decisionSupportMode = decisionSupportMode(text, context.primaryCounselingAction);
    context.summaryCheckpointStatus = ["summary_checkpoint", "milestone_confirmation"].includes(context.counselorResponseMode)
      ? "required"
      : "not_required";
    context.milestoneConfirmationStatus = context.counselorResponseMode === "milestone_confirmation"
      ? "required"
      : "not_applicable";

    const hasAmbiguity = runtimeSignals.some((signal) => signal.kind === "ambiguity");
    const hasConfirmedPreference = Boolean(preference.confirmedCounselingPreference);

    if (boundaryResult.allowedNextBehavior === "handoff") {
      context.currentMainState = "S7";
      context.primaryCounselingAction = "A12";
      context.preferenceStrength = "L5";
      context.nextBestCounselingMove = "Prepare handoff without completing any official action.";
    } else if (boundaryResult.allowedNextBehavior === "clarify") {
      context.primaryCounselingAction = "A8";
      context.nextBestCounselingMove = "Clarify whether the student means counseling preference or official action.";
    } else if (hasKnowledgeNeed(runtimeSignals) || FACTUAL_DETOUR.test(text)) {
      context.overlayState = "S9";
      context.resumeTargetState = context.currentMainState === "S1" ? "S3" : context.currentMainState;
      context.primaryCounselingAction = "A5";
      context.nextBestCounselingMove = "Answer factual detour with known facts or caveats, then resume.";
    } else if (COMPARE.test(text)) {
      context.currentMainState = "S5";
      context.primaryCounselingAction = "A7";
      context.minimumProfileRoute = "comparison_or_shortlist";
      context.counselorResponseMode = "decision_support";
      context.decisionSupportMode = "clarify_tradeoff";
      context.nextBestCounselingMove = "Compare or shortlist options.";
    } else if (hasAmbiguity) {
      context.primaryCounselingAction = "A8";
      context.counselorResponseMode = "clarify_once";
      context.nextBestCounselingMove = "Clarify the possible correction or direction change before changing current truth.";
    } else if (hasConfirmedPreference || CONFIRM_PREF.test(text)) {
      context.currentMainState = "S6";
      context.primaryCounselingAction = "A9";
      context.preferenceStrength = "L4";
      context.counselorResponseMode = "milestone_confirmation";
      context.summaryCheckpointStatus = "required";
      context.milestoneConfirmationStatus = "required";
      context.nextBestCounselingMove = "Confirm counseling preference without treating it as official action.";
    } else if (route.minimumProfileCompletion !== "minimum_complete") {
      context.currentMainState = "S1";
      context.primaryCounselingAction = "A2";
      context.nextBestCounselingMove = "Collect academic result plus course and university direction status.";
    } else if (DEFERRAL.test(text) || currentTruthProjection.decisionContext.currentDecisionBlockers.length) {
      context.currentMainState = "S8";
      context.primaryCounselingAction = "A10";
      context.counselorResponseMode = "decision_support";
      context.decisionSupportMode = "reflect_blocker";
      context.nextBestCounselingMove = "Support deferral or indecision.";
    } else if (["university_exploration", "recommendation_or_validation"].includes(context.minimumProfileRoute)) {
      context.currentMainState = "S4";
      context.primaryCounselingAction = "A6";
      context.nextBestCounselingMove = "Give a directional recommendation or ask one university-fit question.";
    } else if (context.minimumProfileRoute === "course_exploration_within_university_context") {
      context.currentMainState = "S3";
      context.primaryCounselingAction = "A3";
      context.nextBestCounselingMove = "Explore course direction within the university context.";
    } else if (route.minimumProfileCompletion === "minimum_complete") {
      context.currentMainState = "S3";
      context.primaryCounselingAction = "A3";
      context.nextBestCounselingMove = "Explore interests and broad course or pathway fit.";
    }

    if (direction.pathwayDirectionStatus !== "unknown" && context.minimumProfileRoute === "recommendation_or_validation") {
      context.minimumProfileRoute = "course_or_pathway_exploration";
    }

    return { context };
  }
}

function routeWithCurrentTurnStatus(currentTruth, text) {
  const route = { ...currentTruth.route };
  const hasAcademic = currentTruth.academic.academicResultStatus === "known";
  const courseKnown = currentTruth.direction.courseDirectionStatus !== "unknown";
  const universityKnown = currentTruth.direction.universityDirectionStatus !== "unknown";
  const courseStatusKnown = courseKnown || NO_COURSE_DIRECTION.test(text);
  const universityStatusKnown = universityKnown || NO_UNIVERSITY_DIRECTION.test(text);

  if (hasAcademic && courseStatusKnown && universityStatusKnown) {
    route.minimumProfileCompletion = "minimum_complete";
    route.missingMinimumProfileFields = [];
  }

  if (!hasAcademic) route.minimumProfileRoute = "collect_academic_result";
  else if (!courseKnown && !universityKnown) route.minimumProfileRoute = "course_or_pathway_exploration";
  else if (courseKnown && !universityKnown) route.minimumProfileRoute = "university_exploration";
  else if (!courseKnown && universityKnown) route.minimumProfileRoute = "course_exploration_within_university_context";

  return route;
}

function currentTruthSummary(currentTruth) {
  return {
    academicResultStatus: currentTruth.academic.academicResultStatus,
    courseDirectionStatus: currentTruth.direction.courseDirectionStatus,
    universityDirectionStatus: currentTruth.direction.universityDirectionStatus,
    pathwayDirectionStatus: currentTruth.direction.pathwayDirectionStatus,
    minimumProfileCompletion: currentTruth.route.minimumProfileCompletion,
    minimumProfileRoute: currentTruth.route.minimumProfileRoute,
    preferenceStrength: currentTruth.preference.preferenceStrength,
    recommendationReadiness: currentTruth.recommendationReadiness.level,
    handoffRequired: currentTruth.handoffReadiness.handoffRequired
  };
}

function activeDirectionFromCurrentTruth(currentTruth) {
  const preference = currentTruth.preference.confirmedCounselingPreference;
  const course = preference?.courseOrProgram || currentTruth.direction.activeCourseDirections[0]?.value;
  const university = preference?.university || currentTruth.direction.activeUniversityDirections[0]?.value;
  const pathway = preference?.pathway || currentTruth.direction.activePathwayDirections[0]?.value;
  if (!course && !university && !pathway) return undefined;
  return {
    ...(course ? { courseOrProgram: course } : {}),
    ...(university ? { university } : {}),
    ...(pathway ? { pathway } : {})
  };
}

function postureFromContext(route, text = "") {
  if (/\b(human counselor|human counsellor|real person|talk to.*human)\b/i.test(text)) return "human_help_seeking";
  if (COMPARE.test(text)) return "comparison_oriented";
  if (DEFERRAL.test(text)) return "indecisive";
  if (route === "university_exploration") return "course_first";
  if (route === "course_exploration_within_university_context") return "university_first";
  if (route === "course_or_pathway_exploration") return "lost_or_confused";
  if (route === "recommendation_or_validation") return "validation_seeking";
  return "just_browsing";
}

function responseModeFromContext(boundaryResult, posture, route, text = "") {
  if (boundaryResult.allowedNextBehavior === "handoff") return "handoff_safe";
  if (boundaryResult.allowedNextBehavior === "clarify") return "clarify_once";
  if (CONFIRM_PREF.test(text) || posture === "decision_ready") return "milestone_confirmation";
  if (["comparison_oriented", "indecisive"].includes(posture)) return "decision_support";
  if (posture === "lost_or_confused") return "reassuring_orientation";
  if (["university_exploration", "course_exploration_within_university_context"].includes(route)) return "route_explanation";
  return "standard";
}

function decisionSupportMode(text = "", primaryAction) {
  if (COMPARE.test(text) || primaryAction === "A7") return "clarify_tradeoff";
  if (DEFERRAL.test(text) || primaryAction === "A10") return "reflect_blocker";
  return null;
}

function hasKnowledgeNeed(runtimeSignals) {
  return runtimeSignals.some((signal) => signal.kind === "knowledge_need");
}
