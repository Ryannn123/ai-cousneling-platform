# Phase 2 — Counseling SOP & Skill Control Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 2 — Counseling SOP & Skill Control  
**Version:** 1.3  
**Date:** 2026-07-04  
**Status:** Updated specification, amended for Route Episode redesign  
**Source Context:** Phase 0 Bounded Autonomy Baseline v1.0, Phase 1 Autonomous Counseling Operating Model v1.3, Phase 2 Counseling SOP & Skill Control v1.2, Phase 3 Autonomous Runtime Strategy v1.3, Phase 4 Interpretation & Extraction Layer v1.3, Phase 5 Student Memory & Counseling State v1.1, Roadmap v7.4, Prototype Runtime Checkpoint, Route Episode Redesign Exploration Roadmap v0.1, and Route Episode Redesign Decision Summary v1.0.

---

## 1. Purpose

This specification defines the **Phase 2 counseling SOP and skill control model** for the AI-first bounded autonomous counseling platform.

It answers the Phase 2 core question:

```text
How do we turn the Phase 1 operating model into governed SOPs and skills
that business users can approve, maintain, test, and safely release?
```

Phase 2 converts the approved counseling operating model into runtime-consumable behavior-control artifacts.

The platform uses counselor-owned `SKILL.md` packages to guide the AI counselor while preserving platform-owned control over:

1. boundary handling
2. official-action blocking
3. route planning
4. route transition validation
5. route outcome validation
6. memory commit eligibility
7. response validation
8. auditability

Version 1.3 updates Phase 2 for the approved **Route Episode** redesign.

The previous operating assumption was:

```text
Minimum profile reached
→ derive route from known/missing fields
→ use global journey state
→ select route-aware skill
```

The revised operating assumption is:

```text
CurrentTruthProjection
→ ActiveRouteEpisode
→ RouteProgressState
→ Primary Counseling Action
→ Counselor Response Mode
→ SKILL.md selection
→ AI counseling response
→ platform validation and commit
```

Core Phase 2 v1.3 principle:

```text
SKILL.md guides route-appropriate counseling behavior.
Platform validators own route correctness, memory safety, and boundary safety.
```

---

## 1.1 Version History Summary

### Version 1.1 — Route-Based Minimum Counseling Profile Alignment

Version 1.1 updated the skill-control system to align with the route-based minimum counseling profile:

```text
1. academic result status
2. course direction status
3. university direction status
```

This replaced the older assumption that minimum profile collection universally required early university-fit details such as ranking/prestige preference, budget/value preference, and preferred location.

### Version 1.2 — Counselor-Like Flow Behavior

Version 1.2 added counselor-like behavior guidance to `SKILL.md` packages.

Locked principle:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

It added support for:

1. student posture guidance
2. decision-support micro-loops
3. soft summary checkpoints
4. milestone behavior for confirmed counseling preference
5. response patterns that avoid mechanical intake

### Version 1.3 — Route Episode Skill Alignment

Version 1.3 updates skill control for the new Route Episode operating model.

Key changes:

1. Replace `applies_to_minimum_profile_routes` with `applies_to_active_routes`.
2. Replace global S1–S9 skill matching as the primary route model with `ActiveRouteEpisode + RouteProgressState` matching.
3. Keep route compatibility metadata for selection and prompt composition.
4. Remove skill metadata as the final memory authorization layer.
5. Remove repeated `allowed_memory_outputs` and `forbidden_memory_outputs` as enforceable skill metadata.
6. Do not add `can_support_route_outcomes` to skill metadata.
7. Do not add `route_exit_rules` or `route_loop_controls` to skill metadata.
8. Do not make SKILL.md a hidden route state machine.
9. Move memory commit eligibility to `MemoryStateService` and `MemoryEventValidator`.
10. Move route outcome validity to `RouteOutcomeValidator`.
11. Move route transition validity to `RouteTransitionValidator`.
12. Move loop policy to `RouteEpisodePlanner` / `DecisionSupportPolicy`.
13. Move official-action blocking to `BoundaryResolver`, `ValidationPipeline`, and `MemoryEventValidator`.
14. Keep SKILL.md as counselor-readable guidance plus lightweight metadata for selection, response shaping, and audit.

---

## 2. Scope

Phase 2 v1.3 defines:

1. the SOP/skill control philosophy
2. the layered playbook / runtime skill / boundary rule model
3. standard `SKILL.md` package structure
4. updated counseling-specific metadata profile
5. active-route skill compatibility metadata
6. route-progress skill compatibility metadata
7. action, zone, posture, and response-mode metadata
8. simplified metadata ownership after Route Episode redesign
9. skill body guidance for route-episode counseling
10. playbook guidance for route sequences and counseling patterns
11. boundary rule package guidance
12. initial skill catalog update
13. skill retrieval and deterministic selection model
14. skill precedence and conflict resolution
15. hybrid enforcement model
16. per-turn skill execution flow
17. runtime skill execution contract
18. validation and failure behavior
19. audit event requirements
20. Phase 4 semantic delta consumption implications
21. Phase 5 memory/current-truth consumption implications
22. Phase 2 evaluation strategy
23. decisions locked by Phase 2 v1.3
24. open questions deferred to later phases

---

## 3. Non-Goals

Phase 2 v1.3 does **not** define:

1. final autonomous runtime architecture
2. final LangGraph or orchestration implementation
3. durable student memory database schema
4. memory event commit policy
5. route episode planning algorithm
6. route transition validation algorithm
7. route outcome validation algorithm
8. business knowledge gateway implementation
9. recommendation engine scoring
10. CRM integration model
11. full guardrail engine implementation
12. SOP authoring UI
13. SOP approval workflow inside the application
14. counselor operations dashboard
15. production monitoring and rollout process
16. final physical skill repository implementation
17. final production evaluation dashboard
18. official application, registration, payment, enrollment, seat, or CRM workflows

Important Phase 2 boundary:

```text
The application consumes approved SOP/skill packages.
It does not need to manage SOP creation, approval, or maintenance internally
in the first design.
```

---

## 4. Inheritance From Approved Phases

---

## 4.1 Phase 0 Inheritance — Bounded Autonomy

Phase 2 inherits the Phase 0 bounded autonomy baseline.

```text
Autonomy by default.
Conservative at boundaries.
```

The AI counselor is the primary student-facing counselor for ordinary pre-registration counseling.

Humans remain responsible for:

1. application, registration, enrollment, payment, or seat-reservation actions
2. official CRM/application/registration state changes
3. high-risk or sensitive actions
4. complex or exception-based cases
5. student-requested human support
6. scenarios outside approved SOP/skill coverage

Central boundary:

```text
Counseling decision does not equal official action.
```

A skill may guide the AI to support counseling decisions. A skill must never authorize official business action.

