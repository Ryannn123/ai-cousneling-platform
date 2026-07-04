# Phase 4 — Interpretation & Extraction Layer Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 4 — Interpretation & Extraction Layer  
**Version:** 1.4  
**Date:** 2026-07-04  
**Status:** Updated specification, amended for Route Episode compatibility  
**Source Context:** Phase 0 Bounded Autonomy Baseline v1.0, Phase 1 Autonomous Counseling Operating Model v1.3, Phase 2 Counseling SOP & Skill Control v1.3, Phase 3 Autonomous Runtime Strategy v1.3, Phase 4 Interpretation & Extraction Layer v1.3, Phase 5 Student Memory & Counseling State v1.1, Roadmap v7.4, Prototype Runtime Checkpoint, Route Episode Redesign Exploration Roadmap v0.1, and Route Episode Redesign Decision Summary v1.0.

---

## 1. Purpose

This specification defines the **Phase 4 Interpretation & Extraction Layer** for the AI-first bounded autonomous counseling platform.

It answers the Phase 4 core question:

```text
How should the platform extract student-stated meaning from natural language so
runtime decisions, memory eligibility, boundary checks, route-episode planning,
knowledge routing, handoff preparation, and audit evidence are based on validated
semantic deltas rather than scattered heuristics, uncontrolled summaries, or
LLM-owned state?
```

Phase 4 exists because the Phase 3 runtime needs a governed semantic perception layer before it can safely derive current truth, route context, boundary behavior, skill selection, memory candidates, and response validation.

Version 1.4 keeps the Phase 4 v1.3 semantic delta architecture, but updates it for the approved **Route Episode** redesign.

The core Phase 4 v1.4 contract remains:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

The key v1.4 clarification is:

```text
Phase 4 may extract route-relevant signals.
Phase 4 must not decide active route episode, progress state, route transition,
route outcome, route completion, or current truth.
```

The route-episode-compatible runtime chain is:

```text
Student Message
→ FastBoundarySignalScanner
→ AISemanticDeltaExtractor
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
→ MemoryStateService.commitPreResponseStudentMemory()
→ CurrentTruthProjector
→ CurrentTruthProjection
→ RouteEpisodeCandidateResolver
→ BoundaryResolver
→ RouteEpisodePlanner
→ OperatingContextManager
→ SkillControlService
→ AIExecutionClient
→ ValidationPipeline
→ MemoryStateService.commitPostResponseAIOutputs()
→ AuditEventStore
```

Phase 4 v1.4 produces validated semantic artifacts for downstream modules. It does not create durable memory, current truth, route truth, CRM truth, official application truth, registration truth, payment truth, seat truth, enrollment truth, or official status.

---

## 1.1 Version History Summary

### Version 1.1 — Route-Based Minimum Counseling Profile Alignment

Version 1.1 aligned extraction with the revised minimum counseling profile:

```text
1. academic result status
2. course direction status
3. university direction status
```

The extractor no longer treated ranking/prestige preference, budget/value preference, or location preference as universal minimum-profile gates.

---

### Version 1.2 — Counselor-Like Flow Support

Version 1.2 added support for counselor-like flow signals such as student posture.

Locked behavior:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

Student posture remained advisory, runtime-only by default, and not durable student identity.

---

### Version 1.3 — Semantic Delta Contract

Version 1.3 replaced broad interpretation snapshots with semantic delta proposals:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

Core v1.3 changes:

1. The LLM no longer outputs platform metadata.
2. The LLM no longer outputs minimum-profile state.
3. The LLM no longer outputs route readiness or suggested counseling route.
4. The LLM outputs memory delta candidates and runtime-only signal candidates.
5. Memory delta candidates are divided into flow-driving deltas and quality-enhancing deltas.
6. Runtime-only signals include boundary, knowledge, posture, ambiguity, and current-turn control signals.
7. Phase 5 owns durable memory merge policy and current-truth derivation.

---

### Version 1.4 — Route Episode Compatibility

Version 1.4 updates Phase 4 for the Route Episode redesign.

Key changes:

1. Phase 4 remains a semantic delta proposal layer.
2. Phase 4 does not output final `activeRouteEpisode`.
3. Phase 4 does not output final `RouteProgressState`.
4. Phase 4 does not output final `RouteTransitionDecision`.
5. Phase 4 does not output final `RouteOutcome`.
6. Phase 4 does not output route completion status.
7. Phase 4 may output route-relevant runtime-only signal candidates.
8. Route-relevant signals are candidates only.
9. `RouteEpisodeCandidateResolver`, `BoundaryResolver`, and `RouteEpisodePlanner` own final route behavior.
10. `MemoryStateService` and `MemoryEventValidator` own memory commit eligibility.
11. `RouteOutcomeValidator` owns route outcome validity.
12. `ValidationPipeline` owns response alignment and output safety.

Core v1.4 principle:

