from __future__ import annotations

from uuid import uuid4

from .audit import AuditEventStore
from .contracts import BoundaryResult, JsonObject, MemoryCommitResult, SkillSelection, ValidationResult
from .current_truth import CurrentTruthProjector
from .memory_ingestion import MemoryIngestionPolicy, MemoryWriteDecision, event_draft_for, idempotency_key_for
from .memory_store import MemoryEventStore
from .memory_validation import MemoryEventValidator
from .schemas import AIExecutionResult
from .semantic_delta import AcceptedSemanticDelta, AcceptedSemanticDeltaInput


class MemoryStateService:
    def __init__(
        self,
        memory_event_store: MemoryEventStore | None = None,
        audit_event_store: AuditEventStore | None = None,
        ingestion_policy: MemoryIngestionPolicy | None = None,
        memory_event_validator: MemoryEventValidator | None = None,
        current_truth_projector: CurrentTruthProjector | None = None,
    ) -> None:
        self.memory_event_store = memory_event_store or MemoryEventStore()
        self.audit_event_store = audit_event_store or AuditEventStore()
        self.ingestion_policy = ingestion_policy or MemoryIngestionPolicy()
        self.memory_event_validator = memory_event_validator or MemoryEventValidator()
        self.current_truth_projector = current_truth_projector or CurrentTruthProjector()

    def derive_current_truth(self, student_id: str) -> JsonObject:
        return self.current_truth_projector.project(student_id, self.memory_event_store.get_events_for_projection(student_id))

    def commit_pre_response_student_memory(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDelta) -> MemoryCommitResult:
        return self.commit_decisions(student_id, accepted_semantic_delta, None, self.ingestion_policy.pre_response_decisions(student_id, accepted_semantic_delta))

    def commit_post_response_ai_outputs(
        self,
        student_id: str,
        accepted_semantic_delta: AcceptedSemanticDeltaInput,
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
        decisions = self.ingestion_policy.post_response_decisions(student_id, accepted_semantic_delta, ai_output_json, validation_json, boundary_json, skill_json)
        return self.commit_decisions(student_id, accepted_semantic_delta, skill_json, decisions)

    def commit_decisions(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, selected_skill_context: SkillSelection | JsonObject | None, decisions: list[MemoryWriteDecision]) -> MemoryCommitResult:
        result = empty_commit_result()
        for decision in decisions:
            if decision.action != "create_memory_event":
                if decision.action == "audit_only":
                    result["auditEventIds"].append(str(uuid4()))
                else:
                    result["rejectedDeltaIds"].append(decision.accepted_delta_id)
                    result["warnings"].extend(decision.reasons)
                continue
            event_draft = event_draft_for(decision, student_id, accepted_semantic_delta)
            validation = self.memory_event_validator.validate(event_draft, selected_skill_context)
            if validation["status"] not in {"valid", "valid_with_warnings"}:
                result["rejectedDeltaIds"].append(decision.accepted_delta_id)
                result["warnings"].extend(validation["errors"])
                continue
            append = self.memory_event_store.append_validated_event(validation["durableEvent"], idempotency_key_for(event_draft))
            if append["status"] == "appended":
                result["appendedMemoryEventIds"].append(append["eventId"])
            elif append["status"] == "already_exists":
                result["ignoredDuplicateEventIds"].append(append["existingEventId"])
            else:
                result["rejectedDeltaIds"].append(decision.accepted_delta_id)
                result["warnings"].extend(append.get("reasons", []))
        return result


def empty_commit_result() -> MemoryCommitResult:
    return MemoryCommitResult()
