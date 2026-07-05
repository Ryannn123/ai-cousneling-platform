from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from .audit import AuditEventStore
from .contracts import BoundaryResult, JsonObject, MemoryCommitResult, SkillSelection, ValidationResult
from .safety import contains_official_truth
from .schemas import AIExecutionResult
from .semantic_delta import AcceptedSemanticDeltaInput, accepted_memory_deltas, platform_metadata
from .settings import MEMORY_EVENTS_PATH
from .storage import append_ndjson, read_ndjson


MEMORY_CATEGORIES = {
    "academic",
    "course_direction",
    "university_direction",
    "pathway_direction",
    "counseling_preference",
    "rejected_option",
    "constraint",
    "quality_context",
    "concern_or_blocker",
    "decision_support",
    "recommendation_interaction",
    "handoff_readiness",
    "route_outcome",
}
ROUTE_OUTCOMES = {"confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"}
HANDOFF_OUTPUTS = {"readiness_to_register_signal", "handoff_required"}


class MemoryEventStore:
    def __init__(self, memory_events_path=MEMORY_EVENTS_PATH) -> None:
        self.memory_events_path = memory_events_path

    def append_validated_event(self, event: JsonObject, idempotency_key: str) -> JsonObject:
        if not event.get("validation", {}).get("validated"):
            return {"status": "rejected_not_validated", "reasons": ["event_not_validated"]}
        duplicate = next((record for record in self.read_records() if record.get("idempotencyKey") == idempotency_key), None)
        if duplicate:
            return {"status": "already_exists", "existingEventId": duplicate["event"]["eventId"], "reasons": ["duplicate_idempotency_key"]}
        append_ndjson(self.memory_events_path, {"idempotencyKey": idempotency_key, "event": event})
        return {"status": "appended", "eventId": event["eventId"], "reasons": []}

    def get_events_for_projection(self, student_id: str | None = None, categories: list[str] | None = None) -> list[JsonObject]:
        category_set = set(categories or [])
        events = [
            event for event in self.read_events()
            if (not student_id or event.get("studentId") == student_id)
            and (not category_set or event.get("category") in category_set)
        ]
        return sorted(events, key=lambda event: (str(event.get("createdAt")), str(event.get("eventId"))))

    def read_events(self) -> list[JsonObject]:
        return [record.get("event", record) for record in self.read_records()]

    def read_records(self) -> list[JsonObject]:
        return read_ndjson(self.memory_events_path)


class MemoryEventValidator:
    def validate(self, draft: JsonObject | None, selected_skill_context: SkillSelection | JsonObject | None = None) -> JsonObject:
        errors: list[str] = []
        warnings: list[str] = []
        invariant = {
            "schemaValid": True,
            "categoryPayloadCompatible": True,
            "operationSupported": (draft or {}).get("operation") == "add_new",
            "evidenceSufficient": has_evidence(draft),
            "promotionSafe": True,
            "officialTruthSafe": not contains_official_truth(draft or {}),
            "projectionIntentSafe": bool((draft or {}).get("merge", {}).get("projectionIntent")),
            "duplicatePolicySafe": True,
        }
        if not draft:
            errors.append("draft_missing")
        if not (draft or {}).get("studentId") or not (draft or {}).get("source", {}).get("conversationId") or not (draft or {}).get("source", {}).get("turnId") or not (draft or {}).get("source", {}).get("messageId"):
            errors.append("source_trace_missing")
        if (draft or {}).get("category") not in MEMORY_CATEGORIES:
            errors.append("category_invalid")
        if not isinstance((draft or {}).get("payload"), dict):
            invariant["categoryPayloadCompatible"] = False
            errors.append("payload_invalid")
        if not invariant["operationSupported"]:
            errors.append("operation_not_supported")
        if not invariant["evidenceSufficient"]:
            errors.append("evidence_missing")
        if not invariant["officialTruthSafe"]:
            errors.append("official_truth_not_memory")
        if not invariant["projectionIntentSafe"]:
            errors.append("projection_intent_missing")
        if (draft or {}).get("category") == "counseling_preference" and (draft or {}).get("payload", {}).get("status") != "confirmed_counseling_preference":
            invariant["promotionSafe"] = False
            errors.append("confirmed_preference_requires_explicit_status")
        if (draft or {}).get("category") == "route_outcome" and (draft or {}).get("payload", {}).get("outcome") not in ROUTE_OUTCOMES:
            invariant["categoryPayloadCompatible"] = False
            errors.append("route_outcome_invalid")
        status = "reject" if errors else "valid_with_warnings" if warnings else "valid"
        durable_event = self.to_durable_event(draft, selected_skill_context) if draft and not errors else None
        return {
            "status": status,
            "durableEvent": durable_event,
            "errors": errors,
            "warnings": warnings,
            "invariantChecks": invariant,
        }

    def to_durable_event(self, draft: JsonObject, selected_skill_context: SkillSelection | JsonObject | None) -> JsonObject:
        selected = (selected_skill_context or {}).get("selectedRuntimeSkill") or {}
        return {
            "eventId": str(uuid4()),
            "studentId": draft["studentId"],
            "conversationId": draft["source"]["conversationId"],
            "turnId": draft["source"]["turnId"],
            "messageId": draft["source"]["messageId"],
            "category": draft["category"],
            "operation": draft["operation"],
            "payload": draft["payload"],
            "confidence": draft.get("confidence"),
            "evidence": draft.get("evidence"),
            "source": {
                "acceptedSemanticDeltaId": draft["source"].get("acceptedSemanticDeltaId"),
                "acceptedDeltaId": draft["source"].get("acceptedDeltaId"),
                "skillName": selected.get("name"),
                "skillVersion": selected.get("version"),
                "skillHash": selected.get("contentHash"),
                "validatorVersion": "memory-event-validator.phase5.v1",
            },
            "merge": draft.get("merge"),
            "officialTruthBoundary": {"isOfficialTruth": False},
            "validation": {"validated": True, "validatorVersion": "memory-event-validator.phase5.v1"},
            "createdAt": datetime.now(UTC).isoformat(),
        }