```text
Phase 4 detects semantic evidence.
Phase 5 derives current truth.
Phase 3 plans active route episode.
Validators decide route and memory safety.
```

---

## 2. Scope

Phase 4 v1.4 defines:

1. the role of semantic delta extraction in the route-episode runtime
2. the boundary between extraction, runtime-only signals, durable memory, route episode, operating context, and official truth
3. the `SemanticDeltaResult` raw LLM proposal contract
4. the `AcceptedSemanticDelta` platform-validated artifact
5. flow-driving memory delta candidates
6. quality-enhancing memory delta candidates
7. runtime-only boundary signals
8. runtime-only knowledge need signals
9. runtime-only student posture signals
10. runtime-only ambiguity signals
11. runtime-only route episode signal candidates
12. semantic validation rules
13. route-signal validation rules
14. evidence and confidence requirements
15. deterministic fast boundary scanner role
16. AI semantic delta extractor role
17. platform-owned semantic delta validator role
18. integration with `MemoryStateService`
19. integration with `CurrentTruthProjection`
20. integration with `RouteEpisodeCandidateResolver`
21. integration with `BoundaryResolver`
22. integration with `RouteEpisodePlanner`
23. integration with `SkillControlService`
24. validation, audit, and evaluation requirements
25. prototype implementation slice
26. decisions locked by Phase 4 v1.4
27. open questions deferred to later phases

---

## 3. Non-Goals

Phase 4 v1.4 does **not** define:

1. final durable student memory database schema
2. durable memory event commit policy
3. current-truth projection algorithm
4. final active route episode derivation algorithm
5. final route transition policy
6. final route outcome validation algorithm
7. route loop-risk threshold policy
8. full route analytics
9. full route episode planner implementation
10. final recommendation scoring or recommendation lifecycle
11. full business knowledge governance
12. final human handoff workflow
13. CRM read/write integration
14. production guardrail engine design
15. production evaluation dashboard
16. skill authoring or SOP operations workflow
17. full correction/removal UX
18. full contradiction resolution UX
19. full multilingual extraction strategy
20. durable storage of student posture or personality labels
21. broad emotion detection unrelated to counseling posture
22. LangGraph migration design
23. Deep Agents usage for interpretation subroutines

Important boundary:

```text
Phase 4 defines validated semantic deltas and runtime-only signal candidates.
Phase 4 does not own accumulated truth, route state, route completion, memory
commit, official action, or CRM/application status.
```

---

## 4. Inheritance From Approved Phases

---

## 4.1 Phase 0 Inheritance — Bounded Autonomy

Phase 4 inherits the Phase 0 bounded autonomy baseline:

```text
Autonomy by default.
Conservative at boundaries.
```

Phase 4 must strengthen detection of red-zone and yellow-zone signals without turning those signals into official truth.

The core boundary remains:

```text
Counseling decision does not equal official action.
```

The semantic delta extractor may propose counseling-side candidates such as:

1. course being considered
2. university being considered
3. pathway being considered
4. confirmed counseling preference candidate
5. rejected option
6. student concern
7. student constraint
8. recommendation reaction
9. deferral signal
10. route-relevant switch or confirmation signal
11. readiness-to-register signal
12. handoff-related boundary signal

The extractor must never create or imply:

1. application submitted
2. registration completed
3. enrollment confirmed
4. payment completed
5. seat reserved
6. CRM status updated
7. scholarship approved
8. eligibility approved
9. exception approved
10. official document submitted

---

## 4.2 Phase 1 v1.3 Inheritance — Route Episode Operating Model

Phase 4 v1.4 supports the Phase 1 v1.3 operating model:

```text
Active Route Episode
→ guide toward route-specific outcome
→ use reusable progress states inside the active route
→ move to next route only after valid route outcome, deferral, student-led switch,
  or boundary interruption
```

The approved route-episode thesis is:

```text
Route owns the counseling goal.
Progress state owns where the student is inside that route.
Action owns the current turn.
Outcome owns route completion.
Boundary owns autonomy.
Memory owns durable counseling truth.
```

Phase 4 supports this model by extracting evidence that may help downstream modules derive route behavior.

Phase 4 does not own:

1. `activeRouteEpisode`
2. `routeType`
3. `routeGoal`
4. `progressState`
5. `routeTransitionDecision`
6. `routeOutcome`
7. `routeCompletionStatus`
8. `nextRouteCandidate`
9. `resumeRouteCandidate`
10. `loopRisk`

Phase 4 may propose evidence-bearing runtime-only signals such as:

1. student appears to be switching route
2. student is deferring a decision
3. student is asking a factual detour
4. student is ready to confirm a preference
5. student is stuck in repeated indecision
6. student is asking to apply/register/pay/reserve seat

These are candidates only.

---

## 4.3 Phase 2 v1.3 Inheritance — SKILL.md Control

Phase 4 v1.4 provides validated semantic context for the Phase 2 v1.3 skill system.

Phase 2 v1.3 establishes:

