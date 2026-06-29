# Phase 3 — Autonomous Runtime Strategy Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 3 — Autonomous Runtime Strategy  
**Version:** 1.2  
**Date:** 2026-06-29  
**Status:** Approved exploration output for Phase 3, amended for Phase 1/2 v1.2 counselor-like flow support, Phase 1/2/4 v1.1 route-based minimum profile and interpretation alignment  
**Source Context:** Phase 0 Bounded Autonomy Baseline, Phase 1 Autonomous Counseling Operating Model v1.2, Phase 2 Counseling SOP & Skill Control v1.2, Phase 4 Interpretation & Extraction Layer v1.1, Prototype Runtime Checkpoint, Roadmap v7.1, Phase 3 exploration discussion, minimum counseling profile routing amendment, and counselor-like flow amendment

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

### 1.1 Version 1.1 Amendment Summary

Version 1.1 updates Phase 3 to align the prototype runtime strategy with:

1. Phase 1 v1.1 route-based minimum counseling profile
2. Phase 2 v1.1 route-aware `SKILL.md` control model
3. Phase 4 v1.1 Interpretation & Extraction Layer

The original Phase 3 prototype flow was:

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

The revised Phase 3 v1.1 flow inserts validated interpretation into Checkpoint 1:

```text
student message
→ fast boundary signal scan
→ AI interpretation proposal
→ interpretation validation
→ AcceptedInterpretation
→ boundary resolution
→ operating context update
→ route-aware SKILL.md selection
→ knowledge gateway, if needed
→ AI response + structured execution result
→ validation
→ validated commit only
→ audit and evaluation evidence
```

The runtime stance remains prototype-first. Phase 3 v1.1 does not redesign production memory, CRM, recommendation lifecycle, or knowledge governance. It only updates the prototype runtime contracts so the existing deterministic shell can consume Phase 4 `AcceptedInterpretation` and apply Phase 1/2 v1.1 route-based minimum-profile semantics.

Core amendment principles:

```text
AI may interpret and counsel.
Platform validates interpretation and counseling outputs.
Only validated outputs may influence runtime truth or commit.
```

```text
Minimum profile means route readiness:
academic result status + course direction status + university direction status.
It does not mean ranking/budget/location have been collected.
```

---

### 1.2 Version 1.2 Amendment Summary

Version 1.2 updates Phase 3 to support the Phase 1/2 v1.2 counselor-like flow amendment while preserving the existing deterministic-shell runtime architecture.

The Phase 3 v1.2 change is not a new agent architecture and not a new journey state model.

It adds runtime support for:

1. accepted student posture context
2. counselor response mode selection
3. Reflect → Guide → Ask response framing
4. decision-support micro-loop execution support
5. soft summary checkpoints before recommendation or confirmation
6. confirmed counseling preference milestone behavior
7. response validation for counselor-like flow quality
8. audit/evaluation labels for counselor-like behavior

The v1.2 runtime principle is:

```text
Route context decides where the counseling should go.
Counselor response mode decides how the AI should guide the student there.
Boundary rules still override both.
```

The runtime remains:

```text
Deterministic shell + AI interpretation core + AI counseling core.
```

The AI may propose student-facing wording and counselor response behavior, but the platform validates that the response remains aligned with accepted route, accepted posture, selected SKILL.md guidance, boundary rules, and output permissions.

---

## 2. Scope

Phase 3 defines:

1. the runtime responsibility split between deterministic platform control, AI interpretation behavior, and AI counseling behavior
2. the per-turn runtime flow
3. boundary checkpoint placement
4. Phase 4 `AcceptedInterpretation` placement inside Checkpoint 1
5. operating context snapshot ownership
6. route-based minimum profile and route context ownership
7. `SKILL.md` retrieval and route-aware deterministic selection placement
8. layered boundary and interpretation-aware boundary resolution
9. student posture and counselor response mode support
10. decision-support, soft-summary, and milestone-confirmation runtime support
11. typed structured execution result contract
12. validation pipeline and failure behavior
13. prototype runtime framework choice
14. runtime module topology
15. minimal runtime data contracts
16. knowledge gateway placement within the runtime
17. output commit and runtime state persistence rules
18. audit event and evaluation hook requirements
19. Phase 3 decisions locked
20. open questions deferred to later phases

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
13. full implementation details of the Phase 4 AI interpretation model
14. final durable interpretation storage schema
15. final route derivation algorithm beyond prototype operating-context validation
16. final durable storage rules for student posture or decision blockers
17. production-grade conversation quality scoring beyond lightweight runtime labels
18. final human handoff package after confirmed counseling preference

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

### 5.1.1 Phase 1 v1.1/v1.2 Route-Based Minimum Counseling Profile

Phase 3 v1.2 must continue to execute the revised Phase 1 minimum counseling profile.

The minimum profile is now route-oriented:

```text
1. academic result status
2. course direction status
3. university direction status
```

This means `profileCompleteness = minimum_complete` means:

```text
The runtime knows enough to route the next counseling move.
```

It does **not** mean the runtime has enough information for a high-quality university recommendation.

The runtime must therefore distinguish:

```text
minimum_complete:
  academic result status, course direction status, and university direction status are known.

rich_profile:
  minimum profile is complete and enough fit signals are available for higher-quality recommendation.
```

Route context values should be derived from the accepted operating context and, when available, Phase 4 `AcceptedInterpretation`:

```text
collect_academic_result
course_or_pathway_exploration
university_exploration
course_exploration_within_university_context
recommendation_or_validation
comparison_or_shortlist
handoff_boundary_check
```

University-fit details such as ranking/prestige preference, budget/value preference, location, campus, intake, timeline, and family constraints are no longer universal minimum-profile gates. They are optional fit signals unless stated as hard constraints.


### 5.1.2 Phase 1 v1.2 Counselor-Like Flow Behavior

Phase 3 v1.2 must support the Phase 1 v1.2 counselor-like navigation principle:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

This principle does not replace the journey state model, route context, preference ladder, recommendation readiness, or boundary model.

It adds a runtime-supported behavior layer around the existing flow:

```text
Student message
→ boundary scan
→ interpretation
→ route/context update
→ counselor response mode selection
→ SKILL.md selection
→ AI response using the selected response mode
→ validation
→ commit only validated outputs
```

The runtime should support counselor-like behavior in five ways:

1. carry accepted student posture into operating context when available
2. select a counselor response mode for the turn
3. pass the selected response mode into the execution context
4. validate that the student-facing response follows the selected mode where practical
5. audit whether the response used the expected counselor-like pattern

Student posture is not a journey state. It is advisory context used to improve tone, pacing, and next-step framing.

Possible student posture values:

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

Possible counselor response modes:

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

Boundary behavior still wins. If the BoundaryResolver returns red, the counselor response mode must become `handoff_safe` regardless of posture or selected skill guidance.

### 5.2 Per-Turn Operating Loop

Phase 1 conceptually defined each student turn as:

```text
Student message
  ↓
1. Boundary scan
  ↓
2. Meaning interpretation
  ↓
3. Journey state and route update
  ↓
4. Student posture and counselor response mode resolution
  ↓
5. Counseling action and skill selection
  ↓
6. Response using the selected counselor-like pattern
  ↓
7. Memory/counseling output proposal
```

Phase 3 converts this conceptual loop into a prototype runtime pipeline.

### 5.3 Recommendation Readiness

The runtime must preserve revised Phase 1 v1.1 recommendation readiness levels:

```text
R1. Not Ready to Recommend
R2. Ready for Directional Recommendation
R3. Ready for High-Quality Recommendation
```

Runtime meaning:

```text
R1:
  academic result is missing, unclear, or unusable, or the student has no usable course, university, or pathway direction.

R2:
  academic result is known and at least one direction is known: course direction, university direction, or pathway direction.

R3:
  academic result and direction are clear enough, and enough fit signals exist to support a high-quality recommendation.
```

Recommendation readiness affects skill eligibility, recommendation confidence, validation behavior, and whether a recommendation should be framed as directional or high-quality.

Important:

```text
Ranking/budget/location can improve R3 readiness but are not required for R2 directional recommendation.
```

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

### 5.7 Decision-Support Micro-Loop Support

The runtime must support Phase 1 v1.2 decision-support micro-loops.

Decision-support behavior may be needed in S3, S4, S5, or S8 when the student is overwhelmed, comparing options, asking for the best option without criteria, contradicting themselves, or cycling without progress.

The runtime should support these decision-support modes:

```text
clarify_tradeoff
narrow_options
reflect_blocker
decision_frame
stop_looping
```

These modes may influence:

1. selected runtime skill
2. optional playbook attachment
3. counselor response mode
4. execution context instructions
5. validation expectations
6. audit labels

The runtime does not need to fully solve durable indecision memory in Phase 3. Durable representation of decision blockers and repeated indecision belongs to Phase 5.

### 5.8 S6 Confirmed Counseling Preference Milestone Support

The runtime must support Phase 1 v1.2 S6 milestone behavior.

When a student reaches L4 confirmed counseling preference, the runtime should require the response to:

1. acknowledge progress
2. restate the confirmed counseling preference
3. clarify that the preference is not official application, registration, payment, enrollment, seat reservation, or CRM truth
4. summarize why the option fits, if enough evidence exists
5. offer safe next steps such as compare one final alternative, take time to think, or speak with a human counselor for official application/registration

The runtime must still enforce:

```text
L4 confirmed counseling preference is non-official.
L5 ready-to-apply/register intent triggers handoff.
```

### 5.9 Operating Context Snapshot

The runtime must maintain an accepted operating context snapshot with at least:

```text
current_main_state
overlay_state
resume_target_state
current_zone
primary_counseling_action
profile_completeness
minimum_profile_route
recommendation_readiness
preference_strength
active_student_direction
student_posture
counselor_response_mode
decision_support_mode
summary_checkpoint_status
milestone_confirmation_status
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

### 6.6 Phase 2 v1.1/v1.2 Route-Aware Skill Selection

Phase 3 v1.2 must continue to execute the revised Phase 2 route-aware skill model.

The runtime should use route context when selecting skills:

```text
profileCompleteness
minimumProfileRoute
courseDirectionStatus
universityDirectionStatus
recommendationReadiness
preferenceStrength
boundaryResult
```

Skill selection must reject skills whose metadata does not match the accepted route context.

Example:

```yaml
candidate_skill: university-exploration
applies_to_minimum_profile_routes:
  - university_exploration
current_minimum_profile_route: course_or_pathway_exploration
decision: reject
reason: student_has_no_course_direction_yet_and_should_not_be_forced_into_university_fit_questions
```

### 6.7 Phase 4 `AcceptedInterpretation` as Upstream Semantic Input

When Phase 4 is available, Phase 3 should consume `AcceptedInterpretation` before boundary resolution, operating-context update, skill selection, knowledge routing, and response validation.

The runtime may use accepted interpretation for:

1. boundary candidate evidence
2. minimum profile signals
3. course direction status
4. university direction status
5. quality-enhancing signals
6. knowledge need signals
7. contradiction signals
8. preference strength candidate
9. readiness-to-register signal

Accepted interpretation is still not durable memory or official truth.

```text
AcceptedInterpretation may guide runtime decisions.
AcceptedInterpretation does not directly commit memory, recommendation, handoff,
CRM status, application truth, registration truth, payment truth, seat truth, or enrollment truth.
```

### 6.8 Phase 2 v1.2 Counselor-Like Skill Guidance

Phase 3 v1.2 must consume Phase 2 v1.2 counselor-like skill guidance as runtime input.

Phase 2 v1.2 introduces guidance such as:

```text
Reflect → Guide → Ask
student posture guidance
decision-support micro-loop guidance
soft summary checkpoints
confirmed-preference milestone guidance
```

The runtime should use this guidance in three places:

1. `SkillControlService` may select or prefer skills/playbooks whose metadata matches the accepted posture, route, response mode, or decision-support need.
2. `ExecutionContextComposer` should include the selected counselor response mode and the relevant SKILL.md response pattern in the AI counseling prompt package.
3. `ValidationPipeline` should check that the response does not violate core counselor-like flow expectations, especially at decision points.

Phase 2 v1.2 guidance is not stronger than boundary rules.

```text
Boundary rules override counselor response mode.
Structured metadata overrides Markdown body guidance.
Counselor-like guidance shapes the response only inside safe autonomous counseling.
```

---

## 7. Core Phase 3 Design Direction

Phase 3 v1.2 uses the following runtime stance:

```text
Deterministic shell + AI interpretation core + AI counseling core.
```

The AI may be flexible in semantic interpretation and student-facing counseling behavior, but the platform must control the trust boundaries.

### 7.1 AI-Controlled Responsibilities

The AI interpretation core may propose:

1. semantic interpretation signals
2. flow-driving signal candidates
3. quality-enhancing signal candidates
4. boundary candidate signals
5. knowledge need signals
6. contradiction signals
7. confidence and clarification signals
8. student posture signal candidates, when Phase 4 supports them

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
11. counselor response wording aligned with selected response mode
12. proposed decision-support framing when relevant

### 7.2 Platform-Controlled Responsibilities

The deterministic shell owns:

1. fast boundary scanning
2. interpretation validation
3. accepted interpretation production
4. boundary resolution and final zone decision
5. red-zone override behavior
6. operating context acceptance
7. counselor response mode acceptance
8. decision-support mode acceptance
9. soft-summary and milestone-confirmation validation
10. skill retrieval and deterministic selection
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
AI proposes interpretation and counseling outputs.
Platform validates interpretation and counseling outputs.
Platform commits only validated outputs.
```

No AI-proposed interpretation or counseling output becomes accepted runtime truth until validation accepts it.

---

## 8. Primary Runtime Risks

Phase 3 v1.2 is designed around the following risks:

1. wrong boundary detection
2. wrong interpretation acceptance
3. wrong route derivation
4. wrong skill selection
5. bad memory writes
6. hallucinated knowledge
7. poor recommendation quality
8. mechanical or non-counselor-like flow behavior
9. premature confirmation without milestone boundary wording

The prototype runtime must explicitly test these risks.

| Risk | Runtime Control |
|---|---|
| Wrong boundary detection | FastBoundarySignalScanner, accepted boundary candidate signals, BoundaryResolver, post-response boundary validation |
| Wrong interpretation acceptance | InterpretationValidator, evidence validation, confidence downgrade, rejected/downgraded signal audit |
| Wrong route derivation | Route-based `MinimumProfileSignals`, OperatingContextManager validation, route-aware skill filtering |
| Wrong skill selection | Platform-owned metadata filtering, route-context filtering, skill selection validation |
| Bad memory writes | AcceptedInterpretation evidence, allowed/forbidden output validation, preference-promotion checks |
| Hallucinated knowledge | Accepted knowledge need signals, runtime-owned Knowledge Gateway, knowledge uncertainty validation |
| Poor recommendation quality | Recommendation readiness, assumptions/cautions, confidence validation, distinction between R2 and R3 |
| Mechanical or non-counselor-like flow behavior | Counselor response mode, selected SKILL.md response pattern, response consistency validation, audit labels |
| Premature confirmation without milestone boundary wording | Preference promotion validator, milestone confirmation validator, no-official-action boundary rule |

---

## 9. Runtime Style Decision

Phase 3 originally considered four runtime styles:

```text
Option A: Mostly AI-driven runtime
Option B: Fully deterministic runtime
Option C: Deterministic shell + AI counseling core
Option D: Agentic runtime with deterministic checkpoints
```

Phase 3 v1.2 keeps the same strategic choice, but expands the AI core into two bounded AI roles:

```text
Option C v1.2: Deterministic shell + AI interpretation core + AI counseling core.
```

### 9.1 Why Not Mostly AI-Driven

A mostly AI-driven runtime would allow the AI to decide interpretation, state, zone, skill, response, memory outputs, and handoff need.

This is too risky because the AI would be both actor and judge.

