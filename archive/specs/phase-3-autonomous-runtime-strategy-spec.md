# Phase 3 — Autonomous Runtime Strategy Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 3 — Autonomous Runtime Strategy  
**Version:** 1.0  
**Date:** 2026-06-28  
**Status:** Approved exploration output for Phase 3  
**Source Context:** Phase 0 Bounded Autonomy Baseline, Phase 1 Autonomous Counseling Operating Model, Phase 2 Counseling SOP & Skill Control, Updated Exploration Roadmap, and Phase 3 exploration discussion

---

## 1. Purpose

This specification defines the **Phase 3 autonomous runtime strategy** for the AI-first counseling platform.

It answers the Phase 3 core question:

```text
What runtime architecture should execute the Phase 1 counseling journey and
Phase 2 SKILL.md control system while preserving Phase 0 bounded autonomy,
deterministic boundaries, validation, and auditability?
```

Phase 3 is intentionally **prototype-first**.

The goal is not to fully design the production runtime. The goal is to define a runtime strategy for the **Phase 12 prototype vertical slice** that proves the core bounded-autonomy loop:

```text
student message
→ boundary scan
→ operating context snapshot
→ SKILL.md selection
→ knowledge gateway, if needed
→ AI response + structured execution result
→ validation
→ validated commit only
→ audit and evaluation evidence
```

The runtime should be simple enough to build as a first vertical slice, but strict enough to prove the most important safety and quality controls.

---

## 2. Scope

Phase 3 defines:

1. the runtime responsibility split between deterministic platform control and AI counseling behavior
2. the per-turn runtime flow
3. boundary checkpoint placement
4. operating context snapshot ownership
5. `SKILL.md` retrieval and selection placement
6. layered boundary engine design
7. typed structured execution result contract
8. validation pipeline and failure behavior
9. prototype runtime framework choice
10. runtime module topology
11. minimal runtime data contracts
12. knowledge gateway placement within the runtime
13. output commit and runtime state persistence rules
14. audit event and evaluation hook requirements
15. Phase 3 decisions locked
16. open questions deferred to later phases

---

## 3. Non-Goals

Phase 3 does **not** fully define:

1. final durable student memory schema
2. full business knowledge governance
3. recommendation engine scoring and lifecycle
4. final counselor handoff package and routing workflow
5. CRM read/write integration
6. full guardrail and policy engine
7. full evaluation, simulation, and quality monitoring platform
8. skill authoring or business operations workflow
9. production deployment topology
10. production observability dashboards
11. final LangGraph migration design
12. Deep Agents usage for future complex subroutines

These are deferred to later phases.

Important boundary:

```text
Phase 3 defines the runtime needed to prove the Phase 12 prototype vertical slice.
It should not over-design production behavior before Phases 4–11 clarify memory,
knowledge, recommendation, handoff, CRM, guardrails, evaluation, and operations.
```

---

## 4. Phase 0 Inheritance

Phase 3 inherits the approved Phase 0 autonomy baseline.

### 4.1 Core Autonomy Stance

```text
Autonomy by default.
Conservative at boundaries.
```

The AI counselor should autonomously handle ordinary pre-registration counseling, including profile collection, exploration, recommendation, comparison, preference confirmation, deferral handling, readiness-to-register detection, and handoff context preparation.

Humans remain responsible for:

1. application, registration, enrollment, payment, or seat-reservation actions
2. official CRM/application/registration state changes
3. sensitive or high-risk actions
4. complex or exception-based cases
5. student-requested human support
6. scenarios outside approved SOP/skill coverage

### 4.2 Business Risk Posture

The main business risk to avoid is:

```text
Under-handoff.
```

Therefore:

```text
Red-zone detection should prioritize recall over precision.
```

The runtime must make red-zone boundary detection and override behavior deterministic enough to prevent the AI from continuing autonomously when a human should take ownership.

### 4.3 Counseling Decision vs Official Action

The central boundary remains:

```text
Counseling decision does not equal official action.
```

The AI may guide and record counseling states such as:

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

### 4.4 Runtime Implication

The runtime must enforce:

```text
AI can propose counseling outputs.
Platform validates and commits only allowed outputs.
Official-action outputs are never commit-eligible in the prototype.
```

---

## 5. Phase 1 Inheritance

Phase 3 must execute the approved Phase 1 autonomous counseling operating model.

### 5.1 Journey State Model

The runtime must support the flexible 9-state journey graph:

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

S9 is an overlay state. It should not erase the prior main journey state.

### 5.2 Per-Turn Operating Loop

Phase 1 conceptually defined each student turn as:

```text
Student message
  ↓
1. Boundary scan
  ↓
2. Meaning interpretation
  ↓
3. Journey state update
  ↓
4. Counseling action selection
  ↓
5. Response with next step
  ↓
6. Memory/counseling output proposal
```

Phase 3 converts this conceptual loop into a prototype runtime pipeline.

### 5.3 Recommendation Readiness

The runtime must preserve recommendation readiness levels:

```text
R1. Not Ready to Recommend
R2. Ready for Directional Recommendation
R3. Ready for High-Quality Recommendation
```

Recommendation readiness affects skill eligibility, recommendation confidence, and validation behavior.

### 5.4 Preference Strength Ladder

The runtime must preserve preference strength levels:

```text
L1. Weak Interest
L2. Expressed Interest
L3. Expressed Preference
L4. Confirmed Counseling Preference
L5. Ready-to-Register / Apply Intent
```

The AI may guide students up to L4 autonomously. L4 remains non-official. L5 triggers handoff.

### 5.5 Handoff Trigger Types

The runtime must preserve handoff triggers:

```text
H1. Ready-to-Apply / Ready-to-Register Intent
H2. Official Action Request
H3. Payment / Seat / Enrollment Commitment
H4. Exception / Appeal / Waiver / Complex Eligibility
H5. Sensitive or High-Risk Context
H6. Student-Requested Human Support
```

### 5.6 Counseling Action Vocabulary

The runtime must support Phase 1 action types:

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

Each student-facing turn should have one primary counseling action.

### 5.7 Operating Context Snapshot

The runtime must maintain an accepted operating context snapshot with at least:

```text
current_main_state
overlay_state
resume_target_state
current_zone
primary_counseling_action
profile_completeness
recommendation_readiness
preference_strength
active_student_direction
unresolved_decision_point
handoff_status
next_best_counseling_move
```

---

## 6. Phase 2 Inheritance

Phase 3 must execute the approved Phase 2 `SKILL.md` behavior-control model.

### 6.1 Layered Skill Model

Phase 2 locked three artifact layers:

```text
1. Playbooks
2. Runtime Skills
3. Boundary Rules
```

Playbooks guide broad counselor scenarios.

Runtime skills guide the current turn.

Boundary rules are mandatory cross-cutting controls that override normal skills.

### 6.2 Skill Selection Model

Phase 2 locked:

```text
Semantic retrieval discovers candidate SKILL.md packages.
Structured metadata filtering determines whether they are valid.
Boundary rules are loaded deterministically.
```

