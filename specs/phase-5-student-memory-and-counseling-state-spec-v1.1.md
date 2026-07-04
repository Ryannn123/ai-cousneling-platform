# Phase 5 — Student Memory & Counseling State Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 5 — Student Memory & Counseling State  
**Version:** 1.1  
**Date:** 2026-07-04  
**Status:** Updated specification, amended for Route Episode redesign  
**Source Context:** Phase 0 Bounded Autonomy Baseline v1.0, Phase 1 Autonomous Counseling Operating Model v1.3, Phase 2 Counseling SOP & Skill Control v1.2, Phase 3 Autonomous Runtime Strategy v1.2, Phase 4 Interpretation & Extraction Layer v1.3, Phase 5 Student Memory & Counseling State v1.0, Roadmap v7.4, Route Episode Redesign Exploration Roadmap v0.1, and Route Episode Redesign Decision Summary v1.0.

---

## 1. Purpose

This specification defines the **Phase 5 Student Memory & Counseling State** layer for the AI-first bounded autonomous counseling platform.

It answers the Phase 5 core question:

```text
How should accepted semantic memory deltas, validated counseling outcomes, and
route-episode milestones become durable student counseling memory, derived current
truth, history, and runtime-consumable state while preserving official-action
boundaries and runtime-only signal separation?
```

Phase 4 v1.3 produces validated semantic artifacts:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

Phase 4 does **not** create durable memory, current truth, CRM truth, application truth, registration truth, payment truth, seat truth, enrollment truth, or official status.

Phase 5 defines the controlled memory/state layer that consumes accepted memory deltas and validated counseling outputs, turns them into durable counseling memory events, and derives current truth for downstream runtime modules.

Version 1.1 updates Phase 5 to support the approved **Route Episode** redesign.

The old runtime framing was:

```text
Minimum profile reached
→ derive route from known/missing fields
→ use global journey state
```

The new operating model is:

```text
Active Route Episode
→ guide toward route-specific outcome
→ use reusable progress states inside the active route
→ move to next route only after valid route outcome, deferral, student-led switch,
  or boundary interruption
```

Phase 5 v1.1 therefore adds route-outcome memory and route-aware current truth projection, while keeping the active route episode itself runtime-derived.

Core Phase 5 v1.1 principle:

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

---

## 1.1 Version History Summary

### Version 1.0 — Memory and Current Truth Foundation

Version 1.0 established:

1. durable append-only `DurableMemoryEvent` records
2. `MemoryStateService` as the only memory commit boundary
3. `MemoryIngestionPolicy` and `MemoryEventValidator`
4. derived `CurrentTruthProjection`
5. separation between memory events, current truth, runtime-only context, audit records, and read-only CRM/application references
6. pre-response student-stated memory commit
7. post-response AI-produced output commit
8. official CRM/application truth separation
9. forward compatibility for correction, removal, contradiction, confidence changes, preference upgrades/downgrades, and stale replacement

### Version 1.1 — Route Episode Redesign Update

Version 1.1 adds:

1. `route_outcome` as a new durable memory category
2. `RouteOutcomeMemoryPayload`
3. route-aware `CurrentTruthProjection` fields
4. route completion, deferral, switch, fallback, boundary, and handoff history projection
5. explicit rule that active route episode is runtime-derived and not durable memory
6. explicit rule that route start/progress events are audit/runtime by default
7. projection rules for accepted fallback, deferred decision, student switch, confirmed route outcome, and handoff outcome
8. validation expectations for route outcome memory
9. route-outcome audit and evaluation requirements
10. alignment with Phase 1 v1.3 Route Episode operating model

---

## 2. Scope

Phase 5 v1.1 defines:

1. the durable student counseling memory model
2. the distinction between memory events, current truth, runtime-only context, route episode, audit records, and read-only CRM/application references
3. the `MemoryStateService` boundary
4. the `MemoryIngestionPolicy` contract
5. the `MemoryEventValidator` contract
6. the `MemoryEventStore` contract
7. the `AuditEventStore` contract
8. the `DurableMemoryEvent` envelope
9. typed durable memory payload categories
10. the new `route_outcome` memory category
11. commit timing for student-stated memory, AI-produced outputs, and route outcomes
12. current-truth derivation strategy
13. route-aware `CurrentTruthProjection` contract
14. route outcome projection rules
15. accepted fallback and deferral behavior
16. operation-aware merge semantics
17. v1 implementation slice using active `add_new` behavior
18. forward compatibility for correction, removal, contradiction, confidence changes, preference upgrades/downgrades, and stale replacement
19. risk-tiered failure behavior
20. official-truth separation
21. audit and evaluation requirements
22. validation and test strategy
23. decisions locked by Phase 5 v1.1
24. open questions deferred to later phases

---

## 3. Non-Goals

Phase 5 v1.1 does **not** define:

1. full physical database selection
2. production storage infrastructure
3. production data retention and deletion policy beyond placeholders
4. full privacy/compliance policy
5. full CRM integration implementation
6. writable CRM/application/registration/payment/enrollment workflows
7. business knowledge governance
8. final recommendation engine scoring
9. final human handoff workflow implementation
10. production evaluation dashboards
11. counselor operations UI
12. full correction/removal UX
13. full contradiction resolution UX
14. full confidence decay strategy
15. full stale-memory replacement automation
16. final LangGraph implementation node design
17. Deep Agents usage
18. final RouteEpisodePlanner implementation
19. final RouteTransitionValidator implementation
20. final RouteOutcomeValidator implementation
21. durable route episode store
22. multi-route goal graph
23. route analytics dashboard

Important boundary:

```text
Phase 5 designs the memory/state truth model and prototype-ready contracts.
It does not make counseling memory an official system of record.
It does not store active route episode as durable memory.
It does not own runtime route planning.
```

---

## 4. Inheritance From Approved Phases

---

## 4.1 Phase 0 Inheritance — Bounded Autonomy

Phase 5 inherits the Phase 0 autonomy baseline:

```text
Autonomy by default.
Conservative at boundaries.
```

Phase 5 must preserve the central boundary:

```text
Counseling decision does not equal official action.
```

The memory system may store counseling-side signals such as:

1. weak interest
2. expressed interest
3. expressed preference
4. rejected option
5. student concern
6. student constraint
7. recommendation reaction
8. deferral
9. confirmed counseling preference
10. accepted fallback
11. route outcome
12. readiness-to-register signal
13. handoff readiness context

The memory system must never create or imply official outcomes such as:

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

Phase 5 v1.1 must support the Phase 1 v1.3 Route Episode operating model.

The primary runtime model is no longer global S1–S9 journey state.

The primary model is:

```text
ActiveRouteEpisode + RouteProgressState + RouteOutcome
```

Phase 5 must support durable memory and current-truth projection for:

1. active route derivation
2. route-readiness checkpoints
3. route outcome history
4. route deferral history
5. route switch history
6. accepted fallback behavior
7. handoff readiness
8. recommendation readiness
9. preference strength
10. decision blockers