```text
SKILL.md guides route-appropriate counseling behavior.
Platform validators own route correctness, memory safety, and boundary safety.
```

Phase 4 may provide accepted semantic artifacts for:

1. skill selection
2. route-compatible skill filtering
3. posture-aware response guidance
4. knowledge need routing
5. boundary rule loading
6. response validation
7. audit evidence

But Phase 4 does not allow skills or the extractor to own final state.

Important rule:

```text
Skills consume accepted semantic context.
Skills do not validate semantic truth.
```

---

## 4.4 Phase 3 v1.3 Inheritance — Runtime Strategy

Phase 4 v1.4 is placed inside the Phase 3 v1.3 runtime.

The Phase 3 v1.3 pre-generation chain is:

```text
1. Receive student message
2. Load previous runtime conversation state
3. Derive prior CurrentTruthProjection from MemoryEventStore when needed
4. Run FastBoundarySignalScanner
5. Run AISemanticDeltaExtractor
6. Run SemanticDeltaValidator
7. Produce AcceptedSemanticDelta or safe fallback semantic status
8. Run MemoryStateService.commitPreResponseStudentMemory()
9. Re-derive CurrentTruthProjection from MemoryEventStore
10. Run RouteEpisodeCandidateResolver
11. Run BoundaryResolver
12. Run RouteEpisodePlanner
13. Build accepted OperatingContext
14. Resolve primary counseling action
15. Resolve counselor response mode
16. Select valid SKILL.md artifacts
17. Call KnowledgeGateway if needed
18. Compose ExecutionContext
19. Call AIExecutionClient
```

Phase 4 owns only steps 4–7, plus semantic audit evidence.

Phase 4 does not run `RouteEpisodeCandidateResolver`, `BoundaryResolver`, `RouteEpisodePlanner`, `OperatingContextManager`, `SkillControlService`, `ValidationPipeline`, or `MemoryStateService`.

---

## 4.5 Phase 5 v1.1 Inheritance — Memory and Current Truth

Phase 4 v1.4 produces accepted semantic artifacts that Phase 5 may process.

Phase 5 v1.1 establishes:

```text
Accepted semantic deltas are not durable memory.
Active route episode is not durable memory.
Durable memory is created only through MemoryStateService.
Current truth is derived from durable memory events.
Meaningful route outcomes may become durable counseling memory.
Official CRM/application truth remains externally owned.
```

Phase 4 therefore must preserve these rules:

1. accepted memory deltas are memory candidates, not memory events
2. runtime-only signals are current-turn signals by default
3. route-relevant runtime signals are not route truth
4. no raw LLM extraction becomes current truth directly
5. no route outcome memory is committed by Phase 4
6. no official status is created by Phase 4

---

## 5. Core Phase 4 v1.4 Design Direction

Phase 4 v1.4 uses the following stance:

```text
Split safety scan
+ AI semantic delta extraction
+ platform semantic validation
+ route-relevant signal candidates
+ downstream route/memory/boundary ownership
```

The selected design remains:

```text
FastBoundarySignalScanner
→ AISemanticDeltaExtractor
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

Short form:

```text
AI extracts.
Platform validates.
Downstream modules decide.
```

Extended route-episode form:

```text
AI may identify route-relevant evidence.
The route planner decides active route.
The route outcome validator decides completion.
The memory service decides commit.
The boundary resolver decides autonomy.
```

---

## 6. Extraction vs Interpretation vs Route Planning

---

## 6.1 Extraction

Extraction means detecting structured facts explicitly stated or strongly implied by the student.

Example:

```text
Student: I got 5 credits and I am considering Psychology, but I do not have a university yet.
```

Allowed semantic delta candidate:

```yaml
memoryDeltaCandidates:
  flowDrivingDeltas:
    academicResults:
      - rawText: "5 credits"
    coursesConsidering:
      - courseOrProgram: Psychology
        status: considering
```

Forbidden extractor output:

```yaml
activeRouteEpisode: course_exploration
progressState: exploration
routeOutcome: null
```

Reason:

```text
The route episode is derived after current truth projection and boundary resolution.
```

---

## 6.2 Interpretation

Interpretation means inferring semantic counseling meaning from the message and context.

Allowed candidate:

```yaml
runtimeOnlySignalCandidates:
  - kind: student_posture
    posture: lost_or_confused
    counselingImplication: reassure_and_orient
    evidence:
      - quote: "I don't know what to study"
```

Allowed route-relevant candidate:

```yaml
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: route_deferral_signal
    evidence:
      - quote: "I need more time to think"