Each turn should normally select:

```text
1. zero or one playbook
2. one primary runtime skill
3. all mandatory boundary rules relevant to the context
```

### 6.3 Skill Precedence

Instruction precedence remains:

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

### 6.4 Skill Enforcement Model

Phase 2 locked hybrid enforcement:

```text
Level 1 — Advisory Guidance
Level 2 — Structured Validation
Level 3 — Hard Blocking / Override
```

Phase 3 implements this through deterministic shell modules and validation checkpoints.

### 6.5 Runtime Execution Contract

Each skill execution must produce:

```text
1. student-facing response
2. structured execution result
```

The student sees the response.

The platform uses the structured execution result for validation, memory output control, recommendation output control, handoff behavior, and audit.

---

## 7. Core Phase 3 Design Direction

Phase 3 uses the following runtime stance:

```text
Deterministic shell + AI counseling core.
```

The AI may be flexible in student-facing counseling behavior, but the platform must control the trust boundaries.

### 7.1 AI-Controlled Responsibilities

The AI counseling core may propose:

1. student-facing wording
2. meaning interpretation
3. counseling reasoning
4. comparison explanation
5. recommendation explanation
6. clarification phrasing
7. proposed context updates
8. proposed memory outputs
9. proposed recommendation outputs
10. proposed handoff summary

### 7.2 Platform-Controlled Responsibilities

The deterministic shell owns:

1. boundary scan and final zone decision
2. red-zone override behavior
3. operating context acceptance
4. skill retrieval and deterministic selection
5. mandatory boundary rule loading
6. skill metadata enforcement
7. knowledge gateway access and answerability
8. structured output validation
9. memory output validation
10. recommendation output validation
11. handoff output validation
12. official-action blocking
13. validated commit only
14. audit event emission
15. evaluation labels

### 7.3 Core Principle

```text
AI proposes.
Platform validates.
Platform commits.
```

No AI-proposed output becomes accepted runtime truth until validation accepts it.

---

## 8. Primary Runtime Risks

Phase 3 is designed around the following risks:

1. wrong boundary detection
2. wrong skill selection
3. bad memory writes
4. hallucinated knowledge
5. poor recommendation quality

The prototype runtime must explicitly test these risks.

| Risk | Runtime Control |
|---|---|
| Wrong boundary detection | Layered boundary engine and post-response boundary validation |
| Wrong skill selection | Platform-owned metadata filtering and skill selection validation |
| Bad memory writes | Allowed/forbidden output validation and preference-promotion checks |
| Hallucinated knowledge | Runtime-owned Knowledge Gateway and knowledge uncertainty validation |
| Poor recommendation quality | Recommendation readiness, assumptions/cautions, confidence validation |

---

## 9. Runtime Style Decision

Phase 3 considered four runtime styles:

```text
Option A: Mostly AI-driven runtime
Option B: Fully deterministic runtime
Option C: Deterministic shell + AI counseling core
Option D: Agentic runtime with deterministic checkpoints
```

Phase 3 chooses:

```text
Option C: Deterministic shell + AI counseling core.
```

### 9.1 Why Not Mostly AI-Driven

A mostly AI-driven runtime would allow the AI to decide state, zone, skill, response, memory outputs, and handoff need.

This is too risky because the AI would be both actor and judge.

It would weaken boundary reliability, skill selection control, memory validation, and auditability.

### 9.2 Why Not Fully Deterministic First

A fully deterministic runtime would provide strong control, but it would be too heavy for the first prototype.

It would require many hand-written rules before the system can handle natural detours and nuanced counseling language.

### 9.3 Why Deterministic Shell + AI Core

This model is simple enough for the prototype while still proving bounded autonomy.

The AI can counsel naturally, but the platform controls:

1. boundary override
2. skill selection
3. memory/recommendation/handoff validation
4. knowledge answerability
5. audit and evaluation

---

## 10. Per-Turn Runtime Flow

Phase 3 uses a **two-checkpoint per-turn runtime**.

### 10.1 Checkpoint 1 — Pre-Generation Control

Purpose:

```text
Detect boundary risk, build accepted context, select valid skill artifacts,
and prepare controlled execution context before the AI responds.
```

Checks include:

1. boundary scan
2. current zone
3. journey state
4. primary counseling action
5. skill eligibility
6. mandatory boundary rules
7. knowledge need classification

### 10.2 Checkpoint 2 — Pre-Commit Validation

Purpose:

```text
Validate what the AI proposed before anything is shown as final, committed,
or used as runtime truth.
```

Checks include:

1. response safety
2. official-action language
3. memory output validity
4. recommendation output validity
5. handoff output validity
6. knowledge citation / uncertainty flags
7. final audit evidence

### 10.3 Prototype Turn Flow

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

---

## 11. Operating Context Snapshot Ownership

Phase 3 uses:

```text
AI-proposed, platform-validated operating context snapshots.
```

The AI may propose context updates, but the platform owns the accepted snapshot used for skill selection, validation, commit, and audit.

### 11.1 Field Ownership

| Snapshot Field | Prototype Owner | Reason |
|---|---|---|
| `current_main_state` | AI proposes, platform validates | Natural language state detection needs flexibility |
| `overlay_state` | AI proposes, platform validates | Detours are semantic and conversational |
| `resume_target_state` | Platform stores | Previous main state must be preserved reliably |
| `current_zone` | Platform final authority | Boundary safety depends on it |
| `primary_counseling_action` | AI proposes, platform validates | Must align with one-action-per-turn rule |
| `profile_completeness` | Platform validates | Based on known collected fields |
| `recommendation_readiness` | Platform validates | Based on minimum profile and optional context |
| `preference_strength` | AI proposes, platform validates | Prevents weak signal over-promotion |
| `active_student_direction` | AI proposes, platform validates | Semantic but must not overwrite history carelessly |
| `unresolved_decision_point` | AI proposes | Lower safety risk, useful for counseling quality |
| `handoff_status` | Platform final authority | Red-zone recall is critical |
| `next_best_counseling_move` | AI proposes, platform validates | Must align with selected skill and boundary status |

### 11.2 Accepted Snapshot Rule

```text
Only the platform-accepted operating context may drive:
- skill selection
- boundary rule loading
- validation
- commit
- audit
```

---

## 12. SKILL.md Retrieval and Selection Placement

Phase 3 uses:

```text
Platform-owned SKILL.md retrieval and deterministic skill selection.
```

The AI may propose a primary counseling action, but it may not choose the final skill package.

### 12.1 Skill Selection Flow

```text
1. Accepted operating context is available.
2. Platform retrieves candidate playbooks and runtime skills from approved index.
3. Platform filters candidates by structured metadata.
4. Platform selects one primary runtime skill.
5. Platform optionally attaches one playbook.
6. Platform deterministically loads mandatory boundary rules.
7. Platform rejects invalid candidates.
8. Platform emits skill selection audit evidence.
```

### 12.2 Runtime Skill Filters

Runtime skill candidates are filtered by:

