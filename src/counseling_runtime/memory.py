from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
from uuid import uuid4

from .contracts import BoundaryResult, JsonObject, SkillSelection, ValidationResult
from .current_truth import CurrentTruthProjector
from .memory_store import MemoryEventStore
from .memory_validation import MemoryEventDraft, MemoryEventSource, MemoryEventValidator
from .safety import contains_official_truth
from .schemas import AIExecutionResult, Confidence
from .semantic_delta import AcceptedSemanticDelta, AcceptedStudentMemoryCandidate, MemoryCategory, platform_metadata


HANDOFF_OUTPUTS = {"readiness_to_register_signal", "handoff_required"}
AIOutputMemoryCategory = Literal["recommendation_interaction", "handoff_readiness", "route_outcome"]
MemoryEventCategory = MemoryCategory | AIOutputMemoryCategory
MemoryDecisionAction = Literal["create_memory_event", "reject", "audit_only"]
MemoryCommitClass = Literal["pre_response_student_stated_memory", "post_response_ai_produced_output", "audit_only", "forbidden_official_truth"]
MemoryOperation = Literal["add_new"]

@dataclass(slots=True)
class MemoryCommitResult:
    appendedMemoryEventIds: list[str]
    ignoredDuplicateEventIds: list[str]
    rejectedDeltaIds: list[str]
    auditEventIds: list[str]
    warnings: list[str]

    def to_json_dict(self) -> JsonObject:
        return {
            "appendedMemoryEventIds": self.appendedMemoryEventIds,
            "ignoredDuplicateEventIds": self.ignoredDuplicateEventIds,
            "rejectedDeltaIds": self.rejectedDeltaIds,
            "auditEventIds": self.auditEventIds,
            "warnings": self.warnings,
        }



@dataclass(slots=True, frozen=True)
class MemoryWriteDecision:
    accepted_delta_id: str
    action: MemoryDecisionAction
    commit_class: MemoryCommitClass
    category: MemoryEventCategory | None
    operation: MemoryOperation
    payload: JsonObject
    confidence: Confidence
    evidence: list[dict[str, str]]
    projection_intent: str
    reasons: list[str]
    warnings: list[str]

    @property
    def official_truth_safe(self) -> bool:
        return "official_truth_not_memory" not in self.reasons

    def to_json_dict(self) -> JsonObject:
        return {
            "acceptedDeltaId": self.accepted_delta_id,
            "decision": self.action,
            "commitClass": self.commit_class,
            "category": self.category,
            "operation": self.operation,
            "projectionIntent": self.projection_intent,
            "payload": self.payload,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "reasons": self.reasons,
            "warnings": self.warnings,
            "officialTruthCheck": {"passed": self.official_truth_safe, "violationType": None if self.official_truth_safe else "official_truth_not_memory"},
        }


