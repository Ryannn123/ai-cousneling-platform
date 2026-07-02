export class CurrentTruthProjector {
  project({ studentId, events = [] } = {}) {
    const sorted = [...events].sort(compareEvents);
    const projection = emptyProjection(studentId, sorted);

    for (const event of sorted) {
      if (event.operation !== "add_new" || event.officialTruthBoundary?.isOfficialTruth) continue;
      applyEvent(projection, event);
    }

    finalizeDirection(projection);
    finalizeRoute(projection);
    finalizeRecommendationReadiness(projection);
    return projection;
  }
}

function emptyProjection(studentId, events) {
  return {
    studentId,
    metadata: {
      projectorVersion: "current-truth-projector.phase5.v1",
      generatedAt: new Date().toISOString(),
      sourceEventIds: events.map((event) => event.eventId),
      derivationStatus: "complete",
      warnings: []
    },
    academic: {
      academicResultStatus: "unknown"
    },
    direction: {
      courseDirectionStatus: "unknown",
      universityDirectionStatus: "unknown",
      pathwayDirectionStatus: "unknown",
      activeCourseDirections: [],
      activeUniversityDirections: [],
      activePathwayDirections: [],
      rejectedOptions: []
    },
    preference: {
      preferenceStrength: "none"
    },
    route: {
      minimumProfileCompletion: "incomplete",
      minimumProfileRoute: "collect_academic_result",
      missingMinimumProfileFields: ["academic_result", "course_direction_status", "university_direction_status"],
      missingQualityFitSignals: []
    },
    recommendationReadiness: {
      level: "R1",
      basis: {
        hasUsableAcademicResult: false,
        hasUsableCourseDirection: false,
        hasUsableUniversityDirection: false,
        hasUsablePathwayDirection: false,
        hasEnoughFitSignalsForHighQualityRecommendation: false
      },
      missingForR2: [],
      missingForR3: [],
      confidence: "low"
    },
    qualityContext: {
      hardConstraints: [],
      softPreferences: [],
      influenceOrContext: [],
      qualityContextSummary: ""
    },
    decisionContext: {
      currentDecisionBlockers: [],
      activeComparisonSet: [],
      shortlist: [],
      tradeoffPriorities: [],
      deadlockRisk: "none"
    },
    handoffReadiness: {
      handoffRequired: false,
      triggerTypes: [],
      officialTruthBoundary: {
        applicationSubmitted: false,
        registrationCompleted: false,
        paymentConfirmed: false,
        enrollmentConfirmed: false,
        seatReserved: false,
        crmStatusUpdated: false
      }
    }
  };
}

function applyEvent(projection, event) {
  const payload = event.payload || {};
  if (event.category === "academic") {
    projection.academic.academicResultStatus = "known";
    projection.academic.latestUsableAcademicResult = {
      rawText: payload.rawText || payload.value,
      confidence: event.confidence,
      supportingEventIds: [event.eventId]
    };
    return;
  }
  if (event.category === "course_direction") {
    upsertDirection(projection.direction.activeCourseDirections, event);
    return;
  }
  if (event.category === "university_direction") {
    upsertDirection(projection.direction.activeUniversityDirections, event);
    return;
  }
  if (event.category === "pathway_direction") {
    upsertDirection(projection.direction.activePathwayDirections, event);
    return;
  }
  if (event.category === "counseling_preference") {
    applyCounselingPreference(projection, event);
    return;
  }
  if (event.category === "rejected_option") {
    projection.direction.rejectedOptions.push({
      optionType: payload.optionType,
      value: payload.value,
      supportingEventIds: [event.eventId]
    });
    return;
  }
  if (event.category === "constraint") {
    projection.qualityContext.hardConstraints.push({
      type: payload.type,
      value: payload.value,
      confidence: event.confidence,
      supportingEventIds: [event.eventId]
    });
    return;
  }
  if (event.category === "quality_context") {
    const item = {
      type: payload.type,
      value: payload.value,
      confidence: event.confidence,
      supportingEventIds: [event.eventId]
    };
    if (payload.type === "influence_or_context") projection.qualityContext.influenceOrContext.push(item);
    else projection.qualityContext.softPreferences.push(item);
    return;
  }
  if (event.category === "concern_or_blocker") {
    projection.decisionContext.currentDecisionBlockers.push({
      type: payload.type,
      value: payload.value,
      confidence: event.confidence,
      supportingEventIds: [event.eventId]
    });
    return;
  }
  if (event.category === "decision_support") {
    applyDecisionSupport(projection, event);
    return;
  }
  if (event.category === "handoff_readiness") {
    applyHandoffReadiness(projection, event);
  }
}