1. current main state
2. primary counseling action
3. current zone
4. recommendation readiness
5. preference strength
6. allowed memory outputs
7. forbidden memory outputs
8. required boundary rules
9. approved/latest version status

### 12.3 Selection Ranking

Prototype ranking can be simple:

```text
Exact metadata match
  > broader safe match
  > generic fallback skill
  > boundary-safe handoff
```

### 12.4 Important Rule

```text
The AI must never use an unapproved, unvalidated, or metadata-incompatible skill.
```

---

## 13. Boundary Engine Design

Phase 3 uses a **layered boundary engine**.

```text
Student message
  ↓
1. Deterministic boundary signal scanner
  ↓
2. AI semantic boundary classifier
  ↓
3. Platform boundary resolver
  ↓
Final zone + handoff status + boundary rules to load
```

The platform resolver is the final authority.

### 13.1 Deterministic Boundary Signal Scanner

The scanner catches obvious red/yellow boundary signals before generation.

Prototype signal groups:

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
```

The scanner is not responsible for understanding every possible student phrase. Its job is to catch obvious signals with high recall.

### 13.2 AI Semantic Boundary Classifier

The AI semantic classifier proposes a structured interpretation of boundary risk.

Example:

```yaml
boundary_classification:
  proposed_zone: yellow
  possible_trigger_types:
    - H1
  ambiguity_type: ambiguous_proceed_language
  evidence: "Student said: Can we proceed?"
  recommended_runtime_behavior: clarify_once
```

The classifier is useful for ambiguous language such as:

```text
Can we proceed?
I want this course.
Let's go with this.
What is the next step?
Can I secure my place?
```

These may mean either:

```text
L4 confirmed counseling preference
```

or:

```text
L5 ready-to-apply/register intent
```

### 13.3 Platform Boundary Resolver

The resolver combines:

1. deterministic scanner signals
2. AI semantic classification
3. current operating context
4. selected skill metadata
5. mandatory boundary rules
6. previous handoff status

It decides:

1. final zone
2. handoff status
3. trigger type
4. required boundary rules
5. allowed next behavior

### 13.4 Resolver Rules

```text
Rule 1:
If clear H1-H6 red trigger is detected, final_zone = red.

Rule 2:
If official action, payment, enrollment, seat reservation, exception approval,
or human-requested support is detected, handoff_status = required.

Rule 3:
If language is ambiguous between L4 counseling preference and L5 application intent,
final_zone = yellow and action = clarify once.

Rule 4:
If ambiguity remains after clarification and it affects official action,
eligibility, sensitive handling, or registration next steps, handoff.

Rule 5:
If generated response or outputs imply official action, block and regenerate
or override with handoff-safe response.

Rule 6:
When rule scanner and AI classifier disagree, choose the safer zone:
green vs yellow → yellow
yellow vs red → red or clarify once, depending on ambiguity.
```

### 13.5 Boundary Results

Green:

```yaml
final_zone: green
handoff_status: none
runtime_behavior: continue_normal_skill
```

Yellow:

```yaml
final_zone: yellow
handoff_status: possible_clarify
runtime_behavior: ask_targeted_clarification
```

Red:

```yaml
final_zone: red
handoff_status: required
runtime_behavior: override_normal_skill_and_prepare_handoff
```

### 13.6 Baseline Boundary Rules

The prototype should always load:

```text
no-official-action-boundary
ready-to-register-detection
ambiguous-proceed-clarification
preference-promotion-boundary
```

Then load additional boundary rules when context signals appear:

```text
payment-seat-enrollment-boundary
sensitive-context-routing
complex-eligibility-exception-handoff
human-requested-handoff
internal-only-knowledge-boundary
```

---

## 14. Structured Execution Result Contract

Every AI counseling turn must return:

```text
1. student-facing response
2. typed structured execution result
```

The student-facing response is natural language.

The structured execution result is a platform-readable proposal.

### 14.1 Execution Result Shape

```yaml
execution_result:
  response:
    student_message: string
    response_intent:
      one_of:
        - answer
        - ask_clarification
        - recommend
        - compare
        - confirm_preference
        - handoff

  proposed_context_update:
    current_main_state: S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8
    overlay_state: S9 | null
    primary_counseling_action: A1-A12
    preference_strength_after: L1 | L2 | L3 | L4 | L5 | null
    active_student_direction: string | null
    unresolved_decision_point: string | null
    next_best_counseling_move: string | null

  skill_usage:
    selected_playbook: string | null
    selected_runtime_skill: string
    loaded_boundary_rules:
      - string

  proposed_outputs:
    memory_outputs:
      - type: string
        value: object
        confidence: low | medium | high
        evidence: string

    recommendation_outputs:
      - option: string
        fit_reasons:
          - string
        assumptions:
          - string
        cautions:
          - string
        confidence: low | medium | high

    handoff_output:
      required: boolean
      trigger_type: H1 | H2 | H3 | H4 | H5 | H6 | null
      reason: string | null
      summary: string | null

  validation_flags:
    needs_clarification: boolean
    boundary_sensitive: boolean
    official_action_risk: boolean
    memory_write_requires_validation: boolean
    knowledge_used: boolean
    knowledge_uncertain: boolean
```

### 14.2 Ownership Rule

```text
The AI can propose these fields.
The platform decides the accepted version.
```

Example:

```yaml
AI proposes:
  memory_outputs:
    - type: confirmed_counseling_preference
      value:
        course: Psychology
        university: University A

Platform validates:
  Did the student explicitly confirm?
  Is the selected skill allowed to output this?
  Is this L4, not L5?
  Is there official-action language?
  Are required boundary rules loaded?