class MemoryIngestionPolicy:
    def pre_response_decisions(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, current_truth_before_commit: JsonObject | None = None) -> list[JsonObject]:
        decisions: list[JsonObject] = []
        memory = accepted_memory_deltas(accepted_semantic_delta)
        flow = memory.get("flowDrivingDeltas", {})
        for index, delta in enumerate(flow.get("academicResults", [])):
            decisions.append(self.student_delta_decision(student_id, accepted_semantic_delta, f"flow.academicResults.{index}", delta, "academic", {"rawText": value_of(delta), "status": "known"}))
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
                    "value": value_of(flow[key]),
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
            return self.student_delta_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, "rejected_option", {"optionType": direction_type, "value": value_of(delta), "status": "rejected"})
        return self.student_delta_decision(student_id, accepted_semantic_delta, accepted_delta_id, delta, f"{direction_type}_direction", {"value": value_of(delta), "status": delta.get("status", "considering")})

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


class MemoryStateService:
    def __init__(self, memory_event_store: MemoryEventStore | None = None, audit_event_store: AuditEventStore | None = None, ingestion_policy: MemoryIngestionPolicy | None = None, memory_event_validator: MemoryEventValidator | None = None, current_truth_projector: CurrentTruthProjector | None = None) -> None:
        self.memory_event_store = memory_event_store or MemoryEventStore()
        self.audit_event_store = audit_event_store or AuditEventStore()
        self.ingestion_policy = ingestion_policy or MemoryIngestionPolicy()
        self.memory_event_validator = memory_event_validator or MemoryEventValidator()
        self.current_truth_projector = current_truth_projector or CurrentTruthProjector()

    def derive_current_truth(self, student_id: str, conversation_id: str | None = None, turn_id: str | None = None) -> JsonObject:
        return self.current_truth_projector.project(student_id, self.memory_event_store.get_events_for_projection(student_id))

    def commit_pre_response_student_memory(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, current_truth_before_commit: JsonObject) -> MemoryCommitResult:
        return self.commit_decisions(student_id, accepted_semantic_delta, None, self.ingestion_policy.pre_response_decisions(student_id, accepted_semantic_delta, current_truth_before_commit))

    def commit_post_response_ai_outputs(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, validated_ai_output: AIExecutionResult | JsonObject, validation_result: ValidationResult | JsonObject, final_boundary_result: BoundaryResult | JsonObject, selected_skill_context: SkillSelection | JsonObject) -> MemoryCommitResult:
        ai_output_json = validated_ai_output.model_dump(exclude_none=True) if isinstance(validated_ai_output, AIExecutionResult) else validated_ai_output
        validation_json = validation_result.to_json_dict() if isinstance(validation_result, ValidationResult) else validation_result
        boundary_json = final_boundary_result.to_json_dict() if isinstance(final_boundary_result, BoundaryResult) else final_boundary_result
        skill_json = selected_skill_context.to_json_dict() if isinstance(selected_skill_context, SkillSelection) else selected_skill_context
        if validation_json.get("status") not in {"accepted", "downgraded", "blocked", "clarify", "handoff_override"}:
            return empty_commit_result()
        return self.commit_decisions(student_id, accepted_semantic_delta, skill_json, self.ingestion_policy.post_response_decisions(student_id, accepted_semantic_delta, ai_output_json, validation_json, boundary_json, skill_json))

    def commit_decisions(self, student_id: str, accepted_semantic_delta: AcceptedSemanticDeltaInput, selected_skill_context: SkillSelection | JsonObject | None, decisions: list[JsonObject]) -> MemoryCommitResult:
        result = empty_commit_result()
        for decision in decisions:
            if decision.get("decision") != "create_memory_event":
                if decision.get("decision") == "audit_only":
                    result["auditEventIds"].append(str(uuid4()))
                else:
                    result["rejectedDeltaIds"].append(decision.get("acceptedDeltaId"))
                    result["warnings"].extend(decision.get("reasons", []))
                continue
            validation = self.memory_event_validator.validate(decision.get("eventDraft"), selected_skill_context)
            if validation["status"] not in {"valid", "valid_with_warnings"}:
                result["rejectedDeltaIds"].append(decision.get("acceptedDeltaId"))
                result["warnings"].extend(validation["errors"])
                continue
            append = self.memory_event_store.append_validated_event(validation["durableEvent"], idempotency_key_for(decision["eventDraft"]))
            if append["status"] == "appended":
                result["appendedMemoryEventIds"].append(append["eventId"])
            elif append["status"] == "already_exists":
                result["ignoredDuplicateEventIds"].append(append["existingEventId"])
            else:
                result["rejectedDeltaIds"].append(decision.get("acceptedDeltaId"))
                result["warnings"].extend(append.get("reasons", []))
        return result


