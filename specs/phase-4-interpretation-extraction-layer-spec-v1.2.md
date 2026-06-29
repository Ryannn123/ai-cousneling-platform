# Phase 4 — Interpretation & Extraction Layer Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 4 — Interpretation & Extraction Layer  
**Version:** 1.2  
**Date:** 2026-06-29  
**Status:** Approved exploration output for Phase 4, amended for Phase 1/2/3 v1.2 counselor-like flow alignment  
**Source Context:** Phase 0 Bounded Autonomy Baseline, Phase 1 Autonomous Counseling Operating Model v1.2, Phase 2 Counseling SOP & Skill Control v1.2, Phase 3 Autonomous Runtime Strategy v1.2, Prototype Runtime Checkpoint, Roadmap v7.1, Phase 4 exploration discussion, minimum counseling profile routing amendment, and counselor-like flow amendment

---

## 1. Purpose

This specification defines the **Phase 4 Interpretation & Extraction Layer** for the AI-first counseling platform.

It answers the Phase 4 core question:

```text
How should the platform extract facts and interpret student meaning from natural
language so downstream runtime decisions, memory writes, boundary checks,
knowledge routing, handoff records, and audit evidence are based on validated
semantic signals rather than scattered heuristics or uncontrolled summaries?
```

Phase 4 exists because the Phase 3 prototype proved the bounded-autonomy runtime loop, but intentionally left extraction and classification shallow.

The prototype proved:

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

Phase 4 upgrades the semantic perception layer of that loop.

The new Phase 4 principle is:

```text
AI may interpret and extract.
Platform validates semantic signals.
Only validated semantic signals may influence boundary resolution, operating
context, knowledge routing, memory validation, handoff, recommendation,
response validation, or audit truth.
```

Important boundary:

```text
Accepted interpretation is not durable memory.
Accepted interpretation is not CRM truth.
Accepted interpretation is not official application, registration, enrollment,
payment, seat, or business-status truth.
```

Phase 4 produces a validated per-turn semantic artifact. Later phases decide durable memory storage, recommendation lifecycle, handoff package structure, CRM integration, guardrails, and production evaluation.

### 1.1 Version 1.1 Amendment Summary

Version 1.1 updates Phase 4 to align with the Phase 1 v1.1 route-based minimum counseling profile.

The previous Phase 4 `MinimumProfileSignals` contract treated these as minimum-profile gates:

```text
1. academic result known
2. university preference type known, such as ranking/prestige vs budget/value
3. location preference known
```

The revised Phase 4 interpretation model treats the minimum counseling profile as route-oriented:

```text
1. academic result status
2. course direction status
3. university direction status
```

This means ranking/prestige preference, budget/value preference, preferred location, campus preference, intake/timeline, and similar fit details are no longer universal minimum-profile signals. They should normally be emitted as `qualityEnhancingSignals[]`, unless the student states them as hard constraints that materially constrain the counseling route or recommendation.

Core amendment principle:

```text
Minimum profile signals should help determine the next counseling route.
University-fit signals should improve exploration, comparison, and recommendation quality.
```

### 1.2 Version 1.2 Amendment Summary

Version 1.2 updates Phase 4 to support the Phase 1/2/3 v1.2 counselor-like flow amendment.

The Phase 1 v1.2 operating model added a counselor-like navigation layer around the existing route-based state graph:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

Phase 4 v1.2 supports this behavior by adding an optional, advisory `studentPostureSignal` to the interpretation contract.

The posture signal helps downstream runtime and skill guidance understand whether the student is browsing, confused, course-led, university-led, comparing, validating a choice, decision-ready, indecisive, constraint-driven, or asking for human help.

Important boundary:

```text
Student posture is not a durable student identity label.
Student posture is not official truth.
Student posture does not directly commit memory, preference, handoff, or CRM state.
```

The signal is used to improve:

1. counselor-like response style
2. `nextBestCounselingMove`
3. `counselorResponseMode`
4. route explanation behavior
5. decision-support behavior
6. soft summary checkpoint behavior
7. milestone confirmation behavior
8. skill and playbook context composition

Core amendment principle:

```text
Interpret the student's counseling posture to improve how the AI guides the student,
without allowing posture to override boundary rules, route evidence, preference
confirmation rules, memory validation, or official-action constraints.
```

---

## 2. Scope

Phase 4 defines:

1. the role of interpretation and extraction in the counseling runtime
2. the boundary between extraction, interpretation, memory, and official truth
3. the signal taxonomy for the first implementation
4. the split placement of interpretation in the runtime
5. the hard-coded flow-driving fields
6. the route-based minimum counseling profile signals
7. the flexible quality-enhancing signal model
8. boundary candidate signal handling
9. knowledge need signal handling
10. contradiction and correction signal handling
11. student posture signal handling for counselor-like flow
12. the `InterpretationResult` contract
13. the `AcceptedInterpretation` contract
14. the deterministic fast boundary scanner role
15. the AI interpretation client role
16. the platform-owned interpretation validator
17. the boundary resolver integration
18. operating context integration
19. knowledge gateway integration
20. validation pipeline integration
21. audit and evaluation requirements
22. prototype implementation slice
23. decisions locked by Phase 4
24. open questions deferred to later phases

---

## 3. Non-Goals

Phase 4 does **not** define:

1. the final durable student memory database schema
2. current-truth versus history storage implementation
3. full recommendation scoring or recommendation lifecycle
4. full business knowledge governance
5. final human handoff package and routing workflow
6. CRM read/write integration
7. production guardrail engine design
8. production evaluation dashboard
9. admin operations for interpretation taxonomy maintenance
10. full multilingual extraction strategy
11. full production model-routing strategy
12. durable storage of student posture or personality labels
13. final affect/emotion detection model
14. LangGraph migration design
15. Deep Agents usage for interpretation subroutines

These are deferred to later phases.

Important Phase 4 boundary:

```text
Phase 4 defines what the platform believes the student signaled in this turn.
Phase 5 defines how validated signals become durable student memory.
```

---

## 4. Phase 0 Inheritance

Phase 4 inherits the approved Phase 0 bounded-autonomy baseline.

### 4.1 Core Autonomy Principle

```text
Autonomy by default.
Conservative at boundaries.
```

The interpretation layer must support ordinary autonomous counseling while strengthening red-zone detection and memory correctness.

### 4.2 Business Risk Posture

The main business risk remains:

```text
Under-handoff.
```

Therefore:

```text
Red-zone signal detection should prioritize recall over precision.
```

The interpretation layer must help identify boundary signals such as:

1. ready-to-apply/register intent
2. official action requests
3. payment, seat, or enrollment commitments
4. exception, appeal, waiver, or complex eligibility requests
5. sensitive or high-risk context
6. student-requested human support
7. ambiguous proceed language

### 4.3 Counseling Decision vs Official Action

The core boundary remains:

```text
Counseling decision does not equal official action.
```

The interpretation layer may detect and propose signals such as:

1. courses being considered
2. universities being considered
3. pathways being considered
4. confirmed counseling course preference
5. confirmed counseling university preference
6. confirmed counseling pathway preference
7. readiness-to-register signal

But it must not create or imply:

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

### 4.4 Interpretation Boundary Rule

```text
The interpretation layer may identify official-action intent.
It must not convert intent into official-action truth.
```

Example:

```text
Student says: "I want to apply now."
```

Allowed interpretation:

```yaml
readinessToRegisterSignal:
  intent: apply_now
  confidence: high
  evidence: "I want to apply now"

boundaryCandidateSignals:
  - type: ready_to_apply_or_register
    triggerType: H1
    recommendedBehavior: handoff
```

Forbidden interpretation:

```yaml
applicationStatus: submitted
registrationStatus: completed
crmStatus: updated
```

---

## 5. Phase 1 Inheritance

Phase 4 must preserve the Phase 1 autonomous counseling operating model.

### 5.1 Pre-Registration Scope

Phase 4 operates within the pre-registration counseling journey.

The interpretation layer should identify student meaning relevant to:

1. onboarding
2. minimum counseling profile collection and route detection
3. course/program exploration
4. university exploration
5. pathway exploration
6. recommendation readiness
7. comparison and shortlisting
8. counseling preference confirmation
9. deferral and indecision
10. readiness-to-register detection
11. red-zone handoff

### 5.1.1 Phase 1 v1.1 Minimum Counseling Profile

Phase 4 must interpret the revised Phase 1 minimum counseling profile as route-oriented.

The minimum counseling profile is now:

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

Interpretation implication:

```text
The platform should know whether the student needs course exploration, university
exploration, pathway exploration, recommendation, comparison, confirmation, or
handoff.
```

Ranking/prestige preference, budget/value preference, preferred location, campus preference, intake/timeline, and similar fit details are not minimum-profile gates. They should be emitted as `qualityEnhancingSignals[]` unless stated as hard constraints.

### 5.2 Journey State Support

Phase 4 does not own the final journey state. However, it may provide evidence that helps the `OperatingContextManager` update the accepted state.

The Phase 1 journey states remain:

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

In the first Phase 4 implementation, explicit journey-state candidate extraction is deferred.

Instead, Phase 4 focuses on the signal categories most important for:

```text
1. memory correctness
2. boundary/red-zone detection
```

### 5.3 Preference Strength Ladder

Phase 4 must preserve the Phase 1 preference ladder:

```text
L1. Weak Interest
L2. Expressed Interest
L3. Expressed Preference
L4. Confirmed Counseling Preference
L5. Ready-to-Register / Apply Intent
```

The interpretation layer must not silently skip levels.

Examples:

```text
"Psychology sounds interesting."
→ coursesConsidering: Psychology
→ preferenceStrengthCandidate: L1
→ not confirmed counseling preference
```

```text
"I prefer Psychology over Business."
→ coursesConsidering: Psychology and Business
→ preferenceStrengthCandidate: L3
→ not confirmed counseling preference unless explicitly confirmed
```

```text
"Yes, Psychology is my choice for now."
→ confirmedCounselingCoursePreference: Psychology
→ preferenceStrengthCandidate: L4
→ still not official application or registration
```