---

## 4.2 Phase 1 v1.3 Inheritance — Route Episode Operating Model

Phase 2 v1.3 converts the Phase 1 v1.3 Route Episode operating model into skill guidance.

The primary conceptual model is:

```text
ActiveRouteEpisode + RouteProgressState + RouteOutcome
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

### 4.2.1 Route Types

Phase 2 skills must be compatible with the approved v1 route types:

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

### 4.2.2 Progress States

Phase 2 skills must be compatible with reusable route progress states:

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

### 4.2.3 Deprecated Primary State Model

The old S1–S9 global journey states are deprecated as the primary runtime model.

They may remain as migration references, but skill metadata should not treat them as the main route control layer.

### 4.2.4 Minimum Profile Reclassification

`minimum_profile_route` is no longer the primary routing abstraction.

The route-oriented fields remain important as current-truth inputs:

```text
academic result status
course direction status
university direction status
pathway direction status
recommendation readiness
preference strength
```

But skills should align to:

```text
activeRouteEpisode.routeType
activeRouteEpisode.progressState
primaryCounselingAction
counselorResponseMode
```

### 4.2.5 Route Completion Rules

Phase 2 skills must respect these route completion boundaries:

```text
L3 expressed preference does not complete a route.
Shortlist-only does not complete a route.
Recommendation-presented-only does not complete a route.
Collected budget/location/ranking signals do not complete a route.
```

These rules should appear in relevant skill bodies as counselor guidance, but they are enforced by platform validators, not by skill metadata.

---

## 4.3 Phase 3 v1.3 Inheritance — Runtime Strategy

Phase 2 v1.3 is consumed by the Phase 3 v1.3 runtime.

The relevant runtime chain is:

```text
CurrentTruthProjection
→ RouteEpisodeCandidateResolver
→ BoundaryResolver
→ RouteEpisodePlanner
→ OperatingContextManager
→ SkillControlService
→ ExecutionContextComposer
→ AIExecutionClient
→ ValidationPipeline
→ MemoryStateService / AuditEventStore
```

Phase 2 should assume:

1. `RouteEpisodePlanner` owns active route episode.
2. `OperatingContextManager` accepts active route context.
3. `SkillControlService` selects the primary runtime skill.
4. `ExecutionContextComposer` includes selected skill body and relevant boundary rules.
5. `ValidationPipeline` enforces response correctness.
6. `MemoryStateService` owns memory commit eligibility.

Skill packages should therefore not attempt to become routing, memory, or validation engines.

---

## 4.4 Phase 4 v1.3 Inheritance — Semantic Delta Contract

Phase 2 skills may consume validated semantic context from:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

A skill may refer to accepted semantic artifacts such as:

1. accepted course direction deltas
2. accepted university direction deltas
3. accepted pathway direction deltas
4. accepted quality-enhancing deltas
5. accepted runtime-only posture signals
6. accepted runtime-only knowledge need signals
7. accepted runtime-only ambiguity signals
8. accepted runtime-only boundary signals

But a skill must not consume raw LLM extraction as truth.

```text
Skills consume accepted semantic context.
Skills do not validate semantic truth.
```

---

## 4.5 Phase 5 v1.1 Inheritance — Memory and Current Truth

Phase 2 v1.3 consumes memory-derived context through `CurrentTruthProjection`.

Phase 5 owns:

1. memory ingestion policy
2. memory event validation
3. durable memory event creation
4. current truth derivation
5. route outcome memory
6. official-truth rejection
7. memory/audit separation

Phase 2 v1.3 therefore updates the older assumption that skill metadata directly authorizes memory writes.

Revised ownership:

```text
SKILL.md metadata guides behavior and selection.
MemoryStateService and MemoryEventValidator own memory commit eligibility.
RouteOutcomeValidator owns route outcome validity.
BoundaryResolver and ValidationPipeline own official-action blocking.
```

Skill metadata may still be copied into audit/memory source fields for traceability:

1. skill name
2. skill version
3. skill content hash
4. selected skill reason
5. selected artifact type

But this is traceability, not authorization.

---

## 5. Core Phase 2 v1.3 Design Direction

Phase 2 v1.3 uses the following design stance:

```text
Counselor-owned guidance.
Runtime-enforced boundaries.
Moderately guided AI behavior.
Lightweight metadata for selection, response shaping, and audit.
Platform validators for safety, route correctness, and memory commit.
```

The skill system should optimize for:

1. consistent counseling quality
2. counselor-like pacing
3. route-appropriate guidance
4. maintainability by counseling/business operators
5. safe behavior at red/yellow boundaries
6. runtime auditability

The skill system should avoid becoming:

1. a hidden route state machine
2. a memory authorization system
3. a route completion policy engine
4. a loop-risk threshold engine
5. a duplicate boundary rule engine
6. a substitute for validators

---

## 6. SOP/Skill Ownership

SOPs and skills should be primarily maintained by counselors or counseling/business operators.

Reason:

```text
Counselors own the actual counseling process, student judgment, tone, pacing,
examples, and business expectations.
```

Application engineering owns:

1. skill package loading
2. metadata validation
3. runtime selection
4. execution context composition
5. validator enforcement
6. audit emission
7. rollback and version control hooks

Counselors/business operators own:

1. skill wording
2. allowed and forbidden counseling behavior
3. examples
4. route-specific guidance
5. posture-specific guidance
6. handoff wording
7. escalation examples
8. evaluation scenarios

---

## 7. AI Freedom Inside Skills

The AI should be:

```text
moderately guided and mostly principle-based
```

The AI should not be rigidly scripted.

However, it must respect:

1. selected active route
2. selected progress state
3. primary counseling action
4. counselor response mode
5. boundary rules
6. official-action boundaries
7. preference confirmation rules
8. recommendation readiness
9. knowledge answerability constraints
10. response validation

Skills should guide the AI to sound like a counselor, not like a form, router, or script reader.

Default response principle:

```text
Reflect → Guide → Ask
```

Meaning:

```text
Reflect:
  Acknowledge what the student said or where they are in the decision.

Guide:
  Explain the current route, trade-off, recommendation basis, or decision point.

Ask:
  Ask only one purposeful next question, or offer one safe next step.