class MemoryStateService:
    def __init__(
        self,
        memory_event_store: MemoryEventStore | None = None,
        memory_event_validator: MemoryEventValidator | None = None,
        current_truth_projector: CurrentTruthProjector | None = None,
    ) -> None:
        self.memory_event_store = memory_event_store or MemoryEventStore()
        self.memory_event_validator = memory_event_validator or MemoryEventValidator()
        self.current_truth_projector = current_truth_projector or CurrentTruthProjector()

    def derive_current_truth(self, student_id: str) -> JsonObject:
        return self.current_truth_projector.project(student_id, self.memory_event_store.get_events_for_projection(student_id))

    def commit_pre_response_student_memory(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDelta) -> MemoryCommitResult:
        drafts = [event_draft_from_candidate(student_id, accepted_semantic_delta, candidate) for candidate in accepted_semantic_delta.accepted_student_memory_candidates]
        return self.commit_event_drafts(None, drafts)

    def commit_post_response_ai_outputs(
        self,
        student_id: str,
        accepted_semantic_delta: AcceptedSemanticDelta,
        validated_ai_output: AIExecutionResult | JsonObject,
        validation_result: ValidationResult | JsonObject,
        final_boundary_result: BoundaryResult | JsonObject,
        selected_skill_context: SkillSelection | JsonObject,
    ) -> MemoryCommitResult:
        ai_output_json = validated_ai_output.model_dump(exclude_none=True) if isinstance(validated_ai_output, AIExecutionResult) else validated_ai_output
        validation_json = validation_result.to_json_dict() if isinstance(validation_result, ValidationResult) else validation_result
        boundary_json = final_boundary_result.to_json_dict() if isinstance(final_boundary_result, BoundaryResult) else final_boundary_result
        skill_json = selected_skill_context.to_json_dict() if isinstance(selected_skill_context, SkillSelection) else selected_skill_context
        if validation_json.get("status") not in {"accepted", "downgraded", "blocked", "clarify", "handoff_override"}:
            return empty_commit_result()
        decisions = post_response_decisions(ai_output_json, validation_json, boundary_json, skill_json)
        return self.commit_decisions(student_id, accepted_semantic_delta, skill_json, decisions)

    def commit_event_drafts(self, selected_skill_context: SkillSelection | JsonObject | None, drafts: list[MemoryEventDraft]) -> MemoryCommitResult:
        result = empty_commit_result()
        for event_draft in drafts:
            validation = self.memory_event_validator.validate(event_draft, selected_skill_context)
            if not validation.accepted() or validation.durable_event is None:
                result.rejectedDeltaIds.append(event_draft.source.accepted_delta_id)
                result.warnings.extend(validation.errors)
                continue
            append = self.memory_event_store.append_validated_event(validation.durable_event, idempotency_key_for(event_draft))
            if append.status == "appended":
                result.appendedMemoryEventIds.append(append.eventId)
            elif append.status == "already_exists":
                result.ignoredDuplicateEventIds.append(append.eventId)
            else:
                result.rejectedDeltaIds.append(event_draft.source.accepted_delta_id)
                result.warnings.extend(append.reason)
        return result

    def commit_decisions(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDelta, selected_skill_context: SkillSelection | JsonObject | None, decisions: list[MemoryWriteDecision]) -> MemoryCommitResult:
        result = empty_commit_result()
        for decision in decisions:
            if decision.action != "create_memory_event":
                if decision.action == "audit_only":
                    result.auditEventIds.append(str(uuid4()))
                else:
                    result.rejectedDeltaIds.append(decision.accepted_delta_id)
                    result.warnings.extend(decision.reasons)
                continue

            event_draft = event_draft_for(decision, student_id, accepted_semantic_delta)
            validation = self.memory_event_validator.validate(event_draft, selected_skill_context)
            if not validation.accepted() or validation.durable_event is None:
                result.rejectedDeltaIds.append(decision.accepted_delta_id)
                result.warnings.extend(validation.errors)
                continue
            append = self.memory_event_store.append_validated_event(validation.durable_event, idempotency_key_for(event_draft))
            if append.status == "appended":
                result.appendedMemoryEventIds.append(append.eventId)
            elif append.status == "already_exists":
                result.ignoredDuplicateEventIds.append(append.eventId)
            else:
                result.rejectedDeltaIds.append(decision.accepted_delta_id)
                result.warnings.extend(append.reason)
        return result


def event_draft_from_candidate(student_id: str, accepted_semantic_delta: AcceptedSemanticDelta, candidate: AcceptedStudentMemoryCandidate) -> MemoryEventDraft:
    meta = accepted_semantic_delta.platform_metadata
    return MemoryEventDraft(
        student_id=student_id,
        category=candidate.category,
        operation=candidate.operation,
        payload=candidate.payload,
        confidence=candidate.confidence,
        evidence=candidate.evidence,
        source=MemoryEventSource(
            accepted_semantic_delta_id=accepted_semantic_delta_id_of(accepted_semantic_delta),
            accepted_delta_id=candidate.accepted_delta_id,
            conversation_id=meta.conversationId,
            turn_id=meta.turnId,
            message_id=meta.messageId,
        ),
        projection_intent=candidate.projection_intent,
    )


def post_response_decisions(validated_ai_output: JsonObject, validation_result: JsonObject, final_boundary_result: JsonObject, selected_skill_context: JsonObject) -> list[MemoryWriteDecision]:
    decisions: list[MemoryWriteDecision] = []
    for index, output in enumerate(validation_result.get("acceptedOutputs", {}).get("recommendationOutputs", [])):
        decisions.append(ai_output_decision(f"ai.recommendationOutputs.{index}", {
            "type": "recommendation_shown",
            "value": output,
            "confidence": output.get("confidence", "medium"),
            "evidence": validated_ai_output.get("response", {}).get("studentMessage"),
        }, selected_skill_context))
    handoff = validation_result.get("acceptedOutputs", {}).get("handoffOutput")
    if handoff and handoff.get("required"):
        decisions.append(ai_output_decision("ai.handoffOutput", {
            "type": "handoff_required",
            "value": {"triggerType": final_boundary_result.get("triggerType"), "reason": final_boundary_result.get("aiBoundaryReason"), "summary": handoff.get("summary")},
            "confidence": "high",
            "evidence": handoff.get("summary") or final_boundary_result.get("aiBoundaryReason"),
        }, selected_skill_context))
    route_outcome = validation_result.get("acceptedOutputs", {}).get("routeOutcomeOutput")
    if route_outcome:
        decisions.append(ai_output_decision("route.outcomeOutput", route_outcome, selected_skill_context))
    return decisions


