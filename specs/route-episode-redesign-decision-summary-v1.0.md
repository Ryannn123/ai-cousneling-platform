# Route Episode Redesign Decision Summary

**Project:** AI First Counseling Platform  
**Document Type:** Redesign decision summary / source patch  
**Version:** v1.0  
**Date:** 2026-07-04  
**Status:** Approved exploration decision summary  
**Source Context:** Route Episode Redesign Exploration Roadmap v0.1, Roadmap v7.4, Phase 1 v1.2, Phase 2 v1.2, Phase 3 v1.2, Phase 4 v1.3, Phase 5 v1.0, and guided route-episode redesign exploration discussion.

---

## 1. Purpose

This document captures the approved decisions from the Route Episode Redesign exploration.

It is intended to act as the bridge document before updating the formal specification set:

1. Phase 1 — Autonomous Counseling Operating Model
2. Phase 5 — Student Memory & Counseling State
3. Phase 3 — Autonomous Runtime Strategy
4. Phase 2 — Counseling SOP & Skill Control
5. Phase 4 — Interpretation & Extraction Layer
6. Roadmap v8.0
7. Prototype alignment plan

The redesign replaces the previous route/state framing:

```text
Minimum profile reached
→ derive route from known/missing fields
→ use global journey state
```

with:

```text
Active Route Episode
→ guide toward route-specific outcome
→ use reusable progress states inside the active route
→ move to next route only after valid route outcome, deferral, student-led switch, or boundary interruption
```

---

## 2. Existing Foundations That Remain Locked

The route-episode redesign does not replace the approved architecture foundation.

The following remain locked:

```text
Autonomy by default.
Conservative at boundaries.
```

```text
Counseling decision does not equal official action.
```

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

The AI may guide and record counseling-side preferences, route outcomes, recommendations, comparison results, deferrals, and handoff readiness signals.

The AI must never autonomously perform, imply, or confirm:

1. application submission
2. registration completion
3. enrollment completion
4. payment completion
5. seat reservation
6. CRM status update
7. scholarship approval
8. eligibility approval
9. exception approval
10. official document submission

The Phase 4 v1.3 semantic delta direction remains valid:

```text
SemanticDeltaResult
→ SemanticDeltaValidator
→ AcceptedSemanticDelta
```

The Phase 5 memory direction remains valid:

```text
AcceptedSemanticDelta
→ MemoryStateService
→ DurableMemoryEvent
→ MemoryEventStore
→ CurrentTruthProjection
```

The LLM must not own route state, route readiness, minimum profile state, final current truth, memory truth, CRM truth, or official business truth.

---

## 3. Core Redesign Thesis

The approved route-episode thesis is:

```text
Route owns the counseling goal.
Progress state owns where the student is inside that route.
Action owns the current turn.
Outcome owns route completion.
Boundary owns autonomy.
Memory owns durable counseling truth.
```

A route episode is not a rigid script and not a durable CRM/application state machine.

It is a runtime counseling goal frame that answers:

```text
What counseling decision are we trying to resolve right now?
```

---

## 4. Step 1 Decision — Concept Boundary

### 4.1 Approved Definition

```text
CounselingRouteEpisode is a platform-owned, runtime-derived counseling goal frame.

It tells the system which counseling decision area is currently being resolved.
```

### 4.2 Runtime vs Durable Boundary

Route episode itself is not durable memory.

The following should normally be runtime-derived:

1. active route episode
2. route type
3. route goal
4. progress state
5. transition decision
6. next route candidate
7. resume route candidate
8. loop risk
9. decision-support mode
10. route outcome candidate

Only meaningful counseling milestones may be durable memory or audit records.

Examples of meaningful route milestones:

1. route outcome reached
2. route deferred
3. route switched
4. confirmed counseling preference
5. accepted fallback
6. handoff required

### 4.3 Active Route Cardinality

Only one active route episode may exist at a time.

The system may use detour/resume overlay, but should not maintain multiple active route episodes.

```text
activeRouteEpisode: university_exploration
overlay: factual_detour
resumeRoute: university_exploration
```

### 4.4 Replacement of `minimum_profile_route`

`minimum_profile_route` should be fully replaced as the primary routing abstraction.

