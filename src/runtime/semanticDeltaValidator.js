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
const OFFICIAL_MEMORY = /\b(application submitted|registration completed|registered|payment confirmed|paid|seat reserved|crm updated|enrollment confirmed|enrolled)\b/i;

export class SemanticDeltaValidator {
  validate({ rawSemanticDelta, fastBoundarySignals = [], turnInput, extractor = {}, skillContext } = {}) {
    const rejectedCandidates = [];
    const downgradedCandidates = [];
    const validationEvents = [];
    const acceptedMemoryDeltas = normalizeMemoryDeltas(rawSemanticDelta);
    const acceptedRuntimeOnlySignals = normalizeRuntimeSignals(rawSemanticDelta);

    validationEvents.push({ type: "schema_validated", severity: "info", message: "Semantic delta schema normalized." });

    validateFlowDrivingDeltas(acceptedMemoryDeltas.flowDrivingDeltas, rejectedCandidates, downgradedCandidates, validationEvents);
    validateQualityDeltas(acceptedMemoryDeltas.qualityEnhancingDeltas, rejectedCandidates, validationEvents);
    validateRuntimeOnlySignals(acceptedRuntimeOnlySignals, rejectedCandidates, validationEvents);
    preserveFastBoundarySignals(acceptedRuntimeOnlySignals, fastBoundarySignals, validationEvents);
    preserveHumanHelpPosture(acceptedRuntimeOnlySignals, validationEvents);

    if (acceptedRuntimeOnlySignals.some((signal) => signal.kind === "boundary" && signal.type === "ambiguous_proceed_language")) {
      validationEvents.push({ type: "clarification_required", severity: "warning", message: "Ambiguous proceed language requires clarification." });
    }

    const requiresClarification = acceptedRuntimeOnlySignals.some((signal) => signal.recommendedBehavior === "clarify_once" || signal.kind === "ambiguity");
    const status = requiresClarification
      ? "requires_clarification"
      : downgradedCandidates.length
        ? "accepted_with_downgrades"
        : rejectedCandidates.some((candidate) => candidate.severity === "error")
          ? "safe_fallback"
          : "accepted";

    return {
      platformMetadata: buildMetadata(turnInput, extractor, skillContext),
      acceptedMemoryDeltas,
      acceptedRuntimeOnlySignals,
      rejectedCandidates,
      downgradedCandidates,
      validationEvents,
      status
    };
  }
}

function normalizeMemoryDeltas(raw) {
  const memory = raw?.memoryDeltaCandidates && typeof raw.memoryDeltaCandidates === "object" ? raw.memoryDeltaCandidates : {};
  const flow = memory.flowDrivingDeltas && typeof memory.flowDrivingDeltas === "object" ? memory.flowDrivingDeltas : {};
  return {
    flowDrivingDeltas: {
      academicResults: array(flow.academicResults),
      coursesConsidering: array(flow.coursesConsidering),
      confirmedCounselingCoursePreferences: arrayOrSingle(flow.confirmedCounselingCoursePreferences),
      universitiesConsidering: array(flow.universitiesConsidering),
      confirmedCounselingUniversityPreferences: arrayOrSingle(flow.confirmedCounselingUniversityPreferences),
      pathwaysConsidering: array(flow.pathwaysConsidering),
      confirmedCounselingPathwayPreferences: arrayOrSingle(flow.confirmedCounselingPathwayPreferences)
    },
    qualityEnhancingDeltas: array(memory.qualityEnhancingDeltas)
  };
}

function normalizeRuntimeSignals(raw) {
  return array(raw?.runtimeOnlySignalCandidates);
}

