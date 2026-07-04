# Bounded Autonomous Counseling Platform — Updated Exploration Roadmap

**Project:** AI Counseling Platform Redesign  
**Roadmap Version:** 8.0 — revised after Route Episode redesign specification updates  
**Date:** 2026-07-04  
**Status:** Current master roadmap after Route Episode redesign alignment  
**Supersedes:** Roadmap v7.4  
**Source Inputs:**

1. Phase 0 — Bounded Autonomy Baseline Specification v1.0
2. Phase 1 — Autonomous Counseling Operating Model Specification v1.3
3. Phase 2 — Counseling SOP & Skill Control Specification v1.3
4. Phase 3 — Autonomous Runtime Strategy Specification v1.3
5. Phase 4 — Interpretation & Extraction Layer Specification v1.4
6. Phase 5 — Student Memory & Counseling State Specification v1.1
7. Prototype Runtime Checkpoint
8. Route Episode Redesign Exploration Roadmap v0.1
9. Route Episode Redesign Decision Summary v1.0
10. Roadmap v7.4

---

## 1. Purpose of This Updated Roadmap

This roadmap updates the bounded-autonomous counseling platform roadmap after completing the **Route Episode redesign** and generating updated Phase 1, Phase 2, Phase 3, Phase 4, and Phase 5 specifications.

Roadmap v8.0 replaces the older framing:

```text
Minimum profile reached
→ derive route from known/missing fields
→ use global journey state
```

with the approved Route Episode framing:

```text
Active Route Episode
→ guide toward route-specific outcome
→ use reusable progress states inside the active route
→ move to next route only after valid route outcome, deferral, student-led switch,
  or boundary interruption
```

The roadmap now treats **ActiveRouteEpisode** as the core runtime counseling goal frame. The previous `minimum_profile_route` abstraction is removed as the primary routing model.

---

## 2. Roadmap v8.0 Alignment Summary

Earlier roadmap alignments remain valid, but are now revised by the Route Episode redesign.

```text
v7.1 alignment:
Minimum profile is no longer a university-fit intake gate.
Minimum profile is a routing checkpoint.

v7.2 alignment:
The route-based flow remains the backbone.
A counselor-like behavior layer improves how the AI guides the student.

v7.3 alignment:
Phase 4 outputs semantic delta candidates and runtime-only signal candidates.
Memory/state derives accumulated truth later.

v7.4 alignment:
Phase 5 defines durable counseling memory events and derived CurrentTruthProjection.

v8.0 alignment:
Route Episode replaces minimum_profile_route and global S1-S9 as the primary
runtime counseling-flow model.
```

The new v8.0 backbone is:

```text
AcceptedSemanticDelta
→ MemoryStateService
→ CurrentTruthProjection
→ RouteEpisodeCandidateResolver
→ BoundaryResolver
→ RouteEpisodePlanner
→ ActiveRouteEpisodeContext
→ SkillControlService
→ AIExecutionClient
→ ValidationPipeline
→ Memory/Audit Commit
```

---

## 3. Updated Product Direction

The platform remains:

```text
An AI-first bounded autonomous counseling system.
```

The AI should be the primary student-facing counselor for ordinary pre-registration counseling. It should autonomously handle:

1. onboarding
2. academic/profile understanding
3. course/program exploration
4. pathway exploration
5. university/program exploration
6. factual detours and route resume
7. recommendation
8. comparison and shortlist support
9. decision support
10. counseling preference confirmation
11. accepted fallback handling
12. deferral and indecision handling
13. readiness-to-register detection
14. handoff context preparation

Humans remain responsible for:

1. application, registration, enrollment, payment, or seat-reservation actions
2. official CRM/application/registration state changes
3. high-risk or sensitive actions
4. exception, appeal, waiver, negotiation, or complex eligibility cases
5. student-requested human support
6. scenarios outside approved SOP/skill coverage

Core runtime principle remains:

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

Expanded v8.0 principle:

```text
AI may extract semantic deltas, identify route-relevant signals, counsel, recommend,
compare, and adapt response style.

Platform validates semantic deltas, memory ingestion, current truth, route episode,
boundary behavior, skill selection, route transition, route outcome, response safety,
and memory/audit commit.
```