```

Forbidden interpretation:

```yaml
routeOutcome: deferred_decision
routeCompletionStatus: completed
```

Reason:

```text
The extractor may detect deferral evidence.
RouteOutcomeValidator decides whether deferred_decision is valid.
```

---

## 6.3 Route Planning

Route planning means deciding the active route, progress state, transition, completion, and next route.

Phase 4 must not perform route planning.

Route planning belongs to:

```text
CurrentTruthProjection
→ RouteEpisodeCandidateResolver
→ BoundaryResolver
→ RouteEpisodePlanner
→ RouteTransitionValidator
→ RouteOutcomeValidator
```

---

## 7. Signal Scope

---

## 7.1 Active Signal Categories

Phase 4 v1.4 supports these active signal categories:

```text
1. memoryDeltaCandidates.flowDrivingDeltas
2. memoryDeltaCandidates.qualityEnhancingDeltas
3. runtimeOnlySignalCandidates.boundary
4. runtimeOnlySignalCandidates.knowledge_need
5. runtimeOnlySignalCandidates.student_posture
6. runtimeOnlySignalCandidates.ambiguity
7. runtimeOnlySignalCandidates.route_episode
```

The new v1.4 category is:

```text
runtimeOnlySignalCandidates.route_episode
```

This category carries route-relevant evidence but not final route decisions.

---

## 7.2 Deferred Signal Categories

The first implementation still defers:

```text
1. final active route episode
2. final route type
3. final route goal
4. final route progress state
5. final route transition decision
6. final route outcome
7. final route completion status
8. final route readiness
9. final current truth
10. durable correction/removal mutation
11. durable contradiction mutation
12. final recommendation readiness decision
13. final preference strength decision
14. final minimum profile signals
15. broad emotion/friction signal unrelated to counseling posture
```

---

## 8. SemanticDeltaResult Contract

The raw AI extractor produces `SemanticDeltaResult`.

```ts
type SemanticDeltaResult = {
  memoryDeltaCandidates: MemoryDeltaCandidates;
  runtimeOnlySignalCandidates: RuntimeOnlySignalCandidate[];
};
```

---

## 8.1 MemoryDeltaCandidates

```ts
type MemoryDeltaCandidates = {
  flowDrivingDeltas: FlowDrivingDeltas;
  qualityEnhancingDeltas: QualityEnhancingDelta[];
};
```

---

## 8.2 FlowDrivingDeltas

```ts
type FlowDrivingDeltas = {
  academicResults: AcademicResultDelta[];
  coursesConsidering: CourseDelta[];
  confirmedCounselingCoursePreferences?: CourseDelta[];
  universitiesConsidering: UniversityDelta[];
  confirmedCounselingUniversityPreferences?: UniversityDelta[];
  pathwaysConsidering: PathwayDelta[];
  confirmedCounselingPathwayPreferences?: PathwayDelta[];
  rejectedOptions?: RejectedOptionDelta[];
};
```

Flow-driving deltas may eventually influence current truth after Phase 5 processing.

They do not directly become:

1. current truth
2. active route
3. route outcome
4. confirmed route completion
5. official truth

---

## 8.3 QualityEnhancingDelta

```ts
type QualityEnhancingDelta = {
  type:
    | "concern_or_blocker"
    | "constraint"
    | "preference"
    | "influence_or_context"
    | "tradeoff_priority"
    | "recommendation_context"
    | "other";

  label: string;
  value: string;
  constraintStrength?: "soft_preference" | "hard_constraint" | "unknown";
  evidence: EvidenceSpan[];
  confidence: "low" | "medium" | "high";
};
```

Quality-enhancing deltas may improve personalization and recommendation quality.

They must not become route completion.

Example:

```text
Student: I can only study in KL.
```

Allowed candidate:

```yaml
type: constraint
value: KL only
constraintStrength: hard_constraint
```

Forbidden conclusion:

```yaml
routeOutcome: confirmed_preference
```

---

## 8.4 RuntimeOnlySignalCandidate

```ts
type RuntimeOnlySignalCandidate =
  | BoundarySignalCandidate
  | KnowledgeNeedSignalCandidate
  | StudentPostureSignalCandidate
  | AmbiguitySignalCandidate
  | RouteEpisodeSignalCandidate
  | CurrentTurnControlSignalCandidate;
```

Runtime-only signals affect current-turn runtime behavior by default.

They are not durable memory unless a later memory policy accepts a corresponding durable event.

---

## 9. RouteEpisodeSignalCandidate

`RouteEpisodeSignalCandidate` is new in Phase 4 v1.4.

It allows the extractor to identify route-relevant semantic evidence without owning route state.

```ts
type RouteEpisodeSignalCandidate = {
  kind: "route_episode";

  signalType:
    | "student_led_route_switch_signal"
    | "route_deferral_signal"
    | "route_confirmation_signal"
    | "route_detour_signal"
    | "route_resume_signal"
    | "route_loop_risk_signal"
    | "route_blocker_signal"
    | "combined_validation_signal";

  routeHint?: RouteType;
  targetHint?: {
    courseOrProgram?: string;
    university?: string;
    pathway?: string;
    combinedOption?: string;
  };

  evidence: EvidenceSpan[];
  confidence: "low" | "medium" | "high";

  extractorNote?: string;
};
```

Important:

```text
routeHint is only a hint.
It is not the active route.
```

---

## 9.1 Signal Type Meanings

### `student_led_route_switch_signal`

Use when the student explicitly redirects the counseling decision area.

Example:

```text
Actually, I already know I want Psychology. Help me choose university.
```

Allowed candidate:

```yaml
kind: route_episode
signalType: student_led_route_switch_signal
routeHint: university_exploration
evidence:
  - quote: "Help me choose university"
