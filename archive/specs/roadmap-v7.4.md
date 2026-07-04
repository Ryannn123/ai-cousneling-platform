# Bounded Autonomous Counseling Platform — Updated Exploration Roadmap

**Project:** AI Counseling Platform Redesign  
**Roadmap Version:** 7.4 — revised after Phase 5 Student Memory & Counseling State v1.0  
**Date:** 2026-07-02  
**Status:** Phase 0 approved; Phase 1 v1.2 approved; Phase 2 v1.2 approved; Phase 3 v1.2 approved; Phase 4 v1.3 approved; Phase 5 v1.0 approved/current; prototype runtime checkpoint proven; Phase 6 remains the next active exploration  
**Source Inputs:**

1. Phase 0 — Bounded Autonomy Baseline Specification v1.0
2. Phase 1 — Autonomous Counseling Operating Model Specification v1.2
3. Phase 2 — Counseling SOP & Skill Control Specification v1.2
4. Phase 3 — Autonomous Runtime Strategy Specification v1.2
5. Phase 4 — Interpretation & Extraction Layer Specification v1.3
6. Phase 5 — Student Memory & Counseling State Specification v1.0
7. Prototype Runtime Checkpoint
8. Roadmap v7.3
9. Minimum counseling profile routing amendment discussion
10. Counselor-like flow behavior amendment discussion
11. Phase 4 v1.3 semantic delta contract discussion
12. Phase 5 memory/state exploration discussion

---

## 1. Purpose of This Updated Roadmap

This roadmap updates the bounded-autonomous counseling platform roadmap after approving the **Phase 5 Student Memory & Counseling State** specification.

Earlier roadmap alignments remain valid:

```text
v7.1 alignment:
Minimum profile is no longer a university-fit intake gate.
Minimum profile is a routing checkpoint.

v7.2 alignment:
The route-based flow remains the backbone.
A counselor-like behavior layer improves how the AI guides the student through that route.

v7.3 alignment:
Phase 4 no longer outputs a broad per-turn interpretation snapshot.
Phase 4 now outputs semantic delta candidates and runtime-only signal candidates.
Memory/state derives accumulated truth later.

v7.4 alignment:
Phase 5 defines how accepted semantic memory deltas become durable counseling
memory events, derived current truth, and memory-backed runtime state.
```

The revised minimum counseling profile remains:

```text
1. academic result status
2. course direction status
3. university direction status
```

However, ownership is now clearer:

```text
Phase 4:
  extracts student-stated semantic deltas and runtime-only signals.

Phase 5:
  validates memory commit eligibility,
  appends DurableMemoryEvents,
  derives CurrentTruthProjection every turn,
  keeps AuditEventStore separate from student memory,
  prevents counseling memory from becoming official CRM/application truth.

Phase 3 runtime:
  consumes CurrentTruthProjection and AcceptedSemanticDelta-derived runtime context
  to resolve boundary, operating context, skills, knowledge, response mode, and validation.
```

The following signals remain outside the universal minimum-profile gate:

```text
ranking/prestige preference
budget/value preference
preferred location
campus preference
intake/timeline
family or location constraints
```

Those signals remain important, but they belong primarily in:

```text
university exploration
university comparison
recommendation refinement
high-quality recommendation
hard-constraint handling when stated strongly
```

The counselor-like flow principle remains:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

Roadmap v7.4 updates later phases so they account for:

```text
AcceptedSemanticDelta
+ MemoryStateService
+ MemoryIngestionPolicy
+ MemoryEventValidator
+ MemoryEventStore
+ AuditEventStore
+ DurableMemoryEvent
+ CurrentTruthProjector
+ CurrentTruthProjection
+ pre-response student-stated memory commits
+ post-response AI-produced output commits
+ runtime-only signal separation
+ memory/audit separation
+ official CRM/application truth separation
+ response retry without duplicate memory commit
+ route-based minimum-profile state derived outside the LLM
+ recommendation readiness derived from memory/current truth
+ handoff readiness as counseling memory, not official action
+ future correction/contradiction/preference-change compatibility
```

Phase 6 is now the next active exploration.

---

## 2. Updated Product Direction

The platform remains:

```text
An AI-first bounded autonomous counseling system.
```

The AI should be the primary student-facing counselor for ordinary pre-registration counseling. It should autonomously handle:

1. onboarding
2. route-based minimum profile collection
3. student posture-sensitive orientation
4. course/program exploration
5. pathway exploration
6. university exploration
7. factual detours and journey resume
8. directional recommendation
9. high-quality recommendation when enough fit signals exist
10. comparison and shortlisting
11. decision-support micro-loops
12. soft summary checkpoints before important recommendations or confirmations
13. counseling preference confirmation
14. deferral and indecision support
15. readiness-to-register detection
16. handoff context preparation

Humans remain responsible for:

1. application, registration, enrollment, payment, or seat-reservation actions
2. official CRM/application/registration state changes
3. high-risk or sensitive actions
4. exception, appeal, waiver, negotiation, or complex eligibility cases
5. student-requested human support
6. scenarios outside approved SOP/skill coverage

The system should not reduce risk by forcing human review everywhere. It should reduce risk by allowing AI counseling autonomy inside approved skills while platform-owned controls validate:

1. semantic deltas
2. runtime-only signals
3. memory ingestion
4. durable memory events
5. current truth derivation
6. boundaries
7. operating context
8. skill selection
9. knowledge access
10. recommendation outputs
11. handoff outputs
12. response safety
13. CRM separation
14. audit and evaluation

Core runtime principle:

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

Extended v7.4 runtime principle:

```text
AI may extract semantic deltas, identify runtime-only signals, counsel, recommend,
and adapt response style.

Platform validates semantic deltas, runtime signals, memory ingestion, memory
events, current truth derivation, response mode, boundaries, outputs, and commits.

AcceptedSemanticDelta does not directly become durable memory.
Durable memory is created only through MemoryStateService.
CurrentTruthProjection is derived every turn from MemoryEventStore.
Runtime-only signals affect current-turn behavior by default.
Audit records explain behavior but do not become student memory.
CRM/application truth remains externally owned.
```

---

## 3. Updated Dependency Chain

Roadmap v7.4 dependency chain:

```text
Natural language student message
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
MemoryIngestionPolicy
  ↓
MemoryEventValidator
  ↓
MemoryEventStore
  ↓
CurrentTruthProjector
  ↓
CurrentTruthProjection
  ↓
BoundaryResolver
  ↓
Accepted operating context update
  ↓
Route-based minimum profile / route context resolution
  ↓
Counselor response mode resolution
  ↓
Decision-support / summary / milestone requirement resolution
  ↓
Route-aware and counselor-guidance-aware SKILL.md selection
  ↓
KnowledgeGateway, if needed
  ↓
AI counseling execution
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

The most important rule for Phase 5+ remains:

```text
Later phases must not consume raw transcript or uncontrolled summaries as their
primary source of truth.

They should consume AcceptedSemanticDelta, MemoryEventStore, CurrentTruthProjection,
accepted operating context, validated AI outputs, blocked outputs, and audit evidence.
```

New v7.4 rules:

```text
AcceptedSemanticDelta is semantically validated, but not durable memory.

MemoryStateService is the only runtime boundary allowed to commit counseling memory.

Validated student-stated memory may commit before response generation.

AI-produced counseling outputs commit only after response validation and delivery.

CurrentTruthProjection is derived every turn and is not a durable authoritative store.

Runtime-only signals remain current-turn-only by default.