class CurrentTruthProjector:
    def project(self, student_id: str | None = None, events: list[JsonObject] | None = None) -> JsonObject:
        sorted_events = sorted(events or [], key=lambda event: (str(event.get("createdAt")), str(event.get("eventId"))))
        projection = empty_projection(student_id, sorted_events)
        for event in sorted_events:
            if event.get("operation") != "add_new" or event.get("officialTruthBoundary", {}).get("isOfficialTruth"):
                continue
            apply_event(projection, event)
        finalize_direction(projection)
        finalize_route(projection)
        finalize_recommendation_readiness(projection)
        return projection


def empty_projection(student_id: str | None, events: list[JsonObject]) -> JsonObject:
    return {
        "studentId": student_id,
        "metadata": {"projectorVersion": "current-truth-projector.phase5.v1", "generatedAt": datetime.now(UTC).isoformat(), "sourceEventIds": [event.get("eventId") for event in events], "derivationStatus": "complete", "warnings": []},
        "academic": {"academicResultStatus": "unknown"},
        "direction": {"courseDirectionStatus": "unknown", "universityDirectionStatus": "unknown", "pathwayDirectionStatus": "unknown", "activeCourseDirections": [], "activeUniversityDirections": [], "activePathwayDirections": [], "rejectedOptions": []},
        "preference": {"preferenceStrength": "none"},
        "route": {"routeReadiness": "incomplete", "missingRouteFields": ["academic_result", "course_direction_status", "university_direction_status"], "missingQualityFitSignals": []},
        "recommendationReadiness": {"level": "R1", "basis": {"hasUsableAcademicResult": False, "hasUsableCourseDirection": False, "hasUsableUniversityDirection": False, "hasUsablePathwayDirection": False, "hasEnoughFitSignalsForHighQualityRecommendation": False}, "missingForR2": [], "missingForR3": [], "confidence": "low"},
        "qualityContext": {"hardConstraints": [], "softPreferences": [], "influenceOrContext": [], "qualityContextSummary": ""},
        "decisionContext": {"currentDecisionBlockers": [], "activeComparisonSet": [], "shortlist": [], "tradeoffPriorities": [], "deadlockRisk": "none"},
        "handoffReadiness": {"handoffRequired": False, "triggerTypes": [], "officialTruthBoundary": {"applicationSubmitted": False, "registrationCompleted": False, "paymentConfirmed": False, "enrollmentConfirmed": False, "seatReserved": False, "crmStatusUpdated": False}},
        "routeEpisodeProjection": {"latestRouteOutcomeByRoute": {}, "routeOutcomeHistory": [], "routeDeferralHistory": [], "routeSwitchHistory": [], "fallbackHistory": [], "handoffRouteOutcomes": [], "resumeRouteCandidateHint": None},
    }


