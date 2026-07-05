from __future__ import annotations

import re
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from counseling_runtime.api.app import app
from counseling_runtime.knowledge import KnowledgeGateway
from counseling_runtime.llm import AIExecutionClient, build_response_prompt
from counseling_runtime.memory import AuditEventStore, MemoryEventStore, MemoryStateService
from counseling_runtime.orchestrator import CounselingTurnOrchestrator
from counseling_runtime.schemas import AIExecutionResult, AIResponse, ProposedOutputs, SemanticDeltaResult, ValidationFlags
from counseling_runtime.semantic_delta import SemanticDeltaValidator
from counseling_runtime.settings import Settings
from counseling_runtime.skills import SkillControlService


TEST_COURSES = ["psychology", "business", "computer science", "it", "design", "engineering", "accounting"]
TEST_UNIVERSITIES = ["demo metropolitan university", "demo valley university", "demo tech institute", "university a", "university b", "sunway", "taylor's", "taylors", "monash", "apu", "inti", "help", "utar"]
TEST_PATHWAYS = ["foundation", "diploma", "a-level", "a level"]


class MockSemanticDeltaExtractor:
    provider = "mock"
    model = "test"

    async def extract(self, turn_input):
        return mock_semantic_delta(turn_input)


class MockExecutionClient:
    async def execute(self, execution_context):
        return mock_execution(execution_context)


def make_app(tmp_path, **services):
    memory_store = MemoryEventStore(tmp_path / "memory-events.ndjson")
    audit_store = AuditEventStore(tmp_path / "audit.ndjson")
    memory_service = MemoryStateService(memory_event_store=memory_store, audit_event_store=audit_store)
    defaults = {
        "ai_semantic_delta_extractor": MockSemanticDeltaExtractor(),
        "ai_execution_client": MockExecutionClient(),
        "memory_state_service": memory_service,
    }
    defaults.update(services)
    return CounselingTurnOrchestrator(
        **defaults,
    )


def base_delta(text, quote, confidence="high", promotion_risk="none"):
    return {"operation": "add_new", "confidence": confidence, "evidence": [{"quote": str(quote or text)[:160]}], "source": "current_message", "promotionRisk": promotion_risk}


def base_signal(text, quote, confidence="high", promotion_risk="none"):
    return {"confidence": confidence, "evidence": [{"quote": str(quote or text)[:160]}], "source": "current_message", "promotionRisk": promotion_risk}


def title(value):
    return " ".join("IT" if word.upper() == "IT" else f"{word[:1].upper()}{word[1:]}" for word in value.split())


def includes_term(lower_text, term):
    return re.search(rf"\b{re.escape(term.lower()).replace('\\ ', r'\\s+')}\b", lower_text)


def course_deltas(text):
    lower = text.lower()
    return [
        {**base_delta(text, course), "value": "IT" if course == "it" else title(course), "status": "preferred" if re.search(r"\bprefer\b", text, re.I) and includes_term(lower, course) else "considering"}
        for course in TEST_COURSES
        if includes_term(lower, course)
    ]


def university_deltas(text):
    lower = text.lower()
    return [
        {**base_delta(text, university), "value": title(university).replace("Apu", "APU").replace("Utar", "UTAR"), "status": "preferred" if re.search(r"\bprefer\b", text, re.I) and includes_term(lower, university) else "considering"}
        for university in TEST_UNIVERSITIES
        if includes_term(lower, university)
    ]


def pathway_deltas(text):
    lower = text.lower()
    return [
        {**base_delta(text, pathway), "value": title(pathway), "status": "preferred" if re.search(r"\bprefer\b", text, re.I) and pathway in lower else "considering"}
        for pathway in TEST_PATHWAYS
        if pathway in lower
    ]


def confirmed_delta(text, deltas):
    if not re.search(r"\b(my choice|choose|chosen|let'?s go with)\b", text, re.I):
        return None
    delta = deltas[0] if deltas else None
    return {**delta, **base_delta(text, text), "status": "confirmed_counseling_preference", "confidence": "high"} if delta else None


def academic_result_delta(text):
    match = re.search(r"\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?|credits?)\b[^.?!]*", text, re.I)
    return {**base_delta(text, match.group(0)), "value": match.group(0).strip()} if match else None