def ai_output_decision(accepted_delta_id: str, output: JsonObject, selected_skill_context: JsonObject) -> MemoryWriteDecision:
    category = category_for_ai_output(output)
    if not category:
        return MemoryWriteDecision(
            accepted_delta_id=accepted_delta_id,
            action="audit_only",
            commit_class="audit_only",
            category=None,
            operation="add_new",
            payload={},
            confidence=output.get("confidence", "medium"),
            evidence=evidence_from_output(output),
            projection_intent="audit_only",
            reasons=["ai_output_is_agent_action_not_durable_memory"],
            warnings=[],
        )
    delta = {"operation": "add_new", "confidence": output.get("confidence", "medium"), "evidence": evidence_from_output(output), "source": "validated_ai_output"}
    return memory_write_decision(accepted_delta_id, delta, category, "post_response_ai_produced_output", payload_for_output(output, selected_skill_context), "may_update_current_truth")


def memory_write_decision(accepted_delta_id: str, delta: JsonObject, category: MemoryEventCategory, commit_class: MemoryCommitClass, payload: JsonObject, projection_intent: str) -> MemoryWriteDecision:
    official_safe = not contains_official_truth({"delta": delta, "payload": payload})
    operation_supported = delta.get("operation") == "add_new"
    can_commit = official_safe and operation_supported
    return MemoryWriteDecision(
        accepted_delta_id=accepted_delta_id,
        action="create_memory_event" if can_commit else "reject",
        commit_class=commit_class if can_commit else "forbidden_official_truth",
        category=category,
        operation="add_new",
        payload=payload,
        confidence=delta.get("confidence", "medium"),
        evidence=normalize_evidence(delta.get("evidence"), str(delta.get("source") or "student_message")),
        projection_intent=projection_intent,
        reasons=([] if operation_supported else ["operation_not_supported"]) + ([] if official_safe else ["official_truth_not_memory"]),
        warnings=[],
    )


def event_draft_for(decision: MemoryWriteDecision, student_id: str, accepted_semantic_delta: AcceptedSemanticDelta) -> MemoryEventDraft:
    meta = accepted_semantic_delta.platform_metadata
    if decision.category is None:
        raise ValueError("memory event draft requires a category")
    return MemoryEventDraft(
        student_id=student_id,
        category=decision.category,
        operation=decision.operation,
        payload=decision.payload,
        confidence=decision.confidence,
        evidence=decision.evidence,
        source=MemoryEventSource(
            accepted_semantic_delta_id=accepted_semantic_delta_id_of(accepted_semantic_delta),
            accepted_delta_id=decision.accepted_delta_id,
            conversation_id=meta.conversationId,
            turn_id=meta.turnId,
            message_id=meta.messageId,
        ),
        projection_intent=decision.projection_intent,
    )


def accepted_semantic_delta_id_of(accepted_semantic_delta: AcceptedSemanticDelta) -> str:
    meta = accepted_semantic_delta.platform_metadata
    return f"{meta.conversationId or 'unknown'}:{meta.turnId or 'unknown'}:{meta.messageId or 'unknown'}"


def idempotency_key_for(draft: MemoryEventDraft) -> str:
    return f"{draft.student_id}:{draft.source.accepted_semantic_delta_id}:{draft.source.accepted_delta_id}:{draft.category}:{draft.operation}"


def normalize_evidence(evidence: object, source: str = "student_message") -> list[dict[str, str]]:
    items = evidence if isinstance(evidence, list) else [{"quote": evidence}]
    normalized: list[dict[str, str]] = []
    for item in items:
        quote = item.get("quote") if isinstance(item, dict) else None
        if isinstance(quote, str) and quote.strip():
            normalized.append({"quote": quote, "source": "validated_ai_output" if source == "validated_ai_output" else "student_message"})
    return normalized


def evidence_from_output(output: JsonObject) -> list[dict[str, str]]:
    if isinstance(output.get("evidence"), list):
        return output["evidence"]
    if isinstance(output.get("evidence"), str):
        return [{"quote": output["evidence"]}]
    return [{"quote": str(output.get("value") or output)[:160]}]


def category_for_ai_output(output: JsonObject) -> AIOutputMemoryCategory | None:
    return "route_outcome" if output.get("type") == "route_outcome" else "handoff_readiness" if output.get("type") in HANDOFF_OUTPUTS else "recommendation_interaction" if output.get("type") == "recommendation_shown" else None


def payload_for_output(output: JsonObject, selected_skill_context: JsonObject) -> JsonObject:
    selected = selected_skill_context.get("selectedRuntimeSkill", {})
    if output.get("type") == "route_outcome":
        value = output.get("value", {})
        value = value if isinstance(value, dict) else {}
        return {"type": output.get("type"), **value, "outcome": value.get("outcome"), "status": value.get("outcome"), "skillName": selected.get("name")}
    return {"type": output.get("type"), "value": output.get("value") or output, "status": output.get("type"), "skillName": selected.get("name")}


def empty_commit_result() -> MemoryCommitResult:
    return MemoryCommitResult([], [], [], [], [])