```

---

## 8. Layered SOP/Skill Model

Phase 2 uses three artifact layers:

```text
1. Playbooks
2. Runtime Skills
3. Boundary Rules
```

---

## 8.1 Playbooks

Playbooks are broad counselor-friendly scenario guides.

In v1.3, playbooks should normally map to **route sequences** or broader counseling patterns, not a single active route only.

Examples:

1. lost student to course exploration
2. course-first student to university exploration
3. university-first student to course exploration within university context
4. pathway uncertainty to pathway exploration
5. recommendation to comparison to confirmation
6. detour-heavy counseling with resume
7. indecision and deferral recovery
8. confirmed counseling preference to handoff-safe next step

Playbooks guide broader flow, but they do not authorize route transitions, memory commits, or official action.

---

## 8.2 Runtime Skills

Runtime skills are smaller executable behavior packages selected per turn.

They usually correspond to one primary counseling action and one response mode.

Examples:

1. initial route orientation
2. course/program exploration
3. university exploration
4. course exploration within university context
5. pathway exploration
6. combined option validation
7. factual detour answering
8. directional recommendation
9. high-quality recommendation
10. shortlist comparison
11. preference confirmation
12. deferral and indecision support
13. counseling deadlock recovery
14. resume recovery
15. ready-to-register handoff

Runtime skills guide the current AI response.

They do not own final route state, route outcome, or durable memory authorization.

---

## 8.3 Boundary Rules

Boundary rules are mandatory cross-cutting controls.

They override normal skills when safety, official-action, business, sensitive, or human-support boundaries appear.

Examples:

1. no official action
2. ready-to-register detection
3. payment / seat / enrollment boundary
4. sensitive context routing
5. complex eligibility / exception handoff
6. human-requested handoff
7. ambiguous proceed clarification
8. preference-promotion boundary
9. internal-only knowledge boundary

Boundary rules are not optional search results. They are deterministically loaded according to policy and risk context.

---

## 8.4 Layering Principle

```text
Playbooks guide broad counselor judgment.
Runtime skills guide the current turn.
Boundary rules override everything when needed.
Platform validators enforce the final trust boundary.
```

---

## 9. Standard `SKILL.md` Package Format

Phase 2 uses standard `SKILL.md`-style packages as the primary SOP/skill artifact format.

Each skill package is a folder containing a `SKILL.md` file and optional supporting files.

Recommended package structure:

```text
skill-name/
  SKILL.md
  examples.md
  evaluation-scenarios.md
  references/
```

### 9.1 Why `SKILL.md`

`SKILL.md` is appropriate because:

1. it is counselor-readable
2. it is Markdown-based
3. it can include structured frontmatter
4. it can include human guidance, examples, and references
5. it can be stored outside the application
6. it can be indexed and fetched by the runtime
7. it supports business maintainability without requiring a full SOP management UI

### 9.2 Counseling Extension

A vanilla `SKILL.md` is not enough for bounded autonomous counseling.

Phase 2 extends it with a counseling-specific metadata profile:

```text
Standard SKILL.md package
+ YAML frontmatter for runtime metadata
+ Markdown body for counselor-readable guidance
```

In v1.3, metadata is intentionally lighter than v1.2.

```text
Metadata selects and shapes behavior.
Validators authorize and commit.
```

---

## 10. Counseling `SKILL.md` Metadata Profile v1.3

Phase 2 v1.3 uses a tiered metadata profile.

All artifacts share base metadata. Playbooks, runtime skills, and boundary rules add artifact-specific metadata.

---

## 10.1 Base Metadata — Required for All Artifacts

```yaml
---
name: string
description: string
version: string
artifact_type: playbook | runtime_skill | boundary_rule
status: draft | approved | deprecated
owner: counseling_team
---
```

### Field Meaning

| Field | Meaning |
|---|---|
| `name` | Stable artifact name used by runtime and audit. |
| `description` | Natural-language retrieval description. |
| `version` | Artifact version. |
| `artifact_type` | Playbook, runtime skill, or boundary rule. |
| `status` | Only approved artifacts may be loaded at runtime. |
| `owner` | Owning business/counseling team. |

---

## 10.2 Playbook Metadata

Playbooks should map to route sequences or broad counseling patterns.

```yaml
---
artifact_type: playbook

applies_to_route_sequences:
  - course_exploration -> university_exploration -> combined_option_validation
  - university_exploration -> course_exploration_within_university_context -> combined_option_validation
  - pathway_exploration -> course_exploration -> university_exploration

applies_to_student_postures:
  - lost_or_confused
  - course_first
  - university_first
  - comparison_oriented
  - indecisive

primary_goal:
  - exploration
  - recommendation
  - comparison
  - decision_support
  - recovery
  - handoff

related_runtime_skills:
  - course-program-exploration
  - university-exploration
  - shortlist-comparison
---
```

### Playbook Metadata Purpose

Playbook metadata helps the runtime attach broad counselor guidance when the student appears to be following a common counseling pattern.

Playbooks should not:

1. grant permission to perform official action
2. authorize memory commits
3. complete routes
4. override boundary rules
5. override runtime skill metadata
6. override platform validators

---

## 10.3 Runtime Skill Metadata

Runtime skills map primarily to active route, progress state, action, zone, posture, and response mode.

Recommended v1.3 runtime skill metadata:

```yaml
---
artifact_type: runtime_skill

route_episode:
  applies_to_active_routes:
    - course_exploration
    - university_exploration
    - pathway_exploration
    - combined_option_validation

  applies_to_progress_states:
    - exploration
    - recommendation_ready
    - recommendation_presented
    - comparison
    - decision_support

applies_to_actions:
  - explore_interest
  - explain_option
  - recommend
  - compare_shortlist
  - confirm_counseling_preference
  - support_deferral
  - prepare_handoff

applies_to_zones:
  - green
  - yellow

applies_to_recommendation_readiness:
  - R1
  - R2
  - R3

applies_to_preference_levels:
  - L1
  - L2
  - L3
  - L4

student_postures_supported:
  - lost_or_confused
  - course_first
  - university_first
  - pathway_first
  - comparison_oriented
  - validation_seeking
  - indecisive

counselor_response_modes:
  - standard
  - reassuring_orientation
  - route_explanation
  - decision_support
  - summary_checkpoint
  - milestone_confirmation

counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question

contextual_boundary_rules:
  - preference_promotion_boundary
  - ambiguous_proceed_clarification

uses_semantic_context:
  - current_truth_projection
  - accepted_semantic_delta
  - active_route_episode
  - boundary_result
  - knowledge_gateway_result

audit_output_intent:
  - comparison_guidance
  - recommendation_explanation
  - confirmation_prompt
---
```

### Runtime Skill Metadata Purpose

Runtime metadata allows the application to:

1. retrieve the skill
2. filter it by active route
3. filter it by progress state
4. filter it by counseling action
5. filter it by boundary zone
6. prefer posture-appropriate guidance
7. prefer response-mode-appropriate guidance
8. load contextual boundary rule hints
9. compose the execution context
10. emit skill selection audit records

Runtime metadata should **not** be used as the final authority for:

1. memory commit eligibility
2. route outcome validity
3. route transition validity
4. route exit policy
5. loop-risk thresholds
6. global official-action blocking
7. durable current-truth projection

---

## 10.4 Boundary Rule Metadata

Boundary rules map to Phase 0/1 handoff triggers and forbidden official actions.

Recommended v1.3 boundary rule metadata:

```yaml
---
artifact_type: boundary_rule

