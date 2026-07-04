# Phase 3 — Autonomous Runtime Strategy Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 3 — Autonomous Runtime Strategy  
**Version:** 1.3  
**Date:** 2026-07-04  
**Status:** Updated specification, amended for Route Episode redesign  
**Source Context:** Phase 0 Bounded Autonomy Baseline v1.0, Phase 1 Autonomous Counseling Operating Model v1.3, Phase 2 Counseling SOP & Skill Control v1.2, Phase 4 Interpretation & Extraction Layer v1.3, Phase 5 Student Memory & Counseling State v1.1, Roadmap v7.4, Prototype Runtime Checkpoint, Route Episode Redesign Exploration Roadmap v0.1, and Route Episode Redesign Decision Summary v1.0.

---

## 1. Purpose

This specification defines the **Phase 3 autonomous runtime strategy** for the AI-first bounded autonomous counseling platform.

It answers the Phase 3 core question:

```text
What runtime architecture should execute the Phase 1 counseling operating model,
Phase 2 SKILL.md control system, Phase 4 semantic delta layer, and Phase 5
memory/current-truth layer while preserving bounded autonomy, deterministic
boundaries, validation, and auditability?
```

Phase 3 remains **prototype-first**.

The goal is not to fully design the final production runtime. The goal is to define a runtime strategy for the next prototype vertical slice that proves the updated Route Episode loop:

```text
student message
→ fast boundary scan
→ semantic delta extraction
→ semantic delta validation
→ pre-response student-stated memory commit
→ current truth projection
→ route episode candidate resolution
→ boundary resolution
→ final route episode planning
→ operating context acceptance
→ skill selection
→ knowledge gateway, if needed
→ AI counseling execution
→ validation
→ post-response memory commit
→ audit and evaluation evidence
```

Version 1.3 updates Phase 3 from a **minimum-profile route + global journey state** runtime into an **Active Route Episode + Route Progress State + Route Outcome** runtime.

The previous runtime framing was:

```text
Minimum profile reached
→ derive route from known/missing fields
→ use global journey state
```

The revised runtime framing is:

```text
CurrentTruthProjection
→ RouteEpisodeCandidateResolver
→ BoundaryResolver
→ RouteEpisodePlanner
→ ActiveRouteEpisodeContext
→ OperatingContextManager
→ SkillControlService
→ AIExecutionClient
→ ValidationPipeline
→ Memory/Audit Commit
```

The runtime should be simple enough to implement in the prototype, but strict enough to prove the most important safety, counseling-quality, route-control, memory, and audit controls.

---

## 1.1 Version History Summary

### Version 1.1 — Route-Based Minimum Profile Runtime Alignment

Version 1.1 inserted validated interpretation into Checkpoint 1 and aligned the runtime with the route-based minimum counseling profile:

```text
academic result status
+ course direction status
+ university direction status
```

The runtime distinguished minimum route-readiness from rich recommendation readiness.

### Version 1.2 — Counselor-Like Flow Runtime Support

Version 1.2 added runtime support for:

1. accepted student posture context
2. counselor response mode
3. Reflect → Guide → Ask response framing
4. decision-support micro-loops
5. soft summary checkpoints
6. confirmed counseling preference milestone behavior
7. counselor-like response validation and audit labels

The runtime principle was:

```text
Route context decides where counseling should go.
Counselor response mode decides how the AI should guide the student there.
Boundary rules still override both.
```

### Version 1.3 — Route Episode Runtime Redesign

Version 1.3 updates the runtime to execute the approved Route Episode operating model.

Key changes:

1. Replace `minimum_profile_route` as the primary runtime route abstraction.
2. Replace global S1–S9 as the primary runtime state model.
3. Add `RouteEpisodeCandidateResolver` before `BoundaryResolver`.
4. Add `RouteEpisodePlanner` after `BoundaryResolver`.
5. Add `ActiveRouteEpisodeContext` to accepted `OperatingContext`.
6. Add `RouteTransitionDecision` and route transition priority enforcement.
7. Add `RouteOutcomeValidator` and route-response alignment validation.
8. Add route-specific audit and evaluation events.
9. Use Phase 5 v1.1 `route_outcome` memory and route-aware `CurrentTruthProjection`.
10. Keep active route episode runtime-derived and non-durable.
11. Ensure boundary result overrides final route planning.
12. Ensure L3 expressed preference, shortlist-only, recommendation-presented-only, and collected fit signals do not complete a route.
13. Ensure skill metadata guides behavior but does not authorize memory commits or route outcomes.
14. Preserve response retry without repeating pre-response memory commit.

---

## 2. Scope

Phase 3 v1.3 defines:

1. the runtime responsibility split between deterministic platform control, AI semantic delta extraction, AI counseling behavior, memory/current-truth services, and route episode planning
2. the per-turn runtime flow
3. checkpoint placement
4. `AcceptedSemanticDelta` placement inside Checkpoint 1
5. `MemoryStateService` and `CurrentTruthProjection` placement before route planning
6. `RouteEpisodeCandidateResolver` placement before boundary resolution
7. `RouteEpisodePlanner` placement after boundary resolution
8. `OperatingContext` ownership and structure
9. `ActiveRouteEpisodeContext` runtime contract
10. route transition decision ownership
11. route outcome validation ownership
12. detour/resume runtime behavior
13. loop-risk and deferral runtime behavior
14. boundary override behavior
15. SKILL.md retrieval and active-route-compatible deterministic selection
16. counselor response mode and decision-support mode support
17. typed structured execution result expectations
18. validation pipeline and failure behavior
19. output commit and memory/audit persistence rules
20. audit event and evaluation hook requirements
21. prototype implementation slice
22. decisions locked by Phase 3 v1.3
23. open questions deferred to later phases

---

## 3. Non-Goals

Phase 3 v1.3 does **not** fully define:

1. final durable student memory database implementation
2. final physical storage infrastructure
3. full business knowledge governance
4. recommendation engine scoring and lifecycle
5. final counselor handoff workflow
6. CRM read/write integration
7. full guardrail and policy engine
8. full evaluation dashboard
9. skill authoring or business operations workflow
10. production deployment topology
11. production observability dashboards
12. full LangGraph migration design
13. Deep Agents usage for complex subroutines
14. production-grade route analytics
15. multi-route goal graph
16. durable route episode store
17. full route optimization engine
18. final business rules for official application, registration, payment, enrollment, seat, or CRM actions
19. final Phase 2 v1.3 SKILL.md package specification
20. final Phase 4 v1.4 semantic delta compatibility amendment

Important boundary:

```text
Phase 3 defines the runtime needed to prove the updated prototype vertical slice.
It should not over-design production behavior before later phases clarify knowledge,
recommendation, handoff, CRM, guardrails, evaluation, operations, and hardening.
```

---

## 4. Phase 0 Inheritance — Bounded Autonomy

Phase 3 inherits the approved Phase 0 autonomy baseline.

### 4.1 Core Autonomy Stance

```text
Autonomy by default.
Conservative at boundaries.
```

The AI counselor should autonomously handle ordinary pre-registration counseling, including:

