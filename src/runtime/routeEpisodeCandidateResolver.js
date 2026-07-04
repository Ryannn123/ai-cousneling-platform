const NO_COURSE_DIRECTION = /\b(don'?t know what course|do not know what course|no course|not sure what to study|don't know what to study|do not know what to study)\b/i;
const NO_UNIVERSITY_DIRECTION = /\b(don'?t know (which )?university|do not know (which )?university|no university|not sure which university|haven'?t chosen.*university|have not chosen.*university|what course or university)\b/i;
const PATHWAY_UNCERTAINTY = /\b(foundation or diploma|diploma or foundation|pathway|entry pathway|foundation|diploma|a-level|a level|direct entry)\b/i;

export class RouteEpisodeCandidateResolver {
  resolve({ currentTruthProjection, acceptedSemanticDelta, previousOperatingContext, studentMessage = "" } = {}) {
    if (!currentTruthProjection) throw new Error("currentTruthProjection is required");

    const routeSignal = routeSignals(acceptedSemanticDelta)
      .find((signal) => signal.routeHint && ["medium", "high"].includes(signal.confidence));
    const routeType = routeSignal?.routeHint || deriveRouteType(currentTruthProjection, studentMessage);

    return {
      routeType,
      routeGoal: routeGoal(routeType),
      evidence: [
        ...evidenceFromSignal(routeSignal),
        ...candidateEvidence(currentTruthProjection, studentMessage)
      ],
      source: {
        derivedFromCurrentTruth: true,
        usedAcceptedSemanticDelta: Boolean(routeSignal),
        usedPriorOperatingContext: Boolean(previousOperatingContext?.activeRouteEpisode),
        usedBoundaryResult: false,
        usedRouteOutcomeHistory: Boolean(currentTruthProjection.routeEpisodeProjection?.routeOutcomeHistory?.length)
      },
      auditReason: routeSignal
        ? `Route candidate came from route signal ${routeSignal.signalType}.`
        : `Route candidate derived from current truth as ${routeType}.`
    };
  }
}

export function deriveRouteType(currentTruth, text = "") {
  const hasAcademic = currentTruth.academic.academicResultStatus === "known";
  const courseKnown = isKnownCourseDirection(currentTruth.direction.courseDirectionStatus, text) && !NO_COURSE_DIRECTION.test(text);
  const universityKnown = isKnownDirection(currentTruth.direction.universityDirectionStatus) && !NO_UNIVERSITY_DIRECTION.test(text);
  const pathwayKnown = isKnownDirection(currentTruth.direction.pathwayDirectionStatus);
  const pathwayDominant = PATHWAY_UNCERTAINTY.test(text) && (!courseKnown || !universityKnown || pathwayKnown);

  if (!hasAcademic) return "initial_route_selection";
  if (pathwayDominant) return "pathway_exploration";
  if (!courseKnown && !universityKnown) return "course_exploration";
  if (courseKnown && !universityKnown) return "university_exploration";
  if (!courseKnown && universityKnown) return "course_exploration_within_university_context";
  return "combined_option_validation";
}

export function routeGoal(routeType) {
  return {
    initial_route_selection: "Identify the first useful counseling route.",
    course_exploration: "Help the student resolve course or program direction.",
    university_exploration: "Help the student resolve university direction.",
    course_exploration_within_university_context: "Help the student choose a course within the university context.",
    pathway_exploration: "Help the student resolve pathway direction.",
    combined_option_validation: "Validate the combined counseling option before confirmation.",
    handoff_preparation: "Prepare safe human handoff context."
  }[routeType] || "Guide the current counseling route.";
}

function routeSignals(acceptedSemanticDelta) {
  return (acceptedSemanticDelta?.acceptedRuntimeOnlySignals || [])
    .filter((signal) => signal.kind === "route_episode");
}

function evidenceFromSignal(signal) {
  return signal?.evidence || [];
}

function candidateEvidence(currentTruth, studentMessage) {
  return [{
    quote: studentMessage || "current truth projection",
    source: "current_truth_projection",
    basis: {
      academicResultStatus: currentTruth.academic.academicResultStatus,
      courseDirectionStatus: currentTruth.direction.courseDirectionStatus,
      universityDirectionStatus: currentTruth.direction.universityDirectionStatus,
      pathwayDirectionStatus: currentTruth.direction.pathwayDirectionStatus
    }
  }];
}

function isKnownDirection(status) {
  return Boolean(status && status !== "unknown");
}

function isKnownCourseDirection(status, text = "") {
  if (!isKnownDirection(status)) return false;
  if (status === "considering_some_courses") return NO_UNIVERSITY_DIRECTION.test(text);
  return true;
}