---

## 4. Current Master Dependency Chain

Roadmap v8.0 dependency chain:

```text
Natural language student message
  ↓
ConversationStateLoader
  ↓
CurrentTruthProjector.priorProjection(), when needed
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
CurrentTruthProjector.currentProjection()
  ↓
CurrentTruthProjection
  ↓
RouteEpisodeCandidateResolver
  ↓
BoundaryResolver
  ↓
RouteEpisodePlanner
  ↓
ActiveRouteEpisodeContext
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
  ↓
Business Knowledge & Source Governance
  ↓
Recommendation & Decision Support
  ↓
Registration Boundary & Human Handoff
  ↓
CRM Integration
  ↓
Guardrails
  ↓
Evaluation
  ↓
Operations
  ↓
Prototype / Production Hardening
```

The most important downstream rule:

```text
Later phases must not consume raw transcript or uncontrolled summaries as their
primary source of truth.

They should consume AcceptedSemanticDelta, MemoryEventStore, CurrentTruthProjection,
ActiveRouteEpisodeContext, accepted OperatingContext, validated AI outputs,
blocked outputs, and audit evidence.
```

---

## 5. Locked Foundation From Approved Phases

---

## 5.1 Phase 0 — Bounded Autonomy Baseline

**Status:** Approved v1.0

### Locked Principles

```text
Autonomy by default.
Conservative at boundaries.
```

```text
Counseling decision does not equal official action.
```

```text
Under-handoff is the greater business risk.
Red-zone detection should prioritize recall over precision.
```

### Locked Zones

```text
Green Zone:
  Fully autonomous ordinary counseling.

Yellow Zone:
  Autonomous with caution, clarification, caveats, confidence reduction,
  or explicit confirmation.

Red Zone:
  Human handoff required.
```

### Locked Boundary

The AI may guide and record counseling-side signals such as:

1. weak interest
2. expressed interest
3. expressed preference
4. rejected option
5. comparison outcome
6. student concern
7. student constraint
8. recommendation reaction
9. deferral
10. accepted fallback
11. confirmed counseling preference
12. route outcome
13. readiness-to-register signal
14. handoff readiness context

The AI must not autonomously perform or claim:

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

## 5.2 Phase 1 — Autonomous Counseling Operating Model

**Status:** Approved v1.3

Phase 1 now defines the counseling operating model around **Active Route Episode + Route Progress State + Route Outcome**.

### Locked Scope

```text
Pre-registration prospects only.
```

### Locked Outcome

The AI guides students toward counseling-side decisions:

1. course/program preference
2. university choice
3. pathway choice
4. combined course + university + pathway counseling preference when appropriate

The goal is counseling preference formation, not official transaction completion.

### Primary Model

```text
Route owns the counseling goal.
Progress state owns where the student is inside that route.
Action owns the current turn.
Outcome owns route completion.
Boundary owns autonomy.
Memory owns durable counseling truth.
```

### Route Episode Definition

```text
CounselingRouteEpisode is a platform-owned, runtime-derived counseling goal frame.

It tells the system which counseling decision area is currently being resolved.
```

### Approved Route Types

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

### Approved Progress States

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

### Approved Route Outcomes

```ts
type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";
```

### Deprecated State Model

The old S1-S9 journey states are deprecated as the primary runtime model.

They may remain as migration references:

| Legacy State | v8.0 Interpretation |
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

### Non-Completion Rules

The following do not complete a route:

1. weak interest
2. expressed interest
3. L3 expressed preference
4. shortlist-only
5. recommendation-presented-only
6. comparison in progress
7. unresolved comparison
8. budget/location/ranking collected only
9. student still exploring

L3 may move the route toward comparison, decision support, summary checkpoint, confirmation prompt, or recommendation refinement. It cannot complete the route.

---

## 5.3 Phase 2 — Counseling SOP & Skill Control

**Status:** Approved v1.3

Phase 2 now aligns `SKILL.md` packages to active route episode context while keeping policy enforcement platform-owned.

### Locked Skill Stance

