import crypto from "node:crypto";
import { ensureRuntimeDirs, readAuditEvents } from "./fileStore.js";
import { BoundaryEngine } from "./boundaryEngine.js";
import { OperatingContextManager } from "./operatingContextManager.js";
import { SkillControlService } from "./skillControlService.js";
import { KnowledgeGateway } from "./knowledgeGateway.js";
import { AIExecutionClient } from "./aiExecutionClient.js";
import { AIInterpretationClient } from "./aiInterpretationClient.js";
import { InterpretationValidator } from "./interpretationValidator.js";
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
    this.aiInterpretationClient = services.aiInterpretationClient || new AIInterpretationClient();
    this.interpretationValidator = services.interpretationValidator || new InterpretationValidator();
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
    const rawInterpretation = await this.aiInterpretationClient.interpret(turnInput, fastBoundarySignals);
    const acceptedInterpretation = this.interpretationValidator.validate({ rawInterpretation, fastBoundarySignals, turnInput });
    const boundaryResult = this.boundaryEngine.evaluate(turnInput, { fastBoundarySignals, acceptedInterpretation });
    const { context: operatingContext, profileSignals } = this.operatingContextManager.build(previousState, turnInput, boundaryResult, acceptedInterpretation);
    const skillSelection = await this.skillControlService.select(operatingContext, boundaryResult);

    // Checkpoint 1: platform-controlled context, boundary, skill, and knowledge before AI text.
    const knowledgeAnswer = await this.knowledgeGateway.answer(studentMessage, acceptedInterpretation);
    const executionContext = {
      studentMessage,
      conversationContext: turnInput.recentConversationSummary,
      acceptedInterpretation: interpretationSummary(acceptedInterpretation),
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
    const validationResult = this.validationPipeline.validate({ aiExecutionResult, boundaryResult, operatingContext, skillSelection, acceptedInterpretation });
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
      interpretationAudit: {
        rawInterpretation,
        acceptedInterpretation,
        rejectedSignals: acceptedInterpretation.rejectedSignals,
        downgradedSignals: acceptedInterpretation.downgradedSignals,
        interpretationValidationEvents: acceptedInterpretation.validationEvents,
        acceptedStudentPostureSignal: acceptedInterpretation.accepted.studentPostureSignal,
        fastBoundarySignals,
        boundaryResolutionInput: {
          fastBoundarySignals,
          acceptedBoundaryCandidateSignals: acceptedInterpretation.accepted.boundaryCandidateSignals,
          readinessToRegisterSignal: acceptedInterpretation.accepted.flowDriving.readinessToRegisterSignal,
          ambiguousProceedSignal: acceptedInterpretation.accepted.boundaryCandidateSignals.find((signal) => signal.type === "ambiguous_proceed_language")
        }
      }
    });

    const runtimeState = await loadConversation(conversationId);
    return {
      finalResponse: validationResult.finalResponse,
      runtimeState,
      rawInterpretation,
      acceptedInterpretation,
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

function interpretationSummary(acceptedInterpretation) {
  return {
    status: acceptedInterpretation.status,
    flowDriving: acceptedInterpretation.accepted.flowDriving,
    qualityEnhancingSignals: acceptedInterpretation.accepted.qualityEnhancingSignals,
    studentPostureSignal: acceptedInterpretation.accepted.studentPostureSignal,
    boundaryCandidateSignals: acceptedInterpretation.accepted.boundaryCandidateSignals,
    knowledgeNeedSignals: acceptedInterpretation.accepted.knowledgeNeedSignals,
    contradictionSignals: acceptedInterpretation.accepted.contradictionSignals
  };
}
