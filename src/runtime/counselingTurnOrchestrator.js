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
import { MemoryStateService } from "./memoryStateService.js";
import { RouteEpisodeCandidateResolver } from "./routeEpisodeCandidateResolver.js";
import { RouteEpisodePlanner } from "./routeEpisodePlanner.js";

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
    this.memoryStateService = services.memoryStateService || new MemoryStateService();
    this.routeEpisodeCandidateResolver = services.routeEpisodeCandidateResolver || new RouteEpisodeCandidateResolver();
    this.routeEpisodePlanner = services.routeEpisodePlanner || new RouteEpisodePlanner();
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

    const studentId = conversationId;
    const currentTruthBeforeTurn = await this.memoryStateService.deriveCurrentTruth({
      studentId,
      conversationId
    });

    const turnInput = {
      conversationId,
      turnId: crypto.randomUUID(),
      messageId: crypto.randomUUID(),
      studentMessage,
      previousRuntimeState: previousState,
      recentConversationSummary: previousState.messages.slice(-6).map((message) => `${message.role}: ${message.content}`).join("\n"),
      currentTruthBeforeTurn: currentTruthForExtraction(currentTruthBeforeTurn)
    };

    const fastBoundarySignals = this.boundaryEngine.scan(turnInput);
    const rawSemanticDelta = await this.aiSemanticDeltaExtractor.extract(turnInput, fastBoundarySignals);
    const acceptedSemanticDelta = this.semanticDeltaValidator.validate({
      rawSemanticDelta,
      fastBoundarySignals,
      turnInput,
      extractor: this.aiSemanticDeltaExtractor
    });
    const preResponseMemoryCommitResult = await this.memoryStateService.commitPreResponseStudentMemory({
      studentId,
      acceptedSemanticDelta,
      currentTruthBeforeCommit: currentTruthBeforeTurn
    });
    const currentTruth = await this.memoryStateService.deriveCurrentTruth({
      studentId,
      conversationId,
      turnId: turnInput.turnId
    });
    const routeCandidate = this.routeEpisodeCandidateResolver.resolve({
      currentTruthProjection: currentTruth,
      acceptedSemanticDelta,
      previousOperatingContext: previousState.operatingContext,
      studentMessage
    });
    const boundaryResult = this.boundaryEngine.evaluate(turnInput, { fastBoundarySignals, acceptedSemanticDelta });
    const activeRouteEpisode = this.routeEpisodePlanner.plan({
      boundaryResult,
      routeCandidate,
      currentTruthProjection: currentTruth,
      acceptedSemanticDelta,
      previousOperatingContext: previousState.operatingContext,
      studentMessage
    });
    const { context: operatingContext } = this.operatingContextManager.build(previousState, turnInput, boundaryResult, acceptedSemanticDelta, currentTruth, activeRouteEpisode);
    const skillSelection = await this.skillControlService.select(operatingContext, boundaryResult);

    // Checkpoint 1: platform-controlled context, boundary, skill, and knowledge before AI text.
    const knowledgeAnswer = await this.knowledgeGateway.answer(studentMessage, acceptedSemanticDelta);
    const executionContext = {
      studentMessage,
      conversationContext: turnInput.recentConversationSummary,
      acceptedSemanticDelta: semanticDeltaSummary(acceptedSemanticDelta),
      currentTruth,
      operatingContext,
      activeRouteEpisode: operatingContext.activeRouteEpisode,
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
    let aiExecutionResult = await this.aiExecutionClient.execute(executionContext);
    // Checkpoint 2: AI output is only a proposal until validation and commit accept it.
    let validationResult = this.validationPipeline.validate({ aiExecutionResult, boundaryResult, operatingContext, skillSelection, acceptedSemanticDelta });
    let responseRetry = null;
    if (shouldRetryResponse(validationResult)) {
      const retryExecutionContext = {
        ...executionContext,
        responseRetry: {
          attempt: 1,
          previousValidationStatus: validationResult.status,
          validationEvents: validationResult.validationEvents
        }
      };
      const retryAiExecutionResult = await this.aiExecutionClient.execute(retryExecutionContext);
      const retryValidationResult = this.validationPipeline.validate({
        aiExecutionResult: retryAiExecutionResult,
        boundaryResult,
        operatingContext,
        skillSelection,
        acceptedSemanticDelta
      });
      responseRetry = {
        attempted: true,
        firstValidationStatus: validationResult.status,
        retryValidationStatus: retryValidationResult.status
      };
      aiExecutionResult = retryAiExecutionResult;
      validationResult = {
        ...retryValidationResult,
        responseRetry
      };
    }
    const postResponseMemoryCommitResult = await this.memoryStateService.commitPostResponseAIOutputs({
      studentId,
      acceptedSemanticDelta,
      validatedAIOutput: aiExecutionResult,
      validationResult,
      finalBoundaryResult: boundaryResult,
      selectedSkillContext: skillSelection
    });
    const finalCurrentTruth = await this.memoryStateService.deriveCurrentTruth({
      studentId,
      conversationId,
      turnId: turnInput.turnId
    });
    const commitResult = await commitTurn({
      conversationId,
      studentMessage,
      previousState,
      operatingContext,
      validationResult,
      currentTruth: finalCurrentTruth
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
      memoryStateAudit: {
        currentTruthBeforeTurn,
        currentTruthAfterPreResponseCommit: currentTruth,
        currentTruthAfterPostResponseCommit: finalCurrentTruth,
        preResponseMemoryCommitResult,
        postResponseMemoryCommitResult,
        responseRetry
      },
      routeAudit: {
        routeCandidate,
        activeRouteEpisode,
        routeTransitionDecision: activeRouteEpisode.transitionDecision,
        routeOutcomeValidation: validationResult.routeOutcomeValidation
      },
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
      currentTruth: finalCurrentTruth,
      routeCandidate,
      activeRouteEpisode,
      skillSelection,
      validationResult,
      commitResult,
      preResponseMemoryCommitResult,
      postResponseMemoryCommitResult,
      auditEvent
    };
  }
}