```

If valid, commit.

If invalid, block, downgrade, clarify, regenerate, or hand off.

---

## 15. Validation Pipeline

Phase 3 uses validation-specific failure handling.

### 15.1 Prototype Validation Pipeline

```text
1. Schema validation
2. Skill compatibility validation
3. Boundary validation
4. Preference promotion validation
5. Memory output validation
6. Recommendation validation
7. Knowledge uncertainty validation
8. Final response consistency validation
9. Audit event emission
```

Boundary validation should happen early because red-zone triggers override normal skill behavior.

### 15.2 Schema Validator

Checks whether the AI returned valid structured output.

Failure behavior:

```text
repair once
if still invalid, use safe fallback response
do not commit memory or recommendation outputs
audit schema_validation_failed
```

### 15.3 Skill Compatibility Validator

Checks:

1. selected runtime skill matches platform-selected skill
2. loaded boundary rules match platform-loaded rules
3. proposed memory outputs are allowed by selected skill metadata
4. forbidden outputs are not proposed

Failure behavior:

```text
discard AI skill_usage field
replace with platform-selected skill_usage
revalidate outputs against actual selected skill
block invalid outputs if needed
```

### 15.4 Boundary Validator

Checks:

1. no official-action claim
2. no registration/application/payment/seat confirmation
3. handoff required if red-zone trigger detected
4. yellow ambiguity clarified once

Failure behavior:

```text
override normal response with boundary-safe response
block official-action outputs
commit only allowed readiness/handoff outputs
```

### 15.5 Preference Promotion Validator

Checks:

1. L1/L2 is not promoted to L4 without explicit confirmation
2. L4 is not promoted to L5 without handoff
3. ambiguous proceed language triggers clarification

Failure behavior:

```text
downgrade preference level
block unsupported memory output
or ask clarification
```

### 15.6 Memory Output Validator

Checks:

1. proposed memory output type is allowed by selected skill
2. proposed memory output is not forbidden
3. evidence supports the output
4. confidence is appropriate
5. official-action outputs are not committed

Failure behavior:

```text
block forbidden memory output
commit allowed outputs only
if output is official-action-related, run boundary override
```

### 15.7 Recommendation Validator

Checks:

1. recommendation readiness supports recommendation type
2. confidence is not overstated
3. assumptions are present when information is incomplete
4. cautions are present when needed
5. recommendation is not framed as guaranteed admission or eligibility approval

Failure behavior:

```text
lower confidence
require assumptions/cautions
regenerate recommendation wording if needed
do not store high-quality recommendation record if readiness is only R2
```

### 15.8 Knowledge Uncertainty Validator

Checks:

1. specific factual claims are supported by retrieved knowledge
2. `knowledge_used` is true when factual claims depend on sources
3. `knowledge_uncertain` is true when sources are missing, incomplete, stale, or conflicting
4. decision-critical uncertainty triggers caveat or handoff

Failure behavior:

```text
remove unsupported factual claim
replace with uncertainty-safe wording
ask Knowledge Gateway if available
handoff if unresolved uncertainty is decision-critical
```

### 15.9 Response Consistency Validator

Checks whether student-facing response matches accepted structured outputs.

Example problem:

```text
Response says student has chosen University A,
but structured output only records weak_interest.
```

Failure behavior:

```text
prefer safer accepted structured state
regenerate response to match accepted outputs
```

---

## 16. Failure Behavior Hierarchy

The runtime should not handle every validation failure the same way.

Use this hierarchy:

```text
1. Correct harmless metadata mismatch.
2. Block invalid structured outputs.
3. Downgrade over-strong memory or recommendation outputs.
4. Regenerate response once when wording conflicts with accepted outputs.
5. Ask one targeted clarification when ambiguity blocks safe progress.
6. Override with boundary-safe handoff when red-zone risk is clear.
7. Use safe fallback response when the runtime cannot validate the turn.
```

### 16.1 Official-Action or Red-Zone Violation

Example:

```text
AI says: "I'll register you now."
```

Runtime behavior:

```text
discard response
override with boundary-safe handoff response
block all official-action outputs
commit only allowed handoff/readiness outputs
audit boundary_override
```

Clear red-zone violations should not be handled through ordinary regeneration loops.

### 16.2 Ambiguous Proceed Language

Example:

```text
Student says: "Can we proceed?"
```

Runtime behavior:

```text
ask one clarification
do not commit L4 or L5 yet unless already clear
audit ambiguity_clarification_requested
```

If student clarifies official application/registration intent, hand off.

If student clarifies counseling preference only, confirm L4 as non-official.

### 16.3 Safe Fallback Response

When the runtime cannot safely continue:

```text
I want to avoid giving you the wrong next step here. Could you clarify whether
you are still exploring options, or whether you want a human counselor to help
with the official application or registration step?
```

For stronger red-zone risk:

```text
This looks like it may involve an official application, registration, payment,
or special case. A human counselor should handle that next step. I can summarize
your context so they can continue from here.
```

### 16.4 No Validated Output, No Commit

```text
No validated output, no commit.
```

This applies to:

1. memory
2. recommendation records
3. handoff package
4. official-action status
5. audit-derived state

Official-action outputs are never commit-eligible in the prototype.

---

## 17. Prototype Runtime Framework Choice

Phase 3 chooses:

```text
Plain structured runtime pipeline for the Phase 12 prototype,
implemented as clean node-like modules.
```

The prototype should not use Deep Agents as the main runtime.

LangGraph remains a possible future migration target after the prototype proves the core loop.

### 17.1 Why Plain Pipeline First

A plain pipeline is:

1. simpler to build
2. easier to debug
3. easier to unit test
4. clearer for the deterministic shell
5. less framework-dependent
6. better aligned with the prototype-first goal

### 17.2 LangGraph Compatibility

The modules should be designed with clean boundaries so they can later become graph nodes if needed.

Example future graph nodes:

```text
BoundaryScanNode
ContextSnapshotNode
SkillSelectionNode
KnowledgeGatewayNode
AIExecutionNode
ValidationNode
CommitNode
AuditNode
```

### 17.3 Deep Agents Position

Deep Agents should not be the main runtime for the Phase 12 prototype.

It may be reconsidered later as a sub-runtime for specialized complex tasks, such as:

1. research-heavy knowledge review
2. complex recommendation analysis
3. multi-document business rule analysis
4. evaluator or simulation workflows

But the core counseling shell should remain deterministic at trust boundaries.

---

## 18. Runtime Module Topology

Phase 3 uses medium-grained node-like modules.

```text
CounselingTurnOrchestrator
  ↓
BoundaryEngine
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
OutputCommitService
  ↓
AuditEventWriter
```

### 18.1 CounselingTurnOrchestrator

Owns the turn-level flow.

It coordinates:

```text
load state
run boundary engine
build context
select skills
run knowledge gateway if needed
execute AI
validate outputs
commit safe outputs
write audit
return response
```

It should not contain detailed business logic itself.

### 18.2 BoundaryEngine

Owns layered boundary detection.

Internally includes:

```text
deterministic signal scanner
AI semantic classifier
platform boundary resolver
```

Outputs:

```yaml
boundary_result:
  final_zone: green | yellow | red
  handoff_status: none | possible_clarify | required
  trigger_type: H1 | H2 | H3 | H4 | H5 | H6 | null
  required_boundary_rules: string[]
  allowed_next_behavior: continue | clarify | handoff
