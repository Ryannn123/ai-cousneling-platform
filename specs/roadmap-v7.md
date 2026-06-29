# Bounded Autonomous Counseling Platform — Updated Exploration Roadmap

**Project:** AI Counseling Platform Redesign  
**Roadmap Version:** 7.0 — revised after Phase 4 Interpretation & Extraction Layer approval  
**Date:** 2026-06-28  
**Status:** Phase 0 approved; Phase 1 approved; Phase 2 approved; Phase 3 approved; Phase 4 approved; prototype runtime checkpoint proven; Phase 5 is the next active exploration  
**Source Inputs:**

1. Phase 0 — Bounded Autonomy Baseline Specification
2. Phase 1 — Autonomous Counseling Operating Model Specification
3. Phase 2 — Counseling SOP & Skill Control Specification
4. Phase 3 — Autonomous Runtime Strategy Specification
5. Phase 4 — Interpretation & Extraction Layer Specification
6. Prototype Runtime Checkpoint
7. Roadmap v6.0
8. Phase 4 exploration discussion

---

## 1. Purpose of This Updated Roadmap

This roadmap updates the bounded-autonomous counseling platform roadmap after completing and approving:

1. **Phase 0 — Bounded Autonomy Baseline**
2. **Phase 1 — Autonomous Counseling Operating Model**
3. **Phase 2 — Counseling SOP & Skill Control**
4. **Phase 3 — Autonomous Runtime Strategy**
5. **Phase 4 — Interpretation & Extraction Layer**

Roadmap v6 inserted Phase 4 before durable memory because:

```text
Memory quality depends on interpretation quality.
```

Roadmap v7 now locks Phase 4 and updates later phases to consume the Phase 4 artifact:

```text
AcceptedInterpretation
```

The new dependency chain is:

```text
Natural language student message
  ↓
Fast boundary signal scan
  ↓
Interpretation & Extraction Layer
  ↓
AcceptedInterpretation
  ↓
Boundary resolution + operating context update
  ↓
Student Memory & Counseling State
  ↓
Business Knowledge
  ↓
Recommendation
  ↓
Handoff
  ↓
CRM
  ↓
Guardrails
  ↓
Evaluation
  ↓
Operations
  ↓
Prototype / Production Hardening
```

The most important change from Roadmap v6 is:

```text
Phase 5+ must not consume raw transcript or uncontrolled summaries as their
primary source of truth.

They should consume validated semantic artifacts from Phase 4, especially
AcceptedInterpretation, accepted operating context, validated AI outputs,
blocked outputs, and audit evidence.
```

---

## 2. Updated Product Direction

The platform remains:

```text
An AI-first bounded autonomous counseling system.
```

The AI should be the primary student-facing counselor for ordinary pre-registration counseling. It should autonomously handle:

1. onboarding
2. minimum profile collection
3. interest exploration
4. course/program exploration
5. pathway exploration
6. university exploration
7. factual detours and journey resume
8. recommendation
9. comparison and shortlisting
10. counseling preference confirmation
11. deferral and indecision support
12. readiness-to-register detection
13. handoff context preparation

Humans remain responsible for:

1. application, registration, enrollment, payment, or seat-reservation actions
2. official CRM/application/registration state changes
3. high-risk or sensitive actions
4. exception, appeal, waiver, negotiation, or complex eligibility cases
5. student-requested human support
6. scenarios outside approved SOP/skill coverage

The system should not reduce risk by forcing human review everywhere. It should reduce risk by allowing AI counseling autonomy inside approved skills while platform-owned controls validate interpretation, boundaries, memory commits, knowledge access, recommendation records, handoff, CRM separation, audit, and evaluation.

The core runtime principle remains:

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

Roadmap v7 extends this into:

```text
AI may interpret and extract.
Platform validates semantic signals.
AcceptedInterpretation may guide downstream runtime decisions.
AcceptedInterpretation does not directly commit durable memory, CRM truth,
registration truth, payment truth, enrollment truth, seat truth, or official status.
```

---

## 3. Locked Foundation From Approved Phases

## 3.1 Phase 0 — Bounded Autonomy Baseline

**Status:** Approved

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

## 3.2 Phase 1 — Autonomous Counseling Operating Model

**Status:** Approved

Phase 1 defines the pre-registration counseling journey.

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

## 3.3 Phase 2 — Counseling SOP & Skill Control

**Status:** Approved

Phase 2 defines how counseling behavior is packaged and enforced using approved `SKILL.md` artifacts.

### Locked Skill Stance