### Route Episode Boundary

Phase 5 must preserve this rule:

```text
Active route episode is runtime-derived.
Route outcome may become durable memory.
```

The following should not be durable memory by default:

1. active route episode
2. current route type
3. progress state
4. transition decision
5. next route candidate
6. resume route candidate
7. loop risk
8. route outcome candidate

The following may become durable memory when validated:

1. route outcome reached
2. route deferred
3. route switched
4. accepted fallback
5. confirmed counseling preference
6. handoff required

### Route Types

Phase 5 v1.1 must be compatible with:

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

### Route Outcomes

Phase 5 v1.1 must support:

```ts
type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";
```

### Non-Completion Rules

Phase 5 projection and memory validation must not treat these as completed route outcomes:

1. weak interest
2. expressed interest
3. L3 expressed preference
4. shortlist-only
5. recommendation-presented-only
6. comparison in progress
7. unresolved comparison
8. budget/location/ranking collected only
9. student still exploring

L3 expressed preference may influence current truth and recommendation behavior, but it must not become route completion.

---

## 4.3 Phase 2 Inheritance — Skill Control

Phase 5 provides validated memory-derived context to downstream skill selection, prompt composition, validation, and audit.

Phase 5 v1.1 updates the older Phase 2 assumption that skill metadata directly authorizes memory writes.

The revised ownership is:

```text
SKILL.md metadata guides behavior and selection.
MemoryStateService and MemoryEventValidator own memory commit eligibility.
RouteOutcomeValidator owns route outcome validity.
BoundaryResolver and ValidationPipeline own official-action blocking.
```

Skill metadata may still be stored in memory/audit event source fields for traceability:

1. skill name
2. skill version
3. skill hash
4. selected skill reason
5. selected skill artifact type

But skill metadata should not be the final memory authorization layer.

---

## 4.4 Phase 3 Inheritance — Runtime Strategy

Phase 5 preserves the Phase 3 runtime principle:

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

Phase 5 refines this principle for memory:

```text
AI may propose semantic deltas through Phase 4.
Phase 4 validates semantic artifacts.
Phase 5 validates memory commit eligibility.
Only validated DurableMemoryEvents append to MemoryEventStore.
```

The route-episode-compatible runtime dependency chain is:

```text
Student message
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

Phase 5 owns only the memory/current-truth portions of this chain.

---

## 4.5 Phase 4 v1.3 Inheritance — Semantic Delta Contract

Phase 5 consumes:

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

Phase 5 must preserve the Phase 4 v1.3 distinction:

```text
acceptedMemoryDeltas may become memory candidates.
acceptedRuntimeOnlySignals affect current-turn behavior by default.
rejected/downgraded candidates belong to audit/evaluation.
```

Runtime-only signals include:

1. boundary
2. knowledge need
3. student posture
4. ambiguity
5. current-turn control signals

Runtime-only signals do not become durable memory by default.

---

## 5. Core Phase 5 Design Direction

Phase 5 uses a **hybrid memory truth model**:

```text
DurableMemoryEvents are the source of counseling memory truth.
CurrentTruthProjection is a deterministic derived view.
Runtime operating context and route episode are derived from current truth and current-turn artifacts.
```

The locked model is:

```text
AcceptedSemanticDelta
→ MemoryStateService
→ MemoryIngestionPolicy
→ MemoryEventValidator
→ MemoryEventStore
→ CurrentTruthProjector
→ CurrentTruthProjection
→ RouteEpisodeCandidateResolver / BoundaryResolver / OperatingContextManager / SkillControlService
```

Route episode is not part of the durable memory model.

Route outcome is part of the durable memory model.

---

## 6. Conceptual Memory Layers

Phase 5 separates memory into six conceptual layers:

```text
1. Durable memory events
2. Current truth projection
3. Route outcome history projection
4. Runtime-only turn context
5. Audit/evaluation records
6. Read-only CRM/application references
```

Only two of these are durable Phase 5 stores:

```text
1. MemoryEventStore
2. AuditEventStore
```

The rest are derived or fetched per turn.

---

## 6.1 Durable Memory Events

Durable memory events are append-only evidence-backed counseling memory records.

They represent what the platform has safely committed about the student's counseling journey.

Examples:

1. student stated academic result
2. student is considering a course
3. student prefers a university
4. student confirmed a counseling preference
5. student rejected an option
6. student stated a hard constraint
7. student expressed a concern
8. student reacted to a recommendation
9. student accepted a fallback option
10. student deferred a route decision
11. student switched route
12. student reached handoff readiness

---

## 6.2 Current Truth Projection

`CurrentTruthProjection` is a derived per-turn runtime view.

It is not a durable store and not a mutable student profile.

It derives:

1. academic result status
2. course direction status
3. university direction status
4. pathway direction status
5. route-readiness checkpoints
6. active directions
7. preference strength
8. recommendation readiness
9. hard constraints
10. soft preferences
11. current decision blockers
12. handoff readiness context
13. latest route outcomes
14. route deferral history
15. route switch history
16. route loop-risk hints
17. next route candidate hints
18. resume route candidate hints

It must be rebuildable from `MemoryEventStore`.

---

## 6.3 Route Outcome History Projection

Route outcome history is a derived sub-view inside `CurrentTruthProjection`.

It is derived from durable `route_outcome` memory events and related domain memory.

It should answer:

1. Which route outcomes have already occurred?
2. Which route was deferred and why?
3. Which route was switched away from?
4. Which fallback was accepted?
5. Which route outcome was blocked by boundary?
6. Which handoff route outcome occurred?
7. Which route may be safe to resume?
8. Which route should not be repeated too soon?

It should not answer:

1. What is the active route this turn?
2. What is the current progress state?
3. What route should the AI definitely transition to?

Those are runtime planning decisions.

---

## 6.4 Runtime-Only Turn Context

Runtime-only turn context is assembled per turn from:

1. accepted runtime-only signals
2. current truth projection
3. route episode candidate
4. boundary result
5. operating context
6. selected skill
7. knowledge need
8. student posture
9. ambiguity signal

It is not durable memory by default.

Examples:

```text
student_posture = lost_or_confused
knowledge_need = fee_question
ambiguity = ambiguous_proceed_language
activeRouteEpisode = course_exploration
progressState = comparison
counselor_response_mode = decision_support
```

---

## 6.5 Audit/Evaluation Records

Audit records explain platform behavior.

They include:

1. rejected semantic candidates
2. downgraded candidates
3. validation events
4. blocked official-action outputs
5. boundary decisions
6. route candidate decisions
7. route transition decisions
8. route outcome acceptance/rejection
9. memory ingestion decisions
10. memory validation failures
11. response validation failures
12. retry attempts
13. selected skill/version/hash
14. route memory commit decisions

Audit records do not become current truth or ordinary student memory.

---

## 6.6 Read-Only CRM/Application References

Official CRM/application statuses remain externally owned.

Phase 5 may define future compatibility for read-only references, but it does not store or mutate official CRM/application truth.

Allowed future behavior:

```text
CRM/application status may be read as external context through a future adapter.
```

Forbidden behavior:

```text
Counseling memory must not create, update, project, or overwrite official CRM status.
```

---

## 7. Durable Storage Boundary

Phase 5 durably stores only:

```text
1. MemoryEventStore
2. AuditEventStore
```

Phase 5 does **not** create durable stores for:

```text
CurrentTruthProjectionStore
RuntimeTurnContextStore
ActiveRouteEpisodeStore
RouteProgressStateStore
CRMReferenceView
```

Rationale:

```text
Current truth is derived every turn.
Runtime turn context is assembled every turn.
Active route episode is derived every turn.
Route progress state is derived every turn.
CRM/application status is externally owned and read-only in future phases.
```

A projection cache may be added later for performance, but it must remain non-authoritative and rebuildable.

---

## 8. DurableMemoryEvent Contract

Phase 5 uses a common event envelope with typed domain payloads.

Principle:

```text
Every durable memory event carries the same safety/audit envelope.
The payload is typed according to memory category.
```

```ts
type DurableMemoryEvent = {
  eventId: string;
  studentId: string;
  conversationId: string;
  turnId: string;
  messageId: string;

  category: MemoryCategory;
  operation: MemoryOperation;
  payload: TypedMemoryPayload;

  confidence: "low" | "medium" | "high";
  evidence: EvidenceSpan[];

  source: {
    acceptedSemanticDeltaId?: string;
    acceptedDeltaId?: string;
    routeTransitionDecisionId?: string;
    routeOutcomeValidationId?: string;
    aiExecutionResultId?: string;
    skillName?: string;
    skillVersion?: string;
    skillHash?: string;
    validatorVersion: string;
  };

  merge: {
    projectionIntent: ProjectionIntent;
    relatedEventIds?: string[];
    supersedesEventIds?: string[];
    contradictionEventIds?: string[];
  };

  officialTruthBoundary: {
    isOfficialTruth: false;
    crmReferenceId?: string;
    crmReferenceMode?: "read_only";
  };

  createdAt: string;
};
```

---

## 8.1 EvidenceSpan

```ts
type EvidenceSpan = {
  quote?: string;
  source:
    | "student_message"
    | "conversation_context"
    | "validated_ai_output"
    | "route_transition_decision"
    | "boundary_result"
    | "route_outcome_validator";
  messageId?: string;
  turnId?: string;
  confidence?: "low" | "medium" | "high";
};
```

Evidence must be explicit enough for the category and operation.

Example:

```text
"Psychology sounds interesting"
```

is enough for:

```text
CourseDirectionMemory.status = considering
```

but not enough for:

```text
CounselingPreferenceMemory.confirmed_counseling_preference
RouteOutcomeMemory.outcome = confirmed_preference
```

---

## 8.2 MemoryCategory

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

The new category in v1.1 is:

```text
route_outcome
```

---

## 8.3 MemoryOperation

Phase 5 v1.1 executes only `add_new`, but the contract reserves future operations.

```ts
type MemoryOperation =
  | "add_new"
  | "correction"
  | "removal"
  | "contradiction"
  | "confidence_change"
  | "preference_upgrade"
  | "preference_downgrade"
  | "stale_memory_replacement";