function shouldRetryResponse(validationResult) {
  return validationResult.status === "safe_fallback";
}

function currentTruthForExtraction(currentTruth) {
  return {
    instruction: "Read-only context. Use only to interpret the new student message. Do not re-emit existing memory unless the student restates, corrects, rejects, or changes it.",
    academicResultStatus: currentTruth.academic.academicResultStatus,
    latestUsableAcademicResult: currentTruth.academic.latestUsableAcademicResult?.rawText,
    courseDirectionStatus: currentTruth.direction.courseDirectionStatus,
    universityDirectionStatus: currentTruth.direction.universityDirectionStatus,
    pathwayDirectionStatus: currentTruth.direction.pathwayDirectionStatus,
    activeCourseDirections: currentTruth.direction.activeCourseDirections.map((item) => ({ value: item.value, status: item.status })),
    activeUniversityDirections: currentTruth.direction.activeUniversityDirections.map((item) => ({ value: item.value, status: item.status })),
    activePathwayDirections: currentTruth.direction.activePathwayDirections.map((item) => ({ value: item.value, status: item.status })),
    preferenceStrength: currentTruth.preference.preferenceStrength,
    confirmedCounselingPreference: currentTruth.preference.confirmedCounselingPreference,
    hardConstraints: currentTruth.qualityContext.hardConstraints.map((item) => item.value),
    softPreferences: currentTruth.qualityContext.softPreferences.map((item) => item.value),
    currentDecisionBlockers: currentTruth.decisionContext.currentDecisionBlockers.map((item) => item.value),
    handoffRequired: currentTruth.handoffReadiness.handoffRequired,
    routeEpisodeProjection: currentTruth.routeEpisodeProjection
  };
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