```text
Counselor-owned guidance.
Runtime-enforced boundaries.
Moderately guided AI behavior.
Structured metadata for safety, selection, validation, and audit.
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

## 3.4 Phase 3 — Autonomous Runtime Strategy

**Status:** Approved

Phase 3 defines the prototype-first runtime strategy.

### Locked Runtime Style

```text
Deterministic shell + AI counseling core.
```

### Locked Principle

```text
AI proposes.
Platform validates.
Platform commits.
```

### Locked Two-Checkpoint Runtime

```text
Checkpoint 1 — Pre-generation control
Checkpoint 2 — Pre-commit validation
```

### Locked Prototype Flow Before Phase 4

```text
1. Receive student message
2. Load previous runtime conversation state
3. Run BoundaryEngine
4. Build/update accepted OperatingContext
5. Select valid SKILL.md artifacts
6. Call Knowledge Gateway if factual knowledge is needed
7. Compose ExecutionContext
8. Call AIExecutionClient
9. Validate AIExecutionResult
10. Correct, block, downgrade, regenerate once, clarify, hand off, or fallback
11. Commit validated outputs only
12. Write structured audit event
13. Return final response
```

### Locked Module Topology Before Phase 4

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

---

## 3.5 Prototype Runtime Checkpoint

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

Phase 4 was created to address the first of these: AI extraction and classification.

---

## 3.6 Phase 4 — Interpretation & Extraction Layer

**Status:** Approved

Phase 4 defines how raw student language becomes validated semantic signals before downstream modules consume it.

### Locked Phase 4 Principle

```text
AI may interpret and extract.
Platform validates semantic signals.
Only validated semantic signals may influence boundary resolution, operating
context, knowledge routing, memory validation, handoff, recommendation,
response validation, or audit truth.
```

### Locked Boundary

```text
AcceptedInterpretation is not durable memory.
AcceptedInterpretation is not CRM truth.
AcceptedInterpretation is not official application, registration, enrollment,
payment, seat, or business-status truth.
```

### Locked Design Stance

```text
Split safety scan + AI semantic interpretation + platform validation.
```

### Locked Runtime Placement

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

### Locked Signal Scope

Initial Phase 4 implementation produces:

1. hard-coded `flowDriving` fields
2. flexible `qualityEnhancingSignals[]`
3. `boundaryCandidateSignals[]`
4. `knowledgeNeedSignals[]`
5. `contradictionSignals[]`
6. `confidenceSummary`

Deferred signal categories:

1. explicit `journey_state_candidate`
2. explicit `primary_action_candidate`
3. explicit `recommendation_readiness_candidate`
4. explicit detour/resume signal
5. emotion/friction signal

### Locked Flow-Driving Fields

Flow-driving signals are hard-coded because they affect counseling state and next actions.

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

Use counseling-safe names:

```text
confirmedCounselingCoursePreference
confirmedCounselingUniversityPreference
confirmedCounselingPathwayPreference
```

Do not use ambiguous names like `confirmedCourse` or `confirmedUniversity` because counseling preference is not official action.

### Locked Flexible Context Field

Quality-enhancing signals remain flexible:

```ts
type QualityEnhancingSignal = BaseSignal & {
  type:
    | "concern"
    | "budget_sensitivity"
    | "location_preference"
    | "family_influence"
    | "learning_preference"
    | "study_mode_preference"
    | "timeline_preference"
    | "career_interest"
    | "personality_preference"
    | "other";

  value: Record<string, unknown>;
  usefulness: "low" | "medium" | "high";
  sensitivity: "none" | "possibly_sensitive" | "sensitive";
};
```

### Locked InterpretationResult

```ts
type InterpretationResult = {
  conversationId: string;
  turnId: string;
  messageId: string;

  flowDriving: FlowDrivingSignals;
  qualityEnhancingSignals: QualityEnhancingSignal[];

  boundaryCandidateSignals: BoundaryCandidateSignal[];
  knowledgeNeedSignals: KnowledgeNeedSignal[];
  contradictionSignals: ContradictionSignal[];

  confidenceSummary: ConfidenceSummary;
};
```

### Locked AcceptedInterpretation

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

### Locked InterpretationValidator Sequence

```text
1. schema validation
2. evidence validation
3. flow-driving promotion validation
4. boundary signal validation
5. quality-enhancing signal validation
6. contradiction validation
```

### Locked Consumption Rule

`AcceptedInterpretation` is a shared per-turn semantic artifact.

It may guide:

1. BoundaryResolver
2. OperatingContextManager
3. KnowledgeGateway
4. ExecutionContextComposer
5. ValidationPipeline
6. AuditEventWriter

It does not directly commit:

1. durable memory
2. recommendation records
3. handoff records
4. CRM status
5. official application truth
6. official registration truth
7. payment truth
8. seat truth
9. enrollment truth

### Locked Phase 4 Prototype Slice

The first Phase 4 implementation should upgrade the existing prototype with:

1. FastBoundarySignalScanner
2. AIInterpretationClient
3. InterpretationValidator
4. BoundaryResolver integration
5. OperatingContextManager integration
6. KnowledgeGateway integration
7. AuditEventWriter extension
8. focused interpretation evaluation tests

It should not yet implement full durable memory, recommendation lifecycle, CRM integration, or production knowledge governance.

---

## 4. Updated High-Level Target Architecture

Roadmap v7 target architecture:

```text
Student-facing Chat UI
  ↓
Counseling Runtime API
  ↓
