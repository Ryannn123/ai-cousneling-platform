from __future__ import annotations

from .contracts import ActiveRouteEpisode, BoundaryResult, ExecutionContext, JsonObject, KnowledgeAnswer, SkillSelection, TurnInput

def current_truth_for_extraction(current_truth: JsonObject) -> JsonObject:
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


def current_truth_for_response(current_truth: JsonObject) -> JsonObject:
    return {
        "academic": {
            "status": current_truth["academic"]["academicResultStatus"],
            "result": (current_truth["academic"].get("latestUsableAcademicResult") or {}).get("rawText"),
        },
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
        "qualityContext": {
            "hardConstraints": [item.get("value") for item in current_truth["qualityContext"]["hardConstraints"]],
            "softPreferences": [item.get("value") for item in current_truth["qualityContext"]["softPreferences"]],
            "influenceOrContext": [item.get("value") for item in current_truth["qualityContext"]["influenceOrContext"]],
        },
        "blockers": [item.get("value") for item in current_truth["decisionContext"]["currentDecisionBlockers"]],
        "routeEpisodeProjection": current_truth["routeEpisodeProjection"],
    }


def route_episode_for_response(route: ActiveRouteEpisode | JsonObject | None) -> JsonObject:
    route = route or {}
    return {
        "routeType": route.get("routeType"),
        "progressState": route.get("progressState"),
        "routeGoal": route.get("routeGoal"),
        "transition": (route.get("transitionDecision") or {}).get("decision"),
        "routeOutcomeCandidate": route.get("routeOutcomeCandidate"),
        "detour": (route.get("detourOverlay") or {}).get("detourKind"),
        "activeDirections": route.get("activeDirections"),
        "preferenceStrength": route.get("preferenceStrength"),
        "recommendationReadiness": route.get("recommendationReadiness"),
    }


def behavior_for_boundary(boundary_result: BoundaryResult | JsonObject) -> str:
    if boundary_result.get("allowedNextBehavior") == "handoff":
        return "prepare_handoff"
    if boundary_result.get("allowedNextBehavior") == "clarify":
        return "ask_clarification"
    return "continue_normal_counseling"


def build_execution_context(
    student_message: str,
    turn_input: TurnInput,
    current_truth: JsonObject,
    operating_context: JsonObject,
    boundary_result: BoundaryResult,
    skill_selection: SkillSelection | JsonObject,
    knowledge_answer: KnowledgeAnswer | None,
) -> ExecutionContext:
    context = {
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
    }
    if knowledge_answer:
        context["knowledge"] = {
            "answer": knowledge_answer,
            "uncertaintyLevel": knowledge_answer.get("uncertaintyLevel"),
        }
    return ExecutionContext.model_validate(context)