1. onboarding
2. academic/profile understanding
3. route selection
4. course/program exploration
5. pathway exploration
6. university/program exploration
7. option comparison
8. recommendation
9. decision support
10. counseling preference confirmation
11. deferral handling
12. readiness-to-register detection
13. handoff context preparation

Humans remain responsible for:

1. application, registration, enrollment, payment, or seat-reservation actions
2. official CRM/application/registration state changes
3. sensitive or high-risk actions
4. complex or exception-based cases
5. student-requested human support
6. scenarios outside approved SOP/skill coverage

### 4.2 Business Risk Posture

The main business risk remains:

```text
Under-handoff.
```

Therefore:

```text
Red-zone detection should prioritize recall over precision.
```

The runtime must make red-zone detection, boundary override, route interruption, and handoff-safe response behavior deterministic enough to prevent the AI from continuing autonomously when a human should take ownership.

### 4.3 Counseling Decision vs Official Action

The central boundary remains:

```text
Counseling decision does not equal official action.
```

The runtime may allow the AI to guide and propose counseling outputs such as:

1. weak interest
2. expressed interest
3. expressed preference
4. rejected option
5. student concern
6. student constraint
7. recommendation reaction
8. deferral
9. accepted fallback
10. confirmed counseling preference
11. route outcome
12. readiness-to-register signal
13. handoff readiness context

The runtime must never allow autonomous AI output, memory commit, or route transition to imply:

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

### 4.4 Runtime Implication

```text
AI can propose counseling outputs.
Platform validates and commits only allowed outputs.
Official-action outputs are never commit-eligible.
Boundary override can interrupt any active route.
```

---

## 5. Phase 1 v1.3 Inheritance — Route Episode Operating Model

Phase 3 v1.3 must execute the Phase 1 v1.3 Route Episode operating model.

### 5.1 Primary Runtime Model

The primary runtime model is no longer:

```text
Global journey state + minimum_profile_route
```

The primary runtime model is:

```text
ActiveRouteEpisode + RouteProgressState + RouteTransitionDecision + RouteOutcome
```

Short form:

```text
Route owns the counseling goal.
Progress state owns where the student is inside that route.
Action owns the current turn.
Outcome owns route completion.
Boundary owns autonomy.
Memory owns durable counseling truth.
```

### 5.2 Route Episode Definition

```text
CounselingRouteEpisode is a platform-owned, runtime-derived counseling goal frame.

It tells the system which counseling decision area is currently being resolved.
```

Route episode is not durable memory and not an official CRM/application state.

### 5.3 Approved v1 Route Types

```ts
type RouteType =
  | "initial_route_selection"
  | "course_exploration"
  | "university_exploration"
  | "course_exploration_within_university_context"
  | "pathway_exploration"
  | "combined_option_validation"
  | "handoff_preparation";
```

### 5.4 Approved v1 Route Progress States

```ts
type RouteProgressState =
  | "opening"
  | "exploration"
  | "recommendation_ready"
  | "recommendation_presented"
  | "comparison"
  | "decision_support"
  | "confirmed_preference"
  | "deferral_indecision"
  | "detour_resume"
  | "handoff"
  | "completed";
```

### 5.5 Approved v1 Route Outcomes

```ts
type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";
```

### 5.6 Deprecated Global Journey State Control

The old S1–S9 global journey states are deprecated as the primary runtime model.

They may remain as migration references:

| Legacy State | Runtime v1.3 Interpretation |
|---|---|
| S1 First Contact / Profile Incomplete | `initial_route_selection + opening` |
| S2 Minimum Profile Reached | route-readiness/current-truth checkpoint, not progress state |
| S3 Exploration Mode | `activeRoute + exploration` |
| S4 Recommendation-Ready | `activeRoute + recommendation_ready` |
| S5 Shortlist / Comparison | `activeRoute + comparison` |
| S6 Confirmed Counseling Preference | `activeRoute + confirmed_preference` plus validated route outcome candidate |
| S7 Ready-to-Register / Apply Handoff | `handoff_preparation + handoff`, driven by boundary result |
| S8 Deferral or Indecision | `activeRoute + decision_support` or `activeRoute + deferral_indecision` |
| S9 Detour and Resume | detour overlay, not replacement active route |

### 5.7 Minimum Profile Reclassification

`minimum_profile_route` is fully replaced as the primary route abstraction.

The runtime should no longer treat:

```text
academic result status + course direction status + university direction status
```

as a route itself.

Those statuses remain important `CurrentTruthProjection` inputs used to derive route candidate and readiness.

### 5.8 L3 and Shortlist Non-Completion Rule

The runtime must enforce:

```text
L3 expressed preference does not complete a route.
Shortlist-only does not complete a route.
Recommendation-presented-only does not complete a route.
Collected budget/location/ranking signals do not complete a route.
```

L3 may move the active route toward:

1. comparison
2. decision support
3. summary checkpoint
4. confirmation prompt
5. recommendation refinement

But it cannot complete the route.

### 5.9 Counselor-Like Flow Behavior

The runtime must preserve:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

This principle shapes response mode and validation but does not override boundary, route, memory, or validation policy.

---

## 6. Phase 2 Inheritance — SKILL.md Control

Phase 3 executes the approved Phase 2 `SKILL.md` behavior-control model while preparing for the simplified active-route metadata model planned for Phase 2 v1.3.

### 6.1 Layered Skill Model

The runtime continues to support:

```text
1. Playbooks
2. Runtime Skills
3. Boundary Rules
```

Playbooks guide broad counselor scenarios.

Runtime skills guide the current turn.

Boundary rules are mandatory cross-cutting controls and override normal skills.

### 6.2 Skill Selection Principle

```text
Semantic retrieval discovers candidate SKILL.md packages.
Structured metadata filtering determines whether they are valid.
Boundary rules are loaded deterministically.
```

Each turn should normally select:

1. zero or one playbook
2. one primary runtime skill
3. all mandatory boundary rules relevant to the context

### 6.3 Skill Metadata v1.3 Runtime Interpretation

Phase 3 v1.3 should treat skill metadata as **selection and behavior guidance**, not as the final route or memory authorization layer.

Skill metadata may help with:

1. artifact identity
2. approval status
3. active route compatibility
4. progress state compatibility
5. action compatibility
6. zone compatibility
7. student posture support
8. counselor response mode support
9. contextual boundary rule hints
10. audit labels
11. prompt composition guidance

Skill metadata should not be the final authority for:

1. memory commit eligibility
2. route outcome validity
3. route transition validity
4. route exit policy
5. loop-risk threshold
6. global forbidden official outputs
7. official-action blocking

Those belong to platform validators and services.

### 6.4 Migration From Phase 2 v1.2 Metadata

Phase 2 v1.2 includes metadata such as:

```text
applies_to_minimum_profile_routes
allowed_memory_outputs
forbidden_memory_outputs
confirmation_required_when
```

Phase 3 v1.3 should interpret these conservatively during migration:

```text
applies_to_minimum_profile_routes
→ legacy route compatibility hint only
→ superseded by applies_to_active_routes in Phase 2 v1.3
```

```text
allowed_memory_outputs / forbidden_memory_outputs
→ legacy audit hints only
→ not final memory authorization
→ MemoryStateService and MemoryEventValidator decide commit eligibility
```

