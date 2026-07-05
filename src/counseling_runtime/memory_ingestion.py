from __future__ import annotations

from .contracts import JsonObject
from .safety import contains_official_truth
from .semantic_delta import AcceptedSemanticDeltaInput, accepted_memory_deltas, platform_metadata


HANDOFF_OUTPUTS = {"readiness_to_register_signal", "handoff_required"}


class MemoryIngestionPolicy:
    def pre_response_decisions(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, current_truth_before_commit: JsonObject | None = None) -> list[JsonObject]:
        decisions: list[JsonObject] = []
        memory = accepted_memory_deltas(accepted_semantic_delta)
        flow = memory.get("flowDrivingDeltas", {})
        for index, delta in enumerate(flow.get("academicResults", [])):
            decisions.append(self.student_delta_decision(student_id, accepted_semantic_delta, f"flow.academicResults.{index}", delta, "academic", {"rawText": delta.get("value"), "status": "known"}))
        for key, direction_type in [("coursesConsidering", "course"), ("universitiesConsidering", "university"), ("pathwaysConsidering", "pathway")]:
            for index, delta in enumerate(flow.get(key, [])):
                decisions.append(self.direction_decision(student_id, accepted_semantic_delta, f"flow.{key}.{index}", delta, direction_type))
        for key, direction_type in [
            ("confirmedCounselingCoursePreferences", "course"),
            ("confirmedCounselingUniversityPreferences", "university"),
            ("confirmedCounselingPathwayPreferences", "pathway"),
        ]:
            if flow.get(key):
                decisions.append(self.student_delta_decision(student_id, accepted_semantic_delta, f"flow.{key}", flow[key], "counseling_preference", {
                    "dimension": direction_type,
                    "value": flow[key].get("value"),
                    "status": "confirmed_counseling_preference",
                }))
        for index, delta in enumerate(memory.get("qualityEnhancingDeltas", [])):
            decisions.append(self.quality_decision(student_id, accepted_semantic_delta, f"qualityEnhancingDeltas.{index}", delta))
        return decisions

    def post_response_decisions(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, validated_ai_output: JsonObject, validation_result: JsonObject, final_boundary_result: JsonObject, selected_skill_context: JsonObject) -> list[JsonObject]:
        decisions: list[JsonObject] = []
        for index, output in enumerate(validation_result.get("acceptedOutputs", {}).get("recommendationOutputs", [])):
            decisions.append(self.ai_output_decision(student_id, accepted_semantic_delta, selected_skill_context, f"ai.recommendationOutputs.{index}", {
                "type": "recommendation_shown",
                "value": output,
                "confidence": output.get("confidence", "medium"),
                "evidence": validated_ai_output.get("response", {}).get("studentMessage"),
            }))
        handoff = validation_result.get("acceptedOutputs", {}).get("handoffOutput")
        if handoff and handoff.get("required"):
            decisions.append(self.ai_output_decision(student_id, accepted_semantic_delta, selected_skill_context, "ai.handoffOutput", {
                "type": "handoff_required",
                "value": {"triggerType": final_boundary_result.get("triggerType"), "reason": final_boundary_result.get("aiBoundaryReason"), "summary": handoff.get("summary")},
                "confidence": "high",
                "evidence": handoff.get("summary") or final_boundary_result.get("aiBoundaryReason"),
            }))
        route_outcome = validation_result.get("acceptedOutputs", {}).get("routeOutcomeOutput")
        if route_outcome:
            decisions.append(self.ai_output_decision(student_id, accepted_semantic_delta, selected_skill_context, "route.outcomeOutput", route_outcome))
        return decisions

    def direction_decision(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, accepted_delta_id: str, delta: JsonObject, direction_type: str) -> JsonObject:
        if delta.get("status") == "rejected":
            return self.student_delta_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, "rejected_option", {"optionType": direction_type, "value": delta.get("value"), "status": "rejected"})
        return self.student_delta_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, f"{direction_type}_direction", {"value": delta.get("value"), "status": delta.get("status", "considering")})

    def quality_decision(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, accepted_delta_id: str, delta: JsonObject) -> JsonObject:
        category = "constraint" if delta.get("type") == "constraint" else "concern_or_blocker" if delta.get("type") == "concern_or_blocker" else "quality_context"
        return self.student_delta_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, category, {
            "type": delta.get("type"),
            "value": delta.get("value"),
            "usefulness": delta.get("usefulness"),
            "sensitivity": delta.get("sensitivity"),
            "constraintStrength": delta.get("constraintStrength") or ("hard_constraint" if category == "constraint" else "soft_preference"),
        })

    def student_delta_decision(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, accepted_delta_id: str, delta: JsonObject, category: str, payload: JsonObject) -> JsonObject:
        return self.create_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, category, "pre_response_student_stated_memory", payload, "may_update_current_truth")

    def ai_output_decision(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, selected_skill_context: JsonObject, accepted_delta_id: str, output: JsonObject) -> JsonObject:
        category = category_for_ai_output(output)
        if not category:
            return {"acceptedDeltaId": accepted_delta_id, "decision": "audit_only", "commitClass": "audit_only", "reasons": ["ai_output_is_agent_action_not_durable_memory"], "officialTruthCheck": {"passed": not contains_official_truth(output)}}
        delta = {"operation": "add_new", "confidence": output.get("confidence", "medium"), "evidence": evidence_from_output(output), "source": "validated_ai_output"}
        return self.create_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, category, "post_response_ai_produced_output", payload_for_output(output, selected_skill_context), "may_update_current_truth")

    def create_decision(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, accepted_delta_id: str, delta: JsonObject, category: str, commit_class: str, payload: JsonObject, projection_intent: str) -> JsonObject:
        official_safe = not contains_official_truth({"delta": delta, "payload": payload})
        operation_supported = delta.get("operation") == "add_new"
        event_draft = None
        if official_safe and operation_supported:
            meta = platform_metadata(accepted_semantic_delta)
            event_draft = {
                "studentId": student_id,
                "category": category,
                "operation": "add_new",
                "payload": payload,
                "confidence": delta.get("confidence", "medium"),
                "evidence": normalize_evidence(delta.get("evidence"), str(delta.get("source") or "student_message")),
                "source": {
                    "acceptedSemanticDeltaId": accepted_semantic_delta_id_of(accepted_semantic_delta),
                    "acceptedDeltaId": accepted_delta_id,
                    "conversationId": meta.get("conversationId"),
                    "turnId": meta.get("turnId"),
                    "messageId": meta.get("messageId"),
                },
                "merge": {"projectionIntent": projection_intent},
                "officialTruthBoundary": {"isOfficialTruth": False},
            }
        return {
            "acceptedDeltaId": accepted_delta_id,
            "decision": "create_memory_event" if event_draft else "reject",
            "commitClass": commit_class if event_draft else "forbidden_official_truth",
            "category": category,
            "operation": delta.get("operation"),
            "projectionIntent": projection_intent,
            "eventDraft": event_draft,
            "reasons": ([] if operation_supported else ["operation_not_supported"]) + ([] if official_safe else ["official_truth_not_memory"]),
            "warnings": [],
            "officialTruthCheck": {"passed": official_safe, "violationType": None if official_safe else "official_truth_not_memory"},
        }


