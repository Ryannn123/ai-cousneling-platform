# Phase 5 — Student Memory & Counseling State Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 5 — Student Memory & Counseling State  
**Version:** 1.0  
**Date:** 2026-07-02  
**Status:** Approved exploration output for Phase 5  
**Source Context:** Phase 0 Bounded Autonomy Baseline v1.0, Phase 1 Autonomous Counseling Operating Model v1.2, Phase 2 Counseling SOP & Skill Control v1.2, Phase 3 Autonomous Runtime Strategy v1.2, Phase 4 Interpretation & Extraction Layer v1.3, Prototype Runtime Checkpoint, Roadmap v7.3, and Phase 5 exploration discussion.

---

## 1. Purpose

This specification defines the **Phase 5 Student Memory & Counseling State** layer for the AI-first bounded autonomous counseling platform.

It answers the Phase 5 core question:

```text
How should accepted semantic memory deltas become durable student memory,
current truth, history, and counseling state while preserving Phase 0 official-action
boundaries and Phase 4 runtime-only signal separation?
```

Phase 4 v1.3 produces validated semantic artifacts:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

Phase 4 does **not** create durable memory, current truth, CRM truth, application truth, registration truth, payment truth, seat truth, enrollment truth, or official status.

Phase 5 defines the controlled memory/state layer that consumes accepted memory deltas and turns them into durable counseling memory events, derived current truth, and runtime-consumable memory state.

Core Phase 5 principle:

```text
Accepted semantic deltas are not durable memory.
Durable memory is created only through Phase 5 memory ingestion and validation.
Current truth is derived from durable memory events.
Operating context is derived from current truth and current-turn runtime artifacts.
Official CRM/application truth remains externally owned.
```

---

## 2. Scope

Phase 5 defines:

1. the durable student counseling memory model
2. the distinction between memory events, current truth, runtime-only context, audit records, and read-only CRM/application references
3. the `MemoryStateService` boundary
4. the `MemoryIngestionPolicy` contract
5. the `MemoryEventValidator` contract
6. the `MemoryEventStore` contract
7. the `AuditEventStore` contract
8. the `DurableMemoryEvent` envelope
9. typed durable memory payload categories
10. commit timing for student-stated memory and AI-produced outputs
11. current-truth derivation strategy
12. `CurrentTruthProjection` derived runtime contract
13. operation-aware merge semantics
14. v1 implementation slice using active `add_new` behavior
15. forward compatibility for correction, removal, contradiction, confidence changes, preference upgrade/downgrade, and stale replacement
16. risk-tiered failure behavior
17. official-truth separation
18. audit and evaluation requirements
19. validation and test strategy
20. decisions locked by Phase 5
21. open questions deferred to later phases

---

## 3. Non-Goals

Phase 5 does **not** define:

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

Important boundary:

```text
Phase 5 designs the memory/state truth model and prototype-ready contracts.
It does not make counseling memory an official system of record.
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
10. readiness-to-register signal
11. handoff readiness context

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

## 4.2 Phase 1 Inheritance — Counseling Operating Model

Phase 5 must support the Phase 1 pre-registration counseling journey:

```text
S1. First Contact / Profile Incomplete
S2. Minimum Profile Reached
S3. Exploration Mode
S4. Recommendation-Ready
S5. Shortlist / Comparison
S6. Confirmed Counseling Preference
S7. Ready-to-Register / Apply Handoff
S8. Deferral or Indecision
S9. Detour and Resume
```

Phase 5 must support the route-based minimum counseling profile:

```text
1. academic result status
2. course direction status
3. university direction status
```

These are derived from memory events and current-turn semantic artifacts. They are not LLM-owned state.

Phase 5 must support the preference ladder:

```text
L1. Weak Interest
L2. Expressed Interest
L3. Expressed Preference
L4. Confirmed Counseling Preference
L5. Ready-to-Register / Apply Intent
```

Important:

```text
L4 is a confirmed counseling preference only.
L5 triggers handoff behavior.
Neither L4 nor L5 is official application, registration, payment, enrollment,
seat, or CRM truth.
```

---

## 4.3 Phase 2 Inheritance — Skill Control

Phase 5 must support Phase 2 skill enforcement by providing validated memory-derived context to downstream runtime modules.

Accepted memory and current truth may help with:

1. route-aware skill selection
2. allowed memory output validation
3. recommendation readiness validation
4. confirmed preference validation
5. handoff context preparation
6. counselor-like response mode selection
7. decision-support context
8. audit and evaluation

However:

```text
Skill metadata and boundary rules still control what may be output or committed.
Memory truth does not override boundary rules.
```

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

Phase 5 sits after `AcceptedSemanticDelta` and before boundary resolution:

```text
Student message
→ FastBoundarySignalScanner
→ AISemanticDeltaExtractor
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
→ MemoryStateService
→ CurrentTruthProjection
→ BoundaryResolver
→ OperatingContextManager
→ SkillControlService
→ AIExecutionClient
→ ValidationPipeline
→ post-response memory commit
→ AuditEventStore
```

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
Runtime operating context is derived from current truth and current-turn artifacts.
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
→ BoundaryResolver / OperatingContextManager / SkillControlService
```

---

## 6. Conceptual Memory Layers

Phase 5 separates memory into five conceptual layers:

```text
1. Durable memory events
2. Current truth projection
3. Runtime-only turn context
4. Audit/evaluation records
5. Read-only CRM/application references
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

They represent what the platform has safely committed about the student’s counseling journey.

Examples:

1. student stated academic result
2. student is considering a course
3. student prefers a university
4. student confirmed a counseling preference
5. student rejected an option
6. student stated a hard constraint
7. student expressed a concern
8. student reacted to a recommendation
9. student showed readiness for handoff

---

## 6.2 Current Truth Projection

`CurrentTruthProjection` is a derived per-turn runtime view.

It is not a durable store and not a mutable student profile.

It derives:

1. academic result status
2. course direction status
3. university direction status
4. pathway direction status
5. minimum profile completion
6. minimum profile route
7. active directions
8. preference strength
9. recommendation readiness
10. hard constraints
11. soft preferences
12. current decision blockers
13. handoff readiness context

It must be rebuildable from `MemoryEventStore`.

---

## 6.3 Runtime-Only Turn Context

Runtime-only turn context is assembled per turn from:

1. accepted runtime-only signals
2. current truth projection
3. boundary result
4. operating context
5. selected skill
6. knowledge need
7. student posture
8. ambiguity signal

It is not durable memory by default.

Examples:

```text
student_posture = lost_or_confused
knowledge_need = fee_question
ambiguity = ambiguous_proceed_language
counselor_response_mode = clarify_once
```

---

## 6.4 Audit/Evaluation Records

Audit records explain platform behavior.

They include:

1. rejected semantic candidates
2. downgraded candidates
3. validation events
4. blocked official-action outputs
5. boundary decisions
6. memory ingestion decisions
7. memory validation failures
8. response validation failures
9. retry attempts
10. selected skill/version/hash

Audit records do not become current truth or ordinary student memory.

---

## 6.5 Read-Only CRM/Application References

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
CRMReferenceView
```

Rationale:

```text
Current truth is derived every turn.
Runtime turn context is assembled every turn.
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
    acceptedSemanticDeltaId: string;
    acceptedDeltaId: string;
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
  source: "student_message" | "conversation_context" | "validated_ai_output";
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
  | "rejected_option"
  | "constraint"
  | "quality_context"
  | "concern_or_blocker"
  | "decision_support"
  | "recommendation_interaction"
  | "handoff_readiness";
```

---

## 8.3 MemoryOperation

Phase 5 v1 executes only `add_new`, but the contract reserves future operations.

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

v1 active operation:

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

---

## 9. Durable Memory Categories

Phase 5 defines stable domain-level durable memory categories with typed subtypes.

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

Projection derives:

1. `course_direction_status`
2. `active_course_direction`
3. course-side preference strength

---

## 9.3 UniversityDirectionMemory

Stores university direction signals.

Examples:

1. considering Sunway
2. prefers Taylor’s
3. interested in universities around KL
4. comparing two universities

Projection derives:

1. `university_direction_status`
2. `active_university_direction`
3. university-side preference strength

---

## 9.4 PathwayDirectionMemory

Stores pathway direction signals.

Examples:

1. considering foundation
2. prefers diploma
3. unsure between foundation and degree
4. wants a transfer pathway

Projection derives:

1. `pathway_direction_status`
2. `active_pathway_direction`
3. pathway comparison context

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

---

## 9.6 RejectedOptionMemory

Stores rejected or deprioritized options.

Examples:

1. not interested in Accounting
2. does not want a far campus
3. rejects expensive universities
4. does not want foundation

Projection uses rejected options to suppress unsuitable recommendations unless the student later reconsiders.

---

## 9.7 ConstraintMemory

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

## 9.8 QualityContextMemory

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

## 9.9 ConcernOrBlockerMemory

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

This category supports counseling continuity.

---

## 9.10 DecisionSupportMemory

Stores structured decision-support outcomes.

Examples:

1. student prioritizes affordability over ranking
2. student narrowed options to top 2
3. student wants Psychology vs Business comparison
4. student keeps cycling between options

Projection derives:

1. comparison context
2. shortlist context
3. tradeoff priority
4. deadlock/loop risk

---

## 9.11 RecommendationInteractionMemory

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

---

## 9.12 HandoffReadinessMemory

Stores counseling-side readiness and handoff context.

Examples:

1. student wants to apply now
2. student asks for human counselor
3. student is ready for official next step
4. handoff required
5. handoff reason

Boundary:

```text
HandoffReadinessMemory can say “student is ready for handoff.”
It cannot say “application submitted” or “registration completed.”
```

Projection derives:

1. `handoff_required`
2. `handoff_reason`
3. `handoff_readiness_context`

---

## 10. Commit Classification Policy

Phase 5 classifies commits by origin and dependency.

---

## 10.1 Class 1 — Pre-Response Student-Stated Memory

Validated student-stated memory may commit before AI response generation.

Examples:

1. academic result stated
2. course considered
3. university considered
4. pathway considered
5. preference stated
6. confirmed counseling preference stated by student
7. rejected option
8. hard constraint
9. soft preference
10. concern or blocker
11. deferral signal
12. recommendation reaction stated by student
13. handoff readiness intent stated by student
14. human help request

These commits update current truth before boundary resolution, skill selection, and response generation.

---

## 10.2 Class 2 — Post-Response AI-Produced Outputs

AI-produced counseling outputs commit only after response validation and delivery.

Examples:

1. recommendation made
2. recommendation assumptions
3. recommendation confidence
4. comparison conclusion generated by AI
5. shortlist generated by AI
6. handoff summary prepared
7. milestone confirmation message delivered
8. clarification question asked
9. safe next step offered

If the response fails validation and is not shown, these outputs must not commit.

---

## 10.3 Class 3 — Runtime-Only, No Durable Memory By Default

Examples:

1. student posture
2. ambiguity signal
3. knowledge need
4. counselor response mode
5. decision support mode
6. selected skill
7. boundary scanner hit
8. temporary detour mode