def apply_event(projection: JsonObject, event: JsonObject) -> None:
    payload = event.get("payload", {})
    category = event.get("category")
    if category == "academic":
        projection["academic"]["academicResultStatus"] = "known"
        projection["academic"]["latestUsableAcademicResult"] = {"rawText": payload.get("rawText") or payload.get("value"), "confidence": event.get("confidence"), "supportingEventIds": [event.get("eventId")]}
    elif category == "course_direction":
        upsert_direction(projection["direction"]["activeCourseDirections"], event)
    elif category == "university_direction":
        upsert_direction(projection["direction"]["activeUniversityDirections"], event)
    elif category == "pathway_direction":
        upsert_direction(projection["direction"]["activePathwayDirections"], event)
    elif category == "counseling_preference":
        apply_counseling_preference(projection, event)
    elif category == "rejected_option":
        projection["direction"]["rejectedOptions"].append({"optionType": payload.get("optionType"), "value": payload.get("value"), "supportingEventIds": [event.get("eventId")]})
    elif category == "constraint":
        projection["qualityContext"]["hardConstraints"].append(quality_item(event))
    elif category == "quality_context":
        (projection["qualityContext"]["influenceOrContext"] if payload.get("type") == "influence_or_context" else projection["qualityContext"]["softPreferences"]).append(quality_item(event))
    elif category == "concern_or_blocker":
        projection["decisionContext"]["currentDecisionBlockers"].append(quality_item(event))
    elif category == "handoff_readiness":
        apply_handoff_readiness(projection, event)
    elif category == "route_outcome":
        apply_route_outcome(projection, event)


def quality_item(event: JsonObject) -> JsonObject:
    payload = event.get("payload", {})
    return {"type": payload.get("type"), "value": payload.get("value"), "confidence": event.get("confidence"), "supportingEventIds": [event.get("eventId")]}


def upsert_direction(target: list[JsonObject], event: JsonObject) -> None:
    payload = event.get("payload", {})
    existing = next((item for item in target if same_text(item.get("value"), payload.get("value"))), None)
    next_item = {"value": payload.get("value"), "status": payload.get("status", "considering"), "confidence": event.get("confidence"), "supportingEventIds": [*(existing or {}).get("supportingEventIds", []), event.get("eventId")]}
    if existing:
        existing.update(stronger_direction(existing, next_item))
    else:
        target.append(next_item)


def apply_counseling_preference(projection: JsonObject, event: JsonObject) -> None:
    payload = event.get("payload", {})
    preference = projection["preference"].setdefault("confirmedCounselingPreference", {})
    projection["preference"]["preferenceStrength"] = "L4"
    if payload.get("dimension") == "course":
        preference["courseOrProgram"] = payload.get("value")
    if payload.get("dimension") == "university":
        preference["university"] = payload.get("value")
    if payload.get("dimension") == "pathway":
        preference["pathway"] = payload.get("value")
    preference["confidence"] = event.get("confidence")
    preference["supportingEventIds"] = [*preference.get("supportingEventIds", []), event.get("eventId")]


def apply_handoff_readiness(projection: JsonObject, event: JsonObject) -> None:
    payload = event.get("payload", {})
    value = payload.get("value", {})
    projection["handoffReadiness"]["handoffRequired"] = True
    if value.get("triggerType"):
        projection["handoffReadiness"]["triggerTypes"].append(value["triggerType"])
    projection["handoffReadiness"]["readinessContext"] = {"selectedCounselingPreference": projection["preference"].get("confirmedCounselingPreference", {}).get("courseOrProgram"), "reason": value.get("reason") or payload.get("status") or payload.get("type"), "supportingEventIds": [event.get("eventId")]}
    projection["preference"]["preferenceStrength"] = "L5"