def accepted_semantic_delta_id_of(accepted_semantic_delta: AcceptedSemanticDeltaInput) -> str:
    meta = platform_metadata(accepted_semantic_delta)
    return f"{meta.get('conversationId', 'unknown')}:{meta.get('turnId', 'unknown')}:{meta.get('messageId', 'unknown')}"


def idempotency_key_for(draft: JsonObject) -> str:
    return f"{draft.get('studentId')}:{draft.get('source', {}).get('acceptedSemanticDeltaId')}:{draft.get('source', {}).get('acceptedDeltaId')}:{draft.get('category')}:{draft.get('operation')}"


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


def category_for_ai_output(output: JsonObject) -> str | None:
    return "route_outcome" if output.get("type") == "route_outcome" else "handoff_readiness" if output.get("type") in HANDOFF_OUTPUTS else "recommendation_interaction" if output.get("type") == "recommendation_shown" else None


def payload_for_output(output: JsonObject, selected_skill_context: JsonObject) -> JsonObject:
    selected = selected_skill_context.get("selectedRuntimeSkill", {})
    if output.get("type") == "route_outcome":
        value = output.get("value", {})
        value = value if isinstance(value, dict) else {}
        return {"type": output.get("type"), **value, "outcome": value.get("outcome"), "status": value.get("outcome"), "skillName": selected.get("name")}
    return {"type": output.get("type"), "value": output.get("value") or output, "status": output.get("type"), "skillName": selected.get("name")}
