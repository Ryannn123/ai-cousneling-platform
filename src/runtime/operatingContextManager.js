import { DEFAULT_CONTEXT } from "./constants.js";

const FACTUAL_DETOUR = /\b(fee|fees|cost|tuition|location|campus|ranking|rank|duration|pathway|intake)\b/i;
const RESULTS = /\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?|credits?)\b/i;
const COURSE = /\b(psychology|business|it|computer science|design|engineering|accounting)\b/i;
const UNIVERSITY = /\b(university|college|sunway|taylor'?s|taylors|monash|apu|inti|help|utar|university [ab]|demo metropolitan university|demo valley university|demo tech institute)\b/i;
const PATHWAY = /\b(foundation|diploma|a[- ]?level|degree|transfer|pathway)\b/i;
const COMPARE = /\b(compare|versus|vs|shortlist|better|between)\b/i;
const DEFERRAL = /\b(not sure|think about|later|maybe|undecided|confused)\b/i;
const CONFIRM_PREF = /\b(my choice|choose|let'?s go with|this option|for now|prefer .+ over)\b/i;
const NO_COURSE_DIRECTION = /\b(don'?t know what course|do not know what course|no course|not sure what to study|don't know what to study|do not know what to study)\b/i;
const NO_UNIVERSITY_DIRECTION = /\b(don'?t know which university|do not know which university|no university|not sure which university|haven'?t chosen.*university|have not chosen.*university)\b/i;

export class OperatingContextManager {
  build(previousRuntimeState, turnInput, boundaryResult, acceptedInterpretation) {
    const previous = previousRuntimeState?.operatingContext || DEFAULT_CONTEXT;
    const context = structuredClone(previous);
    const text = turnInput.studentMessage || "";
    const accepted = acceptedInterpretation?.accepted;
    const flowDriving = accepted?.flowDriving || {};

    context.currentZone = boundaryResult.finalZone;
    context.handoffStatus = boundaryResult.handoffStatus;
    delete context.overlayState;

    const minimumProfileSignals = flowDriving.minimumProfileSignals || {};
    const profileSignals = buildProfileSignals(previousRuntimeState?.profile, minimumProfileSignals, flowDriving, text);
    const minimumComplete = profileSignals.academicResultKnown
      && profileSignals.courseDirectionStatusKnown
      && profileSignals.universityDirectionStatusKnown;

    context.profileCompleteness = minimumComplete ? "minimum_complete" : "incomplete";
    context.minimumProfileRoute = minimumProfileSignals.suggestedCounselingRoute?.value
      || routeFromProfile(profileSignals, flowDriving, text);
    const hasDirection = hasUsableDirection(profileSignals, flowDriving);
    const hasFitSignals = (accepted?.qualityEnhancingSignals || []).some((signal) => signal.usefulness === "high");
    context.recommendationReadiness = profileSignals.academicResultKnown && hasDirection
      ? (hasFitSignals ? "R3" : "R2")
      : "R1";
    context.studentPosture = accepted?.studentPostureSignal?.posture || postureFromContext(context.minimumProfileRoute, text);
    context.counselorResponseMode = responseModeFromContext(boundaryResult, context.studentPosture, context.minimumProfileRoute, text);
    context.decisionSupportMode = decisionSupportMode(text, context.primaryCounselingAction);
    context.summaryCheckpointStatus = ["summary_checkpoint", "milestone_confirmation"].includes(context.counselorResponseMode)
      ? "required"
      : "not_required";
    context.milestoneConfirmationStatus = context.counselorResponseMode === "milestone_confirmation"
      ? "required"
      : "not_applicable";

    const activeDirection = activeDirectionFromInterpretation(flowDriving, accepted?.contradictionSignals, text, context.activeStudentDirection);
    if (activeDirection) context.activeStudentDirection = activeDirection;
    if (flowDriving.preferenceStrengthCandidate?.level) context.preferenceStrength = flowDriving.preferenceStrengthCandidate.level;

    if (boundaryResult.allowedNextBehavior === "handoff") {
      context.currentMainState = "S7";
      context.primaryCounselingAction = "A12";
      context.preferenceStrength = "L5";
      context.nextBestCounselingMove = "Prepare handoff without completing any official action.";
    } else if (boundaryResult.allowedNextBehavior === "clarify") {
      context.primaryCounselingAction = "A8";
      context.nextBestCounselingMove = "Clarify whether the student means counseling preference or official action.";
    } else if (hasKnowledgeNeed(accepted) || FACTUAL_DETOUR.test(text)) {
      context.overlayState = "S9";
      context.resumeTargetState = context.currentMainState === "S1" ? "S3" : context.currentMainState;
      context.primaryCounselingAction = "A5";
      context.nextBestCounselingMove = "Answer factual detour with known facts or caveats, then resume.";
    } else if (!minimumComplete) {
      context.currentMainState = "S1";
      context.primaryCounselingAction = "A2";
      context.minimumProfileRoute = routeFromProfile(profileSignals, flowDriving, text);
      context.nextBestCounselingMove = "Collect academic result plus course and university direction status.";
    } else if (COMPARE.test(text)) {
      context.currentMainState = "S5";
      context.primaryCounselingAction = "A7";
      context.minimumProfileRoute = "comparison_or_shortlist";
      context.counselorResponseMode = "decision_support";
      context.decisionSupportMode = "clarify_tradeoff";
      context.nextBestCounselingMove = "Compare or shortlist options.";
    } else if (flowDriving.confirmedCounselingCoursePreference || flowDriving.confirmedCounselingUniversityPreference || flowDriving.confirmedCounselingPathwayPreference || CONFIRM_PREF.test(text)) {
      context.currentMainState = "S6";
      context.primaryCounselingAction = "A9";
      context.preferenceStrength = "L4";
      context.counselorResponseMode = "milestone_confirmation";
      context.summaryCheckpointStatus = "required";
      context.milestoneConfirmationStatus = "required";
      context.nextBestCounselingMove = "Confirm counseling preference without treating it as official action.";
    } else if (DEFERRAL.test(text)) {
      context.currentMainState = "S8";
      context.primaryCounselingAction = "A10";
      context.counselorResponseMode = "decision_support";
      context.decisionSupportMode = "reflect_blocker";
      context.nextBestCounselingMove = "Support deferral or indecision.";
    } else if (context.minimumProfileRoute === "university_exploration" || context.minimumProfileRoute === "recommendation_or_validation") {
      context.currentMainState = "S4";
      context.primaryCounselingAction = "A6";
      context.activeStudentDirection = activeDirection || inferDirection(text, context.activeStudentDirection);
      context.nextBestCounselingMove = "Give a directional recommendation or ask one university-fit question.";
    } else if (context.minimumProfileRoute === "course_exploration_within_university_context") {
      context.currentMainState = "S3";
      context.primaryCounselingAction = "A3";
      context.nextBestCounselingMove = "Explore course direction within the university context.";
    } else if (minimumComplete) {
      context.currentMainState = "S3";
      context.primaryCounselingAction = "A3";
      context.nextBestCounselingMove = "Explore interests and broad course or pathway fit.";
    }

    return { context, profileSignals };
  }
}

function buildProfileSignals(previous = {}, minimumProfileSignals = {}, flowDriving = {}, text = "") {
  const academicResultKnown = Boolean(previous.academicResultKnown
    || previous.hasAcademicResults
    || minimumProfileSignals.academicResultKnown
    || minimumProfileSignals.hasAcademicResults
    || minimumProfileSignals.academicResultStatus?.value === "known"
    || RESULTS.test(text));
  const courseDirectionStatus = directionStatus(
    previous.courseDirectionStatus,
    minimumProfileSignals.courseDirectionStatus?.value,
    flowDriving.confirmedCounselingCoursePreference,
    flowDriving.coursesConsidering,
    COURSE.test(text),
    NO_COURSE_DIRECTION.test(text),
    {
      confirmed: "confirmed_counseling_course_preference",
      preferred: "preferred_course_exists",
      considering: "considering_some_courses"
    }
  );
  const universityDirectionStatus = directionStatus(
    previous.universityDirectionStatus,
    minimumProfileSignals.universityDirectionStatus?.value,
    flowDriving.confirmedCounselingUniversityPreference,
    flowDriving.universitiesConsidering,
    UNIVERSITY.test(text),
    NO_UNIVERSITY_DIRECTION.test(text),
    {
      confirmed: "confirmed_counseling_university_preference",
      preferred: "preferred_university_exists",
      considering: "considering_some_universities"
    }
  );
  return {
    academicResultKnown,
    academicResultStatus: academicResultKnown ? "known" : "unknown",
    courseDirectionStatusKnown: Boolean(previous.courseDirectionStatusKnown
      || minimumProfileSignals.courseDirectionStatusKnown
      || courseDirectionStatus !== undefined),
    universityDirectionStatusKnown: Boolean(previous.universityDirectionStatusKnown
      || minimumProfileSignals.universityDirectionStatusKnown
      || universityDirectionStatus !== undefined),
    courseDirectionStatus: courseDirectionStatus || "unknown",
    universityDirectionStatus: universityDirectionStatus || "unknown",
    pathwayDirectionKnown: Boolean((flowDriving.pathwaysConsidering || []).length || PATHWAY.test(text))
  };
}

function directionStatus(previous, proposed, confirmed, considering = [], textHasDirection, textSaysUnknown, labels) {
  if (proposed) return proposed;
  if (confirmed) return labels.confirmed;
  if (considering.some((signal) => signal.status === "preferred")) return labels.preferred;
  if (considering.length || textHasDirection) return labels.considering;
  if (textSaysUnknown) return "unknown";
  return previous;
}

function routeFromProfile(profile, flowDriving = {}, text = "") {
  if (!profile.academicResultKnown) return "collect_academic_result";
  const courseKnown = isKnownDirection(profile.courseDirectionStatus);
  const universityKnown = isKnownDirection(profile.universityDirectionStatus);
  if (COMPARE.test(text)) return "comparison_or_shortlist";
  if (profile.pathwayDirectionKnown || (flowDriving.pathwaysConsidering || []).length) return "course_or_pathway_exploration";
  if (!courseKnown && !universityKnown) return "course_or_pathway_exploration";
  if (courseKnown && !universityKnown) return "university_exploration";
  if (!courseKnown && universityKnown) return "course_exploration_within_university_context";
  return "recommendation_or_validation";
}

function hasUsableDirection(profile, flowDriving = {}) {
  return isKnownDirection(profile.courseDirectionStatus)
    || isKnownDirection(profile.universityDirectionStatus)
    || profile.pathwayDirectionKnown
    || Boolean((flowDriving.pathwaysConsidering || []).length);
}

function isKnownDirection(status) {
  return Boolean(status && status !== "unknown");
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

function hasKnowledgeNeed(accepted) {
  return Boolean(accepted?.knowledgeNeedSignals?.length);
}

function activeDirectionFromInterpretation(flowDriving, contradictionSignals = [], text, previous = {}) {
  const contradiction = contradictionSignals.find((signal) => signal.recommendedBehavior === "preserve_history_and_switch_active_direction");
  const course = contradiction?.newClaim?.courseOrProgram
    || flowDriving.confirmedCounselingCoursePreference?.courseOrProgram
    || flowDriving.coursesConsidering?.find((signal) => signal.status === "preferred")?.courseOrProgram
    || flowDriving.coursesConsidering?.[0]?.courseOrProgram;
  const university = flowDriving.confirmedCounselingUniversityPreference?.university
    || flowDriving.universitiesConsidering?.find((signal) => signal.status === "preferred")?.university
    || flowDriving.universitiesConsidering?.[0]?.university;
  const pathway = flowDriving.confirmedCounselingPathwayPreference?.pathway
    || flowDriving.pathwaysConsidering?.find((signal) => signal.status === "preferred")?.pathway
    || flowDriving.pathwaysConsidering?.[0]?.pathway;

  if (!course && !university && !pathway) return COURSE.test(text) ? inferDirection(text, previous) : undefined;
  return {
    ...previous,
    ...(course ? { courseOrProgram: course } : {}),
    ...(university ? { university } : {}),
    ...(pathway ? { pathway } : {})
  };
}

function inferDirection(text, previous = {}) {
  const lower = text.toLowerCase();
  const courseOrProgram = ["psychology", "business", "computer science", "it", "design", "engineering", "accounting"]
    .find((course) => lower.includes(course));
  return {
    ...previous,
    ...(courseOrProgram ? { courseOrProgram } : {})
  };
}