def apply_route_outcome(projection: JsonObject, event: JsonObject) -> None:
    payload = event.get("payload", {})
    value = payload.get("value") or payload
    route_type = value.get("routeType") or payload.get("routeType")
    outcome = value.get("outcome") or payload.get("outcome") or payload.get("status")
    if not route_type or not outcome:
        return
    item = {"routeType": route_type, "outcome": outcome, "value": value, "confidence": event.get("confidence"), "supportingEventIds": [event.get("eventId")]}
    route_projection = projection["routeEpisodeProjection"]
    route_projection["routeOutcomeHistory"].append(item)
    route_projection["latestRouteOutcomeByRoute"][route_type] = item
    if outcome == "deferred_decision":
        route_projection["routeDeferralHistory"].append(item)
        route_projection["resumeRouteCandidateHint"] = route_type
    if outcome == "student_switched_route":
        route_projection["routeSwitchHistory"].append(item)
        if value.get("nextRouteCandidate"):
            route_projection["resumeRouteCandidateHint"] = value["nextRouteCandidate"]
    if outcome == "accepted_fallback":
        route_projection["fallbackHistory"].append(item)
    if outcome == "handoff_required":
        route_projection["handoffRouteOutcomes"].append(item)


def finalize_direction(projection: JsonObject) -> None:
    if not projection["direction"]["activeUniversityDirections"]:
        location_signal = next((item for item in [*projection["qualityContext"]["hardConstraints"], *projection["qualityContext"]["softPreferences"]] if isinstance(item.get("value"), dict) and item["value"].get("location")), None)
        if location_signal:
            projection["direction"]["activeUniversityDirections"].append({"value": "location-based universities", "status": "considering", "confidence": location_signal.get("confidence"), "supportingEventIds": location_signal.get("supportingEventIds")})
    projection["direction"]["activeCourseDirections"] = without_rejected(projection["direction"]["activeCourseDirections"], projection, "course")
    projection["direction"]["activeUniversityDirections"] = without_rejected(projection["direction"]["activeUniversityDirections"], projection, "university")
    projection["direction"]["activePathwayDirections"] = without_rejected(projection["direction"]["activePathwayDirections"], projection, "pathway")
    projection["direction"]["courseDirectionStatus"] = direction_status(projection["direction"]["activeCourseDirections"], "course")
    projection["direction"]["universityDirectionStatus"] = direction_status(projection["direction"]["activeUniversityDirections"], "university")
    projection["direction"]["pathwayDirectionStatus"] = direction_status(projection["direction"]["activePathwayDirections"], "pathway")
    preference = projection["preference"].get("confirmedCounselingPreference", {})
    if preference.get("courseOrProgram"):
        projection["direction"]["courseDirectionStatus"] = "confirmed_counseling_course_preference"
    if preference.get("university"):
        projection["direction"]["universityDirectionStatus"] = "confirmed_counseling_university_preference"
    if preference.get("pathway"):
        projection["direction"]["pathwayDirectionStatus"] = "confirmed_counseling_pathway_preference"
    if projection["preference"]["preferenceStrength"] == "none" and has_any_direction(projection):
        projection["preference"]["preferenceStrength"] = strongest_preference(projection)


def finalize_route(projection: JsonObject) -> None:
    missing = []
    if projection["academic"]["academicResultStatus"] != "known":
        missing.append("academic_result")
    if not is_known_direction(projection["direction"]["courseDirectionStatus"]):
        missing.append("course_direction_status")
    if not is_known_direction(projection["direction"]["universityDirectionStatus"]):
        missing.append("university_direction_status")
    projection["route"]["missingRouteFields"] = missing
    projection["route"]["routeReadiness"] = "incomplete" if missing else "ready"


def finalize_recommendation_readiness(projection: JsonObject) -> None:
    basis = projection["recommendationReadiness"]["basis"]
    basis["hasUsableAcademicResult"] = projection["academic"]["academicResultStatus"] == "known"
    basis["hasUsableCourseDirection"] = is_known_direction(projection["direction"]["courseDirectionStatus"])
    basis["hasUsableUniversityDirection"] = is_known_direction(projection["direction"]["universityDirectionStatus"])
    basis["hasUsablePathwayDirection"] = is_known_direction(projection["direction"]["pathwayDirectionStatus"])
    basis["hasEnoughFitSignalsForHighQualityRecommendation"] = bool(projection["qualityContext"]["hardConstraints"] or projection["qualityContext"]["softPreferences"] or projection["qualityContext"]["influenceOrContext"])
    has_direction = basis["hasUsableCourseDirection"] or basis["hasUsableUniversityDirection"] or basis["hasUsablePathwayDirection"]
    projection["recommendationReadiness"]["level"] = "R3" if basis["hasUsableAcademicResult"] and has_direction and basis["hasEnoughFitSignalsForHighQualityRecommendation"] else "R2" if basis["hasUsableAcademicResult"] and has_direction else "R1"
    projection["recommendationReadiness"]["missingForR2"] = ([] if basis["hasUsableAcademicResult"] else ["academic_result"]) + ([] if has_direction else ["course_or_university_or_pathway_direction"])
    projection["recommendationReadiness"]["missingForR3"] = [] if basis["hasEnoughFitSignalsForHighQualityRecommendation"] else ["quality_fit_signal"]
    projection["recommendationReadiness"]["confidence"] = "low" if projection["recommendationReadiness"]["level"] == "R1" else "medium"
    projection["qualityContext"]["qualityContextSummary"] = "; ".join(str(item.get("value")) for item in [*projection["qualityContext"]["hardConstraints"], *projection["qualityContext"]["softPreferences"], *projection["qualityContext"]["influenceOrContext"]])