```

The BoundaryEngine has final authority over the zone for the turn.

### 18.3 OperatingContextManager

Owns the accepted runtime snapshot.

It validates AI-proposed updates and stores the accepted context.

### 18.4 SkillControlService

Owns:

1. approved skill index lookup
2. candidate retrieval
3. metadata filtering
4. one primary runtime skill selection
5. optional playbook attachment
6. mandatory boundary rule loading
7. invalid candidate rejection
8. skill selection evidence

### 18.5 KnowledgeGateway

Runs when factual business, university, program, pathway, fee, intake, ranking, or eligibility knowledge is needed.

It returns answerability, student-safe facts, source references, uncertainty status, and recommended behavior.

### 18.6 ExecutionContextComposer

Builds the controlled input package for the AI counseling core.

It includes:

1. student message
2. short conversation context
3. accepted operating context
4. boundary result
5. selected runtime skill
6. optional playbook
7. loaded boundary rules
8. allowed outputs
9. forbidden outputs
10. required structured schema
11. knowledge context, if available

### 18.7 AIExecutionClient

Calls the AI model.

It returns:

1. student-facing response
2. typed structured execution result

It does not commit memory, recommendation, handoff, or official status.

### 18.8 ValidationPipeline

Owns pre-commit validation.

It decides whether to:

1. accept
2. correct harmless metadata
3. block outputs
4. downgrade outputs
5. regenerate once
6. ask clarification
7. override with handoff
8. fallback safely

### 18.9 OutputCommitService

Commits only validated outputs.

For the prototype, this can use simple persistence and does not need the final Phase 4 memory schema.

### 18.10 AuditEventWriter

Writes one complete structured audit event per turn.

---

## 19. Minimal Runtime Data Contracts

Phase 3 uses minimal strict runtime contracts.

```text
1. TurnInput
2. BoundaryResult
3. OperatingContext
4. SkillSelectionResult
5. ExecutionContext
6. AIExecutionResult
7. ValidationResult
8. CommitResult
9. AuditEvent
```

These contracts are strict enough to prove the Phase 12 vertical slice, but small enough to avoid prematurely designing later phases.

---

## 19.1 TurnInput

```ts
type TurnInput = {
  conversationId: string;
  studentMessage: string;
  previousRuntimeState?: RuntimeState;
  recentConversationSummary?: string;
};
```

Purpose:

```text
Represents one incoming student turn.
```

---

## 19.2 BoundaryResult

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

Purpose:

```text
Gives the platform-final boundary decision for the turn.
```

Important rule:

```text
BoundaryResult overrides normal skill behavior when red.
```

---

## 19.3 OperatingContext

```ts
type OperatingContext = {
  currentMainState: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";
  overlayState?: "S9";
  resumeTargetState?: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";

  currentZone: "green" | "yellow" | "red";
  primaryCounselingAction:
    | "A1" | "A2" | "A3" | "A4" | "A5" | "A6"
    | "A7" | "A8" | "A9" | "A10" | "A11" | "A12";

  profileCompleteness: "incomplete" | "minimum_complete" | "rich_profile";
  recommendationReadiness: "R1" | "R2" | "R3";
  preferenceStrength?: "L1" | "L2" | "L3" | "L4" | "L5";

  activeStudentDirection?: {
    courseOrProgram?: string;
    university?: string;
    pathway?: string;
  };

  unresolvedDecisionPoint?: string;
  handoffStatus: "none" | "possible_clarify" | "required" | "prepared";
  nextBestCounselingMove?: string;
};
```

Purpose:

```text
The accepted runtime snapshot used for skill selection and validation.
```

---

## 19.4 SkillSelectionResult

```ts
type SkillSelectionResult = {
  selectedPlaybook?: SkillRef;
  selectedRuntimeSkill: SkillRef;
  loadedBoundaryRules: SkillRef[];
  rejectedCandidates: {
    skill: SkillRef;
    reason: string;
  }[];
};

type SkillRef = {
  name: string;
  version: string;
  artifactType: "playbook" | "runtime_skill" | "boundary_rule";
  contentHash?: string;
  sourcePath?: string;
};
```

Purpose:

```text
Records exactly which approved SKILL.md artifacts were selected.
```

Important rule:

```text
AI cannot override selected skill references.
```

---

## 19.5 ExecutionContext

```ts
type ExecutionContext = {
  studentMessage: string;
  conversationContext: string;
  operatingContext: OperatingContext;
  boundaryResult: BoundaryResult;
  skillSelection: SkillSelectionResult;

  allowedMemoryOutputTypes: string[];
  forbiddenMemoryOutputTypes: string[];

  requiredResponseBehavior:
    | "continue_normal_counseling"
    | "ask_clarification"
    | "prepare_handoff";

  requiredStructuredSchemaVersion: string;

  knowledgeContext?: {
    sources: unknown[];
    uncertaintyLevel: "none" | "minor" | "decision_critical";
  };
};
```

Purpose:

```text
The complete controlled package sent to the AI counseling core.
```

---

## 19.6 AIExecutionResult

```ts
type AIExecutionResult = {
  response: {
    studentMessage: string;
    responseIntent:
      | "answer"
      | "ask_clarification"
      | "recommend"
      | "compare"
      | "confirm_preference"
      | "handoff";
  };

  proposedContextUpdate?: Partial<OperatingContext>;

  proposedOutputs: {
    memoryOutputs: ProposedMemoryOutput[];
    recommendationOutputs: ProposedRecommendationOutput[];
    handoffOutput?: ProposedHandoffOutput;
  };

  validationFlags: {
    needsClarification: boolean;
    boundarySensitive: boolean;
    officialActionRisk: boolean;
    memoryWriteRequiresValidation: boolean;
    knowledgeUsed: boolean;
    knowledgeUncertain: boolean;
  };
};
```

Purpose:

```text
The AI's proposal, not final truth.
```

---

## 19.7 Output Proposal Types

```ts
type ProposedMemoryOutput = {
  type: string;
  value: Record<string, unknown>;
  confidence: "low" | "medium" | "high";
  evidence: string;
};

type ProposedRecommendationOutput = {
  option: string;
  fitReasons: string[];
  assumptions: string[];
  cautions: string[];
  confidence: "low" | "medium" | "high";
};