Academic result status, course direction status, university direction status, and pathway direction status remain important current-truth inputs, but they no longer directly form the route abstraction.

The system should no longer think:

```text
course direction unknown → minimum_profile_route = course_or_pathway_exploration
```

It should think:

```text
Current truth shows unresolved course direction.
Therefore activeRouteEpisode = course_exploration.
Goal = help the student reach a valid course-route outcome.
```

### 4.5 Ownership

The AI may propose route-relevant signals.

The platform owns:

1. active route episode
2. progress state
3. route transition
4. route completion
5. route outcome validation
6. next route candidate
7. resume route candidate

---

## 5. Step 2 Decision — Route Episode Taxonomy

### 5.1 Approved v1 Route Types

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

### 5.2 Route Type Meanings

#### `initial_route_selection`

Used when the system does not yet know the first useful counseling route.

It replaces the old feeling of minimum-profile collection as a global state.

It is not trying to complete a profile. It is trying to select the first meaningful counseling route.

#### `course_exploration`

Used when the student needs to resolve course or program direction.

Examples:

1. student does not know what to study
2. student is comparing courses
3. student has weak or conflicted course interests

#### `university_exploration`

Used when the student has some course/pathway/study direction but needs to resolve university direction.

Budget, location, ranking, campus, intake, and family constraints usually live inside this route as fit signals or constraints.

#### `course_exploration_within_university_context`

Used when the student has a university direction but no course direction.

Example:

```text
I want to study at Sunway, but I do not know which course.
```

This is separate from normal course exploration because the university context shapes available/suitable options, but the university should not be assumed final unless confirmed.

#### `pathway_exploration`

Used when the dominant uncertainty is foundation vs diploma vs degree vs transfer or another pathway decision.

#### `combined_option_validation`

Used when the student has a plausible combined direction, usually course + university + pathway, and needs validation before a confirmed counseling preference.

#### `handoff_preparation`

Used when boundary result requires or allows safe handoff preparation.

It must never authorize official action.

### 5.3 Explicit Exclusions From v1 Route Types

The following should not be route types in v1:

1. final_preference_confirmation
2. budget_value_exploration
3. location_exploration
4. career_goal_exploration
5. family_constraint_resolution
6. intake_timeline_exploration
7. scholarship_or_affordability_discussion

These should usually be modeled as quality context, constraints, decision blockers, or route-scoped recommendation inputs.

`final_preference_confirmation` should be a progress state and route outcome, not a route type.

---

## 6. Step 3 Decision — Progress State Model

### 6.1 Deprecation of Global Journey States

The old S1–S9 global journey states should be deprecated as the primary runtime model.

They may remain as migration references, but runtime control should use:

```text
ActiveRouteEpisode + RouteProgressState
```

### 6.2 Approved v1 Progress States

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

### 6.3 Mapping From Old S1–S9

| Old State | New Interpretation |
|---|---|
| S1 First Contact / Profile Incomplete | `initial_route_selection + opening` |
| S2 Minimum Profile Reached | Remove as journey state; replace with route-readiness/current-truth checkpoint |
| S3 Exploration Mode | `activeRoute + exploration` |
| S4 Recommendation-Ready | `activeRoute + recommendation_ready` |
| S5 Shortlist / Comparison | `activeRoute + comparison` |
| S6 Confirmed Counseling Preference | `activeRoute + confirmed_preference` plus route outcome candidate |
| S7 Ready-to-Register / Apply Handoff | `handoff_preparation + handoff`, driven by boundary result |
| S8 Deferral or Indecision | `activeRoute + decision_support` or `activeRoute + deferral_indecision` |
| S9 Detour and Resume | Detour overlay, not a replacement active route |

### 6.4 S2 Reclassification

`S2 Minimum Profile Reached` should be removed as a journey/progress state.

It should become a current-truth route-readiness checkpoint derived from memory/current truth.

It does not mean counseling progress has been made.

### 6.5 Detour Handling

Detour should be an overlay, not a second active route and not a route stack.

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

### 6.6 Confirmed Preference Is Route-Scoped

`confirmed_preference` must be interpreted with the active route.

Examples:

```text
course_exploration + confirmed_preference
= confirmed course counseling preference

university_exploration + confirmed_preference
= confirmed university counseling preference

pathway_exploration + confirmed_preference
= confirmed pathway counseling preference

combined_option_validation + confirmed_preference
= confirmed combined counseling preference
```

---

## 7. Step 4 Decision — Route Outcome Model

### 7.1 Core Rule

Route completion is outcome-based.

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

### 7.2 Approved v1 Route Outcomes

```ts
type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";
```

### 7.3 Outcome Evidence Requirements

#### `confirmed_preference`

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

#### `accepted_fallback`

Requires explicit student acceptance of a fallback or working option.

It does not become L4 confirmed counseling preference unless the student clearly confirms it as their chosen counseling direction.

#### `deferred_decision`

Requires explicit deferral or validated loop-risk behavior.

Examples:

```text
I need more time to think.
I want to discuss with my parents first.
Let's pause this for now.
```

#### `student_switched_route`

Requires evidence that the student intentionally changed the decision area.

Example:

```text
Actually, I already know I want Psychology. Help me choose university.
```

#### `blocked_by_boundary`

Used when the active route cannot safely continue due to boundary risk, complexity, sensitivity, or unresolved official-action ambiguity.

#### `handoff_required`

Used when red-zone handoff is required.

Must not imply official action has been performed.

### 7.4 L3 Rule

L3 expressed preference must not complete a route.

L3 can move the route toward:

1. comparison
2. decision support
3. summary checkpoint
4. confirmation prompt
5. recommendation refinement

But it cannot complete the route.

---

## 8. Step 5 Decision — Route Selection and Transition Policy

### 8.1 Core Rule

Default behavior is to continue the active route unless a higher-priority transition condition is met.

```text
Route should be sticky.
Detours should be temporary.
Switches should require evidence.
Outcomes should require validation.
Boundaries should override everything.
```

### 8.2 Approved Transition Priority

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

### 8.3 Stay on Active Route

Stay on the active route when the new turn can reasonably be handled as:

1. progress inside the route
2. clarification inside the route
3. decision support inside the route
4. recommendation refinement inside the route
5. comparison inside the route
6. confirmation inside the route
7. temporary detour with resume

### 8.4 Switch Route

Switch route only when:

1. the student explicitly redirects the counseling decision area
2. the active route outcome implies the next route
3. current truth makes the active route invalid or already resolved
4. boundary behavior requires handoff preparation

Do not switch route merely because of:

1. budget preference mentioned
2. location preference mentioned
3. fee question
4. ranking question
5. casual mention of another course/university
6. weak interest
7. L3 expressed preference
8. shortlist creation

### 8.5 Detour Rule

A detour should not replace the active route unless it reveals:

1. red-zone boundary
2. explicit student-led route switch
3. valid route outcome
4. new hard constraint that invalidates the active route

### 8.6 Loop-Risk and Deferral Policy

Loop risk should lead to decision support first, then accepted fallback or deferred decision if progress remains low.

Loop-risk triggers may include:

1. repeated indecision after decision-support attempts
2. repeated comparison without new criteria
3. student rejects every option without new constraint
4. student keeps asking which is better after trade-off explanation
5. student says they are overwhelmed or need time
6. no route progress after several turns despite valid guidance

### 8.7 Combined Option Validation Trigger

Move to `combined_option_validation` when:

1. course direction is confirmed or strongly preferred
2. university direction is confirmed or strongly preferred
3. pathway direction is known or not decision-critical
4. no active unresolved route should be handled first
5. the student appears to be validating or nearing a final counseling choice

Do not trigger combined validation when:

1. course is only weak interest
2. university is only casually mentioned
3. student is still comparing unresolved options
4. academic/pathway uncertainty materially affects advice
5. red-zone boundary is present

### 8.8 RouteTransitionDecision Contract

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

---

## 9. Step 6 Decision — Memory and Current Truth Derivation

### 9.1 Core Principle

```text
Route episode is derived runtime context.
Route outcome is durable only when it represents a meaningful counseling milestone.
CurrentTruthProjection derives route-relevant truth every turn.
```

### 9.2 New Memory Category

Add a new memory category:

```ts
type MemoryCategory =
  | existing categories
  | "route_outcome";
```