```

Forbidden output:

```yaml
activeRouteEpisode: university_exploration
```

---

### `route_deferral_signal`

Use when the student explicitly wants to pause or delay a decision.

Example:

```text
I need to discuss with my parents first.
```

Allowed candidate:

```yaml
kind: route_episode
signalType: route_deferral_signal
evidence:
  - quote: "discuss with my parents first"
```

Forbidden output:

```yaml
routeOutcome: deferred_decision
```

---

### `route_confirmation_signal`

Use when the student may be confirming a route-scoped counseling preference.

Example:

```text
Yes, Psychology is my choice for now.
```

Allowed candidates:

```yaml
flowDrivingDeltas:
  confirmedCounselingCoursePreferences:
    - courseOrProgram: Psychology
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: route_confirmation_signal
    routeHint: course_exploration
```

Final L4 memory and route completion are decided later by Phase 5 and validators.

---

### `route_detour_signal`

Use when the student asks a side question that should likely be handled without replacing the active route.

Example:

```text
By the way, how long is a Psychology degree?
```

Allowed candidate:

```yaml
kind: route_episode
signalType: route_detour_signal
evidence:
  - quote: "By the way"
```

The actual detour overlay and resume target are runtime decisions.

---

### `route_resume_signal`

Use when the student indicates returning to a prior decision area.

Example:

```text
Okay, back to choosing university.
```

Allowed candidate:

```yaml
kind: route_episode
signalType: route_resume_signal
routeHint: university_exploration
```

---

### `route_loop_risk_signal`

Use when the student repeatedly signals indecision, overwhelm, or circular comparison.

Example:

```text
I still can't decide, both seem good, just tell me which is best.
```

Allowed candidate:

```yaml
kind: route_episode
signalType: route_loop_risk_signal
confidence: medium
```

Loop thresholds and deferral policy are not Phase 4 decisions.

---

### `route_blocker_signal`

Use when the student states a blocker that may prevent route progress.

Example:

```text
I like this course, but my parents only allow KL.
```

Allowed candidates:

```yaml
qualityEnhancingDeltas:
  - type: constraint
    value: parents only allow KL
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: route_blocker_signal
```

---

### `combined_validation_signal`

Use when the student is asking whether a combined option is suitable.

Example:

```text
So is Psychology at Sunway a good choice for me?
```

Allowed candidate:

```yaml
kind: route_episode
signalType: combined_validation_signal
targetHint:
  courseOrProgram: Psychology
  university: Sunway
```

The final transition to `combined_option_validation` belongs to the route planner.

---

## 10. AcceptedSemanticDelta Contract

The platform validates `SemanticDeltaResult` into `AcceptedSemanticDelta`.

```ts
type AcceptedSemanticDelta = {
  platformMetadata: SemanticDeltaMetadata;
  acceptedMemoryDeltas: AcceptedMemoryDeltas;
  acceptedRuntimeOnlySignals: AcceptedRuntimeOnlySignal[];
  rejectedCandidates: RejectedSemanticCandidate[];
  downgradedCandidates: DowngradedSemanticCandidate[];
  validationEvents: SemanticDeltaValidationEvent[];
  status:
    | "accepted"
    | "accepted_with_downgrades"
    | "requires_clarification"
    | "rejected"
    | "safe_fallback";
};
```

---

## 10.1 Accepted Runtime-Only Route Signals

After validation, route signals may be accepted as runtime-only signals.

```ts
type AcceptedRouteEpisodeSignal = {
  kind: "route_episode";
  signalType: RouteEpisodeSignalCandidate["signalType"];
  routeHint?: RouteType;
  targetHint?: RouteEpisodeSignalCandidate["targetHint"];
  evidence: EvidenceSpan[];
  confidence: "low" | "medium" | "high";
  validationStatus: "accepted" | "accepted_with_downgrade";
};
```

Even after acceptance, these signals remain candidates.

They may be consumed by:

1. `RouteEpisodeCandidateResolver`
2. `BoundaryResolver`
3. `RouteEpisodePlanner`
4. `OperatingContextManager`
5. `ValidationPipeline`
6. `AuditEventStore`

They must not directly commit route state or memory.

---

## 11. Validation Rules

---

## 11.1 General Semantic Validation

`SemanticDeltaValidator` must validate:

1. evidence exists for every candidate
2. evidence quote supports the candidate
3. confidence is not overstated
4. weak interest is not promoted to confirmed preference
5. L3 expressed preference is not promoted to L4 confirmation
6. official-action intent is not converted into official-action truth
7. runtime-only signals remain runtime-only
8. memory candidates are counseling-safe
9. route-relevant candidates are not final route state
10. unsupported candidates are rejected or downgraded

---

## 11.2 Route Signal Validation

For `RouteEpisodeSignalCandidate`, the validator must ensure:

1. signal type is supported
2. evidence explicitly or strongly supports the signal
3. route hint is only a hint
4. route hint does not become route decision
5. target hint does not become confirmed preference without evidence
6. deferral signal does not become route outcome
7. confirmation signal does not become route completion
8. detour signal does not replace active route
9. loop-risk signal does not directly trigger deferral
10. boundary signal still goes through `BoundaryResolver`

---

## 11.3 Over-Promotion Rules

The validator must reject or downgrade these over-promotions:

| Student Language | Allowed Candidate | Forbidden Candidate |
|---|---|---|
| "Psychology sounds interesting" | course considering / weak interest | confirmed counseling preference |
| "I prefer Psychology" | expressed preference | route completed |
| "Maybe Sunway" | university considering | confirmed university preference |
| "Show me a shortlist" | comparison / shortlist intent | route outcome |
| "I need time" | deferral signal | route outcome without route validation |
| "I want to apply now" | boundary signal | application submitted |

---

## 11.4 Official-Action Validation

The validator must reject any candidate that turns intent into official status.

Example:

```text
Student: I want to apply now.
```

Allowed:

```yaml
runtimeOnlySignalCandidates:
  - kind: boundary
    type: ready_to_apply_or_register
