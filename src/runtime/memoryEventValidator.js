import crypto from "node:crypto";

export const MEMORY_CATEGORIES = new Set([
  "academic",
  "course_direction",
  "university_direction",
  "pathway_direction",
  "counseling_preference",
  "rejected_option",
  "constraint",
  "quality_context",
  "concern_or_blocker",
  "decision_support",
  "recommendation_interaction",
  "handoff_readiness"
]);

export const OFFICIAL_TRUTH_PATTERN = /\b(application submitted|registration completed|registered|payment confirmed|paid|seat reserved|crm updated|crm status updated|enrollment confirmed|enrolled|scholarship approved|eligibility approved|exception approved|official document submitted)\b/i;

export class MemoryEventValidator {
  validate({ draft, selectedSkillContext } = {}) {
    const errors = [];
    const warnings = [];
    const invariantChecks = {
      schemaValid: true,
      categoryPayloadCompatible: true,
      operationSupported: draft?.operation === "add_new",
      evidenceSufficient: hasEvidence(draft),
      promotionSafe: true,
      officialTruthSafe: !OFFICIAL_TRUTH_PATTERN.test(JSON.stringify(draft || {})),
      projectionIntentSafe: Boolean(draft?.merge?.projectionIntent),
      duplicatePolicySafe: true
    };

    if (!draft || typeof draft !== "object") errors.push("draft_missing");
    if (!draft?.studentId || !draft?.source?.conversationId || !draft?.source?.turnId || !draft?.source?.messageId) errors.push("source_trace_missing");
    if (!MEMORY_CATEGORIES.has(draft?.category)) errors.push("category_invalid");
    if (!draft?.payload || typeof draft.payload !== "object" || Array.isArray(draft.payload)) {
      invariantChecks.categoryPayloadCompatible = false;
      errors.push("payload_invalid");
    }
    if (!invariantChecks.operationSupported) errors.push("operation_not_supported");
    if (!invariantChecks.evidenceSufficient) errors.push("evidence_missing");
    if (!invariantChecks.officialTruthSafe) errors.push("official_truth_not_memory");
    if (!invariantChecks.projectionIntentSafe) errors.push("projection_intent_missing");
    if (draft?.category === "counseling_preference" && draft.payload?.status !== "confirmed_counseling_preference") {
      invariantChecks.promotionSafe = false;
      errors.push("confirmed_preference_requires_explicit_status");
    }

    const status = errors.length ? "reject" : warnings.length ? "valid_with_warnings" : "valid";
    return {
      status,
      durableEvent: errors.length ? undefined : this.toDurableEvent(draft, selectedSkillContext),
      errors,
      warnings,
      invariantChecks
    };
  }

  toDurableEvent(draft, selectedSkillContext) {
    return {
      eventId: crypto.randomUUID(),
      studentId: draft.studentId,
      conversationId: draft.source.conversationId,
      turnId: draft.source.turnId,
      messageId: draft.source.messageId,
      category: draft.category,
      operation: draft.operation,
      payload: draft.payload,
      confidence: draft.confidence,
      evidence: draft.evidence,
      source: {
        acceptedSemanticDeltaId: draft.source.acceptedSemanticDeltaId,
        acceptedDeltaId: draft.source.acceptedDeltaId,
        skillName: selectedSkillContext?.selectedRuntimeSkill?.name,
        skillVersion: selectedSkillContext?.selectedRuntimeSkill?.version,
        skillHash: selectedSkillContext?.selectedRuntimeSkill?.contentHash,
        validatorVersion: "memory-event-validator.phase5.v1"
      },
      merge: draft.merge,
      officialTruthBoundary: {
        isOfficialTruth: false
      },
      validation: {
        validated: true,
        validatorVersion: "memory-event-validator.phase5.v1"
      },
      createdAt: new Date().toISOString()
    };
  }
}

function hasEvidence(draft) {
  return Array.isArray(draft?.evidence)
    && draft.evidence.some((item) => typeof item?.quote === "string" && item.quote.trim());
}