### 9.3 RouteOutcomeMemoryPayload

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

  outcomeReason:
    | "student_confirmed"
    | "student_accepted_fallback"
    | "student_deferred"
    | "student_switched_route"
    | "boundary_interrupted"
    | "handoff_required";

  routeCompletionStatus:
    | "completed"
    | "deferred"
    | "switched"
    | "blocked"
    | "handoff";

  evidence: EvidenceSpan[];
};
```

This payload should still use the normal Phase 5 `DurableMemoryEvent` envelope.

### 9.4 Route Start Events

Route start should not be durable memory by default.

Route start/selection is audit/runtime context unless later needed for analytics.

### 9.5 Coexisting Memory Events

`RouteOutcomeMemory` may coexist with other memory categories:

1. confirmed preference may also create `CounselingPreferenceMemory`
2. accepted fallback may also create direction memory as fallback/working option
3. deferred decision may also create `ConcernOrBlockerMemory` or `DecisionSupportMemory`
4. handoff required may also create `HandoffReadinessMemory`

### 9.6 Accepted Fallback Rule

Accepted fallback is not L4 by default.

```text
Accepted fallback = acceptable working option / backup.
Confirmed preference = chosen counseling direction for now.
```

### 9.7 CurrentTruthProjection Additions

Add route episode projection fields:

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

  routeLoopRisk?: {
    routeType: RouteType;
    riskLevel: "none" | "low" | "medium" | "high";
    reason?: string;
  };

  nextRouteCandidate?: RouteType;
  resumeRouteCandidate?: RouteType;
};
```

---

## 10. Step 7 Decision — Runtime Placement and Operating Context

### 10.1 Core Runtime Placement

Use a two-part model:

```text
RouteEpisodeCandidateResolver before BoundaryResolver
RouteEpisodePlanner after BoundaryResolver
```

Candidate route helps boundary/context reasoning.

Boundary result controls final route.

Final planner produces accepted route episode context.

### 10.2 Updated Runtime Flow

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

### 10.3 Boundary Override Rule

If boundary result is red:

```text
activeRouteEpisode = handoff_preparation
progressState = handoff
counselorResponseMode = handoff_safe
```

### 10.4 ActiveRouteEpisodeContext

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

  source: {
    derivedFromCurrentTruth: boolean;
    usedAcceptedSemanticDelta: boolean;
    usedPriorOperatingContext: boolean;
    usedBoundaryResult: boolean;
  };
};
```

### 10.5 OperatingContext Update

`OperatingContext` should consume `ActiveRouteEpisodeContext`.

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

  validationRequirements: ValidationRequirement[];
};
```

### 10.6 Deprecated Operating Context Fields

Deprecate:

1. `minimum_profile_route`
2. `current_main_state` as primary journey-state control
3. `overlay_state` as S9-style journey state
4. `resume_target_state` as journey-state target

Replace with:

1. `activeRouteEpisode.routeType`
2. `activeRouteEpisode.progressState`
3. `activeRouteEpisode.transitionDecision`
4. `activeRouteEpisode.resumeRouteCandidate`
5. `detourOverlay`

---

## 11. Step 8 Decision — Skill Metadata and SOP Alignment

### 11.1 Revised Principle

Skill metadata should not become the route policy engine or memory authorization layer.

```text
SKILL.md guides behavior.
Platform validators enforce route correctness, memory safety, and boundary safety.
```

### 11.2 Remove / Do Not Add

Do not define:

1. `can_support_route_outcomes`
2. `route_exit_rules`
3. `route_loop_controls`
4. `global_forbidden_memory_outputs`
5. repeated `forbidden_memory_outputs`
6. enforceable `allowed_memory_outputs`

Do not make skill metadata responsible for:

1. memory authorization
2. route exit policy
3. loop thresholds
4. global official-action blocking
5. L3 completion prevention
6. shortlist completion prevention

### 11.3 Keep Minimal Route Metadata

Keep route compatibility metadata for skill selection and prompt composition:

```yaml
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
    - deferral_indecision
    - confirmed_preference
```

Also keep:

1. `applies_to_actions`
2. `applies_to_zones`
3. `student_postures_supported`
4. `counselor_response_modes`
5. optional `contextual_boundary_rules`
6. optional `audit_output_intent`