These may affect the current turn but do not become durable memory unless an explicit future Phase 5 policy permits conversion.

---

## 10.4 Class 4 — Audit-Only Records

Examples:

1. rejected semantic candidate
2. downgraded semantic candidate
3. blocked official-action output
4. response validation failure
5. memory ingestion rejection
6. boundary resolver decision
7. retry attempt
8. fallback response trigger

These go to `AuditEventStore`, not `MemoryEventStore`.

---

## 10.5 Class 5 — Forbidden Memory Commits

The following must never become counseling memory events:

```text
application_submitted
registration_completed
payment_confirmed
seat_reserved
enrollment_confirmed
crm_status_updated
scholarship_approved
eligibility_approved
exception_approved
official_document_submitted
```

Allowed alternative:

```text
student requested official action
student is ready for handoff
handoff required
handoff reason
```

---

## 11. MemoryIngestionPolicy Contract

`MemoryIngestionPolicy` owns commit eligibility and `MemoryEventDraft` creation.

It answers:

```text
Should this accepted memory delta become a memory event?
What kind of event?
With what evidence?
With what projection intent?
With what safety restrictions?
```

It does not derive current truth, select skills, resolve boundaries, or generate responses.

---

## 11.1 MemoryIngestionDecision

```ts
type MemoryIngestionDecision = {
  acceptedDeltaId: string;

  decision:
    | "create_memory_event"
    | "defer_until_post_response"
    | "audit_only"
    | "reject"
    | "requires_clarification";

  commitClass: CommitClass;

  category?: MemoryCategory;
  operation?: MemoryOperation;
  projectionIntent?: ProjectionIntent;

  eventDraft?: MemoryEventDraft;

  reasons: string[];
  warnings: string[];

  relatedExistingEventIds?: string[];
  duplicateDecision?: DuplicationDecision;

  officialTruthCheck: {
    passed: boolean;
    violationType?: string;
  };
};
```

---

## 11.2 CommitClass

```ts
type CommitClass =
  | "pre_response_student_stated_memory"
  | "post_response_ai_produced_output"
  | "runtime_only_no_memory"
  | "audit_only"
  | "forbidden_official_truth";
```

---

## 11.3 DuplicationDecision

```ts
type DuplicationDecision =
  | "new_event"
  | "duplicate_ignore"
  | "duplicate_append_evidence"
  | "related_event";
```

---

## 11.4 MemoryEventDraft

```ts
type MemoryEventDraft = {
  studentId: string;
  category: MemoryCategory;
  operation: MemoryOperation;
  payload: TypedMemoryPayload;

  confidence: "low" | "medium" | "high";
  evidence: EvidenceSpan[];

  source: {
    acceptedSemanticDeltaId: string;
    acceptedDeltaId: string;
    conversationId: string;
    turnId: string;
    messageId: string;
  };

  merge: {
    projectionIntent: ProjectionIntent;
    relatedEventIds?: string[];
    supersedesEventIds?: string[];
    contradictionEventIds?: string[];
  };

  officialTruthBoundary: {
    isOfficialTruth: false;
  };
};
```

---

## 11.5 Ingestion Policy Checks

For each accepted delta, `MemoryIngestionPolicy` must check:

1. commit class
2. memory category
3. operation type
4. projection intent
5. evidence sufficiency
6. promotion safety
7. duplicate or near-duplicate behavior
8. official-truth boundary
9. runtime-only leakage
10. post-response dependency

---

## 12. MemoryEventValidator Contract

`MemoryEventValidator` enforces durable-memory invariants.

Flow:

```text
MemoryIngestionPolicy
→ MemoryEventDraft
→ MemoryEventValidator
→ DurableMemoryEvent
→ MemoryEventStore
```

The validator answers:

```text
Is this memory event safe and valid to append?
```

It does not derive current truth or determine runtime behavior.

---

## 12.1 Validation Checks

The validator must check:

1. schema validity
2. category/payload compatibility
3. operation support
4. evidence sufficiency
5. promotion safety
6. official-truth safety
7. projection intent safety
8. duplicate/relationship safety
9. source traceability
10. student/conversation/turn identity

---

## 12.2 MemoryEventValidationResult

```ts
type MemoryEventValidationResult = {
  status:
    | "valid"
    | "valid_with_warnings"
    | "reject"
    | "requires_clarification"
    | "defer"
    | "audit_only";

  durableEvent?: DurableMemoryEvent;

  errors: MemoryEventValidationError[];
  warnings: MemoryEventValidationWarning[];

  invariantChecks: {
    schemaValid: boolean;
    categoryPayloadCompatible: boolean;
    operationSupported: boolean;
    evidenceSufficient: boolean;
    promotionSafe: boolean;
    officialTruthSafe: boolean;
    projectionIntentSafe: boolean;
    duplicatePolicySafe: boolean;
  };
};
```

---

## 13. MemoryEventStore Contract

`MemoryEventStore` is the authoritative durable counseling memory store.

Principle:

```text
MemoryEventStore is append-only, idempotent, projection-readable, and source-traceable.
It stores only validated DurableMemoryEvents.
It does not store current truth, runtime context, audit-only records, or CRM truth.
Normal memory changes are represented by new events, not by mutating old events.
```

---

## 13.1 Responsibilities

`MemoryEventStore` must:

1. append only validated events
2. enforce idempotency
3. preserve deterministic ordering
4. support projection reads
5. support source traceability
6. keep audit separate
7. avoid mutating old events for normal changes

---

## 13.2 Interface