function upsertDirection(target, event) {
  const payload = event.payload || {};
  const existing = target.find((item) => sameText(item.value, payload.value));
  const next = {
    value: payload.value,
    status: payload.status || "considering",
    confidence: event.confidence,
    supportingEventIds: [...(existing?.supportingEventIds || []), event.eventId]
  };
  if (existing) Object.assign(existing, strongerDirection(existing, next));
  else target.push(next);
}

function applyCounselingPreference(projection, event) {
  const payload = event.payload || {};
  projection.preference.preferenceStrength = "L4";
  projection.preference.confirmedCounselingPreference = {
    ...(projection.preference.confirmedCounselingPreference || {}),
    ...(payload.dimension === "course" ? { courseOrProgram: payload.value || payload.value?.direction } : {}),
    ...(payload.dimension === "university" ? { university: payload.value } : {}),
    ...(payload.dimension === "pathway" ? { pathway: payload.value } : {}),
    ...(payload.type === "confirmed_counseling_preference" ? { combinedOptionLabel: payload.value?.direction || payload.value } : {}),
    confidence: event.confidence,
    supportingEventIds: [
      ...(projection.preference.confirmedCounselingPreference?.supportingEventIds || []),
      event.eventId
    ]
  };
}

function applyDecisionSupport(projection, event) {
  const payload = event.payload || {};
  if (payload.type === "shortlist") {
    projection.decisionContext.shortlist.push({
      value: payload.value,
      confidence: event.confidence,
      supportingEventIds: [event.eventId]
    });
  }
}

function applyHandoffReadiness(projection, event) {
  const payload = event.payload || {};
  projection.handoffReadiness.handoffRequired = true;
  if (payload.value?.triggerType) projection.handoffReadiness.triggerTypes.push(payload.value.triggerType);
  projection.handoffReadiness.readinessContext = {
    selectedCounselingPreference: projection.preference.confirmedCounselingPreference?.combinedOptionLabel
      || projection.preference.confirmedCounselingPreference?.courseOrProgram,
    reason: payload.value?.reason || payload.status || payload.type,
    supportingEventIds: [
      ...(projection.handoffReadiness.readinessContext?.supportingEventIds || []),
      event.eventId
    ]
  };
  projection.preference.preferenceStrength = "L5";
}

function finalizeDirection(projection) {
  if (!projection.direction.activeUniversityDirections.length) {
    const locationSignal = [
      ...projection.qualityContext.hardConstraints,
      ...projection.qualityContext.softPreferences
    ].find((item) => item.value && typeof item.value === "object" && item.value.location);
    if (locationSignal) {
      projection.direction.activeUniversityDirections.push({
        value: "location-based universities",
        status: "considering",
        confidence: locationSignal.confidence,
        supportingEventIds: locationSignal.supportingEventIds
      });
    }
  }
  projection.direction.activeCourseDirections = withoutRejected(projection.direction.activeCourseDirections, projection, "course");
  projection.direction.activeUniversityDirections = withoutRejected(projection.direction.activeUniversityDirections, projection, "university");
  projection.direction.activePathwayDirections = withoutRejected(projection.direction.activePathwayDirections, projection, "pathway");
  projection.direction.courseDirectionStatus = directionStatus(projection.direction.activeCourseDirections, "course");
  projection.direction.universityDirectionStatus = directionStatus(projection.direction.activeUniversityDirections, "university");
  projection.direction.pathwayDirectionStatus = directionStatus(projection.direction.activePathwayDirections, "pathway");
  if (projection.preference.confirmedCounselingPreference?.courseOrProgram) {
    projection.direction.courseDirectionStatus = "confirmed_counseling_course_preference";
  }
  if (projection.preference.confirmedCounselingPreference?.university) {
    projection.direction.universityDirectionStatus = "confirmed_counseling_university_preference";
  }
  if (projection.preference.confirmedCounselingPreference?.pathway) {
    projection.direction.pathwayDirectionStatus = "confirmed_counseling_pathway_preference";
  }
  if (projection.preference.preferenceStrength === "none" && hasAnyDirection(projection)) {
    projection.preference.preferenceStrength = strongestPreference(projection);
  }
}

