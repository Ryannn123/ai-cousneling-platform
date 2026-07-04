from __future__ import annotations

from uuid import uuid4

from .audit import build_turn_audit_payload, write_audit_event
from .boundary import BoundaryEngine
from .contracts import ConversationState, ExecutionClient, JsonObject, SemanticDeltaExtractor, TurnInput, TurnRequest, TurnResult
from .context import build_operating_context
from .conversation import commit_turn, create_conversation, load_conversation
from .knowledge import KnowledgeGateway
from .llm import AIExecutionClient, AISemanticDeltaExtractor
from .memory import MemoryStateService
from .routes import RouteEpisodeCandidateResolver, RouteEpisodePlanner
from .semantic_delta import SemanticDeltaValidator
from .skills import SkillControlService
from .storage import ensure_runtime_dirs, read_audit_events
from .validation import ValidationPipeline
from .views import build_execution_context, current_truth_for_extraction


class RuntimeErrorWithStatus(RuntimeError):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


class CounselingTurnOrchestrator:
    def __init__(
        self,
        *,
        boundary_engine: BoundaryEngine | None = None,
        skill_control_service: SkillControlService | None = None,
        knowledge_gateway: KnowledgeGateway | None = None,
        ai_execution_client: ExecutionClient | None = None,
        ai_semantic_delta_extractor: SemanticDeltaExtractor | None = None,
        semantic_delta_validator: SemanticDeltaValidator | None = None,
        validation_pipeline: ValidationPipeline | None = None,
        memory_state_service: MemoryStateService | None = None,
        route_episode_candidate_resolver: RouteEpisodeCandidateResolver | None = None,
        route_episode_planner: RouteEpisodePlanner | None = None,
    ) -> None:
        self.boundary_engine = boundary_engine or BoundaryEngine()
        self.skill_control_service = skill_control_service or SkillControlService()
        self.knowledge_gateway = knowledge_gateway or KnowledgeGateway()
        self.ai_execution_client = ai_execution_client or AIExecutionClient()
        self.ai_semantic_delta_extractor = ai_semantic_delta_extractor or AISemanticDeltaExtractor()
        self.semantic_delta_validator = semantic_delta_validator or SemanticDeltaValidator()
        self.validation_pipeline = validation_pipeline or ValidationPipeline()
        self.memory_state_service = memory_state_service or MemoryStateService()
        self.route_episode_candidate_resolver = route_episode_candidate_resolver or RouteEpisodeCandidateResolver()
        self.route_episode_planner = route_episode_planner or RouteEpisodePlanner()

    def create_conversation(self) -> ConversationState:
        ensure_runtime_dirs()
        return ConversationState.model_validate(create_conversation())

    def get_conversation(self, conversation_id: str) -> ConversationState | None:
        state = load_conversation(conversation_id)
        if not state:
            return None
        return ConversationState.model_validate({**state, "auditEvents": read_audit_events(conversation_id)})

    def get_skills(self) -> JsonObject:
        inventory = self.skill_control_service.get_skill_inventory()
        return {
            "loaded": [{"metadata": skill.metadata, "body": skill.body, "ref": skill.ref} for skill in inventory["loaded"]],
            "rejected": inventory["rejected"],
        }

    async def handle_turn(self, body: TurnRequest | JsonObject) -> TurnResult:
        ensure_runtime_dirs()
        request = body if isinstance(body, TurnRequest) else TurnRequest.model_validate(body)
        conversation_id = request.conversationId
        student_message = request.studentMessage
        if not conversation_id or not student_message:
            raise RuntimeErrorWithStatus("conversationId and studentMessage are required", 400)
        previous_state = load_conversation(conversation_id)
        if not previous_state:
            raise RuntimeErrorWithStatus("Conversation not found", 404)

        student_id = conversation_id
        current_truth_before_turn = self.memory_state_service.derive_current_truth(student_id, conversation_id)
        turn_input = TurnInput.model_validate({
            "conversationId": conversation_id,
            "turnId": str(uuid4()),
            "messageId": str(uuid4()),
            "studentMessage": student_message,
            "previousRuntimeState": previous_state,
            "recentConversationSummary": "\n".join(f"{message['role']}: {message['content']}" for message in previous_state.get("messages", [])[-6:]),
            "currentTruthBeforeTurn": current_truth_for_extraction(current_truth_before_turn),
        })

        raw_semantic_delta = await self.ai_semantic_delta_extractor.extract(turn_input)
        accepted_semantic_delta = self.semantic_delta_validator.validate(raw_semantic_delta, turn_input, self.ai_semantic_delta_extractor)
        pre_response_memory_commit_result = self.memory_state_service.commit_pre_response_student_memory(student_id, accepted_semantic_delta, current_truth_before_turn)
        current_truth = self.memory_state_service.derive_current_truth(student_id, conversation_id, turn_input["turnId"])
        route_candidate = self.route_episode_candidate_resolver.resolve(current_truth, accepted_semantic_delta, previous_state.get("operatingContext"), student_message)
        boundary_result = self.boundary_engine.evaluate(turn_input, accepted_semantic_delta)
        active_route_episode = self.route_episode_planner.plan(boundary_result, route_candidate, current_truth, accepted_semantic_delta, previous_state.get("operatingContext"), student_message)
        operating_context = build_operating_context(previous_state, turn_input, boundary_result, accepted_semantic_delta, current_truth, active_route_episode)
        skill_selection = self.skill_control_service.select(operating_context, boundary_result)
        knowledge_answer = self.knowledge_gateway.answer(student_message, accepted_semantic_delta)
        execution_context = build_execution_context(
            student_message,
            turn_input,
            current_truth,
            operating_context,
            boundary_result,
            skill_selection,
            knowledge_answer,
        )
        ai_execution_result = await self.ai_execution_client.execute(execution_context)
        validation_result = self.validation_pipeline.validate(ai_execution_result, boundary_result, operating_context, skill_selection, accepted_semantic_delta)
        response_retry = None
        if validation_result["status"] == "safe_fallback":
            retry_context = {**execution_context, "responseRetry": {"attempt": 1, "previousValidationStatus": validation_result["status"], "validationEvents": validation_result["validationEvents"]}}
            retry_ai_execution_result = await self.ai_execution_client.execute(retry_context)
            retry_validation_result = self.validation_pipeline.validate(retry_ai_execution_result, boundary_result, operating_context, skill_selection, accepted_semantic_delta)
            response_retry = {"attempted": True, "firstValidationStatus": validation_result["status"], "retryValidationStatus": retry_validation_result["status"]}
            ai_execution_result = retry_ai_execution_result
            validation_result = {**retry_validation_result, "responseRetry": response_retry}

        post_response_memory_commit_result = self.memory_state_service.commit_post_response_ai_outputs(student_id, accepted_semantic_delta, ai_execution_result, validation_result, boundary_result, skill_selection)
        committed_operating_context = validation_result.get("acceptedOperatingContext") or operating_context
        final_current_truth = self.memory_state_service.derive_current_truth(student_id, conversation_id, turn_input["turnId"])
        commit_result = commit_turn(conversation_id, student_message, previous_state, committed_operating_context, validation_result, final_current_truth)
        audit_event = write_audit_event(build_turn_audit_payload(
            conversation_id=conversation_id,
            student_message=student_message,
            boundary_result=boundary_result,
            previous_state=previous_state,
            committed_operating_context=committed_operating_context,
            skill_selection=skill_selection,
            ai_execution_result=ai_execution_result,
            validation_result=validation_result,
            commit_result=commit_result,
            current_truth_before_turn=current_truth_before_turn,
            current_truth=current_truth,
            final_current_truth=final_current_truth,
            pre_response_memory_commit_result=pre_response_memory_commit_result,
            post_response_memory_commit_result=post_response_memory_commit_result,
            response_retry=response_retry,
            route_candidate=route_candidate,
            raw_semantic_delta=raw_semantic_delta,
            accepted_semantic_delta=accepted_semantic_delta,
        ))
        runtime_state = load_conversation(conversation_id)
        return TurnResult.model_validate({
            "finalResponse": validation_result["finalResponse"],
            "runtimeState": runtime_state,
            "rawSemanticDelta": raw_semantic_delta,
            "acceptedSemanticDelta": accepted_semantic_delta,
            "boundaryResult": boundary_result,
            "operatingContext": commit_result["committedContext"],
            "currentTruth": final_current_truth,
            "routeCandidate": route_candidate,
            "activeRouteEpisode": active_route_episode,
            "skillSelection": skill_selection,
            "validationResult": validation_result,
            "commitResult": commit_result,
            "preResponseMemoryCommitResult": pre_response_memory_commit_result,
            "postResponseMemoryCommitResult": post_response_memory_commit_result,
            "auditEvent": audit_event,
        })