```text
"I want to apply now."
→ readinessToRegisterSignal
→ boundaryCandidateSignal H1
→ L5 / red-zone handoff
```

### 5.4 Handoff Trigger Types

Phase 4 must preserve Phase 1 handoff trigger types:

```text
H1. Ready-to-Apply / Ready-to-Register Intent
H2. Official Action Request
H3. Payment / Seat / Enrollment Commitment
H4. Exception / Appeal / Waiver / Complex Eligibility
H5. Sensitive or High-Risk Context
H6. Student-Requested Human Support
```

The interpretation layer may propose candidate handoff triggers. The `BoundaryResolver` remains final authority.

### 5.5 Phase 1 v1.2 Counselor-Like Flow Support

Phase 4 v1.2 also supports the Phase 1 v1.2 counselor-like navigation layer.

Phase 1 v1.2 keeps the same flexible journey graph and route-based minimum profile, but adds the principle:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

The interpretation layer should therefore identify student posture when there is enough evidence to help downstream modules choose an appropriate response strategy.

Examples:

```text
"I don't know what to study."
→ studentPostureSignal: lost_or_confused
→ counselingImplication: reassure_and_orient
```

```text
"I already want Psychology, but I don't know which university."
→ studentPostureSignal: course_first
→ counselingImplication: route_to_university_exploration
```

```text
"Which one is better, A or B?"
→ studentPostureSignal: comparison_oriented
→ counselingImplication: compare_options
```

```text
"I think this is my choice."
→ studentPostureSignal: decision_ready
→ counselingImplication: confirm_preference
```

Important:

```text
Student posture is advisory context.
It is not a journey state, not a durable memory write, not a confirmed preference,
and not official action truth.
```

---

## 6. Phase 2 Inheritance

Phase 4 must preserve the Phase 2 SKILL.md behavior-control model.

### 6.1 Skill System Relationship

Phase 2 established:

```text
Counselor-owned guidance.
Runtime-enforced boundaries.
Moderately guided AI behavior.
Structured metadata for safety, selection, validation, and audit.
```

Phase 4 does not replace SKILL.md skill control.

Instead, Phase 4 provides better validated semantic inputs for:

1. skill selection
2. boundary rule loading
3. memory output validation
4. recommendation output validation
5. handoff output validation
6. counselor-like response mode selection
7. decision-support behavior selection
8. soft summary checkpoint behavior
9. milestone confirmation behavior
10. audit evidence

### 6.2 Boundary Rules Still Override

If accepted interpretation conflicts with mandatory boundary rules, boundary rules win.

Example:

```text
Interpretation says:
  confirmedCounselingCoursePreference = Psychology

Boundary signal says:
  student also asked "Can you register me now?"

Final behavior:
  red-zone handoff, not normal preference confirmation
```

### 6.3 Skill Metadata Still Controls Output Permissions

Accepted interpretation may support a memory candidate, but the selected runtime skill and validators still determine whether an output is allowed.

```text
Accepted interpretation supports the signal.
Selected skill metadata permits or forbids the output.
Validation decides what may commit.
```

---

## 7. Phase 3 Inheritance

Phase 4 must preserve the Phase 3 autonomous runtime strategy.

### 7.1 Runtime Style

Phase 3 locked:

```text
Deterministic shell + AI counseling core.
```

Phase 4 extends this as:

```text
Deterministic shell + AI interpretation core + AI counseling core.
```

The AI may propose interpretation, but the deterministic platform shell validates and controls trust boundaries.

### 7.2 AI Proposes, Platform Validates, Platform Commits

Phase 3 locked:

```text
AI proposes.
Platform validates.
Platform commits.
```

Phase 4 applies the same rule to interpretation:

```text
AI proposes semantic signals.
Platform validates semantic signals.
Only accepted semantic signals may influence downstream runtime behavior.
```

### 7.3 Two-Checkpoint Runtime Remains

Phase 3 uses:

```text
Checkpoint 1 — Pre-generation control
Checkpoint 2 — Pre-commit validation
```

Phase 4 adds interpretation inside Checkpoint 1.

Updated Checkpoint 1:

```text
1. receive student message
2. run fast boundary signal scanner
3. run AI interpretation client
4. validate interpretation
5. resolve final boundary result
6. update accepted operating context
7. derive advisory student posture and counselor response mode when supported
8. select SKILL.md artifacts
9. route knowledge if needed
10. compose execution context
```

Checkpoint 2 still validates the AI counseling response and proposed outputs before commit.

### 7.4 Runtime Module Topology Update

Phase 3 topology:

```text
CounselingTurnOrchestrator
  ↓
BoundaryEngine
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
OutputCommitService
  ↓
AuditEventWriter
```

Phase 4 updates the topology:

```text
CounselingTurnOrchestrator
  ↓
FastBoundarySignalScanner
  ↓
AIInterpretationClient
  ↓
InterpretationValidator
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
OutputCommitService
  ↓
AuditEventWriter
```

The `BoundaryEngine` may internally contain `FastBoundarySignalScanner` and `BoundaryResolver`, but Phase 4 defines their roles separately for clarity.

---

## 8. Prototype Checkpoint Inheritance

The prototype runtime checkpoint records that the Phase 3 vertical slice is proven but intentionally shallow in extraction and classification.

The prototype currently uses deterministic heuristics for:

1. boundary signal detection
2. profile signal extraction
3. factual detour detection
4. comparison detection
5. preference confirmation detection
6. journey state transitions
7. recommendation readiness
8. preference strength movement

Phase 4 upgrades this by adding a governed interpretation layer.

The prototype checkpoint also established that Phase 4 should preserve:

1. accepted operating context fields
2. accepted memory outputs
3. blocked output records
4. evidence and confidence as first-class fields
5. preference history and corrections
6. recommendation and handoff records
7. CRM truth separation

Phase 4 implements the interpretation side of this requirement. Durable memory remains Phase 5.

---

## 9. Core Phase 4 Design Direction

Phase 4 uses the following design stance:

```text
Split safety scan + AI semantic interpretation + platform validation.
```

The selected design is:

```text
FastBoundarySignalScanner
→ AIInterpretationClient
→ InterpretationValidator
→ BoundaryResolver
→ OperatingContextManager
```

### 9.1 Why Split Placement

The system must not rely only on AI interpretation for obvious red-zone detection.

Obvious boundary phrases such as:

```text
register me
apply now
pay deposit
reserve seat
submit application
human counselor
exception
appeal
waiver
```

should be caught immediately by a deterministic scanner.

Then AI interpretation provides richer semantic signals, including:

1. flow-driving counseling fields
2. quality-enhancing signals
3. boundary candidate signals
4. knowledge need signals
5. contradiction/correction signals

The platform validates these signals and resolves the final boundary decision.

### 9.2 Primary Design Goals

Phase 4 prioritizes:

```text
1. memory correctness
2. boundary/red-zone detection
```

Recommendation input quality is important but secondary for the first implementation.

### 9.3 Risk Priorities

The two main risks are:

```text
1. missing an important signal
2. creating noisy or incorrect memory candidates
```

Therefore:

1. red-zone and boundary signals should favor recall
2. flow-driving memory signals should require evidence and promotion validation
3. quality-enhancing signals should be filtered for usefulness and noise
4. confirmed preference and readiness signals must not be confused

---

## 10. Extraction vs Interpretation

Phase 4 distinguishes extraction from interpretation.

### 10.1 Extraction

Extraction means detecting structured facts stated or strongly implied by the student.

Examples:

```yaml
student_message: "I got 5 credits and I am considering Psychology, but I do not have a university yet."

extracted meaning:
  academic_result: 5 credits
  course_direction_status: considering_some_courses
  courses_considering: Psychology
  university_direction_status: unknown
```

```yaml
student_message: "I prefer a budget university around KL."

extracted meaning:
  budget_sensitivity: budget_or_value
  location_preference: around KL

classification:
  quality_enhancing_signal: true
  minimum_profile_gate: false
```

### 10.2 Interpretation

Interpretation means inferring semantic counseling meaning from the message and conversation context.

Examples:

```yaml
profile_completeness: minimum_complete
recommendation_readiness: R2
preference_strength_candidate: L2
boundary_candidate: ambiguous_proceed_language
```

### 10.3 Unified Output Choice

Phase 4 does not maintain separate `extractedFacts[]` and `memoryCandidates[]` arrays.

Instead, it uses:

```text
hard-coded flowDriving fields
+ flexible qualityEnhancingSignals[]
```

Reason:

```text
Extracted facts and memory candidates overlap.
All student signals may become memory candidates later, but not all will be
committed as durable memory.
```

Phase 4 classifies and validates signals. Phase 5 decides durable memory storage.

---

## 11. Signal Scope

Phase 4 uses a layered signal scope.

### 11.1 Initial Signal Categories

The first implementation produces:

```text
1. flowDriving fields
2. qualityEnhancingSignals[]
3. studentPostureSignal
4. boundaryCandidateSignals[]
5. knowledgeNeedSignals[]
6. contradictionSignals[]
7. confidenceSummary
```

### 11.2 Deferred Signal Categories

The first implementation defers:

```text
1. journey_state_candidate
2. primary_action_candidate
3. recommendation_readiness_candidate
4. detour/resume signal
5. broad emotion/friction signal unrelated to counseling posture
```

These may be added in a later iteration after the first Phase 4 prototype validates core memory and boundary improvements.

### 11.3 Rationale

The initial implementation should not attempt to replace every runtime heuristic at once.

It should directly improve the highest-priority areas:

```text
1. memory correctness
2. boundary/red-zone detection
3. knowledge need routing
4. contradiction/correction handling
5. counselor-like flow support through advisory posture detection
```

---

## 12. Flow-Driving vs Quality-Enhancing Signals

Phase 4 separates student signals into two main classes.

### 12.1 Flow-Driving Signals

Flow-driving signals affect the main counseling flow.

A signal is flow-driving when it may change:

1. next counseling action
2. active course direction
3. active university direction
4. active pathway direction
5. preference strength
6. recommendation readiness
7. boundary decision
8. handoff status
9. operating context

Examples:

```text
coursesConsidering
confirmedCounselingCoursePreference
universitiesConsidering
confirmedCounselingUniversityPreference
pathwaysConsidering
confirmedCounselingPathwayPreference
academicResult
minimumProfileSignals
courseDirectionStatus
universityDirectionStatus
preferenceStrengthCandidate
readinessToRegisterSignal
```

### 12.2 Quality-Enhancing Signals

Quality-enhancing signals improve personalization and counseling quality, but do not necessarily drive the immediate state machine.

Examples:

```text
concern
budget_sensitivity
university_fit_preference
location_preference
family_influence
learning_preference
study_mode_preference
career_interest
timeline_preference
personality_preference
```

Student posture is separate from normal quality-enhancing signals because it describes the student's current conversational stance in this turn, not a stable preference or profile fact.

Examples:

```text
lost_or_confused
course_first
university_first
comparison_oriented
validation_seeking
decision_ready
indecisive
constraint_driven
```

Posture may improve response style and next-step framing, but it should not be promoted into durable memory merely because it was detected once.

### 12.3 Hard Constraint Promotion Rule

A quality-enhancing signal can become flow-driving when it materially constrains counseling.

Example:

```text
"I prefer KL."
→ qualityEnhancingSignals.location_preference
```

```text
"I can only study in KL."
→ flow-driving constraint affecting recommendation filtering
```

Example:

```text
"Budget is important."
→ qualityEnhancingSignals.budget_sensitivity
```

```text
"I cannot consider expensive universities at all."
→ flow-driving budget constraint
```

The AI may propose this classification, but the platform validates whether the evidence supports flow-driving impact.

Route-based minimum profile rule:

```text
A university-fit signal should not be promoted into the minimum profile merely
because it is useful. It becomes flow-driving only when it materially constrains
the next counseling route, recommendation filtering, boundary decision, or
handoff context.
```

### 12.4 Naming Rule

Flow-driving confirmed preference fields must use counseling-safe names.

Use:

```text
confirmedCounselingCoursePreference
confirmedCounselingUniversityPreference
confirmedCounselingPathwayPreference
```

Do not use ambiguous names like:

```text
confirmedCourse
confirmedUniversity
```

Reason:

```text
Confirmed counseling preference is not official application, registration,
payment, enrollment, seat, or CRM truth.
```

---

## 13. Runtime Placement

Phase 4 uses split runtime placement.

```text
Student Message
  ↓
FastBoundarySignalScanner
  ↓
AIInterpretationClient
  ↓
InterpretationValidator
  ↓
AcceptedInterpretation
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
OutputCommitService
  ↓
AuditEventWriter
```

### 13.1 FastBoundarySignalScanner

Platform-owned deterministic scanner.

Purpose:

```text
Catch obvious boundary signals before AI interpretation.
```

It should scan for high-recall trigger phrases related to:

1. ready-to-apply/register
2. official action
3. payment, seat, enrollment
4. exception, appeal, waiver, complex eligibility
5. sensitive or high-risk context
6. human-requested support
7. ambiguous proceed language

### 13.2 AIInterpretationClient

AI-assisted structured-output interpreter.

Purpose:

```text
Produce a full InterpretationResult from the student message and recent context.
```

It may use:

1. current student message
2. recent conversation context
3. previous accepted operating context
4. relevant active counseling direction
5. recent accepted interpretation summary

It does not commit state.

### 13.3 InterpretationValidator

Platform-owned validator.

Purpose:

```text
Validate, downgrade, reject, or clarify interpretation signals before they are
consumed by downstream modules.
```

### 13.4 BoundaryResolver

Platform-owned final boundary decision maker.

It combines:

1. fast boundary signals
2. accepted boundary candidate signals
3. readiness-to-register signals
4. ambiguous proceed signals
5. previous handoff status
6. operating context
7. Phase 0/1/2 boundary rules

It decides:

1. final zone
2. handoff status
3. trigger type
4. required boundary rules
5. allowed next behavior

### 13.5 OperatingContextManager

Platform-owned accepted state manager.

It may use accepted flow-driving interpretation to update the operating context, but it must validate against:

1. prior accepted context
2. boundary result
3. preference ladder rules
4. confirmation requirements
5. contradiction signals

### 13.6 KnowledgeGateway

Platform-owned factual answerability gateway.

It consumes accepted knowledge need signals and relevant flow-driving context.

### 13.7 ValidationPipeline

Platform-owned response/output validator.

It uses accepted interpretation to validate AI-generated outputs.

Example:

```text
AI proposes confirmed counseling preference.
ValidationPipeline checks whether AcceptedInterpretation supports L4 evidence.
```

### 13.8 AuditEventWriter

Must record both raw and accepted interpretation evidence.

---

## 14. Extractor Execution Design

Phase 4 starts with:

```text
Hybrid single interpreter + deterministic fast scanner.
```

### 14.1 Selected Design

```text
FastBoundarySignalScanner
→ one AI interpreter producing full InterpretationResult
→ InterpretationValidator
→ BoundaryResolver
```

### 14.2 Why Not Multi-Head First

A future production version may split interpretation into specialized extractors:

1. profile/preference extractor
2. boundary signal extractor
3. knowledge need extractor
4. contradiction extractor
5. quality context extractor

But the first Phase 4 implementation should remain smaller.

A single AI interpretation call is simpler, lower latency, cheaper, and easier to integrate into the existing prototype.

### 14.3 Future Split Compatibility

The contract should be stable enough that future specialized extractors can produce the same `InterpretationResult` sections.

```text
Downstream consumers should depend on InterpretationResult / AcceptedInterpretation,
not on whether one model or multiple extractor heads produced it.
```

---

## 15. InterpretationResult Contract

The raw AI interpreter produces an `InterpretationResult`.

```ts
type InterpretationResult = {
  conversationId: string;
  turnId: string;
  messageId: string;

  flowDriving: FlowDrivingSignals;

  qualityEnhancingSignals: QualityEnhancingSignal[];

  studentPostureSignal?: StudentPostureSignal;

  boundaryCandidateSignals: BoundaryCandidateSignal[];
  knowledgeNeedSignals: KnowledgeNeedSignal[];
  contradictionSignals: ContradictionSignal[];

  confidenceSummary: ConfidenceSummary;
};
```

Important:

```text
InterpretationResult is a proposal, not truth.
```

---

## 16. FlowDrivingSignals Contract

Flow-driving fields are hard-coded first-class fields because they affect the main counseling flow.

```ts
type FlowDrivingSignals = {
  coursesConsidering: CourseSignal[];
  confirmedCounselingCoursePreference?: CourseSignal;

  universitiesConsidering: UniversitySignal[];
  confirmedCounselingUniversityPreference?: UniversitySignal;

  pathwaysConsidering: PathwaySignal[];
  confirmedCounselingPathwayPreference?: PathwaySignal;

  academicResult?: AcademicResultSignal;
  minimumProfileSignals?: MinimumProfileSignals;

  preferenceStrengthCandidate?: PreferenceStrengthSignal;
  readinessToRegisterSignal?: ReadinessSignal;
};
```

### 16.1 Base Signal Fields

Every flow-driving signal should include evidence, confidence, source, and promotion risk.

```ts
type BaseSignal = {
  confidence: "low" | "medium" | "high";
  evidence: EvidenceSpan[];
  source: "current_message" | "conversation_context";
  promotionRisk:
    | "none"
    | "possible_over_promotion"
    | "requires_confirmation"
    | "official_action_risk";
};
```

### 16.2 CourseSignal

```ts
type CourseSignal = BaseSignal & {
  courseOrProgram: string;
  status:
    | "considering"
    | "preferred"
    | "confirmed_counseling_preference"
    | "rejected";
};
```

Examples:

```yaml
coursesConsidering:
  - courseOrProgram: Psychology
    status: considering
    confidence: high
    evidence:
      - quote: "Psychology sounds interesting"
    promotionRisk: none
```

```yaml
confirmedCounselingCoursePreference:
  courseOrProgram: Psychology
  status: confirmed_counseling_preference
  confidence: high
  evidence:
    - quote: "Yes, Psychology is my choice for now"
  promotionRisk: none
```

Ambiguous example:

```yaml
confirmedCounselingCoursePreference:
  courseOrProgram: Psychology
  status: confirmed_counseling_preference
  confidence: medium
  evidence:
    - quote: "Let's proceed with Psychology"
  promotionRisk: requires_confirmation
```

### 16.3 UniversitySignal

```ts
type UniversitySignal = BaseSignal & {
  university: string;
  status:
    | "considering"
    | "preferred"
    | "confirmed_counseling_preference"
    | "rejected";
};
```

### 16.4 PathwaySignal

```ts
type PathwaySignal = BaseSignal & {
  pathway: string;
  status:
    | "considering"
    | "preferred"
    | "confirmed_counseling_preference"
    | "rejected";
};
```

### 16.5 AcademicResultSignal

```ts
type AcademicResultSignal = BaseSignal & {
  rawText: string;
  normalized?: {
    qualificationType?: string;
    credits?: number;
    subjects?: {
      name: string;
      grade?: string;
      status?: "pass" | "fail" | "unknown";
    }[];
  };
};
```

### 16.6 MinimumProfileSignals

`MinimumProfileSignals` represents the Phase 1 v1.1 route-based minimum counseling profile, which remains preserved in Phase 1 v1.2.

It should answer:

```text
Do we know the student's academic baseline?
Do we know whether the student has course direction?
Do we know whether the student has university direction?
```

It should not require ranking/prestige preference, budget/value preference, or location preference. Those are university-fit or recommendation-quality signals unless stated as hard constraints.

