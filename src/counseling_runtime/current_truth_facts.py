from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from .contracts import JsonObject
from .memory_payloads import RouteOutcome
from .schemas import Confidence


@dataclass(slots=True, frozen=True)
class FactSource:
    event_id: str
    confidence: Confidence
    created_at: str


@dataclass(slots=True, frozen=True)
class AcademicResultFact:
    raw_text: Any
    source: FactSource


@dataclass(slots=True, frozen=True)
class DirectionFact:
    option_type: Literal["course", "university", "pathway"]
    value: Any
    status: str
    university_type: Any
    source: FactSource


@dataclass(slots=True, frozen=True)
class CounselingPreferenceFact:
    dimension: str
    value: Any
    source: FactSource
    status: str
    university_type: str | None


@dataclass(slots=True, frozen=True)
class RejectedOptionFact:
    option_type: str
    value: Any
    source: FactSource


@dataclass(slots=True, frozen=True)
class QualitySignalFact:
    category: Literal["constraint", "quality_context", "concern"]
    signal_type: str
    value: Any
    source: FactSource


@dataclass(slots=True, frozen=True)
class RecommendationInteractionFact:
    value: Any
    source: FactSource


@dataclass(slots=True, frozen=True)
class HandoffReadinessFact:
    signal_type: str
    value: JsonObject
    status: str
    source: FactSource


@dataclass(slots=True, frozen=True)
class RouteOutcomeFact:
    outcome: RouteOutcome
    route_type: str | None
    next_route_candidate: str | None
    value: JsonObject
    source: FactSource


CurrentTruthFact = (
    AcademicResultFact
    | DirectionFact
    | CounselingPreferenceFact
    | RejectedOptionFact
    | QualitySignalFact
    | RecommendationInteractionFact
    | HandoffReadinessFact
    | RouteOutcomeFact
)
