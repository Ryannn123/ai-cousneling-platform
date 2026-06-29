import { DEFAULT_CONTEXT } from "./constants.js";

const FACTUAL_DETOUR = /\b(fee|fees|cost|tuition|location|campus|ranking|rank|duration|pathway|intake)\b/i;
const RESULTS = /\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?)\b/i;
const PREF_TYPE = /\b(ranking|prestige|budget|affordable|value|cheap|low cost)\b/i;
const LOCATION = /\b(kl|kuala lumpur|selangor|penang|johor|malaysia|overseas|near|location)\b/i;
const COURSE = /\b(psychology|business|it|computer science|design|engineering|accounting|course|program|programme)\b/i;
const COMPARE = /\b(compare|versus|vs|shortlist|better|between)\b/i;
const DEFERRAL = /\b(not sure|think about|later|maybe|undecided|confused)\b/i;
const CONFIRM_PREF = /\b(my choice|choose|let'?s go with|this option|for now|prefer .+ over)\b/i;

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
    const profileSignals = {
      hasAcademicResults: previousRuntimeState?.profile?.hasAcademicResults || Boolean(minimumProfileSignals.hasAcademicResults) || RESULTS.test(text),
      hasUniversityPreferenceType: previousRuntimeState?.profile?.hasUniversityPreferenceType || Boolean(minimumProfileSignals.hasUniversityPreferenceType) || PREF_TYPE.test(text),
      hasPreferredLocation: previousRuntimeState?.profile?.hasPreferredLocation || Boolean(minimumProfileSignals.hasPreferredLocation) || LOCATION.test(text),
      hasCourseInterest: previousRuntimeState?.profile?.hasCourseInterest || Boolean(minimumProfileSignals.hasCourseInterest) || COURSE.test(text)
    };

    const minimumComplete = profileSignals.hasAcademicResults
      && profileSignals.hasUniversityPreferenceType
      && profileSignals.hasPreferredLocation;

    context.profileCompleteness = minimumComplete ? "minimum_complete" : "incomplete";
    context.recommendationReadiness = minimumComplete
      ? (profileSignals.hasCourseInterest ? "R2" : "R2")
      : "R1";

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
      context.nextBestCounselingMove = "Collect missing minimum profile information.";
    } else if (COMPARE.test(text)) {
      context.currentMainState = "S5";
      context.primaryCounselingAction = "A7";
      context.nextBestCounselingMove = "Compare or shortlist options.";
    } else if (flowDriving.confirmedCounselingCoursePreference || flowDriving.confirmedCounselingUniversityPreference || flowDriving.confirmedCounselingPathwayPreference || CONFIRM_PREF.test(text)) {
      context.currentMainState = "S6";
      context.primaryCounselingAction = "A9";
      context.preferenceStrength = "L4";
      context.nextBestCounselingMove = "Confirm counseling preference without treating it as official action.";
    } else if (DEFERRAL.test(text)) {
      context.currentMainState = "S8";
      context.primaryCounselingAction = "A10";
      context.nextBestCounselingMove = "Support deferral or indecision.";
    } else if (minimumComplete && ((flowDriving.coursesConsidering || []).length || COURSE.test(text))) {
      context.currentMainState = "S4";
      context.primaryCounselingAction = "A6";
      context.activeStudentDirection = activeDirection || inferDirection(text, context.activeStudentDirection);
      context.nextBestCounselingMove = "Give an R2 directional recommendation.";
    } else if (minimumComplete) {
      context.currentMainState = "S3";
      context.primaryCounselingAction = "A3";
      context.nextBestCounselingMove = "Explore interests and refine course direction.";
    }

    return { context, profileSignals };
  }
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