```text
confirmation_required_when
→ guidance for prompt/validation
→ final confirmation requirements belong to PreferencePromotionPolicy and RouteOutcomeValidator
```

### 6.5 Skill Selection Inputs

`SkillControlService` should select skills using:

1. accepted `OperatingContext`
2. `activeRouteEpisode.routeType`
3. `activeRouteEpisode.progressState`
4. primary counseling action
5. boundary result
6. recommendation readiness
7. preference strength
8. student posture
9. counselor response mode
10. decision-support mode
11. knowledge need
12. skill status and version
13. skill content hash

Boundary rules still override all normal skills.

---

## 7. Phase 4 v1.3 Inheritance — Semantic Delta Runtime Placement

Phase 3 v1.3 consumes the Phase 4 v1.3 semantic delta contract:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

### 7.1 AI Semantic Delta Extraction Role

The AI semantic delta extraction core may propose:

1. memory delta candidates
2. runtime-only boundary signals
3. runtime-only knowledge need signals
4. runtime-only student posture signals
5. runtime-only ambiguity signals
6. current-turn control signals

It must not own:

1. final current truth
2. active route episode
3. progress state
4. route transition
5. route outcome
6. boundary zone
7. memory commit
8. official business truth

### 7.2 AcceptedSemanticDelta Role

`AcceptedSemanticDelta` may influence downstream runtime behavior, but it is not durable memory.

It can feed:

1. pre-response memory ingestion
2. current truth projection
3. route episode candidate resolution
4. boundary resolution
5. posture/response mode selection
6. knowledge gateway routing
7. skill selection
8. response validation
9. audit/evaluation

### 7.3 Runtime-Only Signal Boundary

Runtime-only signals remain current-turn-only by default.

Examples:

```text
student_posture = lost_or_confused
knowledge_need = fee_question
ambiguity = ambiguous_proceed_language
boundary_signal = ready_to_apply_or_register
```

They do not become durable memory unless a later Phase 5 memory policy explicitly accepts a corresponding memory event.

---

## 8. Phase 5 v1.1 Inheritance — Memory and Current Truth

Phase 3 v1.3 consumes Phase 5 v1.1 `MemoryStateService` and `CurrentTruthProjection`.

### 8.1 Memory Commit Boundary

```text
Accepted semantic deltas are not durable memory.
Durable memory is created only through MemoryStateService.
Current truth is derived from durable memory events.
```

`MemoryStateService` owns:

1. memory ingestion policy
2. memory event validation
3. durable memory event creation
4. pre-response student-stated memory commit
5. post-response AI-produced memory commit
6. route outcome memory commit
7. official-truth rejection
8. memory/audit separation

### 8.2 CurrentTruthProjection Role

`CurrentTruthProjection` is the derived runtime view consumed by Phase 3.

It may include:

1. academic result status
2. course direction status
3. university direction status
4. pathway direction status
5. active directions
6. preference strength
7. recommendation readiness
8. hard constraints
9. soft preferences
10. current decision blockers
11. handoff readiness context
12. route episode projection

### 8.3 Route Episode Projection Role

Phase 5 v1.1 adds route-aware projection fields used by Phase 3:

```ts
type RouteEpisodeProjection = {
  activeRouteCandidate?: RouteType;
  currentRouteGoal?: RouteGoal;

  latestRouteOutcomes: {
    courseExploration?: RouteOutcomeSummary;
    universityExploration?: RouteOutcomeSummary;
    pathwayExploration?: RouteOutcomeSummary;
    courseWithinUniversityContext?: RouteOutcomeSummary;
    combinedOptionValidation?: RouteOutcomeSummary;
    handoffPreparation?: RouteOutcomeSummary;
  };

  routeCompletionHistory: RouteOutcomeSummary[];
  routeDeferralHistory: RouteOutcomeSummary[];
  routeSwitchHistory: RouteSwitchSummary[];

  unresolvedRouteNeeds: {
    courseDirection: boolean;
    universityDirection: boolean;
    pathwayDirection: boolean;
    combinedValidation: boolean;
  };

  routeLoopRisk?: RouteLoopRisk;
  nextRouteCandidate?: RouteType;
  resumeRouteCandidate?: RouteType;
};
```

Phase 3 must treat these as **projection hints**, not final route decisions.

### 8.4 Route Outcome Memory

Phase 5 v1.1 adds:

```text
MemoryCategory = "route_outcome"
```

Route outcome memory may record meaningful route milestones such as:

1. confirmed preference
2. accepted fallback
3. deferred decision
4. student switched route
5. blocked by boundary
6. handoff required

Phase 3 must not store active route/progress as memory. It should only trigger or pass route outcome candidates to validators and memory service when a meaningful outcome is reached.

---

## 9. Core Phase 3 v1.3 Runtime Design Direction

Phase 3 v1.3 uses the following runtime stance:

```text
Deterministic shell
+ AI semantic delta extraction core
+ platform memory/current-truth core
+ platform route episode planning core
+ AI counseling core
+ platform validation/commit core
```

Short form:

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

Extended route-episode form:

```text
AI may extract semantic deltas and counsel.
Memory derives current truth.
Route planner derives active route episode.
Boundary resolver controls autonomy.
Validators enforce route, memory, and boundary safety.
Only validated outputs commit.
```

### 9.1 Why Not Mostly AI-Driven

A mostly AI-driven runtime would allow the AI to decide:

1. semantic interpretation
2. memory truth
3. active route
4. progress state
5. boundary zone
6. selected skill
7. route outcome
8. memory commit
9. handoff need

This is unsafe because the AI would be both actor and judge.

### 9.2 Why Not Fully Deterministic

A fully deterministic runtime would provide strong control but may be too rigid for nuanced counseling.

It would require excessive hand-written rules before the system can naturally handle:

1. ambiguous student language
2. detours
3. preference changes
4. student-led route switches
5. decision friction
6. comparison reasoning
7. counselor-like response behavior

### 9.3 Why Deterministic Shell + AI Cores + Route Planner

The selected design gives the AI flexibility where language understanding and counseling expression matter, while keeping platform authority over:

1. semantic delta validation
2. memory ingestion
3. current truth derivation
4. boundary resolution
5. route episode planning
6. skill selection
7. response validation
8. memory commit
9. audit/evaluation

---

## 10. Per-Turn Runtime Flow

Phase 3 v1.3 uses two major checkpoints:

```text
Checkpoint 1 — Pre-Generation Control
Checkpoint 2 — Pre-Commit Validation
```

---

## 10.1 Checkpoint 1 — Pre-Generation Control

Purpose:

```text
Detect boundary risk, validate semantic deltas, commit safe student-stated memory,
derive current truth, resolve active route episode, build accepted operating context,
select valid skills, route knowledge, and prepare controlled execution context
before the AI counselor responds.
```

