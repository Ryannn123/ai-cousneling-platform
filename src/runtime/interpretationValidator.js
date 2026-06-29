const CONFIDENCE = new Set(["low", "medium", "high"]);
const BOUNDARY_TYPES = new Set([
  "ready_to_apply_or_register",
  "official_action_request",
  "payment_or_seat_request",
  "exception_or_waiver_request",
  "sensitive_context",
  "human_requested_support",
  "ambiguous_proceed_language"
]);

export class InterpretationValidator {
  validate({ rawInterpretation, fastBoundarySignals = [], turnInput }) {
    const rejectedSignals = [];
    const downgradedSignals = [];
    const validationEvents = [];

    const accepted = normalize(rawInterpretation, turnInput);
    validationEvents.push({ type: "schema_validated", severity: "info", message: "Interpretation schema normalized." });

    validateSignalList("flowDriving.coursesConsidering", accepted.flowDriving.coursesConsidering, rejectedSignals, validationEvents);
    validateSignalList("flowDriving.universitiesConsidering", accepted.flowDriving.universitiesConsidering, rejectedSignals, validationEvents);
    validateSignalList("flowDriving.pathwaysConsidering", accepted.flowDriving.pathwaysConsidering, rejectedSignals, validationEvents);
    validateOptionalSignal("flowDriving.academicResult", accepted.flowDriving.academicResult, rejectedSignals, validationEvents);
    validateOptionalSignal("flowDriving.preferenceStrengthCandidate", accepted.flowDriving.preferenceStrengthCandidate, rejectedSignals, validationEvents);
    validateOptionalSignal("flowDriving.readinessToRegisterSignal", accepted.flowDriving.readinessToRegisterSignal, rejectedSignals, validationEvents);
    if (accepted.studentPostureSignal && !validatePostureSignal(accepted.studentPostureSignal, rejectedSignals, validationEvents)) {
      delete accepted.studentPostureSignal;
    }

    accepted.qualityEnhancingSignals = accepted.qualityEnhancingSignals.filter((signal, index) => {
      if (signal.usefulness === "low") {
        reject(rejectedSignals, validationEvents, `qualityEnhancingSignals.${index}`, signal, "quality_signal_low_usefulness", "quality_signal_ignored");
        return false;
      }
      return validateSignal(`qualityEnhancingSignals.${index}`, signal, rejectedSignals, validationEvents);
    });

    accepted.boundaryCandidateSignals = accepted.boundaryCandidateSignals.filter((signal, index) => {
      if (!BOUNDARY_TYPES.has(signal.type)) {
        reject(rejectedSignals, validationEvents, `boundaryCandidateSignals.${index}`, signal, "boundary_type_invalid");
        return false;
      }
      return validateSignal(`boundaryCandidateSignals.${index}`, signal, rejectedSignals, validationEvents);
    });

    for (const fastSignal of fastBoundarySignals) {
      if (!accepted.boundaryCandidateSignals.some((signal) => signal.type === fastSignal.type)) {
        accepted.boundaryCandidateSignals.push(fromFastBoundarySignal(fastSignal));
        validationEvents.push({
          type: "boundary_signal_preserved",
          severity: "warning",
          message: `Fast boundary signal preserved: ${fastSignal.type}.`
        });
      }
    }

    if (accepted.studentPostureSignal?.posture === "human_help_seeking"
      && !accepted.boundaryCandidateSignals.some((signal) => signal.type === "human_requested_support")) {
      accepted.boundaryCandidateSignals.push(fromPostureBoundarySignal(accepted.studentPostureSignal));
      validationEvents.push({
        type: "posture_boundary_signal_preserved",
        severity: "warning",
        message: "Human-help posture preserved as H6 boundary candidate."
      });
    }

    accepted.knowledgeNeedSignals = accepted.knowledgeNeedSignals.filter((signal, index) => validateSignal(`knowledgeNeedSignals.${index}`, signal, rejectedSignals, validationEvents));
    accepted.contradictionSignals = accepted.contradictionSignals.filter((signal, index) => validateSignal(`contradictionSignals.${index}`, signal, rejectedSignals, validationEvents));

    const downgradedCourse = downgradeUnsupportedConfirmation(accepted, "Course", "coursesConsidering", "courseOrProgram");
    if (downgradedCourse) recordDowngrade(downgradedSignals, validationEvents, "flowDriving.confirmedCounselingCoursePreference", downgradedCourse);
    const downgradedUniversity = downgradeUnsupportedConfirmation(accepted, "University", "universitiesConsidering", "university");
    if (downgradedUniversity) recordDowngrade(downgradedSignals, validationEvents, "flowDriving.confirmedCounselingUniversityPreference", downgradedUniversity);
    const downgradedPathway = downgradeUnsupportedConfirmation(accepted, "Pathway", "pathwaysConsidering", "pathway");
    if (downgradedPathway) recordDowngrade(downgradedSignals, validationEvents, "flowDriving.confirmedCounselingPathwayPreference", downgradedPathway);

    if (accepted.boundaryCandidateSignals.some((signal) => signal.type === "ambiguous_proceed_language")) {
      accepted.confidenceSummary.requiresClarification = true;
      accepted.confidenceSummary.clarificationReason ||= "Ambiguous proceed language may mean counseling preference or official application step.";
      validationEvents.push({ type: "clarification_required", severity: "warning", message: "Ambiguous proceed language requires clarification." });
    }

    const status = accepted.confidenceSummary.requiresClarification
      ? "requires_clarification"
      : downgradedSignals.length
        ? "accepted_with_downgrades"
        : rejectedSignals.some((signal) => signal.severity === "error")
          ? "safe_fallback"
          : "accepted";

    return {
      conversationId: accepted.conversationId,
      turnId: accepted.turnId,
      messageId: accepted.messageId,
      accepted,
      rejectedSignals,
      downgradedSignals,
      validationEvents,
      status
    };
  }
}