```ts
type MinimumProfileSignals = {
  academicResultKnown: boolean;
  courseDirectionStatusKnown: boolean;
  universityDirectionStatusKnown: boolean;

  academicResultStatus?: SignalValue<
    "known" | "unknown" | "unclear"
  >;

  courseDirectionStatus?: SignalValue<
    | "unknown"
    | "considering_some_courses"
    | "preferred_course_exists"
    | "confirmed_counseling_course_preference"
  >;

  universityDirectionStatus?: SignalValue<
    | "unknown"
    | "considering_some_universities"
    | "preferred_university_exists"
    | "confirmed_counseling_university_preference"
  >;

  routeReadiness?: SignalValue<
    | "minimum_profile_incomplete"
    | "route_ready"
    | "route_ready_with_optional_fit_gaps"
  >;

  suggestedCounselingRoute?: SignalValue<
    | "collect_academic_result"
    | "course_or_pathway_exploration"
    | "university_exploration"
    | "course_exploration_within_university_context"
    | "recommendation_or_validation"
    | "comparison_or_shortlist"
    | "handoff_boundary_check"
  >;
};

type SignalValue<T> = BaseSignal & {
  value: T;
};
```

### 16.6.1 Removed From MinimumProfileSignals

The following fields are intentionally not part of `MinimumProfileSignals` in v1.1:

```ts
universityPreferenceTypeKnown
locationPreferenceKnown
universityPreferenceType
locationPreference
```

They should normally be represented as `qualityEnhancingSignals[]`:

```yaml
qualityEnhancingSignals:
  - type: budget_sensitivity
    value:
      preference: budget_or_value
    usefulness: high
    sensitivity: none

  - type: location_preference
    value:
      location: KL
    usefulness: high
    sensitivity: none
```

If the student states them as strict constraints, downstream validation may treat them as flow-driving constraints.

Examples:

```text
"I prefer KL."
→ qualityEnhancingSignals.location_preference
```

```text
"I can only study in KL."
→ hard constraint affecting recommendation filtering
```

```text
"Budget is important."
→ qualityEnhancingSignals.budget_sensitivity
```

```text
"I cannot consider expensive universities at all."
→ hard budget constraint affecting recommendation filtering
```

### 16.7 PreferenceStrengthSignal

```ts
type PreferenceStrengthSignal = BaseSignal & {
  level: "L1" | "L2" | "L3" | "L4" | "L5";
  label:
    | "weak_interest"
    | "expressed_interest"
    | "expressed_preference"
    | "confirmed_counseling_preference"
    | "ready_to_register_or_apply_intent";
};
```

### 16.8 ReadinessSignal

```ts
type ReadinessSignal = BaseSignal & {
  intent:
    | "apply_now"
    | "register_now"
    | "enroll_now"
    | "official_next_step"
    | "payment_next_step"
    | "seat_reservation"
    | "ambiguous_proceed";

  triggerType?: "H1" | "H2" | "H3";
};
```

---

## 17. QualityEnhancingSignal Contract

Quality-enhancing signals remain flexible because they support counseling personalization and may evolve over time.

```ts
type QualityEnhancingSignal = BaseSignal & {
  type:
    | "concern"
    | "budget_sensitivity"
    | "university_fit_preference"
    | "location_preference"
    | "family_influence"
    | "learning_preference"
    | "study_mode_preference"
    | "timeline_preference"
    | "career_interest"
    | "personality_preference"
    | "other";

  value: Record<string, unknown>;

  usefulness:
    | "low"
    | "medium"
    | "high";

  sensitivity:
    | "none"
    | "possibly_sensitive"
    | "sensitive";
};
```

### 17.1 Quality Signal Inclusion Rule

A quality-enhancing signal should be included only if it helps:

1. personalize counseling
2. improve recommendation explanation
3. identify student concern or constraint
4. prepare a better follow-up question
5. support future memory or handoff context

### 17.2 Noise Control Rule

The interpreter should not emit irrelevant personal trivia.

Example:

```text
"I like coffee."
```

Usually reject or ignore unless it is somehow counseling-relevant.

Example:

```text
"I am worried about job prospects."
```

Keep as:

```yaml
qualityEnhancingSignals:
  - type: concern
    value:
      concern: worried_about_job_prospects
    usefulness: high
```

### 17.3 Sensitive Quality Signals

If a quality signal is sensitive, the interpreter may identify it, but downstream handling must follow red-zone/sensitive routing rules.

Examples:

1. financial hardship
2. disability or accommodation request
3. medical hardship
4. legal or visa-sensitive context
5. guardian or consent issue

Sensitive quality signals may also produce boundary candidate signals.

---

## 17A. StudentPostureSignal Contract

`StudentPostureSignal` is an optional advisory signal that helps the runtime and selected skills respond in a more counselor-like way.

It represents the student's current conversational posture in this turn or short recent context.

It does not represent a stable student identity, durable personality profile, official status, confirmed preference, or CRM truth.

```ts
type StudentPostureSignal = BaseSignal & {
  posture:
    | "just_browsing"
    | "lost_or_confused"
    | "course_first"
    | "university_first"
    | "pathway_first"
    | "comparison_oriented"
    | "validation_seeking"
    | "decision_ready"
    | "indecisive"
    | "constraint_driven"
    | "human_help_seeking";

  counselingImplication:
    | "reassure_and_orient"
    | "route_to_course_exploration"
    | "route_to_university_exploration"
    | "route_to_pathway_exploration"
    | "compare_options"
    | "validate_fit"
    | "confirm_preference"
    | "support_indecision"
    | "handoff_boundary_check";

  suggestedResponseMode?:
    | "reassuring_orientation"
    | "route_explanation"
    | "decision_support"
    | "summary_checkpoint"
    | "milestone_confirmation"
    | "clarify_once"
    | "handoff_safe";
};
```

### 17A.1 Posture Signal Rules

```text
Student posture may influence:
- counselor response mode
- next best counseling move
- route explanation behavior
- decision-support behavior
- skill/playbook context composition
- soft summary checkpoint timing
- milestone confirmation wording
```

```text
Student posture must not directly commit:
- durable memory
- confirmed counseling preference
- readiness-to-register signal
- handoff status
- CRM status
- application, registration, payment, enrollment, seat, or official truth
```

### 17A.2 Posture Examples

```text
"I'm just looking around."
→ posture: just_browsing
→ counselingImplication: reassure_and_orient
```

```text
"I don't know what course suits me."
→ posture: lost_or_confused
→ counselingImplication: route_to_course_exploration
→ suggestedResponseMode: reassuring_orientation
```

```text
"I want Psychology, but I don't know which university."
→ posture: course_first
→ counselingImplication: route_to_university_exploration
→ suggestedResponseMode: route_explanation
```

```text
"Which is better, University A or University B?"
→ posture: comparison_oriented
→ counselingImplication: compare_options
→ suggestedResponseMode: decision_support
```

```text
"This option seems best for me."
→ posture: decision_ready
→ counselingImplication: confirm_preference
→ suggestedResponseMode: milestone_confirmation
```

### 17A.3 Human Help Boundary

If posture indicates `human_help_seeking`, the interpreter should also emit or preserve a boundary candidate signal:

```yaml
studentPostureSignal:
  posture: human_help_seeking
  counselingImplication: handoff_boundary_check

boundaryCandidateSignals:
  - type: human_requested_support
    triggerType: H6
    severityCandidate: red
    recommendedBehavior: handoff
```

The `BoundaryResolver` remains final authority.

### 17A.4 Posture Persistence Rule

```text
StudentPostureSignal is per-turn advisory context by default.
```

Phase 5 may decide to persist specific counseling-relevant facts discovered through posture, such as repeated indecision, decision blocker, strong constraint, or deferral.

Phase 5 should not persist broad labels such as "confused student" or "indecisive student" as permanent identity memory.

---

## 18. BoundaryCandidateSignal Contract

Boundary candidate signals represent possible yellow/red boundary conditions.

```ts
type BoundaryCandidateSignal = BaseSignal & {
  type:
    | "ready_to_apply_or_register"
    | "official_action_request"
    | "payment_or_seat_request"
    | "exception_or_waiver_request"
    | "sensitive_context"
    | "human_requested_support"
    | "ambiguous_proceed_language";

  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";

  severityCandidate: "yellow" | "red";

  recommendedBehavior:
    | "continue"
    | "clarify_once"
    | "handoff";
};
```

### 18.1 Boundary Signal Examples

```text
"Can you register me now?"
```

```yaml
boundaryCandidateSignals:
  - type: ready_to_apply_or_register
    triggerType: H1
    severityCandidate: red
    recommendedBehavior: handoff
    confidence: high
    evidence:
      - quote: "Can you register me now?"
```

```text
"Can I pay the deposit?"
```

```yaml
boundaryCandidateSignals:
  - type: payment_or_seat_request
    triggerType: H3
    severityCandidate: red
    recommendedBehavior: handoff
```

```text
"Can we proceed?"
```

```yaml
boundaryCandidateSignals:
  - type: ambiguous_proceed_language
    severityCandidate: yellow
    recommendedBehavior: clarify_once
```

### 18.2 Boundary Recall Rule

```text
Boundary candidate extraction should favor recall.
```

A weak but plausible boundary signal may be kept as yellow caution rather than discarded.

---

## 19. KnowledgeNeedSignal Contract

Knowledge need signals indicate that the `KnowledgeGateway` should run before response generation.

```ts
type KnowledgeNeedSignal = BaseSignal & {
  type:
    | "fees"
    | "entry_requirements"
    | "eligibility"
    | "intake"
    | "duration"
    | "campus_location"
    | "ranking"
    | "scholarship"
    | "specific_program_fact"
    | "specific_university_fact"
    | "pathway_requirement";

  query: string;

  decisionCriticality:
    | "not_decision_critical"
    | "possibly_decision_critical"
    | "decision_critical";
};
```

### 19.1 Knowledge Need Examples

```text
"What is the fee for Psychology at University A?"
```

```yaml
knowledgeNeedSignals:
  - type: fees
    query: fee for Psychology at University A
    decisionCriticality: possibly_decision_critical
```

```text
"Do I meet the entry requirement?"
```