trigger_type:
  - ready_to_apply_or_register
  - official_action_request
  - payment_or_seat_commitment
  - exception_or_appeal
  - sensitive_context
  - human_support_request

severity: red

override_normal_skill: true

blocks_official_actions:
  - submit_application
  - register_student
  - reserve_seat
  - take_payment
  - update_crm_status
  - confirm_enrollment

required_runtime_behavior:
  - stop_normal_counseling
  - explain_boundary
  - prepare_handoff
  - do_not_claim_official_completion

allowed_response_modes:
  - handoff_safe
  - clarify_once

audit_events:
  - boundary_detected
  - normal_skill_overridden
  - handoff_required
---
```

### Boundary Rule Metadata Purpose

Boundary metadata allows the platform to hard-block forbidden behavior and override normal counseling skills.

Boundary rule metadata may describe blocked official actions, but memory commit still belongs to `MemoryStateService` and `MemoryEventValidator`.

---

## 10.5 Removed or Deprecated Metadata

Phase 2 v1.3 deprecates several v1.2 metadata fields as enforceable skill controls.

### 10.5.1 `applies_to_minimum_profile_routes`

Deprecated as primary route metadata.

Replace with:

```yaml
route_episode:
  applies_to_active_routes:
    - course_exploration
  applies_to_progress_states:
    - exploration
```

Migration behavior:

```text
applies_to_minimum_profile_routes may remain as a temporary compatibility hint,
but runtime should prefer applies_to_active_routes.
```

### 10.5.2 `allowed_memory_outputs`

Deprecated as enforceable metadata.

Reason:

```text
Memory commit eligibility belongs to MemoryStateService and MemoryEventValidator,
not skill metadata.
```

The field may exist temporarily in old skill packages for audit comparison, but the runtime should not treat it as final authorization.

### 10.5.3 `forbidden_memory_outputs`

Deprecated as repeated skill metadata.

Reason:

```text
Official-action rejection belongs to BoundaryResolver, ValidationPipeline,
and MemoryEventValidator.
```

Do not repeat application/payment/seat/CRM forbidden outputs in every runtime skill.

### 10.5.4 `can_support_route_outcomes`

Do not add this field.

Reason:

```text
Almost every counseling skill can indirectly support many route outcomes.
The field is too broad and not useful for enforcement.
```

### 10.5.5 `can_produce_route_outcomes`

Do not add this as standard skill metadata in v1.3.

Reason:

```text
Route outcome validity belongs to RouteOutcomeValidator.
Skill body may guide confirmation or deferral behavior, but final route outcome
proposal and acceptance are platform-validated runtime outputs.
```

If a later implementation needs a structured output contract per skill, that should be defined in Phase 3/validation contracts, not as general counselor-authored route policy.

### 10.5.6 `route_exit_rules`

Do not add to skill metadata.

Reason:

```text
Route exit policy belongs to RouteTransitionPolicy and RouteOutcomeValidator.
```

### 10.5.7 `route_loop_controls`

Do not add to skill metadata.

Reason:

```text
Loop risk is cross-turn runtime behavior.
It belongs to RouteEpisodePlanner / DecisionSupportPolicy.
```

### 10.5.8 `confirmation_required_when`

Deprecate as final policy metadata.

Replacement:

```yaml
confirmation_behavior:
  may_request_confirmation: true
  confirmation_targets:
    - counseling_preference
```

Final confirmation requirements belong to `PreferencePromotionPolicy`, `RouteOutcomeValidator`, and `ValidationPipeline`.

---

## 10.6 Required vs Optional Metadata

### Required for All Artifacts

```text
name
description
version
artifact_type
status
owner
```

### Required for Runtime Skills

```text
route_episode.applies_to_active_routes
route_episode.applies_to_progress_states
applies_to_actions
applies_to_zones
counselor_response_pattern
```

### Recommended for Runtime Skills

```text
applies_to_recommendation_readiness
applies_to_preference_levels
student_postures_supported
counselor_response_modes
contextual_boundary_rules
uses_semantic_context
audit_output_intent
confirmation_behavior
```

### Required for Boundary Rules

```text
trigger_type
severity
override_normal_skill
blocks_official_actions
required_runtime_behavior
```

### Optional for Playbooks

```text
applies_to_route_sequences
applies_to_student_postures
primary_goal
related_runtime_skills
```

### Runtime Loading Rule

```text
The runtime should only consume approved SKILL.md packages that satisfy the
metadata profile required for their artifact type.
```

Malformed, unapproved, or metadata-incomplete skills must not be loaded.

---

## 11. Standard `SKILL.md` Body Template

Each counseling `SKILL.md` body should use the following Markdown structure:

```markdown
# Skill Name

## Purpose

What this skill helps the AI counselor do.

## When to Use

Student signals, active route episodes, progress states, or counseling situations where this skill applies.

## Active Route Context

Which active routes and progress states this skill is designed for.

## Counseling Goal

The intended student-facing counseling outcome for the turn.

## Allowed Behavior

What the AI may do.

## Forbidden Behavior

What the AI must not do.

## Zone Behavior

How behavior changes in Green, Yellow, and Red situations.

## Route Episode Guidance

How this skill should behave inside the active route.

Clarify that the skill does not complete the route by itself.

## Confirmation Guidance

When the AI may ask for confirmation and how to avoid over-promotion.

## Handoff Guidance

When the AI must stop normal counseling and prepare human handoff.

## Counselor-Like Response Pattern

How this skill applies Reflect → Guide → Ask.

## Student Posture Guidance

How the skill should adapt when the student is lost, course-first, university-first,
comparison-oriented, validation-seeking, indecisive, or constraint-driven.

## Examples

Good and bad examples.

## Audit Notes