AuditEventStore explains platform behavior but does not become current truth.

Counseling memory must never create official application, registration, payment,
enrollment, seat, CRM, scholarship, eligibility, exception, or document-submission truth.
```

Student posture remains useful for counselor-like behavior, but it should not become permanent identity memory merely because it was detected once.

---

## 4. Locked Foundation From Approved Phases

---

## 4.1 Phase 0 — Bounded Autonomy Baseline

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

The AI may guide and record counseling signals such as:

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

## 4.2 Phase 1 — Autonomous Counseling Operating Model

**Status:** Approved v1.2

Phase 1 defines the pre-registration counseling journey, the route-based minimum counseling profile, and the counselor-like flow behavior layer.

### Locked Scope

```text
Pre-registration prospects only.
```

### Locked Student Outcome

The AI guides students toward:

1. course/program preference
2. university choice
3. pathway choice

The goal is counseling preference formation, not official transaction completion.

### Locked Journey States

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

S9 remains an overlay state.

### Locked Minimum Counseling Profile

The minimum counseling profile remains:

```text
1. academic result status
2. course direction status
3. university direction status
```

Course direction status values:

```text
unknown
considering_some_courses
preferred_course_exists
confirmed_counseling_course_preference
```

University direction status values:

```text
unknown
considering_some_universities
preferred_university_exists
confirmed_counseling_university_preference
```

Core rule:

```text
Minimum profile determines the next counseling route.
It does not mean a rich recommendation profile is complete.
```

### Locked Route Model After S2

```text
Academic result known + no course direction + no university direction
→ course/pathway exploration

Academic result known + course direction known + no university direction
→ university exploration / comparison

Academic result known + university direction known + no course direction
→ course exploration within university context

Academic result known + course direction known + university direction known
→ recommendation / validation / comparison

Academic result known + pathway uncertainty dominant
→ pathway exploration / comparison
```

### Locked Counselor-Like Flow Behavior

Core principle:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

Default counselor-like navigation pattern:

```text
1. Reflect the student's current situation.
2. Identify the most useful counseling route or decision point.
3. Explain why that route, trade-off, or question matters.
4. Ask one purposeful next question or offer one clear next step.
```

The route-based flow decides where counseling should go. The counselor-like behavior layer decides how the AI should guide the student there.

### Locked Student Posture Context

Student posture is a non-state counseling context.

Possible posture values:

```text
just_browsing
lost_or_confused
course_first
university_first
pathway_first
comparison_oriented
validation_seeking
decision_ready
indecisive
constraint_driven
human_help_seeking
```

Student posture may influence tone, pacing, explanation, response mode, skill guidance, and next-step framing. It must not replace journey state, route context, recommendation readiness, preference strength, boundary status, or handoff status.

### Locked Decision-Support Micro-Loops

Decision-support behavior may appear in S3, S4, S5, or S8.

Supported micro-loops:

```text
clarify_tradeoff
narrow_options
reflect_blocker
decision_frame
stop_looping
```

### Locked S6 Milestone Behavior

S6 confirmed counseling preference should feel like a counseling milestone, not a database update.

When confirming a counseling preference, the AI should:

1. acknowledge progress
2. restate the confirmed counseling preference
3. clarify that this is not official application, registration, payment, enrollment, seat reservation, or CRM update
4. summarize why the option fits, if enough evidence exists
5. offer safe next steps

Safe next steps include:

1. compare one final alternative
2. take time to think or discuss with family
3. continue exploring related options
4. speak with a human counselor for official application or registration next steps

### Locked Recommendation Readiness

```text
R1. Not Ready to Recommend
R2. Ready for Directional Recommendation
R3. Ready for High-Quality Recommendation
```

Important distinction:

```text
Ranking/budget/location can improve R3 readiness.
They are not required for R2 directional recommendation.
```

### Locked Preference Ladder

```text
L1. Weak Interest
L2. Expressed Interest
L3. Expressed Preference
L4. Confirmed Counseling Preference
L5. Ready-to-Register / Apply Intent
```

The AI may guide up to L4 autonomously. L4 is not official action. L5 triggers handoff.

### Locked Handoff Triggers

```text
H1. Ready-to-Apply / Ready-to-Register Intent
H2. Official Action Request
H3. Payment / Seat / Enrollment Commitment
H4. Exception / Appeal / Waiver / Complex Eligibility
H5. Sensitive or High-Risk Context
H6. Student-Requested Human Support
```

### Locked Counseling Actions

```text
A1. Greet / Orient
A2. Collect Minimum Profile
A3. Explore Interest
A4. Explain Option
A5. Answer Factual Detour
A6. Recommend
A7. Compare / Shortlist
A8. Clarify Ambiguity
A9. Confirm Counseling Preference
A10. Support Deferral / Indecision
A11. Detect Boundary
A12. Prepare Handoff
```

---

## 4.3 Phase 2 — Counseling SOP & Skill Control

**Status:** Approved v1.2

Phase 2 defines how approved counseling behavior is packaged and enforced using `SKILL.md` artifacts.

### Locked Skill Stance

```text
Counselor-owned guidance.
Runtime-enforced boundaries.
Moderately guided AI behavior.
Structured metadata for safety, selection, validation, and audit.
```

v1.2 adds:

```text
Skills should guide the AI to sound like a counselor, not like a form, router,
or script reader.
```

### Locked Skill Layers

```text
1. Playbooks
2. Runtime Skills
3. Boundary Rules
```

### Locked Runtime Loading Model

```text
External SKILL.md Repository
  ↓
Skill Index Builder / Validator
  ↓
Approved Runtime Skill Index
  ↓