```

Forbidden:

```yaml
applicationStatus: submitted
registrationStatus: completed
```

---

## 12. Runtime Placement

Phase 4 v1.4 uses this runtime placement:

```text
Student Message
  ↓
FastBoundarySignalScanner
  ↓
AISemanticDeltaExtractor
  ↓
SemanticDeltaValidator
  ↓
AcceptedSemanticDelta
  ↓
MemoryStateService.commitPreResponseStudentMemory()
  ↓
CurrentTruthProjector
  ↓
CurrentTruthProjection
  ↓
RouteEpisodeCandidateResolver
  ↓
BoundaryResolver
  ↓
RouteEpisodePlanner
  ↓
OperatingContextManager
  ↓
SkillControlService
  ↓
KnowledgeGateway
  ↓
ExecutionContextComposer
  ↓
AIExecutionClient
  ↓
ValidationPipeline
  ↓
MemoryStateService.commitPostResponseAIOutputs()
  ↓
AuditEventStore
```

---

## 12.1 FastBoundarySignalScanner

Platform-owned deterministic scanner.

Purpose:

```text
Catch obvious boundary signals before AI semantic delta extraction.
```

It should scan for high-recall trigger phrases related to:

1. ready-to-apply/register
2. official action
3. payment, seat, enrollment
4. exception, appeal, waiver, complex eligibility
5. sensitive or high-risk context
6. human-requested support
7. ambiguous proceed language

Fast boundary scan is intentionally high recall.

---

## 12.2 AISemanticDeltaExtractor

AI-assisted structured-output extractor.

Purpose:

```text
Produce a SemanticDeltaResult from the student message, recent context, and
compact current-truth summary where available.
```

It may use:

1. current student message
2. recent conversation context
3. compact current-truth summary
4. previous accepted operating context as context only
5. active route episode context as context only
6. selected language/locale hints

It must not output:

1. final active route episode
2. final route progress state
3. final route outcome
4. final current truth
5. final boundary result
6. official truth
7. memory commit decision

---

## 12.3 SemanticDeltaValidator

Platform-owned validator.

Purpose:

```text
Validate, downgrade, reject, or require clarification for semantic delta candidates
and runtime-only signal candidates before downstream modules consume them.
```

It outputs `AcceptedSemanticDelta`.

---

## 12.4 MemoryStateService Integration

Phase 4 hands accepted memory deltas to `MemoryStateService` as candidates.

`MemoryStateService` decides:

1. whether the candidate can become a durable event
2. which memory category applies
3. what evidence is sufficient
4. whether the event updates current truth
5. whether official-truth boundary is preserved

Phase 4 does not commit memory.

---

## 12.5 RouteEpisodeCandidateResolver Integration

`RouteEpisodeCandidateResolver` may consume:

1. accepted memory deltas
2. accepted route episode signals
3. accepted posture signals
4. current truth projection
5. previous operating context

It may derive a route candidate.

Phase 4 does not derive the route candidate.

---

## 12.6 BoundaryResolver Integration

`BoundaryResolver` consumes:

1. fast boundary signals
2. accepted runtime-only boundary signals
3. accepted ambiguity signals
4. accepted route signals if boundary-relevant
5. current truth
6. prior handoff status
7. boundary rules

Boundary result always overrides route planning.

---

## 12.7 RouteEpisodePlanner Integration

`RouteEpisodePlanner` consumes accepted route-relevant signals only after boundary resolution.

It owns:

1. active route episode
2. progress state
3. transition decision
4. route outcome candidate
5. next route candidate
6. resume route candidate
7. loop-risk handling

Phase 4 must not duplicate this logic.

---

## 13. Evidence and Confidence Model

Every candidate must carry evidence.

```ts
type EvidenceSpan = {
  quote?: string;
  source:
    | "student_message"
    | "conversation_context"
    | "current_truth_summary"
    | "previous_operating_context";
  messageId?: string;
  turnId?: string;
  confidence?: "low" | "medium" | "high";
};
```

Evidence requirements:

1. confirmed preference candidates require explicit confirmation language
2. route switch signals require explicit decision-area redirection
3. deferral signals require explicit pause/time/indecision language or strong contextual evidence
4. detour signals require side-question or topic-shift evidence
5. boundary signals require intent/action/risk evidence
6. hard constraints require strong limiting language such as "only", "must", "cannot", "not allowed", or equivalent

---

## 14. Examples

---

## 14.1 Course Interest Without Completion

Student:

```text
Psychology sounds interesting, but I also want to know about Business.
```

Allowed raw candidates:

```yaml
memoryDeltaCandidates:
  flowDrivingDeltas:
    coursesConsidering:
      - courseOrProgram: Psychology
        status: considering
      - courseOrProgram: Business
        status: considering