def boundary_signals(text):
    groups = [
        ("ready_to_apply_or_register", "H1", "red", "handoff", r"\b(apply now|ready to apply|register me|ready to register|start application|enroll me|enrol me)\b"),
        ("official_action_request", "H2", "red", "handoff", r"\b(submit my application|submit.*documents?|update.*status|update.*crm|confirm.*registration)\b"),
        ("payment_or_seat_request", "H3", "red", "handoff", r"\b(pay|payment|deposit|invoice|receipt|reserve.*seat|secure.*intake|confirm.*place|enroll now|enrol now)\b"),
        ("human_requested_support", "H6", "red", "handoff", r"\b(human counselor|human counsellor|real person|someone call me|talk to.*human|staff|agent|do not trust ai)\b"),
        ("ambiguous_proceed_language", None, "yellow", "clarify_once", r"\b(go ahead|proceed|next step|let'?s do this|continue with (it|this|this option)|move forward)\b"),
    ]
    signals = []
    for signal_type, trigger_type, severity, behavior, pattern in groups:
        match = re.search(pattern, text, re.I)
        if match:
            signals.append({**base_signal(text, match.group(0), "high", "official_action_risk" if severity == "red" else "requires_confirmation"), "kind": "boundary", "type": signal_type, "triggerType": trigger_type, "severityCandidate": severity, "recommendedBehavior": behavior})
    return signals


def knowledge_needs(text):
    signals = []
    for signal_type, pattern in [("fees", r"\b(fee|fees|cost|tuition)\b"), ("entry_requirements", r"\b(entry requirement|requirements?|qualify|eligible|eligibility)\b"), ("ranking", r"\b(ranking|rank|ranked|higher)\b")]:
        match = re.search(pattern, text, re.I)
        if match:
            signals.append({**base_signal(text, match.group(0)), "kind": "knowledge_need", "type": signal_type, "query": text, "decisionCriticality": "decision_critical" if signal_type == "entry_requirements" else "possibly_decision_critical"})
    return signals


def route_episode_signals(text):
    signals = []
    if re.search(r"\b(actually|forget .+ first|before choosing|help me choose university|choose university)\b", text, re.I):
        signals.append({**base_signal(text, text, "high", "student_redirected_route"), "kind": "route_episode", "signalType": "student_led_route_switch_signal", "routeHint": "university_exploration" if re.search("university", text, re.I) else "course_exploration"})
    if re.search(r"\b(my choice|choose|chosen|let'?s go with)\b", text, re.I):
        signals.append({**base_signal(text, text, "high", "explicit_route_confirmation"), "kind": "route_episode", "signalType": "route_confirmation_signal", "routeHint": "university_exploration" if re.search(r"sunway|taylor|monash|apu|university", text, re.I) else "course_exploration"})
    if re.search(r"\b(discuss with my parents|more time|pause this|think about it|not ready to choose)\b", text, re.I):
        signals.append({**base_signal(text, text, "high", "route_deferred"), "kind": "route_episode", "signalType": "route_deferral_signal"})
    return signals


def quality_deltas(text):
    deltas = []
    if re.search(r"\b(budget|affordable|cheap|low cost|value)\b", text, re.I):
        deltas.append({**base_delta(text, text), "kind": "quality_enhancing", "type": "constraint", "value": {"budget": "important"}, "usefulness": "high", "sensitivity": "none", "constraintStrength": "hard_constraint"})
    if re.search(r"\b(kl|kuala lumpur|selangor|penang|johor|nearby|near campus)\b", text, re.I):
        deltas.append({**base_delta(text, text), "kind": "quality_enhancing", "type": "preference", "value": {"location": "stated_location"}, "usefulness": "high", "sensitivity": "none", "constraintStrength": "soft_preference"})
    return deltas


def posture_signal(text, flow):
    if re.search(r"\b(human counselor|human counsellor|real person|talk to.*human)\b", text, re.I):
        return {**base_signal(text, text), "kind": "student_posture", "posture": "human_help_seeking", "counselingImplication": "prepare_handoff", "suggestedResponseMode": "handoff_safe"}
    if re.search(r"\b(compare|versus|vs|better|between)\b", text, re.I):
        return {**base_signal(text, text), "kind": "student_posture", "posture": "comparison_oriented", "counselingImplication": "compare_options", "suggestedResponseMode": "decision_support"}
    if re.search(r"\b(my choice|choose|chosen|this option seems best|let'?s go with)\b", text, re.I):
        return {**base_signal(text, text), "kind": "student_posture", "posture": "decision_ready", "counselingImplication": "confirm_preference", "suggestedResponseMode": "milestone_confirmation"}
    if flow["coursesConsidering"] and re.search(r"\b(don'?t know (which )?university|no university|which university)\b", text, re.I):
        return {**base_signal(text, text), "kind": "student_posture", "posture": "course_first", "counselingImplication": "route_to_university_exploration", "suggestedResponseMode": "route_explanation"}
    if re.search(r"\b(confused|undecided|not sure|don'?t know what course)\b", text, re.I):
        return {**base_signal(text, text), "kind": "student_posture", "posture": "lost_or_confused", "counselingImplication": "reassure_and_orient", "suggestedResponseMode": "reassuring_orientation"}
    return None