Counseling Runtime
```

### Locked Selection Model

```text
Semantic retrieval discovers candidate SKILL.md packages.
Structured metadata filtering determines validity.
Boundary rules are loaded deterministically.
```

Each turn normally selects:

1. zero or one playbook
2. one primary runtime skill
3. all mandatory boundary rules relevant to the context

### Locked Minimum-Profile Skill Behavior

The `minimum-profile-collection` runtime skill collects enough information to route the student:

```text
1. academic result status
2. course direction status
3. university direction status
```

It should not force universal collection of:

```text
ranking/prestige vs budget/value preference
preferred location
budget sensitivity
campus preference
intake/timeline
family/location constraint
```

Those may be captured if volunteered, but they are handled mainly by university exploration, comparison, recommendation refinement, and high-quality recommendation skills.

### Locked Counselor-Like Skill Guidance

Runtime skills should normally guide safe non-red-zone turns using:

```text
Reflect → Guide → Ask
```

Counselor-like metadata improves response quality. It does not authorize memory writes, official actions, or boundary exceptions.

### Locked Route-Aware Skill Metadata

Runtime skills may declare:

```text
applies_to_minimum_profile_routes
uses_interpretation_signals / uses_semantic_delta_signals
optional_fit_signals_to_collect
route_behavior_notes
student_postures_supported
counselor_response_modes
decision_support_modes
summary_checkpoint_required_when
milestone_behavior
```

v7.4 compatibility note:

```text
Existing `uses_interpretation_signals` metadata remains acceptable as a conceptual
field, but implementations should treat it as consuming accepted semantic artifacts
from AcceptedSemanticDelta and memory/current-truth context, not raw InterpretationResult.
```

### Locked Initial Runtime Skills

Recommended initial runtime skills:

1. `pre-registration-opening`
2. `minimum-profile-collection`
3. `route-detection-and-next-step`
4. `interest-exploration`
5. `course-program-exploration`
6. `course-exploration-within-university-context`
7. `pathway-exploration`
8. `university-exploration`
9. `factual-detour-answering`
10. `directional-recommendation`
11. `high-quality-recommendation`
12. `shortlist-comparison`
13. `preference-confirmation`
14. `deferral-indecision`
15. `counseling-deadlock`
16. `resume-recovery`
17. `ready-to-register-handoff`

### Locked Precedence

```text
1. Platform safety/compliance policy
2. Phase 0 autonomy boundary
3. Mandatory boundary rules
4. Operating context snapshot
5. Runtime skill metadata
6. Runtime skill Markdown guidance
7. Playbook metadata
8. Playbook Markdown guidance
9. Examples, tone, and response style
```

Boundary rules override normal skills. Metadata overrides Markdown. No skill can create official authority.

---

## 4.4 Phase 3 — Autonomous Runtime Strategy

**Status:** Approved v1.2, with v7.4 roadmap terminology and placement update

Phase 3 defines the prototype-first runtime strategy.

### Locked Runtime Style

Original Phase 3 v1.2 wording:

```text
Deterministic shell + AI interpretation core + AI counseling core.
```

v7.4 terminology alignment:

```text
Deterministic shell + AI semantic delta extraction core + AI counseling core.
```

This does not require changing the Phase 3 architecture immediately. It updates the semantic artifact and memory/state placement consumed inside Checkpoint 1.

### Locked Principle

```text
AI proposes interpretation/semantic deltas and counseling outputs.
Platform validates interpretation/semantic deltas and counseling outputs.
Platform commits only validated outputs.
```

v1.2 counselor-like principle remains:

```text
Route context decides where counseling should go.
Counselor response mode decides how the AI should guide the student there.
Boundary rules still override both.
```

### Updated Checkpoint 1 Placement

Old v1.2 contract:

```text
AIInterpretationClient
→ InterpretationValidator
→ AcceptedInterpretation
```

Updated v7.4 contract:

```text
AISemanticDeltaExtractor
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
→ MemoryStateService.commitPreResponseStudentMemory()
→ CurrentTruthProjector
→ CurrentTruthProjection
```

Checkpoint 1 should now conceptually run:

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
10. Run BoundaryResolver
11. Build/update accepted OperatingContext
12. Resolve profile completeness and minimum profile route from CurrentTruthProjection
13. Resolve student posture context from accepted runtime-only posture signals when available
14. Resolve counselor response mode and decision-support mode when needed
15. Select valid route-aware and counselor-guidance-aware SKILL.md artifacts
16. Call KnowledgeGateway if accepted runtime-only knowledge need signals or selected skill require factual knowledge
17. Compose ExecutionContext with current truth, route context, response mode, selected skill guidance, and boundary rules
18. Call AIExecutionClient
19. Validate AIExecutionResult, including counselor-like response consistency
20. If invalid, retry response once without repeating pre-response memory commit
21. If valid, commit post-response AI-produced outputs through MemoryStateService
22. Write structured audit events
23. Return final response
```

### Updated Runtime Data Contracts

Phase 3 runtime contracts should now include:

1. `TurnInput`
2. `FastBoundarySignal`
3. `SemanticDeltaResult`
4. `AcceptedSemanticDelta`
5. `MemoryIngestionDecision`
6. `DurableMemoryEvent`
7. `CurrentTruthProjection`
8. `BoundaryResult`
9. `OperatingContext`
10. `SkillSelectionResult`
11. `ExecutionContext`
12. `AIExecutionResult`
13. `ValidationResult`
14. `MemoryCommitResult`
15. `AuditEvent`

`InterpretationResult` and `AcceptedInterpretation` should be treated as legacy names superseded by Phase 4 v1.3.

### Locked Operating Context Ownership Update

The accepted operating context still includes route-aware and counselor-like fields:

```text
current_main_state
overlay_state
resume_target_state
current_zone
primary_counseling_action
profile_completeness
minimum_profile_route
academic_result_status
course_direction_status
university_direction_status
recommendation_readiness
preference_strength
active_student_direction
quality_context_summary
student_posture
counselor_response_mode
decision_support_mode
summary_checkpoint_status
milestone_confirmation_status
unresolved_decision_point
handoff_status
next_best_counseling_move
```

v7.4 ownership update:

```text
profile_completeness, minimum_profile_route, academic_result_status,
course_direction_status, university_direction_status, recommendation_readiness,
preference_strength, active_student_direction, quality_context_summary,
decision blockers, and handoff readiness context should be derived by the
platform from CurrentTruthProjection and current-turn accepted semantic artifacts,
not owned directly by the LLM extractor.
```

### Locked Counselor Response Modes

```text
standard
reassuring_orientation
route_explanation
decision_support
summary_checkpoint
milestone_confirmation
clarify_once
handoff_safe
```

Runtime rule:

```text
BoundaryResult can override counselorResponseMode.
If BoundaryResult.finalZone = red, counselorResponseMode = handoff_safe.
```

---

## 4.5 Prototype Runtime Checkpoint

**Status:** Runtime vertical slice proven; not production-functional

The prototype proved:

```text
student message
-> boundary scan
-> operating context snapshot
-> SKILL.md metadata selection
-> knowledge gateway when needed
-> AIExecutionResult proposal
-> validation
-> validated commit only
-> audit event
```

Latest checkpoint:

```text
16/16 tests passing
```

The prototype proved the control loop but intentionally left these shallow:

1. AI extraction and classification
2. counseling quality
3. skill body prompting
4. durable memory
5. production knowledge
6. CRM and official truth

Phase 4 v1.3 addresses interpretation/extraction through semantic deltas. Phase 5 v1.0 addresses durable student memory and counseling state.

v7.4 implication:

```text
The existing prototype proves control.
It does not yet prove semantic delta extraction, MemoryStateService, MemoryEventStore,
AuditEventStore, current-truth derivation, or pre-response/post-response memory commit timing.
The next prototype/evaluation work should add Phase 4 v1.3 + Phase 5 v1.0 contracts
without weakening the control loop.
```

---

## 4.6 Phase 4 — Interpretation & Extraction Layer

**Status:** Approved/current v1.3

Phase 4 defines how raw student language becomes validated semantic deltas and runtime-only signals before downstream modules consume them.

### Locked Principle

```text
AI may extract and interpret.
Platform validates semantic delta candidates and runtime-only signal candidates.
Only accepted semantic artifacts may influence downstream runtime behavior.
```

### Locked Boundary

```text
AcceptedSemanticDelta is not durable memory.
AcceptedSemanticDelta is not CRM truth.
AcceptedSemanticDelta is not official application, registration, enrollment,
payment, seat, or business-status truth.
```

### Locked Design Stance

```text
Split safety scan + AI semantic delta extraction + platform validation.
```

### Locked Runtime Placement With Phase 5

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
MemoryStateService
  ↓
CurrentTruthProjector
  ↓
BoundaryResolver
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
MemoryStateService post-response commit
  ↓