function validateFlowDrivingDeltas(flow, rejectedCandidates, downgradedCandidates, validationEvents) {
  validateDeltaList("acceptedMemoryDeltas.flowDrivingDeltas.academicResults", flow.academicResults, rejectedCandidates, validationEvents);
  validateDeltaList("acceptedMemoryDeltas.flowDrivingDeltas.coursesConsidering", flow.coursesConsidering, rejectedCandidates, validationEvents);
  validateDeltaList("acceptedMemoryDeltas.flowDrivingDeltas.universitiesConsidering", flow.universitiesConsidering, rejectedCandidates, validationEvents);
  validateDeltaList("acceptedMemoryDeltas.flowDrivingDeltas.pathwaysConsidering", flow.pathwaysConsidering, rejectedCandidates, validationEvents);

  validateConfirmedPreference(flow, "Course", "coursesConsidering", rejectedCandidates, downgradedCandidates, validationEvents);
  validateConfirmedPreference(flow, "University", "universitiesConsidering", rejectedCandidates, downgradedCandidates, validationEvents);
  validateConfirmedPreference(flow, "Pathway", "pathwaysConsidering", rejectedCandidates, downgradedCandidates, validationEvents);
}

function validateQualityDeltas(deltas, rejectedCandidates, validationEvents) {
  for (let index = deltas.length - 1; index >= 0; index -= 1) {
    const delta = deltas[index];
    if (delta.usefulness === "low") {
      reject(rejectedCandidates, validationEvents, `acceptedMemoryDeltas.qualityEnhancingDeltas.${index}`, delta, "quality_signal_low_usefulness", "quality_signal_ignored");
      deltas.splice(index, 1);
      continue;
    }
    if (!validateCandidate(`acceptedMemoryDeltas.qualityEnhancingDeltas.${index}`, delta, rejectedCandidates, validationEvents)) {
      deltas.splice(index, 1);
    }
  }
}

function validateRuntimeOnlySignals(signals, rejectedCandidates, validationEvents) {
  for (let index = signals.length - 1; index >= 0; index -= 1) {
    const signal = signals[index];
    const path = `acceptedRuntimeOnlySignals.${index}`;
    if (!validateCandidate(path, signal, rejectedCandidates, validationEvents)) {
      signals.splice(index, 1);
      continue;
    }
    if (signal.kind === "boundary" && !BOUNDARY_TYPES.has(signal.type)) {
      reject(rejectedCandidates, validationEvents, path, signal, "boundary_type_invalid");
      signals.splice(index, 1);
      continue;
    }
    validationEvents.push({ type: "runtime_signal_validated", severity: "info", message: `${path} accepted as runtime-only.` });
  }
}

function validateDeltaList(path, deltas, rejectedCandidates, validationEvents) {
  for (let index = deltas.length - 1; index >= 0; index -= 1) {
    const delta = deltas[index];
    if (!validateCandidate(`${path}.${index}`, delta, rejectedCandidates, validationEvents)) {
      deltas.splice(index, 1);
      continue;
    }
    if (delta.operation !== "add_new") {
      reject(rejectedCandidates, validationEvents, `${path}.${index}`, delta, "delta_operation_not_supported");
      deltas.splice(index, 1);
      continue;
    }
    if (OFFICIAL_MEMORY.test(JSON.stringify(delta))) {
      reject(rejectedCandidates, validationEvents, `${path}.${index}`, delta, "official_action_not_memory_delta");
      deltas.splice(index, 1);
    }
  }
}

function validateConfirmedPreference(flow, label, listKey, rejectedCandidates, downgradedCandidates, validationEvents) {
  const confirmedKey = `confirmedCounseling${label}Preferences`;
  const confirmed = flow[confirmedKey];
  for (let index = confirmed.length - 1; index >= 0; index -= 1) {
    const delta = confirmed[index];
    if (!validateCandidate(`acceptedMemoryDeltas.flowDrivingDeltas.${confirmedKey}.${index}`, delta, rejectedCandidates, validationEvents)) {
      confirmed.splice(index, 1);
      continue;
    }
    const directQuote = delta.evidence.map((item) => item.quote).join(" ");
    if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(directQuote)) {
      const downgraded = {
        ...delta,
        status: "preferred",
        confidence: delta.confidence === "high" ? "medium" : delta.confidence,
        promotionRisk: "requires_confirmation"
      };
      flow[listKey].push(downgraded);
      confirmed.splice(index, 1);
      downgradedCandidates.push({
        candidatePath: `acceptedMemoryDeltas.flowDrivingDeltas.${confirmedKey}.${index}`,
        originalCandidate: delta,
        downgradedCandidate: downgraded,
        reason: "value_confirmation_not_explicit"
      });
      validationEvents.push({
        type: "promotion_blocked",
        severity: "warning",
        message: `acceptedMemoryDeltas.flowDrivingDeltas.${confirmedKey}.${index} downgraded: value_confirmation_not_explicit.`
      });
    }
  }
}

