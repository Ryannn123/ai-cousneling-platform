from __future__ import annotations

from datetime import UTC, datetime

from .contracts import JsonObject
from .memory_validation import DurableMemoryEvent


class CurrentTruthProjector:
    def project(self, student_id: str, events: list[DurableMemoryEvent]) -> JsonObject:
        sorted_events = [event.to_json_dict() for event in events]
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
    elif category == "concern":
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
    next_item = {"value": payload.get("value"), 'universityType': payload.get('universityType'), "status": payload.get("status", "considering"), "confidence": event.get("confidence"), "supportingEventIds": [*(existing or {}).get("supportingEventIds", []), event.get("eventId")]}
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
