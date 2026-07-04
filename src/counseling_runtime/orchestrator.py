from __future__ import annotations

import re
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from .audit import write_audit_event
from .boundary import BoundaryEngine
from .constants import DEFAULT_CONTEXT, default_context
from .knowledge import KnowledgeGateway
from .llm import AIExecutionClient, AISemanticDeltaExtractor
from .memory import MemoryStateService
from .routes import RouteEpisodeCandidateResolver, RouteEpisodePlanner
from .semantic_delta import SemanticDeltaValidator
from .skills import SkillControlService
from .storage import conversation_path, ensure_runtime_dirs, read_audit_events, read_json, write_json
from .validation import ValidationPipeline


COMPARE = re.compile(r"\b(compare|versus|vs|shortlist|better|between)\b", re.I)
DEFERRAL = re.compile(r"\b(not sure|think about|later|maybe|undecided|confused|discuss with (my )?parents|pause this|more time)\b", re.I)


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
        ai_execution_client: Any | None = None,
        ai_semantic_delta_extractor: Any | None = None,
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

    def create_conversation(self) -> dict[str, Any]:
        ensure_runtime_dirs()
        return create_conversation()

    def get_conversation(self, conversation_id: str) -> dict[str, Any] | None:
        state = load_conversation(conversation_id)
        if not state:
            return None
        return {**state, "auditEvents": read_audit_events(conversation_id)}

    def get_skills(self) -> dict[str, Any]:
        inventory = self.skill_control_service.get_skill_inventory()
        return {
            "loaded": [{"metadata": skill.metadata, "body": skill.body, "ref": skill.ref} for skill in inventory["loaded"]],
            "rejected": inventory["rejected"],
        }

    async def handle_turn(self, body: dict[str, Any]) -> dict[str, Any]:
        ensure_runtime_dirs()
        conversation_id = body.get("conversationId")
        student_message = body.get("studentMessage")
        if not conversation_id or not student_message:
            raise RuntimeErrorWithStatus("conversationId and studentMessage are required", 400)
        previous_state = load_conversation(conversation_id)
        if not previous_state:
            raise RuntimeErrorWithStatus("Conversation not found", 404)

        student_id = conversation_id
        current_truth_before_turn = self.memory_state_service.derive_current_truth(student_id, conversation_id)
        turn_input = {
            "conversationId": conversation_id,
            "turnId": str(uuid4()),
            "messageId": str(uuid4()),
            "studentMessage": student_message,
            "previousRuntimeState": previous_state,
            "recentConversationSummary": "\n".join(f"{message['role']}: {message['content']}" for message in previous_state.get("messages", [])[-6:]),
            "currentTruthBeforeTurn": current_truth_for_extraction(current_truth_before_turn),
        }

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
        execution_context = {
            "studentMessage": student_message,
            "conversationContext": turn_input["recentConversationSummary"],
            "currentTruth": current_truth_for_response(current_truth),
            "activeRouteEpisode": route_episode_for_response(operating_context.get("activeRouteEpisode")),
            "responsePlan": {
                "requiredBehavior": behavior_for_boundary(boundary_result),
                "primaryCounselingAction": operating_context.get("primaryCounselingAction"),
                "counselorResponseMode": operating_context.get("counselorResponseMode"),
                "studentPosture": operating_context.get("studentPosture"),
                "decisionSupportMode": operating_context.get("decisionSupportMode"),
                "nextBestCounselingMove": operating_context.get("nextBestCounselingMove"),
                "zone": boundary_result.get("finalZone"),
                "triggerType": boundary_result.get("triggerType"),
                "boundaryReason": boundary_result.get("aiBoundaryReason"),
                "handoffStatus": operating_context.get("handoffStatus"),
            },
            "skill": {
                "name": skill_selection["selectedRuntimeSkill"]["name"],
                "version": skill_selection["selectedRuntimeSkill"]["version"],
                "body": skill_selection.get("selectedRuntimeSkillBody", ""),
            },
            **({"knowledge": {"answer": knowledge_answer, "uncertaintyLevel": knowledge_answer.get("uncertaintyLevel")}} if knowledge_answer else {}),
        }
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
        audit_event = write_audit_event({
            "conversationId": conversation_id,
            "studentMessage": student_message,
            "boundaryResult": boundary_result,
            "operatingContextBefore": previous_state.get("operatingContext"),
            "operatingContextAfter": commit_result["committedContext"],
            "skillSelection": skill_selection,
            "aiExecutionResult": ai_execution_result,
            "validationResult": validation_result,
            "commitResult": commit_result,
            "memoryStateAudit": {
                "currentTruthBeforeTurn": current_truth_before_turn,
                "currentTruthAfterPreResponseCommit": current_truth,
                "currentTruthAfterPostResponseCommit": final_current_truth,
                "preResponseMemoryCommitResult": pre_response_memory_commit_result,
                "postResponseMemoryCommitResult": post_response_memory_commit_result,
                "responseRetry": response_retry,
            },
            "routeAudit": {
                "routeCandidate": route_candidate,
                "activeRouteEpisode": committed_operating_context.get("activeRouteEpisode"),
                "routeTransitionDecision": (committed_operating_context.get("activeRouteEpisode") or {}).get("transitionDecision"),
                "routeOutcomeValidation": validation_result.get("routeOutcomeValidation"),
            },
            "semanticDeltaAudit": {
                "rawSemanticDelta": raw_semantic_delta,
                "acceptedSemanticDelta": accepted_semantic_delta,
                "rejectedCandidates": accepted_semantic_delta.get("rejectedCandidates"),
                "downgradedCandidates": accepted_semantic_delta.get("downgradedCandidates"),
                "semanticDeltaValidationEvents": accepted_semantic_delta.get("validationEvents"),
                "acceptedStudentPostureSignal": next((signal for signal in accepted_semantic_delta.get("acceptedRuntimeOnlySignals", []) if signal.get("kind") == "student_posture"), None),
                "boundaryResolutionInput": {
                    "acceptedBoundaryRuntimeSignals": [signal for signal in accepted_semantic_delta.get("acceptedRuntimeOnlySignals", []) if signal.get("kind") == "boundary"],
                    "readinessToRegisterSignal": next((signal for signal in accepted_semantic_delta.get("acceptedRuntimeOnlySignals", []) if signal.get("kind") == "boundary" and signal.get("type") == "ready_to_apply_or_register"), None),
                    "ambiguousProceedSignal": next((signal for signal in accepted_semantic_delta.get("acceptedRuntimeOnlySignals", []) if signal.get("kind") == "boundary" and signal.get("type") == "ambiguous_proceed_language"), None),
                },
            },
        })
        runtime_state = load_conversation(conversation_id)
        return {
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
        }