def mock_semantic_delta(turn_input):
    text = turn_input.get("studentMessage", "")
    courses = course_deltas(text)
    universities = university_deltas(text)
    pathways = pathway_deltas(text)
    flow = {
        "academicResults": [academic_result_delta(text)] if academic_result_delta(text) else [],
        "coursesConsidering": courses,
        "confirmedCounselingCoursePreferences": confirmed_delta(text, courses),
        "universitiesConsidering": universities,
        "confirmedCounselingUniversityPreferences": confirmed_delta(text, universities),
        "pathwaysConsidering": pathways,
        "confirmedCounselingPathwayPreferences": confirmed_delta(text, pathways),
    }
    posture = posture_signal(text, flow)
    return {
        "memoryDeltaCandidates": {"flowDrivingDeltas": flow, "qualityEnhancingDeltas": quality_deltas(text)},
        "runtimeOnlySignalCandidates": [*boundary_signals(text), *knowledge_needs(text), *([posture] if posture else []), *route_episode_signals(text)],
    }


def execution_result(intent, message, extra=None, flags=None):
    extra = extra or {}
    return {
        "response": {"studentMessage": message, "responseIntent": intent},
        "proposedContextUpdate": extra.get("proposedContextUpdate", {}),
        "proposedOutputs": {"recommendationOutputs": extra.get("recommendationOutputs", []), **({"handoffOutput": extra["handoffOutput"]} if extra.get("handoffOutput") else {})},
        "validationFlags": flags or {"needsClarification": False, "boundarySensitive": False, "officialActionRisk": False, "memoryWriteRequiresValidation": True, "knowledgeUsed": False, "knowledgeUncertain": False},
    }


def mock_execution(execution_context):
    plan = execution_context.get("responsePlan", {})
    action = plan.get("primaryCounselingAction")
    required = plan.get("requiredBehavior", "continue_normal_counseling")
    flags = {"needsClarification": required == "ask_clarification", "boundarySensitive": plan.get("zone") != "green", "officialActionRisk": plan.get("zone") == "red", "memoryWriteRequiresValidation": True, "knowledgeUsed": bool(execution_context.get("knowledge")), "knowledgeUncertain": (execution_context.get("knowledge") or {}).get("uncertaintyLevel") == "decision_critical"}
    if required == "prepare_handoff":
        return execution_result("handoff", "I can help prepare the next step, but application, registration, payment, or seat confirmation needs a human counselor. I will prepare a handoff summary so the team can continue with you.", {"handoffOutput": {"required": True, "triggerType": plan.get("triggerType"), "reason": plan.get("boundaryReason"), "summary": f"Student said: \"{execution_context.get('studentMessage')}\". Human counselor should handle official next steps."}}, flags)
    if required == "ask_clarification":
        return execution_result("ask_clarification", "When you say proceed, do you mean this is your counseling preference for now, or that you want to apply or register officially?", flags=flags)
    if action == "answer_detour":
        facts = (execution_context.get("knowledge") or {}).get("answer", {}).get("facts", [])
        fact_text = " ".join(f"{fact['program']} at {fact['university']}: {fact['location']}, about MYR {fact['annualFeeMyr']}/year, {fact['pathwayDuration']}." for fact in facts) if facts else (execution_context.get("knowledge") or {}).get("answer", {}).get("caveat", "I do not have a verified fact for that in the prototype catalog.")
        return execution_result("answer", f"{fact_text} After that, we can return to choosing the best-fit direction.", flags=flags)
    if action == "recommend_directionally":
        return execution_result("recommend", "You already have enough direction for a first counseling recommendation. Psychology could fit if you want people-focused work; Business stays broader. Which matters more to you now: career direction, budget, or location?", {"recommendationOutputs": [{"option": "R2 directional shortlist based on current course or pathway direction", "fitReasons": ["Uses the student's academic result and stated direction"], "assumptions": ["University-fit details can still refine the recommendation"], "cautions": ["Counseling recommendation only; not admission or registration approval"], "confidence": "medium"}]}, flags)
    if action == "compare_shortlist":
        return execution_result("compare", "Psychology is stronger if you want counseling, HR, or human behavior. Business is broader if you want management, marketing, or finance flexibility. Which trade-off matters more to you: focused interest or broader flexibility?", flags=flags)
    if action == "confirm_counseling_preference":
        return execution_result("confirm_preference", "For counseling purposes, I can treat this as your current preferred direction.", flags=flags)
    if action == "orient_initial_route":
        return execution_result("ask_clarification", "To guide you properly, I only need the routing basics first: your academic result, whether you already have a course in mind, and whether you already have a university in mind.", flags=flags)
    return execution_result("answer", "It sounds like you are still finding the right direction. What would you like to compare first?", flags=flags)


