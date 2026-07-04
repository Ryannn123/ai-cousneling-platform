import { OFFICIAL_TRUTH_PATTERN } from "./memoryEventValidator.js";

const HANDOFF_OUTPUTS = new Set(["readiness_to_register_signal", "handoff_required"]);
const DECISION_SUPPORT_OUTPUTS = new Set(["shortlist"]);

export class MemoryIngestionPolicy {
  preResponseDecisions({ studentId, acceptedSemanticDelta, currentTruthBeforeCommit } = {}) {
    const decisions = [];
    const flow = acceptedSemanticDelta?.acceptedMemoryDeltas?.flowDrivingDeltas || {};
    for (const [index, delta] of (flow.academicResults || []).entries()) {
      decisions.push(this.studentDeltaDecision({
        studentId,
        acceptedSemanticDelta,
        acceptedDeltaId: `flow.academicResults.${index}`,
        delta,
        category: "academic",
        payload: { rawText: valueOf(delta), status: "known" }
      }));
    }
    for (const [index, delta] of (flow.coursesConsidering || []).entries()) {
      decisions.push(this.directionDecision({ studentId, acceptedSemanticDelta, acceptedDeltaId: `flow.coursesConsidering.${index}`, delta, directionType: "course" }));
    }
    for (const [index, delta] of (flow.universitiesConsidering || []).entries()) {
      decisions.push(this.directionDecision({ studentId, acceptedSemanticDelta, acceptedDeltaId: `flow.universitiesConsidering.${index}`, delta, directionType: "university" }));
    }
    for (const [index, delta] of (flow.pathwaysConsidering || []).entries()) {
      decisions.push(this.directionDecision({ studentId, acceptedSemanticDelta, acceptedDeltaId: `flow.pathwaysConsidering.${index}`, delta, directionType: "pathway" }));
    }
    for (const [key, directionType] of [
      ["confirmedCounselingCoursePreferences", "course"],
      ["confirmedCounselingUniversityPreferences", "university"],
      ["confirmedCounselingPathwayPreferences", "pathway"]
    ]) {
      if (flow[key]) {
        decisions.push(this.studentDeltaDecision({
          studentId,
          acceptedSemanticDelta,
          acceptedDeltaId: `flow.${key}`,
          delta: flow[key],
          category: "counseling_preference",
          payload: {
            dimension: directionType,
            value: valueOf(flow[key]),
            status: "confirmed_counseling_preference"
          }
        }));
      }
    }
    for (const [index, delta] of (acceptedSemanticDelta?.acceptedMemoryDeltas?.qualityEnhancingDeltas || []).entries()) {
      decisions.push(this.qualityDecision({
        studentId,
        acceptedSemanticDelta,
        acceptedDeltaId: `qualityEnhancingDeltas.${index}`,
        delta,
        currentTruthBeforeCommit
      }));
    }
    return decisions;
  }

  postResponseDecisions({ studentId, acceptedSemanticDelta, validatedAIOutput, validationResult, finalBoundaryResult, selectedSkillContext } = {}) {
    const decisions = [];
    for (const [index, output] of (validationResult?.acceptedOutputs?.memoryOutputs || []).entries()) {
      decisions.push(this.aiOutputDecision({
        studentId,
        acceptedSemanticDelta,
        selectedSkillContext,
        acceptedDeltaId: `ai.memoryOutputs.${index}`,
        output
      }));
    }
    for (const [index, output] of (validationResult?.acceptedOutputs?.recommendationOutputs || []).entries()) {
      decisions.push(this.aiOutputDecision({
        studentId,
        acceptedSemanticDelta,
        selectedSkillContext,
        acceptedDeltaId: `ai.recommendationOutputs.${index}`,
        output: { type: "recommendation_shown", value: output, confidence: output.confidence || "medium", evidence: validatedAIOutput?.response?.studentMessage }
      }));
    }
    if (validationResult?.acceptedOutputs?.handoffOutput?.required) {
      decisions.push(this.aiOutputDecision({
        studentId,
        acceptedSemanticDelta,
        selectedSkillContext,
        acceptedDeltaId: "ai.handoffOutput",
        output: {
          type: "handoff_required",
          value: {
            triggerType: finalBoundaryResult?.triggerType,
            reason: finalBoundaryResult?.aiBoundaryReason,
            summary: validationResult.acceptedOutputs.handoffOutput.summary
          },
          confidence: "high",
          evidence: validationResult.acceptedOutputs.handoffOutput.summary || finalBoundaryResult?.aiBoundaryReason
        }
      }));
    }
    if (validationResult?.acceptedOutputs?.routeOutcomeOutput) {
      decisions.push(this.aiOutputDecision({
        studentId,
        acceptedSemanticDelta,
        selectedSkillContext,
        acceptedDeltaId: "route.outcomeOutput",
        output: validationResult.acceptedOutputs.routeOutcomeOutput
      }));
    }
    return decisions;
  }