```

v1.1 active operation:

```text
add_new
```

Reserved operations should be detected/audited when possible and handled conservatively.

---

## 8.4 ProjectionIntent

```ts
type ProjectionIntent =
  | "may_update_current_truth"
  | "history_only"
  | "requires_clarification_before_projection"
  | "audit_only_no_projection";
```

`MemoryIngestionPolicy` assigns projection intent. `CurrentTruthProjector` decides the final derived current truth.

Route outcome examples:

```text
confirmed_preference
→ may_update_current_truth

accepted_fallback
→ may_update_current_truth as fallback/working direction, not L4 confirmation

deferred_decision
→ may_update_current_truth for route deferral/resume context

student_switched_route
→ history_only or may_update_current_truth depending on next route evidence

blocked_by_boundary / handoff_required
→ may_update_current_truth for handoff readiness, not official action
```

---

## 9. Durable Memory Categories

Phase 5 defines stable domain-level durable memory categories with typed payloads.

---

## 9.1 AcademicMemory

Stores student-stated academic background.

Examples:

1. SPM credits
2. A-Level results
3. diploma CGPA
4. failed subject
5. unclear academic result
6. international qualification statement

Projection derives:

1. `academic_result_status`
2. `latest_usable_academic_result`
3. `academic_uncertainty`

Academic memory must never become official eligibility approval.

---

## 9.2 CourseDirectionMemory

Stores course/program direction signals.

Examples:

1. considering Psychology
2. interested in Business
3. prefers Computer Science
4. comparing Psychology and Business
5. accepted Business as fallback course

Projection derives:

1. `course_direction_status`
2. `active_course_direction`
3. course-side preference strength
4. course fallback or working option

---

## 9.3 UniversityDirectionMemory

Stores university direction signals.

Examples:

1. considering Sunway
2. prefers Taylor's
3. interested in universities around KL
4. comparing two universities
5. accepted one university as fallback

Projection derives:

1. `university_direction_status`
2. `active_university_direction`
3. university-side preference strength
4. university fallback or working option

---

## 9.4 PathwayDirectionMemory

Stores pathway direction signals.

Examples:

1. considering foundation
2. prefers diploma
3. unsure between foundation and degree
4. wants a transfer pathway
5. accepted foundation as fallback pathway

Projection derives:

1. `pathway_direction_status`
2. `active_pathway_direction`
3. pathway comparison context
4. pathway fallback or working option

---

## 9.5 CounselingPreferenceMemory

Stores explicit confirmed counseling preferences.

Examples:

1. confirmed counseling course preference
2. confirmed counseling university preference
3. confirmed counseling pathway preference
4. confirmed combined option

This category is separate from direction memory because confirmed counseling preference is high-impact.

Boundary:

```text
CounselingPreferenceMemory means counseling preference only.
It must never mean application submitted, registration completed, payment confirmed,
seat reserved, enrollment confirmed, or CRM status updated.
```

Projection derives:

1. `confirmed_counseling_preference`
2. `preference_strength = L4`
3. milestone confirmation context
4. route outcome compatibility

Relationship to route outcome:

```text
confirmed counseling preference may coexist with RouteOutcomeMemory.confirmed_preference.
CounselingPreferenceMemory says what the student confirmed.
RouteOutcomeMemory says what happened to the route.
```

---

## 9.6 RouteOutcomeMemory

Stores meaningful route lifecycle milestones.

This is new in Phase 5 v1.1.

It exists because route outcome is not the same thing as course preference, university preference, decision support, or handoff readiness.

It explains:

```text
Why did the active route complete, pause, switch, block, or hand off?
```

### Payload

```ts
type RouteOutcomeMemoryPayload = {
  routeType: RouteType;
  outcome: RouteOutcome;

  outcomeTarget?: {
    courseOrProgram?: string;
    university?: string;
    pathway?: string;
    combinedOption?: string;
  };

  previousRoute?: RouteType;
  nextRouteCandidate?: RouteType;
  resumeRouteCandidate?: RouteType;

  outcomeReason:
    | "student_confirmed"
    | "student_accepted_fallback"
    | "student_deferred"
    | "student_switched_route"
    | "boundary_interrupted"
    | "handoff_required"
    | "validated_loop_risk";

  routeCompletionStatus:
    | "completed"
    | "deferred"
    | "switched"
    | "blocked"
    | "handoff";

  routeProgressAtOutcome?: RouteProgressState;

  routeEvidenceSummary?: string;
};
```

### Valid Outcomes

```ts
type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";
```

### Route Outcome Examples

```yaml
category: route_outcome
payload:
  routeType: course_exploration
  outcome: confirmed_preference
  outcomeTarget:
    courseOrProgram: Psychology
  outcomeReason: student_confirmed
  routeCompletionStatus: completed