def accepted_semantic_delta_id_of(accepted_semantic_delta: AcceptedSemanticDeltaInput) -> str:
    meta = platform_metadata(accepted_semantic_delta)
    return f"{meta.get('conversationId', 'unknown')}:{meta.get('turnId', 'unknown')}:{meta.get('messageId', 'unknown')}"


def idempotency_key_for(draft: JsonObject) -> str:
    return f"{draft.get('studentId')}:{draft.get('source', {}).get('acceptedSemanticDeltaId')}:{draft.get('source', {}).get('acceptedDeltaId')}:{draft.get('category')}:{draft.get('operation')}"


def empty_commit_result() -> MemoryCommitResult:
    return MemoryCommitResult()


def has_evidence(draft: JsonObject | None) -> bool:
    return any(isinstance(item, dict) and str(item.get("quote", "")).strip() for item in (draft or {}).get("evidence", []))


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


def value_of(delta: JsonObject) -> object:
    return delta.get("value") or delta.get("courseOrProgram") or delta.get("university") or delta.get("pathway")


def category_for_ai_output(output: JsonObject) -> str | None:
    return "route_outcome" if output.get("type") == "route_outcome" else "handoff_readiness" if output.get("type") in HANDOFF_OUTPUTS else "recommendation_interaction" if output.get("type") == "recommendation_shown" else None


def payload_for_output(output: JsonObject, selected_skill_context: JsonObject) -> JsonObject:
    selected = selected_skill_context.get("selectedRuntimeSkill", {})
    if output.get("type") == "route_outcome":
        value = output.get("value", {})
        value = value if isinstance(value, dict) else {}
        return {"type": output.get("type"), **value, "outcome": value.get("outcome"), "status": value.get("outcome"), "skillName": selected.get("name")}
    return {"type": output.get("type"), "value": output.get("value") or output, "status": output.get("type"), "skillName": selected.get("name")}


def is_known_direction(status: str | None) -> bool:
    return bool(status and status != "unknown")


def same_text(a: object, b: object) -> bool:
    return str(a or "").lower() == str(b or "").lower()


def stronger_direction(current: JsonObject, next_item: JsonObject) -> JsonObject:
    rank = {"considering": 1, "preferred": 2, "confirmed_counseling_preference": 3}
    return next_item if rank.get(str(next_item.get("status") or ""), 0) >= rank.get(str(current.get("status") or ""), 0) else {**current, "supportingEventIds": next_item["supportingEventIds"]}


def direction_status(options: list[JsonObject], option_type: str) -> str:
    if any(item.get("status") == "confirmed_counseling_preference" for item in options):
        return f"confirmed_counseling_{option_type}_preference"
    if any(item.get("status") == "preferred" for item in options):
        return f"preferred_{option_type}_exists"
    if options:
        return f"considering_some_{'universities' if option_type == 'university' else f'{option_type}s'}"
    return "unknown"


def without_rejected(options: list[JsonObject], projection: JsonObject, option_type: str) -> list[JsonObject]:
    rejected = projection["direction"]["rejectedOptions"]
    return [option for option in options if not any(item.get("optionType") == option_type and same_text(item.get("value"), option.get("value")) for item in rejected)]


def has_any_direction(projection: JsonObject) -> bool:
    direction = projection["direction"]
    return bool(direction["activeCourseDirections"] or direction["activeUniversityDirections"] or direction["activePathwayDirections"])


def strongest_preference(projection: JsonObject) -> str:
    all_directions = [*projection["direction"]["activeCourseDirections"], *projection["direction"]["activeUniversityDirections"], *projection["direction"]["activePathwayDirections"]]
    return "L3" if any(item.get("status") == "preferred" for item in all_directions) else "L2" if all_directions else "none"