### 11.4 Ownership Split

```text
SKILL.md metadata owns:
- skill identity
- approval status
- route compatibility
- progress-state compatibility
- action compatibility
- zone compatibility
- posture/response-mode guidance
- contextual boundary rule hints
- audit labels/output intent, optional

SKILL.md body owns:
- counselor-readable guidance
- when to use
- how to respond
- examples
- tone
- good/bad behavior examples

RouteEpisodePlanner owns:
- active route
- progress state
- transition decision
- route outcome candidate
- loop risk
- next/resume route

RouteOutcomeValidator owns:
- valid route outcomes
- outcome evidence
- no L3 completion
- no shortlist completion
- no premature transition

ValidationPipeline owns:
- response safety
- route alignment
- boundary compliance
- structured output validity

MemoryStateService / MemoryEventValidator owns:
- memory commit eligibility
- durable memory category validation
- official-truth rejection
- evidence requirements
- projection intent
```

---

## 12. Step 9 Decision — Validation, Audit, and Evaluation

### 12.1 Central Rule

Route-episode validation should be centralized in platform validators, not distributed across skill metadata.

### 12.2 Required Validators

Add or formalize:

1. `RouteEpisodeCandidateValidator`
2. `RouteTransitionValidator`
3. `RouteOutcomeValidator`
4. `RouteResponseAlignmentValidator`
5. `BoundaryOverrideValidator`
6. `MemoryCommitValidator` through `MemoryStateService`

### 12.3 RouteOutcomeValidator Owns

1. no shortlist-only completion
2. no recommendation-presented-only completion
3. no L1/L2/L3 completion
4. confirmed preference evidence
5. accepted fallback evidence
6. deferral evidence
7. boundary/handoff outcome safety
8. route outcome memory eligibility pre-checks

### 12.4 Audit Events

Add route-episode audit events:

1. `route_candidate_resolved`
2. `route_candidate_rejected`
3. `active_route_selected`
4. `progress_state_derived`
5. `route_transition_decision`
6. `route_transition_rejected`
7. `route_outcome_candidate_detected`
8. `route_outcome_accepted`
9. `route_outcome_rejected`
10. `route_deferred`
11. `route_switched`
12. `detour_entered`
13. `detour_resumed`
14. `loop_risk_detected`
15. `boundary_overrode_route`
16. `route_response_alignment_failed`
17. `route_memory_commit_accepted`
18. `route_memory_commit_rejected`

### 12.5 Evaluation Labels

Recommended labels:

1. `route_correct`
2. `route_wrong`
3. `route_switch_correct`
4. `route_switch_premature`
5. `route_completion_correct`
6. `route_completion_premature`
7. `route_completion_missed`
8. `shortlist_overpromoted`
9. `L3_overpromoted`
10. `detour_resume_success`
11. `detour_route_lost`
12. `deferral_correct`
13. `deferral_premature`
14. `handoff_override_correct`
15. `handoff_missed`
16. `boundary_overtriggered`
17. `counselor_like_flow_good`
18. `counselor_like_flow_rigid`
19. `too_many_questions`
20. `route_question_irrelevant`
21. `memory_commit_correct`
22. `memory_commit_overpromoted`

### 12.6 Core Prototype Test Scenarios

Minimum test categories:

1. active route derivation
2. progress state inside route
3. no weak/L3/shortlist completion
4. confirmed preference route outcome
5. accepted fallback route outcome
6. deferred decision route outcome
7. student-led route switch
8. factual detour and resume
9. preference-revealing detour and resume
10. boundary detour override
11. apply/register/human request handoff
12. route response alignment rejection/regeneration
13. route outcome memory commit
14. response retry without duplicate memory commit

---

## 13. Step 10 Decision — Specification Update Plan

### 13.1 Approved Update Sequence

Update specifications in this order:

```text
1. Route Episode Redesign Decision Summary v1.0
2. Phase 1 v1.3 — Operating Model Update
3. Phase 5 v1.1 — Memory & Current Truth Update
4. Phase 3 v1.3 — Runtime Strategy Update
5. Phase 2 v1.3 — Skill Control Update
6. Phase 4 v1.4 — Semantic Delta Compatibility Note
7. Roadmap v8.0 — Updated Platform Roadmap
8. Prototype Alignment Plan
```

