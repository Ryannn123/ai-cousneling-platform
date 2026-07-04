import { appendNdjson, AUDIT_PATH } from "./fileStore.js";
import { AuditEventStore } from "./auditEventStore.js";

export async function writeAuditEvent({ conversationId, studentMessage, boundaryResult, operatingContextBefore, operatingContextAfter, skillSelection, aiExecutionResult, validationResult, commitResult, semanticDeltaAudit, memoryStateAudit, routeAudit }) {
  const event = {
    eventType: "turn_audit",
    conversationId,
    turnId: semanticDeltaAudit?.acceptedSemanticDelta?.platformMetadata?.turnId,
    timestamp: new Date().toISOString(),
    studentMessage,
    semanticDeltaAudit,
    memoryStateAudit,
    boundaryResult,
    routeAudit,
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
  await appendRouteAuditEvents({ conversationId, semanticDeltaAudit, routeAudit });
  return event;
}

async function appendRouteAuditEvents({ conversationId, semanticDeltaAudit, routeAudit }) {
  if (!routeAudit) return;
  const store = new AuditEventStore();
  const meta = semanticDeltaAudit?.acceptedSemanticDelta?.platformMetadata || {};
  const common = {
    conversationId,
    studentId: conversationId,
    turnId: meta.turnId,
    messageId: meta.messageId,
    severity: "info",
    correlation: { acceptedSemanticDeltaId: `${conversationId}:${meta.turnId}:${meta.messageId}` }
  };
  if (routeAudit.routeCandidate) {
    await store.appendAuditEvent({
      event: {
        ...common,
        eventType: "route_candidate_selected",
        summary: `Route candidate selected: ${routeAudit.routeCandidate.routeType}.`,
        details: routeAudit.routeCandidate
      }
    });
  }
  if (routeAudit.routeTransitionDecision) {
    await store.appendAuditEvent({
      event: {
        ...common,
        eventType: "route_transition_decision",
        summary: `Route transition: ${routeAudit.routeTransitionDecision.decision}.`,
        details: routeAudit.routeTransitionDecision
      }
    });
  }
  if (routeAudit.routeOutcomeValidation?.status && routeAudit.routeOutcomeValidation.status !== "not_applicable") {
    await store.appendAuditEvent({
      event: {
        ...common,
        severity: routeAudit.routeOutcomeValidation.status === "accepted" ? "info" : "warning",
        eventType: routeAudit.routeOutcomeValidation.status === "accepted" ? "route_outcome_accepted" : "route_outcome_rejected",
        summary: `Route outcome validation ${routeAudit.routeOutcomeValidation.status}.`,
        details: routeAudit.routeOutcomeValidation
      }
    });
  }
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