```ts
type MemoryEventStore = {
  appendValidatedEvent(input: {
    event: DurableMemoryEvent;
    idempotencyKey: string;
  }): Promise<AppendMemoryEventResult>;

  getEventsForProjection(input: {
    studentId: string;
    categories?: MemoryCategory[];
    includeHistory?: boolean;
  }): Promise<DurableMemoryEvent[]>;

  getEventById(eventId: string): Promise<DurableMemoryEvent | null>;

  getEventsByTurn(input: {
    studentId: string;
    turnId: string;
  }): Promise<DurableMemoryEvent[]>;

  getEventsByAcceptedSemanticDelta(input: {
    acceptedSemanticDeltaId: string;
  }): Promise<DurableMemoryEvent[]>;
};
```

```ts
type AppendMemoryEventResult = {
  status:
    | "appended"
    | "already_exists"
    | "rejected_not_validated"
    | "failed";

  eventId?: string;
  existingEventId?: string;
  reasons: string[];
};
```

---

## 13.3 Idempotency

The store must prevent duplicate memory commits.

Recommended idempotency key shape:

```ts
type MemoryEventIdempotencyKey =
  `${studentId}:${acceptedSemanticDeltaId}:${acceptedDeltaId}:${category}:${operation}`;
```

This prevents duplicate events during:

1. response retry
2. provider retry
3. runtime restart
4. turn replay
5. duplicate commit calls

---

## 14. CurrentTruthProjector

`CurrentTruthProjector` derives `CurrentTruthProjection` every turn from `MemoryEventStore`.

Principle:

```text
DurableMemoryEvents are the source of truth.
CurrentTruthProjection is deterministic, rebuildable, and non-authoritative compared to events.
```

The projector uses a central orchestrator with deterministic domain resolvers.

---

## 14.1 Resolver Topology

```text
MemoryEvents
  ↓
CurrentTruthProjector
  ├── AcademicTruthResolver
  ├── DirectionTruthResolver
  ├── CounselingPreferenceResolver
  ├── ConstraintAndQualityContextResolver
  ├── ConcernAndDecisionSupportResolver
  ├── RecommendationReadinessResolver
  └── HandoffReadinessResolver
  ↓
CurrentTruthProjection
```

---

## 14.2 Resolver Order

Recommended order:

1. academic truth
2. direction truth
3. counseling preference truth
4. constraint and quality context truth
5. concern and decision-support truth
6. recommendation readiness truth
7. handoff readiness truth

Cross-category derivation should happen after domain-level views are resolved.

Example:

```text
AcademicTruthResolver
+ DirectionTruthResolver
+ ConstraintAndQualityContextResolver
→ RecommendationReadinessResolver
```

---

## 14.3 Projection Rules

Projection must not use a simple latest-wins rule globally.

Rules include:

1. weak evidence cannot override stronger evidence
2. rejected option suppresses active recommendation unless reconsidered
3. confirmed counseling preference requires explicit evidence
4. hard constraint requires stronger evidence than soft preference
5. contradiction may require clarification
6. readiness-to-register creates handoff context, not official status
7. official CRM/application truth is never derived from memory events

---

## 15. CurrentTruthProjection Contract

`CurrentTruthProjection` is a derived per-turn runtime contract.

It contains only memory-derived counseling truth.

It excludes:

1. runtime-only posture
2. journey/action state
3. selected skills
4. knowledge signals
5. audit-only records
6. raw LLM output
7. official CRM/application truth

---

## 15.1 Top-Level Contract

```ts
type CurrentTruthProjection = {
  studentId: string;

  metadata: {
    projectorVersion: string;
    generatedAt: string;
    sourceEventIds: string[];
    derivationStatus: "complete" | "partial" | "uncertain";
    warnings: CurrentTruthWarning[];
  };

  academic: AcademicTruthView;
  direction: DirectionTruthView;
  preference: PreferenceTruthView;
  route: RouteTruthView;
  recommendationReadiness: RecommendationReadinessView;
  qualityContext: QualityContextTruthView;
  decisionContext: DecisionContextTruthView;
  handoffReadiness: HandoffReadinessTruthView;
};
```

---

## 15.2 AcademicTruthView

```ts
type AcademicTruthView = {
  academicResultStatus: "unknown" | "known" | "unclear";
  latestUsableAcademicResult?: {
    rawText: string;
    qualificationType?: string;
    credits?: number;
    cgpa?: number;
    subjects?: {
      name: string;
      grade?: string;
      status?: "pass" | "fail" | "unknown";
    }[];
    confidence: "low" | "medium" | "high";
    supportingEventIds: string[];
  };
  academicUncertainty?: {
    reason: string;
    conflictingEventIds?: string[];
    clarificationNeeded: boolean;
  };
};
```

---

## 15.3 DirectionTruthView

```ts
type DirectionTruthView = {
  courseDirectionStatus:
    | "unknown"
    | "considering_some_courses"
    | "preferred_course_exists"
    | "confirmed_counseling_course_preference";

  universityDirectionStatus:
    | "unknown"
    | "considering_some_universities"
    | "preferred_university_exists"
    | "confirmed_counseling_university_preference";

  pathwayDirectionStatus:
    | "unknown"
    | "considering_some_pathways"
    | "preferred_pathway_exists"
    | "confirmed_counseling_pathway_preference";

  activeCourseDirections: DirectionOptionView[];
  activeUniversityDirections: DirectionOptionView[];
  activePathwayDirections: DirectionOptionView[];

  rejectedOptions: RejectedOptionView[];
};
```

---

## 15.4 PreferenceTruthView