AuditEventStore
```

### Locked Raw LLM Proposal Contract

```ts
type SemanticDeltaResult = {
  memoryDeltaCandidates: {
    flowDrivingDeltas: {
      academicResults: AcademicResultDelta[];
      coursesConsidering: CourseDelta[];
      confirmedCounselingCoursePreferences?: CourseDelta;
      universitiesConsidering: UniversityDelta[];
      confirmedCounselingUniversityPreferences?: UniversityDelta;
      pathwaysConsidering: PathwayDelta[];
      confirmedCounselingPathwayPreferences?: PathwayDelta;
    };
    qualityEnhancingDeltas: QualityEnhancingDelta[];
  };
  runtimeOnlySignalCandidates: RuntimeOnlySignalCandidate[];
};
```

### Locked Accepted Artifact

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

### Locked v1.3 Signal Scope

Initial Phase 4 v1.3 implementation produces:

1. `memoryDeltaCandidates.flowDrivingDeltas`
2. `memoryDeltaCandidates.qualityEnhancingDeltas`
3. `runtimeOnlySignalCandidates.boundary`
4. `runtimeOnlySignalCandidates.knowledge_need`
5. `runtimeOnlySignalCandidates.student_posture`
6. `runtimeOnlySignalCandidates.ambiguity`

Deferred:

1. journey state candidate
2. primary action candidate
3. recommendation readiness candidate
4. final preference strength candidate
5. final route readiness
6. final minimum profile signals
7. durable contradiction/correction mutation
8. broad emotion/friction signal unrelated to counseling posture

### Locked v7.4 Consumption Rule

```text
Phase 4 produces proposed semantic changes.
Phase 5 decides what becomes durable memory.
CurrentTruthProjection derives accumulated truth.
BoundaryResolver derives safety behavior.
OperatingContextManager derives runtime direction.
```

---

## 4.7 Phase 5 — Student Memory & Counseling State

**Status:** Approved/current v1.0

Phase 5 defines how accepted semantic memory deltas become durable counseling memory events, derived current truth, and memory-backed runtime state.

### Locked Core Principle

```text
Accepted semantic deltas are not durable memory.
Durable memory is created only through Phase 5 memory ingestion and validation.
Current truth is derived from durable memory events.
Operating context is derived from current truth and current-turn runtime artifacts.
Official CRM/application truth remains externally owned.
```

### Locked Hybrid Memory Model

```text
DurableMemoryEvents are the source of counseling memory truth.
CurrentTruthProjection is a deterministic derived view.
Runtime operating context is derived from current truth and current-turn artifacts.
```

### Locked Pipeline

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

### Locked Conceptual Layers

```text
1. Durable memory events
2. Current truth projection
3. Runtime-only turn context
4. Audit/evaluation records
5. Read-only CRM/application references
```

Only two are durable Phase 5 stores:

```text
1. MemoryEventStore
2. AuditEventStore
```

The rest are derived or fetched per turn.

### Locked Durable Storage Boundary

```text
Phase 5 durably stores only MemoryEvents and AuditEvents.

CurrentTruthProjection is derived every turn.
RuntimeTurnContext is assembled every turn.
CRM/application status is externally owned and may be read later through a future adapter.
```

A projection cache may be added later for performance, but it must remain non-authoritative and rebuildable.

### Locked DurableMemoryEvent Model

Every durable memory event uses:

```text
Common event envelope + typed domain payload.
```

The envelope includes:

1. identity
2. student/conversation/turn/message source
3. memory category
4. operation
5. typed payload
6. confidence
7. evidence
8. semantic/source traceability
9. merge/projection intent
10. relationship metadata
11. official-truth boundary
12. timestamp

### Locked Memory Categories

Initial durable memory categories:

1. AcademicMemory
2. CourseDirectionMemory
3. UniversityDirectionMemory
4. PathwayDirectionMemory
5. CounselingPreferenceMemory
6. RejectedOptionMemory
7. ConstraintMemory
8. QualityContextMemory
9. ConcernOrBlockerMemory
10. DecisionSupportMemory
11. RecommendationInteractionMemory
12. HandoffReadinessMemory

Audit-only signal records belong to `AuditEventStore`, not normal durable student memory.

### Locked Commit Classification

```text
Pre-response durable memory:
  validated student-stated memory.

Post-response durable memory:
  AI-produced counseling outputs after response validation and delivery.

Runtime-only:
  posture, ambiguity, knowledge need, response mode, selected skill, temporary detour.

Audit-only:
  rejections, downgrades, blocked outputs, validation failures, retries, boundary decisions.

Forbidden:
  official application, registration, payment, enrollment, seat, CRM, approval, exception,
  or official document truth.
```

### Locked Commit Timing

```text
Validated student-stated memory may commit before response generation.
After commit, CurrentTruthProjection is re-derived and consumed by BoundaryResolver,
OperatingContextManager, SkillControlService, and AI execution.

AI-produced counseling outputs commit only after response validation.
If response validation fails, retry response generation once without repeating
pre-response memory commit.
```

### Locked CurrentTruthProjection Contract

`CurrentTruthProjection` is a derived per-turn runtime contract, not a durable store.

It contains memory-derived counseling truth:

1. academic truth
2. direction truth
3. preference truth
4. route truth
5. recommendation readiness
6. quality context
7. decision context
8. handoff readiness

It excludes:

1. runtime-only posture
2. journey/action state
3. selected skill
4. knowledge signals
5. audit-only records
6. raw LLM output
7. official CRM/application truth

### Locked Operation-Aware Merge Policy

Phase 5 v1 executes only:

```text
add_new
```

The contract reserves future operations:

```text
correction
removal
contradiction
confidence_change
preference_upgrade
preference_downgrade
stale_memory_replacement
```

v1 may detect and audit these when obvious, but full resolution is deferred.

### Locked Failure Behavior

Phase 5 uses risk-tiered failure behavior:

```text
Low-risk failures:
  continue cautiously.

Flow-driving failures:
  clarify or reduce confidence.

Boundary/handoff failures:
  do not continue normal counseling.

Projection uncertainty:
  block high-impact recommendation or confirmation.

Response validation failure:
  retry response once without repeating pre-response memory commit.

Official-truth violations:
  hard reject and audit.
```

### Locked v1 Implementation Slice

Phase 5 v1 should implement:

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

Only `add_new` is fully active in v1.

---

## 5. Updated High-Level Target Architecture

Roadmap v7.4 target architecture:

```text
Student / Prospect
  ↓
Conversational Interface
  ↓
CounselingTurnOrchestrator
  ↓
FastBoundarySignalScanner
  ↓
AISemanticDeltaExtractor
  ↓
SemanticDeltaValidator
  ↓
AcceptedSemanticDelta
  ↓
MemoryStateService
  ├── MemoryIngestionPolicy
  ├── MemoryEventValidator
  ├── MemoryEventStore
  ├── CurrentTruthProjector
  └── AuditEventStore integration
  ↓
CurrentTruthProjection
  ↓
BoundaryResolver
  ↓
OperatingContextManager
  ↓
SkillControlService
  ├── Approved SKILL.md Runtime Index
  ├── Runtime Skills
  ├── Playbooks
  └── Boundary Rules
  ↓
KnowledgeGateway
  ├── source registry
  ├── source authority policy
  ├── freshness policy
  ├── answerability policy
  └── citation / caveat contract
  ↓
ExecutionContextComposer
  ↓
AIExecutionClient
  ↓
ValidationPipeline
  ├── boundary validation
  ├── memory/output validation
  ├── recommendation validation
  ├── knowledge-grounding validation
  ├── counselor-like response validation
  └── official-truth blocking
  ↓
OutputCommitService
  ↓
MemoryStateService.commitPostResponseAIOutputs()
  ↓
AuditEventStore
  ↓