```yaml
knowledgeNeedSignals:
  - type: eligibility
    query: eligibility / entry requirement for student's profile
    decisionCriticality: decision_critical
```

### 19.2 Knowledge Gateway Rule

If accepted knowledge need signals are present, the `KnowledgeGateway` should run unless the selected skill and runtime context clearly do not require factual answering.

---

## 20. ContradictionSignal Contract

Contradiction signals represent corrections, direction changes, preference downgrades, or conflicts with previous context.

```ts
type ContradictionSignal = BaseSignal & {
  type:
    | "correction"
    | "direction_change"
    | "preference_downgrade"
    | "constraint_conflict"
    | "profile_conflict";

  conflictsWith?: {
    memoryId?: string;
    previousType?: string;
    previousValue?: Record<string, unknown>;
  };

  newClaim: Record<string, unknown>;

  recommendedBehavior:
    | "update_current_truth"
    | "preserve_history_and_switch_active_direction"
    | "ask_clarification";
};
```

### 20.1 Contradiction Examples

```text
"Actually, I don't want Psychology anymore. I want IT."
```

```yaml
contradictionSignals:
  - type: direction_change
    newClaim:
      courseOrProgram: IT
    recommendedBehavior: preserve_history_and_switch_active_direction
    evidence:
      - quote: "Actually, I don't want Psychology anymore. I want IT."
```

```text
"I said KL earlier, but now Penang is better."
```

```yaml
contradictionSignals:
  - type: correction
    newClaim:
      locationPreference: Penang
    recommendedBehavior: update_current_truth
```

### 20.2 Contradiction Rule

```text
Contradiction signals do not automatically erase prior memory.
```

They guide the memory/state system to preserve history while updating current active direction when appropriate.

---

## 21. EvidenceSpan Contract

Every signal should carry evidence.

```ts
type EvidenceSpan = {
  messageId: string;
  quote: string;
  normalizedQuote?: string;
};
```

### 21.1 Evidence Requirements

```text
No evidence, no high-confidence signal.
```

Flow-driving fields require stronger evidence than quality-enhancing signals.

### 21.2 Evidence Sources

Evidence may come from:

```text
1. current student message
2. recent conversation context
```

The team explicitly allows inference from conversation context, not only the latest message.

However:

```text
Context-inferred signals should usually avoid high confidence unless the context
evidence is direct and recent.
```

---

## 22. ConfidenceSummary Contract

```ts
type ConfidenceSummary = {
  overallConfidence: "low" | "medium" | "high";
  requiresClarification: boolean;
  clarificationReason?: string;
  highestRiskSignal?: string;
};
```

Examples:

```yaml
confidenceSummary:
  overallConfidence: medium
  requiresClarification: true
  clarificationReason: Student used ambiguous proceed language.
  highestRiskSignal: ambiguous_proceed_language
```

---

## 23. AcceptedInterpretation Contract

The platform validator produces `AcceptedInterpretation`.

```ts
type AcceptedInterpretation = {
  conversationId: string;
  turnId: string;
  messageId: string;

  accepted: InterpretationResult;

  rejectedSignals: RejectedSignal[];
  downgradedSignals: DowngradedSignal[];
  validationEvents: InterpretationValidationEvent[];

  status:
    | "accepted"
    | "accepted_with_downgrades"
    | "requires_clarification"
    | "rejected"
    | "safe_fallback";
};
```

### 23.1 RejectedSignal

```ts
type RejectedSignal = {
  signalPath: string;
  proposedSignal: unknown;
  reason: string;
  severity: "warning" | "error";
};
```

### 23.2 DowngradedSignal

```ts
type DowngradedSignal = {
  signalPath: string;
  originalSignal: unknown;
  downgradedSignal: unknown;
  reason: string;
};
```

### 23.3 InterpretationValidationEvent

```ts
type InterpretationValidationEvent = {
  type:
    | "schema_validated"
    | "schema_repaired"
    | "evidence_validated"
    | "signal_rejected"
    | "signal_downgraded"
    | "promotion_blocked"
    | "boundary_signal_preserved"
    | "quality_signal_ignored"
    | "contradiction_detected"
    | "clarification_required";

  severity: "info" | "warning" | "error";
  message: string;
};
```

### 23.4 AcceptedInterpretation Rule

```text
AcceptedInterpretation is a shared per-turn semantic artifact.
It may guide downstream modules.
It does not directly commit memory, recommendation, handoff, CRM status, or
official truth.
```

---

## 24. FastBoundarySignalScanner

The fast scanner is deterministic and platform-owned.

### 24.1 Purpose

```text
Catch obvious red/yellow boundary signals before AI interpretation.
```

### 24.2 Prototype Signal Groups

```text
H1 ready-to-apply/register:
  apply now, register me, start application, ready to proceed

H2 official action:
  submit my application, update status, send documents, confirm registration

H3 payment/seat/enrollment:
  pay deposit, reserve seat, secure intake, confirm place, enroll now

H4 exception/appeal/complex eligibility:
  exception, appeal, waiver, can I still enter, skip requirement

H5 sensitive/high-risk:
  visa issue, legal issue, disability accommodation, financial hardship,
  medical hardship, parent/guardian consent, confidential document

H6 human-requested:
  human counselor, real person, someone call me, I do not trust AI

Ambiguous proceed:
  proceed, next step, go ahead, let's do this, continue with this option
```

### 24.3 FastBoundarySignal

```ts
type FastBoundarySignal = {
  type:
    | "ready_to_apply_or_register"
    | "official_action_request"
    | "payment_or_seat_request"
    | "exception_or_waiver_request"
    | "sensitive_context"
    | "human_requested_support"
    | "ambiguous_proceed_language";

  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  matchedText: string;
  severityCandidate: "yellow" | "red";
  recommendedBehavior: "clarify_once" | "handoff";
};
```

### 24.4 Scanner Limit

The scanner is not responsible for full semantic understanding.

It is a high-recall safety net.

AI interpretation and boundary resolution handle nuance.

---

## 25. InterpretationValidator

The `InterpretationValidator` is platform-owned.

### 25.1 Validation Sequence

```text
1. schema validation
2. evidence validation
3. flow-driving promotion validation
4. boundary signal validation
5. quality-enhancing signal validation
6. student posture signal validation
7. contradiction validation
```

### 25.2 Schema Validation

Checks:

1. required fields exist
2. enum values are valid
3. arrays are present
4. evidence is correctly shaped
5. confidence values are valid
6. flow-driving fields are structured objects, not plain strings

Failure behavior:

```text
repair once
if still invalid, reject interpretation and use safe fallback
```

### 25.3 Evidence Validation

Checks:

1. every signal has evidence
2. evidence quotes are short and relevant
3. confidence is not high without direct evidence
4. context-inferred evidence is marked correctly

Failure behavior:

```text
missing evidence → reject signal
weak evidence → downgrade confidence
ambiguous evidence → require clarification when flow-driving or boundary-relevant
```

### 25.4 Flow-Driving Promotion Validation

Prevents weak language from becoming strong state.

Rules:

```text
coursesConsidering may come from weak or expressed interest.
confirmedCounselingCoursePreference requires explicit confirmation.
readinessToRegisterSignal requires official-next-step intent or ambiguous proceed handling.
```

Examples:

```text
"Psychology sounds interesting"
→ coursesConsidering only
```

```text
"I prefer Psychology"
→ coursesConsidering + L3 expressed preference
```

```text
"Yes, Psychology is my choice for now"
→ confirmedCounselingCoursePreference + L4
```

```text
"I want to apply now"
→ readinessToRegisterSignal + boundary handoff
```

### 25.5 Boundary Signal Validation

Boundary signals are high-recall.

Rules:

```text
Clear red-zone evidence → keep boundary signal.
Ambiguous proceed evidence → clarify once.
Weak boundary evidence → keep as yellow caution if plausible.
```

The validator should not discard a plausible red-zone signal simply because it is inconvenient for continuation.

### 25.6 Quality-Enhancing Signal Validation

Checks:

1. signal is counseling-relevant
2. evidence supports the signal
3. usefulness is not low unless there is a reason to retain
4. sensitive signal is flagged
5. duplicate signal does not add noise

Failure behavior:

```text
irrelevant → reject or ignore
unsupported → reject
sensitive → keep only if useful and route appropriately
```

### 25.7 Contradiction Validation

Checks:

1. contradiction is supported by evidence
2. previous context exists when claiming conflict
3. recommended behavior is appropriate
4. current truth is not overwritten automatically

Failure behavior:

```text
unsupported contradiction → reject
ambiguous correction → ask clarification
clear direction change → preserve history and switch active direction later
```

---

## 26. BoundaryResolver Integration

The `BoundaryResolver` consumes:

1. fast boundary signals
2. accepted boundary candidate signals
3. `readinessToRegisterSignal`
4. ambiguous proceed signals
5. previous handoff status
6. operating context
7. relevant boundary rules

### 26.1 Resolver Rules

```text
Rule 1:
If clear H1-H6 red trigger is detected, final_zone = red.

Rule 2:
If official action, payment, enrollment, seat reservation, exception approval,
or human-requested support is detected, handoff_status = required.

Rule 3:
If language is ambiguous between L4 counseling preference and L5 application
intent, final_zone = yellow and action = clarify once.

Rule 4:
If ambiguity remains after clarification and affects official action,
eligibility, sensitive handling, or registration next steps, hand off.

Rule 5:
When fast scanner and AI interpretation disagree, choose safer handling:
green vs yellow → yellow
yellow vs red → red or clarify once depending on ambiguity.
```

### 26.2 Boundary Resolver Output

The existing Phase 3 `BoundaryResult` remains the output:

```ts
type BoundaryResult = {
  finalZone: "green" | "yellow" | "red";
  handoffStatus: "none" | "possible_clarify" | "required";
  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  detectedSignals: string[];
  aiBoundaryReason?: string;
  requiredBoundaryRules: string[];
  allowedNextBehavior: "continue" | "clarify" | "handoff";
};
```

---

## 27. OperatingContextManager Integration