### 13.2 Phase 1 v1.3 Update Scope

Phase 1 should:

1. introduce `CounselingRouteEpisode`
2. replace global S1–S9 as primary runtime model
3. demote S2 to route-readiness/current-truth checkpoint
4. define RouteType
5. define RouteProgressState
6. define RouteOutcome
7. preserve L1–L5 preference ladder
8. explicitly state L3 does not complete route
9. preserve detour/resume overlay
10. preserve counselor-like flow

### 13.3 Phase 5 v1.1 Update Scope

Phase 5 should:

1. clarify active route episode is not durable memory
2. add `route_outcome` memory category
3. add `RouteOutcomeMemoryPayload`
4. add route outcome projection fields
5. define route deferral/fallback behavior
6. define accepted fallback is not L4 unless confirmed
7. preserve official-truth separation

### 13.4 Phase 3 v1.3 Update Scope

Phase 3 should:

1. add `RouteEpisodeCandidateResolver`
2. add `RouteEpisodePlanner`
3. add `ActiveRouteEpisodeContext`
4. replace `minimum_profile_route` in OperatingContext
5. add route validators
6. make boundary override route planning
7. enforce route response alignment
8. preserve retry-without-duplicate-memory-commit behavior

### 13.5 Phase 2 v1.3 Update Scope

Phase 2 should:

1. replace `applies_to_minimum_profile_routes` with `applies_to_active_routes`
2. add `applies_to_progress_states`
3. remove enforceable `allowed_memory_outputs`
4. remove repeated forbidden memory output metadata
5. not add `can_support_route_outcomes`
6. not add route exit rules or loop controls
7. keep skill metadata lightweight

### 13.6 Phase 4 v1.4 Update Scope

Phase 4 should only add a compatibility note:

1. LLM must not output final active route episode
2. LLM must not output final progress state
3. LLM must not output final route outcome
4. LLM may emit route-relevant runtime-only signals as candidates
5. RouteEpisodePlanner and validators decide final route behavior

### 13.7 Roadmap v8.0 Update Scope

Roadmap v8.0 should:

1. record route episode as the new operating backbone
2. replace `minimum_profile_route` language with `activeRouteEpisode`
3. update dependency chain
4. revise Phase 6+ to consume route context
5. revise prototype alignment sequence
6. keep v1 route-episode scope small

### 13.8 Prototype Alignment Scope

Prototype vNext should implement:

1. RouteType enum
2. RouteProgressState enum
3. RouteOutcome enum
4. RouteEpisodeCandidateResolver
5. RouteEpisodePlanner
6. ActiveRouteEpisodeContext
7. RouteTransitionDecision
8. RouteOutcomeValidator
9. detour/resume overlay
10. route_outcome memory event
11. route audit events
12. route-alignment tests

Do not implement yet:

1. multi-route goal graph
2. production route analytics dashboard
3. production recommendation scoring
4. CRM integration
5. complex route optimization
6. durable route episode store
7. heavy route outcome skill metadata

---

## 14. Final Approved Direction

The final approved route-episode redesign direction is:

```text
Route episode becomes the primary runtime counseling goal frame.

minimum_profile_route is replaced.

Old S1–S9 global journey states are deprecated as the primary runtime model.

The new model is:
CurrentTruthProjection
→ ActiveRouteEpisode
→ RouteProgressState
→ RouteTransitionDecision
→ RouteOutcome
→ Validators
→ Memory/Audit Commit

Route episode is runtime-derived.
Route outcome may become durable memory.
SKILL.md guides counseling behavior but does not own route policy or memory authorization.
Platform validators own route correctness, memory safety, and boundary safety.
```

---

## 15. Non-Goals for v1

The v1 route-episode redesign should not become:

1. a rigid script
2. a fixed funnel
3. one mandatory question order
4. an LLM-owned planning state
5. a replacement for boundary rules
6. a replacement for memory events
7. a replacement for SKILL.md
8. an official CRM/application state machine
9. a multi-route autonomous goal graph
10. a durable route episode store
11. a route policy engine embedded inside skill metadata

The target remains:

```text
Structured enough to avoid drift.
Flexible enough to counsel.
```