It would weaken interpretation validation, boundary reliability, skill selection control, memory validation, and auditability.

### 9.2 Why Not Fully Deterministic First

A fully deterministic runtime would provide strong control, but it would be too heavy for the first prototype.

It would require many hand-written rules before the system can handle natural detours, ambiguous student language, and nuanced counseling signals.

### 9.3 Why Deterministic Shell + AI Interpretation Core + AI Counseling Core

This model is simple enough for the prototype while still proving bounded autonomy.

The AI can interpret and counsel naturally, but the platform controls:

1. fast boundary scanning
2. interpretation validation
3. boundary resolution
4. operating-context acceptance
5. route-aware skill selection
6. memory/recommendation/handoff validation
7. knowledge answerability
8. audit and evaluation

---

## 10. Per-Turn Runtime Flow

Phase 3 v1.2 still uses a **two-checkpoint per-turn runtime**.

The major update is that Phase 4 interpretation now lives inside Checkpoint 1.

### 10.1 Checkpoint 1 — Pre-Generation Control

Purpose:

```text
Detect boundary risk, validate semantic interpretation, build accepted context,
select valid route-aware skill artifacts, route knowledge, and prepare controlled
execution context before the AI counselor responds.
```

Checks include:

1. fast boundary signal scan
2. AI interpretation proposal
3. interpretation schema and evidence validation
4. accepted interpretation production
5. boundary resolution
6. current zone
7. journey state
8. profile completeness
9. minimum profile route
10. primary counseling action
11. skill eligibility
12. mandatory boundary rules
13. student posture context, when available
14. counselor response mode
15. decision-support mode, when needed
16. soft-summary or milestone-confirmation requirement
17. knowledge need classification

### 10.2 Checkpoint 2 — Pre-Commit Validation

Purpose:

```text
Validate what the AI counselor proposed before anything is shown as final,
committed, or used as runtime truth.
```

Checks include:

1. response safety
2. consistency with AcceptedInterpretation
3. official-action language
4. memory output validity
5. recommendation output validity
6. handoff output validity
7. skill compatibility
8. knowledge citation / uncertainty flags
9. counselor-like response consistency
10. soft-summary and milestone-confirmation requirements
11. final audit evidence

### 10.3 Prototype Turn Flow

```text
1. Receive student message
2. Load previous runtime conversation state
3. Run FastBoundarySignalScanner
4. Run AIInterpretationClient
5. Run InterpretationValidator
6. Produce AcceptedInterpretation or safe fallback interpretation status
7. Run BoundaryResolver
8. Build/update accepted OperatingContext
9. Resolve profile completeness and minimum profile route
10. Resolve student posture context when available
11. Resolve counselor response mode and decision-support mode when needed
12. Select valid route-aware and counselor-guidance-aware SKILL.md artifacts
13. Call KnowledgeGateway if accepted knowledge need signals or selected skill require factual knowledge
14. Compose ExecutionContext with route context, response mode, selected skill guidance, and boundary rules
15. Call AIExecutionClient
16. Validate AIExecutionResult, including counselor-like response consistency
17. Correct, block, downgrade, regenerate once, clarify, hand off, or fallback
18. Commit validated outputs only
19. Write structured audit event
20. Return final response
```

### 10.4 Phase 4-Unavailable Fallback

If Phase 4 interpretation is not yet implemented in the prototype, the runtime may temporarily use validated heuristics for profile extraction, boundary scan, route derivation, and knowledge need detection.

However, the runtime contract should already be shaped as if `AcceptedInterpretation` may be present.

```text
Temporary heuristics may feed the same fields.
Downstream modules should depend on accepted semantic artifacts, not raw transcript.
```

---

## 11. Operating Context Snapshot Ownership

Phase 3 v1.2 uses:

```text
AI-proposed, interpretation-assisted, platform-validated operating context snapshots.
```

The AI may propose context updates through interpretation and counseling outputs, but the platform owns the accepted snapshot used for skill selection, validation, commit, and audit.

### 11.1 Field Ownership

| Snapshot Field | Prototype Owner | Reason |
|---|---|---|
| `current_main_state` | AI may propose, platform validates | Natural language state detection needs flexibility |
| `overlay_state` | AI may propose, platform validates | Detours are semantic and conversational |
| `resume_target_state` | Platform stores | Previous main state must be preserved reliably |
| `current_zone` | Platform final authority | Boundary safety depends on it |
| `primary_counseling_action` | AI may propose, platform validates | Must align with one-action-per-turn rule |
| `profile_completeness` | Platform validates | Based on route-based minimum profile fields |
| `minimum_profile_route` | Platform derives and validates | Drives route-aware skill selection |
| `academic_result_status` | AcceptedInterpretation proposes, platform validates | Minimum profile route input |
| `course_direction_status` | AcceptedInterpretation proposes, platform validates | Minimum profile route input |
| `university_direction_status` | AcceptedInterpretation proposes, platform validates | Minimum profile route input |
| `recommendation_readiness` | Platform validates | Based on academic result, direction, and fit signals |
| `preference_strength` | AI may propose, platform validates | Prevents weak signal over-promotion |
| `active_student_direction` | AcceptedInterpretation may propose, platform validates | Semantic but must not overwrite history carelessly |
| `quality_context_summary` | Platform derives from accepted quality-enhancing signals | Supports personalization without becoming official truth |
| `student_posture` | AcceptedInterpretation or runtime may propose, platform validates | Improves response style and next-step framing without becoming state truth |
| `counselor_response_mode` | Platform derives, AI may propose | Controls whether the response should orient, explain route, support decision, summarize, confirm milestone, clarify, or hand off |
| `decision_support_mode` | Platform derives, AI may propose | Supports trade-off clarification, narrowing, blocker reflection, decision framing, or stopping loops |
| `summary_checkpoint_status` | Platform derives | Indicates whether a soft summary is required before recommendation or confirmation |
| `milestone_confirmation_status` | Platform derives | Indicates whether S6 milestone response requirements apply |
| `unresolved_decision_point` | AI may propose, platform validates | Useful for counseling quality |
| `handoff_status` | Platform final authority | Red-zone recall is critical |
| `next_best_counseling_move` | AI may propose, platform validates | Must align with selected skill, route, and boundary status |

### 11.2 Accepted Snapshot Rule

```text
Only the platform-accepted operating context may drive:
- skill selection
- boundary rule loading
- knowledge routing
- counselor response mode selection
- validation
- commit
- audit
```

### 11.3 Route Completeness Semantics

```text
profileCompleteness = incomplete:
  academic result status, course direction status, or university direction status is missing.

profileCompleteness = minimum_complete:
  academic result status, course direction status, and university direction status are known.

profileCompleteness = rich_profile:
  minimum profile is complete and enough fit signals exist for high-quality recommendation.
```

Important:

```text
minimum_complete means route-ready.
It does not mean enough for high-quality university recommendation.
```

### 11.4 Counselor Response Mode Semantics

`counselorResponseMode` tells the AI counseling core how the response should behave for this turn.

```text
standard:
  Ordinary green-zone response with normal counseling guidance.

reassuring_orientation:
  Use when the student is lost, confused, anxious, or just browsing.
  The response should normalize uncertainty, orient the student, and ask one easy next question.

route_explanation:
  Use when the system needs to explain why a route question matters.
  The response should explain the route before asking the next question.

decision_support:
  Use when the student is comparing, stuck, or overwhelmed.
  The response should clarify trade-offs, narrow options, reflect blockers, or provide a decision frame.

summary_checkpoint:
  Use before recommendation, comparison conclusion, or preference confirmation when the context is complex enough that a short recap improves trust.

milestone_confirmation:
  Use when the student reaches L4 confirmed counseling preference.
  The response must clarify that this is a counseling preference, not official action.

clarify_once:
  Use when ambiguity blocks safe progress, especially ambiguous proceed language.

handoff_safe:
  Use when BoundaryResult is red or when normal counseling must stop.
```

Runtime rule:

```text
BoundaryResult can override counselorResponseMode.
If BoundaryResult.finalZone = red, counselorResponseMode = handoff_safe.
```