What should be explainable after this skill runs.
```

### Body Interpretation Rule

```text
The Markdown body guides the AI's counseling behavior.
The YAML metadata guides selection and prompt composition.
Platform validators enforce safety, route correctness, and memory correctness.
```

If the Markdown body conflicts with metadata, metadata wins.

If metadata conflicts with boundary rules or platform validators, platform validators win.

---

## 12. Shared Counselor-Like Response Pattern

Unless a boundary rule overrides normal counseling, runtime skills should prefer:

```text
1. Reflect the student's situation.
2. Explain the current counseling route, trade-off, or decision point.
3. Give useful guidance.
4. Ask one purposeful next question or offer one safe next step.
```

Avoid:

1. mechanical intake
2. long questionnaires
3. unexplained fit questions
4. premature confirmation
5. pressure to decide
6. forcing ranking, budget, or location before the route requires those signals
7. repeating the same question after the student already answered it
8. treating a soft preference as a confirmed counseling preference
9. treating confirmed counseling preference as official action
10. claiming a route is complete before platform validation

---

## 13. Route Episode Guidance for Skill Bodies

Runtime skill bodies should include route-aware counseling guidance without becoming route policy engines.

Recommended shared route guidance:

```text
You are operating inside the active route episode provided by the platform.
Do not change the route yourself.
Do not claim the route is complete unless the platform has accepted that outcome.
Help the student make progress inside the current route.
Respect detour/resume context.
Boundary and handoff instructions override normal route behavior.
```

### 13.1 Course Exploration Skill Guidance

Course exploration skills should help the student resolve course/program direction.

They may:

1. explore interests, strengths, disliked subjects, and career direction
2. explain course differences
3. compare course options
4. narrow options
5. recommend broad course directions when ready
6. ask confirmation when appropriate

They must not:

1. treat weak interest as completion
2. treat L3 expressed preference as completion
3. force university-fit questions too early
4. switch to university route because of a casual university mention
5. imply course choice equals application or registration

### 13.2 University Exploration Skill Guidance

University exploration skills should help the student resolve university direction.

They may use:

1. budget/value preference
2. ranking/prestige preference
3. location preference
4. campus preference
5. intake/timeline
6. family constraints
7. course/pathway direction

They must not:

1. treat budget/location collection as route completion
2. treat university shortlist as confirmed university preference
3. claim admission, eligibility approval, registration, or seat reservation

### 13.3 Course Exploration Within University Context Guidance

This skill applies when the student has a university direction but no course direction.

It should:

1. use the university context to frame available/suitable course options
2. avoid assuming the university is final unless confirmed
3. help the student resolve course direction inside that context
4. prepare for combined option validation only when appropriate

### 13.4 Pathway Exploration Guidance

Pathway exploration skills should help with foundation, diploma, degree, transfer, or entry pathway decisions.

They must not:

1. promise eligibility approval
2. approve exceptions
3. resolve complex or unclear eligibility independently
4. convert pathway choice into official application/registration

### 13.5 Combined Option Validation Guidance

Combined option validation skills should help validate course + university + pathway fit.

They should:

1. summarize known directions
2. validate fit against academic/result context and constraints
3. surface assumptions and uncertainty
4. ask confirmation if the student appears ready
5. keep the outcome counseling-only

They must not:

1. treat validation as official application
2. imply seat, admission, registration, or eligibility approval
3. skip handoff when the student asks to apply/register/pay

### 13.6 Detour and Resume Guidance

Factual detour skills should:

1. answer the factual question if knowledge gateway supports it
2. caveat uncertainty when needed
3. avoid changing route unless boundary or switch evidence exists
4. resume the previous route with a natural bridge

Example:

```text
That answers the fee question at a high level. Coming back to your course choice,
you were comparing Psychology and Business — the next useful step is...
```

---

## 14. Soft Summary, Decision Support, and Confirmation Patterns

### 14.1 Soft Summary Checkpoint

Use before important recommendation, comparison, or confirmation.

Recommended structure:

```text
Let me summarize first:
- academic/result context
- course direction
- university direction
- important constraints or fit signals
- what is still unknown

Based on that, the next useful step is...
```

The summary should be short and should not become an uncontrolled memory summary.

### 14.2 Decision-Support Micro-Loops

When the student is overwhelmed, indecisive, comparison-heavy, or repeatedly asks for "the best," relevant skills should use one of these patterns:

```text
clarify_tradeoff:
  Ask what matters most.

narrow_options:
  Reduce many options to top 2–3.

reflect_blocker:
  Name the likely blocker respectfully.

decision_frame:
  Explain which option fits under each priority.

stop_looping:
  Stop adding options and offer deferral, fallback, or human support if the loop persists.
```

Loop threshold and deferral eligibility are runtime policy decisions, not skill metadata.

### 14.3 Confirmed Preference Milestone Pattern

The `preference-confirmation` skill should treat confirmation as a counseling milestone.

Recommended structure:

```text
1. acknowledge progress
2. restate the confirmed counseling preference
3. clarify that this is not official application, registration, payment, enrollment, seat reservation, or CRM update
4. summarize why the option fits if enough evidence exists
5. offer safe next steps:
   - compare one final alternative
   - take time to think or discuss with family
   - speak with a human counselor for official application or registration
```

The skill may ask for confirmation. The platform decides whether confirmation is accepted as L4 or route outcome.

---

## 15. Example `SKILL.md` Packages

---

## 15.1 Example: `initial-route-orientation/SKILL.md`

This replaces or supersedes the old `minimum-profile-collection` skill in v1.3.

```markdown
---
name: initial-route-orientation
description: Use when a pre-registration student has not yet provided enough context to choose the first useful counseling route. Orient naturally, collect only the next useful route-readiness signal, and avoid mechanical intake.
version: 1.3
artifact_type: runtime_skill
status: approved
owner: counseling_team

route_episode:
  applies_to_active_routes:
    - initial_route_selection
  applies_to_progress_states:
    - opening
    - exploration

applies_to_actions:
  - greet_orient
  - clarify_ambiguity
  - explore_interest

applies_to_zones:
  - green
  - yellow

student_postures_supported:
  - just_browsing
  - lost_or_confused
  - course_first
  - university_first
  - pathway_first

counselor_response_modes:
  - reassuring_orientation
  - route_explanation
  - clarify_once

counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question

uses_semantic_context:
  - current_truth_projection
  - accepted_semantic_delta
  - active_route_episode
  - boundary_result

audit_output_intent:
  - route_orientation
  - route_readiness_clarification
---

# Initial Route Orientation

## Purpose

Help the student start counseling naturally and identify the first useful route.

## When to Use

Use when the active route is `initial_route_selection` or when current truth is insufficient to decide whether the student needs course exploration, university exploration, pathway exploration, combined validation, or handoff.

## Counseling Goal

Help the student feel oriented and ask for the next useful piece of context, not a full intake form.

## Allowed Behavior

- Reflect what the student asked.
- Explain that the AI can help narrow course, university, or pathway direction.
- Ask one useful next question.
- Prefer academic result or broad direction if needed for route selection.

## Forbidden Behavior

- Do not ask a long list of intake questions.
- Do not force budget/ranking/location before route need is known.
- Do not claim minimum profile is complete.
- Do not claim a route is complete.
- Do not imply official application, registration, payment, or CRM action.

## Counselor-Like Response Pattern

Reflect → Guide → Ask.
```

---

## 15.2 Example: `shortlist-comparison/SKILL.md`

```markdown
---
name: shortlist-comparison
description: Use when the student is comparing or narrowing course, university, pathway, or combined options inside the active route episode. Help compare trade-offs without treating shortlist-only or L3 preference as route completion.
version: 1.3
artifact_type: runtime_skill
status: approved
owner: counseling_team