```text
Counselor-owned guidance.
Runtime-enforced boundaries.
Moderately guided AI behavior.
Lightweight metadata for selection, response shaping, and audit.
Platform validators for safety, route correctness, and memory commit.
```

### Layered Skill Model

```text
1. Playbooks
2. Runtime Skills
3. Boundary Rules
```

### Updated Metadata Direction

Runtime skills should align primarily to:

1. `activeRouteEpisode.routeType`
2. `activeRouteEpisode.progressState`
3. primary counseling action
4. boundary zone
5. recommendation readiness
6. preference level
7. student posture
8. counselor response mode
9. semantic context usage
10. audit output intent

### Deprecated as Enforceable Skill Metadata

Phase 2 v1.3 removes or deprecates these as final skill-level controls:

1. `applies_to_minimum_profile_routes`
2. `allowed_memory_outputs`
3. `forbidden_memory_outputs`
4. `can_support_route_outcomes`
5. `can_produce_route_outcomes`
6. `route_exit_rules`
7. `route_loop_controls`
8. `confirmation_required_when` as final policy

### Ownership Boundary

```text
SKILL.md guides behavior.
Platform validators enforce route correctness, memory safety, and boundary safety.
```

Skill metadata should not be the final authority for:

1. memory commit eligibility
2. route outcome validity
3. route transition validity
4. route exit policy
5. loop-risk thresholds
6. global official-action blocking
7. durable current-truth projection

---

## 5.4 Phase 3 — Autonomous Runtime Strategy

**Status:** Approved v1.3

Phase 3 now defines the Route Episode runtime.

### Locked Runtime Style

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

### Key Runtime Additions

1. `RouteEpisodeCandidateResolver` before `BoundaryResolver`
2. `RouteEpisodePlanner` after `BoundaryResolver`
3. `ActiveRouteEpisodeContext` inside accepted `OperatingContext`
4. `RouteTransitionDecision`
5. `RouteOutcomeValidator`
6. `RouteResponseAlignmentValidator`
7. route-specific audit/evaluation events
8. route-aware `CurrentTruthProjection` consumption
9. route outcome memory commit path
10. response retry without duplicate pre-response memory commit

### Placement Rule

```text
RouteEpisodeCandidateResolver runs before BoundaryResolver.
RouteEpisodePlanner runs after BoundaryResolver.
```

Reason:

```text
Candidate route helps boundary and context reasoning.
Boundary result controls final autonomy.
Final route planner produces accepted active route episode.
```

### Validation Focus

Phase 3 validators must enforce:

1. no premature route completion
2. no shortlist-only completion
3. no L1/L2/L3 over-promotion
4. no route switch without evidence
5. boundary override correctness
6. skill compatibility with active route
7. response alignment with route and progress state
8. memory output safety
9. official-action blocking
10. retry-safe commit behavior

---

## 5.5 Phase 4 — Interpretation & Extraction Layer

**Status:** Approved v1.4

Phase 4 remains a semantic delta proposal layer.

### Locked Contract

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

### v8.0 Route Episode Compatibility

Phase 4 may extract route-relevant evidence, but it does not own route state.

Phase 4 does not output final:

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

### New Route-Relevant Runtime Signal Category

Phase 4 v1.4 adds:

```text
runtimeOnlySignalCandidates.route_episode
```

Supported route episode signal candidates:

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

Important rule:

```text
routeHint is only a hint.
It is not the active route.
```

### Phase 4 Ownership Boundary

```text
Phase 4 detects semantic evidence.
Phase 5 derives current truth.
Phase 3 plans active route episode.
Validators decide route and memory safety.
```

---

## 5.6 Phase 5 — Student Memory & Counseling State

**Status:** Approved v1.1

Phase 5 now supports route outcome memory and route-aware current truth.

### Locked Core Principle

```text
Accepted semantic deltas are not durable memory.
Active route episode is not durable memory.
Durable memory is created only through MemoryStateService.
Current truth is derived from durable memory events.
Route episode is derived from current truth, accepted runtime artifacts, boundary
result, and prior operating context.
Meaningful route outcomes may become durable counseling memory.
Official CRM/application truth remains externally owned.
```