type ProposedHandoffOutput = {
  required: boolean;
  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  reason?: string;
  summary?: string;
};
```

Purpose:

```text
Keeps memory, recommendation, and handoff outputs typed and separately validatable.
```

---

## 19.8 ValidationResult

```ts
type ValidationResult = {
  status:
    | "accepted"
    | "corrected"
    | "blocked"
    | "downgraded"
    | "regenerate_once"
    | "clarify"
    | "handoff_override"
    | "safe_fallback";

  finalResponse: string;

  acceptedContextUpdate?: Partial<OperatingContext>;

  acceptedOutputs: {
    memoryOutputs: ProposedMemoryOutput[];
    recommendationOutputs: ProposedRecommendationOutput[];
    handoffOutput?: ProposedHandoffOutput;
  };

  blockedOutputs: {
    output: unknown;
    reason: string;
  }[];

  validationEvents: {
    type: string;
    severity: "info" | "warning" | "error";
    message: string;
  }[];
};
```

Purpose:

```text
Determines what may be shown, committed, blocked, or overridden.
```

---

## 19.9 CommitResult

```ts
type CommitResult = {
  committedContext: OperatingContext;
  committedMemoryOutputIds: string[];
  committedRecommendationOutputIds: string[];
  handoffPrepared: boolean;
  blockedOutputCount: number;
};
```

Purpose:

```text
Confirms what was actually persisted for the prototype.
```

---

## 19.10 AuditEvent

```ts
type AuditEvent = {
  conversationId: string;
  turnId: string;
  timestamp: string;

  studentMessage: string;
  boundaryResult: BoundaryResult;
  operatingContextBefore?: OperatingContext;
  operatingContextAfter: OperatingContext;
  skillSelection: SkillSelectionResult;

  aiExecutionResult: AIExecutionResult;
  validationResult: ValidationResult;
  commitResult: CommitResult;

  fallbackUsed: boolean;
};
```

Purpose:

```text
Makes every prototype turn explainable and evaluatable.
```

---

## 20. Knowledge Gateway Placement

Phase 3 places a runtime-owned **Knowledge Gateway** before AI generation when factual knowledge is needed.

This is not the full Phase 5 knowledge design. It is the minimum runtime placement needed for the prototype.

### 20.1 Knowledge Gateway Rule

```text
Knowledge Gateway is called before AI response generation when the selected
skill or student message requires factual business, university, program,
pathway, fee, intake, ranking, or eligibility knowledge.
```

### 20.2 Updated Runtime Flow With Knowledge Gateway

```text
1. Receive student message
2. BoundaryEngine produces BoundaryResult
3. OperatingContextManager accepts runtime context
4. SkillControlService selects skill + boundary rules
5. Knowledge Gateway runs if knowledge is needed
6. ExecutionContextComposer includes knowledge context
7. AIExecutionClient generates response + structured result
8. ValidationPipeline checks knowledge usage/uncertainty
9. OutputCommitService commits validated outputs only
10. AuditEventWriter writes turn audit
```

### 20.3 Knowledge Gateway Responsibilities

For Phase 12, the gateway answers:

```text
Can the runtime safely provide factual context for this turn?
```

It returns:

```ts
type KnowledgeResult = {
  needed: boolean;
  status:
    | "not_needed"
    | "answerable"
    | "answerable_with_caveat"
    | "not_answerable"
    | "conflicting"
    | "decision_critical_uncertainty";

  sources: KnowledgeSource[];
  facts: KnowledgeFact[];
  studentSafeSummary?: string;
  internalOnlyExcluded: boolean;
  recommendedBehavior:
    | "answer"
    | "answer_with_caveat"
    | "ask_clarification"
    | "handoff";
};
```

Minimal source shape:

```ts
type KnowledgeSource = {
  sourceId: string;
  sourceType: "university_filter" | "google_sheet" | "google_drive" | "manual_stub";
  title: string;
  visibility: "student_safe" | "internal_only";
  freshness?: string;
};
```

Minimal fact shape:

```ts
type KnowledgeFact = {
  claim: string;
  sourceId: string;
  confidence: "low" | "medium" | "high";
};
```

### 20.4 Knowledge-Needed Detection

The gateway should run when the student asks about:

1. fees
2. entry requirements
3. eligibility
4. intakes
5. duration
6. campus/location
7. ranking
8. scholarship facts
9. specific university or program facts
10. pathway requirements
11. program comparison facts

Or when the selected skill is one of:

1. factual-detour-answering
2. course-program-exploration
3. pathway-exploration
4. university-exploration
5. directional-recommendation
6. high-quality-recommendation
7. shortlist-comparison

### 20.5 Knowledge Answerability Rules

If knowledge is not needed:

```text
Continue normal counseling.
```

If answerable:

```text
AI may answer using provided facts.
knowledgeUsed = true
knowledgeUncertain = false
```

If answerable with caveat:

```text
AI may answer, but must mention uncertainty or limitation.
```

If not answerable:

```text
AI should not invent the answer.
Ask clarification or offer human follow-up depending on impact.
```

If conflicting or decision-critical uncertainty:

```text
Use caveat or handoff depending on consequence.
```

### 20.6 Internal-Only Knowledge Rule

```text
Only student-safe facts are passed into the AI response context.
Internal-only items are converted into flags, cautions, or handoff reasons.
```

The gateway, not the AI, filters internal-only material.

---

## 21. Output Commit and Runtime State Persistence

Phase 3 uses:

```text
Validated commit only.
```

The prototype may persist:

1. runtime conversation state
2. accepted operating context snapshot
3. accepted memory outputs
4. accepted recommendation outputs
5. accepted handoff output
6. blocked output records
7. full audit event

AI-proposed outputs are never treated as truth until validated.

Official-action outputs are never commit-eligible.

---

## 21.1 Runtime Conversation State

```ts
type RuntimeConversationState = {
  conversationId: string;
  latestOperatingContext: OperatingContext;
  recentConversationSummary?: string;
  lastTurnId: string;
  updatedAt: string;
};
```

Purpose:

```text
Allows the next student turn to resume from the accepted state.
```

---

## 21.2 Accepted Memory Output Record

```ts
type AcceptedMemoryOutputRecord = {
  id: string;
  conversationId: string;
  turnId: string;
  type: string;
  value: Record<string, unknown>;
  confidence: "low" | "medium" | "high";
  evidence: string;
  sourceSkill: SkillRef;
  validationStatus: "accepted" | "downgraded" | "corrected";
  createdAt: string;
};
```

Allowed examples:

```text
weak_interest
expressed_interest
expressed_preference
rejected_option
student_concern
student_constraint
deferral
confirmed_counseling_preference
readiness_to_register_signal
```

Forbidden examples:

```text
application_submitted
registration_completed
payment_confirmed
seat_reserved
crm_status_updated
enrollment_confirmed
```

---

## 21.3 Accepted Recommendation Record

```ts
type AcceptedRecommendationRecord = {
  id: string;
  conversationId: string;
  turnId: string;
  option: string;
  fitReasons: string[];
  assumptions: string[];
  cautions: string[];
  confidence: "low" | "medium" | "high";
  sourceSkill: SkillRef;
  knowledgeSourceIds: string[];
  createdAt: string;
};
```

Prototype rule:

```text
Recommendation confidence is counseling confidence only.
It must not imply guaranteed admission, eligibility approval, or registration success.
```

---

## 21.4 Accepted Handoff Record

```ts
type AcceptedHandoffRecord = {
  id: string;
  conversationId: string;
  turnId: string;
  required: boolean;
  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  reason?: string;
  summary?: string;
  sourceBoundaryRules: SkillRef[];
  status: "prepared" | "not_required";
  createdAt: string;
};
```

Prototype rule:

```text
Handoff prepared does not mean application, registration, payment, enrollment,
or CRM update has happened.
```

---

## 21.5 Blocked Output Record

```ts
type BlockedOutputRecord = {
  id: string;
  conversationId: string;
  turnId: string;
  proposedOutput: unknown;
  reason: string;
  validator: string;
  severity: "warning" | "error";
  createdAt: string;
};
```

Examples:

```text
blocked confirmed_counseling_preference because evidence only showed weak interest
blocked registration_completed because official action outputs are forbidden
blocked high-confidence recommendation because recommendation readiness was only R2
```

---

## 21.6 Commit Rules

```text
1. Commit only after ValidationPipeline returns accepted, corrected, downgraded,
   clarify, or handoff_override.

2. Never commit forbidden official-action outputs.

3. If validation status is regenerate_once, wait for regenerated result before commit.

4. If validation status is safe_fallback, commit only audit and safe context;
   do not commit memory or recommendation outputs.

5. Always commit blocked output records when something was rejected.

