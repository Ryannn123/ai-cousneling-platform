import { AuditEventStore } from "./auditEventStore.js";
import { CurrentTruthProjector } from "./currentTruthProjector.js";
import { acceptedSemanticDeltaIdOf, idempotencyKeyFor, MemoryIngestionPolicy } from "./memoryIngestionPolicy.js";
import { MemoryEventStore } from "./memoryEventStore.js";
import { MemoryEventValidator } from "./memoryEventValidator.js";

export class MemoryStateService {
  constructor({
    memoryEventStore = new MemoryEventStore(),
    auditEventStore = new AuditEventStore(),
    ingestionPolicy = new MemoryIngestionPolicy(),
    memoryEventValidator = new MemoryEventValidator(),
    currentTruthProjector = new CurrentTruthProjector()
  } = {}) {
    this.memoryEventStore = memoryEventStore;
    this.auditEventStore = auditEventStore;
    this.ingestionPolicy = ingestionPolicy;
    this.memoryEventValidator = memoryEventValidator;
    this.currentTruthProjector = currentTruthProjector;
  }

  async deriveCurrentTruth({ studentId }) {
    const events = await this.memoryEventStore.getEventsForProjection({ studentId });
    return this.currentTruthProjector.project({ studentId, events });
  }

  async commitPreResponseStudentMemory({ studentId, acceptedSemanticDelta, currentTruthBeforeCommit }) {
    return this.commitDecisions({
      studentId,
      acceptedSemanticDelta,
      decisions: this.ingestionPolicy.preResponseDecisions({ studentId, acceptedSemanticDelta, currentTruthBeforeCommit })
    });
  }

  async commitPostResponseAIOutputs({ studentId, acceptedSemanticDelta, validatedAIOutput, validationResult, finalBoundaryResult, selectedSkillContext }) {
    if (!["accepted", "downgraded", "blocked", "clarify", "handoff_override"].includes(validationResult?.status)) {
      return emptyCommitResult();
    }
    return this.commitDecisions({
      studentId,
      acceptedSemanticDelta,
      selectedSkillContext,
      decisions: this.ingestionPolicy.postResponseDecisions({
        studentId,
        acceptedSemanticDelta,
        validatedAIOutput,
        validationResult,
        finalBoundaryResult,
        selectedSkillContext
      })
    });
  }

  async commitDecisions({ studentId, acceptedSemanticDelta, selectedSkillContext, decisions }) {
    const result = emptyCommitResult();
    for (const decision of decisions) {
      if (decision.decision !== "create_memory_event") {
        result.rejectedDeltaIds.push(decision.acceptedDeltaId);
        result.warnings.push(...decision.reasons);
        result.auditEventIds.push(await this.writeMemoryAudit({ studentId, acceptedSemanticDelta, decision, status: "rejected" }));
        continue;
      }

      const validation = this.memoryEventValidator.validate({ draft: decision.eventDraft, selectedSkillContext });
      if (!["valid", "valid_with_warnings"].includes(validation.status)) {
        result.rejectedDeltaIds.push(decision.acceptedDeltaId);
        result.warnings.push(...validation.errors);
        result.auditEventIds.push(await this.writeMemoryAudit({ studentId, acceptedSemanticDelta, decision, validation, status: "validation_rejected" }));
        continue;
      }

      const append = await this.memoryEventStore.appendValidatedEvent({
        event: validation.durableEvent,
        idempotencyKey: idempotencyKeyFor(decision.eventDraft)
      });
      if (append.status === "appended") result.appendedMemoryEventIds.push(append.eventId);
      else if (append.status === "already_exists") result.ignoredDuplicateEventIds.push(append.existingEventId);
      else {
        result.rejectedDeltaIds.push(decision.acceptedDeltaId);
        result.warnings.push(...append.reasons);
      }
      result.auditEventIds.push(await this.writeMemoryAudit({ studentId, acceptedSemanticDelta, decision, validation, append, status: append.status }));
    }
    return result;
  }

  async writeMemoryAudit({ studentId, acceptedSemanticDelta, decision, validation, append, status }) {
    const meta = acceptedSemanticDelta?.platformMetadata || {};
    const audit = await this.auditEventStore.appendAuditEvent({
      event: {
        eventType: "memory_ingestion",
        severity: status === "appended" || status === "already_exists" ? "info" : "warning",
        studentId,
        conversationId: meta.conversationId,
        turnId: meta.turnId,
        messageId: meta.messageId,
        correlation: {
          acceptedSemanticDeltaId: acceptedSemanticDeltaIdOf(acceptedSemanticDelta),
          acceptedDeltaId: decision.acceptedDeltaId,
          memoryEventId: append?.eventId || append?.existingEventId
        },
        summary: `Memory ingestion ${status} for ${decision.acceptedDeltaId}.`,
        details: { decision, validationStatus: validation?.status, append },
        safetyFlags: {
          officialActionRisk: decision.officialTruthCheck?.passed === false,
          memoryPollutionRisk: status !== "appended" && status !== "already_exists",
          crmTruthLeakageRisk: decision.officialTruthCheck?.passed === false
        }
      }
    });
    return audit.auditEventId;
  }
}

function emptyCommitResult() {
  return {
    appendedMemoryEventIds: [],
    ignoredDuplicateEventIds: [],
    rejectedDeltaIds: [],
    auditEventIds: [],
    warnings: []
  };
}