```

```yaml
category: route_outcome
payload:
  routeType: university_exploration
  outcome: deferred_decision
  outcomeReason: student_deferred
  routeCompletionStatus: deferred
  resumeRouteCandidate: university_exploration
```

```yaml
category: route_outcome
payload:
  routeType: course_exploration
  outcome: student_switched_route
  previousRoute: course_exploration
  nextRouteCandidate: university_exploration
  outcomeReason: student_switched_route
  routeCompletionStatus: switched
```

### Boundary

RouteOutcomeMemory is counseling memory only.

It cannot imply:

1. application submitted
2. registration completed
3. payment confirmed
4. enrollment confirmed
5. seat reserved
6. CRM updated
7. eligibility approved
8. scholarship approved
9. exception approved
10. official document submitted

### Route Start Rule

Route start is not durable memory by default.

```text
route_started → audit/runtime by default
route_outcome_reached → durable memory if counseling-significant
```

---

## 9.7 RejectedOptionMemory

Stores rejected or deprioritized options.

Examples:

1. not interested in Accounting
2. does not want a far campus
3. rejects expensive universities
4. does not want foundation

Projection uses rejected options to suppress unsuitable recommendations unless the student later reconsiders.

---

## 9.8 ConstraintMemory

Stores hard constraints and strong filters.

Examples:

1. can only study in KL
2. maximum budget is fixed
3. must start in September intake
4. needs part-time study mode
5. family requires nearby campus

Projection derives:

1. `hard_constraints`
2. recommendation filters
3. decision-critical missing information

Hard constraints must require stronger evidence than soft preferences.

---

## 9.9 QualityContextMemory

Stores softer personalization signals.

Examples:

1. prefers budget/value
2. likes ranking/prestige
3. prefers city campus
4. career goal
5. family influence
6. intake preference
7. study mode preference

Projection derives:

1. `soft_preferences`
2. `quality_context_summary`
3. high-quality recommendation fit signals

Quality context improves counseling quality but should not block routing unless promoted into a hard constraint by evidence.

---

## 9.10 ConcernOrBlockerMemory

Stores worries, blockers, hesitation, confusion, and decision friction.

Examples:

1. worried about job prospects
2. unsure what course fits
3. afraid Business is too general
4. parents disagree
5. needs more time

Projection derives:

1. `current_decision_blockers`
2. deferral/indecision context
3. decision-support mode candidates
4. route deferral explanation

This category supports counseling continuity.

---

## 9.11 DecisionSupportMemory

Stores structured decision-support outcomes.

Examples:

1. student prioritizes affordability over ranking
2. student narrowed options to top 2
3. student wants Psychology vs Business comparison
4. student keeps cycling between options
5. decision support was attempted for a route

Projection derives:

1. comparison context
2. shortlist context
3. tradeoff priority
4. deadlock/loop risk hints
5. decision-support history by route

---

## 9.12 RecommendationInteractionMemory

Stores recommendation lifecycle signals.

Examples:

1. recommendation shown
2. recommendation assumptions
3. recommendation confidence
4. student liked recommendation
5. student rejected recommendation
6. student asked for alternative

AI-produced recommendation records commit only after response validation.

Projection derives:

1. latest recommendation interaction
2. recommendation reaction
3. whether to refine, compare, or confirm
4. route progress hints such as `recommendation_presented`

Recommendation shown alone must not complete a route.

---

## 9.13 HandoffReadinessMemory

Stores counseling-side readiness and handoff context.

Examples:

1. student wants to apply now
2. student asks for human counselor
3. student is ready for official next step
4. handoff required
5. handoff reason
6. safe handoff summary

Boundary:

```text
HandoffReadinessMemory can say “student is ready for handoff.”
It cannot say “application submitted” or “registration completed.”
```

Projection derives:

1. `handoff_readiness_context`
2. `handoff_trigger_type`
3. `handoff_required`
4. `handoff_summary_candidate`

Relationship to route outcome:

```text
handoff_required route outcome may coexist with HandoffReadinessMemory.
RouteOutcomeMemory says the route ended through handoff.
HandoffReadinessMemory says why handoff is needed and what context should be passed.
```

---

## 10. Route Outcome Memory Rules

---

## 10.1 Active Route Episode Is Not Durable Memory

The following must not be stored as durable memory by default:

```text
activeRouteEpisode = course_exploration
progressState = comparison
nextRouteCandidate = university_exploration
loopRisk = medium
```

Those are runtime/projection facts.

They may be recorded in audit for traceability.

---

## 10.2 Route Outcome Is Durable When Meaningful

The following may be durable memory:

```text
course_exploration completed with confirmed_preference
university_exploration deferred_decision
pathway_exploration accepted_fallback
course_exploration student_switched_route
combined_option_validation handoff_required
```

Reason:

```text
These are meaningful counseling history and influence future route planning.
```

---

## 10.3 Route Start Is Audit-Only By Default

Do not store `route_started` as durable student memory by default.

Route start is a platform planning decision, not necessarily something the student stated.

Preferred handling:

```text
route_started → AuditEventStore
route_outcome_reached → MemoryEventStore, if validated and counseling-significant
```

---

## 10.4 Confirmed Preference Outcome

When a route completes with `confirmed_preference`, Phase 5 may create both:

```text
CounselingPreferenceMemory
RouteOutcomeMemory
```

Example:

```text
Student: Yes, Psychology is my choice for now.
```

Possible memory events:

```yaml
category: counseling_preference
payload:
  preferenceType: course
  courseOrProgram: Psychology
  status: confirmed_counseling_preference
```

```yaml
category: route_outcome
payload:
  routeType: course_exploration
  outcome: confirmed_preference
  outcomeTarget:
    courseOrProgram: Psychology
  outcomeReason: student_confirmed
  routeCompletionStatus: completed