### Checkpoint 1 Flow

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
16. Resolve decision-support mode, summary, or milestone requirements when needed
17. Select valid SKILL.md artifacts
18. Call KnowledgeGateway if needed
19. Compose ExecutionContext
20. Call AIExecutionClient
```

### Important Placement Rule

`RouteEpisodeCandidateResolver` runs before `BoundaryResolver`.

`RouteEpisodePlanner` runs after `BoundaryResolver`.

Reason:

```text
Candidate route helps boundary and context reasoning.
Boundary result controls final autonomy.
Final route planner produces accepted active route episode.
```

---

## 10.2 Checkpoint 2 — Pre-Commit Validation

Purpose:

```text
Validate the AI counselor's response and structured outputs before anything is
shown as final, committed as memory, used as runtime truth, or emitted as a
route outcome.
```

### Checkpoint 2 Flow

```text
1. Validate AIExecutionResult schema
2. Validate response safety and official-action boundary
3. Validate alignment with ActiveRouteEpisodeContext
4. Validate route transition and route outcome candidates
5. Validate preference promotion and confirmation evidence
6. Validate recommendation output, assumptions, and confidence
7. Validate handoff output when boundary requires it
8. Validate knowledge answerability/caveats when factual knowledge was used
9. Validate counselor-like response mode expectations
10. If invalid and retryable, retry response once with same accepted context
11. Do not repeat pre-response memory commit during retry
12. If valid, return response and commit post-response AI-produced outputs
13. Commit validated route_outcome memory when accepted
14. Write structured audit events
```

---

## 10.3 Full Prototype Turn Flow

```text
Natural language student message
  ↓
Load previous runtime conversation state
  ↓
Derive prior CurrentTruthProjection from MemoryEventStore
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
KnowledgeGateway, if needed
  ↓
ExecutionContextComposer
  ↓
AIExecutionClient
  ↓
ValidationPipeline
  ↓
If invalid: retry response only, without repeating pre-response memory commit
  ↓
If valid: MemoryStateService.commitPostResponseAIOutputs()
  ↓
AuditEventStore
  ↓
Validated response returned to student
```

---

## 10.4 Phase 4 or Phase 5 Unavailable Fallback

If Phase 4 v1.3 semantic delta extraction is not yet implemented in the prototype, the runtime may temporarily use validated heuristics to feed the same accepted artifact fields.

If Phase 5 v1.1 memory/current truth is not yet implemented, the runtime may temporarily use in-memory or file-based projection, as long as downstream modules consume a `CurrentTruthProjection`-shaped contract.

Fallback rule:

```text
Temporary heuristics may feed the same contracts.
Downstream modules should depend on accepted semantic artifacts and current truth,
not raw transcript or uncontrolled summaries.
```

---

## 11. Runtime Module Topology

### 11.1 Updated Module Topology

```text
CounselingTurnOrchestrator
  ↓
ConversationStateLoader
  ↓
CurrentTruthProjector.priorProjection()
  ↓
FastBoundarySignalScanner
  ↓
AISemanticDeltaExtractor
  ↓
SemanticDeltaValidator
  ↓
MemoryStateService.commitPreResponseStudentMemory()
  ↓
CurrentTruthProjector.currentProjection()
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

### 11.2 Module Ownership Summary

| Module | Owner | Role |
|---|---|---|
| `CounselingTurnOrchestrator` | Platform | Controls turn sequence and failure behavior |
| `ConversationStateLoader` | Platform | Loads prior runtime state and memory references |
| `FastBoundarySignalScanner` | Platform | High-recall deterministic scan for obvious boundary phrases |
| `AISemanticDeltaExtractor` | AI core | Proposes semantic deltas and runtime-only signals |
| `SemanticDeltaValidator` | Platform | Accepts, downgrades, rejects semantic candidates |
| `MemoryStateService` | Platform | Commits validated durable memory events |
| `CurrentTruthProjector` | Platform | Derives current truth from durable memory events |
| `RouteEpisodeCandidateResolver` | Platform | Derives candidate route before boundary finalization |
| `BoundaryResolver` | Platform | Resolves final autonomy boundary |
| `RouteEpisodePlanner` | Platform | Produces final active route episode after boundary result |
| `OperatingContextManager` | Platform | Builds accepted operating context from final route + boundary + truth |
| `SkillControlService` | Platform | Selects approved skills and boundary rules |
| `KnowledgeGateway` | Platform | Provides answerability, safe facts, caveats, and sources |
| `ExecutionContextComposer` | Platform | Builds controlled prompt/context package |
| `AIExecutionClient` | AI core | Produces student-facing response and structured execution result |
| `ValidationPipeline` | Platform | Validates response, route alignment, memory candidates, handoff, knowledge, safety |
| `AuditEventStore` | Platform | Stores audit/evaluation evidence |

---

## 12. Route Episode Candidate Resolution

### 12.1 Purpose

`RouteEpisodeCandidateResolver` answers:

```text
What route would we continue or select if boundary allows normal counseling?
```

It does not produce the final route.

It produces a candidate route to help boundary resolution, operating context, and later final route planning.

### 12.2 Inputs

```text
CurrentTruthProjection
accepted memory deltas from current turn
accepted runtime-only signals from current turn
prior OperatingContext
prior ActiveRouteEpisodeContext
route outcome history
route deferral history
route switch history
detour/resume context
```

### 12.3 Output

```ts
type RouteEpisodeCandidate = {
  routeType: RouteType;
  progressState: RouteProgressState;
  routeGoal: RouteGoal;
  reason: string;
  evidence: EvidenceSpan[];
  confidence: "low" | "medium" | "high";
  candidateSource:
    | "current_truth"
    | "accepted_semantic_delta"
    | "prior_operating_context"
    | "route_outcome_history"
    | "detour_resume";
};
```

### 12.4 Candidate Resolution Rules

```text
No active route + insufficient information
→ initial_route_selection
```

```text
Academic known + course unresolved + university unresolved
→ course_exploration
```

```text
Academic known + course known + university unresolved
→ university_exploration
```

```text
Academic known + university known + course unresolved
→ course_exploration_within_university_context
```

```text
Academic known + pathway uncertainty dominant
→ pathway_exploration
```

```text
Academic known + course known + university known + pathway not decision-critical
→ combined_option_validation
```

```text
Prior route still valid + no higher-priority evidence
→ continue prior route candidate
```

### 12.5 Candidate Resolver Failure Behavior

If candidate route is unclear:

```text
Fallback to previous active route if still safe.
Otherwise use initial_route_selection.
```

If candidate route conflicts with current truth:

```text
Reject candidate route.
Continue previous route or clarify once.
Audit route_candidate_rejected.
```

---

## 13. Boundary Resolution

### 13.1 BoundaryResolver Role

`BoundaryResolver` owns final boundary zone.

It consumes:

1. fast boundary signals
2. accepted runtime-only boundary signals
3. current truth
4. route episode candidate
5. prior operating context
6. handoff readiness history
7. official-action risk rules

It produces:

```ts
type BoundaryResult = {
  zone: "green" | "yellow" | "red";
  triggerTypes: HandoffTriggerType[];
  severity: "none" | "low" | "medium" | "high";
  recommendedBehavior:
    | "continue_autonomous"
    | "clarify_once"
    | "handoff_safe"
    | "block_and_handoff";
  evidence: EvidenceSpan[];
  auditReason: string;
};
```

### 13.2 Boundary Override Rule

Boundary result overrides route planning.