function normalize(raw, turnInput = {}) {
  const value = raw && typeof raw === "object" ? raw : {};
  const flowDriving = value.flowDriving && typeof value.flowDriving === "object" ? value.flowDriving : {};
  return {
    conversationId: value.conversationId || turnInput.conversationId,
    turnId: value.turnId || turnInput.turnId,
    messageId: value.messageId || turnInput.messageId,
    flowDriving: {
      coursesConsidering: array(flowDriving.coursesConsidering),
      universitiesConsidering: array(flowDriving.universitiesConsidering),
      pathwaysConsidering: array(flowDriving.pathwaysConsidering),
      ...(flowDriving.confirmedCounselingCoursePreference ? { confirmedCounselingCoursePreference: flowDriving.confirmedCounselingCoursePreference } : {}),
      ...(flowDriving.confirmedCounselingUniversityPreference ? { confirmedCounselingUniversityPreference: flowDriving.confirmedCounselingUniversityPreference } : {}),
      ...(flowDriving.confirmedCounselingPathwayPreference ? { confirmedCounselingPathwayPreference: flowDriving.confirmedCounselingPathwayPreference } : {}),
      ...(flowDriving.academicResult ? { academicResult: flowDriving.academicResult } : {}),
      minimumProfileSignals: flowDriving.minimumProfileSignals || {},
      ...(flowDriving.preferenceStrengthCandidate ? { preferenceStrengthCandidate: flowDriving.preferenceStrengthCandidate } : {}),
      ...(flowDriving.readinessToRegisterSignal ? { readinessToRegisterSignal: flowDriving.readinessToRegisterSignal } : {})
    },
    qualityEnhancingSignals: array(value.qualityEnhancingSignals),
    ...(value.studentPostureSignal ? { studentPostureSignal: value.studentPostureSignal } : {}),
    boundaryCandidateSignals: array(value.boundaryCandidateSignals),
    knowledgeNeedSignals: array(value.knowledgeNeedSignals),
    contradictionSignals: array(value.contradictionSignals),
    confidenceSummary: value.confidenceSummary && typeof value.confidenceSummary === "object"
      ? value.confidenceSummary
      : { overallConfidence: "low", requiresClarification: false }
  };
}

function validateSignalList(path, signals, rejectedSignals, validationEvents) {
  for (let index = signals.length - 1; index >= 0; index -= 1) {
    if (!validateSignal(`${path}.${index}`, signals[index], rejectedSignals, validationEvents)) signals.splice(index, 1);
  }
}