---

## 12. SKILL.md Retrieval and Selection Placement

Phase 3 v1.2 uses:

```text
Platform-owned route-aware SKILL.md retrieval and deterministic skill selection.
```

The AI may propose a primary counseling action, but it may not choose the final skill package.

### 12.1 Skill Selection Flow

```text
1. AcceptedInterpretation is available, or a validated heuristic fallback is available.
2. Accepted operating context is available.
3. Platform resolves profile completeness and minimum profile route.
4. Platform retrieves candidate playbooks and runtime skills from approved index.
5. Platform filters candidates by structured metadata.
6. Platform filters candidates by route context when relevant.
7. Platform considers counselor-like guidance metadata when available.
8. Platform selects one primary runtime skill.
9. Platform optionally attaches one playbook.
10. Platform deterministically loads mandatory boundary rules.
11. Platform rejects invalid candidates.
12. Platform emits skill selection audit evidence.
```

### 12.2 Runtime Skill Filters

Runtime skill candidates are filtered by:

1. current main state
2. primary counseling action
3. current zone
4. profile completeness
5. minimum profile route
6. recommendation readiness
7. preference strength
8. accepted interpretation signals used by the skill
9. allowed memory outputs
10. forbidden memory outputs
11. required boundary rules
12. approved/latest version status
13. supported student postures, when declared
14. supported counselor response modes, when declared
15. decision-support modes, when declared

### 12.3 Route-Aware Selection Ranking

Prototype ranking can be simple:

```text
Exact state/action/route metadata match
  > exact state/action match with safe broad route support
  > counselor-response-mode/posture guidance match when available
  > broader safe match
  > generic fallback skill
  > boundary-safe handoff
```

### 12.4 Counselor-Guidance-Aware Selection

Phase 3 v1.2 may use Phase 2 v1.2 counselor-like metadata to improve skill/playbook selection.

Examples:

```yaml
student_posture: lost_or_confused
counselor_response_mode: reassuring_orientation
preferred_skill_guidance:
  - reflect_before_routing
  - guide_before_asking
  - ask_one_next_question
```

```yaml
current_main_state: S5
student_posture: comparison_oriented
counselor_response_mode: decision_support
decision_support_mode: decision_frame
preferred_skill:
  shortlist-comparison
```

This guidance should not cause route-incompatible skill selection.

```text
Route compatibility and boundary rules remain stronger than posture or tone fit.
```

### 12.5 Rejected Candidate Example

```yaml
candidate_skill: university-exploration
candidate_routes:
  - university_exploration
current_minimum_profile_route: course_or_pathway_exploration
decision: reject
reason: student_needs_course_or_pathway_exploration_before_university_fit_questions
```

### 12.6 Important Rule

```text
The AI must never use an unapproved, unvalidated, route-incompatible, or metadata-incompatible skill.
```

---

## 13. Boundary and Interpretation-Aware Boundary Resolution

Phase 3 v1.2 keeps the original Phase 4-compatible split that replaced the broad `BoundaryEngine` description with a Phase 4-compatible split:

```text
Student message
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
Final zone + handoff status + boundary rules to load
```

The platform resolver remains the final authority.

### 13.1 FastBoundarySignalScanner

The scanner catches obvious red/yellow boundary signals before AI interpretation.

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

Ambiguous proceed:
  proceed, next step, go ahead, let's do this, continue with this option
```

The scanner is not responsible for full semantic understanding. Its job is to catch obvious signals with high recall.

### 13.2 AIInterpretationClient

The AI interpretation client proposes a full semantic interpretation, including:

1. flow-driving signals
2. route-based minimum profile signals
3. quality-enhancing signals
4. boundary candidate signals
5. knowledge need signals
6. contradiction signals
7. confidence summary

This output is not trusted until validated.

### 13.3 InterpretationValidator

The validator checks:

1. schema validity
2. evidence support
3. flow-driving promotion risk
4. boundary signal preservation
5. quality-enhancing signal usefulness
6. contradiction signal handling

Failure behavior:

```text
Invalid schema → repair once or reject.
Unsupported flow-driving signal → reject or downgrade.
Weak boundary signal → preserve as yellow caution when plausible.
Noisy quality signal → ignore or reject.
Ambiguous high-impact signal → require clarification.
```

### 13.4 BoundaryResolver

The resolver combines:

1. fast boundary signals
2. accepted boundary candidate signals
3. accepted readiness-to-register signal
4. ambiguous proceed signals
5. current operating context
6. selected skill metadata
7. mandatory boundary rules
8. previous handoff status

It decides:

1. final zone
2. handoff status
3. trigger type
4. required boundary rules
5. allowed next behavior

### 13.5 Resolver Rules

```text
Rule 1:
If clear H1-H6 red trigger is detected, finalZone = red.

Rule 2:
If official action, payment, enrollment, seat reservation, exception approval,
or human-requested support is detected, handoffStatus = required.

Rule 3:
If language is ambiguous between L4 counseling preference and L5 application intent,
finalZone = yellow and allowedNextBehavior = clarify.

Rule 4:
If ambiguity remains after clarification and it affects official action,
eligibility, sensitive handling, or registration next steps, hand off.

Rule 5:
If generated response or outputs imply official action, block and regenerate
or override with handoff-safe response.

Rule 6:
When scanner, accepted interpretation, and AI counseling output disagree, choose
the safer zone:
green vs yellow → yellow
yellow vs red → red or clarify once, depending on ambiguity.
```

### 13.6 Boundary Results

Green:

```yaml
finalZone: green
handoffStatus: none
allowedNextBehavior: continue
```

Yellow:

```yaml
finalZone: yellow
handoffStatus: possible_clarify
allowedNextBehavior: clarify
```

Red:

```yaml
finalZone: red
handoffStatus: required
allowedNextBehavior: handoff
```

### 13.7 Baseline Boundary Rules

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
    counselor_response_mode:
      one_of:
        - standard
        - reassuring_orientation
        - route_explanation
        - decision_support
        - summary_checkpoint
        - milestone_confirmation
        - clarify_once
        - handoff_safe
    response_pattern_used:
      one_of:
        - reflect_guide_ask
        - direct_answer_then_resume
        - summary_then_recommend
        - decision_frame
        - milestone_confirmation
        - clarify_once
        - handoff_safe

  proposed_context_update:
    current_main_state: S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8
    overlay_state: S9 | null
    primary_counseling_action: A1-A12
    preference_strength_after: L1 | L2 | L3 | L4 | L5 | null
    active_student_direction: string | null
    student_posture: string | null
    counselor_response_mode: string | null
    decision_support_mode: string | null
    summary_checkpoint_status: string | null
    milestone_confirmation_status: string | null
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
    counselor_response_consistency_risk: boolean
    missing_summary_checkpoint: boolean
    milestone_boundary_wording_missing: boolean
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
1. AIExecutionResult schema validation
2. AcceptedInterpretation consistency validation
3. Skill compatibility validation
4. Route compatibility validation
5. Boundary validation
6. Preference promotion validation
7. Memory output validation
8. Recommendation validation
9. Knowledge uncertainty validation
10. Counselor-like response mode validation
11. Soft summary checkpoint validation
12. Milestone confirmation validation
13. Final response consistency validation
14. Audit event emission
```

Boundary validation should happen early because red-zone triggers override normal skill behavior.

AcceptedInterpretation consistency validation should happen before memory, recommendation, and handoff output acceptance because downstream outputs must be supported by validated semantic evidence.

### 15.2 Schema Validator

Checks whether the AI returned valid structured output.

Failure behavior:

```text
repair once
if still invalid, use safe fallback response
do not commit memory or recommendation outputs
audit schema_validation_failed
```

### 15.3 AcceptedInterpretation and Route Compatibility Validators

AcceptedInterpretation consistency validator checks:

1. AIExecutionResult does not contradict accepted flow-driving signals
2. proposed memory outputs are supported by accepted interpretation or direct evidence
3. proposed preference promotion is supported by accepted preference strength evidence
4. proposed handoff output is supported by accepted boundary/readiness evidence or final BoundaryResult
5. proposed factual answer aligns with accepted knowledge need signals and KnowledgeGateway output

Route compatibility validator checks:

1. selected skill is valid for `minimumProfileRoute`
2. recommendation readiness matches the type of recommendation produced
3. `minimum_complete` is not treated as `rich_profile`
4. ranking/budget/location are not required as universal minimum-profile fields
5. university-fit questions are asked only when relevant to the route or volunteered by the student

Failure behavior:

```text
unsupported output → block or downgrade
route-incompatible response → regenerate once or select safer fallback skill
over-strong recommendation → lower confidence and add assumptions/cautions
minimum-profile over-collection → correct response to ask only the next useful route question
```

### 15.4 Skill Compatibility Validator

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

### 15.5 Boundary Validator

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

### 15.6 Preference Promotion Validator

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

### 15.7 Memory Output Validator

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

### 15.8 Recommendation Validator

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

### 15.9 Knowledge Uncertainty Validator

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

### 15.10 Counselor-Like Response Mode Validator

Checks:

1. response follows the platform-selected `counselorResponseMode` where practical
2. normal green/yellow counseling uses an appropriate Reflect → Guide → Ask pattern when selected
3. route questions are explained when the student posture requires orientation or when the question may feel arbitrary
4. only one purposeful next question is asked unless the selected skill explicitly permits more
5. decision-support responses do not add unnecessary new options when the student is already overwhelmed

Failure behavior:

```text
minor mismatch → accept with audit warning
mechanical intake or unexplained route question → regenerate once or rewrite response guidance
too many questions → reduce to one purposeful question
boundary conflict → boundary validator wins
```

### 15.11 Soft Summary Checkpoint Validator

Checks:

1. a short summary is present before recommendation when `counselorResponseMode = summary_checkpoint`
2. the summary reflects accepted context rather than unsupported assumptions
3. the summary distinguishes minimum-complete route readiness from high-quality recommendation readiness
4. the summary does not present counseling preference as official status

Failure behavior:

```text
missing summary → regenerate once or prepend safe summary
unsupported summary claim → remove or downgrade claim
summary implies official action → boundary override
```

### 15.12 Milestone Confirmation Validator

Checks:

1. L4 confirmed counseling preference is supported by explicit evidence
2. response acknowledges the milestone without implying official application or registration
3. selected course/university/pathway is restated accurately
4. response includes non-official boundary wording
5. response offers safe next steps
6. response triggers handoff only if the student crosses into L5 or other red-zone trigger

Failure behavior:

```text
unsupported L4 → downgrade or clarify
missing non-official boundary wording → regenerate once
L5 intent detected → override with handoff-safe response
```

### 15.13 Response Consistency Validator

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

Phase 3 v1.2 uses medium-grained node-like modules that are still implementable as a plain structured pipeline.

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
run fast boundary scan
run interpretation
validate interpretation
resolve boundary
build context
select route-aware skills
run knowledge gateway if needed
execute AI counseling
validate outputs
commit safe outputs
write audit
return response
```

It should not contain detailed business logic itself.

### 18.2 FastBoundarySignalScanner

Owns deterministic high-recall scanning for obvious red/yellow signals.

Outputs:

```yaml
fastBoundarySignals:
  - type: ready_to_apply_or_register
    triggerType: H1
    matchedText: "apply now"
    severityCandidate: red
    recommendedBehavior: handoff
```

### 18.3 AIInterpretationClient

Calls the AI interpretation model and returns an `InterpretationResult` proposal.

It does not commit memory, route context, boundary status, recommendation state, handoff state, or official truth.

### 18.4 InterpretationValidator

Validates, downgrades, rejects, or flags interpretation signals.

Outputs `AcceptedInterpretation`.

### 18.5 BoundaryResolver

Combines fast boundary signals, accepted boundary signals, readiness signals, prior context, and boundary rules.

Outputs:

```yaml
boundaryResult:
  finalZone: green | yellow | red
  handoffStatus: none | possible_clarify | required
  triggerType: H1 | H2 | H3 | H4 | H5 | H6 | null
  requiredBoundaryRules: string[]
  allowedNextBehavior: continue | clarify | handoff
