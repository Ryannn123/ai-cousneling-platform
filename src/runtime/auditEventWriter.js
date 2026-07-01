import crypto from "node:crypto";
import { appendNdjson, AUDIT_PATH } from "./fileStore.js";

export async function writeAuditEvent({ conversationId, studentMessage, boundaryResult, operatingContextBefore, operatingContextAfter, skillSelection, aiExecutionResult, validationResult, commitResult, semanticDeltaAudit }) {
  const event = {
    conversationId,
    turnId: semanticDeltaAudit?.acceptedSemanticDelta?.platformMetadata?.turnId || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    studentMessage,
    semanticDeltaAudit,
    boundaryResult,
    operatingContextBefore,
    operatingContextAfter,
    skillSelection,
    aiExecutionResult,
    validationResult,
    commitResult,
    fallbackUsed: aiExecutionResult.proposedOutputs.memoryOutputs?.some((output) => output.type === "ai_core_fallback_used") || false,
    evaluationLabels: buildEvaluationLabels(boundaryResult, validationResult, commitResult)
  };
  // ponytail: append-only NDJSON is enough until audit querying needs indexes.
  await appendNdjson(AUDIT_PATH, event);
  return event;
}

function buildEvaluationLabels(boundaryResult, validationResult, commitResult) {
  return {
    zone: boundaryResult.finalZone,
    boundaryOverride: validationResult.status === "handoff_override",
    handoffPrepared: commitResult.handoffPrepared,
    blockedOutputCount: commitResult.blockedOutputCount,
    fallbackUsed: validationResult.status === "safe_fallback"
  };
}