function finalizeRoute(projection) {
  const missing = [];
  if (projection.academic.academicResultStatus !== "known") missing.push("academic_result");
  if (!isKnownDirection(projection.direction.courseDirectionStatus)) missing.push("course_direction_status");
  if (!isKnownDirection(projection.direction.universityDirectionStatus)) missing.push("university_direction_status");

  projection.route.missingMinimumProfileFields = missing;
  projection.route.minimumProfileCompletion = missing.length ? "incomplete" : "minimum_complete";

  if (missing.includes("academic_result")) projection.route.minimumProfileRoute = "collect_academic_result";
  else if (projection.handoffReadiness.handoffRequired) projection.route.minimumProfileRoute = "handoff_boundary_check";
  else if (!isKnownDirection(projection.direction.courseDirectionStatus) && !isKnownDirection(projection.direction.universityDirectionStatus)) {
    projection.route.minimumProfileRoute = "course_or_pathway_exploration";
  } else if (isKnownDirection(projection.direction.courseDirectionStatus) && !isKnownDirection(projection.direction.universityDirectionStatus)) {
    projection.route.minimumProfileRoute = "university_exploration";
  } else if (!isKnownDirection(projection.direction.courseDirectionStatus) && isKnownDirection(projection.direction.universityDirectionStatus)) {
    projection.route.minimumProfileRoute = "course_exploration_within_university_context";
  } else {
    projection.route.minimumProfileRoute = "recommendation_or_validation";
  }
}

function finalizeRecommendationReadiness(projection) {
  const basis = projection.recommendationReadiness.basis;
  basis.hasUsableAcademicResult = projection.academic.academicResultStatus === "known";
  basis.hasUsableCourseDirection = isKnownDirection(projection.direction.courseDirectionStatus);
  basis.hasUsableUniversityDirection = isKnownDirection(projection.direction.universityDirectionStatus);
  basis.hasUsablePathwayDirection = isKnownDirection(projection.direction.pathwayDirectionStatus);
  basis.hasEnoughFitSignalsForHighQualityRecommendation = Boolean(
    projection.qualityContext.hardConstraints.length
      || projection.qualityContext.softPreferences.length
      || projection.qualityContext.influenceOrContext.length
  );

  const hasDirection = basis.hasUsableCourseDirection || basis.hasUsableUniversityDirection || basis.hasUsablePathwayDirection;
  projection.recommendationReadiness.level = basis.hasUsableAcademicResult && hasDirection
    ? (basis.hasEnoughFitSignalsForHighQualityRecommendation ? "R3" : "R2")
    : "R1";
  projection.recommendationReadiness.missingForR2 = [
    ...(!basis.hasUsableAcademicResult ? ["academic_result"] : []),
    ...(!hasDirection ? ["course_or_university_or_pathway_direction"] : [])
  ];
  projection.recommendationReadiness.missingForR3 = basis.hasEnoughFitSignalsForHighQualityRecommendation ? [] : ["quality_fit_signal"];
  projection.recommendationReadiness.confidence = projection.recommendationReadiness.level === "R1" ? "low" : "medium";
  projection.qualityContext.qualityContextSummary = [
    ...projection.qualityContext.hardConstraints,
    ...projection.qualityContext.softPreferences,
    ...projection.qualityContext.influenceOrContext
  ].map((item) => JSON.stringify(item.value)).join("; ");
}

function directionStatus(options, type) {
  if (options.some((item) => item.status === "confirmed_counseling_preference")) return `confirmed_counseling_${type}_preference`;
  if (options.some((item) => item.status === "preferred")) return `preferred_${type}_exists`;
  if (options.length) return `considering_some_${type === "university" ? "universities" : `${type}s`}`;
  return "unknown";
}

function isKnownDirection(status) {
  return Boolean(status && status !== "unknown");
}

function hasAnyDirection(projection) {
  return projection.direction.activeCourseDirections.length
    || projection.direction.activeUniversityDirections.length
    || projection.direction.activePathwayDirections.length;
}

function strongestPreference(projection) {
  const all = [
    ...projection.direction.activeCourseDirections,
    ...projection.direction.activeUniversityDirections,
    ...projection.direction.activePathwayDirections
  ];
  if (all.some((item) => item.status === "preferred")) return "L3";
  if (all.length) return "L2";
  return "none";
}

function withoutRejected(options, projection, optionType) {
  return options.filter((option) => !projection.direction.rejectedOptions.some((rejected) => {
    return rejected.optionType === optionType && sameText(rejected.value, option.value);
  }));
}

function strongerDirection(current, next) {
  const rank = { considering: 1, preferred: 2, confirmed_counseling_preference: 3 };
  return rank[next.status] >= rank[current.status] ? next : { ...current, supportingEventIds: next.supportingEventIds };
}

function sameText(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function compareEvents(a, b) {
  return String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.eventId).localeCompare(String(b.eventId));
}