route_episode:
  applies_to_active_routes:
    - course_exploration
    - university_exploration
    - pathway_exploration
    - combined_option_validation
  applies_to_progress_states:
    - recommendation_presented
    - comparison
    - decision_support

applies_to_actions:
  - compare_shortlist
  - support_decision

applies_to_zones:
  - green
  - yellow

applies_to_recommendation_readiness:
  - R2
  - R3

applies_to_preference_levels:
  - L2
  - L3
  - L4

student_postures_supported:
  - comparison_oriented
  - validation_seeking
  - indecisive
  - constraint_driven

counselor_response_modes:
  - standard
  - decision_support
  - summary_checkpoint

counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question

contextual_boundary_rules:
  - preference_promotion_boundary
  - no_official_action

uses_semantic_context:
  - current_truth_projection
  - active_route_episode
  - accepted_semantic_delta
  - knowledge_gateway_result

audit_output_intent:
  - comparison_guidance
  - tradeoff_explanation
  - decision_support
---

# Shortlist Comparison

## Purpose

Help the student compare options and narrow choices inside the current active route.

## Route Episode Guidance

This skill may help the student move toward confirmation, fallback, or deferral, but it does not complete the route by itself.

Shortlist-only is progress, not completion.

L3 expressed preference is progress, not completion.

## Allowed Behavior

- Compare options using the student's stated priorities.
- Explain trade-offs.
- Narrow to top 2–3 when helpful.
- Reflect uncertainty or blockers.
- Ask one decision-support question if needed.

## Forbidden Behavior

- Do not say the route is complete because a shortlist exists.
- Do not promote L3 preference to confirmed preference.
- Do not force the student to decide.
- Do not imply application, registration, payment, enrollment, seat reservation, or CRM update.
```

---

## 15.3 Example: `preference-confirmation/SKILL.md`

```markdown
---
name: preference-confirmation
description: Use when the student appears ready to confirm a counseling preference inside the active route. Ask for explicit confirmation, restate that the preference is counseling-only, and avoid official-action language.
version: 1.3
artifact_type: runtime_skill
status: approved
owner: counseling_team

route_episode:
  applies_to_active_routes:
    - course_exploration
    - university_exploration
    - pathway_exploration
    - combined_option_validation
  applies_to_progress_states:
    - decision_support
    - confirmed_preference

applies_to_actions:
  - confirm_counseling_preference

applies_to_zones:
  - green
  - yellow

applies_to_preference_levels:
  - L3
  - L4

student_postures_supported:
  - validation_seeking
  - decision_ready

counselor_response_modes:
  - milestone_confirmation
  - summary_checkpoint

counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question

contextual_boundary_rules:
  - preference_promotion_boundary
  - no_official_action

confirmation_behavior:
  may_request_confirmation: true
  confirmation_targets:
    - counseling_preference

audit_output_intent:
  - confirmation_prompt
  - milestone_confirmation
---

# Preference Confirmation

## Purpose

Help confirm a counseling preference without converting it into official application, registration, payment, enrollment, seat reservation, or CRM truth.

## Route Episode Guidance

The skill may ask for confirmation. The platform decides whether the response contains enough evidence for L4 confirmed counseling preference and/or a valid route outcome.

## Confirmation Guidance

Ask clearly and gently:

"Would you like to treat this as your current counseling preference for now?"

## Milestone Pattern

If the platform accepts confirmation:

1. acknowledge progress
2. restate the confirmed counseling preference
3. clarify that it is not official application or registration
4. summarize the fit if enough evidence exists
5. offer safe next steps

## Forbidden Behavior

- Do not treat "sounds good" or "maybe" as confirmed preference.
- Do not treat L3 as route completion.
- Do not say application or registration has started.
- Do not imply seat, payment, admission, or CRM update.
```

---

## 15.4 Example: `ready-to-register-handoff/SKILL.md`

```markdown
---
name: ready-to-register-handoff
description: Use when the student expresses ready-to-apply/register intent, official-action request, payment/seat/enrollment commitment, or asks for human support. Stop normal counseling and prepare safe handoff context.
version: 1.3
artifact_type: runtime_skill
status: approved
owner: counseling_team

route_episode:
  applies_to_active_routes:
    - handoff_preparation
  applies_to_progress_states:
    - handoff

applies_to_actions:
  - prepare_handoff
  - detect_boundary

applies_to_zones:
  - red

student_postures_supported:
  - human_help_seeking
  - decision_ready

counselor_response_modes:
  - handoff_safe

counselor_response_pattern:
  - explain_boundary
  - summarize_context
  - offer_handoff

contextual_boundary_rules:
  - no_official_action
  - ready_to_register_detection
  - payment_seat_enrollment_boundary

audit_output_intent:
  - handoff_context_preparation
---

# Ready-to-Register Handoff

## Purpose

Prepare a safe human handoff when the student reaches official-action territory.

## Allowed Behavior

- Acknowledge the student is ready for the next official step.
- Explain that a human counselor must help with application, registration, payment, or seat-related steps.
- Summarize the counseling context.
- Offer handoff.

## Forbidden Behavior

- Do not submit application.
- Do not register the student.
- Do not reserve a seat.
- Do not take or confirm payment.
- Do not update CRM/application status.
- Do not claim official progress has been completed.
```

---

## 16. Initial Skill Catalog v1.3

Recommended first-version runtime skill catalog:

1. `pre-registration-opening`
2. `initial-route-orientation`
3. `course-program-exploration`
4. `course-exploration-within-university-context`
5. `pathway-exploration`
6. `university-exploration`
7. `combined-option-validation`
8. `factual-detour-answering`
9. `directional-recommendation`
10. `high-quality-recommendation`
11. `shortlist-comparison`
12. `preference-confirmation`
13. `deferral-indecision`
14. `counseling-deadlock`
15. `resume-recovery`
16. `ready-to-register-handoff`

### 16.1 Deprecated / Migration Skill Names

The following v1.2 skill names may remain during migration:

```text
minimum-profile-collection
route-detection-and-next-step
interest-exploration
```

Recommended migration:

```text
minimum-profile-collection
→ initial-route-orientation
```

```text
route-detection-and-next-step
→ route-orientation-and-next-step guidance only
→ no longer owns route detection
→ RouteEpisodePlanner owns route decision
```

```text
interest-exploration
→ course-program-exploration or general exploration support depending on route
```

---

## 17. Skill Selection Model

Phase 2 v1.3 keeps the selection model:

```text
Semantic retrieval discovers candidate SKILL.md packages.
Structured metadata filtering determines whether they are valid.
Boundary rules are loaded deterministically.
```

Each turn normally selects:

1. zero or one playbook
2. one primary runtime skill
3. all mandatory boundary rules relevant to the context

---

## 17.1 Selection Inputs

`SkillControlService` should use:

1. accepted `OperatingContext`
2. `activeRouteEpisode.routeType`
3. `activeRouteEpisode.progressState`
4. primary counseling action
5. final boundary result
6. recommendation readiness
7. preference strength
8. student posture
9. counselor response mode
10. decision-support mode
11. knowledge need
12. skill approval status
13. skill version
14. skill hash

---

## 17.2 Selection Order

Recommended selection order:

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
10. Knowledge need compatibility
11. Best semantic retrieval score
```