The `OperatingContextManager` consumes accepted flow-driving fields.

### 27.1 Inputs

1. accepted courses considering
2. accepted universities considering
3. accepted pathways considering
4. confirmed counseling preferences
5. academic result
6. route-based minimum profile signals
7. course direction status
8. university direction status
9. suggested counseling route
10. relevant quality-enhancing signals
11. accepted student posture signal, if present
12. preference strength candidate
13. readiness signal
14. contradiction signals
15. boundary result
16. previous operating context

### 27.2 Responsibilities

The `OperatingContextManager` decides accepted updates to:

1. active student direction
2. profile completeness
3. course direction status
4. university direction status
5. suggested counseling route
6. recommendation readiness
7. preference strength
8. handoff status
9. student posture
10. counselor response mode
11. decision-support mode, when relevant
12. next best counseling move
13. current zone
14. current main state, if enough evidence exists

### 27.3 Important Rules

```text
AcceptedInterpretation may influence operating context.
It does not overwrite operating context automatically.
```

```text
Student posture is advisory and per-turn by default.
It may influence response mode and next best counseling move, but it does not
replace journey state, route context, preference strength, handoff status, or
memory validation.
```

```text
Confirmed counseling preference cannot become official action.
```

```text
Contradictions update active direction only after platform validation.
```

### 27.4 Profile Completeness Semantics

The accepted operating context should interpret profile completeness as:

```text
incomplete:
  academic result status, course direction status, or university direction status
  is missing or unclear.

minimum_complete:
  academic result status, course direction status, and university direction status
  are known well enough to route the counseling flow.

rich_profile:
  minimum profile is complete and additional fit signals are available, such as
  budget sensitivity, university-fit preference, location preference, career goal,
  timeline, concerns, or hard constraints.
```

Important rule:

```text
minimum_complete does not mean enough information for a high-quality university
recommendation. It means enough information to route the counseling flow.
```

### 27.5 Route Derivation Examples

```text
Academic result known
+ no course direction
+ no university direction
→ course_or_pathway_exploration
```

```text
Academic result known
+ course direction known
+ no university direction
→ university_exploration
```

```text
Academic result known
+ university direction known
+ no course direction
→ course_exploration_within_university_context
```

```text
Academic result known
+ course direction known
+ university direction known
→ recommendation_or_validation
```

### 27.6 Student Posture and Counselor Response Mode Derivation

The `OperatingContextManager` may use accepted `studentPostureSignal` to derive advisory response mode.

Examples:

```text
studentPostureSignal.posture = lost_or_confused
→ counselorResponseMode = reassuring_orientation
→ nextBestCounselingMove = explain route and ask one lightweight direction question
```

```text
studentPostureSignal.posture = course_first
+ courseDirectionStatus = preferred_course_exists
+ universityDirectionStatus = unknown
→ counselorResponseMode = route_explanation
→ nextBestCounselingMove = explain university exploration route
```

```text
studentPostureSignal.posture = comparison_oriented
→ counselorResponseMode = decision_support
→ nextBestCounselingMove = compare options using stated priorities
```

```text
studentPostureSignal.posture = decision_ready
+ preferenceStrengthCandidate = L4
→ counselorResponseMode = milestone_confirmation
→ nextBestCounselingMove = confirm counseling preference safely
```

Important:

```text
Boundary result overrides posture-derived response mode.
Red-zone or human-requested support produces handoff behavior even if posture also
contains comparison, validation, or decision-ready signals.
```

---

## 28. KnowledgeGateway Integration

The `KnowledgeGateway` consumes accepted knowledge need signals.

### 28.1 Inputs

1. knowledgeNeedSignals
2. active course/university/pathway context
3. route-based minimum profile signals
4. relevant quality-enhancing fit signals
5. decision criticality
6. selected skill
7. boundary result

### 28.2 Trigger Rule

The gateway should run when accepted interpretation identifies factual need around:

1. fees
2. entry requirements
3. eligibility
4. intakes
5. duration
6. campus/location
7. ranking
8. scholarship facts
9. specific university/program facts
10. pathway requirements

### 28.3 Decision-Critical Knowledge Rule

If knowledge uncertainty is decision-critical, downstream behavior should caveat or hand off depending on the risk.

---

## 29. ExecutionContextComposer Integration

The `ExecutionContextComposer` should include a concise accepted interpretation summary.

It should pass:

1. accepted flow-driving fields
2. relevant quality-enhancing signals
3. accepted student posture signal, if present
4. counselor response mode, if derived
5. decision-support mode, if relevant
6. boundary result
7. knowledge result
8. selected skills and boundary rules
9. allowed and forbidden outputs

The AI response generator should not need to reinterpret the full transcript from scratch.

### 29.1 Counselor-Like Execution Context

When a `studentPostureSignal` is accepted, the execution context should provide the AI counseling core with a compact instruction such as:

```yaml
studentPosture:
  value: lost_or_confused
  counselingImplication: reassure_and_orient

counselorResponseMode: reassuring_orientation

responsePattern:
  - reflect_student_situation
  - explain_route_or_next_step
  - ask_one_purposeful_question
```

This supports Phase 2 v1.2 skill guidance without requiring the AI to infer posture again from the full transcript.

### 29.2 Response Pattern Boundary

The counselor-like response pattern is advisory.

If boundary rules require clarification, handoff, caveat, or official-action blocking, those rules override posture-derived response style.

---

## 30. ValidationPipeline Integration

The `ValidationPipeline` uses accepted interpretation to validate AI-generated outputs.

Examples:

```text
AI proposes memory output: confirmed_counseling_preference.
Validator checks:
  Does AcceptedInterpretation support L4?
  Is evidence explicit?
  Does selected skill allow this output?
  Is there official-action risk?
```

```text
AI proposes handoff output.
Validator checks:
  Is there accepted boundary signal or red-zone BoundaryResult?
```

```text
AI answers factual question.
Validator checks:
  Was there an accepted knowledge need signal?
  Did KnowledgeGateway return answerable facts?
```

```text
AI uses counselor-like response mode.
Validator checks:
  Does the response roughly match accepted posture and selected skill guidance?
  Does it ask only one purposeful next question when the mode requires it?
  Does it avoid mechanical intake and unexplained fit questions?
```

```text
AI confirms a counseling preference.
Validator checks:
  Is there accepted L4 evidence?
  Does the response clearly state this is not official application or registration?
  Does the response use milestone-confirmation behavior without implying official action?
```

### 30.1 Student Posture Validation

The validation pipeline should treat posture as advisory but still check for obvious inconsistencies.

Examples of validation failures:

```text
Accepted posture = lost_or_confused
AI response immediately asks a long university-fit questionnaire.
```

```text
Accepted posture = comparison_oriented
AI response ignores the comparison and restarts intake without explanation.
```

```text
Accepted posture = decision_ready
AI response treats the preference as official registration.
```

Failure behavior:

```text
- correct response wording when harmless
- regenerate once if response ignores selected response mode
- override with handoff-safe response if official-action risk appears
- do not commit posture as durable memory
```

---

## 31. OutputCommitService Integration

The `OutputCommitService` commits only downstream-validated outputs.

It does not commit `AcceptedInterpretation` directly as durable memory.

Allowed:

```text
AcceptedInterpretation supports memory validation.
ValidationPipeline accepts memory output.
OutputCommitService commits accepted memory output.
```

Forbidden:

```text
AcceptedInterpretation includes confirmedCounselingCoursePreference.
OutputCommitService writes durable memory without memory validation.
```

---

## 32. Audit Requirements

Every turn must audit interpretation.

### 32.1 Interpretation Audit Shape

```ts
type InterpretationAudit = {
  rawInterpretation: InterpretationResult;
  acceptedInterpretation: AcceptedInterpretation;
  rejectedSignals: RejectedSignal[];
  downgradedSignals: DowngradedSignal[];
  interpretationValidationEvents: InterpretationValidationEvent[];
  acceptedStudentPostureSignal?: StudentPostureSignal;
  rejectedStudentPostureSignal?: RejectedSignal;
  fastBoundarySignals: FastBoundarySignal[];
  boundaryResolutionInput: {
    fastBoundarySignals: FastBoundarySignal[];
    acceptedBoundaryCandidateSignals: BoundaryCandidateSignal[];
    readinessToRegisterSignal?: ReadinessSignal;
    ambiguousProceedSignal?: BoundaryCandidateSignal;
  };
};
```

### 32.2 Audit Must Explain

1. what the AI interpreter proposed
2. what the platform accepted
3. what was rejected
4. what was downgraded
5. what evidence supported each signal
6. whether fast boundary scan fired
7. how boundary resolution used interpretation
8. whether clarification was required
9. whether student posture influenced response mode or next best counseling move
10. whether downstream validators used accepted interpretation

### 32.3 Audit Rule

```text
A plain transcript is not enough.
```

Every semantic decision that affects boundary, memory, knowledge routing, handoff, or validation should be explainable.

---

## 33. Evaluation Strategy

Phase 4 evaluation must test interpretation correctness explicitly.

Final response quality alone is insufficient.

### 33.1 Evaluation Suite 1 — Minimum Counseling Profile Routing

Examples:

```text
"I got 5 credits, but I don't know what course or university yet."
→ academicResultKnown: true
→ courseDirectionStatus: unknown
→ universityDirectionStatus: unknown
→ suggestedCounselingRoute: course_or_pathway_exploration
```

```text
"I got 5 credits and I want Psychology, but I don't know which university."
→ academicResultKnown: true
→ courseDirectionStatus: preferred_course_exists
→ universityDirectionStatus: unknown
→ suggestedCounselingRoute: university_exploration
```

```text
"I want Sunway but I don't know what course."
→ universityDirectionStatus: preferred_university_exists
→ courseDirectionStatus: unknown
→ suggestedCounselingRoute: course_exploration_within_university_context
```

```text
"I prefer a budget university around KL."
→ qualityEnhancingSignals, not minimumProfileSignals
```

Pass condition:

```text
Minimum profile signals reflect route readiness, not university-fit completeness.
University-fit details are not required to mark route-based minimum profile complete.
```

### 33.2 Evaluation Suite 2 — Flow-Driving Field Extraction

Examples:

```text
"I'm considering Psychology and Business."
→ coursesConsidering: Psychology, Business
```

```text
"I choose Psychology for now."
→ confirmedCounselingCoursePreference
```

```text
"I prefer University A over University B."
→ universitiesConsidering + preference signal
```

```text
"I want IT instead of Psychology."
→ contradiction/direction change signal
```

Pass condition:

```text
Flow-driving fields are extracted with correct evidence and confidence.
```

### 33.3 Evaluation Suite 3 — Preference Strength and Promotion Safety

Examples:

```text
"Psychology sounds interesting."
→ considering / weak interest, not confirmed
```

```text
"I prefer Psychology."
→ expressed preference, not confirmed counseling preference
```

```text
"Yes, Psychology is my choice for now."
→ confirmed counseling preference
```

```text
"I want to apply now."
→ readiness-to-register + red boundary
```

Pass condition:

```text
Weak language is not over-promoted.
Ready-to-register language is not treated as ordinary preference.
```

### 33.4 Evaluation Suite 4 — Boundary and Red-Zone Recall

Examples:

```text
"Can you register me?"
→ H1/H2 handoff signal
```

```text
"Can I pay deposit?"
→ H3 signal
```

```text
"Can the university make exception?"
→ H4 signal
```

```text
"I want a human counselor."
→ H6 signal
```

```text
"Can we proceed?"
→ ambiguous proceed, clarify once
```

Pass condition:

```text
Obvious red-zone signals are captured by fast scanner, interpretation, or both.
Ambiguous boundary language becomes yellow clarification, not silent continuation.
```

### 33.5 Evaluation Suite 5 — Quality-Enhancing Noise Control

Examples:

```text
"I'm worried about job prospects."
→ concern retained
```

```text
"My parents prefer nearby campus."
→ family influence retained
```

```text
"I like coffee."
→ rejected or ignored unless counseling-relevant
```

Pass condition:

```text
Useful counseling context is kept.
Irrelevant noise is rejected or not emitted.
```

### 33.6 Evaluation Suite 6 — Knowledge Need Detection

Examples:

```text
"What is the fee?"
→ knowledgeNeedSignal: fees
```

```text
"What are the entry requirements?"
→ knowledgeNeedSignal: entry_requirements
```

```text
"Is University A ranked higher?"
→ knowledgeNeedSignal: ranking
```

Pass condition:

```text
KnowledgeGateway is triggered when factual support is needed.
```

### 33.7 Evaluation Suite 7 — Contradiction and Correction Handling

Examples:

```text
"Actually, I don't want Psychology anymore. I want IT."
→ contradiction/direction_change signal
```

```text
"I said KL earlier, but now I prefer Penang."
→ location preference update signal
```

```text
"I'm not sure anymore."
→ preference downgrade or deferral signal
```

Pass condition:

```text
Current direction can change without deleting useful history.
```

### 33.8 Evaluation Suite 8 — Student Posture Detection

Examples:

```text
"I'm just browsing."
→ studentPostureSignal.posture: just_browsing
→ suggestedResponseMode: reassuring_orientation or route_explanation
```

```text
"I don't know what course suits me."
→ studentPostureSignal.posture: lost_or_confused
→ counselingImplication: reassure_and_orient
```

```text
"I already want Psychology, but I don't know which university."
→ studentPostureSignal.posture: course_first
→ counselingImplication: route_to_university_exploration
```

```text
"Which is better, University A or University B?"
→ studentPostureSignal.posture: comparison_oriented
→ counselingImplication: compare_options
```

```text
"This one seems best for me."
→ studentPostureSignal.posture: decision_ready
→ counselingImplication: confirm_preference
```

Pass condition:

```text
Student posture is detected when useful, evidence-backed, and not overused.
It improves response mode selection without becoming durable memory or overriding
boundary decisions.
```

---

## 34. Evaluation Metric Bias

Different signal types need different metric priorities.

```text
Boundary/red-zone signals:
  prioritize recall

Flow-driving memory signals:
  balance precision and recall, but avoid high-confidence wrong writes

Confirmed preference / readiness:
  prioritize precision for L4 memory, recall for L5 handoff

Quality-enhancing signals:
  prioritize usefulness and low noise

Student posture signals:
  prioritize usefulness, evidence, and low labeling harm; avoid treating posture as stable identity

Knowledge need signals:
  prioritize recall when factual answer could affect recommendation or decision
```

The most important safety metric remains:

```text
red-zone recall
```

The most important memory-quality metric is:

```text
avoid high-confidence incorrect flow-driving signals
```

---

## 35. Prototype Implementation Slice

Phase 4 implementation should be a prototype upgrade, not a full memory redesign.

### 35.1 Prototype Goal

```text
Replace scattered heuristic interpretation with a governed InterpretationLayer
that produces accepted semantic signals before boundary resolution, operating
context update, knowledge routing, validation, and audit.
```

### 35.2 Minimal Modules to Add or Refine

```text
1. FastBoundarySignalScanner
2. AIInterpretationClient
3. InterpretationValidator
4. BoundaryResolver integration
5. OperatingContextManager integration
6. KnowledgeGateway integration
7. AuditEventWriter extension
8. Interpretation evaluation tests
9. StudentPostureSignal evaluation tests
10. ExecutionContextComposer posture/response-mode integration
```

### 35.3 Not Included Yet

```text
1. durable student memory schema
2. memory history/current-truth storage
3. full recommendation engine
4. CRM integration
5. production knowledge governance
6. production interpretation operations dashboard
```

### 35.4 Minimal Tests

The prototype should add tests for:

```text
1. Weak interest does not become confirmed preference.
2. Confirmed counseling preference does not become registration intent.
3. Apply/register language becomes readiness-to-register + red boundary.
4. Ambiguous "proceed" language becomes clarify-once.
5. Route-based minimum profile marks academic result, course direction status, and university direction status.
6. Ranking/budget/location are emitted as quality-enhancing signals, not minimum-profile gates.
7. Course/university/pathway considering fields are extracted.
8. Quality-enhancing irrelevant noise is ignored.
9. Fee/requirement/ranking question triggers knowledgeNeedSignal.
10. Direction change creates contradictionSignal.
11. AcceptedInterpretation is included in audit.
12. Rejected/downgraded interpretation signals are included in audit.
```

---

## 36. Failure Behavior

### 36.1 AI Interpretation Invalid Schema

```text
repair once
if still invalid, reject interpretation and use safe fallback
```

Allowed fallback:

```text
continue with fast boundary signals and conservative context handling
```

If boundary-sensitive:

```text
clarify or hand off depending on risk
```

### 36.2 Missing Evidence

```text
reject unsupported signal
```

If unsupported signal is flow-driving:

```text
block or downgrade
```

If unsupported signal is boundary-sensitive:

```text
keep as caution only if fast scan or context supports it
otherwise reject
```

### 36.3 Over-Promotion

Example:

```text
Student says: "Psychology sounds interesting."
Interpreter proposes confirmedCounselingCoursePreference.
```

Failure behavior:

```text
downgrade to coursesConsidering + L1 weak interest
record promotion_blocked validation event
```

### 36.4 Ambiguous Proceed

Example:

```text
Student says: "Can we proceed?"
```

Failure behavior:

```text
create ambiguous_proceed_language boundary signal
final behavior = clarify_once
no L4 or L5 commit yet unless clarified
```

### 36.5 Clear Red Zone

Example:

```text
Student says: "Can you register me now?"
```

Failure behavior:

```text
BoundaryResolver final_zone = red
normal skill behavior overridden
handoff required
official action outputs blocked
```

### 36.6 No Accepted Interpretation

If interpretation fails entirely:

```text
No accepted interpretation, no interpretation-driven memory/state update.
```

The runtime may still use deterministic fast boundary scan and safe fallback.

---

## 37. Examples

### 37.1 Route-Based Minimum Counseling Profile

Student:

```text
I got 5 credits. I don't have a course or university in mind yet.
```

Interpretation:

```yaml
flowDriving:
  academicResult:
    rawText: 5 credits
    confidence: high
    evidence:
      - quote: "I got 5 credits"

  minimumProfileSignals:
    academicResultKnown: true
    courseDirectionStatusKnown: true
    universityDirectionStatusKnown: true
    academicResultStatus:
      value: known
    courseDirectionStatus:
      value: unknown
    universityDirectionStatus:
      value: unknown
    routeReadiness:
      value: route_ready
    suggestedCounselingRoute:
      value: course_or_pathway_exploration
```

Student:

```text
I want a budget university around KL.
```

Interpretation:

```yaml
qualityEnhancingSignals:
  - type: budget_sensitivity
    value:
      preference: budget_or_value
    usefulness: high

  - type: location_preference
    value:
      location: KL
    usefulness: high
```

Not allowed:

```yaml
minimumProfileSignals:
  universityPreferenceTypeKnown: true
  locationPreferenceKnown: true
```

### 37.2 Weak Interest

Student:

```text
Psychology sounds interesting.
```

Interpretation:

```yaml
flowDriving:
  coursesConsidering:
    - courseOrProgram: Psychology
      status: considering
      confidence: high
      evidence:
        - quote: "Psychology sounds interesting"
      promotionRisk: none
  preferenceStrengthCandidate:
    level: L1
    label: weak_interest
    confidence: high
    evidence:
      - quote: "sounds interesting"
```

Not allowed:

```yaml
confirmedCounselingCoursePreference:
  courseOrProgram: Psychology
```

### 37.3 Expressed Preference

Student:

```text
I think I prefer Psychology over Business.
```

Interpretation:

```yaml
flowDriving:
  coursesConsidering:
    - courseOrProgram: Psychology
      status: preferred
    - courseOrProgram: Business
      status: considering
  preferenceStrengthCandidate:
    level: L3
    label: expressed_preference
```

Not allowed:

```yaml
readinessToRegisterSignal:
  intent: apply_now
```

### 37.4 Confirmed Counseling Preference

Student:

```text
Yes, Psychology at University A is my choice for now.
```

Interpretation:

```yaml
flowDriving:
  confirmedCounselingCoursePreference:
    courseOrProgram: Psychology
    status: confirmed_counseling_preference
  confirmedCounselingUniversityPreference:
    university: University A
    status: confirmed_counseling_preference
  preferenceStrengthCandidate:
    level: L4
    label: confirmed_counseling_preference
```

Forbidden interpretation:

```yaml
applicationStatus: submitted
registrationStatus: completed
```

### 37.5 Ready to Apply

Student:

```text
I want to apply now.
```

Interpretation:

```yaml
flowDriving:
  readinessToRegisterSignal:
    intent: apply_now
    triggerType: H1
    confidence: high
    evidence:
      - quote: "I want to apply now"

boundaryCandidateSignals:
  - type: ready_to_apply_or_register
    triggerType: H1
    severityCandidate: red
    recommendedBehavior: handoff
```

### 37.6 Ambiguous Proceed

Student:

```text
Can we proceed?
```

Interpretation:

```yaml
boundaryCandidateSignals:
  - type: ambiguous_proceed_language
    severityCandidate: yellow
    recommendedBehavior: clarify_once
    confidence: high
    evidence:
      - quote: "Can we proceed?"

confidenceSummary:
  requiresClarification: true
  clarificationReason: Ambiguous proceed language may mean counseling preference or official application step.
```

### 37.7 Knowledge Need

Student:

```text
What is the fee for Psychology at University A?
```

Interpretation:

```yaml
knowledgeNeedSignals:
  - type: fees
    query: fee for Psychology at University A
    decisionCriticality: possibly_decision_critical
    confidence: high
    evidence:
      - quote: "What is the fee for Psychology at University A?"
```

### 37.8 Direction Change

Student:

```text
Actually, I don't want Psychology anymore. I want IT.
```

Interpretation:

```yaml
flowDriving:
  coursesConsidering:
    - courseOrProgram: IT
      status: considering
      confidence: high

contradictionSignals:
  - type: direction_change
    newClaim:
      courseOrProgram: IT
    recommendedBehavior: preserve_history_and_switch_active_direction
    evidence:
      - quote: "Actually, I don't want Psychology anymore. I want IT."
```

### 37.9 Student Posture — Lost or Confused

Student:

```text
I don't know what course suits me.
```

Interpretation:

```yaml
studentPostureSignal:
  posture: lost_or_confused
  counselingImplication: reassure_and_orient
  suggestedResponseMode: reassuring_orientation
  confidence: high
  evidence:
    - quote: "I don't know what course suits me"
```

Downstream implication:

```text
Use a reassuring route explanation and ask one lightweight direction question.
Do not force a long intake or university-fit questionnaire.
```

### 37.10 Student Posture — Course First

Student:

```text
I want Psychology, but I don't know which university.
```

Interpretation:

```yaml
flowDriving:
  coursesConsidering:
    - courseOrProgram: Psychology
      status: preferred

studentPostureSignal:
  posture: course_first
  counselingImplication: route_to_university_exploration
  suggestedResponseMode: route_explanation
  confidence: high
  evidence:
    - quote: "I want Psychology, but I don't know which university"
```

Downstream implication:

```text
Explain that the next useful route is university exploration for Psychology.
Ranking, budget, and location may be asked when relevant to university fit.
```

### 37.11 Student Posture — Decision Ready

Student:

```text
This option seems best for me.
```

Interpretation:

```yaml
studentPostureSignal:
  posture: decision_ready
  counselingImplication: confirm_preference
  suggestedResponseMode: milestone_confirmation
  confidence: medium
  evidence:
    - quote: "This option seems best for me"
```

Important:

```text
Decision-ready posture alone is not enough to commit confirmed counseling preference.
The preference ladder and confirmation rules still apply.
```

---

## 38. Decisions Locked by Phase 4

Phase 4 locks the following decisions:

1. Phase 4 introduces a dedicated Interpretation & Extraction Layer before durable memory design.
2. The primary Phase 4 goals are memory correctness and boundary/red-zone detection.
3. Recommendation input quality is secondary in the first implementation.
4. Interpretation uses split placement: fast boundary scan, AI interpretation, platform validation, boundary resolution.
5. Obvious red-zone detection must not depend only on AI interpretation.
6. The first implementation uses one AI interpreter call, not multiple specialized extractor heads.
7. The contract remains future-compatible with multi-head extractors.
8. `InterpretationResult` is a proposal, not truth.
9. `AcceptedInterpretation` is the validated per-turn semantic artifact.
10. Accepted interpretation may guide downstream modules but does not directly commit durable memory or official truth.
11. Flow-driving fields are hard-coded first-class fields.
12. `MinimumProfileSignals` uses the Phase 1 v1.1 route-based profile, preserved in v1.2: academic result status, course direction status, and university direction status.
13. Ranking/prestige, budget/value, location, campus, intake, and similar university-fit signals are not minimum-profile gates.
14. Quality-enhancing signals use a flexible array.
15. Boundary, knowledge, and contradiction signals remain separate from normal student-context fields.
16. Confirmed counseling preference fields must use counseling-safe names.
17. Confirmed counseling preference must not become official action truth.
18. All signals require evidence and confidence.
19. Evidence may come from current message or conversation context.
20. No evidence means no high-confidence signal.
21. Flow-driving promotion requires stronger evidence than quality-enhancing context.
22. Ambiguous proceed language requires clarify-once behavior.
23. Red-zone signals favor recall.
24. Quality-enhancing signals must be useful, not noisy.
25. Contradiction signals do not automatically erase history.
26. Interpretation validation is platform-owned.
27. Interpretation audit must record raw, accepted, rejected, downgraded, and boundary-resolution input signals.
28. Phase 4 implementation is a prototype upgrade, not a full memory redesign.
29. Phase 4 v1.2 adds optional `studentPostureSignal` for counselor-like flow support.
30. Student posture is advisory and per-turn by default.
31. Student posture may influence response mode, skill context, and next best counseling move.
32. Student posture must not directly commit durable memory, confirmed preference, readiness-to-register, handoff, CRM, or official truth.
33. Human-help-seeking posture must preserve or emit an H6 boundary candidate for BoundaryResolver handling.
34. Broad posture labels should not become permanent student identity memory.

---

## 39. Open Questions Deferred to Later Phases

### 39.1 Deferred to Phase 5 — Student Memory & Counseling State

1. final durable memory schema
2. current truth versus historical record structure
3. memory update/merge policy
4. memory retention and deletion
5. confidence decay over time
6. memory visibility rules
7. full correction handling
8. how flow-driving fields map to durable memory tables/documents
9. how route-based minimum profile fields map into durable counseling state
10. how quality-enhancing signals are stored and queried
11. how hard constraints are promoted from quality-enhancing signals
12. memory write validation workflow details
13. whether any posture-derived counseling context should persist
14. how to avoid storing harmful or stale posture labels
15. how repeated indecision, decision blockers, and deferrals should be represented without labeling the student permanently

### 39.2 Deferred to Phase 6 — Business Knowledge & Source Governance

1. final knowledge source priority
2. freshness management
3. Google Sheet / Drive ingestion
4. internal-only fact handling
5. source conflict resolution
6. knowledge answerability scoring
7. decision-critical uncertainty routing

### 39.3 Deferred to Phase 7 — Recommendation & Decision Support

1. recommendation readiness extraction expansion
2. recommendation scoring inputs
3. recommendation lifecycle
4. recommendation reaction tracking
5. explanation quality evaluation

### 39.4 Deferred to Phase 8 — Handoff

1. final handoff package structure
2. handoff routing logic
3. counselor-facing summary format
4. post-handoff return-to-AI behavior
5. handoff accepted versus handoff prepared state

### 39.5 Deferred to Phase 10 — Guardrails

1. production policy engine integration
2. interpretation signal validation as guardrail rules
3. sensitive-context expansion
4. over-handoff tuning
5. policy regression test automation

### 39.6 Deferred to Phase 11 — Evaluation

1. full simulation suite
2. labeled gold datasets
3. extraction precision/recall dashboards
4. red-zone miss review workflow
5. interpretation drift monitoring
6. student posture detection accuracy and usefulness evaluation
7. counselor-like flow response-mode regression tests

### 39.7 Deferred to Phase 12 — Operations

1. interpretation schema governance
2. taxonomy maintenance workflow
3. review dashboard for rejected/downgraded signals
4. release and rollback of interpretation schema/model updates

---

## 40. Final Phase 4 Policy Statement

```text
The Interpretation & Extraction Layer converts raw student language into
structured, evidence-backed, confidence-scored semantic signals.

It uses deterministic fast boundary scanning for obvious red-zone risks and one
AI interpreter for richer semantic extraction.

The AI may propose interpretation, but the platform validates interpretation.
Only accepted interpretation may guide boundary resolution, operating context,
knowledge routing, response generation, validation, and audit.

Accepted interpretation is not durable memory, not CRM truth, and not official
application, registration, payment, enrollment, seat, or business-status truth.

Flow-driving counseling signals are represented as hard-coded first-class fields.
The minimum counseling profile is route-based: academic result status, course
direction status, and university direction status. Ranking, budget, location,
campus, intake, and similar fit details are quality-enhancing unless stated as
hard constraints.
Quality-enhancing counseling context is represented flexibly.
Boundary, knowledge, contradiction, and student posture signals remain separate
runtime-control or response-style signals.

Student posture supports counselor-like flow by helping the runtime and selected
skills choose response mode, decision-support behavior, soft summary checkpoints,
and milestone confirmation behavior. It is advisory, evidence-backed, per-turn by
default, and must not become durable identity memory or official truth.

The first implementation should upgrade the existing prototype, prove memory,
boundary, and counselor-like posture interpretation quality through focused tests,
and defer durable memory storage design to Phase 5.
```