6. Always write audit, even when no memory or recommendation output is committed.
```

---

## 22. Audit and Evaluation Hooks

Every prototype turn must write one structured audit event.

A plain transcript is not enough.

The runtime must record:

1. boundary evidence
2. accepted operating context
3. selected skills
4. loaded boundary rules
5. knowledge status
6. AI-proposed outputs
7. validation decisions
8. committed outputs
9. blocked outputs
10. fallback behavior
11. final response

---

## 22.1 Runtime Turn Audit Event

```ts
type RuntimeTurnAuditEvent = {
  conversationId: string;
  turnId: string;
  timestamp: string;

  input: {
    studentMessage: string;
    previousOperatingContext?: OperatingContext;
  };

  boundary: {
    deterministicSignals: string[];
    aiBoundaryClassification?: {
      proposedZone: "green" | "yellow" | "red";
      triggerTypes: string[];
      reason: string;
      evidence: string;
    };
    finalBoundaryResult: BoundaryResult;
  };

  operatingContext: {
    before?: OperatingContext;
    after: OperatingContext;
    acceptedContextUpdate?: Partial<OperatingContext>;
  };

  skillSelection: {
    selectedPlaybook?: SkillRef;
    selectedRuntimeSkill: SkillRef;
    loadedBoundaryRules: SkillRef[];
    rejectedCandidates: {
      skill: SkillRef;
      reason: string;
    }[];
  };

  knowledge?: {
    needed: boolean;
    status:
      | "not_needed"
      | "answerable"
      | "answerable_with_caveat"
      | "not_answerable"
      | "conflicting"
      | "decision_critical_uncertainty";
    sourceIds: string[];
    internalOnlyExcluded: boolean;
    recommendedBehavior?: string;
  };

  aiProposal: {
    responseIntent: string;
    proposedContextUpdate?: Partial<OperatingContext>;
    proposedMemoryOutputs: ProposedMemoryOutput[];
    proposedRecommendationOutputs: ProposedRecommendationOutput[];
    proposedHandoffOutput?: ProposedHandoffOutput;
    validationFlags: Record<string, boolean>;
  };

  validation: {
    status: ValidationResult["status"];
    validationEvents: ValidationResult["validationEvents"];
    blockedOutputs: ValidationResult["blockedOutputs"];
    finalResponse: string;
  };

  commit: CommitResult;

  fallback: {
    used: boolean;
    type?: string;
    reason?: string;
  };
};
```

---

## 22.2 Runtime Evaluation Labels

The prototype should emit lightweight evaluation labels from each audit event.

```ts
type RuntimeEvaluationLabels = {
  zoneFinal: "green" | "yellow" | "red";
  handoffRequired: boolean;
  boundaryTriggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  skillName: string;
  primaryAction: string;
  memoryOutputTypesCommitted: string[];
  memoryOutputTypesBlocked: string[];
  recommendationCommitted: boolean;
  knowledgeUncertain: boolean;
  fallbackUsed: boolean;
};
```

These labels support scenario tests without requiring the full Phase 10 evaluation platform.

---

## 22.3 Minimum Prototype Scenario Checks

The audit event should support at least these checks:

```text
1. weak interest is not promoted to confirmed preference
2. confirmed counseling preference is not treated as registration
3. "Can we proceed?" triggers clarification
4. "I want to apply now" triggers handoff
5. payment or seat request triggers handoff
6. wrong skill candidate is rejected by metadata
7. mandatory boundary rules are loaded
8. unsupported factual claim is blocked or caveated
9. memory output is blocked when forbidden by skill metadata
10. every turn has selected skill, boundary result, validation result, and commit result
```

---

## 23. Prototype Vertical Slice Runtime Behavior

The Phase 12 prototype should prove the following journey:

```text
1. student enters chat as pre-registration prospect
2. runtime builds operating context snapshot
3. runtime retrieves latest approved SKILL.md packages from approved index
4. AI collects minimum profile:
   academic results, university preference type, preferred location
5. AI explores course/program interest
6. student asks a factual detour such as fee, location, ranking, or pathway duration
7. runtime selects factual-detour-answering skill and relevant boundary rules
8. Knowledge Gateway returns answerability and student-safe facts or caveats
9. AI answers or caveats the detour and resumes the main journey
10. runtime selects directional-recommendation skill
11. AI provides R2 directional recommendation
12. runtime validates recommendation assumptions, cautions, and confidence
13. runtime selects shortlist-comparison skill
14. AI compares or shortlists options
15. student expresses weak interest, expressed preference, or deferral
16. AI proposes correct preference-strength or deferral output
17. runtime validates and commits allowed memory outputs only
18. student confirms a counseling preference
19. runtime validates confirmed_counseling_preference as non-official
20. student says they want to apply/register now
21. boundary rule detects red-zone readiness-to-register intent
22. normal skill is overridden
23. AI prepares handoff and does not perform registration
24. audit captures state, action, zone, selected skills, versions/hashes,
    proposed outputs, committed outputs, blocked outputs, knowledge used,
    recommendation, boundary override, response, and handoff evidence
