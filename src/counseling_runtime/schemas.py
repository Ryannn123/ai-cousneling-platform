from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


JsonDict = dict[str, Any]


class FlexibleModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class Evidence(BaseModel):
    quote: str


Confidence = Literal["low", "medium", "high"]


class BaseDelta(FlexibleModel):
    operation: Literal["add_new"] = "add_new"
    confidence: Confidence = "medium"
    evidence: list[Evidence] = Field(default_factory=list)
    source: str = "current_message"
    promotionRisk: str = "none"


class DirectionDelta(BaseDelta):
    value: str
    status: Literal["considering", "preferred", "confirmed_counseling_preference", "rejected"] = "considering"


class AcademicResultDelta(BaseDelta):
    value: str


class QualityEnhancingDelta(BaseDelta):
    kind: str | None = None
    type: Literal["concern_or_blocker", "constraint", "preference", "influence_or_context", "other"]
    value: JsonDict
    usefulness: Literal["low", "medium", "high"] = "medium"
    sensitivity: Literal["none", "possibly_sensitive", "sensitive"] = "none"
    constraintStrength: Literal["soft_preference", "hard_constraint"] | None = None


class RuntimeOnlySignal(FlexibleModel):
    kind: Literal["boundary", "knowledge_need", "student_posture", "ambiguity", "route_episode"]
    type: str | None = None
    signalType: str | None = None
    routeHint: str | None = None
    targetHint: JsonDict | None = None
    triggerType: str | None = None
    severityCandidate: str | None = None
    recommendedBehavior: str | None = None
    query: str | None = None
    decisionCriticality: str | None = None
    posture: str | None = None
    counselingImplication: str | None = None
    suggestedResponseMode: str | None = None
    newClaim: JsonDict | None = None
    confidence: Confidence = "medium"
    evidence: list[Evidence] = Field(default_factory=list)
    source: str = "current_message"
    promotionRisk: str = "none"


class FlowDrivingDeltas(BaseModel):
    academicResults: list[AcademicResultDelta] = Field(default_factory=list)
    coursesConsidering: list[DirectionDelta] = Field(default_factory=list)
    confirmedCounselingCoursePreferences: DirectionDelta | None = None
    universitiesConsidering: list[DirectionDelta] = Field(default_factory=list)
    confirmedCounselingUniversityPreferences: DirectionDelta | None = None
    pathwaysConsidering: list[DirectionDelta] = Field(default_factory=list)
    confirmedCounselingPathwayPreferences: DirectionDelta | None = None


class MemoryDeltaCandidates(BaseModel):
    flowDrivingDeltas: FlowDrivingDeltas = Field(default_factory=FlowDrivingDeltas)
    qualityEnhancingDeltas: list[QualityEnhancingDelta] = Field(default_factory=list)


class SemanticDeltaResult(BaseModel):
    memoryDeltaCandidates: MemoryDeltaCandidates = Field(default_factory=MemoryDeltaCandidates)
    runtimeOnlySignalCandidates: list[RuntimeOnlySignal] = Field(default_factory=list)


class AIResponse(BaseModel):
    studentMessage: str
    responseIntent: Literal["answer", "ask_clarification", "recommend", "compare", "confirm_preference", "handoff"]


class ProposedOutputs(BaseModel):
    recommendationOutputs: list[JsonDict] = Field(default_factory=list)
    handoffOutput: JsonDict | None = None
    memoryOutputs: list[JsonDict] | None = None


class ValidationFlags(BaseModel):
    needsClarification: bool
    boundarySensitive: bool
    officialActionRisk: bool
    memoryWriteRequiresValidation: bool
    knowledgeUsed: bool
    knowledgeUncertain: bool


class AIExecutionResult(BaseModel):
    response: AIResponse
    proposedContextUpdate: JsonDict = Field(default_factory=dict)
    proposedOutputs: ProposedOutputs = Field(default_factory=ProposedOutputs)
    validationFlags: ValidationFlags


def dump(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump(exclude_none=True)
    if isinstance(value, list):
        return [dump(item) for item in value]
    if isinstance(value, dict):
        return {key: dump(item) for key, item in value.items() if item is not None}
    return value