CounselingTurnOrchestrator
  ├── FastBoundarySignalScanner
  ├── AIInterpretationClient
  ├── InterpretationValidator
  ├── BoundaryResolver
  ├── OperatingContextManager
  ├── SkillControlService
  │     ├── Approved Skill Index Client
  │     ├── Skill Retriever
  │     ├── Skill Metadata Filter
  │     ├── Skill Selector
  │     └── Boundary Rule Loader
  ├── KnowledgeGateway
  │     ├── Answerability Checker
  │     ├── Student-Safe Fact Filter
  │     ├── Internal-Only Filter
  │     └── Source Reference Collector
  ├── ExecutionContextComposer
  ├── AIExecutionClient
  ├── ValidationPipeline
  │     ├── Schema Validator
  │     ├── Skill Compatibility Validator
  │     ├── Boundary Validator
  │     ├── Interpretation Validator
  │     ├── Preference Promotion Validator
  │     ├── Memory Output Validator
  │     ├── Recommendation Validator
  │     ├── Knowledge Uncertainty Validator
  │     └── Response Consistency Validator
  ├── OutputCommitService
  └── AuditEventWriter

External Business-Operated Skill Repository
  ├── SKILL.md Playbooks
  ├── SKILL.md Runtime Skills
  └── SKILL.md Boundary Rules
        ↓
Skill Index Builder / Validator
        ↓
Approved Runtime Skill Index
```

### 4.1 Updated Runtime Responsibility Split

AI-controlled:

1. natural student-facing language
2. counseling explanation style
3. semantic interpretation proposals
4. extraction proposals
5. structured `InterpretationResult` proposal
6. recommendation explanation inside selected skills
7. clarification phrasing
8. detour/resume wording
9. structured counseling output proposals

Platform-controlled:

1. fast boundary scanning
2. interpretation validation
3. accepted interpretation production
4. final boundary result
5. accepted operating context
6. final skill selection
7. knowledge gateway answerability
8. memory validation
9. recommendation validation
10. handoff validation
11. official-action blocking
12. validated commit
13. audit and evaluation labels

Counselor/business-controlled:

1. SKILL.md playbook content
2. SKILL.md runtime skill guidance
3. SKILL.md boundary-rule guidance
4. examples and response patterns
5. counseling SOP language
6. external skill repository operations
7. knowledge source maintenance
8. interpretation taxonomy review in future operations
9. quality review feedback

---

## 5. Updated Exploration Phases

---

## Phase 0 — Bounded Autonomy Baseline

**Status:** Approved  
**Purpose:** Define the product-level autonomy stance.

### Core Question

```text
How autonomous should the AI counselor be, and where must autonomy stop?
```

### Deliverable

```text
Bounded Autonomy Baseline Specification — Approved.
```

---

## Phase 1 — Counseling Operating Model

**Status:** Approved  
**Purpose:** Define how the AI counselor should operate across the pre-registration student journey.

### Core Question

```text
What counseling journey should the AI autonomously guide before red-zone handoff is required?
```

### Deliverable

```text
Autonomous Counseling Operating Model Specification — Approved.
```

---

## Phase 2 — Behavior Control, SOP & Skill System

**Status:** Approved  
**Purpose:** Define how approved counseling behavior is packaged, controlled, consumed, validated, and audited.

### Core Question

```text
How do we turn the Phase 1 operating model into governed SOPs and skills
that business users can approve, maintain, test, and safely release?
```

### Deliverable

```text
Counseling SOP & Skill Control Specification — Approved.
```

---

## Phase 3 — Autonomous Runtime Strategy

**Status:** Approved  
**Purpose:** Decide what kind of runtime should execute the Phase 1 journey and Phase 2 SKILL.md control system.

### Core Question

```text
What runtime architecture should execute the Phase 1 counseling journey and
Phase 2 SKILL.md control system while preserving Phase 0 bounded autonomy,
deterministic boundaries, validation, and auditability?
```

### Deliverable

```text
Autonomous Runtime Strategy Specification — Approved.
```

---

## Phase 4 — Interpretation & Extraction Layer

**Status:** Approved  
**Purpose:** Define how raw student language becomes structured, evidence-backed semantic signals before downstream systems consume it.

### Core Question

```text
How should the platform extract facts and interpret student meaning from natural
language so downstream runtime decisions, memory writes, boundary checks,
knowledge routing, handoff records, and audit evidence are based on validated
semantic signals rather than scattered heuristics or uncontrolled summaries?
```

### Locked Decisions

```text
1. Phase 4 prioritizes memory correctness and boundary/red-zone detection.
2. Phase 4 uses split safety scan + AI semantic interpretation + platform validation.
3. FastBoundarySignalScanner runs before AI interpretation.
4. AIInterpretationClient produces one full InterpretationResult in the first implementation.
5. InterpretationValidator validates, downgrades, rejects, or flags clarification.
6. AcceptedInterpretation is a shared per-turn semantic artifact.
7. Flow-driving signals are hard-coded first-class fields.
8. Quality-enhancing signals remain flexible in qualityEnhancingSignals[].
9. Boundary, knowledge, and contradiction signals remain separate.
10. AcceptedInterpretation does not directly commit durable memory or official truth.
11. BoundaryResolver remains final authority for zone and handoff.
12. Durable memory design remains Phase 5.
```

### Deliverable

```text
Interpretation & Extraction Layer Specification — Approved.
```

---

## Phase 5 — Student Memory & Counseling State

**Status:** Next active exploration  
**Purpose:** Define durable student memory and counseling state using validated Phase 4 interpretation artifacts.

### Core Question

```text
What durable student memory and counseling state model should persist validated
Phase 4 interpretation signals, Phase 3 validated outputs, and Phase 1 counseling
state while preventing weak signals, counseling preferences, readiness signals,
or AI interpretations from becoming official application, registration, payment,
enrollment, seat, or CRM truth?
```

### Updated Design Goal After Phase 4 Approval

Phase 5 should consume:

1. `AcceptedInterpretation`
2. accepted operating context updates
3. validated memory outputs
4. validated recommendation outputs
5. validated handoff outputs
6. blocked output records
7. rejected/downgraded interpretation signals
8. source skill/version/hash evidence
9. student-message evidence spans
10. validation events and audit events

Phase 5 should not use raw transcript or uncontrolled summaries as its primary memory source.

### Key New Design Question

Phase 4 introduced:

```text
flowDriving fields
qualityEnhancingSignals[]
```

Phase 5 must decide how these map into durable memory.

Potential memory model direction:

```text
Core counseling state:
  durable current truth and history for flow-driving fields.