```

The BoundaryResolver has final authority over the zone for the turn.

### 18.6 OperatingContextManager

Owns the accepted runtime snapshot.

It uses AcceptedInterpretation and BoundaryResult to update:

1. current state
2. profile completeness
3. minimum profile route
4. direction statuses
5. recommendation readiness
6. preference strength
7. active student direction
8. handoff status
9. next best counseling move

### 18.7 SkillControlService

Owns:

1. approved skill index lookup
2. candidate retrieval
3. metadata filtering
4. route-context filtering
5. one primary runtime skill selection
6. optional playbook attachment
7. mandatory boundary rule loading
8. invalid candidate rejection
9. skill selection evidence

### 18.8 KnowledgeGateway

Runs when accepted knowledge need signals, factual detours, selected skill metadata, or recommendation context require business/university/program knowledge.

It returns answerability, student-safe facts, source references, uncertainty status, and recommended behavior.

### 18.9 ExecutionContextComposer

Builds the controlled input package for the AI counseling core.

It includes:

1. student message
2. short conversation context
3. accepted interpretation summary
4. accepted operating context
5. boundary result
6. selected runtime skill
7. optional playbook
8. loaded boundary rules
9. allowed outputs
10. forbidden outputs
11. required structured schema
12. route context
13. knowledge context, if available

### 18.10 AIExecutionClient

Calls the AI counseling model.

It returns:

1. student-facing response
2. typed structured execution result

It does not commit memory, recommendation, handoff, route context, or official status.

### 18.11 ValidationPipeline

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

### 18.12 OutputCommitService

Commits only validated outputs.

For the prototype, this can use simple persistence and does not need the final Phase 5 memory schema.

### 18.13 AuditEventWriter

Writes one complete structured audit event per turn, including interpretation evidence, route context, skill selection, validation events, and blocked outputs.

---

## 19. Minimal Runtime Data Contracts

Phase 3 v1.2 uses minimal strict runtime contracts.

```text
1. TurnInput
2. FastBoundaryScanResult
3. AcceptedInterpretationRef
4. BoundaryResult
5. OperatingContext
6. SkillSelectionResult
7. ExecutionContext
8. AIExecutionResult
9. ValidationResult
10. CommitResult
11. AuditEvent
```

These contracts are strict enough to prove the Phase 12 vertical slice, but small enough to avoid prematurely designing later phases.

---

## 19.1 TurnInput

```ts
type TurnInput = {
  conversationId: string;
  turnId: string;
  messageId: string;
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

## 19.2 FastBoundaryScanResult

```ts
type FastBoundaryScanResult = {
  signals: FastBoundarySignal[];
};

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

Purpose:

```text
Captures obvious boundary signals before AI interpretation.
```

---

## 19.3 AcceptedInterpretationRef

Phase 3 v1.2 does not redefine the full Phase 4 `AcceptedInterpretation` contract. It stores and passes a reference plus a runtime summary.

```ts
type AcceptedInterpretationRef = {
  interpretationId: string;
  status:
    | "accepted"
    | "accepted_with_downgrades"
    | "requires_clarification"
    | "rejected"
    | "safe_fallback";

  summary: {
    hasBoundarySignals: boolean;
    hasKnowledgeNeedSignals: boolean;
    hasContradictionSignals: boolean;
    highestRiskSignal?: string;
    requiresClarification: boolean;

    studentPosture?: StudentPostureContext;

    minimumProfile?: {
      academicResultKnown: boolean;
      courseDirectionStatusKnown: boolean;
      universityDirectionStatusKnown: boolean;
      academicResultStatus?: "known" | "unknown" | "unclear";
      courseDirectionStatus?:
        | "unknown"
        | "considering_some_courses"
        | "preferred_course_exists"
        | "confirmed_counseling_course_preference";
      universityDirectionStatus?:
        | "unknown"
        | "considering_some_universities"
        | "preferred_university_exists"
        | "confirmed_counseling_university_preference";
      suggestedCounselingRoute?: MinimumProfileRoute;
    };
  };
};
```

Purpose:

```text
Lets Phase 3 consume Phase 4 interpretation without duplicating the full Phase 4 schema.
```

---

## 19.4 BoundaryResult

```ts
type BoundaryResult = {
  finalZone: "green" | "yellow" | "red";
  handoffStatus: "none" | "possible_clarify" | "required";
  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  detectedSignals: string[];
  fastBoundarySignals?: FastBoundarySignal[];
  acceptedInterpretationSignals?: string[];
  requiredBoundaryRules: string[];
  allowedNextBehavior: "continue" | "clarify" | "handoff";
  boundaryReason?: string;
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

## 19.5 OperatingContext

```ts
type MinimumProfileRoute =
  | "collect_academic_result"
  | "course_or_pathway_exploration"
  | "university_exploration"
  | "course_exploration_within_university_context"
  | "recommendation_or_validation"
  | "comparison_or_shortlist"
  | "handoff_boundary_check";

type StudentPosture =
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

type CounselorResponseMode =
  | "standard"
  | "reassuring_orientation"
  | "route_explanation"
  | "decision_support"
  | "summary_checkpoint"
  | "milestone_confirmation"
  | "clarify_once"
  | "handoff_safe";

type DecisionSupportMode =
  | "clarify_tradeoff"
  | "narrow_options"
  | "reflect_blocker"
  | "decision_frame"
  | "stop_looping";

type StudentPostureContext = {
  value: StudentPosture;
  confidence: "low" | "medium" | "high";
  evidence?: string[];
};

type OperatingContext = {
  currentMainState: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";
  overlayState?: "S9";
  resumeTargetState?: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";

  currentZone: "green" | "yellow" | "red";
  primaryCounselingAction:
    | "A1" | "A2" | "A3" | "A4" | "A5" | "A6"
    | "A7" | "A8" | "A9" | "A10" | "A11" | "A12";

  profileCompleteness: "incomplete" | "minimum_complete" | "rich_profile";
  minimumProfileRoute?: MinimumProfileRoute;

  academicResultStatus?: "known" | "unknown" | "unclear";
  courseDirectionStatus?:
    | "unknown"
    | "considering_some_courses"
    | "preferred_course_exists"
    | "confirmed_counseling_course_preference";
  universityDirectionStatus?:
    | "unknown"
    | "considering_some_universities"
    | "preferred_university_exists"
    | "confirmed_counseling_university_preference";

  recommendationReadiness: "R1" | "R2" | "R3";
  preferenceStrength?: "L1" | "L2" | "L3" | "L4" | "L5";

  activeStudentDirection?: {
    courseOrProgram?: string;
    university?: string;
    pathway?: string;
  };

  qualityContextSummary?: {
    hasBudgetSensitivity?: boolean;
    hasLocationPreference?: boolean;
    hasCareerInterest?: boolean;
    hasConcern?: boolean;
    hasHardConstraint?: boolean;
  };

  studentPosture?: StudentPostureContext;
  counselorResponseMode?: CounselorResponseMode;
  decisionSupportMode?: DecisionSupportMode;

  summaryCheckpointStatus?:
    | "not_required"
    | "required_before_recommendation"
    | "required_before_confirmation"
    | "completed";

  milestoneConfirmationStatus?:
    | "not_applicable"
    | "required_for_L4"
    | "completed"
    | "blocked_or_downgraded";

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

## 19.6 SkillSelectionResult

```ts
type SkillSelectionResult = {
  selectedPlaybook?: SkillRef;
  selectedRuntimeSkill: SkillRef;
  loadedBoundaryRules: SkillRef[];
  routeContextUsed?: MinimumProfileRoute;
  postureContextUsed?: StudentPosture;
  counselorResponseModeUsed?: CounselorResponseMode;
  decisionSupportModeUsed?: DecisionSupportMode;
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

## 19.7 ExecutionContext

```ts
type ExecutionContext = {
  studentMessage: string;
  conversationContext: string;
  acceptedInterpretation?: AcceptedInterpretationRef;
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

  routeContext?: {
    profileCompleteness: "incomplete" | "minimum_complete" | "rich_profile";
    minimumProfileRoute?: MinimumProfileRoute;
    recommendationReadiness: "R1" | "R2" | "R3";
  };

  counselorGuidance?: {
    studentPosture?: StudentPostureContext;
    counselorResponseMode: CounselorResponseMode;
    decisionSupportMode?: DecisionSupportMode;
    responsePattern:
      | "reflect_guide_ask"
      | "direct_answer_then_resume"
      | "summary_then_recommend"
      | "decision_frame"
      | "milestone_confirmation"
      | "clarify_once"
      | "handoff_safe";
    askOnePurposefulQuestion: boolean;
    softSummaryRequired: boolean;
    milestoneConfirmationRequired: boolean;
  };

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

## 19.8 AIExecutionResult

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
    counselorResponseMode?: CounselorResponseMode;
    responsePatternUsed?:
      | "reflect_guide_ask"
      | "direct_answer_then_resume"
      | "summary_then_recommend"
      | "decision_frame"
      | "milestone_confirmation"
      | "clarify_once"
      | "handoff_safe";
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
    interpretationConsistencyRisk?: boolean;
    routeCompatibilityRisk?: boolean;
    counselorResponseConsistencyRisk?: boolean;
    missingSummaryCheckpoint?: boolean;
    milestoneBoundaryWordingMissing?: boolean;
  };
};
```

Purpose:

```text
The AI counselor's proposal, not final truth.
```

---

## 19.9 Output Proposal Types

```ts
type ProposedMemoryOutput = {
  type: string;
  value: Record<string, unknown>;
  confidence: "low" | "medium" | "high";
  evidence: string;
  supportedByInterpretationId?: string;
};

type ProposedRecommendationOutput = {
  option: string;
  fitReasons: string[];
  assumptions: string[];
  cautions: string[];
  confidence: "low" | "medium" | "high";
  recommendationReadinessUsed: "R1" | "R2" | "R3";
};

type ProposedHandoffOutput = {
  required: boolean;
  triggerType?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6";
  reason?: string;
  summary?: string;
  supportedByBoundaryResult?: boolean;
};
```

Purpose:

```text
Keeps memory, recommendation, and handoff outputs typed and separately validatable.
```

---

## 19.10 ValidationResult

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
Determines what may be shown, committed, blocked, downgraded, or overridden.
```

---

## 19.11 CommitResult

```ts
type CommitResult = {
  committedContext: OperatingContext;
  committedMemoryOutputIds: string[];
  committedRecommendationOutputIds: string[];
  handoffPrepared: boolean;
  blockedOutputCount: number;
  acceptedInterpretationId?: string;
};
```

Purpose:

```text
Confirms what was actually persisted for the prototype.
```

---

## 19.12 AuditEvent

```ts
type AuditEvent = {
  conversationId: string;
  turnId: string;
  timestamp: string;

  studentMessage: string;
  fastBoundaryScanResult?: FastBoundaryScanResult;
  acceptedInterpretation?: AcceptedInterpretationRef;
  boundaryResult: BoundaryResult;
  operatingContextBefore?: OperatingContext;
  operatingContextAfter: OperatingContext;
  skillSelection: SkillSelectionResult;

  aiExecutionResult: AIExecutionResult;
  validationResult: ValidationResult;
  commitResult: CommitResult;

  fallbackUsed: boolean;
  studentPosture?: string;
  counselorResponseMode?: string;
  decisionSupportMode?: string;
  responsePatternUsed?: string;
  softSummaryRequired: boolean;
  softSummarySatisfied: boolean;
  milestoneConfirmationRequired: boolean;
  milestoneConfirmationSatisfied: boolean;
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
2. BoundaryResolver produces BoundaryResult
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
12. counselor response mode and response pattern used
13. soft-summary or milestone-confirmation validation results

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

  counselorFlow?: {
    studentPosture?: StudentPosture;
    counselorResponseMode?: CounselorResponseMode;
    decisionSupportMode?: DecisionSupportMode;
    responsePatternExpected?: string;
    responsePatternUsed?: string;
    softSummaryRequired: boolean;
    milestoneConfirmationRequired: boolean;
    validationWarnings: string[];
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
7. route-incompatible skill candidate is rejected by route metadata
8. mandatory boundary rules are loaded
9. unsupported factual claim is blocked or caveated
10. memory output is blocked when forbidden by skill metadata
11. minimum profile does not require ranking/budget/location
12. academic result + no course direction + no university direction routes to course/pathway exploration
13. academic result + course direction + no university direction routes to university exploration
14. academic result + university direction + no course direction routes to course exploration within university context
15. academic result + course direction + university direction routes to recommendation/validation/comparison
16. AcceptedInterpretation-supported boundary signal drives handoff or clarification
17. AcceptedInterpretation-supported knowledge need drives KnowledgeGateway
18. every turn has fast boundary scan, accepted interpretation status, boundary result, selected skill, validation result, and commit result
19. lost/confused student gets reassuring orientation instead of mechanical intake
20. route question is explained before asking when counselor response mode requires route explanation
21. recommendation-ready turn uses soft summary when required
22. comparison/indecision turn uses decision-support framing
23. confirmed counseling preference uses milestone wording and non-official boundary wording
24. L4 confirmed preference does not become L5 handoff unless application/register intent appears
25. response asks only one purposeful next question when counselor-like guidance requires it
```

---

## 23. Prototype Vertical Slice Runtime Behavior

The Phase 12 prototype should prove the following journey after Phase 3 v1.2 alignment:

```text
1. student enters chat as pre-registration prospect
2. runtime loads previous runtime state
3. runtime runs FastBoundarySignalScanner
4. runtime runs AIInterpretationClient
5. runtime validates interpretation and produces AcceptedInterpretation
6. runtime resolves BoundaryResult
7. runtime builds accepted OperatingContext
8. runtime resolves profileCompleteness and minimumProfileRoute
9. runtime retrieves latest approved SKILL.md packages from approved index
10. runtime selects route-aware runtime skill and mandatory boundary rules
11. AI collects route-based minimum profile:
    academic result status, course direction status, university direction status
12. runtime routes the student:
    course/pathway exploration, university exploration, course exploration within university context,
    recommendation/validation, comparison/shortlist, or handoff boundary check
13. student asks a factual detour such as fee, location, ranking, or pathway duration
14. accepted knowledgeNeedSignals or selected skill trigger KnowledgeGateway
15. KnowledgeGateway returns answerability and student-safe facts or caveats
16. AI answers or caveats the detour and resumes the main journey
17. runtime selects directional-recommendation or high-quality-recommendation skill based on R2/R3
18. AI provides recommendation with assumptions, cautions, and confidence
19. runtime validates recommendation against readiness and knowledge certainty
20. runtime selects shortlist-comparison skill if the student compares options
21. AI compares or shortlists options
22. student expresses weak interest, expressed preference, deferral, or confirmed counseling preference
23. runtime validates preference strength and commits allowed outputs only
24. student says they want to apply/register/pay/reserve a seat or asks for a human
25. boundary resolver detects red-zone or handoff trigger
26. normal skill is overridden
27. AI prepares handoff and does not perform official action
28. audit captures fast boundary signals, AcceptedInterpretation, route context, selected skills,
    versions/hashes, proposed outputs, committed outputs, blocked outputs, knowledge used,
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

The Phase 3 v1.2 runtime strategy is successful if the Phase 12 prototype can prove:

1. the deterministic shell can control both AI interpretation and AI counseling cores
2. the two-checkpoint turn flow works
3. FastBoundarySignalScanner runs before AI interpretation
4. AIInterpretationClient produces structured interpretation proposals
5. InterpretationValidator accepts, downgrades, rejects, or falls back safely
6. AcceptedInterpretation can guide boundary resolution, context update, skill selection, knowledge routing, validation, and audit
7. the operating context snapshot is maintained across turns
8. route-based profile completeness is resolved correctly
9. `minimum_complete` means route-ready, not high-quality recommendation-ready
10. detour/resume behavior is preserved
11. skill retrieval and deterministic route-aware selection work
12. invalid or route-incompatible skill candidates are rejected by metadata
13. mandatory boundary rules load deterministically
14. BoundaryResolver detects green/yellow/red cases using scanner and accepted interpretation evidence
15. ambiguous proceed language triggers clarification
16. red-zone intent overrides normal skill behavior
17. structured execution result is produced every turn
18. memory outputs are validated before commit
19. weak signals are not over-promoted
20. confirmed counseling preference remains non-official
21. recommendation confidence is validated against R2/R3 readiness
22. unsupported factual claims are blocked, caveated, or escalated
23. handoff is prepared without claiming official action
24. audit event captures enough interpretation, route, skill, validation, and commit evidence for evaluation

---

### 25.1 Counselor-Like Flow Success Criteria

The Phase 12 prototype should additionally prove:

```text
1. route-based profile collection can feel conversational rather than questionnaire-like
2. student posture can influence response mode without overriding boundaries
3. Reflect → Guide → Ask can be represented in execution context and validated lightly
4. decision-support micro-loops can be selected for comparison and indecision turns
5. soft summary checkpoints appear before recommendation when required
6. S6 milestone confirmation clearly separates counseling preference from official action
7. counselor-like guidance is auditable through response mode and validation labels
```

---

## 26. Decisions Locked by Phase 3

Phase 3 v1.2 locks the following decisions:

1. Phase 3 remains prototype-first, focused on the Phase 12 vertical slice.
2. The runtime style is deterministic shell + AI interpretation core + AI counseling core.
3. The AI may propose interpretation, response, recommendations, memory outputs, and handoff summaries.
4. The platform owns fast boundary scanning, interpretation validation, boundary resolution, skill selection, validation, commit, and audit.
5. The per-turn runtime uses two checkpoints: pre-generation control and pre-commit validation.
6. Phase 4 interpretation is placed inside Checkpoint 1 before boundary resolution and skill selection.
7. FastBoundarySignalScanner runs before AI interpretation.
8. AIInterpretationClient output is not trusted until InterpretationValidator accepts it.
9. BoundaryResolver remains final authority over zone and handoff status.
10. OperatingContextManager owns route-based profile completeness and minimum profile route.
11. `minimum_complete` means route-ready, not high-quality recommendation-ready.
12. Ranking/budget/location are not universal minimum-profile runtime gates.
13. Route context must influence skill selection when skill metadata declares route applicability.
14. SkillControlService must reject route-incompatible skills.
15. `SKILL.md` retrieval and selection are platform-owned.
16. The AI may propose the counseling action but not the final skill package.
17. Boundary rules are loaded deterministically.
18. The platform resolver chooses the safer zone when uncertain.
19. Yellow ambiguity gets one targeted clarification.
20. Red-zone triggers override normal skill behavior.
21. Every AI counseling turn returns a student-facing response plus typed structured execution result.
22. The structured result is a proposal, not truth.
23. Validation-specific failure handling is used.
24. Clear official-action or red-zone violations are overridden immediately.
25. KnowledgeGateway may consume accepted knowledge need signals.
26. ValidationPipeline must check AIExecutionResult consistency with AcceptedInterpretation.
27. AcceptedInterpretation does not directly commit durable memory, recommendation records, handoff records, CRM truth, or official status.
28. The prototype runtime is a plain structured pipeline.
29. The modules should be clean and node-like for possible LangGraph migration later.
30. Deep Agents is not the main prototype runtime.
31. The runtime module topology uses medium-grained services.
32. The minimal runtime contracts are TurnInput, FastBoundaryScanResult, AcceptedInterpretationRef, BoundaryResult, OperatingContext, SkillSelectionResult, ExecutionContext, AIExecutionResult, ValidationResult, CommitResult, and AuditEvent.
33. Official-action outputs are never commit-eligible in the prototype.
34. No validated output means no commit.
35. Student posture is advisory runtime context, not a journey state or official truth.
36. Counselor response mode is platform-accepted context used to shape response behavior.
37. BoundaryResult can override counselor response mode.
38. Reflect → Guide → Ask is guidance for safe autonomous counseling, not a replacement for validation.
39. Decision-support modes are runtime guidance for stuck/comparison turns, not durable memory by themselves.
40. S6 milestone confirmation must clarify that confirmed counseling preference is not official application or registration.
41. Soft summary checkpoints may be required before recommendation or confirmation when context is complex or high-impact.

---

## 27. Open Questions Deferred to Later Phases

The following questions are intentionally deferred.

### Phase 5 — Student Memory & Counseling State

1. What is the final durable student memory schema?
2. How are current truth and historical preferences represented?
3. How are memory corrections and direction changes stored?
4. How are memory confidence, evidence, visibility, and source linked?
5. Which student posture or decision blocker signals should become durable memory, if any?
6. How should repeated indecision history be preserved without labeling the student negatively?

### Phase 6 — Business Knowledge & Source Governance

1. What exact source priority rules should the Knowledge Gateway enforce?
2. How should public university data, Google Sheets, and Google Drive be integrated?
3. How should freshness and conflicting facts be scored?
4. How should internal-only knowledge influence routing without leaking?

### Phase 7 — Recommendation & Decision Support Automation

1. What scoring model generates recommendations?
2. What fields define a durable recommendation record?
3. How should recommendation lifecycle and student reaction tracking work?
4. How should recommendation quality be evaluated?

### Phase 8 — Registration Boundary & Human Handoff

1. What exact fields belong in the handoff package?
2. How should human counselor routing work?
3. How should sensitive or complex-case handoff differ from ready-to-register handoff?
4. What is the post-handoff student experience?
5. What exact handoff package should be prepared after S6 confirmed counseling preference when the student moves to official application/register intent?

### Phase 9 — CRM Integration Model

1. What CRM context can the runtime read?
2. What CRM writebacks may be allowed later?
3. What approval workflow is needed before CRM mutation?
4. How is CRM truth separated from counseling memory?

### Phase 10 — Guardrails, Policy & Boundary Enforcement

1. How does the broader policy engine relate to SKILL.md boundary rules?
2. What guardrails run pre-response, post-response, and post-turn?
3. How should red-zone miss risk be scored?
4. How should guardrail policy updates be released?

### Phase 11 — Evaluation, Simulation & Quality Monitoring

1. What scenario suites prove red-zone recall?
2. What metrics should be monitored in production?
3. How should human review sampling work?
4. How should regression tests run before skill, knowledge, or policy changes?

### Phase 12 — Admin, Knowledge & Skill Operations

1. How do counselors maintain SKILL.md packages operationally?
2. How are approved runtime skill indexes published?
3. How are bad skill updates rolled back?
4. What quality dashboard do business users need?

### Phase 14 — Production Hardening

1. Should the runtime migrate to LangGraph?
2. What production observability, tracing, latency, retry, and deployment strategy is needed?
3. How should model routing and cost controls work?
4. How should production incidents and red-zone misses be handled?

---

## 28. Relationship to Later Phases

### Phase 4 — Interpretation & Extraction Layer

Phase 4 provides the `AcceptedInterpretation` artifact consumed by Phase 3. In v1.2, Phase 4 may later add `StudentPostureSignal`, but Phase 3 should treat posture as advisory runtime context unless validated and accepted.

### Phase 5 — Student Memory & Counseling State

Phase 5 should decide how validated semantic signals, accepted operating context, decision blockers, posture-like signals, preference history, and correction history become durable memory.

Student posture should not automatically become permanent memory. Durable storage should focus on useful counseling context such as repeated decision blockers, hard constraints, confirmed counseling preferences, deferrals, and corrections.

### Phase 6 — Business Knowledge & Source Governance

Phase 6 should expand the prototype KnowledgeGateway into governed source access, answerability, freshness, visibility, and conflict handling.

### Phase 7 — Recommendation & Decision Support Automation

Phase 7 should formalize recommendation generation, validation, persistence, confidence, and lifecycle. It should also decide how Phase 3 decision-support modes influence recommendation and comparison behavior.

### Phase 8 — Registration Boundary & Human Handoff

Phase 8 should convert prototype handoff output into operational handoff package, routing, counselor-facing summary, and post-handoff behavior.

It should also define the official package produced when a student moves from S6 confirmed counseling preference to L5 ready-to-apply/register intent.

### Phase 9 — CRM Integration Model

Phase 9 should define CRM read/write boundaries while preserving CRM as operational source of truth.

### Phase 10 — Guardrails, Policy & Boundary Enforcement

Phase 10 should define the broader guardrail and policy system that complements Phase 2 boundary rules and Phase 3 validation.

### Phase 11 — Evaluation, Simulation & Quality Monitoring

Phase 11 should expand Phase 3 audit events and evaluation labels into scenario suites, regression tests, monitoring, dashboards, and counselor-like conversation quality evaluation.

### Phase 12 — Admin, Knowledge & Skill Operations

Phase 12 should define how business users maintain SKILL.md packages, knowledge, policy, quality controls, and counselor-like skill guidance.

### Phase 13 — Prototype Implementation

Phase 13 should implement this Phase 3 runtime strategy as part of the bounded autonomous counseling vertical slice.

### Phase 14 — Production Hardening

Phase 14 should harden the runtime for production scale, reliability, observability, rollout, cost control, and incident response.

---

### 28.1 Updated Relationship After v1.1

Phase 3 v1.1 depends on:

1. Phase 1 v1.1 for route-based minimum profile semantics
2. Phase 2 v1.1 for route-aware skill metadata and skill selection constraints
3. Phase 4 v1.1 for `AcceptedInterpretation`, signal validation, and interpretation evidence

Later phases should consume the Phase 3 v1.1 runtime outputs rather than raw transcript:

```text
AcceptedInterpretation
+ accepted OperatingContext
+ route-aware SkillSelectionResult
+ validated AIExecutionResult
+ blocked outputs
+ AuditEvent
```

Phase 5 durable memory should persist validated semantic and runtime artifacts, not uncontrolled summaries.

### 28.2 Updated Relationship After v1.2

Phase 3 v1.2 now also depends on:

1. Phase 1 v1.2 for counselor-like navigation behavior, student posture concept, decision-support micro-loops, soft summary checkpoints, and S6 milestone behavior
2. Phase 2 v1.2 for counselor-like SKILL.md response patterns, posture-aware guidance, decision-support guidance, and preference-confirmation milestone guidance

Later phases should consume these additional runtime artifacts when useful:

```text
studentPosture
counselorResponseMode
decisionSupportMode
summaryCheckpointStatus
milestoneConfirmationStatus
counselorFlow audit labels
```

These artifacts should remain advisory unless a later phase explicitly promotes them into durable memory, evaluation labels, or handoff package fields.

## 29. Final Phase 3 Policy Statement

```text
Phase 3 defines a prototype-first autonomous runtime strategy for the AI-first
bounded counseling platform.

The runtime uses a deterministic shell with an AI interpretation core and an AI counseling core.

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

Phase 3 v1.2 also carries counselor-like flow context, including student posture,
counselor response mode, decision-support mode, soft-summary requirements, and
milestone-confirmation requirements. These guide response behavior but do not
override boundary rules, skill metadata, validation, or official-action blocking.

Official-action outputs are never commit-eligible. Red-zone triggers override
normal counseling behavior and prepare human handoff.

Every turn produces structured audit evidence and lightweight evaluation labels
so the Phase 12 prototype can prove bounded autonomy, skill control, boundary
safety, output validation, and handoff behavior.
```

---

## 30. One-Sentence Summary

```text
Phase 3 v1.2 keeps the prototype-first deterministic shell with AI interpretation and AI counseling cores,
while adding runtime support for counselor-like response mode, student posture,
decision-support framing, soft summary checkpoints, and confirmed-preference
milestone validation without weakening boundary, skill, validation, or commit control.
```