function preserveFastBoundarySignals(signals, fastBoundarySignals, validationEvents) {
  for (const fastSignal of fastBoundarySignals) {
    if (!signals.some((signal) => signal.kind === "boundary" && signal.type === fastSignal.type)) {
      signals.push(fromFastBoundarySignal(fastSignal));
      validationEvents.push({
        type: "boundary_signal_preserved",
        severity: "warning",
        message: `Fast boundary signal preserved: ${fastSignal.type}.`
      });
    }
  }
}

function preserveHumanHelpPosture(signals, validationEvents) {
  const posture = signals.find((signal) => signal.kind === "student_posture" && signal.posture === "human_help_seeking");
  if (posture && !signals.some((signal) => signal.kind === "boundary" && signal.type === "human_requested_support")) {
    signals.push({
      kind: "boundary",
      type: "human_requested_support",
      triggerType: "H6",
      severityCandidate: "red",
      recommendedBehavior: "handoff",
      confidence: posture.confidence || "medium",
      evidence: posture.evidence,
      source: posture.source,
      promotionRisk: "official_action_risk"
    });
    validationEvents.push({
      type: "posture_boundary_signal_preserved",
      severity: "warning",
      message: "Human-help posture preserved as H6 boundary candidate."
    });
  }
}

function validateCandidate(path, candidate, rejectedCandidates, validationEvents) {
  if (!candidate || typeof candidate !== "object") {
    reject(rejectedCandidates, validationEvents, path, candidate, "candidate_not_object");
    return false;
  }
  if (!Array.isArray(candidate.evidence) || !candidate.evidence.some((item) => typeof item.quote === "string" && item.quote.trim())) {
    reject(rejectedCandidates, validationEvents, path, candidate, "missing_evidence");
    return false;
  }
  if (!CONFIDENCE.has(candidate.confidence)) {
    reject(rejectedCandidates, validationEvents, path, candidate, "confidence_invalid");
    return false;
  }
  validationEvents.push({ type: "evidence_validated", severity: "info", message: `${path} has evidence.` });
  return true;
}

function fromFastBoundarySignal(signal) {
  return {
    kind: "boundary",
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

function buildMetadata(turnInput = {}, extractor = {}, skillContext) {
  return {
    conversationId: turnInput.conversationId,
    turnId: turnInput.turnId,
    messageId: turnInput.messageId,
    createdAt: new Date().toISOString(),
    extractor: {
      provider: extractor.provider || "mock",
      model: extractor.model || "mock",
      promptVersion: "phase4.semantic-delta.v1.3",
      schemaVersion: "phase4.semantic-delta.v1.3"
    },
    validator: {
      validatorVersion: "semantic-delta-validator.v1.3",
      validationPolicyVersion: "phase4.semantic-delta-policy.v1.3"
    },
    ...(skillContext ? { skillContext } : {})
  };
}

function reject(rejectedCandidates, validationEvents, candidatePath, proposedCandidate, reason, eventType = "candidate_rejected") {
  rejectedCandidates.push({ candidatePath, proposedCandidate, reason, severity: reason === "missing_evidence" ? "error" : "warning" });
  validationEvents.push({ type: eventType, severity: "warning", message: `${candidatePath} rejected: ${reason}.` });
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function arrayOrSingle(value) {
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? [value] : [];
}