function validateOptionalSignal(path, signal, rejectedSignals, validationEvents) {
  if (!signal) return true;
  return validateSignal(path, signal, rejectedSignals, validationEvents);
}

function validateSignal(path, signal, rejectedSignals, validationEvents) {
  if (!signal || typeof signal !== "object") {
    reject(rejectedSignals, validationEvents, path, signal, "signal_not_object");
    return false;
  }
  if (!Array.isArray(signal.evidence) || !signal.evidence.some((item) => typeof item.quote === "string" && item.quote.trim())) {
    reject(rejectedSignals, validationEvents, path, signal, "missing_evidence");
    return false;
  }
  if (!CONFIDENCE.has(signal.confidence)) {
    reject(rejectedSignals, validationEvents, path, signal, "confidence_invalid");
    return false;
  }
  validationEvents.push({ type: "evidence_validated", severity: "info", message: `${path} has evidence.` });
  return true;
}

function validatePostureSignal(signal, rejectedSignals, validationEvents) {
  const validPostures = new Set(["just_browsing", "lost_or_confused", "course_first", "university_first", "pathway_first", "comparison_oriented", "validation_seeking", "decision_ready", "indecisive", "constraint_driven", "human_help_seeking"]);
  if (!validateSignal("studentPostureSignal", signal, rejectedSignals, validationEvents)) return false;
  if (!validPostures.has(signal.posture)) {
    reject(rejectedSignals, validationEvents, "studentPostureSignal", signal, "posture_invalid");
    return false;
  }
  validationEvents.push({ type: "student_posture_validated", severity: "info", message: "Student posture accepted as advisory context." });
  return true;
}

function downgradeUnsupportedConfirmation(accepted, label, listKey, fieldKey) {
  const confirmedKey = `confirmedCounseling${label}Preference`;
  const confirmed = accepted.flowDriving[confirmedKey];
  if (!confirmed) return null;
  if (!validateSignal(`flowDriving.${confirmedKey}`, confirmed, [], [])) {
    delete accepted.flowDriving[confirmedKey];
    return { originalSignal: confirmed, downgradedSignal: null, reason: "confirmed_preference_missing_evidence" };
  }
  const directQuote = confirmed.evidence.map((item) => item.quote).join(" ");
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(directQuote)) {
    const downgraded = {
      ...confirmed,
      status: "preferred",
      confidence: confirmed.confidence === "high" ? "medium" : confirmed.confidence,
      promotionRisk: "requires_confirmation"
    };
    accepted.flowDriving[listKey].push(downgraded);
    delete accepted.flowDriving[confirmedKey];
    return { originalSignal: confirmed, downgradedSignal: downgraded, reason: `${fieldKey}_confirmation_not_explicit` };
  }
  return null;
}

function fromFastBoundarySignal(signal) {
  return {
    type: signal.type,
    triggerType: signal.triggerType,
    severityCandidate: signal.severityCandidate,
    recommendedBehavior: signal.recommendedBehavior === "clarify_once" ? "clarify_once" : "handoff",
    confidence: "high",
    evidence: [{ quote: signal.matchedText }],
    source: "current_message",
    promotionRisk: signal.severityCandidate === "red" ? "official_action_risk" : "requires_confirmation"
  };
}

function fromPostureBoundarySignal(signal) {
  return {
    type: "human_requested_support",
    triggerType: "H6",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    confidence: signal.confidence || "medium",
    evidence: signal.evidence,
    source: signal.source,
    promotionRisk: "official_action_risk"
  };
}

function reject(rejectedSignals, validationEvents, signalPath, proposedSignal, reason, eventType = "signal_rejected") {
  rejectedSignals.push({ signalPath, proposedSignal, reason, severity: reason === "missing_evidence" ? "error" : "warning" });
  validationEvents.push({ type: eventType, severity: "warning", message: `${signalPath} rejected: ${reason}.` });
}

function recordDowngrade(downgradedSignals, validationEvents, signalPath, downgrade) {
  downgradedSignals.push({ signalPath, ...downgrade });
  validationEvents.push({ type: "promotion_blocked", severity: "warning", message: `${signalPath} downgraded: ${downgrade.reason}.` });
}

function array(value) {
  return Array.isArray(value) ? value : [];
}