```

The first says what the student confirmed.

The second says what happened to the route.

---

## 10.5 Accepted Fallback Outcome

Accepted fallback is not automatically L4 confirmed counseling preference.

Example:

```text
Student: Okay, let's keep Business as backup.
```

Possible memory events:

```yaml
category: route_outcome
payload:
  routeType: course_exploration
  outcome: accepted_fallback
  outcomeTarget:
    courseOrProgram: Business
  outcomeReason: student_accepted_fallback
  routeCompletionStatus: completed
```

and optionally:

```yaml
category: course_direction
payload:
  courseOrProgram: Business
  status: fallback_or_working_option
```

Do not create `CounselingPreferenceMemory` unless the student clearly confirms it as their chosen counseling direction.

---

## 10.6 Deferred Decision Outcome

Route deferral should create `RouteOutcomeMemory` when explicit or validated.

Example:

```text
Student: I need to ask my parents first.
```

Possible memory events:

```yaml
category: route_outcome
payload:
  routeType: university_exploration
  outcome: deferred_decision
  outcomeReason: student_deferred
  routeCompletionStatus: deferred
  resumeRouteCandidate: university_exploration
```

If a reason is given, also create supporting memory:

```yaml
category: concern_or_blocker
payload:
  blockerType: parent_discussion_needed
  description: needs to ask parents before university decision
```

or:

```yaml
category: decision_support
payload:
  decisionPoint: university_selection
  status: deferred_after_decision_support
```

---

## 10.7 Student Switched Route Outcome

Student-led route switch may create `RouteOutcomeMemory`.

Example:

```text
Student: Actually, I already know I want Psychology. Help me choose university.
```

Possible route outcome:

```yaml
category: route_outcome
payload:
  routeType: course_exploration
  outcome: student_switched_route
  previousRoute: course_exploration
  nextRouteCandidate: university_exploration
  outcomeReason: student_switched_route
  routeCompletionStatus: switched
```

The route planner may then derive `university_exploration` as next route candidate, but Phase 5 does not make the final active route decision.

---

## 10.8 Blocked By Boundary Outcome

If the route cannot safely continue because of boundary risk, Phase 5 may store:

```yaml
category: route_outcome
payload:
  routeType: combined_option_validation
  outcome: blocked_by_boundary
  outcomeReason: boundary_interrupted
  routeCompletionStatus: blocked
```

This may coexist with audit and handoff readiness records.

It must not imply official action has occurred.

---

## 10.9 Handoff Required Outcome

If red-zone handoff is required, Phase 5 may store:

```yaml
category: route_outcome
payload:
  routeType: handoff_preparation
  outcome: handoff_required
  outcomeReason: handoff_required
  routeCompletionStatus: handoff
```

and:

```yaml
category: handoff_readiness
payload:
  triggerType: ready_to_apply_or_register
  handoffRequired: true
  selectedOptionSummary: Psychology at University A