@pytest.mark.asyncio
async def test_phase_scenario_reaches_recommendation_comparison_preference_handoff_and_audit(tmp_path):
    runtime = make_app(tmp_path)
    conversation = runtime.create_conversation()
    opening = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "Hi"})
    assert opening["operatingContext"]["primaryCounselingAction"] == "orient_initial_route"
    assert opening["skillSelection"]["selectedRuntimeSkill"]["name"] == "initial-route-orientation"

    recommendation = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."})
    assert recommendation["operatingContext"]["recommendationReadiness"] == "R3"
    assert recommendation["skillSelection"]["selectedRuntimeSkill"]["name"] == "directional-recommendation"
    assert recommendation["validationResult"]["acceptedOutputs"]["recommendationOutputs"][0]["confidence"] == "medium"

    detour = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "What are the fees for Psychology?"})
    assert detour["operatingContext"]["activeRouteEpisode"]["progressState"] == "detour_resume"
    assert detour["skillSelection"]["selectedRuntimeSkill"]["name"] == "factual-detour-answering"

    comparison = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "Compare Psychology and Business for me."})
    assert comparison["operatingContext"]["activeRouteEpisode"]["progressState"] == "comparison"
    assert comparison["skillSelection"]["selectedRuntimeSkill"]["name"] == "shortlist-comparison"

    preference = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "I prefer Psychology as my choice for now."})
    assert preference["operatingContext"]["activeRouteEpisode"]["progressState"] == "confirmed_preference"
    assert preference["validationResult"]["acceptedOutputs"]["routeOutcomeOutput"]["value"]["outcome"] == "confirmed_preference"

    handoff = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "I want to apply now."})
    assert handoff["boundaryResult"]["finalZone"] == "red"
    assert handoff["validationResult"]["status"] == "handoff_override"
    assert handoff["runtimeState"]["handoff"]["required"] is True
    assert handoff["auditEvent"]["skillSelection"]["selectedRuntimeSkill"]


@pytest.mark.asyncio
async def test_ambiguous_proceed_clarifies_without_confirming_preference(tmp_path):
    runtime = make_app(tmp_path)
    conversation = runtime.create_conversation()
    await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."})
    result = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "Ok proceed with it."})
    assert result["boundaryResult"]["finalZone"] == "yellow"
    assert result["validationResult"]["status"] == "clarify"
    assert result["operatingContext"]["primaryCounselingAction"] == "clarify_ambiguity"


@pytest.mark.asyncio
async def test_official_action_variants_hand_off(tmp_path):
    runtime = make_app(tmp_path)
    for message in ["I want to submit my application today.", "Can I pay the deposit now?", "Please enroll me in this course."]:
        conversation = runtime.create_conversation()
        result = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": message})
        assert result["boundaryResult"]["finalZone"] == "red"
        assert result["validationResult"]["status"] == "handoff_override"
        assert result["runtimeState"]["handoff"]["required"] is True


@pytest.mark.asyncio
async def test_unknown_factual_detour_is_caveated_without_memory_output(tmp_path):
    runtime = make_app(tmp_path)
    conversation = runtime.create_conversation()
    result = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "What is the fee for Medicine in London?"})
    assert result["operatingContext"]["activeRouteEpisode"]["progressState"] == "detour_resume"
    assert "do not have a verified catalog fact" in result["finalResponse"]


@pytest.mark.asyncio
async def test_invalid_ai_official_action_output_is_blocked_before_commit(tmp_path):
    class BadExecutionClient:
        async def execute(self, execution_context):
            return execution_result("answer", "Your registration completed successfully.", {"recommendationOutputs": [], "proposedContextUpdate": {}}, {"needsClarification": False, "boundarySensitive": False, "officialActionRisk": True, "memoryWriteRequiresValidation": True, "knowledgeUsed": False, "knowledgeUncertain": False})

    runtime = make_app(tmp_path, ai_execution_client=BadExecutionClient())
    conversation = runtime.create_conversation()
    result = await runtime.handle_turn({"conversationId": conversation["conversationId"], "studentMessage": "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."})
    assert result["validationResult"]["status"] == "safe_fallback"
    assert "cannot complete application" in result["finalResponse"]
    assert result["validationResult"]["blockedOutputs"][0]["reason"] == "official_action_output_not_commit_eligible"