```text
If BoundaryResult.zone = red:
  activeRouteEpisode.routeType = handoff_preparation
  activeRouteEpisode.progressState = handoff
  counselorResponseMode = handoff_safe
  normal route completion is blocked
```

### 13.3 Boundary Clarification Rule

For yellow-zone ambiguity:

```text
Ask targeted clarification when clarification can safely resolve the boundary.
Avoid deep processing of sensitive/official details.
Escalate if unresolved and material.
```

---

## 14. Route Episode Planning

### 14.1 RouteEpisodePlanner Purpose

`RouteEpisodePlanner` answers:

```text
Given boundary result, current truth, route candidate, prior route, and transition
policy, what route should the system actually follow this turn?
```

It produces final `ActiveRouteEpisodeContext`.

### 14.2 Inputs

```text
BoundaryResult
RouteEpisodeCandidate
CurrentTruthProjection
AcceptedSemanticDelta
prior OperatingContext
prior ActiveRouteEpisodeContext
route outcome history
route deferral history
route switch history
loop-risk indicators
detour/resume overlay
```

### 14.3 Transition Priority

```ts
type RouteTransitionPriority =
  | "boundary_override"
  | "human_support_request"
  | "student_led_route_switch"
  | "active_route_outcome_reached"
  | "detour_resume"
  | "loop_risk_or_deferral"
  | "continue_active_route"
  | "initial_route_selection";
```

Execution priority:

```text
1. boundary_override
2. human_support_request
3. student_led_route_switch
4. active_route_outcome_reached
5. detour_resume
6. loop_risk_or_deferral
7. continue_active_route
8. initial_route_selection
```

### 14.4 Core Transition Rule

```text
Default behavior is to continue the active route unless a higher-priority transition
condition is met.
```

Short form:

```text
Route should be sticky.
Detours should be temporary.
Switches should require evidence.
Outcomes should require validation.
Boundaries should override everything.
```

### 14.5 RouteTransitionDecision Contract

```ts
type RouteTransitionDecision = {
  decision:
    | "continue_active_route"
    | "switch_route"
    | "complete_route"
    | "defer_route"
    | "enter_detour"
    | "resume_route"
    | "enter_handoff";

  priority: RouteTransitionPriority;

  previousRoute?: RouteType;
  activeRoute: RouteType;
  progressState: RouteProgressState;

  routeOutcome?: RouteOutcome;
  nextRouteCandidate?: RouteType;
  resumeRouteCandidate?: RouteType;

  evidence: EvidenceSpan[];
  requiresValidation: boolean;
  auditReason: string;
};
```

### 14.6 ActiveRouteEpisodeContext Contract

```ts
type ActiveRouteEpisodeContext = {
  routeType: RouteType;
  routeGoal: RouteGoal;
  progressState: RouteProgressState;

  transitionDecision: RouteTransitionDecision;

  recommendationReadiness: RecommendationReadiness;
  preferenceStrength: PreferenceStrength;

  activeDirections: {
    course?: string;
    university?: string;
    pathway?: string;
  };

  routeConstraints: RouteConstraint[];
  decisionBlockers: DecisionBlocker[];

  routeOutcomeCandidate?: RouteOutcome;
  nextRouteCandidate?: RouteType;
  resumeRouteCandidate?: RouteType;

  loopRisk?: RouteLoopRisk;
  detourOverlay?: RouteDetourOverlay;

  source: {
    derivedFromCurrentTruth: boolean;
    usedAcceptedSemanticDelta: boolean;
    usedPriorOperatingContext: boolean;
    usedBoundaryResult: boolean;
    usedRouteOutcomeHistory: boolean;
  };
};
```

### 14.7 RouteEpisodePlanner Ownership

`RouteEpisodePlanner` owns:

1. final active route type
2. route goal
3. route progress state
4. route transition decision
5. route outcome candidate
6. next route candidate
7. resume route candidate
8. loop risk
9. detour/resume context
10. route-related audit reason

It does not own:

1. final boundary zone
2. official-action decision
3. durable memory commit
4. skill selection
5. knowledge answerability
6. student-facing response wording
7. CRM/application status
8. final memory truth

---

## 15. Detour and Resume Runtime Behavior

### 15.1 Detour Overlay Contract

```ts
type RouteDetourOverlay = {
  detourKind:
    | "informational"
    | "factual_knowledge"
    | "preference_revealing"
    | "boundary";
  resumeRoute: RouteType;
  resumeProgressState: RouteProgressState;
  discoveredSignals?: string[];
};
```

### 15.2 Detour Rule

A detour should not replace the active route unless it reveals:

1. red-zone boundary
2. explicit student-led route switch
3. valid route outcome
4. new hard constraint that invalidates the active route

### 15.3 Detour Runtime Handling

For safe informational or factual detours:

```text
answer the detour
preserve active route
resume with one useful route-aligned next step
```

For preference-revealing detours:

```text
capture validated memory delta if eligible
update current truth
resume active route unless new evidence justifies switch/outcome
```

For boundary detours:

```text
boundary overrides route
enter handoff_preparation when red
```

---

## 16. Loop Risk and Deferral Runtime Behavior

### 16.1 Loop Risk Triggers

Loop risk may be detected when:

1. repeated indecision occurs after decision-support attempts
2. repeated comparison happens without new criteria
3. student rejects every option without giving a new constraint
4. student keeps asking “which is better?” after trade-off explanation
5. student says they are overwhelmed or tired
6. no route progress occurs after several valid guidance turns

### 16.2 Loop Risk Policy

After loop risk is detected:

```text
1. summarize decision point
2. reflect blocker
3. offer safe deferral or fallback
4. avoid forcing confirmation
5. optionally move to another route if the student agrees
```

### 16.3 Runtime Ownership

Loop thresholds and deferral policy belong to:

```text
RouteEpisodePlanner / DecisionSupportPolicy
```

They should not be duplicated inside every skill metadata file.

---

## 17. Operating Context Ownership

### 17.1 OperatingContext Role

`OperatingContext` is the accepted per-turn runtime context used for skill selection, execution context composition, validation, audit, and response behavior.

It is not durable memory.

It is derived from:

1. `BoundaryResult`
2. `ActiveRouteEpisodeContext`
3. `CurrentTruthProjection`
4. accepted runtime-only signals
5. prior operating context
6. selected response policy

### 17.2 OperatingContext Contract

```ts
type OperatingContext = {
  boundary: BoundaryResult;

  activeRouteEpisode: ActiveRouteEpisodeContext;

  primaryCounselingAction: CounselingAction;
  counselorResponseMode: CounselorResponseMode;

  studentPosture?: StudentPosture;
  decisionSupportMode?: DecisionSupportMode;

  knowledgeNeed?: KnowledgeNeedContext;
  handoffStatus: HandoffStatus;

  recommendationReadiness: RecommendationReadiness;
  preferenceStrength: PreferenceStrength;

  validationRequirements: ValidationRequirement[];

  legacyMigration?: {
    legacyMainState?: string;
    legacyOverlayState?: string;
    legacyMinimumProfileRoute?: string;
  };
};
```

### 17.3 Deprecated Operating Context Fields