Supporting counseling context:
  durable or semi-durable quality-enhancing signals that improve personalization.
```

But Phase 5 must choose final naming and storage behavior.

### Required Phase 5 Topics

```text
1. core counseling state vs supporting counseling context
2. durable representation of flowDriving fields
3. durable representation of qualityEnhancingSignals[]
4. current truth vs historical event records
5. active course direction
6. active university direction
7. active pathway direction
8. courses considering
9. universities considering
10. pathways considering
11. confirmed counseling course preference
12. confirmed counseling university preference
13. confirmed counseling pathway preference
14. academic result memory
15. minimum profile memory
16. preference strength L1–L5 memory
17. readiness-to-register signal memory
18. contradiction and correction handling
19. preference downgrade handling
20. deferral and indecision memory
21. concerns and constraints memory
22. budget, location, family, timeline, and study-mode context
23. evidence spans and confidence fields
24. interpretation result linkage
25. skill/version/hash linkage
26. validator result linkage
27. blocked output retention
28. rejected/downgraded signal retention
29. memory write validation workflow
30. memory deletion, correction, and supersession behavior
31. memory visibility and privacy
32. sensitive memory routing
33. runtime state vs durable memory boundary
34. counseling memory vs CRM truth boundary
35. no uncontrolled summary blobs
```

### Required State Labels

```text
weak_interest
expressed_interest
expressed_preference
rejected_option
student_concern
student_constraint
recommendation_reaction
deferral
confirmed_counseling_preference
readiness_to_register_signal
official_application_status
official_registration_status
```

Important:

```text
official_application_status and official_registration_status may be read from
CRM or official systems later, but they must not be created by autonomous AI
memory output or interpretation output.
```

### Expected Deliverable

```text
Autonomous Student Memory & Counseling State Specification
```

---

## Phase 6 — Business Knowledge & Source Governance

**Purpose:** Expand the prototype KnowledgeGateway into full business knowledge governance.

### Core Question

```text
How does the autonomous counselor know what is factually true, what it is allowed
to expose, and when missing or conflicting knowledge requires caveat or handoff,
using AcceptedInterpretation knowledge need signals, skill-declared knowledge
needs, and governed source access?
```

### Updated Design Goal After Phase 4 Approval

Phase 6 should consume:

1. accepted `knowledgeNeedSignals[]`
2. accepted flow-driving course/university/pathway context
3. accepted minimum profile signals
4. accepted decision-criticality from interpretation
5. selected skill metadata
6. boundary rules
7. existing memory context from Phase 5

Knowledge routing should not depend only on the response-generation model noticing that it needs factual support.

### Revised Key Topics

```text
1. KnowledgeGateway input contract from AcceptedInterpretation
2. knowledge need signal taxonomy governance
3. public university filter service integration
4. Google Sheet KB integration
5. Google Drive / document retrieval
6. source routing
7. source priority
8. student-safe vs internal-only knowledge
9. source freshness
10. factual answerability
11. conflicting knowledge handling
12. fact vs SOP separation
13. knowledge retrieval for factual detours
14. knowledge retrieval for exploration
15. knowledge retrieval for recommendation
16. knowledge retrieval for comparison
17. knowledge retrieval for handoff context
18. skill-declared knowledge needs
19. interpretation-detected knowledge needs
20. memory-detected knowledge needs
21. gateway-controlled source access
22. caveat behavior for incomplete facts
23. decision-critical uncertainty escalation
24. internal-only leakage prevention
25. audit trail for retrieved knowledge
26. unsupported factual claim blocking
27. relationship to internal-only boundary rules
28. knowledge result validation before AI response
```

### Updated Source Priority

```text
1. Public university filter service
2. Structured Google Sheet data
3. Google Drive / scattered documents
4. Human review
```

### Expected Deliverable

```text
Business Knowledge & Source Governance Specification
```

---

## Phase 7 — Recommendation & Decision Support Automation

**Purpose:** Define how the AI recommends and supports high-impact counseling decisions.

### Core Question

```text
How can the AI recommend courses, pathways, universities, and programs
autonomously while maintaining quality, confidence discipline, explainability,
and official-action separation using AcceptedInterpretation, durable counseling
memory, governed knowledge, selected skills, and runtime validation?
```

### Updated Design Goal After Phase 4 Approval

Recommendations should depend on validated semantic inputs, not transcript reinterpretation.

Primary recommendation inputs should include:

1. accepted flow-driving fields
2. durable core counseling state
3. quality-enhancing counseling context
4. accepted academic result
5. accepted minimum profile
6. accepted course/university/pathway directions
7. accepted constraints and concerns
8. accepted preference strength
9. accepted recommendation readiness when added
10. knowledge source references
11. selected skill guidance and constraints

### Revised Key Topics

```text
1. recommendation input contract
2. flowDriving fields as recommendation inputs
3. qualityEnhancingSignals as personalization inputs
4. durable memory as recommendation context
5. minimum profile vs rich profile
6. academic fit criteria
7. location fit criteria
8. ranking/prestige vs budget/value preference
9. course/program fit
10. pathway fit
11. university fit
12. use of weak signals
13. preference strength L1–L5
14. recommendation readiness R1–R3
15. recommendation confidence
16. recommendation assumptions
17. recommendation cautions
18. comparison and shortlisting
19. decision-support frames for indecision
20. deferral handling
21. recommendation record lifecycle
22. recommendation source references
23. student reaction tracking
24. high-impact confirmation language
25. readiness-to-register detection after recommendation
26. prevention of overclaiming
27. no conversion of recommendation into official action
28. selected skill id/version/hash in recommendation records
29. recommendation validation before commit
30. recommendation confidence downgrade behavior
31. knowledge uncertainty caveats
32. recommendation evaluation scenarios
33. recommendation quality dependency on interpretation quality
```

### Expected Deliverable

```text
Recommendation & Decision Support Automation Specification
```

---

## Phase 8 — Registration Boundary & Human Handoff

**Purpose:** Define the hard boundary between autonomous counseling and human-owned official action.

### Core Question

```text
When must the AI stop counseling autonomously and hand off to a human, and what
context should the human receive, using Phase 2 boundary rules, Phase 3 runtime
validation, Phase 4 AcceptedInterpretation evidence, and Phase 5 durable memory?
```

### Updated Design Goal After Phase 4 Approval

Handoff should be explainable from validated interpretation evidence.

Example:

```text
Student said: "I want to apply now."
FastBoundarySignalScanner: ready_to_apply_or_register.
AcceptedInterpretation: readinessToRegisterSignal, H1, high confidence.
BoundaryResolver: final zone red.
Handoff: required.
```

### Revised Key Topics

```text
1. H1 ready-to-apply/register intent
2. H2 official action request
3. H3 payment / seat / enrollment commitment
4. H4 exception / appeal / waiver / complex eligibility
5. H5 sensitive or high-risk context
6. H6 student-requested human support
7. ambiguous proceed-language clarification
8. use of fastBoundarySignals in handoff evidence
9. use of boundaryCandidateSignals in handoff evidence
10. use of readinessToRegisterSignal in handoff evidence
11. red-zone interruption behavior
12. no-official-action boundary behavior
13. handoff package content
14. student-facing handoff response
15. counselor-facing summary
16. confirmed counseling preferences in handoff
17. unresolved decision points
18. recommendation record references
19. source references used
20. interpretation evidence used
21. memory evidence used
22. CRM context in handoff
23. no claim of official completion
24. handoff audit trail
25. boundary override audit event
26. under-handoff prevention
27. over-handoff tuning
28. post-handoff student experience
29. return-to-AI behavior after handoff boundary
30. handoff prepared vs handoff accepted vs counselor contacted
31. sensitive/complex-case routing differences
```

### Expected Deliverable

```text
Registration Boundary & Human Handoff Specification
```

---

## Phase 9 — CRM Integration Model

**Purpose:** Define how the autonomous platform reads CRM context and later supports controlled CRM writeback.

### Core Question

```text
What should the AI platform read from or write to CRM, and under what approval
conditions, while preserving CRM as operational truth and preventing interpretation
outputs, memory commits, skill outputs, runtime commits, or handoff readiness
signals from becoming official CRM truth?
```

### Updated Design Goal After Phase 4 Approval

Phase 4 strengthens the need for CRM truth separation.

Interpretation may detect that a student said:

1. they want to apply
2. they want to register
3. they want to pay
4. they believe they already applied
5. they believe payment was made
6. they want a seat reserved

But student statements and AI interpretation are not official truth unless confirmed by CRM or human-owned workflow.

### Revised Key Topics

```text
1. CRM identity linking
2. lead status read
3. counselor assignment read
4. official application status read
5. official registration status read
6. official payment status read if needed later
7. CRM truth vs AcceptedInterpretation
8. CRM truth vs counseling memory
9. confirmed counseling preference vs CRM application status
10. readiness-to-register signal vs registration completion
11. handoff prepared vs counselor action completed
12. interpretation output vs official CRM mutation
13. memory output vs official CRM mutation
14. skill-proposed output vs official CRM mutation
15. runtime commit vs official CRM mutation
16. CRM note creation candidates
17. CRM task creation candidates
18. human-approved writeback
19. low-risk writeback candidates
20. idempotency and audit
21. preventing AI from claiming unconfirmed CRM status
22. CRM read failure behavior
23. stale CRM context behavior
24. CRM writeback approval workflow
25. boundary rule relationship to CRM mutation blocking
26. OutputCommitService boundary around CRM writes
27. audit linkage between handoff and CRM actions
```

### Expected Deliverable

```text
CRM Integration & Writeback Evolution Specification
```

---

## Phase 10 — Guardrails, Policy & Boundary Enforcement

**Purpose:** Define the production control system that keeps autonomous counseling inside business expectations.

### Core Question

```text
How do we enforce Phase 0 boundaries, Phase 1 operating rules, Phase 2 skill
contracts, Phase 3 runtime validation, Phase 4 interpretation validity, and
Phase 5 memory rules without slowing down normal counseling?
```

### Updated Design Goal After Phase 4 Approval

Guardrails should validate not only final responses and memory writes, but also semantic signals before they influence downstream state.

This includes:

1. flow-driving field validation
2. preference-strength promotion validation
3. confirmed counseling preference validation
4. readiness-to-register signal validation
5. boundary candidate validation
6. sensitive-context detection
7. knowledge need detection
8. contradiction handling
9. quality-enhancing signal noise control

### Revised Key Topics

```text
1. green/yellow/red policy engine
2. state/action/zone validation
3. preference strength L1–L5 validation
4. flow-driving field validation
5. quality-enhancing signal validation
6. red-zone trigger validation
7. official-action blocking
8. registration/application/payment/seat-reservation blocking
9. sensitive/high-risk escalation
10. complex-case escalation
11. ambiguous proceed-language clarification
12. factual uncertainty rules
13. internal-only visibility rules
14. interpretation schema validation
15. evidence validation
16. confidence validation
17. memory write validation
18. recommendation safety rules
19. response safety rules
20. fallback behavior
21. policy overrides
22. boundary-rule SKILL.md integration
23. centralized policy engine vs SKILL.md boundary rules
24. under-handoff risk scoring
25. over-handoff tuning
26. red-zone recall monitoring
27. interpretation regression testing
28. boundary violation handling
29. audit evidence
```

### Expected Deliverable

```text
Guardrails & Boundary Enforcement Specification
```

---

## Phase 11 — Evaluation, Simulation & Quality Monitoring

**Purpose:** Define how the platform proves autonomous counseling quality over time.

### Core Question

```text
How do we know the autonomous counselor is behaving correctly across Phase 0
boundaries, Phase 1 journey states, Phase 2 skill execution, Phase 3 runtime
validation, Phase 4 interpretation, Phase 5 memory, Phase 6 knowledge, Phase 7
recommendation, and Phase 8 handoff behavior?
```

### Updated Design Goal After Phase 4 Approval

Evaluation must test interpretation correctness explicitly.

It is not enough to test final response quality. The platform must test:

1. raw interpretation proposal quality
2. accepted interpretation correctness
3. rejected/downgraded signal correctness
4. fast boundary scanner recall
5. boundary resolver use of accepted interpretation
6. memory validator use of accepted interpretation
7. knowledge gateway routing from accepted knowledge needs
8. final response consistency with accepted semantic evidence

### Required Scenario Suites

```text
1. P1 Direct Recommendation Path
2. P2 Exploration-First Path
3. P3 Comparison / Shortlist Path
4. P4 Detour-Heavy Path
5. P5 Indecision / Deferral Path
6. P6 Confirmed Preference to Handoff Path
7. flowDriving.coursesConsidering extraction
8. flowDriving.confirmedCounselingCoursePreference extraction
9. flowDriving.universitiesConsidering extraction
10. flowDriving.confirmedCounselingUniversityPreference extraction
11. flowDriving.pathwaysConsidering extraction
12. academicResult extraction
13. minimumProfileSignals extraction
14. qualityEnhancingSignals useful concern retained
15. qualityEnhancingSignals irrelevant noise rejected
16. weak interest not over-promoted
17. expressed preference not over-promoted
18. confirmed counseling preference not treated as registration
19. ready-to-register/apply intent captured
20. ambiguous proceed/register language clarified
21. payment/seat reservation request captured
22. exception or waiver request captured
23. sensitive context request captured
24. human-requested handoff captured
25. contradiction and correction handling
26. direction change handling
27. knowledge need detection for fee
28. knowledge need detection for entry requirement
29. knowledge need detection for ranking
30. unsupported factual claim blocked or caveated
31. recommendation confidence downgraded when readiness is weak
32. response/output mismatch corrected before final response
33. malformed InterpretationResult repaired or rejected
34. rejected/downgraded interpretation signals audited
35. fastBoundarySignal and accepted boundary signal disagreement resolved safely
36. SKILL.md selection remains metadata-compatible
37. mandatory boundary rules load despite semantic mismatch
38. invalid memory output blocked
39. CRM truth not inferred from student claim
40. safe fallback when interpretation validation cannot complete
```

### Metric Bias

```text
Boundary/red-zone signals:
  prioritize recall.