def test_skill_inventory_rejects_draft_and_loads_approved(tmp_path):
    for name, status in [("approved-skill", "approved"), ("draft-invalid-skill", "draft")]:
        directory = tmp_path / name
        directory.mkdir()
        (directory / "SKILL.md").write_text(f"---\nname: {name}\ndescription: Test skill\nversion: 1.0.0\nartifact_type: runtime_skill\nstatus: {status}\nowner: counseling_team\n---\n# {name}\n", encoding="utf-8")
    inventory = SkillControlService(tmp_path).get_skill_inventory()
    assert any(skill.ref["name"] == "approved-skill" for skill in inventory["loaded"])
    assert all(skill.ref["contentHash"] for skill in inventory["loaded"])
    assert any(item["skill"]["name"] == "draft-invalid-skill" and item["reason"] == "status_draft" for item in inventory["rejected"])


def test_knowledge_gateway_answers_seed_catalog_and_caveats_unknowns():
    gateway = KnowledgeGateway()
    accepted_delta = {"acceptedRuntimeOnlySignals": [{"kind": "knowledge_need", "type": "fees", "query": "What is the fee for Psychology in Kuala Lumpur?", "decisionCriticality": "possibly_decision_critical"}]}
    known = gateway.answer("What is the fee for Psychology in Kuala Lumpur?", accepted_delta)
    assert known is not None
    assert known["answerable"] is True
    assert known["facts"][0]["program"] == "Psychology"
    unknown = gateway.answer("What is the fee for Medicine in London?", {"acceptedRuntimeOnlySignals": [{"kind": "knowledge_need", "type": "fees", "query": "What is the fee for Medicine in London?", "decisionCriticality": "decision_critical"}]})
    assert unknown is not None
    assert unknown["answerable"] is False
    assert unknown["uncertaintyLevel"] == "decision_critical"


@pytest.mark.asyncio
async def test_api_create_conversation_and_labels():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        labels = await client.get("/api/labels")
        assert labels.status_code == 200
        assert labels.json()["actions"]["prepare_handoff"] == "Prepare Handoff"
        conversation = await client.post("/api/conversations", json={})
        assert conversation.status_code == 200
        assert conversation.json()["operatingContext"]["currentZone"] == "green"


@pytest.mark.asyncio
async def test_gemini_client_uses_pydantic_ai_structured_output():
    class FakeAgent:
        async def run(self, prompt):
            assert "## Student Message" in prompt
            return SimpleNamespace(output=AIExecutionResult(
                response=AIResponse(studentMessage="Gemini response", responseIntent="answer"),
                proposedContextUpdate={},
                proposedOutputs=ProposedOutputs(recommendationOutputs=[]),
                validationFlags=ValidationFlags(needsClarification=False, boundarySensitive=False, officialActionRisk=False, memoryWriteRequiresValidation=True, knowledgeUsed=False, knowledgeUncertain=False),
            ))

    client = AIExecutionClient(settings=Settings(gemini_api_key="test-key", gemini_model="gemini-test"), agent=FakeAgent())
    result = await client.execute({"studentMessage": "Hello", "responsePlan": {}, "skill": {"body": "# Skill"}})
    assert result["response"]["studentMessage"] == "Gemini response"
    assert "## Runtime Skill" in build_response_prompt({"studentMessage": "Hello", "skill": {"body": "# Skill"}})


def test_semantic_delta_validator_passes_current_truth_metadata():
    accepted = SemanticDeltaValidator().validate(mock_semantic_delta({"studentMessage": "Psychology sounds interesting."}), {"conversationId": "c1", "turnId": "t1", "messageId": "m1", "studentMessage": "Psychology sounds interesting."}, MockSemanticDeltaExtractor())
    assert accepted["platformMetadata"]["conversationId"] == "c1"
    assert accepted["acceptedMemoryDeltas"]["flowDrivingDeltas"]["coursesConsidering"][0]["value"] == "Psychology"


def test_runtime_only_signal_schema_rejects_cross_kind_fields():
    with pytest.raises(ValidationError):
        SemanticDeltaResult.model_validate({
            "runtimeOnlySignalCandidates": [{
                **base_signal("What are the fees?", "fees"),
                "kind": "knowledge_need",
                "type": "fees",
                "query": "What are the fees?",
                "decisionCriticality": "possibly_decision_critical",
                "triggerType": "H1",
            }]
        })