Student Response
```

### Architectural Ownership Rules

```text
Phase 4 owns semantic extraction and validation.
Phase 5 owns durable counseling memory and derived current truth.
BoundaryResolver owns final zone and handoff behavior.
OperatingContextManager owns accepted runtime state.
SkillControlService owns skill selection and boundary rule loading.
KnowledgeGateway owns factual answerability and source governance.
ValidationPipeline owns response/output validation.
CRM remains externally owned official truth.
```

### Durable Stores After Phase 5

```text
MemoryEventStore:
  durable counseling memory events only.

AuditEventStore:
  validation, rejection, downgrade, boundary, retry, blocked-output, projection,
  skill-selection, and traceability audit only.
```

No separate durable stores are required yet for:

```text
CurrentTruthProjection
RuntimeTurnContext
CRMReferenceView
```

---

## 6. Updated Exploration Phases

---

## Phase 0 — Bounded Autonomy Baseline

**Status:** Approved v1.0  
**Primary Output:** Phase 0 bounded autonomy baseline spec

### Core Question

```text
How autonomous should the AI counselor be, and where must autonomy stop?
```

### Locked Output

The platform is AI-first and autonomous by default, but conservative at official, sensitive, complex, and human-requested boundaries.

---

## Phase 1 — Counseling Operating Model

**Status:** Approved v1.2  
**Primary Output:** Phase 1 autonomous counseling operating model spec

### Core Question

```text
What counseling journey should the AI autonomously guide before red-zone handoff is required?
```

### Locked Output

Phase 1 defines:

1. flexible 9-state pre-registration journey
2. route-based minimum counseling profile
3. preference ladder L1–L5
4. recommendation readiness R1–R3
5. handoff trigger model H1–H6
6. counselor-like flow principle
7. decision-support micro-loops
8. milestone behavior for confirmed counseling preference

### v7.4 Compatibility

Phase 5 now derives minimum profile status, preference strength, recommendation readiness, blockers, and handoff readiness from durable memory events and current-turn semantic artifacts.

---

## Phase 2 — Behavior Control, SOP & Skill System

**Status:** Approved v1.2  
**Primary Output:** Phase 2 counseling SOP and skill control spec

### Core Question

```text
How do we turn the Phase 1 operating model into governed SOPs and skills that
business users can approve, maintain, test, and safely release?
```

### Locked Output

Phase 2 defines:

1. counselor-owned SKILL.md packages
2. playbook/runtime skill/boundary rule layering
3. route-aware runtime skill metadata
4. allowed and forbidden memory outputs
5. mandatory boundary rules
6. counselor-like response guidance
7. decision-support and milestone guidance
8. skill selection and validation rules

### v7.4 Compatibility

Future skill metadata should consume:

```text
AcceptedSemanticDelta
CurrentTruthProjection
OperatingContext
BoundaryResult
```

not raw transcript or raw semantic proposals.

Skills may declare `uses_semantic_delta_signals` and `uses_current_truth_fields` in future versions.

---

## Phase 3 — Autonomous Runtime Strategy

**Status:** Approved v1.2, updated by roadmap terminology  
**Primary Output:** Phase 3 runtime strategy spec and prototype runtime checkpoint

### Core Question

```text
What runtime architecture should execute the Phase 1 counseling journey and
Phase 2 SKILL.md control system while preserving Phase 0 bounded autonomy,
deterministic boundaries, validation, and auditability?
```

### Locked Output

Phase 3 uses:

```text
Deterministic shell + AI semantic delta extraction core + AI counseling core.
```

The runtime remains two-checkpoint:

```text
Checkpoint 1:
  pre-generation control.

Checkpoint 2:
  pre-commit response/output validation.
```

### v7.4 Runtime Update

The runtime should place Phase 5 after `AcceptedSemanticDelta` and before `BoundaryResolver`:

```text
AcceptedSemanticDelta
→ MemoryStateService.commitPreResponseStudentMemory()
→ CurrentTruthProjector
→ CurrentTruthProjection
→ BoundaryResolver
```

Response retry must not duplicate pre-response memory commits.

---

## Phase 4 — Interpretation & Extraction Layer

**Status:** Approved/current v1.3  
**Primary Output:** Phase 4 interpretation and extraction layer spec v1.3

### Core Question

```text
How should the platform extract student-stated meaning from natural language so
runtime decisions, memory eligibility, boundary checks, knowledge routing,
handoff preparation, and audit evidence are based on validated semantic deltas
rather than scattered heuristics, uncontrolled summaries, or LLM-owned state?
```

### Locked Output

Phase 4 defines:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

It separates:

```text
memoryDeltaCandidates
runtimeOnlySignalCandidates
```

### v7.4 Compatibility

Phase 4 no longer owns:

1. durable memory
2. current truth
3. minimum profile completion
4. route readiness
5. final preference strength
6. final recommendation readiness
7. CRM/application truth

Phase 5 owns memory and current-truth derivation.

---

## Phase 5 — Student Memory & Counseling State

**Status:** Approved/current v1.0  
**Primary Output:** Phase 5 student memory and counseling state spec v1.0

### Core Question

```text
How should accepted semantic memory deltas become durable student memory,
current truth, history, and counseling state while preserving Phase 0 official-action
boundaries and Phase 4 runtime-only signal separation?
```

### Locked Output

Phase 5 defines:

1. hybrid memory truth model
2. durable memory event model
3. current truth projection contract
4. conceptual memory layers
5. durable store boundary
6. `MemoryStateService`
7. `MemoryIngestionPolicy`
8. `MemoryEventValidator`
9. `MemoryEventStore`
10. `CurrentTruthProjector`
11. `AuditEventStore`
12. operation-aware merge semantics
13. v1 `add_new` implementation slice
14. response retry and commit timing
15. risk-tiered failure behavior
16. official-truth separation
17. layered validation and test strategy

### v1 Active Scope

```text
Active operation:
  add_new

Reserved operations:
  correction
  removal
  contradiction
  confidence_change
  preference_upgrade
  preference_downgrade
  stale_memory_replacement
```

### Locked Durable Stores

```text
MemoryEventStore
AuditEventStore
```

### Locked Derived Views

```text
CurrentTruthProjection:
  derived every turn from MemoryEventStore.

RuntimeTurnContext:
  assembled per turn.

CRM/application references:
  future read-only adapter, not Phase 5 storage.