Flow-driving memory signals:
  balance precision and recall, but avoid high-confidence wrong state.

Confirmed counseling preference:
  prioritize precision.

Ready-to-register/apply intent:
  prioritize recall.

Quality-enhancing signals:
  prioritize usefulness and low noise.

Knowledge need signals:
  prioritize recall when factual support could affect recommendation or decision.
```

### Expected Deliverable

```text
Autonomous Counseling Evaluation, Simulation & Quality Monitoring Specification
```

---

## Phase 12 — Admin, Knowledge & Skill Operations

**Purpose:** Define how humans maintain skills, knowledge, policies, interpretation schemas, runtime indexes, and quality controls.

### Core Question

```text
How do business users update SOPs, skills, knowledge, interpretation schemas,
policies, runtime indexes, and quality controls safely when SKILL.md authoring
and approval may happen outside the application?
```

### Updated Design Goal After Phase 4 Approval

Operations must maintain not only skills and knowledge, but also the interpretation taxonomy and schema used by memory, boundary, recommendation, handoff, and evaluation.

### Revised Key Topics

```text
1. external SKILL.md repository workflow
2. counselor-authored skill change process
3. skill approval workflow outside the application
4. skill validator/indexer operation
5. approved runtime skill index publishing
6. interpretation schema versioning
7. flowDriving field taxonomy maintenance
8. qualityEnhancingSignals taxonomy maintenance
9. boundaryCandidateSignals taxonomy maintenance
10. knowledgeNeedSignals taxonomy maintenance
11. contradictionSignals taxonomy maintenance
12. evidence/confidence rubric maintenance
13. interpretation prompt/version maintenance
14. interpretation model quality review
15. red-zone miss review
16. false positive boundary review
17. noisy quality signal review
18. memory pollution review
19. Google Sheet / Drive knowledge operations
20. source visibility tagging
21. internal-only tagging
22. knowledge freshness review
23. recommendation rule tuning
24. evaluation result review
25. handoff queue view
26. complex-case review
27. counselor feedback loop
28. audit inspection
29. release/change management
30. rollback for bad skill/knowledge/policy/interpretation updates
31. quality dashboard
32. runtime index publication monitoring
33. KnowledgeGateway source operations
34. validator failure trend review
35. blocked output review workflow
36. rejected/downgraded interpretation review workflow
```

### Expected Deliverable

```text
Admin, Knowledge & Skill Operations Specification
```

---

## Phase 13 — Prototype Vertical Slice

**Status:** Runtime vertical slice already checkpointed; next prototype update should implement Phase 4 contracts before expanding durable memory.  
**Purpose:** Build or refine the smallest end-to-end proof of bounded autonomous counseling.

### Core Question

```text
What is the smallest prototype that proves the AI can execute the approved
Phase 1 operating model through the approved Phase 2 SKILL.md control system,
using the approved Phase 3 runtime strategy and approved Phase 4 interpretation
layer, while preparing for Phase 5 durable memory and respecting Phase 0 handoff
boundaries?
```

### Updated Prototype Flow After Phase 4

```text
student message
→ FastBoundarySignalScanner
→ AIInterpretationClient
→ InterpretationValidator
→ AcceptedInterpretation
→ BoundaryResolver
→ OperatingContextManager
→ SkillControlService
→ KnowledgeGateway
→ ExecutionContextComposer
→ AIExecutionClient
→ ValidationPipeline
→ OutputCommitService
→ AuditEventWriter
```

### Prototype Must Prove After Phase 4

```text
1. deterministic shell controls AI interpretation and AI counseling
2. obvious red-zone scan runs before AI interpretation
3. AI interpreter produces typed InterpretationResult
4. InterpretationResult includes flowDriving fields
5. InterpretationResult includes qualityEnhancingSignals[]
6. InterpretationResult includes boundaryCandidateSignals[]
7. InterpretationResult includes knowledgeNeedSignals[]
8. InterpretationResult includes contradictionSignals[]
9. evidence and confidence are required
10. InterpretationValidator accepts, rejects, downgrades, or requires clarification
11. AcceptedInterpretation is available as shared per-turn artifact
12. BoundaryResolver consumes fast scanner + AcceptedInterpretation
13. OperatingContextManager consumes accepted flowDriving fields
14. KnowledgeGateway consumes accepted knowledgeNeedSignals
15. ValidationPipeline checks AI outputs against AcceptedInterpretation
16. weak interest does not become confirmed preference
17. confirmed counseling preference does not become registration truth
18. ready-to-register intent triggers handoff
19. ambiguous proceed language triggers clarification
20. irrelevant quality-enhancing noise is ignored
21. direction change creates contradiction signal
22. audit records raw, accepted, rejected, and downgraded interpretation
23. official-action outputs remain non-commit-eligible
24. existing 16/16 prototype safety tests remain passing or are replaced by stronger equivalents
```

### Expected Deliverable

```text
Bounded Autonomous Counseling Prototype Plan / Test Harness Update
```

---

## Phase 14 — Production Hardening Roadmap

**Purpose:** Define what is needed before production rollout.

### Core Question

```text
What must be hardened before autonomous counseling is safe and operationally
reliable at scale across runtime, interpretation, skills, knowledge, memory,
handoff, CRM, guardrails, evaluation, and operations?
```

### Updated Design Goal After Phase 4 Approval

Production hardening must treat the interpretation layer as a monitored, testable, versioned subsystem.

### Revised Key Topics

```text
1. authentication and identity
2. privacy and data retention
3. CRM reliability
4. knowledge freshness
5. interpretation schema versioning
6. interpretation model fallback
7. extraction quality monitoring
8. semantic signal drift monitoring
9. evidence/citation integrity
10. confidence calibration
11. contradiction handling reliability
12. FastBoundarySignalScanner maintenance
13. AIInterpretationClient reliability
14. InterpretationValidator reliability
15. accepted/rejected/downgraded signal audit retention
16. SKILL.md repository reliability
17. approved skill index reliability
18. skill validator/indexer monitoring
19. skill loading cache strategy
20. latest-approved version rollout behavior
21. content-hash audit integrity
22. monitoring and alerting
23. fallback behavior
24. abuse and misuse handling
25. multi-channel support
26. performance and latency
27. cost control
28. deployment strategy
29. staged automation rollout
30. counselor operations readiness
31. incident response
32. compliance and data access review
33. red-zone miss incident workflow
34. interpretation regression workflow
35. skill regression workflow
36. knowledge regression workflow
37. production evaluation dashboard
38. human review sampling plan
39. safe rollback for interpretation, skills, knowledge, policies, and runtime behavior
40. state/action/zone monitoring
41. skill selection monitoring
42. boundary override monitoring
43. detour/resume failure monitoring
44. recommendation confidence monitoring
45. handoff trigger monitoring
46. memory output validation monitoring
47. LangGraph migration decision
48. Deep Agents subroutine decision
49. distributed tracing and observability
50. model routing and fallback models
51. production data-contract versioning
52. audit/event retention and replay
```

### Rollout Posture

```text
Early pilot:
  Conservative handoff threshold.
  Heavy evaluation and human review sampling.
  Focus on interpretation quality, red-zone recall, skill selection correctness,
  memory validation safety, and handoff reliability.