Boundary rules override all normal skills.

---

## 17.3 Skill Rejection Reasons

The runtime should reject a candidate skill when:

1. skill is not approved
2. metadata is invalid or incomplete
3. skill route compatibility does not match active route
4. progress state compatibility does not match
5. action compatibility does not match
6. zone compatibility does not match
7. boundary result requires handoff-safe behavior
8. selected skill body conflicts with mandatory boundary rules
9. skill is deprecated and migration alternative exists

Example:

```yaml
candidate_skill: university-exploration
active_route: course_exploration
decision: reject
reason: active_route_incompatible
```

---

## 18. Skill Precedence

Instruction precedence:

```text
1. Platform safety/compliance policy
2. Phase 0 autonomy boundary
3. Mandatory boundary rules
4. Accepted OperatingContext
5. ActiveRouteEpisodeContext
6. Runtime skill metadata
7. Runtime skill Markdown guidance
8. Playbook metadata
9. Playbook Markdown guidance
10. Examples, tone, and response style
```

Rules:

```text
Boundary rules override normal skills.
Metadata overrides Markdown body guidance.
Platform validators override all skill guidance.
No skill can create official authority.
No skill can authorize durable memory commit.
No skill can complete a route by itself.
```

---

## 19. Hybrid Enforcement Model

Phase 2 continues to use hybrid enforcement:

```text
Level 1 — Advisory Guidance
Level 2 — Structured Validation
Level 3 — Hard Blocking / Override
```

### Level 1 — Advisory Guidance

Skill body guidance shapes response quality.

Examples:

1. counselor-like wording
2. example phrasing
3. pacing guidance
4. posture-specific tone
5. comparison explanation style

### Level 2 — Structured Validation

Validators check outputs against accepted context.

Examples:

1. route alignment
2. response mode alignment
3. no premature confirmation
4. knowledge caveat compliance
5. no official-action language
6. route outcome evidence
7. memory output validity

### Level 3 — Hard Blocking / Override

Platform blocks or overrides unsafe outputs.

Examples:

1. red-zone official-action request
2. payment or seat commitment
3. application/registration request
4. human support request
5. unsupported complex eligibility
6. AI claims route is complete from L3
7. AI tries to commit official truth

---

## 20. Per-Turn Skill Execution Flow

Phase 2 v1.3 assumes this runtime consumption pattern:

```text
1. Runtime receives accepted OperatingContext and ActiveRouteEpisodeContext.
2. SkillControlService retrieves candidate skills.
3. Boundary rules are loaded deterministically.
4. Runtime filters candidate skills by route, progress, action, zone, posture, and response mode.
5. Runtime selects one primary runtime skill and optionally one playbook.
6. ExecutionContextComposer includes selected skill body, metadata summary, active route context, current truth, boundary rules, and knowledge context.
7. AIExecutionClient generates response and structured output.
8. ValidationPipeline validates response and outputs.
9. Invalid response may be retried once with same accepted context.
10. MemoryStateService commits only validated memory events.
11. AuditEventStore records skill selection, validation, route, memory, and boundary decisions.
```

Important:

```text
The selected skill guides the response.
It does not decide what commits.
```

---

## 21. Runtime Skill Execution Contract

Each runtime skill execution must produce at least:

```text
1. student-facing response
2. structured AI execution result
```

The student-facing response should be natural and counselor-like.

The structured execution result may include candidates such as:

1. response intent
2. recommendation output candidate
3. comparison output candidate
4. confirmation prompt candidate
5. handoff summary candidate
6. route-relevant signal candidate
7. memory event candidate

But candidates are not accepted truth.

```text
AIExecutionResult is a proposal.
ValidationPipeline and MemoryStateService decide what is accepted.
```

---

## 22. Validation and Failure Behavior

Phase 2 does not own validators, but skill design must support validation.

### 22.1 Skill-Related Validation

The runtime should validate:

1. selected skill is compatible with active route
2. selected skill is compatible with progress state
3. selected skill is compatible with action
4. selected skill is compatible with zone
5. response follows mandatory boundary rules
6. response does not claim route completion without accepted route outcome
7. response does not treat L3 as confirmed preference
8. response does not treat shortlist as completion
9. response does not ask irrelevant route questions
10. response does not imply official action

### 22.2 Failure Behavior

If selected skill is incompatible:

```text
Reject skill selection.
Select fallback compatible skill or safe clarification skill.
Audit rejected candidate.
```

If AI response violates route alignment:

```text
Retry response once with same accepted context.
Do not rerun pre-response memory commit.
If retry fails, use safe clarification or handoff-safe response depending on boundary risk.
```

If AI response violates boundary:

```text
Block or rewrite response.
Force handoff_safe mode if red-zone.
Audit boundary override.
```

If AI proposes invalid memory or route outcome:

```text
Reject proposed output.
Return safe response if student-facing text is still valid.
Audit rejected output.
```

---

## 23. Audit Requirements

Skill-related audit records should include:

1. candidate skills retrieved
2. candidate skill scores or reasons
3. rejected skill candidates and reasons
4. selected playbook, if any
5. selected runtime skill
6. selected boundary rules
7. skill version
8. skill content hash
9. active route at selection time
10. progress state at selection time
11. counseling action at selection time
12. counselor response mode
13. knowledge need status
14. validation failures related to selected skill
15. response retry reason
16. final accepted response mode

Route episode audit is owned by Phase 3, but skill audit should include enough context to explain:

```text
Why was this skill selected for this active route and progress state?
```

---

## 24. Evaluation Strategy

Phase 2 evaluation should test both metadata selection and skill-body counseling quality.

### 24.1 Metadata Selection Tests

Test that:

1. draft skills are rejected
2. deprecated skills are rejected unless explicitly allowed for migration
3. active-route incompatible skills are rejected
4. progress-state incompatible skills are rejected
5. red-zone boundary rules override normal skills
6. handoff skill is selected when boundary requires it
7. factual detour skill resumes route context
8. comparison skill does not claim route completion
9. preference-confirmation skill does not imply official action
10. skill hash/version are audited