def create_conversation() -> dict[str, Any]:
    conversation_id = str(uuid4())
    now = datetime.now(UTC).isoformat()
    state = {"conversationId": conversation_id, "createdAt": now, "updatedAt": now, "operatingContext": default_context(), "currentTruth": None, "messages": [], "recommendationOutputs": [], "routeOutcomeOutputs": [], "handoff": None, "blockedOutputs": []}
    write_json(conversation_path(conversation_id), state)
    return state


def load_conversation(conversation_id: str) -> dict[str, Any] | None:
    return read_json(conversation_path(conversation_id))


def commit_turn(conversation_id: str, student_message: str, previous_state: dict[str, Any], operating_context: dict[str, Any], validation_result: dict[str, Any], current_truth: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(UTC).isoformat()
    state = previous_state or {"conversationId": conversation_id, "messages": []}
    state["updatedAt"] = now
    state["operatingContext"] = operating_context
    state["currentTruth"] = current_truth
    state.setdefault("routeOutcomeOutputs", [])
    state.pop("memoryOutputs", None)
    state.setdefault("messages", []).append({"role": "student", "content": student_message, "timestamp": now})
    state["messages"].append({"role": "assistant", "content": validation_result["finalResponse"], "timestamp": now})
    recommendation_ids = append_outputs(state.setdefault("recommendationOutputs", []), validation_result["acceptedOutputs"].get("recommendationOutputs", []), now)
    route_outcome_ids = append_outputs(state.setdefault("routeOutcomeOutputs", []), [validation_result["acceptedOutputs"].get("routeOutcomeOutput")] if validation_result["acceptedOutputs"].get("routeOutcomeOutput") else [], now)
    handoff = validation_result["acceptedOutputs"].get("handoffOutput")
    if handoff and handoff.get("required"):
        state["handoff"] = {**handoff, "timestamp": now}
    state.setdefault("blockedOutputs", []).extend({**item, "timestamp": now} for item in validation_result.get("blockedOutputs", []))
    write_json(conversation_path(conversation_id), state)
    return {"committedContext": operating_context, "committedRecommendationOutputIds": recommendation_ids, "committedRouteOutcomeOutputIds": route_outcome_ids, "handoffPrepared": bool(state.get("handoff")), "blockedOutputCount": len(validation_result.get("blockedOutputs", []))}


def append_outputs(target: list[dict[str, Any]], outputs: list[dict[str, Any]], timestamp: str) -> list[str]:
    ids = []
    for output in outputs:
        output_id = str(uuid4())
        target.append({"id": output_id, **output, "timestamp": timestamp})
        ids.append(output_id)
    return ids


def build_operating_context(previous_state: dict[str, Any], turn_input: dict[str, Any], boundary_result: dict[str, Any], accepted_semantic_delta: dict[str, Any], current_truth: dict[str, Any], active_route_episode: dict[str, Any]) -> dict[str, Any]:
    text = turn_input.get("studentMessage", "")
    runtime_signals = accepted_semantic_delta.get("acceptedRuntimeOnlySignals", [])
    has_ambiguity = any(signal.get("kind") == "ambiguity" for signal in runtime_signals)
    primary_action = "clarify_ambiguity" if has_ambiguity and boundary_result.get("allowedNextBehavior") == "continue" else action_from_route(boundary_result, active_route_episode)
    posture = next((signal.get("posture") for signal in runtime_signals if signal.get("kind") == "student_posture"), None) or posture_from_route(active_route_episode, text)
    mode = response_mode_from_route(boundary_result, active_route_episode, text, posture, has_ambiguity)
    context = {
        "currentZone": boundary_result.get("finalZone"),
        "boundary": boundary_result,
        "activeRouteEpisode": active_route_episode,
        "primaryCounselingAction": primary_action,
        "recommendationReadiness": current_truth["recommendationReadiness"]["level"],
        "preferenceStrength": current_truth["preference"]["preferenceStrength"],
        "handoffStatus": boundary_result.get("handoffStatus"),
        "currentTruth": current_truth_summary(current_truth),
        "studentPosture": posture,
        "decisionSupportMode": decision_support_mode(text, active_route_episode),
        "summaryCheckpointStatus": "required" if mode in {"summary_checkpoint", "milestone_confirmation"} else "not_required",
        "milestoneConfirmationStatus": "required" if active_route_episode.get("progressState") == "confirmed_preference" else "not_applicable",
        "nextBestCounselingMove": next_best_move(boundary_result, active_route_episode),
        "validationRequirements": validation_requirements(boundary_result, active_route_episode),
        "counselorResponseMode": mode,
    }
    active_direction = active_direction_from_current_truth(current_truth)
    if active_direction:
        context["activeStudentDirection"] = active_direction
    return context


def action_from_route(boundary_result: dict[str, Any], route: dict[str, Any]) -> str:
    if boundary_result.get("allowedNextBehavior") == "handoff":
        return "prepare_handoff"
    if boundary_result.get("allowedNextBehavior") == "clarify":
        return "clarify_ambiguity"
    if route.get("progressState") == "detour_resume":
        return "answer_detour"
    if route.get("progressState") == "comparison":
        return "compare_shortlist"
    if route.get("progressState") == "confirmed_preference":
        return "confirm_counseling_preference"
    if route.get("progressState") in {"deferral_indecision", "decision_support"}:
        return "support_decision"
    if route.get("progressState") == "recommendation_ready":
        return "recommend_directionally"
    if route.get("routeType") == "initial_route_selection":
        return "orient_initial_route"
    return "explore_route"


def response_mode_from_route(boundary_result: dict[str, Any], route: dict[str, Any], text: str, posture: str | None, has_ambiguity: bool = False) -> str:
    if boundary_result.get("allowedNextBehavior") == "handoff":
        return "handoff_safe"
    if boundary_result.get("allowedNextBehavior") == "clarify" or has_ambiguity:
        return "clarify_once"
    if route.get("progressState") == "confirmed_preference":
        return "milestone_confirmation"
    if route.get("progressState") in {"comparison", "decision_support", "deferral_indecision"}:
        return "decision_support"
    if route.get("progressState") == "detour_resume":
        return "standard"
    if posture == "lost_or_confused" or route.get("routeType") == "initial_route_selection":
        return "reassuring_orientation"
    if route.get("routeType") in {"university_exploration", "course_exploration_within_university_context"}:
        return "route_explanation"
    if COMPARE.search(text) or DEFERRAL.search(text):
        return "decision_support"
    return "standard"


def posture_from_route(route: dict[str, Any], text: str) -> str:
    if re.search(r"\b(human counselor|human counsellor|real person|talk to.*human)\b", text, re.I):
        return "human_help_seeking"
    if COMPARE.search(text):
        return "comparison_oriented"
    if DEFERRAL.search(text):
        return "indecisive"
    return {"university_exploration": "course_first", "course_exploration_within_university_context": "university_first", "pathway_exploration": "pathway_first", "combined_option_validation": "validation_seeking", "course_exploration": "lost_or_confused"}.get(route.get("routeType"), "just_browsing")


def decision_support_mode(text: str, route: dict[str, Any]) -> str | None:
    if COMPARE.search(text) or route.get("progressState") == "comparison":
        return "clarify_tradeoff"
    if DEFERRAL.search(text) or route.get("progressState") == "deferral_indecision":
        return "reflect_blocker"
    return None


def next_best_move(boundary_result: dict[str, Any], route: dict[str, Any]) -> str:
    if boundary_result.get("allowedNextBehavior") == "handoff":
        return "Prepare handoff without completing any official action."
    if boundary_result.get("allowedNextBehavior") == "clarify":
        return "Clarify whether the student means counseling preference or official action."
    return {
        "detour_resume": "Answer factual detour with known facts or caveats, then resume the active route.",
        "comparison": "Compare or shortlist options inside the active route.",
        "confirmed_preference": "Confirm counseling preference without treating it as official action.",
        "deferral_indecision": "Support deferral or indecision without forcing a choice.",
        "recommendation_ready": "Give a directional recommendation or ask one route-fit question.",
    }.get(route.get("progressState"), "Ask one useful question to identify the first counseling route." if route.get("routeType") == "initial_route_selection" else "Explore the active route and ask one purposeful next question.")


def validation_requirements(boundary_result: dict[str, Any], route: dict[str, Any]) -> list[str]:
    return ["official_action_boundary", *(["handoff_safe_response"] if boundary_result.get("allowedNextBehavior") == "handoff" else []), *(["route_outcome_validation"] if route.get("routeOutcomeCandidate") else []), *(["route_transition_validation"] if route.get("transitionDecision", {}).get("requiresValidation") else [])]


def current_truth_summary(current_truth: dict[str, Any]) -> dict[str, Any]:
    return {
        "academicResultStatus": current_truth["academic"]["academicResultStatus"],
        "courseDirectionStatus": current_truth["direction"]["courseDirectionStatus"],
        "universityDirectionStatus": current_truth["direction"]["universityDirectionStatus"],
        "pathwayDirectionStatus": current_truth["direction"]["pathwayDirectionStatus"],
        "routeEpisodeProjection": current_truth["routeEpisodeProjection"],
        "routeReadiness": current_truth["route"]["routeReadiness"],
        "preferenceStrength": current_truth["preference"]["preferenceStrength"],
        "recommendationReadiness": current_truth["recommendationReadiness"]["level"],
        "handoffRequired": current_truth["handoffReadiness"]["handoffRequired"],
    }


def active_direction_from_current_truth(current_truth: dict[str, Any]) -> dict[str, Any] | None:
    preference = current_truth["preference"].get("confirmedCounselingPreference", {})
    course = preference.get("courseOrProgram") or best_direction_value(current_truth["direction"]["activeCourseDirections"])
    university = preference.get("university") or best_direction_value(current_truth["direction"]["activeUniversityDirections"])
    pathway = preference.get("pathway") or best_direction_value(current_truth["direction"]["activePathwayDirections"])
    return {**({"courseOrProgram": course} if course else {}), **({"university": university} if university else {}), **({"pathway": pathway} if pathway else {})} or None


def best_direction_value(directions: list[dict[str, Any]]) -> Any:
    rank = {"confirmed_counseling_preference": 3, "preferred": 2, "considering": 1}
    return sorted(directions, key=lambda item: rank.get(item.get("status"), 0), reverse=True)[0].get("value") if directions else None


def current_truth_for_extraction(current_truth: dict[str, Any]) -> dict[str, Any]:
    return {
        "instruction": "Read-only context. Use only to interpret the new student message. Do not re-emit existing memory unless the student restates, corrects, rejects, or changes it.",
        "academicResultStatus": current_truth["academic"]["academicResultStatus"],
        "latestUsableAcademicResult": (current_truth["academic"].get("latestUsableAcademicResult") or {}).get("rawText"),
        "courseDirectionStatus": current_truth["direction"]["courseDirectionStatus"],
        "universityDirectionStatus": current_truth["direction"]["universityDirectionStatus"],
        "pathwayDirectionStatus": current_truth["direction"]["pathwayDirectionStatus"],
        "activeCourseDirections": [{"value": item.get("value"), "status": item.get("status")} for item in current_truth["direction"]["activeCourseDirections"]],
        "activeUniversityDirections": [{"value": item.get("value"), "status": item.get("status")} for item in current_truth["direction"]["activeUniversityDirections"]],
        "activePathwayDirections": [{"value": item.get("value"), "status": item.get("status")} for item in current_truth["direction"]["activePathwayDirections"]],
        "preferenceStrength": current_truth["preference"]["preferenceStrength"],
        "confirmedCounselingPreference": current_truth["preference"].get("confirmedCounselingPreference"),
        "hardConstraints": [item.get("value") for item in current_truth["qualityContext"]["hardConstraints"]],
        "softPreferences": [item.get("value") for item in current_truth["qualityContext"]["softPreferences"]],
        "currentDecisionBlockers": [item.get("value") for item in current_truth["decisionContext"]["currentDecisionBlockers"]],
        "handoffRequired": current_truth["handoffReadiness"]["handoffRequired"],
        "routeEpisodeProjection": current_truth["routeEpisodeProjection"],
    }


def current_truth_for_response(current_truth: dict[str, Any]) -> dict[str, Any]:
    return {
        "academic": {"status": current_truth["academic"]["academicResultStatus"], "result": (current_truth["academic"].get("latestUsableAcademicResult") or {}).get("rawText")},
        "directions": {
            "courseStatus": current_truth["direction"]["courseDirectionStatus"],
            "universityStatus": current_truth["direction"]["universityDirectionStatus"],
            "pathwayStatus": current_truth["direction"]["pathwayDirectionStatus"],
            "courses": [{"value": item.get("value"), "status": item.get("status")} for item in current_truth["direction"]["activeCourseDirections"]],
            "universities": [{"value": item.get("value"), "status": item.get("status")} for item in current_truth["direction"]["activeUniversityDirections"]],
            "pathways": [{"value": item.get("value"), "status": item.get("status")} for item in current_truth["direction"]["activePathwayDirections"]],
        },
        "preference": current_truth["preference"],
        "routeReadiness": current_truth["route"]["routeReadiness"],
        "recommendationReadiness": current_truth["recommendationReadiness"]["level"],
        "qualityContext": {"hardConstraints": [item.get("value") for item in current_truth["qualityContext"]["hardConstraints"]], "softPreferences": [item.get("value") for item in current_truth["qualityContext"]["softPreferences"]], "influenceOrContext": [item.get("value") for item in current_truth["qualityContext"]["influenceOrContext"]]},
        "blockers": [item.get("value") for item in current_truth["decisionContext"]["currentDecisionBlockers"]],
        "routeEpisodeProjection": current_truth["routeEpisodeProjection"],
    }


def route_episode_for_response(route: dict[str, Any] | None) -> dict[str, Any]:
    route = route or {}
    return {"routeType": route.get("routeType"), "progressState": route.get("progressState"), "routeGoal": route.get("routeGoal"), "transition": (route.get("transitionDecision") or {}).get("decision"), "routeOutcomeCandidate": route.get("routeOutcomeCandidate"), "detour": (route.get("detourOverlay") or {}).get("detourKind"), "activeDirections": route.get("activeDirections"), "preferenceStrength": route.get("preferenceStrength"), "recommendationReadiness": route.get("recommendationReadiness")}


def behavior_for_boundary(boundary_result: dict[str, Any]) -> str:
    if boundary_result.get("allowedNextBehavior") == "handoff":
        return "prepare_handoff"
    if boundary_result.get("allowedNextBehavior") == "clarify":
        return "ask_clarification"
    return "continue_normal_counseling"