Broader rollout:
  Increase autonomous yellow-zone continuation only after red-zone recall,
  boundary override recall, and interpretation quality are proven.
```

### Expected Deliverable

```text
Production Hardening Roadmap
```

---

## 6. Updated Near-Term Build Order

The recommended near-term build order is now:

```text
1. Implement Phase 4 InterpretationLayer in the existing prototype.
2. Add tests for InterpretationResult, AcceptedInterpretation, and validation behavior.
3. Keep existing Phase 3 safety tests passing.
4. Start Phase 5 memory exploration only after Phase 4 contracts are stable.
5. Design memory around AcceptedInterpretation, not raw transcript.
6. Then expand KnowledgeGateway and recommendation with validated inputs.
```

Do not jump directly to a durable memory database before clarifying:

1. which flow-driving fields are current truth
2. which are historical signals
3. how corrections supersede previous state
4. how quality-enhancing signals are retained or ignored
5. how evidence and confidence attach to memory
6. how blocked/rejected/downgraded signals are audited
7. how counseling memory stays separate from CRM truth

---

## 7. Current Open Risks

Roadmap v7 keeps these risks visible:

```text
1. live AI interpretation quality across real student language
2. schema adherence for InterpretationResult across providers
3. fast boundary scanner false negatives
4. AI interpretation missing subtle red-zone signals
5. AI interpretation over-producing noisy quality signals
6. flowDriving fields being over-promoted
7. confirmed counseling preference confused with registration intent
8. student corrections overwriting useful history incorrectly
9. knowledgeNeedSignals missing decision-critical factual needs
10. AcceptedInterpretation being treated as durable memory too early
11. memory design accidentally becoming CRM truth
12. skill body prompting not yet fully proven
13. production knowledge freshness
14. recommendation quality with imperfect interpretation
15. counselor trust in handoff evidence
16. evaluation coverage gaps
17. operations burden for interpretation taxonomy and schema versioning
```

---

## 8. Final Roadmap v7 Statement

```text
The platform is an AI-first bounded autonomous counseling system.

Phases 0–4 now lock the autonomy boundary, counseling operating model,
SKILL.md behavior-control system, deterministic runtime strategy, and governed
interpretation layer.

The next active design phase is Phase 5: Student Memory & Counseling State.

Phase 5 must build durable memory from AcceptedInterpretation and validated
runtime outputs, not raw transcript or uncontrolled summaries.

The most important memory design boundary remains:
Counseling memory may preserve interests, preferences, concerns, constraints,
recommendations, handoff readiness, and interpretation evidence.
It must never become official application, registration, payment, enrollment,
seat, or CRM truth.
```