```ts
type PreferenceTruthView = {
  preferenceStrength: "none" | "L1" | "L2" | "L3" | "L4" | "L5";

  confirmedCounselingPreference?: {
    courseOrProgram?: string;
    university?: string;
    pathway?: string;
    combinedOptionLabel?: string;
    confidence: "low" | "medium" | "high";
    supportingEventIds: string[];
  };

  preferenceUncertainty?: {
    reason: string;
    requiresConfirmation: boolean;
    conflictingEventIds?: string[];
  };
};
```

Boundary:

```text
L4 = confirmed counseling preference.
L5 = ready-to-apply/register intent and should trigger handoff handling.
Neither means official application, registration, payment, enrollment, seat, or CRM truth.
```

---

## 15.5 RouteTruthView

```ts
type RouteTruthView = {
  minimumProfileCompletion:
    | "incomplete"
    | "minimum_complete"
    | "rich_profile";

  minimumProfileRoute:
    | "collect_academic_result"
    | "course_or_pathway_exploration"
    | "university_exploration"
    | "course_exploration_within_university_context"
    | "recommendation_or_validation"
    | "comparison_or_shortlist"
    | "handoff_boundary_check";

  missingMinimumProfileFields: Array<
    "academic_result" | "course_direction_status" | "university_direction_status"
  >;

  missingQualityFitSignals: string[];
};
```

Important:

```text
minimum_complete means route-ready.
It does not mean rich recommendation-ready.
```

---

## 15.6 RecommendationReadinessView

```ts
type RecommendationReadinessView = {
  level: "R1" | "R2" | "R3";

  basis: {
    hasUsableAcademicResult: boolean;
    hasUsableCourseDirection: boolean;
    hasUsableUniversityDirection: boolean;
    hasUsablePathwayDirection: boolean;
    hasEnoughFitSignalsForHighQualityRecommendation: boolean;
  };

  missingForR2: string[];
  missingForR3: string[];

  confidence: "low" | "medium" | "high";
};
```

Recommended meaning:

```text
R1 = not ready to recommend
R2 = ready for directional recommendation
R3 = ready for high-quality recommendation
```

Ranking, budget, location, intake, and family constraints can improve R3, but are not universal gates for R2.

---

## 15.7 QualityContextTruthView

```ts
type QualityContextTruthView = {
  hardConstraints: ConstraintView[];
  softPreferences: PreferenceView[];
  influenceOrContext: ContextView[];
  qualityContextSummary: string;
};
```

Distinction:

```text
"I prefer KL" = soft preference.
"I can only study in KL" = hard constraint.
```

---

## 15.8 DecisionContextTruthView

```ts
type DecisionContextTruthView = {
  currentDecisionBlockers: ConcernOrBlockerView[];
  activeComparisonSet: ComparisonOptionView[];
  shortlist: ShortlistOptionView[];
  tradeoffPriorities: TradeoffPriorityView[];
  deferralStatus?: {
    isDeferred: boolean;
    reason?: string;
    supportingEventIds: string[];
  };
  deadlockRisk: "none" | "low" | "medium" | "high";
};
```

This supports counseling continuity without turning posture into durable identity memory.

---

## 15.9 HandoffReadinessTruthView

```ts
type HandoffReadinessTruthView = {
  handoffRequired: boolean;

  triggerTypes: Array<
    | "H1_ready_to_apply_or_register"
    | "H2_official_action_request"
    | "H3_payment_seat_enrollment"
    | "H4_exception_appeal_waiver_complex_eligibility"
    | "H5_sensitive_or_high_risk"
    | "H6_human_requested"
  >;

  readinessContext?: {
    selectedCounselingPreference?: string;
    reason: string;
    supportingEventIds: string[];
  };

  officialTruthBoundary: {
    applicationSubmitted: false;
    registrationCompleted: false;
    paymentConfirmed: false;
    enrollmentConfirmed: false;
    seatReserved: false;
    crmStatusUpdated: false;
  };
};
```

---

## 16. Operation-Aware Merge Policy

Phase 5 uses operation-aware merge semantics.

Principle:

```text
Memory events are append-only.
Current truth changes through deterministic projection rules based on operation,
domain, evidence, confidence, preference strength, and official-truth boundaries.
```

v1 executes only `add_new`.

Future operation semantics are reserved.

---

## 16.1 add_new

Use when the student states a new fact, preference, concern, constraint, option, or reaction.

Example:

```text
Student: I am considering Psychology.
```

Event:

```text
operation = add_new
category = course_direction
payload = Psychology, status = considering
```

Projection effect:

```text
course_direction_status = considering_some_courses
preference_strength = L1
```

---

## 16.2 correction

Use when the student says an earlier memory was wrong.

Example:

```text
Actually, I got 6 credits, not 5.
```

Future projection behavior:

```text
Supersede the incorrect academic result for current truth.
Keep old event in history as corrected.
```

---

## 16.3 removal

Use when the student explicitly wants a memory removed or invalidated.

Future projection behavior:

```text
Mark target event as removed from current truth.
Keep necessary audit trace subject to privacy/retention policy.
```

---

## 16.4 contradiction

Use when new evidence conflicts with existing memory but does not clearly correct or replace it.

Future projection behavior:

```text
Lower confidence, require clarification, or mark current truth uncertain when impact is high.
```

---

## 16.5 confidence_change

Use when evidence changes how strongly the platform believes a memory item.

Future projection behavior:

```text
Increase or decrease confidence without deleting history.
```

---

## 16.6 preference_upgrade

Use when student moves to a stronger preference level.

Example:

```text
Psychology sounds interesting → I prefer Psychology → Psychology is my choice for now.
```

Future projection behavior:

```text
Upgrade preference strength through allowed ladder transitions.
```

---

## 16.7 preference_downgrade

Use when the student weakens or backs away from a prior preference.