```

---

## Phase 6 — Business Knowledge & Source Governance

**Status:** Next active exploration  
**Primary Output:** Future Phase 6 business knowledge and source governance spec

### Core Question

```text
How should the platform retrieve, govern, prioritize, validate, and cite business
knowledge so factual counseling, recommendations, comparisons, and handoff context
are grounded in approved sources instead of model memory or uncontrolled documents?
```

### Why Phase 6 Comes Next

Phase 4 now identifies runtime-only knowledge needs. Phase 5 now provides memory-derived current truth. The next missing layer is governed factual knowledge.

The runtime can know:

```text
what the student said
what the current counseling truth is
what route the student is in
what knowledge need exists
```

But it still needs to know:

```text
which source is authoritative
whether a fact is fresh enough
whether an answer is safe to provide
whether a missing/conflicting fact requires caveat or handoff
how to cite or summarize sources
which facts are internal-only
```

### Phase 6 Must Consume

1. accepted runtime-only `knowledge_need` signals
2. `CurrentTruthProjection`
3. accepted operating context
4. selected skill requirements
5. boundary result
6. audit context

### Phase 6 Must Define

1. knowledge source taxonomy
2. source authority hierarchy
3. source freshness rules
4. answerability policy
5. uncertainty and caveat policy
6. source conflict handling
7. internal-only vs student-safe knowledge boundary
8. document/source metadata model
9. knowledge retrieval contract
10. knowledge result contract
11. citation/source evidence contract
12. source versioning and auditability
13. factual detour handling
14. recommendation knowledge dependencies
15. handoff knowledge dependencies
16. fallback behavior when knowledge is missing or conflicting

### Phase 6 Should Not Define

1. final recommendation scoring
2. final human handoff workflow
3. CRM write integration
4. durable student memory schema
5. full production data warehouse
6. public web crawling strategy unless explicitly approved later

### v7.4 Revisions to Phase 6

Phase 6 should no longer treat knowledge retrieval as independent of memory.

It should consume `CurrentTruthProjection` to answer questions like:

```text
Which course/university/pathway is the student asking about?
What academic result context matters?
Which constraints should filter factual knowledge?
Is this a detour or recommendation-critical knowledge need?
Does this knowledge need affect R2 directional advice or R3 high-quality recommendation?
```

Phase 6 should also write audit events for:

1. knowledge source selected
2. source authority decision
3. source freshness warning
4. conflicting source detected
5. answerability insufficient
6. internal-only source withheld
7. knowledge caveat emitted
8. handoff triggered by missing/conflicting critical fact

### Suggested Phase 6 Exploration Starting Point

Phase 6 should begin with Core Discovery around:

1. source authority hierarchy
2. freshness and update expectations
3. source conflict behavior
4. internal-only knowledge boundaries
5. recommendation-critical vs detour knowledge needs

---

## Phase 7 — Recommendation & Decision Support Automation

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Future recommendation and decision-support automation spec

### Core Question

```text
How should the AI generate, compare, explain, validate, and remember course,
university, and pathway recommendations without over-claiming certainty or
crossing into official admission/application truth?
```

### Phase 7 Must Consume

1. `CurrentTruthProjection`
2. `RecommendationReadinessView`
3. `QualityContextTruthView`
4. `DecisionContextTruthView`
5. `RejectedOptionMemory`
6. governed knowledge results from Phase 6
7. selected SKILL.md recommendation skill
8. boundary result
9. prior `RecommendationInteractionMemory`
10. audit events

### Phase 7 Must Define

1. recommendation candidate model
2. recommendation basis and fit reason model
3. R2 directional recommendation behavior
4. R3 high-quality recommendation behavior
5. recommendation confidence model
6. missing fit signal behavior
7. assumption and caution model
8. rejected-option suppression rules
9. comparison and shortlist model
10. student reaction handling
11. recommendation lifecycle
12. recommendation validation rules
13. recommendation audit events
14. post-response `RecommendationInteractionMemory` commit rules
15. decision-support micro-loop integration

### v7.4 Revisions to Phase 7

Recommendations must not inspect raw memory events directly unless needed for evidence trace. They should primarily consume `CurrentTruthProjection`.

AI-produced recommendation records should commit only after response validation and delivery:

```text
recommendation_shown
recommendation_assumptions
recommendation_confidence
comparison_conclusion
shortlist_generated
safe_next_step_offered
```

Recommendation logic must preserve:

```text
R2 directional recommendation:
  academic result known + at least one usable direction.

R3 high-quality recommendation:
  academic result and direction are clear enough + enough fit signals.