```

This means:

```text
student is ready for human handoff
```

not:

```text
application submitted
registration completed
payment confirmed
seat reserved
```

---

## 11. Commit Timing

Phase 5 supports two main commit windows and one route-specific commit source.

---

## 11.1 Pre-Response Student-Stated Memory Commit

Student-stated memory may commit before response generation when:

1. it comes from `AcceptedSemanticDelta.acceptedMemoryDeltas`
2. evidence is sufficient
3. `MemoryIngestionPolicy` accepts it
4. `MemoryEventValidator` validates it
5. official-truth boundary is preserved

Examples:

1. academic result stated
2. course being considered
3. university being considered
4. hard constraint stated
5. concern stated
6. weak/expressed preference stated

---

## 11.2 Post-Response AI-Produced Output Commit

AI-produced outputs commit only after:

1. AI response generation
2. response validation
3. route alignment validation
4. boundary validation
5. final response accepted for delivery
6. `MemoryStateService.commitPostResponseAIOutputs()` validation

Examples:

1. recommendation shown
2. recommendation confidence and assumptions
3. AI-generated summary checkpoint
4. AI-generated handoff summary
5. validated milestone confirmation output

If response validation fails and the system retries the response, pre-response memory commit must not be repeated.

---

## 11.3 Route Outcome Commit

Route outcome memory commits only after route outcome validation.

Possible sources:

1. student-stated route outcome detected from accepted semantic artifacts
2. route outcome candidate from RouteEpisodePlanner
3. validated AI-produced milestone output
4. boundary/handoff decision from BoundaryResolver and RouteEpisodePlanner
5. loop-risk/deferral policy accepted by RouteOutcomeValidator

Route outcome commit requires:

1. valid active or previous route context
2. valid `RouteOutcome`
3. evidence satisfying outcome requirement
4. no official-action violation
5. `RouteOutcomeValidator` acceptance
6. `MemoryEventValidator` acceptance

---

## 12. MemoryStateService

`MemoryStateService` is the only runtime boundary allowed to create durable counseling memory.

Responsibilities:

1. receive memory candidates
2. apply `MemoryIngestionPolicy`
3. call `MemoryEventValidator`
4. create `DurableMemoryEvent` records
5. append accepted events to `MemoryEventStore`
6. route rejected candidates to `AuditEventStore`
7. maintain official-truth separation
8. support current-truth projection
9. prevent duplicate memory commit during response retry
10. commit validated route outcome memory

Non-responsibilities:

1. final active route planning
2. final progress state planning
3. final boundary decision
4. skill selection
5. recommendation scoring
6. CRM/application mutation
7. official status derivation

---

## 13. MemoryIngestionPolicy

`MemoryIngestionPolicy` determines whether a candidate should become a durable memory event, audit-only record, or rejected candidate.

Inputs:

```ts
type MemoryIngestionPolicyInput = {
  candidate: MemoryCandidate;
  acceptedSemanticDelta?: AcceptedSemanticDelta;
  currentTruthProjection?: CurrentTruthProjection;
  routeOutcomeValidation?: RouteOutcomeValidationResult;
  boundaryResult?: BoundaryResult;
  sourceType:
    | "student_stated_pre_response"
    | "validated_ai_output_post_response"
    | "validated_route_outcome"
    | "boundary_or_handoff_decision";
};
```

Outputs:

```ts
type MemoryIngestionDecision = {
  decision:
    | "accept_as_memory"
    | "downgrade_then_accept"
    | "requires_clarification"
    | "audit_only"
    | "reject";

  category?: MemoryCategory;
  operation?: MemoryOperation;
  projectionIntent?: ProjectionIntent;
  reason: string;
  evidence: EvidenceSpan[];
};
```

---

## 13.1 Route Outcome Ingestion Rules

Route outcome memory may be accepted only if:

1. route type is known or inferable from accepted operating context
2. outcome is valid for the route
3. evidence is explicit enough
4. route outcome does not depend only on L1/L2/L3 weak preference
5. route outcome does not depend only on shortlist or recommendation shown
6. accepted fallback is not over-promoted to confirmed preference
7. handoff outcome does not imply official action completion
8. boundary override is respected

Invalid route outcome candidates should be audit-only or rejected.

---

## 14. MemoryEventValidator

`MemoryEventValidator` validates constructed `DurableMemoryEvent` objects before append.

Checks:

1. schema validity
2. category/payload compatibility
3. operation compatibility
4. evidence sufficiency
5. source traceability
6. confidence appropriateness
7. projection intent validity
8. official-truth boundary
9. duplicate event risk
10. route outcome validity, when category is `route_outcome`
11. no L3 over-promotion
12. no shortlist over-promotion
13. no official-action memory

Route-specific checks:

```text
RouteOutcomeMemory.confirmed_preference requires explicit confirmation evidence.
RouteOutcomeMemory.accepted_fallback requires explicit acceptance evidence.
RouteOutcomeMemory.deferred_decision requires explicit deferral or validated loop-risk evidence.
RouteOutcomeMemory.student_switched_route requires explicit student redirection evidence.
RouteOutcomeMemory.blocked_by_boundary requires boundary evidence.
RouteOutcomeMemory.handoff_required requires boundary/handoff evidence.
```

---

## 15. MemoryEventStore

`MemoryEventStore` is the durable append-only store for accepted memory events.

Properties:

1. append-only
2. evidence-backed
3. category typed
4. immutable after write, except future correction/supersession events
5. rebuildable into `CurrentTruthProjection`
6. separate from `AuditEventStore`
7. separate from CRM/application system of record

Minimum operations:

```ts
interface MemoryEventStore {
  append(event: DurableMemoryEvent): Promise<void>;
  listByStudent(studentId: string): Promise<DurableMemoryEvent[]>;
  listByConversation(conversationId: string): Promise<DurableMemoryEvent[]>;
  listByCategory(studentId: string, category: MemoryCategory): Promise<DurableMemoryEvent[]>;
}
```

---

## 16. AuditEventStore

`AuditEventStore` records platform behavior that should not become student memory.

Examples:

1. rejected semantic candidates
2. downgraded candidates
3. blocked official-action outputs
4. boundary decisions
5. route candidate decisions
6. route transition decisions
7. route outcome rejected
8. route outcome accepted
9. memory commit accepted
10. memory commit rejected
11. response validation failed
12. retry response without duplicate memory commit

Route-specific audit events:

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

Audit records explain behavior but do not become current truth.

---

## 17. CurrentTruthProjection Contract

`CurrentTruthProjection` is a derived per-turn view rebuilt from durable memory events and optionally enriched by accepted current-turn runtime artifacts.

```ts
type CurrentTruthProjection = {
  studentId: string;
  generatedAt: string;
  sourceMemoryEventIds: string[];

  academic: AcademicTruthProjection;
  course: CourseTruthProjection;
  university: UniversityTruthProjection;
  pathway: PathwayTruthProjection;

  activeDirections: ActiveDirectionProjection;
  preferenceStrength: PreferenceStrengthProjection;
  recommendationReadiness: RecommendationReadinessProjection;

  constraints: ConstraintProjection;
  qualityContext: QualityContextProjection;
  decisionBlockers: DecisionBlockerProjection;
  recommendationHistory: RecommendationHistoryProjection;
  handoffReadiness?: HandoffReadinessProjection;

  routeEpisodeProjection: RouteEpisodeProjection;

  officialTruthBoundary: {
    containsOfficialTruth: false;
    crmReferenceMode?: "none" | "read_only";
  };
};
```

---

## 17.1 RouteEpisodeProjection

`RouteEpisodeProjection` is a derived sub-view inside `CurrentTruthProjection`.

It does not decide final active route. It provides route-relevant truth to the runtime.

```ts
type RouteEpisodeProjection = {
  activeRouteCandidate?: RouteType;
  currentRouteGoalHint?: RouteGoal;

  latestRouteOutcomes: {
    courseExploration?: RouteOutcomeSummary;
    universityExploration?: RouteOutcomeSummary;
    courseWithinUniversityContext?: RouteOutcomeSummary;
    pathwayExploration?: RouteOutcomeSummary;
    combinedOptionValidation?: RouteOutcomeSummary;
    handoffPreparation?: RouteOutcomeSummary;
  };

  routeCompletionHistory: RouteOutcomeSummary[];
  routeDeferralHistory: RouteOutcomeSummary[];
  routeSwitchHistory: RouteSwitchSummary[];

  unresolvedRouteNeeds: {
    academicResult: boolean;
    courseDirection: boolean;
    universityDirection: boolean;
    pathwayDirection: boolean;
    combinedValidation: boolean;
  };

  routeLoopRiskHint?: {
    routeType: RouteType;
    riskLevel: "none" | "low" | "medium" | "high";
    reason?: string;
  };

  nextRouteCandidateHint?: RouteType;
  resumeRouteCandidateHint?: RouteType;
  reopenRouteCandidateHint?: RouteType;
};
```

---

## 17.2 RouteOutcomeSummary

```ts
type RouteOutcomeSummary = {
  routeType: RouteType;
  outcome: RouteOutcome;
  outcomeTarget?: {
    courseOrProgram?: string;
    university?: string;
    pathway?: string;
    combinedOption?: string;
  };
  routeCompletionStatus:
    | "completed"
    | "deferred"
    | "switched"
    | "blocked"
    | "handoff";
  occurredAt: string;
  sourceEventId: string;
  evidenceSummary?: string;
};
```

---

## 17.3 RouteSwitchSummary

```ts
type RouteSwitchSummary = {
  previousRoute: RouteType;
  nextRouteCandidate: RouteType;
  reason: string;
  occurredAt: string;
  sourceEventId: string;
};
```

---

## 18. Current Truth Derivation Rules

---

## 18.1 Academic Direction Derivation

Academic truth derives from `academic` memory.

Projection should derive:

1. academic result known/unknown
2. latest usable academic result
3. uncertainty
4. whether academic result blocks recommendation readiness

Academic memory must not become eligibility approval.

---

## 18.2 Course Direction Derivation

Course direction truth derives from:

1. course direction memory
2. counseling preference memory
3. route outcome memory where outcome target includes course
4. rejected option memory
5. accepted fallback memory

Projection should distinguish:

```text
unknown
considering_some_courses
preferred_course_exists
fallback_or_working_course_exists
confirmed_counseling_course_preference
```

---

## 18.3 University Direction Derivation

University direction truth derives from:

1. university direction memory
2. counseling preference memory
3. route outcome memory where outcome target includes university
4. rejected option memory
5. accepted fallback memory

Projection should distinguish:

```text
unknown
considering_some_universities
preferred_university_exists
fallback_or_working_university_exists
confirmed_counseling_university_preference
```

---

## 18.4 Pathway Direction Derivation

Pathway direction truth derives from:

1. pathway direction memory
2. counseling preference memory
3. route outcome memory where outcome target includes pathway
4. accepted fallback memory
5. rejected option memory

Projection should distinguish:

```text
unknown
considering_some_pathways
preferred_pathway_exists
fallback_or_working_pathway_exists
confirmed_counseling_pathway_preference
```

---

## 18.5 Preference Strength Derivation

Preference strength derives from memory evidence, not LLM-owned state.

```text
L1 weak interest
L2 expressed interest
L3 expressed preference
L4 confirmed counseling preference
L5 ready-to-register/apply intent
```

Rules:

1. weak language must not become L3 or L4
2. L3 expressed preference must not complete a route
3. L4 requires explicit confirmation
4. L5 is readiness/handoff signal, not official action
5. accepted fallback does not become L4 unless explicitly confirmed

---

## 18.6 Recommendation Readiness Derivation

Recommendation readiness derives from:

1. academic result status
2. course direction status
3. university direction status
4. pathway direction status
5. quality context
6. hard constraints
7. decision blockers
8. route outcome history

Levels:

```text
R1. Not Ready to Recommend
R2. Ready for Directional Recommendation
R3. Ready for High-Quality Recommendation
```

Important:

```text
Ranking/budget/location may improve R3 readiness.
They are not required for R2 directional recommendation.
```

---

## 18.7 Route Outcome Derivation

Route outcome history derives from `route_outcome` memory events.

Projection rules:

```text
RouteOutcomeMemory.confirmed_preference
→ latest route outcome for that route
→ routeCompletionHistory
→ may influence nextRouteCandidateHint
```

```text
RouteOutcomeMemory.deferred_decision
→ routeDeferralHistory
→ resumeRouteCandidateHint may point back to deferred route
```

```text
RouteOutcomeMemory.student_switched_route
→ routeSwitchHistory
→ nextRouteCandidateHint may point to requested route
```

```text
RouteOutcomeMemory.accepted_fallback
→ fallback/working direction if outcome target exists
→ not L4 confirmed preference by default
```

```text
RouteOutcomeMemory.blocked_by_boundary
→ boundary/handoff context
→ not official action
```

```text
RouteOutcomeMemory.handoff_required
→ handoffReadiness context
→ not application/registration truth
```

---

## 18.8 Active Route Candidate Hint Derivation

`CurrentTruthProjection` may include `activeRouteCandidate` as a hint, but final active route belongs to runtime planning.

Initial derivation hints:

```text
No academic result yet
→ initial_route_selection

