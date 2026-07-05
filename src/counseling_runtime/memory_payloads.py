from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, cast

from .contracts import JsonObject


MemoryEventCategory = Literal[
    "academic",
    "course_direction",
    "university_direction",
    "pathway_direction",
    "counseling_preference",
    "rejected_option",
    "constraint",
    "quality_context",
    "concern",
    "recommendation_interaction",
    "handoff_readiness",
    "route_outcome",
]
RouteOutcome = Literal["confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"]


@dataclass(slots=True, frozen=True)
class AcademicPayload:
    raw_text: Any
    status: str = "known"

    def to_json_dict(self) -> JsonObject:
        return {"rawText": self.raw_text, "status": self.status}


@dataclass(slots=True, frozen=True)
class DirectionPayload:
    value: Any
    status: str
    university_type: Any = None

    def to_json_dict(self) -> JsonObject:
        return {"value": self.value, "status": self.status, "universityType": self.university_type}


@dataclass(slots=True, frozen=True)
class CounselingPreferencePayload:
    dimension: str
    value: Any
    status: str
    university_type: Any = None

    def to_json_dict(self) -> JsonObject:
        return {"dimension": self.dimension, "value": self.value, "status": self.status, "universityType": self.university_type}


@dataclass(slots=True, frozen=True)
class RejectedOptionPayload:
    option_type: str
    value: Any
    status: str = "rejected"

    def to_json_dict(self) -> JsonObject:
        return {"optionType": self.option_type, "value": self.value, "status": self.status}


@dataclass(slots=True, frozen=True)
class QualitySignalPayload:
    type: str
    value: Any
    usefulness: str
    sensitivity: str
    constraint_strength: str

    def to_json_dict(self) -> JsonObject:
        return {
            "type": self.type,
            "value": self.value,
            "usefulness": self.usefulness,
            "sensitivity": self.sensitivity,
            "constraintStrength": self.constraint_strength,
        }


@dataclass(slots=True, frozen=True)
class RecommendationInteractionPayload:
    type: str
    value: Any
    status: str
    skill_name: str | None

    def to_json_dict(self) -> JsonObject:
        return {"type": self.type, "value": self.value, "status": self.status, "skillName": self.skill_name}


@dataclass(slots=True, frozen=True)
class HandoffReadinessPayload:
    type: str
    value: JsonObject
    status: str
    skill_name: str | None

    def to_json_dict(self) -> JsonObject:
        return {"type": self.type, "value": self.value, "status": self.status, "skillName": self.skill_name}


@dataclass(slots=True, frozen=True)
class RouteOutcomePayload:
    type: str
    outcome: RouteOutcome
    status: str
    route_type: str | None
    progress_state: str | None
    previous_route: str | None
    next_route_candidate: str | None
    resume_route_candidate: str | None
    reason: str | None
    skill_name: str | None

    def to_json_dict(self) -> JsonObject:
        return {
            "type": self.type,
            "outcome": self.outcome,
            "status": self.status,
            "routeType": self.route_type,
            "progressState": self.progress_state,
            "previousRoute": self.previous_route,
            "nextRouteCandidate": self.next_route_candidate,
            "resumeRouteCandidate": self.resume_route_candidate,
            "reason": self.reason,
            "skillName": self.skill_name,
        }


MemoryEventPayload = (
    AcademicPayload
    | DirectionPayload
    | CounselingPreferencePayload
    | RejectedOptionPayload
    | QualitySignalPayload
    | RecommendationInteractionPayload
    | HandoffReadinessPayload
    | RouteOutcomePayload
)


def parse_memory_payload(category: MemoryEventCategory, payload: object) -> MemoryEventPayload:
    data = payload if isinstance(payload, dict) else {}
    if category == "academic":
        return AcademicPayload(raw_text=data.get("rawText") or data.get("value"), status=str(data.get("status") or "known"))
    if category in {"course_direction", "university_direction", "pathway_direction"}:
        return DirectionPayload(value=data.get("value"), status=str(data.get("status") or "considering"), university_type=data.get("universityType"))
    if category == "counseling_preference":
        return CounselingPreferencePayload(
            dimension=str(data.get("dimension") or ""),
            value=data.get("value"),
            status=str(data.get("status") or ""),
            university_type=data.get("universityType"),
        )
    if category == "rejected_option":
        return RejectedOptionPayload(option_type=str(data.get("optionType") or ""), value=data.get("value"), status=str(data.get("status") or "rejected"))
    if category in {"constraint", "quality_context", "concern"}:
        return QualitySignalPayload(
            type=str(data.get("type") or category),
            value=data.get("value"),
            usefulness=str(data.get("usefulness") or "medium"),
            sensitivity=str(data.get("sensitivity") or "none"),
            constraint_strength=str(data.get("constraintStrength") or ("hard_constraint" if category == "constraint" else "soft_preference")),
        )
    if category == "recommendation_interaction":
        return RecommendationInteractionPayload(
            type=str(data.get("type") or "recommendation_shown"),
            value=data.get("value") or data,
            status=str(data.get("status") or data.get("type") or "recommendation_shown"),
            skill_name=optional_str(data.get("skillName")),
        )
    if category == "handoff_readiness":
        value = data.get("value")
        return HandoffReadinessPayload(
            type=str(data.get("type") or "handoff_required"),
            value=value if isinstance(value, dict) else {},
            status=str(data.get("status") or data.get("type") or "handoff_required"),
            skill_name=optional_str(data.get("skillName")),
        )
    return RouteOutcomePayload(
        type=str(data.get("type") or "route_outcome"),
        outcome=route_outcome(data.get("outcome") or data.get("status")),
        status=str(data.get("status") or data.get("outcome") or ""),
        route_type=optional_str(data.get("routeType")),
        progress_state=optional_str(data.get("progressState")),
        previous_route=optional_str(data.get("previousRoute")),
        next_route_candidate=optional_str(data.get("nextRouteCandidate")),
        resume_route_candidate=optional_str(data.get("resumeRouteCandidate")),
        reason=optional_str(data.get("reason")),
        skill_name=optional_str(data.get("skillName")),
    )


def route_outcome(value: object) -> RouteOutcome:
    if value not in {"confirmed_preference", "accepted_fallback", "deferred_decision", "student_switched_route", "blocked_by_boundary", "handoff_required"}:
        raise ValueError(f"invalid route outcome: {value}")
    return cast(RouteOutcome, value)


def optional_str(value: object) -> str | None:
    return value if isinstance(value, str) else None