### Durable Storage Boundary

Phase 5 durably stores only:

```text
1. MemoryEventStore
2. AuditEventStore
```

Phase 5 does not create durable stores for:

1. `CurrentTruthProjectionStore`
2. `RuntimeTurnContextStore`
3. `ActiveRouteEpisodeStore`
4. `RouteProgressStateStore`
5. `CRMReferenceView`

### New Memory Category

```ts
type MemoryCategory =
  | "academic"
  | "course_direction"
  | "university_direction"
  | "pathway_direction"
  | "counseling_preference"
  | "route_outcome"
  | "rejected_option"
  | "constraint"
  | "quality_context"
  | "concern_or_blocker"
  | "decision_support"
  | "recommendation_interaction"
  | "handoff_readiness";
```

### RouteOutcomeMemory

RouteOutcomeMemory explains:

```text
Why did the active route complete, pause, switch, block, or hand off?
```

It stores meaningful route lifecycle milestones only, not active route state.

Route start is audit/runtime by default:

```text
route_started → audit/runtime by default
route_outcome_reached → durable memory if counseling-significant
```

### Route-Aware CurrentTruthProjection

`CurrentTruthProjection` may derive:

1. latest route outcomes
2. route completion history
3. route deferral history
4. route switch history
5. unresolved route needs
6. route loop-risk hints
7. next route candidate hints
8. resume route candidate hints

These remain projection hints, not final route decisions.

---

## 5.7 Prototype Runtime Checkpoint

**Status:** Existing vertical slice proven; requires Route Episode alignment

The existing prototype proves the original runtime control loop:

```text
student message
→ boundary scan
→ operating context snapshot
→ SKILL.md metadata selection
→ knowledge gateway when needed
→ AIExecutionResult proposal
→ validation
→ validated commit only
→ audit event
```

Latest checkpoint:

```text
16/16 tests passing
```

v8.0 implication:

```text
The existing prototype proves control.
It does not yet prove the full Route Episode model, route outcome memory,
route-aware CurrentTruthProjection, RouteEpisodeCandidateResolver,
RouteEpisodePlanner, or route-specific validators.
```

The next prototype work should preserve the proven control loop while replacing the old journey-state/minimum-profile routing logic with the Route Episode runtime contracts.

---

## 6. Route Episode as the New Operating Backbone

The platform should now reason about counseling flow using:

```text
Boundary Zone
  = how autonomous the AI may be

CurrentTruthProjection
  = what the platform currently believes from durable memory

Active Route Episode
  = what counseling decision area is being resolved

Progress State
  = where the student is inside the active route

Preference Strength
  = how committed the student is

Recommendation Readiness
  = how useful/safe recommendation is for this route

Primary Counseling Action
  = what the AI should do this turn

Counselor Response Mode
  = how the AI should say it

Selected Skill
  = approved behavior guidance for the turn

Route Outcome
  = whether the route can complete, defer, switch, or hand off

Memory / Audit Commit
  = what gets stored after validation
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

---

## 7. Updated Phase Roadmap

---

## 7.1 Phase 0 — Bounded Autonomy Baseline

**Status:** Complete / locked v1.0

No immediate update required.

Future revisit only when:

1. AI is allowed to perform any official action
2. CRM write operations are introduced
3. payment, registration, or seat-reservation automation is considered
4. policy/compliance boundaries change
5. sensitive student data handling is expanded

---

## 7.2 Phase 1 — Autonomous Counseling Operating Model

**Status:** Complete / current v1.3

Completed v8.0 updates:

1. introduced `CounselingRouteEpisode`
2. replaced `minimum_profile_route`
3. deprecated global S1-S9 as primary runtime model
4. reclassified S2 as route-readiness/current-truth checkpoint
5. defined `RouteType`
6. defined `RouteProgressState`
7. defined `RouteOutcome`
8. defined route transition principles
9. defined L3/shortlist non-completion rules
10. preserved counselor-like flow and official-action boundaries

Future possible updates:

1. refine route types after prototype evidence
2. decide whether affordability/scholarship becomes separate route later
3. refine route-scoped confirmation language
4. refine deferral recovery UX
5. refine combined-option validation behavior

---

## 7.3 Phase 2 — Counseling SOP & Skill Control

**Status:** Complete / current v1.3

Completed v8.0 updates:

1. added active route metadata
2. added progress-state metadata
3. deprecated `applies_to_minimum_profile_routes`
4. removed skill metadata as memory authorization layer
5. removed route outcome policy from skill metadata
6. simplified `SKILL.md` metadata model
7. clarified playbook/runtime skill/boundary rule responsibility
8. aligned skills to route episode, action, posture, and response mode

Future work:

1. build real route-compatible skill packages
2. update existing prototype skill fixtures
3. migrate old skill metadata
4. add skill-body examples for each route/progress-state combination
5. create evaluation scenarios per skill
6. test skill body influence on live model behavior

---

## 7.4 Phase 3 — Autonomous Runtime Strategy

**Status:** Complete / current v1.3

Completed v8.0 updates:

1. added `RouteEpisodeCandidateResolver`
2. added `RouteEpisodePlanner`
3. added `ActiveRouteEpisodeContext`
4. added `RouteTransitionDecision`
5. added route validators
6. updated runtime topology
7. updated operating context contract
8. updated skill selection inputs
9. added route audit events
10. added route prototype test scenarios

Future implementation work:

1. implement the route episode runtime contracts in prototype
2. decide how much of route planning is deterministic vs LLM-assisted later
3. add route-alignment validation retry path
4. add loop-risk counters or derived loop-risk policy
5. add route audit event storage
6. add test harness for route behavior

---

## 7.5 Phase 4 — Interpretation & Extraction Layer

**Status:** Complete / current v1.4

Completed v8.0 updates:

1. preserved semantic delta contract
2. added route-relevant runtime-only signal candidates
3. prevented LLM-owned route state
4. prevented LLM-owned route outcome
5. clarified route hints are not route decisions
6. aligned extractor with Phase 3 route planning and Phase 5 memory/current truth

Future implementation work:

1. implement route episode signal extraction
2. evaluate signal precision/recall
3. add examples for route switch, deferral, confirmation, detour, loop risk, combined validation
4. test over-promotion resistance
5. add multilingual extraction considerations later

---

## 7.6 Phase 5 — Student Memory & Counseling State

**Status:** Complete / current v1.1

Completed v8.0 updates:

1. added `route_outcome` memory category
2. added `RouteOutcomeMemoryPayload`
3. added route-aware `CurrentTruthProjection`
4. clarified active route episode is not durable memory
5. clarified route start is audit/runtime by default
6. added accepted fallback handling
7. added route deferral, switch, and handoff outcome projection
8. preserved official CRM/application truth separation

Future implementation work:

1. implement `MemoryEventStore`
2. implement `AuditEventStore`
3. implement `MemoryStateService`
4. implement `MemoryIngestionPolicy`
5. implement `MemoryEventValidator`
6. implement `CurrentTruthProjector`
7. implement route outcome memory event validation
8. handle correction/contradiction/preference changes later

---

## 7.7 Phase 6 — Business Knowledge & Source Governance

**Status:** Next active exploration candidate

Phase 6 should design governed knowledge access for factual counseling answers.

It should answer:

```text
How should the AI access course, university, pathway, fee, intake, scholarship,
eligibility, and business knowledge without hallucinating, using stale data, or
confusing counseling guidance with official commitments?
```

Phase 6 should consume:

1. `CurrentTruthProjection`
2. active route episode
3. boundary result
4. selected skill
5. knowledge need signal
6. student route context
7. answerability requirement
8. source authority policy

Phase 6 should define:

1. source categories
2. source authority hierarchy
3. internal vs public knowledge separation
4. answerability contract
5. freshness policy
6. conflict handling
7. uncertainty/caveat behavior
8. knowledge gateway input/output schema
9. citation/source traceability
10. integration with validation pipeline

Important v8.0 route implication:

```text
Knowledge answers should support the active route or detour.
A factual detour should not replace the active route unless it reveals boundary,
student-led route switch, valid route outcome, or hard constraint.
```

---

## 7.8 Phase 7 — Recommendation & Decision Support

**Status:** Future exploration

Phase 7 should design recommendation behavior under the Route Episode model.

It should answer:

```text
How should the platform recommend courses, universities, pathways, and combined
options in a route-aware, evidence-backed, counselor-like, non-official way?
```

Phase 7 should define:

1. directional vs high-quality recommendation criteria
2. route-specific recommendation readiness
3. recommendation assumptions
4. recommendation confidence
5. comparison and shortlist behavior
6. accepted fallback behavior
7. decision-support micro-loop policy
8. recommendation lifecycle memory
9. recommendation validation rules
10. recommendation evaluation labels

Important v8.0 route implication:

```text
Recommendation presented does not complete a route.
Shortlist only does not complete a route.
Route completion requires valid route outcome evidence.
```

---

## 7.9 Phase 8 — Registration Boundary & Human Handoff

**Status:** Future exploration

Phase 8 should design the official-action boundary and human handoff package.

It should answer:

```text
How should the system detect registration/application readiness, stop autonomous
handling, summarize counseling context, and prepare safe human handoff without
claiming official action?
```

Phase 8 should define:

1. handoff trigger taxonomy
2. handoff-safe response patterns
3. handoff context package
4. handoff readiness memory
5. route outcome handoff interaction
6. human request handling
7. official-action blocking
8. handoff queue/interface requirements
9. post-handoff state behavior
10. evaluation for under-handoff and over-handoff

Route implication:

```text
Boundary override always wins over active route.
Red-zone signals may produce handoff_preparation + handoff progress state.
Handoff_required may become route_outcome memory after validation.
```

---

## 7.10 Phase 9 — CRM Integration

**Status:** Future exploration

Phase 9 should design read/write CRM boundaries.

It should answer:

```text
How should counseling memory and official CRM/application truth interact without
allowing autonomous counseling memory to become official business state?
```

First version should likely be read-only CRM reference.

Phase 9 should define:

1. CRM reference model
2. read-only official status adapter
3. write boundary and approval rules
4. human-owned write operations
5. official status display policy
6. conflict between counseling memory and CRM truth
7. audit trail
8. permission model
9. data privacy boundary
10. eventual CRM write workflow, if allowed

Locked v8.0 boundary:

```text
Counseling memory must not create, update, project, or overwrite official CRM status.
```

---

## 7.11 Phase 10 — Guardrails & Policy Engine

**Status:** Future exploration

Phase 10 should formalize platform-wide safety and policy enforcement.

It should cover:

1. no official action policy
2. preference promotion policy
3. route outcome policy
4. route transition policy
5. memory commit policy
6. boundary override policy
7. knowledge answerability policy
8. sensitive context policy
9. retry/fallback policy
10. audit requirements

Route implication:

```text
Route validators should be part of guardrail enforcement, not skill metadata.
```

---

## 7.12 Phase 11 — Evaluation & Observability

**Status:** Future exploration

Phase 11 should define evaluation labels, test sets, metrics, and observability.

New v8.0 evaluation focus:

1. route selection accuracy
2. route continuation correctness
3. route switch precision
4. route switch recall
5. premature route completion rate
6. missed route completion rate
7. L3 over-promotion rate
8. shortlist over-promotion rate
9. detour resume success rate
10. boundary override recall
11. handoff miss rate
12. memory commit accuracy
13. counselor-like flow quality
14. mechanical intake rate
15. response retry rate
16. route audit completeness

First route-specific evaluation scenarios:

1. no course/no university → course exploration
2. course known/no university → university exploration
3. university known/no course → course exploration within university context
4. course + university known → combined option validation
5. weak interest does not complete route
6. L3 expressed preference does not complete route
7. shortlist-only does not complete route
8. explicit confirmed course preference completes course route
9. accepted fallback does not become L4 unless confirmed
10. deferral produces route outcome
11. factual detour resumes active route
12. apply/register intent overrides route
13. student-led route switch is accepted with evidence
14. route switch without evidence is rejected
15. invalid route outcome memory is rejected

---

## 7.13 Phase 12 — Prototype / Production Hardening

**Status:** Future implementation alignment

Phase 12 should convert the approved specs into a working prototype and later production-hardening plan.

v8.0 prototype priorities:

1. replace legacy journey-state routing with Route Episode contracts
2. implement `RouteType`, `RouteProgressState`, and `RouteOutcome`
3. implement `CurrentTruthProjection` shape
4. implement `RouteEpisodeCandidateResolver`
5. implement `BoundaryResolver` override before final planner
6. implement `RouteEpisodePlanner`
7. implement `ActiveRouteEpisodeContext`
8. implement `RouteTransitionDecision`
9. implement route validators
10. update skill metadata fixtures
11. add route outcome memory events
12. add route audit events
13. add route-alignment tests
14. preserve existing official-action safety tests
15. preserve provider JSON validation and safe fallback behavior

Do not implement yet:

1. multi-route goal graph
2. durable route episode store
3. full route analytics dashboard
4. production recommendation scoring
5. CRM write integration
6. complex route optimization engine
7. heavy route outcome skill metadata

---

## 8. Updated Architecture Ownership Map

| Concern | Owner |
|---|---|
| Student natural language understanding | `AISemanticDeltaExtractor`, validated by `SemanticDeltaValidator` |
| Fast obvious boundary detection | `FastBoundarySignalScanner` |
| Durable counseling memory | `MemoryStateService` + `MemoryEventValidator` |
| Current truth | `CurrentTruthProjector` |
| Candidate route | `RouteEpisodeCandidateResolver` |
| Final boundary zone | `BoundaryResolver` |
| Active route episode | `RouteEpisodePlanner` |
| Progress state | `RouteEpisodePlanner` |
| Route transition | `RouteEpisodePlanner` + `RouteTransitionValidator` |
| Route outcome | `RouteOutcomeValidator` |
| Skill selection | `SkillControlService` |
| Skill guidance | Approved `SKILL.md` packages |
| Knowledge facts | `KnowledgeGateway` |
| Counseling response | `AIExecutionClient`, constrained by execution context |
| Response validation | `ValidationPipeline` |
| Memory commit | `MemoryStateService` |
| Official-action blocking | `BoundaryResolver`, `ValidationPipeline`, `MemoryEventValidator` |
| Audit | `AuditEventStore` |
| CRM truth | Future CRM system / external official source |

---

## 9. Migration From v7.4 to v8.0

### Replace Terms

| v7.4 Term | v8.0 Replacement |
|---|---|
| `minimum_profile_route` | `activeRouteEpisode.routeType` |
| `current_main_state` as primary state | `activeRouteEpisode.progressState` |
| global S1-S9 runtime state | migration reference only |
| S2 Minimum Profile Reached | route-readiness/current-truth checkpoint |
| `overlay_state` for detour | `RouteDetourOverlay` |
| `resume_target_state` | `resumeRouteCandidate` / detour resume fields |
| skill `allowed_memory_outputs` | MemoryStateService / audit only during migration |
| skill `forbidden_memory_outputs` | BoundaryResolver / ValidationPipeline / MemoryEventValidator |
| skill route exit rules | RouteTransitionPolicy / RouteOutcomeValidator |
| skill loop controls | RouteEpisodePlanner / DecisionSupportPolicy |

### Migration Rule

```text
Do not migrate by merely renaming old journey states.
Migrate by replacing the runtime control model with ActiveRouteEpisode + RouteProgressState + RouteOutcome.
```

---

## 10. Current Implementation Priority

The next practical implementation sequence should be:

```text
1. Update shared route enums and contracts
2. Update CurrentTruthProjection shape
3. Implement route outcome memory category minimally
4. Add RouteEpisodeCandidateResolver
5. Add BoundaryResolver integration point before final planner
6. Add RouteEpisodePlanner
7. Replace minimum_profile_route in OperatingContext
8. Update SkillControlService filtering for active routes and progress states
9. Add RouteOutcomeValidator and RouteTransitionValidator
10. Add ResponseRouteAlignmentValidator
11. Add route audit events
12. Update tests
13. Update prototype fixtures and skill metadata
```

The implementation should be prototype-first and contract-driven.

---

## 11. Prototype vNext Acceptance Criteria

The next prototype should pass at least these route-specific behaviors:

### Route Derivation

```text
1. no course/no university → course_exploration
2. course known/no university → university_exploration
3. university known/no course → course_exploration_within_university_context
4. pathway uncertainty dominant → pathway_exploration
5. course + university known → combined_option_validation
```

### Non-Completion

```text
6. weak interest does not complete route
7. L3 expressed preference does not complete route
8. shortlist-only does not complete route
9. recommendation-presented-only does not complete route
10. budget/location/ranking collected only does not complete route
```

### Valid Outcomes

```text
11. explicit confirmed course preference completes course route
12. accepted fallback creates accepted_fallback, not L4 by default
13. explicit deferral creates deferred_decision
14. student-led switch changes active route only with evidence
15. handoff_required overrides active route
```

### Detour / Resume

```text
16. factual detour answers then resumes active route
17. preference-revealing detour updates context but resumes route
18. boundary detour overrides route
```

### Safety

```text
19. apply/register/pay/reserve-seat intent triggers red-zone handling
20. confirmed counseling preference never becomes official registration truth
21. invalid official-action AI output is blocked or rewritten
22. memory commit rejects official-action truth
```

### Audit

```text
23. route selected audit event written
24. route transition decision audit event written
25. route outcome accepted/rejected audit event written
26. route memory commit accepted/rejected audit event written
```

---

## 12. Major Open Questions for Later Phases

These are intentionally deferred:

1. Should route planning eventually use a policy DSL or remain code-first?
2. Should route outcome evidence requirements become configurable?
3. Should affordability/scholarship become an independent route later?
4. Should route analytics require storing route start/end audit events in a separate queryable store?
5. How should route loop-risk thresholds be tuned?
6. How should route episode behavior interact with future recommendation scoring?
7. How should handoff package structure represent route history?
8. How should CRM read-only official status affect route planning?
9. Should LangGraph own the route flow in production or only orchestrate node execution?
10. Should Deep Agents be used for complex recommendation or knowledge synthesis later?
11. What retention/privacy policy should apply to route outcome memory and audit records?
12. How should multilingual student messages affect semantic delta extraction and route signals?

---

## 13. Decisions Locked in Roadmap v8.0

```text
1. Route Episode is the primary runtime counseling-flow abstraction.
2. minimum_profile_route is replaced.
3. Old S1-S9 global journey states are deprecated as primary runtime states.
4. S2 Minimum Profile Reached is reclassified as route-readiness/current-truth checkpoint.
5. Only one active route episode exists at a time.
6. Detour is an overlay, not a route stack.
7. Route completion is outcome-based.
8. L3 expressed preference does not complete a route.
9. Shortlist-only does not complete a route.
10. Recommendation-presented-only does not complete a route.
11. Route episode is runtime-derived, not durable memory.
12. Route outcome may become durable counseling memory when validated.
13. CurrentTruthProjection derives route-relevant truth every turn.
14. RouteEpisodeCandidateResolver runs before BoundaryResolver.
15. RouteEpisodePlanner runs after BoundaryResolver.
16. Boundary override wins over route behavior.
17. SKILL.md metadata guides selection and behavior, not memory authorization.
18. Memory commit eligibility belongs to MemoryStateService / MemoryEventValidator.
19. Route outcome validity belongs to RouteOutcomeValidator.
20. Route transition validity belongs to RouteTransitionValidator.
21. Phase 4 may extract route-relevant signals but does not own route state.
22. Official CRM/application truth remains externally owned.
23. Prototype vNext should prove the route-episode vertical slice before adding complexity.
```

---

## 14. Recommended Next Step

The recommended next step is to generate a **Prototype Alignment Plan** for implementing v8.0.

Suggested file:

```text
prototype-route-episode-alignment-plan-v1.0.md
```

This document should translate the v8.0 roadmap into implementation tasks:

1. files/modules to update
2. contracts/enums to add
3. old fields to deprecate
4. test scenarios to add
5. migration from existing prototype state
6. failure behavior
7. rollout order
8. acceptance criteria

After that, continue exploration with Phase 6 — Business Knowledge & Source Governance, unless implementation alignment should happen first.
