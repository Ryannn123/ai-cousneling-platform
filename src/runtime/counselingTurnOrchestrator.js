import crypto from "node:crypto";
import { ensureRuntimeDirs, readAuditEvents } from "./fileStore.js";
import { BoundaryEngine } from "./boundaryEngine.js";
import { OperatingContextManager } from "./operatingContextManager.js";
import { SkillControlService } from "./skillControlService.js";
import { KnowledgeGateway } from "./knowledgeGateway.js";
import { AIExecutionClient } from "./aiExecutionClient.js";
import { AISemanticDeltaExtractor } from "./aiSemanticDeltaExtractor.js";
import { SemanticDeltaValidator } from "./semanticDeltaValidator.js";
import { ValidationPipeline } from "./validationPipeline.js";
import { commitTurn, createConversation, loadConversation } from "./outputCommitService.js";
import { writeAuditEvent } from "./auditEventWriter.js";

export class CounselingTurnOrchestrator {
  constructor(services = {}) {
    this.boundaryEngine = services.boundaryEngine || new BoundaryEngine();
    this.operatingContextManager = services.operatingContextManager || new OperatingContextManager();
    this.skillControlService = services.skillControlService || new SkillControlService();
    this.knowledgeGateway = services.knowledgeGateway || new KnowledgeGateway();
    this.aiExecutionClient = services.aiExecutionClient || new AIExecutionClient();
    this.aiSemanticDeltaExtractor = services.aiSemanticDeltaExtractor || new AISemanticDeltaExtractor();
    this.semanticDeltaValidator = services.semanticDeltaValidator || new SemanticDeltaValidator();
    this.validationPipeline = services.validationPipeline || new ValidationPipeline();
  }

  async createConversation() {
    await ensureRuntimeDirs();
    return createConversation();
  }

  async getConversation(conversationId) {
    const state = await loadConversation(conversationId);
    if (!state) return null;
    return { ...state, auditEvents: await readAuditEvents(conversationId) };
  }

  async getSkills() {
    return this.skillControlService.getSkillInventory();
  }