The following fields are deprecated as primary runtime controls:

```text
current_main_state
overlay_state as S9-style journey state
resume_target_state as journey-state target
minimum_profile_route
```

Replace with:

```text
activeRouteEpisode.routeType
activeRouteEpisode.progressState
activeRouteEpisode.transitionDecision
activeRouteEpisode.detourOverlay
activeRouteEpisode.resumeRouteCandidate
```

### 17.4 Current Truth Fields That Remain Important

Do not remove these from `CurrentTruthProjection`:

```text
academic_result_status
course_direction_status
university_direction_status
pathway_direction_status
recommendation_readiness
preference_strength
active directions
hard constraints
soft preferences
current decision blockers
handoff readiness context
```

They are current-truth inputs, not route state.

---

## 18. Skill Selection Runtime Behavior

### 18.1 Skill Selection Order

`SkillControlService` should evaluate candidates in this order:

```text
1. Boundary rule eligibility
2. Approved/latest skill status
3. Active route compatibility
4. Progress state compatibility
5. Counseling action compatibility
6. Zone compatibility
7. Recommendation readiness compatibility
8. Preference strength compatibility
9. Student posture / response mode match
10. Best semantic retrieval score
```

### 18.2 Boundary Rule Loading

Boundary rules are deterministically loaded based on:

1. Phase 0 policy
2. `BoundaryResult`
3. handoff trigger types
4. official-action risk
5. selected route and response mode
6. selected skill context

Boundary rules are not optional semantic retrieval results.

### 18.3 Active Route Skill Compatibility

Runtime skills should be compatible with:

1. `activeRouteEpisode.routeType`
2. `activeRouteEpisode.progressState`
3. `primaryCounselingAction`
4. `BoundaryResult.zone`
5. `recommendationReadiness`
6. `preferenceStrength`
7. `counselorResponseMode`

During migration, legacy `applies_to_minimum_profile_routes` may be mapped to `applies_to_active_routes` only as a compatibility hint.

---

## 19. Execution Context Composition

### 19.1 ExecutionContextComposer Role

`ExecutionContextComposer` builds the controlled context package given to `AIExecutionClient`.

It should include:

1. student message
2. relevant recent conversation summary
3. accepted current truth summary
4. active route episode context
5. boundary result
6. selected runtime skill guidance
7. selected playbook excerpt, if any
8. mandatory boundary rules
9. knowledge gateway result, if any
10. counselor response mode
11. decision-support mode, if any
12. allowed response goals
13. forbidden response claims
14. required validation-sensitive wording
15. structured output schema expectations

### 19.2 AIExecutionClient Role

The AI counseling core may propose:

1. student-facing response
2. structured execution result
3. recommendation explanation
4. comparison explanation
5. clarification phrasing
6. decision-support framing
7. route-relevant output candidates
8. memory/event candidates for post-response validation
9. handoff summary candidate

It must not own final:

1. route state
2. route outcome
3. memory commit
4. boundary zone
5. official action status
6. CRM/application truth

---

## 20. AIExecutionResult Contract

```ts
type AIExecutionResult = {
  responseText: string;

  responseIntent:
    | "orient"
    | "explore"
    | "explain"
    | "recommend"
    | "compare"
    | "decision_support"
    | "confirm_preference"
    | "support_deferral"
    | "answer_detour"
    | "prepare_handoff";

  proposedRouteSignals?: {
    routeOutcomeCandidate?: RouteOutcome;
    routeSwitchCandidate?: RouteType;
    deferralCandidate?: boolean;
    fallbackAcceptedCandidate?: boolean;
    confirmationCandidate?: boolean;
    detourResumeCandidate?: boolean;
  };

  proposedMemoryEvents?: ProposedMemoryEvent[];
  proposedRecommendationOutput?: ProposedRecommendationOutput;
  proposedHandoffOutput?: ProposedHandoffOutput;

  safetySelfCheck?: {
    mentionsOfficialAction: boolean;
    impliesOfficialCompletion: boolean;
    needsHumanHandoff: boolean;
  };

  evidenceReferences?: EvidenceSpan[];
};
```

AI-produced fields are candidates only.

They require validation before commit or use.

---

## 21. Validation Pipeline

### 21.1 Core Principle

```text
Route validation should be centralized in platform validators, not distributed
across skill metadata.
```

### 21.2 Validators

Phase 3 v1.3 adds or updates these validators:

1. `RouteEpisodeCandidateValidator`
2. `RouteTransitionValidator`
3. `RouteOutcomeValidator`
4. `RouteResponseAlignmentValidator`
5. `BoundaryOverrideValidator`
6. `SkillCompatibilityValidator`
7. `PreferencePromotionValidator`
8. `KnowledgeAnswerabilityValidator`
9. `MemoryCommitValidator` through `MemoryStateService`
10. `CounselorLikeResponseValidator`

---

## 21.3 RouteEpisodeCandidateValidator

Validates the candidate route before final route planning.

Checks:

1. candidate route is compatible with `CurrentTruthProjection`
2. candidate route does not conflict with prior active route unless switch evidence exists
3. candidate route does not treat missing profile fields as completion
4. candidate route does not ignore unresolved course/university/pathway direction
5. candidate route does not override boundary risk

Failure behavior:

```text
Reject invalid candidate.
Continue previous route if safe.
Otherwise use initial_route_selection.
Audit route_candidate_rejected.
```

---

## 21.4 RouteTransitionValidator

Validates route transition decision.

Checks:

1. transition priority was followed
2. active route continued by default unless higher-priority condition exists
3. student-led switch has explicit evidence
4. detour is overlay, not route replacement
5. boundary override wins over normal route transition
6. loop-risk transition happens only after enough repeated indecision evidence

Prevents:

```text
Too loose:
  AI switches route whenever student mentions a related topic.

Too rigid:
  AI refuses to switch when student clearly redirects the decision area.
```

---

## 21.5 RouteOutcomeValidator

Validates route completion and route outcome candidates.

Owns:

1. no shortlist-only completion
2. no recommendation-presented-only completion
3. no L1/L2/L3 completion
4. no unresolved comparison completion
5. no budget/location/ranking collected-only completion
6. confirmed preference evidence
7. accepted fallback evidence
8. deferral evidence
9. route switch evidence
10. boundary/handoff outcome safety

### Confirmed Preference Evidence

Requires explicit student confirmation.

Valid examples:

```text
Yes, Psychology is my choice for now.
I want to go with Sunway for this course.
I think diploma is the path I want.
This option seems best for me.
```

Invalid examples:

```text
Psychology sounds interesting.
I prefer Psychology over Business.
Maybe Sunway.
Can you show me a shortlist?
```

### Accepted Fallback Evidence

Requires explicit student acceptance of a fallback or working option.

Accepted fallback is not L4 confirmed counseling preference unless explicitly confirmed as the student’s chosen counseling direction.

### Deferred Decision Evidence

Requires explicit deferral or validated loop-risk behavior.

Examples:

```text
I need more time to think.
I want to discuss with my parents first.
Let's pause this for now.
```

---

## 21.6 RouteResponseAlignmentValidator

Validates the student-facing response against the accepted active route.

Checks:

1. response stays aligned with active route
2. response reflects progress state
3. response does not claim route completion when outcome is not validated
4. response does not overstate preference strength
5. response does not ask irrelevant next-route questions too early
6. response uses selected counselor response mode
7. response asks only one purposeful next question unless summary/handoff requires otherwise

Example failure:

```text
activeRoute = course_exploration
progressState = comparison
student only expressed L3 preference

AI response:
"Great, your course route is complete. Now let's choose university."

Validation:
reject / regenerate
reason = L3 expressed preference cannot complete course route
```

---

## 21.7 BoundaryOverrideValidator

Ensures boundary result wins over route.

Checks:

1. red-zone intent forces handoff-safe behavior
2. apply/register/pay/enroll/reserve language is not treated as normal route progress
3. human-requested support triggers handoff behavior
4. official-action language is removed or blocked
5. route outcome does not authorize official action
6. memory output does not create official truth

---

## 21.8 MemoryCommitValidator

Memory commit validation belongs to `MemoryStateService` / `MemoryEventValidator`.

It validates:

1. whether a proposed memory event can commit
2. whether evidence is strong enough
3. whether route_outcome memory is valid
4. whether accepted fallback should affect current truth
5. whether confirmed preference is counseling-only
6. whether official-truth boundary is preserved

This replaces the need for skill-level `allowed_memory_outputs` / `forbidden_memory_outputs` as final authorization.

---

## 22. Response Retry and Failure Behavior

### 22.1 Retry Rule

If response validation fails and the failure is retryable:

```text
Retry the response once using the same accepted context.
Do not repeat pre-response memory commit.
Do not rerun route planning unless boundary/context changed due to validation failure.
```

Retryable failures include:

1. route response alignment failure
2. counselor-like response shape failure
3. missing required caveat
4. mild overstatement that can be corrected
5. missing summary checkpoint
6. wrong next question inside otherwise safe route

Non-retryable failures include:

1. red-zone official-action violation requiring handoff-safe fallback
2. unsafe claim of official completion
3. malformed structured output with no safe recovery
4. boundary contradiction requiring clarification/handoff

### 22.2 Safe Fallback Behavior

If retry still fails:

```text
Return safe clarification or handoff-safe response depending on boundary risk.
Audit response_retry_failed.
Do not commit proposed AI outputs.
```

### 22.3 Boundary Failure Behavior

If boundary signal appears:

```text
Boundary wins.
Enter handoff_preparation or clarify once depending on severity.
```

### 22.4 Route Transition Failure Behavior

If AI proposes switch without evidence:

```text
Reject switch.
Continue active route.
Audit unauthorized_route_switch_rejected.
```

If AI proposes completion from L3:

```text
Reject completion.
Set progress toward summary checkpoint / decision support / confirmation prompt.
Audit route_completion_rejected_l3.
```

---

## 23. Memory and Commit Timing

### 23.1 Pre-Response Student-Stated Memory Commit

Student-stated memory may commit before response generation when:

1. semantic delta is accepted
2. memory ingestion policy accepts it
3. memory event validator accepts it
4. official-truth boundary is preserved

This allows current truth to include newly stated facts before route planning and response generation.

### 23.2 Post-Response AI-Produced Output Commit

AI-produced outputs commit only after:

1. AI response is validated
2. route alignment is validated
3. memory candidate is validated
4. official-action boundary is preserved
5. response is returned or accepted for delivery

### 23.3 Route Outcome Commit

`route_outcome` memory commits only when:

1. RouteOutcomeValidator accepts route outcome
2. RouteTransitionValidator accepts transition
3. BoundaryOverrideValidator does not block outcome
4. MemoryStateService accepts route outcome memory

Route start/progress events are audit/runtime by default, not durable memory.

---

## 24. Audit Events

Phase 3 v1.3 should emit structured audit events for route and runtime decisions.

### 24.1 Core Runtime Audit Events

```text
turn_started
fast_boundary_scan_completed
semantic_delta_extracted
semantic_delta_validated
pre_response_memory_commit_completed
current_truth_projected
boundary_resolved
operating_context_accepted
skill_selected
knowledge_gateway_used
ai_execution_completed
validation_completed
post_response_memory_commit_completed
turn_completed
```

### 24.2 Route Episode Audit Events

```text
route_candidate_resolved
route_candidate_rejected
active_route_selected
progress_state_derived
route_transition_decision
route_transition_rejected
route_outcome_candidate_detected
route_outcome_accepted
route_outcome_rejected
route_deferred
route_switched
detour_entered
detour_resumed
loop_risk_detected
boundary_overrode_route
route_response_alignment_failed
route_memory_commit_accepted
route_memory_commit_rejected
```

### 24.3 Audit Must Answer

Audit should explain:

1. Why did the system stay on this route?
2. Why did it switch route?
3. Why did it not complete the route?
4. Why did it hand off?
5. Why was memory committed or rejected?
6. Why was the response retried or blocked?
7. Which skill and boundary rules were used?

---

## 25. Evaluation Labels and Metrics

### 25.1 Evaluation Labels

```text
route_correct
route_wrong
route_switch_correct
route_switch_premature
route_completion_correct
route_completion_premature
route_completion_missed
shortlist_overpromoted
L3_overpromoted
detour_resume_success
detour_route_lost
deferral_correct
deferral_premature
handoff_override_correct
handoff_missed
boundary_overtriggered
counselor_like_flow_good
counselor_like_flow_rigid
too_many_questions
route_question_irrelevant
memory_commit_correct
memory_commit_overpromoted
```

### 25.2 Prototype Metrics

Track:

```text
route_selection_accuracy
route_switch_precision
route_switch_recall
premature_route_completion_rate
missed_route_completion_rate
detour_resume_success_rate
boundary_override_recall
handoff_miss_rate
L3_overpromotion_rate
shortlist_overpromotion_rate
route_memory_commit_accuracy
response_regeneration_rate
counselor_like_quality_score
mechanical_intake_rate
```

Most important early metrics:

1. premature route completion rate
2. route switch precision
3. detour resume success rate
4. boundary override recall
5. L3 overpromotion rate
6. counselor-like quality score

---

## 26. Prototype Implementation Slice

### 26.1 Must Implement First

The first Phase 3 v1.3 prototype alignment should implement:

1. `RouteType` enum
2. `RouteProgressState` enum
3. `RouteOutcome` enum
4. `RouteTransitionPriority` enum
5. `RouteEpisodeCandidateResolver`
6. `RouteEpisodePlanner`
7. `ActiveRouteEpisodeContext`
8. `RouteTransitionDecision`
9. `RouteOutcomeValidator`
10. `RouteResponseAlignmentValidator`
11. detour/resume overlay
12. route_outcome memory event integration
13. route audit events
14. route-alignment tests
15. retry response only without duplicate pre-response memory commit

### 26.2 Should Not Implement Yet

Do not implement in the first route-episode prototype slice:

1. multi-route goal graph
2. durable active route episode store
3. full route analytics dashboard
4. production recommendation scoring
5. CRM integration
6. complex route optimization
7. heavy route outcome skill metadata
8. broad route policy language model planner
9. autonomous official action execution

