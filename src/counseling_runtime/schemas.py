from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


JsonDict = dict[str, Any]


class Evidence(BaseModel):
    quote: str


Confidence = Literal["low", "medium", "high"]
SignalSource = Literal["current_message", "conversation_context"]
PromotionRisk = Literal["none", "requires_confirmation", "official_action_risk", "student_redirected_route", "explicit_route_confirmation", "route_deferred"]


class BaseDelta(BaseModel):
    evidence: list[Evidence]
    confidence: Confidence
    operation: Literal["add_new"] = "add_new"

    @field_validator("evidence")
    @classmethod
    def require_evidence(cls, evidence: list[Evidence]) -> list[Evidence]:
        if not any(item.quote.strip() for item in evidence):
            raise ValueError("at least one evidence quote is required")
        return evidence


class DirectionDelta(BaseDelta):
    dimension: Literal["course", "university", "pathway"]
    value: str
    universityType: Literal["private", "public"] | None = Field(
        default=None,
        description='Required when dimension is university. Must be null otherwise'
    )
    status: Literal["considering", "preferred", "confirmed_counseling_preference", "rejected"] = Field(
        description="""The student's current counseling stance toward this option.

    - considering: The student is exploring or evaluating the option without expressing a clear preference.
    - preferred: The student expresses a stronger preference over alternatives but has not explicitly confirmed it.
    - confirmed_counseling_preference: The student explicitly confirms this as their current counseling preference.
    - rejected: The student explicitly indicates they are no longer considering this option.
    """
    )

    @field_validator("value")
    @classmethod
    def require_meaningful_value(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("value must not be empty")
        return value
    
    @model_validator(mode="after")
    def validate_university_type(self):
        if self.dimension == "university" and self.universityType is None:
            raise ValueError("universityType is required when dimension is 'university'")

        if self.dimension != "university" and self.universityType is not None:
            raise ValueError("universityType must be None unless dimension is 'university'")

        return self


class AcademicResultDelta(BaseDelta):
    value: str

    @field_validator("value")
    @classmethod
    def require_meaningful_value(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("value must not be empty")
        return value


class QualityEnhancingDelta(BaseDelta):
    type: Literal["concern", "concern", "constraint", "preference", "other"] = Field(
        description="""The semantic category of the extracted context.

    - concern: A worry, obstacle, uncertainty, or issue affecting the student's decision.
    - constraint: A requirement or limitation that narrows available options.
    - preference: A desirable attribute or inclination that influences recommendations.
    - other: Useful contextual information that does not fit the above categories.
    """
    )
    value: JsonDict

    @field_validator("value")
    @classmethod
    def require_meaningful_value(cls, value: JsonDict) -> JsonDict:
        if not value:
            raise ValueError("value must not be empty")
        return value
    
    usefulness: Literal["low", "medium", "high"] = Field(
        description="""How valuable this information is for improving future counseling quality.

    - low: Minor personalization value with little impact on guidance.
    - medium: Helpful context that may influence recommendations or conversations.
    - high: Important context that significantly improves counseling, recommendations, or decision support.
    """
    )
    sensitivity: Literal["none", "possibly_sensitive", "sensitive"] = Field(
        description="""Privacy sensitivity of the extracted information.

    - none: Safe to store without additional concern.
    - possibly_sensitive: May contain personal information requiring careful handling.
    - sensitive: Contains sensitive personal information that may require stricter storage, access, or retention policies.
    """
    )
    constraintStrength: Literal["soft_preference", "hard_constraint"] | None = Field(
        None,
        description="""Strength of the constraint, when `type == "constraint"`.

    - soft_preference: Influences recommendations but acceptable alternatives may exist.
    - hard_constraint: A non-negotiable requirement that recommendations should respect.
    - None: Not applicable for non-constraint types.
    """
    )


class RuntimeSignalBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    confidence: Confidence
    evidence: list[Evidence]
    source: SignalSource = "current_message"
    promotionRisk: PromotionRisk = "none"

    @field_validator("evidence")
    @classmethod
    def require_evidence(cls, evidence: list[Evidence]) -> list[Evidence]:
        if not any(item.quote.strip() for item in evidence):
            raise ValueError("at least one evidence quote is required")
        return evidence


BoundarySignalType = Literal[
    "ready_to_apply_or_register",
    "official_action_request",
    "payment_or_seat_request",
    "exception_or_waiver_request",
    "sensitive_context",
    "human_requested_support",
    "ambiguous_proceed_language",
    "official_transaction",
    "complex_or_sensitive_case",
    "human_support_request",
]


class BoundarySignal(RuntimeSignalBase):
    kind: Literal["boundary"]
    type: BoundarySignalType
    severityCandidate: Literal["yellow", "red"]
    recommendedBehavior: Literal["clarify_once", "handoff"]
    triggerType: Literal["H1", "H2", "H3", "H4", "H5", "H6"] | None = None


class KnowledgeNeedSignal(RuntimeSignalBase):
    kind: Literal["knowledge_need"]
    type: Literal["fees", "entry_requirements", "ranking", "program_details", "pathway", "other"]
    query: str
    decisionCriticality: Literal["minor", "possibly_decision_critical", "decision_critical"] = "possibly_decision_critical"


StudentPosture = Literal[
    "lost_or_confused",
    "course_first",
    "university_first",
    "pathway_first",
    "comparison_oriented",
    "decision_ready",
    "validation_seeking",
    "just_browsing",
    "exploring",
    "uncertain",
    "comparison_mode",
    "validation_mode",
    "ready_to_decide",
    "constraint_focused",
    "deferral_or_indecision",
]


class StudentPostureSignal(RuntimeSignalBase):
    kind: Literal["student_posture"]
    posture: StudentPosture
    counselingImplication: Literal[
        "compare_options",
        "confirm_preference",
        "route_to_university_exploration",
        "route_to_course_exploration",
        "reassure_and_orient",
        "support_decision",
        "continue_current_route",
    ]
    suggestedResponseMode: Literal[
        "decision_support",
        "milestone_confirmation",
        "route_explanation",
        "reassuring_orientation",
        "clarify_once",
        "standard",
    ]


class AmbiguityTargetHint(BaseModel):
    routeType: str | None = None
    dimension: Literal["course", "university", "pathway", "academic_result", "quality_context", "official_action"] | None = None
    currentValue: str | None = None
    proposedValue: str | None = None


class AmbiguityClaim(BaseModel):
    dimension: Literal["course", "university", "pathway", "academic_result", "quality_context", "official_action"]
    value: str


class AmbiguitySignal(RuntimeSignalBase):
    kind: Literal["ambiguity"]
    type: Literal["ambiguous_proceed_language", "direction_change", "contradiction", "unclear_reference", "other"]
    recommendedBehavior: Literal["clarify_once", "preserve_history_and_switch_active_direction", "update_current_truth"]
    targetHint: AmbiguityTargetHint | None = None
    newClaim: AmbiguityClaim | None = None


type RouteType = Literal[
    "initial_route_selection",
    "course_exploration",
    "university_exploration",
    "course_exploration_within_university_context",
    "pathway_exploration",
    "combined_option_validation",
    "handoff_preparation",
]


class RouteTargetHint(BaseModel):
    routeType: RouteType | None = None


class RouteEpisodeSignal(RuntimeSignalBase):
    kind: Literal["route_episode"]
    signalType: Literal[
        "student_led_route_switch_signal",
        "route_deferral_signal",
        "route_confirmation_signal",
        "route_detour_signal",
        "route_resume_signal",
        "route_loop_risk_signal",
        "route_blocker_signal",
        "combined_validation_signal",
    ]
    routeHint: RouteType | None = None
    targetHint: RouteTargetHint | None = None


type RuntimeOnlySignal = Annotated[
    BoundarySignal | KnowledgeNeedSignal | StudentPostureSignal | AmbiguitySignal | RouteEpisodeSignal,
    Field(discriminator="kind"),
]


class FlowDrivingDeltas(BaseModel):
    academicResults: list[AcademicResultDelta] = Field(default_factory=list)
    directions: list[DirectionDelta] = Field(
        default_factory=list,
        description='Course, university, or pathway directions the student is considering, preferring, confirming, or rejecting.'
    )


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