  directionDecision({ studentId, acceptedSemanticDelta, acceptedDeltaId, delta, directionType }) {
    if (delta.status === "rejected") {
      return this.studentDeltaDecision({
        studentId,
        acceptedSemanticDelta,
        acceptedDeltaId,
        delta,
        category: "rejected_option",
        payload: { optionType: directionType, value: valueOf(delta), status: "rejected" }
      });
    }
    return this.studentDeltaDecision({
      studentId,
      acceptedSemanticDelta,
      acceptedDeltaId,
      delta,
      category: `${directionType}_direction`,
      payload: { value: valueOf(delta), status: delta.status || "considering" }
    });
  }

  qualityDecision({ studentId, acceptedSemanticDelta, acceptedDeltaId, delta }) {
    const category = delta.type === "constraint"
      ? "constraint"
      : delta.type === "concern_or_blocker"
        ? "concern_or_blocker"
        : "quality_context";
    return this.studentDeltaDecision({
      studentId,
      acceptedSemanticDelta,
      acceptedDeltaId,
      delta,
      category,
      payload: {
        type: delta.type,
        value: delta.value,
        usefulness: delta.usefulness,
        sensitivity: delta.sensitivity,
        constraintStrength: delta.constraintStrength || (category === "constraint" ? "hard_constraint" : "soft_preference")
      }
    });
  }

  aiOutputDecision({ studentId, acceptedSemanticDelta, selectedSkillContext, acceptedDeltaId, output }) {
    const category = categoryForAiOutput(output);
    if (!category) {
      return this.auditOnlyDecision({
        acceptedDeltaId,
        output,
        reason: "ai_output_is_agent_action_not_durable_memory"
      });
    }

    const delta = {
      operation: "add_new",
      confidence: output.confidence || "medium",
      evidence: evidenceFromOutput(output),
      source: "validated_ai_output"
    };
    return this.createDecision({
      studentId,
      acceptedSemanticDelta,
      acceptedDeltaId,
      delta,
      category,
      commitClass: "post_response_ai_produced_output",
      payload: payloadForOutput(output, selectedSkillContext),
      projectionIntent: category === "decision_support" ? "history_only" : "may_update_current_truth"
    });
  }

  auditOnlyDecision({ acceptedDeltaId, output, reason }) {
    return {
      acceptedDeltaId,
      decision: "audit_only",
      commitClass: "audit_only",
      operation: "add_new",
      projectionIntent: "audit_only_no_projection",
      reasons: [reason],
      warnings: [],
      auditOnlyRecord: {
        outputType: output?.type,
        value: output?.value || output
      },
      officialTruthCheck: {
        passed: !OFFICIAL_TRUTH_PATTERN.test(JSON.stringify(output || {})),
        violationType: OFFICIAL_TRUTH_PATTERN.test(JSON.stringify(output || {})) ? "official_truth_not_memory" : undefined
      }
    };
  }

  studentDeltaDecision(input) {
    return this.createDecision({
      ...input,
      commitClass: "pre_response_student_stated_memory",
      projectionIntent: "may_update_current_truth"
    });
  }

