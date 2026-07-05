from __future__ import annotations

from .contracts import ActiveRouteEpisode, BoundaryResult, ExecutionContext, JsonObject, KnowledgeAnswer, SkillSelection, TurnInput
from .current_truth_schema import CurrentTruthProjection, DirectionOption, SupportingValue


def current_truth_for_extraction(current_truth: CurrentTruthProjection) -> JsonObject:
    return {
        "instruction": "Read-only context. Use only to interpret the new student message. Do not re-emit existing memory unless the student restates, corrects, rejects, or changes it.",
        "academicResultStatus": current_truth.academic.status,
        "latestUsableAcademicResult": current_truth.academic.latest_usable_result.raw_text if current_truth.academic.latest_usable_result else None,
        "courseDirectionStatus": current_truth.course.status,
        "universityDirectionStatus": current_truth.university.status,
        "pathwayDirectionStatus": current_truth.pathway.status,
        "activeCourseDirections": [compact_direction(item) for item in current_truth.course.active_options],
        "activeUniversityDirections": [compact_direction(item) for item in current_truth.university.active_options],
        "activePathwayDirections": [compact_direction(item) for item in current_truth.pathway.active_options],
        "activeDirection": current_truth.active_direction.to_json_dict(),
        "preferenceStrength": current_truth.preference.strength,
        "confirmedCounselingPreference": current_truth.preference.confirmed.to_json_dict() if current_truth.preference.confirmed else None,
        "hardConstraints": [item.value for item in current_truth.quality_context.hard_constraints],
        "softPreferences": [item.value for item in current_truth.quality_context.soft_preferences],
        "currentDecisionBlockers": [item.value for item in current_truth.decision_blockers],
        "handoffRequired": current_truth.handoff.required,
        "routeHistory": current_truth.route_history.to_json_dict(),
    }


def current_truth_for_response(current_truth: CurrentTruthProjection) -> JsonObject:
    return {
        "academic": {
            "status": current_truth.academic.status,
            "result": current_truth.academic.latest_usable_result.raw_text if current_truth.academic.latest_usable_result else None,
        },
        "directions": {
            "courseStatus": current_truth.course.status,
            "universityStatus": current_truth.university.status,
            "pathwayStatus": current_truth.pathway.status,
            "active": current_truth.active_direction.to_json_dict(),
            "courses": [compact_direction(item) for item in current_truth.course.active_options],
            "universities": [compact_direction(item) for item in current_truth.university.active_options],
            "pathways": [compact_direction(item) for item in current_truth.pathway.active_options],
        },
        "preference": current_truth.preference.to_json_dict(),
        "routeReadiness": current_truth.readiness.route_level,
        "recommendationReadiness": current_truth.readiness.recommendation_level,
        "qualityContext": {
            "hardConstraints": values(current_truth.quality_context.hard_constraints),
            "softPreferences": values(current_truth.quality_context.soft_preferences),
        },
        "blockers": values(current_truth.decision_blockers),
        "recommendationHistory": current_truth.recommendation_history.to_json_dict(),
        "routeHistory": current_truth.route_history.to_json_dict(),
    }


def compact_direction(direction: DirectionOption) -> JsonObject:
    return {"value": direction.value, "status": direction.status}


def values(items: list[SupportingValue]) -> list[object]:
    return [item.value for item in items]


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
    current_truth: CurrentTruthProjection,
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