  async handleTurn({ conversationId, studentMessage }) {
    await ensureRuntimeDirs();
    if (!conversationId || !studentMessage) {
      const error = new Error("conversationId and studentMessage are required");
      error.statusCode = 400;
      throw error;
    }

    const previousState = await loadConversation(conversationId);
    if (!previousState) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    const turnInput = {
      conversationId,
      turnId: crypto.randomUUID(),
      messageId: crypto.randomUUID(),
      studentMessage,
      previousRuntimeState: previousState,
      recentConversationSummary: previousState.messages.slice(-6).map((message) => `${message.role}: ${message.content}`).join("\n")
    };

    const fastBoundarySignals = this.boundaryEngine.scan(turnInput);
    const rawSemanticDelta = await this.aiSemanticDeltaExtractor.extract(turnInput, fastBoundarySignals);
    const acceptedSemanticDelta = this.semanticDeltaValidator.validate({
      rawSemanticDelta,
      fastBoundarySignals,
      turnInput,
      extractor: this.aiSemanticDeltaExtractor
    });
    const boundaryResult = this.boundaryEngine.evaluate(turnInput, { fastBoundarySignals, acceptedSemanticDelta });
    const { context: operatingContext, profileSignals } = this.operatingContextManager.build(previousState, turnInput, boundaryResult, acceptedSemanticDelta);
    const skillSelection = await this.skillControlService.select(operatingContext, boundaryResult);

    // Checkpoint 1: platform-controlled context, boundary, skill, and knowledge before AI text.
    const knowledgeAnswer = await this.knowledgeGateway.answer(studentMessage, acceptedSemanticDelta);
    const executionContext = {
      studentMessage,
      conversationContext: turnInput.recentConversationSummary,
      acceptedSemanticDelta: semanticDeltaSummary(acceptedSemanticDelta),
      operatingContext,
      boundaryResult,
      skillSelection,
      allowedMemoryOutputTypes: skillSelection.allowedMemoryOutputTypes,
      forbiddenMemoryOutputTypes: skillSelection.forbiddenMemoryOutputTypes,
      requiredResponseBehavior: behaviorForBoundary(boundaryResult),
      counselorLikeGuidance: {
        responseMode: operatingContext.counselorResponseMode,
        responsePattern: ["reflect_student_situation", "guide_next_step", "ask_one_purposeful_question"],
        studentPosture: operatingContext.studentPosture,
        decisionSupportMode: operatingContext.decisionSupportMode
      },
      requiredStructuredSchemaVersion: "phase4.prototype.v1",
      knowledgeContext: knowledgeAnswer ? {
        sources: knowledgeAnswer,
        uncertaintyLevel: knowledgeAnswer.uncertaintyLevel
      } : undefined
    };
    const aiExecutionResult = await this.aiExecutionClient.execute(executionContext);
    // Checkpoint 2: AI output is only a proposal until validation and commit accept it.
    const validationResult = this.validationPipeline.validate({ aiExecutionResult, boundaryResult, operatingContext, skillSelection, acceptedSemanticDelta });
    const commitResult = await commitTurn({
      conversationId,
      studentMessage,
      previousState,
      profileSignals,
      operatingContext,
      validationResult
    });
    const auditEvent = await writeAuditEvent({
      conversationId,
      studentMessage,
      boundaryResult,
      operatingContextBefore: previousState.operatingContext,
      operatingContextAfter: commitResult.committedContext,
      skillSelection,
      aiExecutionResult,
      validationResult,
      commitResult,
      semanticDeltaAudit: {
        rawSemanticDelta,
        acceptedSemanticDelta,
        rejectedCandidates: acceptedSemanticDelta.rejectedCandidates,
        downgradedCandidates: acceptedSemanticDelta.downgradedCandidates,
        semanticDeltaValidationEvents: acceptedSemanticDelta.validationEvents,
        acceptedStudentPostureSignal: acceptedSemanticDelta.acceptedRuntimeOnlySignals.find((signal) => signal.kind === "student_posture"),
        fastBoundarySignals,
        boundaryResolutionInput: {
          fastBoundarySignals,
          acceptedBoundaryRuntimeSignals: acceptedSemanticDelta.acceptedRuntimeOnlySignals.filter((signal) => signal.kind === "boundary"),
          readinessToRegisterSignal: acceptedSemanticDelta.acceptedRuntimeOnlySignals.find((signal) => signal.kind === "boundary" && signal.type === "ready_to_apply_or_register"),
          ambiguousProceedSignal: acceptedSemanticDelta.acceptedRuntimeOnlySignals.find((signal) => signal.kind === "boundary" && signal.type === "ambiguous_proceed_language")
        }
      }
    });

    const runtimeState = await loadConversation(conversationId);
    return {
      finalResponse: validationResult.finalResponse,
      runtimeState,
      rawSemanticDelta,
      acceptedSemanticDelta,
      fastBoundarySignals,
      boundaryResult,
      operatingContext: commitResult.committedContext,
      skillSelection,
      validationResult,
      commitResult,
      auditEvent
    };
  }
}

function behaviorForBoundary(boundaryResult) {
  if (boundaryResult.allowedNextBehavior === "handoff") return "prepare_handoff";
  if (boundaryResult.allowedNextBehavior === "clarify") return "ask_clarification";
  return "continue_normal_counseling";
}

function semanticDeltaSummary(acceptedSemanticDelta) {
  return {
    status: acceptedSemanticDelta.status,
    acceptedMemoryDeltas: acceptedSemanticDelta.acceptedMemoryDeltas,
    acceptedRuntimeOnlySignals: acceptedSemanticDelta.acceptedRuntimeOnlySignals
  };
}