```

Ranking, budget, location, intake, and family constraints improve R3 but are not universal gates for R2.

### Phase 7 Must Not

1. promise admission eligibility approval
2. claim guaranteed acceptance
3. treat recommendation as official registration/application progress
4. override hard constraints without explanation
5. recommend rejected options unless the student reconsiders
6. use stale or ungoverned source facts

---

## Phase 8 — Registration Boundary & Human Handoff

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Future handoff and registration-boundary spec

### Core Question

```text
How should the system detect readiness for official next steps, stop autonomous
counseling safely, and prepare high-quality human handoff context without performing
official actions?
```

### Phase 8 Must Consume

1. `HandoffReadinessMemory`
2. `HandoffReadinessTruthView`
3. `BoundaryResult`
4. accepted runtime-only boundary signals
5. `CurrentTruthProjection`
6. confirmed counseling preference
7. latest recommendation and comparison context
8. unresolved blockers
9. audit evidence
10. selected handoff skill/boundary rules

### Phase 8 Must Define

1. handoff package structure
2. handoff routing rules
3. handoff reason taxonomy
4. handoff summary generation rules
5. human counselor queue/interface assumptions
6. safe contact collection boundary, if approved
7. student-facing handoff wording
8. handoff audit records
9. post-handoff AI continuation rules
10. human-return-to-AI rules
11. handoff failure behavior
12. CRM handoff reference compatibility

### v7.4 Revisions to Phase 8

Handoff readiness is now a counseling memory category, not official CRM truth.

Allowed memory:

```text
student wants to apply now
student requested a human counselor
handoff required
handoff reason
handoff summary prepared
```

Forbidden memory:

```text
application submitted
registration completed
payment confirmed
seat reserved
enrollment confirmed
CRM status updated
```

Handoff summaries should be generated from:

```text
CurrentTruthProjection
validated AI outputs
MemoryEventStore evidence references
AuditEventStore safety traces
```

not uncontrolled conversation summaries.

---

## Phase 9 — CRM Integration Model

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Future CRM integration model spec

### Core Question

```text
How should the platform integrate with CRM/application systems while preserving
the separation between counseling memory and official business truth?
```

### Phase 9 Must Consume

1. Phase 0 official-action boundaries
2. Phase 5 official-truth separation
3. handoff workflow decisions from Phase 8
4. CRM ownership requirements
5. human counselor operations requirements
6. audit and traceability requirements

### Phase 9 Must Define

1. CRM identity mapping
2. lead/application reference model
3. read-only CRM context adapter
4. official status display rules
5. human-owned CRM write workflow
6. AI-prohibited write operations
7. handoff-to-CRM linkage
8. CRM source-of-truth rules
9. CRM audit logging
10. conflict behavior between counseling memory and CRM truth
11. privacy/permission boundaries

### v7.4 Revisions to Phase 9

Phase 5 intentionally does not create a durable `CRMReferenceView` store.

CRM/application status should be introduced later as:

```text
future read-only adapter first
human-owned write workflow later
```

Counseling memory may reference official records, but must not project, create, or overwrite official truth.

CRM official statuses include:

```text
application status
registration status
payment status
enrollment status
seat status
assigned counselor
official documents
scholarship/eligibility/exception decisions
```

These remain externally owned.

---

## Phase 10 — Guardrails, Policy & Boundary Enforcement

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Future guardrails and policy enforcement spec

### Core Question

```text
What cross-cutting guardrail system should enforce safety, policy, official-action
separation, memory correctness, knowledge grounding, and recommendation/handoff
boundaries across the runtime?
```

### Phase 10 Must Consume

1. Phase 0 autonomy zones
2. Phase 2 boundary rule metadata
3. Phase 4 semantic validation events
4. Phase 5 memory ingestion and validation events
5. `CurrentTruthProjection`
6. boundary and handoff audit records
7. knowledge governance decisions from Phase 6
8. recommendation decisions from Phase 7
9. handoff decisions from Phase 8
10. CRM integration boundaries from Phase 9

### Phase 10 Must Define

1. policy taxonomy
2. official-action guardrails
3. memory pollution guardrails
4. runtime-only signal guardrails
5. knowledge hallucination guardrails
6. recommendation overclaim guardrails
7. handoff under-capture guardrails
8. CRM write/block guardrails
9. red-team scenario handling
10. guardrail evaluation hooks
11. guardrail escalation behavior
12. centralized policy versioning

### v7.4 Revisions to Phase 10

Guardrails must now explicitly cover Phase 5 memory boundaries:

1. weak interest cannot become confirmed counseling preference
2. confirmed counseling preference cannot become application/registration truth
3. runtime-only posture cannot become durable identity memory
4. soft preference cannot silently become hard constraint
5. rejected/downgraded candidates cannot become current truth
6. AuditEventStore cannot become student memory
7. CRM status cannot be projected from counseling memory
8. response retry cannot duplicate memory commits

---

## Phase 11 — Evaluation, Simulation & Quality Monitoring

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Future evaluation and monitoring spec

### Core Question

```text
How should the platform evaluate whether autonomous counseling is safe, useful,
counselor-like, grounded, memory-correct, and boundary-compliant across real and
simulated conversations?
```

### Phase 11 Must Consume

1. AuditEventStore
2. MemoryEventStore
3. CurrentTruthProjection outputs
4. semantic validation results
5. memory ingestion decisions
6. projection warnings
7. boundary decisions
8. skill selection decisions
9. knowledge gateway decisions
10. recommendation outputs
11. handoff outcomes
12. CRM integration events later

### Phase 11 Must Define

1. evaluation dataset model
2. simulation scenario model
3. memory correctness metrics
4. current-truth derivation tests
5. boundary recall/precision metrics
6. under-handoff review workflow
7. over-handoff review workflow
8. recommendation quality rubric
9. knowledge grounding rubric
10. counselor-like flow rubric
11. official-truth separation tests
12. regression test suite
13. model/provider comparison methodology
14. live monitoring signals
15. human QA workflow

### v7.4 Revisions to Phase 11

Phase 11 must include dedicated Phase 5 evaluations:

1. memory ingestion tests
2. memory event validation tests
3. MemoryEventStore idempotency tests
4. CurrentTruthProjector tests
5. commit timing tests
6. runtime-only/audit separation tests
7. official-truth separation tests
8. failure behavior tests
9. end-to-end counseling journey tests
10. response retry no-duplicate-commit tests

Minimum acceptance criteria inherited from Phase 5:

```text
1. Accepted student-stated deltas become validated DurableMemoryEvents.
2. DurableMemoryEvents derive correct CurrentTruthProjection each turn.
3. Current truth supports minimum profile route, preference strength, and recommendation readiness.
4. Response retry does not duplicate memory events.
5. Runtime-only signals do not pollute durable memory.
6. Official business truth is never committed to counseling memory.
7. AuditEventStore explains rejected, downgraded, blocked, retried, and handoff decisions.
```

---

## Phase 12 — Admin, Knowledge & Skill Operations

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Future admin and operations model spec

### Core Question

```text
What operational tooling do counselors, business users, and technical operators
need to manage skills, knowledge sources, audits, evaluations, and safe rollout?
```

### Phase 12 Must Define

1. skill package release workflow
2. knowledge source update workflow
3. source conflict review workflow
4. audit review surfaces
5. memory incident review workflow
6. blocked output review workflow
7. handoff quality review
8. evaluation dashboard requirements
9. rollback and version pinning
10. counselor feedback loop
11. model/provider change review
12. production incident procedures

### v7.4 Revisions to Phase 12

Admin/ops should eventually expose:

1. memory event trace by student/turn
2. current truth derivation explanation
3. rejected/downgraded memory candidates
4. blocked official-action outputs
5. response retry records
6. projection warnings
7. handoff readiness evidence
8. skill/version/hash traceability
9. knowledge source/version evidence

Admin tooling must not allow casual edits that turn counseling memory into official CRM truth.

---

## Phase 13 — Prototype Vertical Slice

**Status:** Prototype checkpoint proven; next build should add Phase 4/5 contracts  
**Primary Output:** Prototype runtime vertical slice and test harness

### Core Question

```text
How should the approved architecture be proven in a running vertical slice before
production hardening?
```

### Proven So Far

The current prototype has proven:

1. boundary scan
2. operating context snapshot
3. SKILL.md metadata selection
4. knowledge gateway placement
5. AIExecutionResult validation
6. blocked official-action outputs
7. audit event writing
8. 16/16 tests passing

### Not Yet Proven

The prototype has not yet proven:

1. AISemanticDeltaExtractor
2. SemanticDeltaValidator
3. AcceptedSemanticDelta
4. MemoryStateService
5. MemoryIngestionPolicy
6. MemoryEventValidator
7. MemoryEventStore
8. CurrentTruthProjector
9. AuditEventStore as structured store
10. pre-response student-stated memory commit
11. post-response AI-produced output commit
12. response retry without duplicate memory commit
13. full Phase 5 current-truth derivation
14. governed production knowledge
15. final recommendation lifecycle
16. final handoff workflow
17. CRM integration

### v7.4 Prototype Build Target

The next prototype slice should prove:

```text
Student message
→ FastBoundarySignalScanner
→ AISemanticDeltaExtractor or deterministic semantic-delta mock
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
→ MemoryStateService.commitPreResponseStudentMemory()
→ MemoryEventStore
→ CurrentTruthProjector
→ BoundaryResolver
→ OperatingContextManager
→ SkillControlService
→ AIExecutionClient
→ ValidationPipeline
→ response retry if needed
→ MemoryStateService.commitPostResponseAIOutputs()
→ AuditEventStore
```

### Prototype v7.4 Test Additions

Add tests for:

1. semantic delta accepted memory commits
2. weak interest not over-promoted
3. confirmed counseling preference remains non-official
4. apply/register intent becomes handoff readiness only
5. runtime-only posture does not become durable memory
6. response retry does not duplicate memory
7. AI recommendation record commits only after valid response
8. current truth derives minimum profile route
9. current truth derives recommendation readiness
10. audit captures rejected/downgraded/blocked/retry events

---

## Phase 14 — Production Hardening Roadmap

**Status:** Future exploration, revised by Phase 5  
**Primary Output:** Production hardening and rollout roadmap

### Core Question

```text
What must be hardened before production deployment, and in what order should the
platform move from prototype to safe live usage?
```

### Production Hardening Areas

1. production-grade semantic extraction reliability
2. memory/state persistence and backup
3. privacy, retention, and deletion policy
4. source governance and freshness operations
5. recommendation validation and quality monitoring
6. human handoff workflow reliability
7. CRM read/write separation
8. policy/guardrail versioning
9. evaluation dashboards
10. incident review workflow
11. model/provider failover
12. cost and latency controls
13. security and access control
14. observability and audit retention
15. staged rollout and rollback

### v7.4 Revisions to Production Hardening

Production hardening must include:

1. MemoryEventStore durability and idempotency
2. AuditEventStore retention and queryability
3. CurrentTruthProjector performance and determinism
4. projection cache strategy, if needed
5. memory privacy/deletion policy
6. correction/removal UX
7. contradiction and stale replacement handling
8. official-truth separation tests
9. response retry loop safety
10. memory/audit access control

---

## 7. Updated Near-Term Build Order

Roadmap v7.4 recommends this near-term order:

### Step 1 — Preserve Current Prototype Baseline

Keep the existing prototype test suite passing.

```text
Goal:
  Do not weaken the proven bounded-autonomy control loop.