runtimeOnlySignalCandidates:
  - kind: student_posture
    posture: comparison_oriented
```

Forbidden:

```yaml
routeOutcome: confirmed_preference
```

---

## 14.2 L3 Expressed Preference

Student:

```text
I think I prefer Psychology over Business.
```

Allowed raw candidates:

```yaml
memoryDeltaCandidates:
  flowDrivingDeltas:
    coursesConsidering:
      - courseOrProgram: Psychology
        status: preferred
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: route_confirmation_signal
    confidence: low
```

Validation note:

```text
This may support L3 expressed preference.
It must not directly become L4 or route completion.
```

---

## 14.3 Explicit Confirmation

Student:

```text
Yes, Psychology is my choice for now.
```

Allowed raw candidates:

```yaml
memoryDeltaCandidates:
  flowDrivingDeltas:
    confirmedCounselingCoursePreferences:
      - courseOrProgram: Psychology
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: route_confirmation_signal
    routeHint: course_exploration
    confidence: high
```

Downstream behavior:

```text
MemoryStateService validates confirmed counseling preference memory.
RouteOutcomeValidator validates route outcome.
RouteEpisodePlanner decides transition.
```

---

## 14.4 Deferral

Student:

```text
I need more time to think. Let me discuss with my parents.
```

Allowed raw candidates:

```yaml
memoryDeltaCandidates:
  qualityEnhancingDeltas:
    - type: concern_or_blocker
      value: wants to discuss with parents before deciding
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: route_deferral_signal
    confidence: high
```

Forbidden:

```yaml
routeOutcome: deferred_decision
```

---

## 14.5 Student-Led Route Switch

Student:

```text
Actually, I already know I want Psychology. Help me choose university now.
```

Allowed raw candidates:

```yaml
memoryDeltaCandidates:
  flowDrivingDeltas:
    coursesConsidering:
      - courseOrProgram: Psychology
        status: preferred
runtimeOnlySignalCandidates:
  - kind: route_episode
    signalType: student_led_route_switch_signal
    routeHint: university_exploration
    confidence: high
```

Downstream behavior:

```text
RouteTransitionValidator decides whether route switch is valid.
```

---

## 14.6 Apply/Register Boundary

Student:

```text
Great, I want to apply now.
```

Allowed raw candidates:

```yaml
runtimeOnlySignalCandidates:
  - kind: boundary
    type: ready_to_apply_or_register
    triggerType: H1
    severityCandidate: red
    recommendedBehavior: handoff
    evidence:
      - quote: "I want to apply now"