Future projection behavior:

```text
Keep prior preference in history.
Remove or weaken from active current truth.
Set blocker/indecision if relevant.
```

---

## 16.8 stale_memory_replacement

Use when older memory was true then but no longer current.

Future projection behavior:

```text
Old event remains history.
New event becomes current truth.
Old event is marked stale/superseded for projection.
```

---

## 17. MemoryStateService Boundary

`MemoryStateService` is the runtime boundary for Phase 5 memory/state operations.

Principle:

```text
MemoryStateService is the only runtime boundary allowed to commit counseling memory
and derive memory-based current truth.
```

It owns:

1. memory ingestion
2. memory validation
3. memory event append
4. current-truth derivation
5. memory-related audit writes

It does not own:

1. boundary resolution
2. operating context finalization
3. skill selection
4. AI response generation
5. official CRM/application truth

---

## 17.1 Interface

```ts
type MemoryStateService = {
  deriveCurrentTruth(input: {
    studentId: string;
    conversationId: string;
    turnId: string;
  }): Promise<CurrentTruthProjection>;

  commitPreResponseStudentMemory(input: {
    studentId: string;
    acceptedSemanticDelta: AcceptedSemanticDelta;
    currentTruthBeforeCommit: CurrentTruthProjection;
  }): Promise<PreResponseMemoryCommitResult>;

  commitPostResponseAIOutputs(input: {
    studentId: string;
    acceptedSemanticDelta: AcceptedSemanticDelta;
    validatedAIOutput: AIExecutionResult;
    validationResult: ValidationResult;
    finalBoundaryResult: BoundaryResult;
    selectedSkillContext: SkillSelectionResult;
  }): Promise<PostResponseMemoryCommitResult>;
};
```

```ts
type MemoryCommitResult = {
  appendedMemoryEventIds: string[];
  ignoredDuplicateEventIds: string[];
  rejectedDeltaIds: string[];
  auditEventIds: string[];
  warnings: string[];
};
```

---

## 18. End-to-End Runtime Flow

Phase 5 places `MemoryStateService` after `AcceptedSemanticDelta` and before `BoundaryResolver`.

```text
1. Receive student message
2. Run FastBoundarySignalScanner
3. Run AISemanticDeltaExtractor
4. Run SemanticDeltaValidator
5. Produce AcceptedSemanticDelta
6. Load existing MemoryEvents
7. Derive CurrentTruthProjection before commit if needed
8. MemoryStateService.commitPreResponseStudentMemory()
9. Re-derive CurrentTruthProjection
10. BoundaryResolver
11. OperatingContextManager
12. SkillControlService
13. KnowledgeGateway, if needed
14. ExecutionContextComposer
15. AIExecutionClient
16. ValidationPipeline
17. If response fails, retry response only
18. If response passes, MemoryStateService.commitPostResponseAIOutputs()
19. AuditEventStore writes trace events
20. Return final response
```

Important retry rule:

```text
If response validation fails, do not re-run student memory commit.
Do not duplicate MemoryEvents.
Do not re-interpret the student message unless the semantic artifact itself was invalid.
Retry only AI response generation using the same committed memory and current truth.
```

---

## 19. AuditEventStore Contract

`AuditEventStore` is structured, append-only, correlation-friendly, and separate from counseling memory.

It records platform behavior but does not become current truth.

---

## 19.1 Audit Categories

Audit categories include:

1. semantic audit
2. memory ingestion audit
3. projection audit
4. boundary and handoff audit
5. skill and runtime decision audit
6. response validation audit

---

## 19.2 AuditEvent Envelope

```ts
type AuditEvent = {
  auditEventId: string;

  eventType: AuditEventType;
  severity: "debug" | "info" | "warning" | "error" | "critical";

  studentId?: string;
  conversationId: string;
  turnId: string;
  messageId?: string;

  correlation: {
    semanticDeltaId?: string;
    acceptedSemanticDeltaId?: string;
    acceptedDeltaId?: string;
    memoryEventId?: string;
    validationResultId?: string;
    boundaryResultId?: string;
    skillSelectionId?: string;
    aiExecutionResultId?: string;
  };

  summary: string;

  details: Record<string, unknown>;

  safetyFlags?: {
    officialActionRisk?: boolean;
    underHandoffRisk?: boolean;
    overPromotionRisk?: boolean;
    memoryPollutionRisk?: boolean;
    crmTruthLeakageRisk?: boolean;
  };

  createdAt: string;
};
```

---

## 19.3 AuditEventStore Interface

```ts
type AuditEventStore = {
  appendAuditEvent(input: {
    event: AuditEvent;
    idempotencyKey?: string;
  }): Promise<AppendAuditEventResult>;

  getAuditEventsForTurn(input: {
    conversationId: string;
    turnId: string;
  }): Promise<AuditEvent[]>;

  getAuditEventsForStudent(input: {
    studentId: string;
    eventTypes?: AuditEventType[];
    limit?: number;
  }): Promise<AuditEvent[]>;

  getAuditEventsByCorrelation(input: {
    semanticDeltaId?: string;
    memoryEventId?: string;
    boundaryResultId?: string;
    validationResultId?: string;
  }): Promise<AuditEvent[]>;
};
```

---

## 20. Risk-Tiered Failure Behavior

Phase 5 uses risk-tiered failure behavior.

Principle:

```text
Memory/state failures should not all behave the same.
The runtime should continue, clarify, retry, fallback, or hand off depending on
the risk of the failed artifact.
```

---

## 20.1 Semantic Extraction Failure

If semantic extraction fails:

```text
If fast boundary scan found red/yellow risk:
  do not continue normal counseling blindly.
  use boundary-safe clarification or handoff-safe fallback.

If no boundary risk and message is ordinary:
  continue with previous current truth and lightweight clarification.
```

---

## 20.2 Memory Ingestion Rejection

If ingestion rejects a delta:

```text
Do not commit memory.
Write AuditEvent.
Continue only if safe using current truth.
Clarify if rejected memory affects routing, recommendation, preference, or handoff.
```

---

## 20.3 MemoryEventValidator Failure

If validator fails:

```text
Do not append event.
Write AuditEvent.
If failure concerns red-zone/handoff or official-action risk:
  handoff-safe or clarify once.
If low-risk quality context:
  continue without that memory.
```

---

## 20.4 MemoryEventStore Append Failure

Failure behavior depends on event risk:

```text
Low-risk quality memory:
  continue cautiously; do not claim memory was saved.

Flow-driving memory:
  clarify or avoid strong recommendation/confirmation.

Boundary/handoff memory:
  boundary behavior still wins; use handoff-safe response.
```

---

## 20.5 CurrentTruthProjector Failure

If projection fails completely:

```text
Use safe fallback current truth only if risk is low.
Otherwise clarify or hand off.
```

If projection is partial:

```text
Allow low-risk counseling.
Block high-impact recommendation or confirmation until clarified.
```

---

## 20.6 BoundaryResolver Conflict

Boundary wins.

If current truth suggests normal recommendation but runtime-only signals or fast scanner indicate red-zone intent, red-zone behavior overrides normal route.

---

## 20.7 Response Validation Failure

If response validation fails:

```text
Retry response generation once using the same committed memory/current truth,
selected skill, and validation error feedback.

If retry passes:
  send response.
  commit post-response AI outputs.

If retry fails:
  use safe fallback or handoff-safe response.
  do not commit AI-produced post-response outputs.
  write AuditEvent.
```

Do not re-run pre-response memory commit during response retry.

---

## 21. Official-Truth Boundary

Phase 5 must enforce official-truth separation at every layer.

Forbidden durable memory events:

```text
application_submitted
registration_completed
payment_confirmed
seat_reserved
enrollment_confirmed
crm_status_updated
scholarship_approved
eligibility_approved
exception_approved
official_document_submitted
```

Allowed counseling memory:

```text
student requested application help
student ready for handoff
handoff required
handoff reason
confirmed counseling preference
recommendation shown
student reaction
```

Read-only CRM/application references may be added in future phases, but official truth remains externally owned.

---

## 22. Phase 5 v1 Implementation Slice

Phase 5 v1 implements the full memory/state pipeline shape but only executes `add_new` merge behavior.

---

## 22.1 Include in v1

1. `MemoryStateService`
2. `MemoryIngestionPolicy`
3. `MemoryEventValidator`
4. `MemoryEventStore`
5. `CurrentTruthProjector`
6. `AuditEventStore`
7. pre-response student-stated memory commit
8. post-response AI-produced output commit
9. response retry without duplicate memory commit
10. current-truth derivation every turn

---

## 22.2 Active v1 Operation

```text
add_new
```

Used for:

1. academic result stated
2. course considered
3. university considered
4. pathway considered
5. confirmed counseling preference stated
6. rejected option
7. constraint
8. soft preference
9. concern/blocker
10. recommendation reaction
11. handoff readiness signal

---

## 22.3 Reserved but Not Fully Active in v1

1. correction
2. removal
3. contradiction
4. confidence_change
5. preference_upgrade
6. preference_downgrade
7. stale_memory_replacement

v1 behavior:

```text
detect if obvious
record audit event
add safe new memory event if student-stated
avoid unsafe overwrite
clarify when high-impact
defer full merge semantics
```

---

## 22.4 Minimum v1 Current Truth

v1 should derive at least:

1. academic_result_status
2. course_direction_status
3. university_direction_status
4. pathway_direction_status
5. minimum_profile_completion
6. minimum_profile_route
7. active_course_direction
8. active_university_direction
9. active_pathway_direction
10. preference_strength
11. recommendation_readiness
12. hard_constraints
13. soft_preferences
14. current_decision_blockers
15. handoff_required
16. handoff_reason

---

## 22.5 v1 Non-Goals

Phase 5 v1 should not:

1. implement full correction/removal UX
2. physically delete memory events
3. let latest weak signal overwrite confirmed preference
4. treat runtime-only posture as durable memory
5. store CurrentTruthProjection as authoritative durable store
6. integrate writable CRM/application status
7. treat handoff readiness as application submitted
8. finalize recommendation engine scoring

---

## 23. Validation and Test Strategy

Phase 5 uses layered validation:

1. unit tests
2. contract tests
3. integration tests
4. adversarial tests
5. failure tests
6. end-to-end counseling journey tests

---

## 23.1 Memory Ingestion Tests

Examples:

1. academic result stated → AcademicMemory event
2. course mentioned casually → CourseDirectionMemory considering
3. explicit preference → CourseDirectionMemory preferred
4. explicit confirmed choice → CounselingPreferenceMemory
5. apply-now intent → HandoffReadinessMemory, not ApplicationSubmitted
6. runtime posture → no durable memory

---

## 23.2 Memory Event Validation Tests

Examples:

1. weak interest cannot become confirmed preference
2. preferred course cannot become official application
3. handoff readiness cannot become registration completed
4. soft location preference cannot become hard constraint
5. runtime-only posture cannot become durable identity memory
6. malformed payload rejected
7. missing evidence rejected
8. wrong category/payload pairing rejected

---

## 23.3 MemoryEventStore Tests

Examples:

1. only DurableMemoryEvent can append
2. duplicate idempotency key does not duplicate event
3. events return in deterministic order
4. events query by student, turn, and accepted semantic delta
5. old events are not mutated during normal changes
6. audit-only records do not enter MemoryEventStore

---

## 23.4 CurrentTruthProjector Tests

Examples:

1. academic result event → academic_result_status = known
2. course considering event → course_direction_status = considering_some_courses
3. confirmed counseling preference → preference_strength = L4
4. course + academic known → recommendation_readiness = R2
5. course + academic + fit signals → recommendation_readiness = R3
6. rejected option is not active direction
7. handoff readiness signal → handoff_required = true
8. handoff readiness does not mean application submitted

---

## 23.5 Commit Timing Tests

Examples:

1. student-stated memory commits before response generation
2. current truth is re-derived before BoundaryResolver
3. response retry does not duplicate pre-response memory
4. AI-produced recommendation_shown commits only after response validation
5. AI-produced handoff_summary commits only after valid response
6. failed response validation prevents post-response AI output commit

---

## 23.6 Runtime-Only and Audit Separation Tests

Examples:

1. student_posture affects response mode but not MemoryEventStore
2. knowledge_need routes KnowledgeGateway but not durable memory
3. rejected semantic candidate goes to AuditEventStore only
4. blocked official-action output goes to AuditEventStore only
5. projection warning goes to AuditEventStore only

---

## 23.7 Failure Behavior Tests

Examples:

1. low-risk quality memory append failure → continue cautiously
2. flow-driving memory append failure → avoid strong recommendation
3. handoff memory append failure → still use handoff-safe response
4. projection uncertainty → block high-impact recommendation
5. official-truth violation → hard reject and audit
6. response validation fails → retry once without re-committing memory
7. retry fails → fallback or handoff-safe response

---

## 23.8 End-to-End Journey Tests

Minimum v1 journeys:

1. academic result + no course + no university → route to course/pathway exploration
2. academic result + course known + university unknown → route to university exploration
3. academic result + university known + course unknown → route to course exploration within university context
4. course exploration → weak interest → expressed preference → confirmed counseling preference
5. recommendation → student reaction → comparison → confirmed preference
6. confirmed counseling preference → apply/register intent → handoff required, no official action
7. detour question → answer → resume from prior current truth
8. indecision/blocker → decision-support mode, no premature confirmation

---

## 23.9 Minimum Acceptance Criteria

Phase 5 v1 succeeds when:

1. accepted student-stated deltas become validated DurableMemoryEvents
2. DurableMemoryEvents derive correct CurrentTruthProjection each turn
3. current truth supports minimum profile route, preference strength, and recommendation readiness
4. response retry does not duplicate memory events
5. runtime-only signals do not pollute durable memory
6. official business truth is never committed to counseling memory
7. AuditEventStore explains rejected, downgraded, blocked, retried, and handoff decisions

---

## 24. Decisions Locked by Phase 5

Phase 5 locks the following decisions:

1. use hybrid memory truth model: memory events + derived current truth
2. use five conceptual memory layers
3. durably store only MemoryEvents and AuditEvents in Phase 5
4. derive CurrentTruthProjection every turn, not store it as authoritative truth
5. use common DurableMemoryEvent envelope with typed payloads
6. use stable domain memory categories with typed subtypes
7. keep AuditOnlySignalRecord outside normal durable student memory
8. use MemoryIngestionPolicy for commit eligibility and event drafting
9. use MemoryEventValidator for durable-memory invariants
10. use append-only idempotent MemoryEventStore
11. use structured append-only AuditEventStore
12. expose narrow MemoryStateService boundary
13. place MemoryStateService after AcceptedSemanticDelta and before BoundaryResolver
14. commit validated student-stated memory before response generation
15. commit AI-produced counseling outputs only after response validation
16. retry response once without duplicating memory commit
17. execute only `add_new` in v1
18. reserve future operation semantics in contracts
19. use risk-tiered failure behavior
20. enforce official-truth separation at every memory layer
21. validate with layered tests and end-to-end journeys

---

## 25. Open Questions Deferred to Later Phases

Deferred questions:

1. exact physical database/storage technology
2. whether to cache CurrentTruthProjection for performance
3. full correction/removal UX
4. privacy/retention/deletion policy
5. confidence decay and confidence reconciliation
6. advanced contradiction resolution
7. stale memory replacement automation
8. CRM read-only adapter contract
9. writable CRM/application workflow boundaries
10. recommendation lifecycle integration in Phase 7
11. human handoff package structure in Phase 8
12. production evaluation dashboards
13. operations monitoring and QA workflow
14. storage scaling and archival policy
15. multi-tenant data isolation policy

---

## 26. Phase 6 Handoff

Phase 5 prepares the platform for Phase 6 by providing:

1. durable memory events
2. derived current truth
3. route context
4. active directions
5. constraints and soft preferences
6. blockers and comparison context
7. recommendation readiness
8. handoff readiness context
9. audit evidence

Suggested next roadmap phase:

```text
Phase 6 — Business Knowledge & Source Governance
```

Phase 6 should answer:

```text
How should governed university/course/program/business knowledge be sourced,
validated, refreshed, cited, and safely consumed by the counseling runtime?
```

Phase 6 should consume memory/current truth as runtime context, but it should not turn business knowledge into student memory or official CRM truth.

---

## 27. Final Phase 5 Principle

```text
Student memory is not a profile blob.
Student memory is an evidence-backed event history.
Current truth is a deterministic projection.
Runtime context is derived per turn.
Audit explains platform behavior.
CRM/application status remains externally owned.
```