```

### Step 2 — Add Phase 4 v1.3 Semantic Delta Contract

Implement or mock:

1. `SemanticDeltaResult`
2. `SemanticDeltaValidator`
3. `AcceptedSemanticDelta`
4. memory delta candidates
5. runtime-only signal candidates
6. rejected/downgraded semantic candidates

```text
Goal:
  Replace shallow extraction/classification with governed semantic artifacts.
```

### Step 3 — Add Phase 5 v1.0 MemoryStateService

Implement:

1. `MemoryStateService`
2. `MemoryIngestionPolicy`
3. `MemoryEventValidator`
4. `MemoryEventStore`
5. `CurrentTruthProjector`
6. `AuditEventStore`

```text
Goal:
  Accepted student-stated deltas become validated DurableMemoryEvents and derived current truth.
```

### Step 4 — Update Runtime Order

Move from:

```text
AcceptedSemanticDelta
→ BoundaryResolver
```

to:

```text
AcceptedSemanticDelta
→ MemoryStateService.commitPreResponseStudentMemory()
→ CurrentTruthProjector
→ BoundaryResolver
```

```text
Goal:
  Boundary, operating context, skills, and response generation consume fresh current truth.
```

### Step 5 — Add Commit Timing and Retry Tests

Implement:

1. pre-response student-stated memory commit
2. post-response AI-produced output commit
3. response retry once
4. no duplicate memory commit on retry
5. post-response output not committed if response blocked

```text
Goal:
  Prove the user's selected Option A memory timing safely.
```

### Step 6 — Update Skill Selection Inputs

Make skill selection consume:

1. `CurrentTruthProjection`
2. `BoundaryResult`
3. `OperatingContext`
4. accepted runtime-only posture/ambiguity signals

```text
Goal:
  Route-aware skill selection uses memory-derived truth, not raw transcript or LLM-owned state.
```

### Step 7 — Begin Phase 6 Exploration

Explore business knowledge and source governance.

```text
Goal:
  Define how factual counseling and recommendations are grounded in approved,
fresh, source-prioritized business knowledge.
```

---

## 8. Current Open Risks

Roadmap v7.4 open risks:

### 8.1 Semantic Extraction Risk

The AI semantic delta extractor may miss important student-stated facts or produce noisy candidates.

Mitigation:

```text
SemanticDeltaValidator, evidence requirements, rejected/downgraded candidates,
audit records, and fallback behavior.
```

### 8.2 Memory Over-Promotion Risk

Weak interest may become confirmed counseling preference, or counseling preference may become official action.

Mitigation:

```text
MemoryIngestionPolicy, MemoryEventValidator, promotion safety checks, preference
ladder rules, official-truth boundary checks.
```

### 8.3 Runtime-Only Signal Pollution Risk

Posture, ambiguity, knowledge need, or selected skill may accidentally become durable memory.

Mitigation:

```text
Commit classification policy and runtime-only no-memory default.
```

### 8.4 Current Truth Derivation Risk

Projection logic may derive wrong route, readiness, active direction, or handoff status.

Mitigation:

```text
CurrentTruthProjector domain resolvers, projection warnings, deterministic tests,
and audit events.
```

### 8.5 Response Retry / Duplicate Commit Risk

Response validation failure may trigger retry and duplicate memory commits.

Mitigation:

```text
MemoryEventStore idempotency and rule that response retry does not repeat
pre-response memory commit.
```

### 8.6 Knowledge Grounding Risk

The AI may answer factual questions using stale, conflicting, or hallucinated business knowledge.

Mitigation:

```text
Phase 6 KnowledgeGateway, source authority, freshness policy, answerability policy,
and source conflict handling.
```

### 8.7 Recommendation Quality Risk

The AI may recommend too confidently or ignore constraints/rejected options.

Mitigation:

```text
RecommendationReadinessView, Phase 7 recommendation validation, hard constraints,
rejected-option suppression, assumptions/cautions.
```

### 8.8 Under-Handoff Risk

The AI may continue normal counseling when red-zone handoff is required.

Mitigation:

```text
FastBoundarySignalScanner, accepted runtime-only boundary signals, BoundaryResolver,
HandoffReadinessMemory, red-zone recall tests.
```

### 8.9 CRM Truth Leakage Risk

Counseling memory may accidentally become application, registration, payment, enrollment, seat, or CRM truth.

Mitigation:

```text
Phase 5 official-truth boundary, Phase 9 CRM adapter separation, guardrails,
audit, and forbidden memory commits.
```

### 8.10 Privacy / Retention Risk

MemoryEventStore and AuditEventStore may retain sensitive data without final retention/deletion policy.

Mitigation:

```text
Phase 5 placeholders, future production hardening, and later privacy/retention design.
```

---

## 9. Revised Later-Phase Dependencies

Phase 5 changes how later phases should think about state.

### Phase 6 Dependency

```text
KnowledgeGateway should consume CurrentTruthProjection and accepted knowledge_need signals.
It should not read uncontrolled transcript as primary context.
```

### Phase 7 Dependency

```text
Recommendation engine should consume CurrentTruthProjection, governed knowledge,
RecommendationReadinessView, QualityContextTruthView, DecisionContextTruthView,
and prior RecommendationInteractionMemory.
```

### Phase 8 Dependency

```text
Handoff package should consume HandoffReadinessTruthView, confirmed counseling
preference, current blockers, latest recommendation context, and audit evidence.
```

### Phase 9 Dependency

```text
CRM integration should treat counseling memory as advisory context only.
Official CRM/application truth remains externally owned.
```

### Phase 10 Dependency

```text
Guardrails must enforce memory correctness, runtime-only signal separation,
source grounding, recommendation boundaries, handoff boundaries, and CRM truth separation.
```

### Phase 11 Dependency

```text
Evaluation must use MemoryEventStore and AuditEventStore traces to measure memory
correctness, current-truth derivation, boundary recall, retry safety, and official-truth separation.
```

### Phase 12 Dependency

```text
Operations tooling should expose memory/audit traceability without allowing
ungoverned edits that create official truth.
```

### Phase 13 Dependency

```text
Prototype should next prove Phase 4 semantic deltas + Phase 5 memory/state before
expanding recommendation, handoff, CRM, or production operations.
```

### Phase 14 Dependency

```text
Production hardening must include persistence, privacy, retention, correction,
removal, projection performance, and memory/audit access control.
```

---

## 10. Final Roadmap v7.4 Statement

Roadmap v7.4 locks the platform’s core semantic-memory architecture.

The approved foundation is now:

```text
Phase 0:
  bounded autonomy and official-action boundary.

Phase 1:
  route-based autonomous counseling journey and counselor-like flow.

Phase 2:
  governed SKILL.md behavior control.

Phase 3:
  deterministic runtime shell with AI semantic extraction and AI counseling core.

Phase 4:
  SemanticDeltaResult → AcceptedSemanticDelta.

Phase 5:
  AcceptedSemanticDelta → MemoryStateService → DurableMemoryEvents → CurrentTruthProjection.
```

The most important v7.4 principle is:

```text
Student memory is not a mutable profile blob.
Student memory is a validated event history.
Current truth is derived every turn.
Runtime-only signals stay runtime-only by default.
Audit explains behavior but does not become memory.
CRM/application truth remains externally owned.
```

The next active exploration should be:

```text
Phase 6 — Business Knowledge & Source Governance
```

Recommended Phase 6 starting question:

```text
How should the platform retrieve, govern, prioritize, validate, and cite business
knowledge so factual counseling, recommendations, comparisons, and handoff context
are grounded in approved sources instead of model memory or uncontrolled documents?
```

