from __future__ import annotations

from typing import Any, KeysView, ValuesView, ItemsView, Protocol

from pydantic import BaseModel, ConfigDict, Field

from .schemas import AIExecutionResult, SemanticDeltaResult, RouteType
from .boundary import BoundaryResult


JsonObject = dict[str, Any]


class RuntimeModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    def __getitem__(self, key: str) -> Any:
        return getattr(self, key)

    def __contains__(self, key: str) -> bool:
        return hasattr(self, key)

    def get(self, key: str, default: Any = None) -> Any:
        return getattr(self, key, default)

    def keys(self) -> KeysView[str]:
        return self.model_dump(exclude_none=True).keys()

    def values(self) -> ValuesView[Any]:
        return self.model_dump(exclude_none=True).values()

    def items(self) -> ItemsView[str, Any]:
        return self.model_dump(exclude_none=True).items()

    def to_json_dict(self) -> JsonObject:
        return self.model_dump(exclude_none=True)


class TurnRequest(RuntimeModel):
    conversationId: str
    studentMessage: str


class TurnInput(RuntimeModel):
    conversationId: str
    turnId: str
    messageId: str
    studentMessage: str
    previousRuntimeState: JsonObject
    recentConversationSummary: str
    currentTruthBeforeTurn: JsonObject


class Message(RuntimeModel):
    role: str
    content: str
    timestamp: str


class ConversationState(RuntimeModel):
    conversationId: str
    createdAt: str
    updatedAt: str
    operatingContext: JsonObject
    currentTruth: JsonObject | None = None
    messages: list[Message] = Field(default_factory=list)
    recommendationOutputs: list[JsonObject] = Field(default_factory=list)
    routeOutcomeOutputs: list[JsonObject] = Field(default_factory=list)
    handoff: JsonObject | None = None
    blockedOutputs: list[JsonObject] = Field(default_factory=list)
    auditEvents: list[JsonObject] | None = None


class SkillRef(RuntimeModel):
    name: str
    version: str
    artifactType: str | None = None
    contentHash: str | None = None
    sourcePath: str | None = None


class SkillSelection(RuntimeModel):
    selectedPlaybook: JsonObject | None = None
    selectedRuntimeSkill: SkillRef
    selectedRuntimeSkillBody: str = ""
    loadedBoundaryRules: list[JsonObject] = Field(default_factory=list)
    rejectedCandidates: list[JsonObject] = Field(default_factory=list)
    allowedMemoryOutputTypes: list[str] = Field(default_factory=list)
    forbiddenMemoryOutputTypes: list[str] = Field(default_factory=list)


class KnowledgeAnswer(RuntimeModel):
    answerable: bool
    facts: list[JsonObject] = Field(default_factory=list)
    caveat: str | None = None
    sources: list[JsonObject] = Field(default_factory=list)
    uncertaintyLevel: str


class ExecutionContext(RuntimeModel):
    studentMessage: str
    conversationContext: str
    currentTruth: JsonObject
    activeRouteEpisode: JsonObject
    responsePlan: JsonObject
    skill: JsonObject
    knowledge: JsonObject | None = None
    responseRetry: JsonObject | None = None


class SemanticDeltaExtractor(Protocol):
    provider: str
    model: str

    async def extract(self, turn_input: TurnInput | JsonObject) -> SemanticDeltaResult:
        ...


class ExecutionClient(Protocol):
    async def execute(self, execution_context: ExecutionContext | JsonObject) -> AIExecutionResult:
        ...


class RouteSource(RuntimeModel):
    derivedFromCurrentTruth: bool = False
    usedAcceptedSemanticDelta: bool = False
    usedPriorOperatingContext: bool = False
    usedBoundaryResult: bool = False
    usedRouteOutcomeHistory: bool = False


class RouteTransitionDecision(RuntimeModel):
    decision: str
    priority: str
    activeRoute: str
    progressState: str
    previousRoute: str | None = None
    routeOutcome: str | None = None
    nextRouteCandidate: str | None = None
    resumeRouteCandidate: str | None = None
    evidence: list[JsonObject] = Field(default_factory=list)
    requiresValidation: bool = False
    auditReason: str | None = None


class RouteTransitionValidation(RuntimeModel):
    status: str
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class RouteDetourOverlay(RuntimeModel):
    detourKind: str
    resumeRoute: str
    resumeProgressState: str
    discoveredSignals: list[str] = Field(default_factory=list)


class RouteCandidate(RuntimeModel):
    routeType: RouteType
    routeGoal: str
    evidence: list[JsonObject] = Field(default_factory=list)
    source: RouteSource = Field(default_factory=RouteSource)
    auditReason: str | None = None


class ActiveRouteEpisode(RuntimeModel):
    routeType: RouteType
    routeGoal: str
    progressState: str
    transitionDecision: RouteTransitionDecision
    recommendationReadiness: str
    preferenceStrength: str
    activeDirections: JsonObject = Field(default_factory=dict)
    routeConstraints: list[JsonObject] = Field(default_factory=list)
    decisionBlockers: list[JsonObject] = Field(default_factory=list)
    routeOutcomeCandidate: str | None = None
    nextRouteCandidate: str | None = None
    resumeRouteCandidate: str | None = None
    detourOverlay: RouteDetourOverlay | None = None
    transitionValidation: RouteTransitionValidation | None = None
    source: RouteSource = Field(default_factory=RouteSource)


class ValidationResult(RuntimeModel):
    status: str
    finalResponse: str
    acceptedContextUpdate: JsonObject = Field(default_factory=dict)
    acceptedOutputs: JsonObject
    blockedOutputs: list[JsonObject] = Field(default_factory=list)
    validationEvents: list[JsonObject] = Field(default_factory=list)
    routeOutcomeValidation: JsonObject
    acceptedOperatingContext: JsonObject
    responseRetry: JsonObject | None = None


class CommitResult(RuntimeModel):
    committedContext: JsonObject
    committedRecommendationOutputIds: list[str] = Field(default_factory=list)
    committedRouteOutcomeOutputIds: list[str] = Field(default_factory=list)
    handoffPrepared: bool
    blockedOutputCount: int


class TurnResult(RuntimeModel):
    finalResponse: str
    runtimeState: ConversationState | None
    rawSemanticDelta: SemanticDeltaResult | JsonObject
    acceptedSemanticDelta: JsonObject
    boundaryResult: BoundaryResult
    operatingContext: JsonObject
    currentTruth: JsonObject
    routeCandidate: RouteCandidate
    activeRouteEpisode: ActiveRouteEpisode
    skillSelection: SkillSelection
    validationResult: ValidationResult
    commitResult: CommitResult
    preResponseMemoryCommitResult: JsonObject
    postResponseMemoryCommitResult: JsonObject
    auditEvent: JsonObject