  createDecision({ studentId, acceptedSemanticDelta, acceptedDeltaId, delta, category, commitClass, payload, projectionIntent }) {
    const officialTruthSafe = !OFFICIAL_TRUTH_PATTERN.test(JSON.stringify({ delta, payload }));
    const operationSupported = delta?.operation === "add_new";
    const acceptedSemanticDeltaId = acceptedSemanticDeltaIdOf(acceptedSemanticDelta);
    const eventDraft = officialTruthSafe && operationSupported ? {
      studentId,
      category,
      operation: "add_new",
      payload,
      confidence: delta.confidence || "medium",
      evidence: normalizeEvidence(delta.evidence, delta.source),
      source: {
        acceptedSemanticDeltaId,
        acceptedDeltaId,
        conversationId: acceptedSemanticDelta?.platformMetadata?.conversationId,
        turnId: acceptedSemanticDelta?.platformMetadata?.turnId,
        messageId: acceptedSemanticDelta?.platformMetadata?.messageId
      },
      merge: { projectionIntent },
      officialTruthBoundary: { isOfficialTruth: false }
    } : undefined;

    return {
      acceptedDeltaId,
      decision: eventDraft ? "create_memory_event" : "reject",
      commitClass: eventDraft ? commitClass : "forbidden_official_truth",
      category,
      operation: delta?.operation,
      projectionIntent,
      eventDraft,
      reasons: [
        ...(!operationSupported ? ["operation_not_supported"] : []),
        ...(!officialTruthSafe ? ["official_truth_not_memory"] : [])
      ],
      warnings: [],
      officialTruthCheck: {
        passed: officialTruthSafe,
        violationType: officialTruthSafe ? undefined : "official_truth_not_memory"
      }
    };
  }
}

export function acceptedSemanticDeltaIdOf(acceptedSemanticDelta) {
  const meta = acceptedSemanticDelta?.platformMetadata || {};
  return `${meta.conversationId || "unknown"}:${meta.turnId || "unknown"}:${meta.messageId || "unknown"}`;
}

export function idempotencyKeyFor(draft) {
  return `${draft.studentId}:${draft.source.acceptedSemanticDeltaId}:${draft.source.acceptedDeltaId}:${draft.category}:${draft.operation}`;
}

function normalizeEvidence(evidence, source = "student_message") {
  return (Array.isArray(evidence) ? evidence : [{ quote: evidence }])
    .filter((item) => typeof item?.quote === "string" && item.quote.trim())
    .map((item) => ({
      quote: item.quote,
      source: source === "validated_ai_output" ? "validated_ai_output" : "student_message"
    }));
}

function evidenceFromOutput(output) {
  if (Array.isArray(output.evidence)) return output.evidence;
  if (typeof output.evidence === "string") return [{ quote: output.evidence }];
  return [{ quote: JSON.stringify(output.value || output).slice(0, 160) }];
}

function valueOf(delta) {
  return delta?.value || delta?.courseOrProgram || delta?.university || delta?.pathway;
}

function categoryForAiOutput(output = {}) {
  if (output.type === "route_outcome") return "route_outcome";
  if (HANDOFF_OUTPUTS.has(output.type)) return "handoff_readiness";
  if (output.type === "confirmed_counseling_preference") return "counseling_preference";
  if (output.type === "recommendation_shown") return "recommendation_interaction";
  if (DECISION_SUPPORT_OUTPUTS.has(output.type)) return "decision_support";
  return null;
}

function payloadForOutput(output, selectedSkillContext) {
  if (output.type === "route_outcome") {
    return {
      type: output.type,
      ...(output.value || {}),
      outcome: output.value?.outcome,
      status: output.value?.outcome,
      skillName: selectedSkillContext?.selectedRuntimeSkill?.name
    };
  }
  return {
    type: output.type,
    value: output.value || output,
    status: output.type === "confirmed_counseling_preference" ? "confirmed_counseling_preference" : output.type,
    skillName: selectedSkillContext?.selectedRuntimeSkill?.name
  };
}