Academic known + course unresolved + university unresolved
→ course_exploration

Academic known + course known + university unresolved
→ university_exploration

Academic known + university known + course unresolved
→ course_exploration_within_university_context

Academic known + pathway uncertainty dominant
→ pathway_exploration

Academic known + course known + university known
→ combined_option_validation

Red-zone/handoff memory or current-turn boundary signal
→ handoff_preparation hint
```

These are hints only.

`RouteEpisodePlanner` decides the final active route using boundary result, prior operating context, route transition policy, and current turn.

---

## 18.9 Route Outcome History Influence

Route outcome history should influence recommendation and route planning behavior.

Examples:

```text
Deferred course route
→ allow resume prompt later, do not repeatedly force course decision immediately.

Accepted fallback pathway
→ allow cautious recommendations around that pathway.

Confirmed course preference
→ university exploration should use that course as primary context.

Deferred university decision
→ avoid pressuring final university confirmation; offer comparison or resume summary.

Route switched from university to course
→ avoid forcing university-fit questions until course route is resolved.
```

Route outcome history should guide behavior, but not overrule current truth if the student later changes direction.

---

## 19. Projection and Merge Semantics

Phase 5 v1.1 still only executes `add_new` as the active operation.

However, current truth must derive a best-current view from event history.

Rules:

1. newer high-confidence confirmed preference outranks older weaker preference
2. explicit rejection suppresses recommendation unless later reconsidered
3. accepted fallback remains fallback/working option unless confirmed
4. deferral keeps route resumable but not completed as preference
5. student switch records history and may change next route candidate hint
6. handoff readiness remains active until handled or superseded by later governed workflow
7. official CRM/application references never derive from counseling memory

Future operations will handle correction, removal, contradiction, confidence changes, preference upgrades/downgrades, and stale replacement more explicitly.

---

## 20. Official-Truth Separation

Phase 5 must preserve this hard rule:

```text
Counseling memory may record preferences, recommendations, route outcomes,
deferrals, accepted fallback, handoff readiness, and decision support.