```

---

## 24. Minimal Prototype Skill Set

The prototype should support this minimal Phase 2 skill set.

### 24.1 Playbooks

```text
exploration-first-playbook
comparison-shortlist-playbook
confirmed-preference-to-handoff-playbook
```

### 24.2 Runtime Skills

```text
minimum-profile-collection
interest-exploration
factual-detour-answering
directional-recommendation
shortlist-comparison
preference-confirmation
ready-to-register-handoff
```

### 24.3 Boundary Rules

```text
no-official-action-boundary
ready-to-register-detection
ambiguous-proceed-clarification
preference-promotion-boundary
internal-only-knowledge-boundary
```

Additional boundary rules may be included if the prototype scenario covers them:

```text
payment-seat-enrollment-boundary
sensitive-context-routing
complex-eligibility-exception-handoff
human-requested-handoff
```

---

## 25. Prototype Success Criteria

The Phase 3 runtime strategy is successful if the Phase 12 prototype can prove:

1. the deterministic shell can control the AI counseling core
2. the two-checkpoint turn flow works
3. the operating context snapshot is maintained across turns
4. detour/resume behavior is preserved
5. skill retrieval and deterministic selection work
6. invalid skill candidates are rejected by metadata
7. mandatory boundary rules load deterministically
8. boundary engine detects red/yellow/red cases
9. ambiguous proceed language triggers clarification
10. red-zone intent overrides normal skill behavior
11. structured execution result is produced every turn
12. memory outputs are validated before commit
13. weak signals are not over-promoted
14. confirmed counseling preference remains non-official
15. recommendation confidence is validated against readiness
16. unsupported factual claims are blocked, caveated, or escalated
17. handoff is prepared without claiming official action
18. audit event captures enough evidence for evaluation

---

## 26. Decisions Locked by Phase 3

Phase 3 locks the following decisions:

1. Phase 3 is prototype-first, focused on the Phase 12 vertical slice.
2. The runtime style is deterministic shell + AI counseling core.
3. The AI may propose interpretation, response, recommendations, memory outputs, and handoff summaries.
4. The platform owns boundary decisions, skill selection, validation, commit, and audit.
5. The per-turn runtime uses two checkpoints: pre-generation control and pre-commit validation.
6. Operating context snapshots are AI-proposed and platform-validated.
7. The platform has final authority over zone, handoff status, profile completeness, recommendation readiness, skill eligibility, and memory-impacting promotion.
8. `SKILL.md` retrieval and selection are platform-owned.
9. The AI may propose the counseling action but not the final skill package.
10. Boundary rules are loaded deterministically.
11. The boundary engine is layered: deterministic scanner, AI semantic classifier, platform resolver.
12. The platform resolver is final authority for zone and handoff behavior.
13. The resolver chooses the safer zone when uncertain.
14. Yellow ambiguity gets one targeted clarification.
15. Red-zone triggers override normal skill behavior.
16. Every AI turn returns a student-facing response plus typed structured execution result.
17. The structured result is a proposal, not truth.
18. Validation-specific failure handling is used.
19. Clear official-action or red-zone violations are overridden immediately.
20. The prototype runtime is a plain structured pipeline.
21. The modules should be clean and node-like for possible LangGraph migration later.
22. Deep Agents is not the main prototype runtime.
23. The runtime module topology uses medium-grained services.
24. The minimal runtime contracts are TurnInput, BoundaryResult, OperatingContext, SkillSelectionResult, ExecutionContext, AIExecutionResult, ValidationResult, CommitResult, and AuditEvent.
25. Knowledge Gateway is runtime-owned and runs before AI generation when factual knowledge is needed.
26. Knowledge Gateway controls source access, answerability, student-safe facts, uncertainty, and internal-only filtering.
27. Output commit is validated-only.
28. AI-proposed outputs are never treated as truth until validated.
29. Official-action outputs are never commit-eligible in the prototype.
30. Every turn writes one structured audit event.
31. Every turn emits lightweight evaluation labels.
32. Production-grade runtime details are deferred unless needed by the prototype vertical slice.

---

## 27. Open Questions Deferred to Later Phases

The following questions are intentionally deferred.

### Phase 4 — Student Memory & Counseling State

1. What is the final durable student memory schema?
2. How are current truth and historical preferences represented?
3. How are memory corrections and direction changes stored?
4. How are memory confidence, evidence, visibility, and source linked?

### Phase 5 — Business Knowledge & Source Governance

1. What exact source priority rules should the Knowledge Gateway enforce?
2. How should public university data, Google Sheets, and Google Drive be integrated?
3. How should freshness and conflicting facts be scored?
4. How should internal-only knowledge influence routing without leaking?

### Phase 6 — Recommendation & Decision Support Automation

1. What scoring model generates recommendations?
2. What fields define a durable recommendation record?
3. How should recommendation lifecycle and student reaction tracking work?
4. How should recommendation quality be evaluated?

### Phase 7 — Registration Boundary & Human Handoff

1. What exact fields belong in the handoff package?
2. How should human counselor routing work?
3. How should sensitive or complex-case handoff differ from ready-to-register handoff?
4. What is the post-handoff student experience?

### Phase 8 — CRM Integration Model

1. What CRM context can the runtime read?
2. What CRM writebacks may be allowed later?
3. What approval workflow is needed before CRM mutation?
4. How is CRM truth separated from counseling memory?

### Phase 9 — Guardrails, Policy & Boundary Enforcement

1. How does the broader policy engine relate to SKILL.md boundary rules?
2. What guardrails run pre-response, post-response, and post-turn?
3. How should red-zone miss risk be scored?
4. How should guardrail policy updates be released?

### Phase 10 — Evaluation, Simulation & Quality Monitoring

1. What scenario suites prove red-zone recall?
2. What metrics should be monitored in production?
3. How should human review sampling work?
4. How should regression tests run before skill, knowledge, or policy changes?

### Phase 11 — Admin, Knowledge & Skill Operations

1. How do counselors maintain SKILL.md packages operationally?
2. How are approved runtime skill indexes published?
3. How are bad skill updates rolled back?
4. What quality dashboard do business users need?

### Phase 13 — Production Hardening

1. Should the runtime migrate to LangGraph?
2. What production observability, tracing, latency, retry, and deployment strategy is needed?
3. How should model routing and cost controls work?
4. How should production incidents and red-zone misses be handled?

---

## 28. Relationship to Later Phases

### Phase 4

Phase 4 should turn prototype accepted memory outputs and operating context into a durable memory and counseling state model.

### Phase 5

Phase 5 should expand the prototype Knowledge Gateway into full source governance, answerability, visibility, freshness, and conflict handling.

### Phase 6

Phase 6 should formalize recommendation generation, validation, persistence, confidence, and lifecycle behind the prototype recommendation outputs.

### Phase 7

Phase 7 should convert prototype handoff output into operational handoff package, routing, counselor-facing summary, and post-handoff behavior.

### Phase 8

Phase 8 should define CRM read/write boundaries while preserving CRM as operational source of truth.

### Phase 9

Phase 9 should define the broader guardrail and policy system that complements Phase 2 boundary rules and Phase 3 validation.

### Phase 10

Phase 10 should expand prototype audit events and evaluation labels into scenario suites, regression tests, monitoring, and dashboards.

### Phase 11

Phase 11 should define how business users maintain SKILL.md packages, knowledge, policy, and quality controls.

### Phase 12

Phase 12 should implement this Phase 3 runtime strategy as the first bounded autonomous counseling vertical slice.

### Phase 13

Phase 13 should harden the runtime for production scale, reliability, observability, rollout, and incident response.

---

## 29. Final Phase 3 Policy Statement

```text
Phase 3 defines a prototype-first autonomous runtime strategy for the AI-first
bounded counseling platform.

The runtime uses a deterministic shell with an AI counseling core.

The AI may counsel naturally and propose interpretation, response, memory,
recommendation, and handoff outputs, but the platform owns boundary decisions,
SKILL.md selection, mandatory boundary rule loading, knowledge answerability,
validation, commit, and audit.

Each turn uses a two-checkpoint flow: pre-generation boundary/context/skill
control and pre-commit response/output validation.

The prototype runtime is implemented as a plain structured pipeline with clean
node-like modules, designed for possible later LangGraph migration but not
requiring LangGraph or Deep Agents initially.

Every AI turn returns a student-facing response and typed structured execution
result. The platform validates before committing any runtime state, memory,
recommendation, or handoff output.

Official-action outputs are never commit-eligible. Red-zone triggers override
normal counseling behavior and prepare human handoff.

Every turn produces structured audit evidence and lightweight evaluation labels
so the Phase 12 prototype can prove bounded autonomy, skill control, boundary
safety, output validation, and handoff behavior.
```

---

## 30. One-Sentence Summary

```text
Phase 3 chooses a prototype-first deterministic shell with an AI counseling core,
where the platform controls boundary detection, SKILL.md selection, knowledge
answerability, validation, commit, and audit while the AI remains flexible inside
approved counseling behavior.
```