```

Forbidden:

```yaml
applicationStatus: submitted
registrationStatus: completed
```

---

## 15. Audit Requirements

Phase 4 must audit:

1. raw `SemanticDeltaResult`
2. accepted semantic deltas
3. rejected candidates
4. downgraded candidates
5. validation events
6. fast boundary signals
7. accepted route episode signal candidates
8. route signal rejections/downgrades
9. over-promotion rejections
10. official-action candidate rejections
11. extractor failures
12. schema validation failures
13. safe fallback activations

Audit records explain semantic perception behavior.

They do not become student memory or current truth.

---

## 16. Evaluation Requirements

Phase 4 v1.4 evaluation should test:

1. academic result extraction
2. course direction extraction
3. university direction extraction
4. pathway direction extraction
5. confirmed counseling preference extraction
6. weak interest not over-promoted
7. L3 not over-promoted to L4
8. shortlist not treated as route completion
9. deferral signal extraction
10. student-led route switch signal extraction
11. detour signal extraction
12. resume signal extraction
13. combined validation signal extraction
14. loop-risk signal extraction
15. boundary signal recall
16. official-action truth rejection
17. hard vs soft constraint distinction
18. posture signal usefulness
19. knowledge need signal accuracy
20. ambiguity signal accuracy
21. route state not output by extractor
22. route outcome not output by extractor

Important evaluation labels:

```text
semantic_delta_correct
semantic_delta_missing
semantic_delta_noisy
runtime_signal_correct
runtime_signal_missing
route_signal_correct
route_signal_overreached
preference_overpromoted
boundary_signal_missed
official_truth_rejected
route_state_leakage_detected
```

---

## 17. Prototype Implementation Slice

The first Phase 4 v1.4 prototype should implement:

1. `FastBoundarySignalScanner`
2. `AISemanticDeltaExtractor`
3. `SemanticDeltaValidator`
4. `AcceptedSemanticDelta`
5. flow-driving deltas
6. quality-enhancing deltas
7. runtime-only boundary signals
8. runtime-only knowledge signals
9. runtime-only posture signals
10. runtime-only ambiguity signals
11. runtime-only route episode signals
12. route-state leakage rejection
13. over-promotion rejection
14. official-action truth rejection
15. audit records
16. evaluation fixtures

Do not implement inside Phase 4:

1. route planner
2. route transition validator
3. route outcome validator
4. memory event store
5. current truth projector
6. skill selector
7. recommendation engine
8. CRM integration

---

## 18. Failure Behavior

### 18.1 Extractor Schema Failure

If raw model output fails schema validation:

```text
Reject SemanticDeltaResult.
Use safe fallback semantic status.
Preserve fast boundary signals.
Continue with conservative runtime behavior.
Audit failure.
```

### 18.2 Low Confidence Extraction

If extraction is low confidence:

```text
Downgrade candidate.
Mark requires clarification if route or memory impact is material.
Do not commit memory directly.
Do not alter route directly.
```

### 18.3 Route State Leakage

If the extractor outputs final route state, progress state, transition, or outcome:

```text
Reject those fields.
Audit route_state_leakage_detected.
Use only evidence-bearing semantic candidates if otherwise valid.
```

### 18.4 Official Truth Leakage

If the extractor outputs official application/payment/registration/CRM truth:

```text
Reject the candidate.
Emit official_truth_rejected audit event.
Keep any safe boundary intent signal.
```

### 18.5 Boundary Signal Uncertainty

If boundary signal is uncertain but plausible:

```text
Accept or downgrade as runtime-only boundary signal.
Let BoundaryResolver decide final zone.
Favor red-zone recall for serious official-action risk.
```

---

## 19. Decisions Locked by Phase 4 v1.4

1. Phase 4 remains a semantic delta proposal and validation layer.
2. Phase 4 does not own current truth.
3. Phase 4 does not own active route episode.
4. Phase 4 does not own route progress state.
5. Phase 4 does not own route transition.
6. Phase 4 does not own route outcome.
7. Phase 4 does not commit durable memory.
8. Phase 4 does not create official truth.
9. Phase 4 may output route-relevant runtime-only signal candidates.
10. Route-relevant signals must be evidence-backed candidates only.
11. Route-state leakage must be rejected or ignored.
12. L1/L2/L3 signals must not be over-promoted to L4.
13. Shortlist-only and recommendation-presented-only must not become route completion.
14. Official-action intent may become a boundary signal, not official status.
15. `RouteEpisodeCandidateResolver`, `BoundaryResolver`, `RouteEpisodePlanner`, validators, and `MemoryStateService` own downstream decisions.

---

## 20. Open Questions Deferred

1. Should route episode signal extraction later become a specialized extractor head?
2. Should multilingual route signal extraction require locale-specific examples?
3. Should extraction confidence be calibrated differently for route signals vs memory deltas?
4. Should route loop-risk detection remain in Phase 4 signal extraction or move entirely to runtime history analysis?
5. Should Phase 4 support correction/removal/contradiction candidates before the full Phase 5 correction policy is implemented?
6. Should future extraction include structured affect/friction signals beyond counseling posture?
7. Should route signal examples become counselor-maintained SKILL.md evaluation fixtures?
8. How should model-specific extraction behavior be evaluated across OpenAI/Gemini or future providers?

---

## 21. Summary

Phase 4 v1.4 updates the interpretation and extraction layer for the Route Episode redesign without expanding the LLM's authority.

The final ownership model is:

```text
Phase 4:
  Extracts and validates semantic deltas and runtime-only signal candidates.

Phase 5:
  Commits durable counseling memory and derives current truth.

Phase 3:
  Plans active route episode, boundary behavior, operating context, skills, and validation.

Phase 2:
  Provides counselor-owned SKILL.md guidance.

Validators:
  Enforce route correctness, memory safety, boundary safety, and official-action blocking.
```

The key rule is:

```text
Phase 4 may detect route-relevant evidence.
Phase 4 must not become a hidden route state machine.
```