Counseling memory must never create application, registration, payment, enrollment,
seat, CRM, scholarship, eligibility, exception, or document-submission truth.
```

Every durable memory event includes:

```ts
officialTruthBoundary: {
  isOfficialTruth: false;
}
```

If an AI output, semantic delta, route outcome, or memory candidate implies official truth, `MemoryEventValidator` must reject it and `AuditEventStore` must record the blocked attempt.

---

## 21. Failure Behavior

---

## 21.1 Memory Candidate Ambiguous

If a memory candidate is ambiguous:

```text
Do not commit as durable memory.
Mark requires_clarification or audit_only.
Allow runtime to ask one targeted clarification if important.
```

---

## 21.2 Route Outcome Ambiguous

If route outcome is ambiguous:

```text
Do not commit RouteOutcomeMemory.
Audit route_outcome_rejected.
Continue active route or ask confirmation depending on runtime decision.
```

Example:

```text
Student: Psychology seems better.
```

Allowed:

```text
L3 expressed preference
```

Not allowed:

```text
RouteOutcomeMemory.confirmed_preference
```

---

## 21.3 Accepted Fallback Ambiguous

If fallback acceptance is unclear:

```text
Do not commit accepted_fallback route outcome.
Commit weaker direction/preference memory if evidence supports it.
Ask clarification if route decision depends on it.
```

---

## 21.4 Official-Action Attempt

If candidate memory implies official action:

```text
Reject memory event.
Record blocked official-action audit.
BoundaryResolver / ValidationPipeline handles handoff-safe response.
```

---

## 21.5 Response Retry

If response validation fails and runtime retries the response:

```text
Do not repeat pre-response student-stated memory commit.
Only retry AI response generation and post-response validation.
```

---

## 21.6 Duplicate Route Outcome

If a duplicate route outcome is detected:

```text
Avoid appending duplicate durable memory.
Audit duplicate suppression.
Use existing event in projection.
```

---

## 22. Audit Requirements

Audit must be able to answer:

1. Why was this memory committed?
2. Why was this memory rejected?
3. Why was this route outcome committed?
4. Why was this route outcome rejected?
5. Why did the projection derive this current truth?
6. Why did the runtime resume or avoid a route?
7. Why did handoff readiness become active?
8. Why was official-action memory blocked?
9. Why was pre-response memory not repeated during retry?

Minimum route-memory audit events:

```text
route_outcome_memory_candidate_created
route_outcome_memory_accepted
route_outcome_memory_rejected
route_outcome_memory_duplicate_suppressed
route_projection_derived
route_deferral_projected
route_switch_projected
route_fallback_projected
handoff_route_outcome_projected
official_truth_candidate_rejected
```

---

## 23. Evaluation Labels

Recommended evaluation labels:

```text
memory_commit_correct
memory_commit_missing
memory_commit_overpromoted
memory_commit_official_truth_violation_blocked
route_outcome_commit_correct
route_outcome_commit_missing
route_outcome_commit_overpromoted
accepted_fallback_correct
accepted_fallback_overpromoted_to_L4
deferred_decision_correct
deferred_decision_missing
student_switch_correct
student_switch_missing
handoff_memory_correct
handoff_memory_official_truth_violation
current_truth_projection_correct
current_truth_projection_stale
route_projection_correct
route_projection_rigid
route_projection_too_loose
```

Most important early labels:

1. route outcome overpromotion
2. accepted fallback overpromotion to L4
3. L3 overpromotion to confirmed preference
4. handoff readiness becoming official truth
5. route deferral not being resumable
6. current truth projection inconsistency

---

## 24. Validation and Test Strategy

---

## 24.1 Core Memory Tests

```text
1. accepted academic result commits as AcademicMemory
2. weak course interest commits as CourseDirectionMemory considering
3. L3 expressed preference does not commit CounselingPreferenceMemory
4. explicit L4 confirmation commits CounselingPreferenceMemory
5. ready-to-apply signal commits handoff readiness, not application submitted
6. official-action candidate is rejected
7. response retry does not duplicate pre-response memory commit
```

---

## 24.2 Route Outcome Tests

```text
1. explicit confirmed course preference creates RouteOutcomeMemory.confirmed_preference
2. L3 expressed preference does not create RouteOutcomeMemory.confirmed_preference
3. shortlist-only does not create route outcome completion
4. recommendation-presented-only does not create route outcome completion
5. accepted fallback creates RouteOutcomeMemory.accepted_fallback
6. accepted fallback does not create CounselingPreferenceMemory unless explicitly confirmed
7. deferral creates RouteOutcomeMemory.deferred_decision
8. deferral reason creates ConcernOrBlockerMemory when evidence exists
9. student-led switch creates RouteOutcomeMemory.student_switched_route
10. boundary interruption creates RouteOutcomeMemory.blocked_by_boundary or handoff_required
```

---

## 24.3 Current Truth Projection Tests

```text
1. course confirmed route outcome updates latest course route outcome
2. confirmed course preference makes course direction resolved
3. university unresolved after course confirmation suggests university route candidate hint
4. deferred route appears in routeDeferralHistory
5. deferred route produces resumeRouteCandidateHint
6. accepted fallback appears as fallback/working direction, not L4
7. handoff_required appears in handoff readiness, not official action truth
8. route switch appears in routeSwitchHistory
9. rejected option suppresses unsuitable recommendation
10. current truth can be rebuilt from MemoryEventStore
```

---

## 24.4 Official Truth Boundary Tests

```text
1. AI says application submitted → reject memory, audit blocked official action
2. AI says registration completed → reject memory, audit blocked official action
3. student says apply now → handoff readiness memory, not application submitted
4. student says pay deposit now → handoff readiness/boundary, not payment confirmed
5. route outcome handoff_required never means official action completed
```

---

## 24.5 Route Episode Non-Durable Tests

```text
1. activeRouteEpisode is not written to MemoryEventStore
2. progressState is not written to MemoryEventStore
3. route_started is audit-only by default
4. route_outcome_reached may commit when validated
5. route candidate rejection goes to AuditEventStore only
```

---

## 25. Prototype Implementation Slice

For the first route-episode memory prototype, implement only:

1. `route_outcome` memory category
2. `RouteOutcomeMemoryPayload`
3. route outcome ingestion validation
4. accepted fallback projection rule
5. deferred decision projection rule
6. route switch projection rule
7. handoff required projection rule
8. route-aware `CurrentTruthProjection.routeEpisodeProjection`
9. route memory audit events
10. tests for no L3/shortlist/recommendation-only completion

Do not implement yet:

1. durable active route episode store
2. full route graph
3. physical projection cache
4. advanced correction/removal mutation
5. route analytics dashboard
6. route optimization engine
7. CRM writeback

---

## 26. Decisions Locked by Phase 5 v1.1

```text
1. Active route episode is runtime-derived and not durable memory.
2. Route start/progress state is audit/runtime by default, not student memory.
3. Meaningful route outcomes may become durable counseling memory.
4. Add route_outcome as a MemoryCategory.
5. Add RouteOutcomeMemoryPayload.
6. RouteOutcomeMemory explains why a route completed, deferred, switched, blocked, or handed off.
7. RouteOutcomeMemory may coexist with CounselingPreferenceMemory, ConcernOrBlockerMemory, DecisionSupportMemory, DirectionMemory, or HandoffReadinessMemory.
8. Accepted fallback is not L4 confirmed counseling preference unless explicitly confirmed.
9. Deferred decision is a valid route outcome and should be resumable.
10. CurrentTruthProjection must include route episode projection fields.
11. Route outcome history guides future route planning and recommendation behavior but does not own final active route.
12. MemoryStateService and MemoryEventValidator own memory commit eligibility.
13. Skill metadata does not own final memory authorization.
14. RouteOutcomeValidator owns route outcome validity before route outcome memory commit.
15. Counseling memory must never create official application, registration, payment, enrollment, seat, CRM, eligibility, scholarship, exception, or document-submission truth.
```

---

## 27. Open Questions Deferred

1. Should route outcome memory later support correction/removal UX directly?
2. Should route outcome history have retention/compaction rules?
3. Should route outcome projection be cached for performance?
4. Should route outcome memory have analytics-specific mirror tables outside student memory?
5. How should CRM read-only statuses influence route outcome projection in future phases?
6. Should route deferral expire after time or remain until superseded?
7. How should family/parent decision blockers be represented if they repeatedly control route deferral?
8. Should accepted fallback have a formal preference-strength sublevel below L4?
9. Should route_outcome memory be included in counselor handoff package by default?
10. How should future correction/contradiction behavior update route outcome history?

---

## 28. Final Phase 5 v1.1 Summary

Phase 5 v1.1 keeps the original Phase 5 memory foundation:

```text
AcceptedSemanticDelta
→ MemoryStateService
→ DurableMemoryEvent
→ MemoryEventStore
→ CurrentTruthProjection
```

It updates the foundation for Route Episode:

```text
Route episode is runtime-derived.
Route outcome is durable when meaningful.
Current truth projects route history and route readiness.
Platform validators own memory and route outcome correctness.
```

The final memory stance is:

```text
Memory stores counseling truth.
CurrentTruthProjection derives usable state.
RouteEpisodePlanner derives active route.
Audit explains platform behavior.
CRM/application systems own official truth.
```
