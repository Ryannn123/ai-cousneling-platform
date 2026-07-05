from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from .contracts import (
    ActiveRouteEpisode,
    BoundaryResult,
    CommitResult,
    ConversationState,
    JsonObject,
    MemoryCommitResult,
    RouteCandidate,
    SkillSelection,
    ValidationResult,
)
from .schemas import AIExecutionResult, SemanticDeltaResult
from .settings import AUDIT_PATH
from .storage import append_ndjson, read_ndjson


class AuditEventStore:
    def __init__(self, audit_path= AUDIT_PATH) -> None:
        self.audit_path = audit_path

    def append_audit_event(self, event: JsonObject, idempotency_key: str | None = None) -> JsonObject:
        records = read_ndjson(self.audit_path)
        if idempotency_key:
            duplicate = next((record for record in records if record.get("idempotencyKey") == idempotency_key), None)
            if duplicate:
                return {"status": "already_exists", "auditEventId": duplicate.get("auditEventId")}
        audit_event = {
            "auditEventId": event.get("auditEventId") or str(uuid4()),
            "createdAt": event.get("createdAt") or datetime.now(UTC).isoformat(),
            **event,
        }
        if idempotency_key:
            audit_event["idempotencyKey"] = idempotency_key
        append_ndjson(self.audit_path, audit_event)
        return {"status": "appended", "auditEventId": audit_event["auditEventId"]}


def write_audit_event(payload: JsonObject) -> JsonObject:
    validation_result = payload["validationResult"]
    boundary_result = payload["boundaryResult"]
    commit_result = payload["commitResult"]
    semantic_audit = payload.get("semanticDeltaAudit") or {}
    accepted_delta = semantic_audit.get("acceptedSemanticDelta") or {}
    meta = accepted_delta.get("platformMetadata") or {}
    event = {
        "eventType": "turn_audit",
        "conversationId": payload["conversationId"],
        "turnId": meta.get("turnId"),
        "timestamp": datetime.now(UTC).isoformat(),
        "studentMessage": payload["studentMessage"],
        "semanticDeltaAudit": semantic_audit,
        "memoryStateAudit": payload.get("memoryStateAudit"),
        "boundaryResult": boundary_result,
        "routeAudit": payload.get("routeAudit"),
        "operatingContextBefore": payload.get("operatingContextBefore"),
        "operatingContextAfter": payload.get("operatingContextAfter"),
        "skillSelection": payload.get("skillSelection"),
        "aiExecutionResult": payload.get("aiExecutionResult"),
        "validationResult": validation_result,
        "commitResult": commit_result,
        "fallbackUsed": validation_result.get("status") == "safe_fallback",
        "evaluationLabels": {
            "zone": boundary_result.get("finalZone"),
            "boundaryOverride": validation_result.get("status") == "handoff_override",
            "handoffPrepared": commit_result.get("handoffPrepared"),
            "blockedOutputCount": commit_result.get("blockedOutputCount"),
            "fallbackUsed": validation_result.get("status") == "safe_fallback",
        },
    }
    append_ndjson(AUDIT_PATH, event)
    return event


def build_turn_audit_payload(
    *,
    conversation_id: str,
    student_message: str,
    boundary_result: BoundaryResult,
    previous_state: JsonObject,
    committed_operating_context: JsonObject,
    skill_selection: SkillSelection,
    ai_execution_result: AIExecutionResult | JsonObject,
    validation_result: ValidationResult,
    commit_result: CommitResult,
    current_truth_before_turn: JsonObject,
    current_truth: JsonObject,
    final_current_truth: JsonObject,
    pre_response_memory_commit_result: MemoryCommitResult,
    post_response_memory_commit_result: MemoryCommitResult,
    response_retry: JsonObject | None,
    route_candidate: RouteCandidate,
    raw_semantic_delta: SemanticDeltaResult | JsonObject,
    accepted_semantic_delta: JsonObject,
) -> JsonObject:
    return {
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
        "semanticDeltaAudit": semantic_delta_audit(raw_semantic_delta, accepted_semantic_delta),
    }


def semantic_delta_audit(raw_semantic_delta: SemanticDeltaResult | JsonObject, accepted_semantic_delta: JsonObject) -> JsonObject:
    runtime_signals = accepted_semantic_delta.get("acceptedRuntimeOnlySignals", [])
    return {
        "rawSemanticDelta": raw_semantic_delta,
        "acceptedSemanticDelta": accepted_semantic_delta,
        "rejectedCandidates": accepted_semantic_delta.get("rejectedCandidates"),
        "downgradedCandidates": accepted_semantic_delta.get("downgradedCandidates"),
        "semanticDeltaValidationEvents": accepted_semantic_delta.get("validationEvents"),
        "acceptedStudentPostureSignal": next((signal for signal in runtime_signals if signal.get("kind") == "student_posture"), None),
        "boundaryResolutionInput": {
            "acceptedBoundaryRuntimeSignals": [signal for signal in runtime_signals if signal.get("kind") == "boundary"],
            "readinessToRegisterSignal": next((signal for signal in runtime_signals if signal.get("kind") == "boundary" and signal.get("type") == "ready_to_apply_or_register"), None),
            "ambiguousProceedSignal": next((signal for signal in runtime_signals if signal.get("kind") == "boundary" and signal.get("type") == "ambiguous_proceed_language"), None),
        },
    }