### 24.2 Skill Body Quality Tests

Test that responses:

1. reflect before asking
2. guide before asking
3. ask only one useful next question
4. avoid mechanical intake
5. avoid premature route completion
6. avoid L3 over-promotion
7. avoid shortlist over-promotion
8. preserve official-action boundary
9. resume active route after factual detour
10. handle indecision without forcing a choice

### 24.3 Route Episode Skill Evaluation Labels

Recommended labels:

```text
skill_selected_correctly
skill_rejected_correctly
skill_route_incompatible
skill_progress_incompatible
boundary_rule_loaded_correctly
boundary_rule_missing
response_route_aligned
response_route_drifted
mechanical_intake
reflect_guide_ask_success
asked_too_many_questions
premature_confirmation
L3_overpromoted
shortlist_overpromoted
handoff_safe_success
skill_metadata_outdated
skill_body_conflicts_with_policy
```

---

## 25. Prototype Alignment Plan

The next prototype update should align skill metadata with active route episode without overbuilding.

### 25.1 Minimum Required Prototype Changes

1. Add `route_episode.applies_to_active_routes` metadata parsing.
2. Add `route_episode.applies_to_progress_states` metadata parsing.
3. Keep legacy `applies_to_minimum_profile_routes` as optional migration hint.
4. Stop treating `allowed_memory_outputs` as final memory authorization.
5. Stop treating `forbidden_memory_outputs` as final official-action blocker.
6. Continue auditing selected skill name/version/hash.
7. Add skill selection rejection reason for active-route mismatch.
8. Add route-alignment response validation tests.
9. Add examples for `initial-route-orientation`, `shortlist-comparison`, `preference-confirmation`, and `ready-to-register-handoff`.

### 25.2 Do Not Implement Yet

1. Full skill authoring UI.
2. Complex skill dependency graph.
3. Multi-skill chain planner.
4. Skill-owned route outcome permissions.
5. Skill-owned memory authorization.
6. Skill-owned loop thresholds.
7. Full SOP operations workflow.
8. Production evaluation dashboard.

---

## 26. Migration Notes From v1.2 to v1.3

### 26.1 Metadata Migration

| v1.2 Field | v1.3 Status | Replacement / Owner |
|---|---|---|
| `applies_to_states` | legacy/migration | `route_episode.applies_to_progress_states` |
| `applies_to_minimum_profile_routes` | deprecated | `route_episode.applies_to_active_routes` |
| `allowed_memory_outputs` | deprecated as enforceable | `MemoryStateService` / audit only during migration |
| `forbidden_memory_outputs` | deprecated as repeated metadata | `BoundaryResolver`, `ValidationPipeline`, `MemoryEventValidator` |
| `confirmation_required_when` | deprecated as final policy | `PreferencePromotionPolicy`, `RouteOutcomeValidator`; optional `confirmation_behavior` |
| `required_boundary_rules` | narrowed | `contextual_boundary_rules`; always-on rules loaded by platform |
| `uses_interpretation_signals` | renamed | `uses_semantic_context` |
| `route_behavior_notes` | still useful in body | `Route Episode Guidance` section |

### 26.2 Skill Name Migration

| v1.2 Skill | v1.3 Recommendation |
|---|---|
| `minimum-profile-collection` | rename/supersede with `initial-route-orientation` |
| `route-detection-and-next-step` | de-emphasize; platform planner owns route detection |
| `interest-exploration` | split/align into `course-program-exploration` or route-specific exploration |
| `shortlist-comparison` | keep, add active route metadata and no-completion guidance |
| `preference-confirmation` | keep, add counseling-only milestone guidance |
| `ready-to-register-handoff` | keep, align to `handoff_preparation` route |

---

## 27. Decisions Locked by Phase 2 v1.3

1. The platform continues to use counselor-owned `SKILL.md` packages.
2. SKILL.md remains the main behavior-control artifact format.
3. Skills guide counseling behavior; they do not own final route, memory, or boundary decisions.
4. Skill metadata should be lightweight and focused on selection, prompt composition, and audit.
5. Runtime skills should declare active route compatibility.
6. Runtime skills should declare progress state compatibility.
7. Runtime skills should declare action and zone compatibility.
8. Runtime skills may declare posture and response mode compatibility.
9. Runtime skills may declare contextual boundary rule hints.
10. Playbooks should generally map to route sequences or broader counseling patterns.
11. Boundary rules override all normal skills.
12. `applies_to_minimum_profile_routes` is deprecated.
13. `allowed_memory_outputs` is not final memory authorization.
14. `forbidden_memory_outputs` should not be repeated as skill metadata.
15. `can_support_route_outcomes` should not be added.
16. `route_exit_rules` should not be added.
17. `route_loop_controls` should not be added.
18. Memory commit eligibility belongs to `MemoryStateService` / `MemoryEventValidator`.
19. Route outcome validity belongs to `RouteOutcomeValidator`.
20. Route transition validity belongs to `RouteTransitionValidator`.
21. Loop policy belongs to `RouteEpisodePlanner` / `DecisionSupportPolicy`.
22. Official-action blocking belongs to `BoundaryResolver`, `ValidationPipeline`, and `MemoryEventValidator`.
23. Skills should preserve counselor-like flow: Reflect → Guide → Ask.
24. Skills should not become hidden state machines.
25. No skill can create official authority.

---

## 28. Open Questions Deferred to Later Phases

1. Final physical SKILL.md repository implementation.
2. Whether to support skill package dependencies beyond playbook + runtime skill + boundary rules.
3. Whether to add structured output contract names per skill in production.
4. Whether to add skill-specific evaluation scorecards.
5. Whether to build counselor-facing SOP authoring UI.
6. Whether to support A/B testing of skill versions.
7. How to manage multilingual skill packages.
8. How to handle internal-only counselor guidance safely in prompts.
9. How to version route metadata when RouteType evolves.
10. How to migrate existing prototype skills with minimum disruption.
11. How to connect skill quality evaluation to production monitoring.
12. How to govern skill deprecation and rollback operationally.

---

## 29. Summary

Phase 2 v1.3 updates the skill-control layer for the Route Episode operating model.

The key change is not more metadata. It is better ownership.

```text
SKILL.md guides behavior.
ActiveRouteEpisode guides route context.
Platform validators enforce correctness.
MemoryStateService owns commit eligibility.
BoundaryResolver owns autonomy boundaries.
RouteEpisodePlanner owns route planning.
RouteOutcomeValidator owns route completion.
```

The resulting model is simpler, less redundant, and safer:

```text
Counselor-owned guidance.
Runtime-enforced boundaries.
Active-route-aware skill selection.
Platform-owned route and memory validation.
No hidden route state machine inside SKILL.md.
```