### 26.3 Minimum Test Scenarios

#### Core Route Derivation

```text
1. no course/no university → activeRoute = course_exploration
2. course known/university unknown → activeRoute = university_exploration
3. university known/course unknown → activeRoute = course_exploration_within_university_context
4. course + university known → activeRoute = combined_option_validation
```

#### Completion Prevention

```text
5. weak interest does not complete course route
6. L3 expressed preference does not complete course route
7. shortlist-only does not complete university route
8. recommendation-presented-only does not complete route
9. budget/location collected does not complete university route
```

#### Outcome Handling

```text
10. explicit confirmed course preference completes course route
11. accepted fallback course creates accepted_fallback, not L4
12. deferred course decision creates route_outcome = deferred_decision
13. student-led switch from course to university route is accepted
14. repeated indecision triggers decision_support before deferral
```

#### Detour Handling

```text
15. factual detour answers and resumes active route
16. preference-revealing detour updates context but resumes route
17. boundary detour overrides route and enters handoff_preparation
```

#### Boundary Handling

```text
18. apply now overrides combined validation
19. register me blocks official action and prepares handoff
20. human counselor request enters handoff_preparation
21. payment/seat/enrollment language cannot become route outcome completion
```

#### Response Validation

```text
22. AI tries to complete route from L3 → rejected/regenerated
23. AI switches route without evidence → rejected
24. AI asks irrelevant university-fit question during course route → regenerated or downgraded
25. AI implies confirmed preference is official registration → boundary-safe rewrite
```

#### Memory

```text
26. valid route_outcome memory commits after validator acceptance
27. invalid route_outcome memory rejected
28. accepted fallback does not become confirmed counseling preference
29. handoff readiness does not become application/registration truth
30. response retry does not duplicate memory commit
```

---

## 27. Runtime Data Contracts

This section collects the minimal runtime contracts needed for Phase 3 v1.3.

### 27.1 TurnInput

```ts
type TurnInput = {
  studentId: string;
  conversationId: string;
  turnId: string;
  messageId: string;
  messageText: string;
  timestamp: string;
};
```

### 27.2 RouteGoal

```ts
type RouteGoal = {
  decisionArea:
    | "course_direction"
    | "university_direction"
    | "course_within_university"
    | "pathway_direction"
    | "combined_option"
    | "handoff";
  targetOutcome?: RouteOutcome;
  description: string;
};
```

### 27.3 RouteLoopRisk

```ts
type RouteLoopRisk = {
  routeType: RouteType;
  riskLevel: "none" | "low" | "medium" | "high";
  reason?: string;
  repeatedPatternCount?: number;
  recommendedBehavior?:
    | "continue_guidance"
    | "decision_support"
    | "summary_checkpoint"
    | "offer_deferral"
    | "offer_fallback";
};
```

### 27.4 CounselingAction

```ts
type CounselingAction =
  | "greet_or_orient"
  | "select_initial_route"
  | "explore_interest"
  | "explain_option"
  | "answer_factual_detour"
  | "recommend"
  | "compare_or_shortlist"
  | "clarify_ambiguity"
  | "confirm_counseling_preference"
  | "support_deferral_or_indecision"
  | "detect_boundary"
  | "prepare_handoff";
```

### 27.5 CounselorResponseMode

```ts
type CounselorResponseMode =
  | "standard"
  | "reassuring_orientation"
  | "route_explanation"
  | "decision_support"
  | "summary_checkpoint"
  | "milestone_confirmation"
  | "clarify_once"
  | "handoff_safe";
```

---

## 28. Security and Safety Rules

### 28.1 Official Action Blocking

The runtime must block or rewrite any output that implies:

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

### 28.2 Boundary Overrides Route

If a route outcome and boundary signal conflict:

```text
Boundary wins.
```

Example:

```text
Student confirms Psychology at University A and asks, "Can you register me now?"

Outcome:
  route may have confirmed counseling preference evidence
  but boundary enters handoff_preparation / handoff_safe response
  no official registration is performed or implied
```

### 28.3 Memory Does Not Create Official Truth

No memory event can create official truth.

`DurableMemoryEvent.officialTruthBoundary.isOfficialTruth` must be false.

---

## 29. Decisions Locked by Phase 3 v1.3

The following decisions are locked:

1. Runtime uses deterministic shell + AI semantic delta extraction core + AI counseling core.
2. `AcceptedSemanticDelta` is consumed before memory/current truth derivation.
3. `MemoryStateService.commitPreResponseStudentMemory()` runs before route planning.
4. `CurrentTruthProjection` is derived before route planning.
5. `RouteEpisodeCandidateResolver` runs before `BoundaryResolver`.
6. `RouteEpisodePlanner` runs after `BoundaryResolver`.
7. Boundary result overrides route planning.
8. `activeRouteEpisode` replaces `minimum_profile_route` as primary route abstraction.
9. Academic/course/university/pathway statuses remain current-truth inputs.
10. Active route episode is runtime-derived and not durable memory.
11. Meaningful route outcomes may become durable `route_outcome` memory through Phase 5.
12. L3 expressed preference, shortlist-only, recommendation-presented-only, and collected fit signals do not complete a route.
13. Route validation belongs to platform validators, not skill metadata.
14. Memory commit eligibility belongs to `MemoryStateService` / `MemoryEventValidator`.
15. Skill metadata guides selection and response behavior but does not authorize memory commits.
16. Response retry must not repeat pre-response memory commit.
17. Audit must record route decisions, rejected route candidates, route outcomes, detours, boundary overrides, response validation failures, and memory commit decisions.

---

## 30. Open Questions Deferred

The following questions are deferred to later phases or implementation design:

1. final physical orchestration framework and LangGraph node design
2. exact route candidate scoring algorithm
3. final route loop-risk thresholds
4. production-grade route analytics dashboard
5. production-grade recommendation scoring integration
6. final handoff workflow and counselor assignment logic
7. CRM read-only adapter contract
8. CRM write/human approval workflow
9. full knowledge freshness and conflict-resolution policy
10. full correction/removal/contradiction memory UX
11. final Phase 2 v1.3 SKILL.md package schema
12. whether route candidate resolver should use a small deterministic rules engine, lightweight classifier, or hybrid model
13. whether route response alignment validation should be deterministic, AI-assisted, or hybrid in production
14. multi-conversation route continuity behavior
15. long-term metrics for counselor-like quality and route rigidity

---

## 31. Summary

Phase 3 v1.3 updates the autonomous runtime strategy to execute the approved Route Episode redesign.

The new runtime backbone is:

```text
AcceptedSemanticDelta
→ MemoryStateService
→ CurrentTruthProjection
→ RouteEpisodeCandidateResolver
→ BoundaryResolver
→ RouteEpisodePlanner
→ OperatingContextManager
→ SkillControlService
→ AIExecutionClient
→ ValidationPipeline
→ MemoryStateService post-response commit
→ AuditEventStore
```

The most important runtime principle is:

```text
Route episode is runtime-derived.
Route outcome may become durable memory.
Boundary overrides route.
Platform validators enforce route correctness.
Memory service enforces commit safety.
AI proposes; platform validates; only validated outputs commit.
```
