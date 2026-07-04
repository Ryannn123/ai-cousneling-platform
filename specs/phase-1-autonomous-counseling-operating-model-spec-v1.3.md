# Phase 1 — Autonomous Counseling Operating Model Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 1 — Autonomous Counseling Operating Model  
**Version:** 1.3  
**Date:** 2026-07-04  
**Status:** Updated specification, amended for Route Episode redesign  
**Source Context:** Phase 0 Bounded Autonomy Baseline v1.0, Phase 1 Autonomous Counseling Operating Model v1.2, Phase 2 Counseling SOP & Skill Control v1.2, Phase 3 Autonomous Runtime Strategy v1.2, Phase 4 Interpretation & Extraction Layer v1.3, Phase 5 Student Memory & Counseling State v1.0, Roadmap v7.4, Route Episode Redesign Exploration Roadmap v0.1, and Route Episode Redesign Decision Summary v1.0.

---

## 1. Purpose

This specification defines the **Phase 1 autonomous counseling operating model** for the AI-first counseling platform.

It answers the Phase 1 core question:

```text
What counseling journey should the AI autonomously guide before red-zone handoff is required?
```

Phase 1 defines how the AI counselor should operate across the **pre-registration student journey**, including onboarding, academic/profile understanding, route selection, course exploration, university exploration, pathway exploration, recommendation, comparison, counseling preference confirmation, deferral, detours, recovery, and red-zone handoff.

Version 1.3 updates the Phase 1 model from a global journey-state model into a **Route Episode operating model**.

The previous model was:

```text
Minimum profile reached
→ derive route from known/missing fields
→ use global journey state
```

The revised model is:

```text
Active Route Episode
→ guide toward route-specific outcome
→ use reusable progress states inside the active route
→ move to next route only after valid route outcome, deferral, student-led switch, or boundary interruption
```

This specification intentionally remains at the **operating-model level**. It does not define implementation architecture, durable memory schema, runtime modules, SOP package format, knowledge retrieval implementation, CRM workflow, evaluation dashboards, or production deployment. Those belong to later phases.

---

## 1.1 Version History Summary

### Version 1.1 — Minimum Counseling Profile Routing

Version 1.1 replaced the older university-fit intake gate:

```text
1. academic results
2. ranking/prestige vs budget/value university preference
3. preferred location
```

with the route-oriented minimum counseling profile:

```text
1. academic result status
2. course direction status
3. university direction status
```

Ranking/prestige preference, budget/value preference, preferred location, campus preference, intake/timeline, family constraints, and similar fit signals were no longer universal minimum-profile gates. They became route-scoped quality signals, recommendation-refinement signals, or hard constraints when stated strongly.

### Version 1.2 — Counselor-Like Flow Behavior

Version 1.2 added the counselor-like navigation principle:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

It also introduced student posture, decision-support micro-loops, soft summary checkpoints, and milestone behavior for confirmed counseling preference.

### Version 1.3 — Route Episode Redesign

Version 1.3 replaces the global S1–S9 journey state model as the primary runtime operating model.

The new primary conceptual model is:

```text
Active Route Episode + Route Progress State + Route Outcome
```

Key changes:

1. `CounselingRouteEpisode` becomes the primary counseling goal frame.
2. `minimum_profile_route` is replaced as the primary route abstraction.
3. S1–S9 are deprecated as primary runtime states and retained only as migration references.
4. S2 Minimum Profile Reached is demoted to a route-readiness/current-truth checkpoint.
5. Progress is modeled inside the active route using reusable progress states.
6. Route completion is outcome-based, not status-based.
7. L3 expressed preference does not complete a route.
8. Shortlist-only, recommendation-presented-only, and collected fit signals do not complete a route.
9. Only one active route episode exists at a time, with optional detour/resume overlay.
10. Route episode is runtime-derived; meaningful route outcomes may become durable counseling memory in Phase 5.
11. The AI may propose route-relevant signals, but the platform owns route decision, transition, outcome validation, boundary handling, and commit.

---

## 2. Phase 0 Inheritance

Phase 1 inherits the approved Phase 0 bounded autonomy baseline.

### 2.1 Core Autonomy Stance

```text
Autonomy by default.
Conservative at boundaries.
```

The AI counselor should autonomously handle ordinary pre-registration counseling, including:

1. onboarding
2. academic and profile understanding
3. course/program exploration
4. pathway exploration
5. university/program exploration
6. recommendation
7. comparison and shortlist support
8. decision support
9. counseling preference confirmation
10. deferral handling
11. readiness-to-register detection
12. handoff context preparation

Humans remain responsible for:

1. ready-to-register students
2. application, registration, enrollment, payment, or seat-reservation actions
3. official CRM/application/registration state changes
4. high-risk or sensitive actions
5. complex or exception-based cases
6. student-requested human support
7. scenarios outside approved SOP coverage

### 2.2 Boundary Principle

```text
Counseling decision does not equal official action.
```

The AI may guide and record counseling decisions, but it must not perform, imply, or confirm completion of official business actions.

Allowed autonomous counseling outcomes include:

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
13. handoff readiness signal

Forbidden autonomous official outcomes include:

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

### 2.3 Automation Zone Model

Phase 1 uses the Phase 0 automation zones:

```text
Green Zone:
  Fully autonomous ordinary counseling.

Yellow Zone:
  Autonomous with caution, clarification, caveats, lower confidence,
  or explicit confirmation.

Red Zone:
  Human handoff required.
```

The route episode model must preserve this boundary model.

```text
Boundary owns autonomy.
Route owns the counseling goal.
Progress state owns where the student is inside that route.
Outcome owns route completion.
Memory owns durable counseling truth.
```

Boundary behavior always overrides route behavior.

---

## 3. Target Student Scope

Phase 1 covers **pre-registration prospects only**.

A pre-registration prospect is a student who is still exploring or deciding before official application, registration, payment, enrollment, seat reservation, or other official business action.

This phase does not cover the full operating model for already-registered students, post-registration support, payment servicing, document processing, visa processing, enrollment operations, or CRM workflow management.

---

## 4. Counseling Outcome Scope

The AI counselor’s primary Phase 1 outcome is to guide students toward a **counseling preference**, not an official business transaction.

The AI should guide students toward:

1. course/program preference
2. university choice
3. pathway choice
4. combined course + university + pathway counseling preference when appropriate

Examples:

```text
The student prefers Psychology.
The student prefers a budget-friendly university around KL.
The student prefers a diploma pathway over foundation.
The student confirms Psychology at University A as their current counseling preference.
```

The AI must not convert these into:

```text
Application submitted.
Registration completed.
Seat reserved.
Payment confirmed.
CRM status updated.
Enrollment confirmed.
```

---

## 5. Core Route Episode Operating Model

### 5.1 Core Thesis

The approved route-episode thesis is:

```text
Route owns the counseling goal.
Progress state owns where the student is inside that route.
Action owns the current turn.
Outcome owns route completion.
Boundary owns autonomy.
Memory owns durable counseling truth.
```

A route episode is a runtime counseling goal frame that answers:

```text
What counseling decision are we trying to resolve right now?
```

It is not:

1. a rigid script
2. a fixed funnel
3. one mandatory question order
4. an LLM-owned planning state
5. a replacement for boundary rules
6. a replacement for memory events
7. a replacement for SKILL.md
8. an official CRM/application state machine
9. a durable mutable student profile

### 5.2 Definition

```text
CounselingRouteEpisode is a platform-owned, runtime-derived counseling goal frame.

It tells the system which counseling decision area is currently being resolved.
```

The active route episode should guide the AI counselor’s next move while remaining flexible enough to handle natural conversation, detours, uncertainty, and student-led direction changes.

### 5.3 Runtime vs Durable Boundary

Route episode itself is not durable memory.

The following are normally runtime-derived:

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

Only meaningful counseling milestones may become durable counseling memory or audit records in later phases.

Examples of meaningful route milestones:

1. route outcome reached
2. route deferred
3. route switched
4. confirmed counseling preference
5. accepted fallback
6. handoff required

### 5.4 Active Route Cardinality

Only one active route episode may exist at a time.

The system may use detour/resume overlay, but it should not maintain multiple active route episodes.

Example:

```text
activeRouteEpisode: university_exploration
overlay: factual_detour
resumeRoute: university_exploration
```

This preserves counseling focus without preventing side questions.

### 5.5 Replacement of `minimum_profile_route`

`minimum_profile_route` is fully replaced as the primary routing abstraction.

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

### 5.6 Ownership

The AI may propose route-relevant signals, such as:

1. student is lost or confused
2. student changed direction
3. student is comparing options
4. student wants to defer
5. student may be ready to confirm
6. student may require handoff

The platform owns:

1. active route episode
2. progress state
3. route transition
4. route completion
5. route outcome validation
6. next route candidate
7. resume route candidate
8. boundary override
9. memory commit eligibility

---

## 6. Route Type Taxonomy

### 6.1 Approved v1 Route Types

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

The first version intentionally keeps the route set small to avoid over-fragmentation.

---

### 6.2 `initial_route_selection`

#### Purpose

Identify the first meaningful counseling route when the system does not yet know whether the student needs course exploration, university exploration, pathway exploration, combined validation, comparison, recommendation, or handoff.

This route replaces the old feeling of minimum-profile collection as a global state.

It is not trying to complete a profile. It is trying to select the first useful counseling route.

#### Entry Signals

Use when:

1. there is no active route yet
2. the student is new or context is insufficient
3. academic/course/university/pathway direction is too unclear to choose a route
4. the student gives a vague opening such as “I need help choosing”

#### Default Behavior

The AI should:

1. greet naturally
2. reflect the student’s situation
3. ask for the minimum next information needed to choose a route
4. avoid long questionnaires
5. avoid forcing ranking/budget/location before route need is known
6. avoid pretending a route is complete merely because a status is known

#### Typical Next Routes

```text
course_exploration
university_exploration
course_exploration_within_university_context
pathway_exploration
combined_option_validation
handoff_preparation
```

---

### 6.3 `course_exploration`

#### Purpose

Help the student resolve course or program direction.

#### Entry Signals

Use when:

1. student does not know what to study
2. student is comparing courses
3. student has weak or conflicted course interests
4. student has academic context but no resolved course direction
5. course decision is the dominant counseling uncertainty

Examples:

```text
I don’t know what to study.
I’m choosing between Psychology and Business.
I like IT but I’m not sure if it suits me.
```

#### Allowed Behavior

The AI may:

1. explore interests, strengths, disliked subjects, career direction, and study preferences
2. explain course/program differences
3. compare course options
4. recommend broad course directions when enough context exists
5. help the student narrow options
6. support decision-making without forcing premature confirmation
7. capture weak interests, expressed interests, expressed preferences, rejected options, concerns, constraints, and deferrals

#### Forbidden Behavior

The AI should not:

1. treat weak interest as course completion
2. treat L3 expressed preference as route completion
3. force a course decision before enough exploration
4. move to university exploration just because a university is casually mentioned
5. imply course choice equals application or registration

---

### 6.4 `university_exploration`

#### Purpose

Help the student resolve university direction after there is at least some course, pathway, or study-direction context.

#### Entry Signals

Use when:

1. course or pathway direction is known, preferred, or at least usable
2. university direction is unknown, weak, conflicted, or unresolved
3. student asks which university is suitable for a known course/pathway
4. student compares universities

Examples:

```text
I want Psychology but don’t know which university.
Which university is better for Business?
I prefer a budget-friendly university around KL.
```

#### Route-Scoped Fit Signals

Budget, ranking, location, campus, intake, and family constraints usually live inside this route as:

1. quality-enhancing signals
2. hard constraints when stated strongly
3. comparison priorities
4. recommendation refinement inputs

They are not standalone route types in v1.

#### Forbidden Behavior

The AI should not:

1. ask university-fit questions before the student has enough course/pathway context, unless the student is university-first
2. treat budget/location collected as route completion
3. treat a university shortlist as a confirmed university preference
4. claim university choice means eligibility approval, admission, registration, or seat reservation

---

### 6.5 `course_exploration_within_university_context`

#### Purpose

Help the student choose a course/program while using a preferred or considered university as context.

#### Entry Signals

Use when:

1. student has a university direction but no course direction
2. student wants to study at a specific university but does not know which course
3. student asks what courses are suitable within a university context

Example:

```text
I want to study at Sunway, but I do not know which course.
```

#### Special Rule

Confirmed course preference in this route does not automatically confirm the university.

Example:

```text
Student says: At Sunway, I think Psychology is the course I prefer.

Meaning:
confirmed course preference within Sunway context,
not necessarily final combined counseling preference.
```

The next route may be `combined_option_validation` if the combined option is plausible and the student is near confirmation.

---

### 6.6 `pathway_exploration`

#### Purpose

Help the student resolve pathway direction.

#### Entry Signals

Use when the dominant uncertainty is:

1. foundation vs diploma
2. diploma vs degree
3. transfer pathway
4. entry pathway due to academic result
5. progression route
6. pathway suitability before course/university decision

Examples:

```text
Should I take foundation or diploma?
I don’t meet direct degree entry, what pathway can I take?
I’m not sure whether diploma or foundation is better.
```

#### Forbidden Behavior

The AI should not:

1. treat pathway explanation as pathway confirmation
2. promise eligibility approval
3. resolve complex eligibility, exception, appeal, or waiver cases independently
4. convert pathway choice into application or registration

---

### 6.7 `combined_option_validation`

#### Purpose

Validate a combined counseling direction, usually course + university + pathway, before treating it as a confirmed counseling preference.

#### Entry Signals

Use when:

1. student has a plausible course + university option
2. course and university direction are both strong enough to validate together
3. student asks whether the combined option is suitable
4. student appears close to a final counseling choice

Examples:

```text
I think Psychology at University A is best for me.
Is Business at Taylor’s a good choice based on my result?
So should I choose this course at this university?
```

#### Special Rule

Confirmed preference in this route is the strongest non-official counseling outcome.

It still must not become:

1. application submitted
2. registration completed
3. payment confirmed
4. enrollment confirmed
5. seat reserved
6. CRM truth

---

### 6.8 `handoff_preparation`

#### Purpose

Prepare safe context for a human counselor when the student reaches red-zone or requests human support.

#### Entry Signals

Use when the student:

1. wants to apply now
2. wants to register now
3. asks how to pay or reserve a seat
4. asks the AI to submit an application
5. requests a human counselor
6. enters complex, sensitive, exception, appeal, waiver, or business-sensitive territory

#### Allowed Behavior

The AI may:

1. explain the boundary
2. summarize counseling context
3. prepare handoff context
4. reassure the student that a human counselor can help with the official next step

#### Forbidden Behavior

The AI must not:

1. submit an application
2. register the student
3. reserve a seat
4. take or confirm payment
5. update CRM/application status
6. claim official progress has been completed

---

### 6.9 Explicit Exclusions From v1 Route Types

The following should not be route types in v1:

1. `final_preference_confirmation`
2. `budget_value_exploration`
3. `location_exploration`
4. `career_goal_exploration`
5. `family_constraint_resolution`
6. `intake_timeline_exploration`
7. `scholarship_or_affordability_discussion`

These should usually be modeled as:

1. quality context
2. hard constraints
3. decision blockers
4. route-scoped recommendation inputs
5. comparison priorities
6. future route types only if later evidence shows they behave like independent counseling decision areas

`final_preference_confirmation` should be a progress state and route outcome, not a route type.

---

## 7. Route Progress State Model

### 7.1 Global Journey State Deprecation

The old S1–S9 global journey states are deprecated as the primary runtime model.

They may remain as migration references, but runtime control should use:

```text
ActiveRouteEpisode + RouteProgressState
```

### 7.2 Approved v1 Progress States

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

Progress states are reusable across route types.

Examples:

```text
course_exploration + exploration
course_exploration + comparison
course_exploration + decision_support
course_exploration + confirmed_preference

university_exploration + exploration
university_exploration + recommendation_ready
university_exploration + comparison
university_exploration + confirmed_preference
```

### 7.3 Progress State Meanings

| Progress State | Meaning |
|---|---|
| `opening` | The route has just started or is being oriented. |
| `exploration` | The student is exploring options inside the route. |
| `recommendation_ready` | The AI has enough route context to make a useful recommendation. |
| `recommendation_presented` | A recommendation has been shown, but not necessarily accepted or confirmed. |
| `comparison` | The student is comparing or narrowing options inside the route. |
| `decision_support` | The student needs structured help resolving trade-offs, blockers, or indecision. |
| `confirmed_preference` | The student has explicitly confirmed a route-scoped counseling preference. |
| `deferral_indecision` | The route is paused, unresolved, or the student wants more time. |
| `detour_resume` | A side question is being handled while preserving resume context. |
| `handoff` | The route is under handoff-safe handling. |
| `completed` | A valid route outcome has completed or closed the route. |

### 7.4 Mapping From Old S1–S9

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

### 7.5 S2 Reclassification

`S2 Minimum Profile Reached` is no longer a journey/progress state.

It becomes a current-truth route-readiness checkpoint derived from memory/current truth.

It does not mean counseling progress has been made.

The route-episode model treats missing course or university direction as counseling work to resolve, not as a field-completion status.

### 7.6 Detour Handling

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

A detour should not replace the active route unless it reveals:

1. red-zone boundary
2. explicit student-led route switch
3. valid route outcome
4. new hard constraint that invalidates the active route

### 7.7 Confirmed Preference Is Route-Scoped

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

Confirmed counseling preference is still not official application, registration, payment, enrollment, seat reservation, or CRM truth.

---

## 8. Route Outcome Model

### 8.1 Core Rule

Route completion is outcome-based.

Progress state alone does not complete a route.

The following do **not** complete a route:

1. weak interest
2. expressed interest
3. L3 expressed preference
4. shortlist-only
5. recommendation-presented-only
6. comparison in progress
7. unresolved comparison
8. budget/location/ranking collected only
9. student still exploring

### 8.2 Approved v1 Route Outcomes

```ts
type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";
```

### 8.3 `confirmed_preference`

#### Meaning

The student clearly confirms a counseling-side preference for the route’s decision area.

#### Valid Evidence

```text
Yes, Psychology is my choice for now.
I want to go with Sunway for this course.
I think diploma is the path I want.
This option seems best for me.
```

#### Invalid Evidence

```text
Psychology sounds interesting.
I prefer Psychology over Business.
Maybe Sunway.
Can you show me a shortlist?
```

### 8.4 `accepted_fallback`

#### Meaning

The student does not fully decide the ideal route outcome, but explicitly accepts a safe counseling fallback or working option.

Examples:

```text
Okay, let's use Business as my backup for now.
Then diploma pathway sounds safer for me.
Let’s keep that university as the recommended option for now.
```

Accepted fallback does **not** become L4 confirmed counseling preference unless the student clearly confirms it as their chosen counseling direction.

### 8.5 `deferred_decision`

#### Meaning

The route cannot complete now, but the student safely pauses or delays the decision.

Valid evidence:

```text
I need more time to think.
I want to discuss with my parents first.
I'm still not ready to choose.
Let's pause this for now.
```

Deferral is a valid counseling outcome. It prevents the AI from looping or pressuring the student.

### 8.6 `student_switched_route`

#### Meaning

The student intentionally changes the decision area.

Examples:

```text
Actually, I already know I want Psychology. Help me choose university.
Forget the university first, I’m not sure about the course.
Before choosing university, I want to know foundation vs diploma.
```

Student-led route switch is a valid non-failure outcome.

### 8.7 `blocked_by_boundary`

#### Meaning

The active route cannot safely continue because a boundary issue interrupts it.

Examples:

1. official-action ambiguity
2. complex eligibility
3. exception request
4. sensitive context
5. conflicting high-impact information

### 8.8 `handoff_required`

#### Meaning

The route ends because red-zone handoff is required.

Examples:

```text
I want to apply now.
Can you register me?
How do I pay the deposit?
I want a human counselor.
```

This must never imply official action was performed.

### 8.9 Route-Scoped Outcome Meaning

The route outcome enum is intentionally generic. The active route gives it domain meaning.

Examples:

```text
course_exploration + confirmed_preference
= confirmed_course_counseling_preference

university_exploration + confirmed_preference
= confirmed_university_counseling_preference

pathway_exploration + confirmed_preference
= confirmed_pathway_counseling_preference

combined_option_validation + confirmed_preference
= confirmed_combined_counseling_preference
```

### 8.10 L3 Rule

L3 expressed preference must not complete a route.

L3 can move the route toward:

1. comparison
2. decision support
3. summary checkpoint
4. confirmation prompt
5. recommendation refinement

But it cannot complete the route.

---

## 9. Route Selection and Transition Policy

### 9.1 Core Rule

Default behavior is to continue the active route unless a higher-priority transition condition is met.

```text
Route should be sticky.
Detours should be temporary.
Switches should require evidence.
Outcomes should require validation.
Boundaries should override everything.
```

### 9.2 Approved Transition Priority

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

### 9.3 Stay on Active Route

Stay on the active route when the new turn can reasonably be handled as:

1. progress inside the route
2. clarification inside the route
3. decision support inside the route
4. recommendation refinement inside the route
5. comparison inside the route
6. confirmation inside the route
7. temporary detour with resume

### 9.4 Switch Route

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

### 9.5 Initial Route Selection Rules

Initial route selection should happen only when there is no active route, the previous route completed, or the previous route was invalidated.

Recommended initial route rules:

```text
No academic result yet
→ initial_route_selection / opening
→ ask for academic result and broad direction in a counselor-like way

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

Red-zone signal
→ handoff_preparation
```

### 9.6 Combined Option Validation Trigger

Move to `combined_option_validation` when:

1. course direction is confirmed or strongly preferred
2. university direction is confirmed or strongly preferred
3. pathway direction is either known or not decision-critical
4. there is no active unresolved route that should be handled first
5. the student appears to be validating or nearing a final counseling choice

Do not trigger combined validation when:

1. course is only weak interest
2. university is only casually mentioned
3. student is still comparing multiple unresolved options
4. academic/pathway uncertainty materially affects advice
5. red-zone boundary is present

### 9.7 Loop-Risk and Deferral Policy

Loop risk should lead to decision support first, then accepted fallback or deferred decision if progress remains low.

Loop-risk triggers include:

1. repeated indecision after decision-support attempts
2. repeated comparison without new criteria
3. student rejects every option but gives no new constraint
4. student keeps asking which is better after trade-off explanation
5. student says they are overwhelmed, tired, or need time
6. no route progress after several turns despite valid guidance

When loop risk appears, the AI should:

1. summarize the decision point
2. reflect the blocker
3. offer a safe deferral or fallback
4. avoid forcing confirmation
5. optionally move to another route if the student agrees

---

## 10. Recommendation Readiness

The route episode model preserves the Phase 1 recommendation readiness levels:

```text
R1. Not Ready to Recommend
R2. Ready for Directional Recommendation
R3. Ready for High-Quality Recommendation
```

### 10.1 R1 — Not Ready to Recommend

R1 means:

1. academic result is missing, unclear, or unusable, or
2. the student has no usable course, university, or pathway direction, or
3. the active route is too early for even directional recommendation

### 10.2 R2 — Ready for Directional Recommendation

R2 means:

1. academic result is known or usable enough, and
2. at least one direction is known:
   - course direction
   - university direction
   - pathway direction

R2 supports cautious directional recommendation with assumptions and caveats.

### 10.3 R3 — Ready for High-Quality Recommendation

R3 means:

1. academic result and direction are clear enough, and
2. enough fit signals exist to support a higher-quality recommendation

Fit signals may include:

1. ranking/prestige vs budget/value preference
2. location preference or hard location constraint
3. budget sensitivity or hard budget constraint
4. career goal
5. timeline or intake preference
6. campus or study mode preference
7. rejected options
8. student concerns
9. comparison priorities

### 10.4 Fit Signal Rule

Ranking, budget, and location improve R3 readiness, especially for university recommendations.

They are not required for R2 directional recommendation.

They are not universal minimum-profile gates.

---

## 11. Preference Strength Ladder

The route episode model preserves the Phase 1 preference strength ladder:

```text
L1. Weak Interest
L2. Expressed Interest
L3. Expressed Preference
L4. Confirmed Counseling Preference
L5. Ready-to-Register / Apply Intent
```

### 11.1 L1 — Weak Interest

Example:

```text
Psychology sounds interesting.
```

Meaning:

```text
The student shows interest, but this is not a preference and not route completion.
```

### 11.2 L2 — Expressed Interest

Example:

```text
I am interested in Psychology.
```

Meaning:

```text
The student has a stronger interest, but still has not expressed preference over alternatives.
```

### 11.3 L3 — Expressed Preference

Example:

```text
I think I prefer Psychology over Business.
```

Meaning:

```text
The student is leaning toward an option, but this is not confirmed counseling preference.
```

Important route rule:

```text
L3 does not complete a route.
```

### 11.4 L4 — Confirmed Counseling Preference

Example:

```text
Yes, Psychology at University A is my choice for now.
```

Meaning:

```text
The student has explicitly confirmed a counseling-side preference.
```

L4 remains non-official.

### 11.5 L5 — Ready-to-Register / Apply Intent

Example:

```text
Great, I want to apply now.
```

Meaning:

```text
The student has crossed into official next-step intent.
```

L5 triggers red-zone handoff behavior.

---

## 12. Counselor-Like Flow Behavior

The counselor-like flow principle remains:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

### 12.1 Default Pattern

For safe non-red-zone turns, the AI should normally:

1. reflect the student’s current situation
2. identify the current route, trade-off, or decision point
3. provide useful guidance
4. ask one purposeful next question or offer one clear next step

### 12.2 Route Episode Application

The route episode decides where counseling should go.

Counselor-like behavior decides how the AI should guide the student there.

Example:

```text
Student: I don’t know what to study.
Route: course_exploration
Progress: opening/exploration
Response mode: reassuring_orientation
Behavior: reassure, orient, and ask one useful interest/strength question.
```

Example:

```text
Student: I want Psychology but don’t know which university.
Route: university_exploration
Progress: opening/exploration
Response mode: route_explanation
Behavior: validate course direction, explain why university fit matters next,
and ask one university-fit question.
```

Example:

```text
Student: Which one is better, A or B?
Route: active route depends on option type
Progress: comparison
Response mode: decision_support
Behavior: compare using student priorities and ask which trade-off matters most.
```

### 12.3 Student Posture

Student posture remains a non-state counseling context.

Possible values:

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

Student posture may influence tone, pacing, response mode, explanation, and next-step framing.

It must not replace:

1. active route
2. progress state
3. route outcome
4. recommendation readiness
5. preference strength
6. boundary status
7. handoff status
8. memory truth
9. official truth

### 12.4 Decision-Support Micro-Loops

Decision support may appear inside course, university, pathway, or combined validation routes.

Supported decision-support modes:

```text
clarify_tradeoff
narrow_options
reflect_blocker
decision_frame
stop_looping
```

Decision support should help the student make progress without pressure.

It may lead to:

1. continued exploration
2. comparison
3. summary checkpoint
4. confirmation prompt
5. accepted fallback
6. deferred decision
7. student-led route switch
8. handoff if boundary is reached

---

## 13. Route Behavior Contracts

Each route uses the following conceptual behavior contract:

```text
1. Purpose
2. Entry signals
3. Allowed AI behavior
4. Forbidden AI behavior
5. Possible counseling outputs
6. Valid route outcomes
7. Likely next routes
8. Zone bias
```

These contracts define operating behavior only. They do not define final memory schema, runtime nodes, tool contracts, SOP packages, or database schemas.

---

## 14. Route Outcome and Next Route Rules

### 14.1 Course Exploration Outcomes

`course_exploration` may complete through:

```text
confirmed_preference
accepted_fallback
deferred_decision
student_switched_route
blocked_by_boundary
handoff_required
```

Not complete:

```text
shortlist_only
weak_interest_only
L3_expressed_preference_only
student_still_exploring
unresolved_comparison
```

Typical next routes:

```text
confirmed course preference
→ university_exploration, if university unresolved
→ combined_option_validation, if university/pathway already plausible

accepted fallback
→ next unresolved route or combined_option_validation if enough direction exists

deferred decision
→ pause route, summarize status, offer resume later

student switched route
→ open requested route

handoff_required
→ handoff_preparation
```

### 14.2 University Exploration Outcomes

`university_exploration` may complete through:

```text
confirmed_preference
accepted_fallback
deferred_decision
student_switched_route
blocked_by_boundary
handoff_required
```

Not complete:

```text
shortlist_only
budget_location_preference_collected_only
L3_expressed_preference_only
unresolved_university_comparison
```

Typical next routes:

```text
confirmed university preference
→ course_exploration_within_university_context, if course unresolved
→ combined_option_validation, if course/pathway already plausible

student switched route
→ course_exploration or pathway_exploration, depending on student signal
```

### 14.3 Course Exploration Within University Context Outcomes

`course_exploration_within_university_context` may complete through:

```text
confirmed_preference
accepted_fallback
deferred_decision
student_switched_route
blocked_by_boundary
handoff_required
```

Special rule:

```text
Confirmed course preference here does not automatically confirm the university or combined option.
```

Likely next route:

```text
combined_option_validation
```

when the combined option is plausible and the student is ready to validate it.

### 14.4 Pathway Exploration Outcomes

`pathway_exploration` may complete through:

```text
confirmed_preference
accepted_fallback
deferred_decision
student_switched_route
blocked_by_boundary
handoff_required
```

Not complete:

```text
pathway_explanation_only
L3_expressed_preference_only
unresolved_pathway_comparison
```

Typical next routes:

```text
course_exploration
university_exploration
combined_option_validation
```

depending on unresolved direction.

### 14.5 Combined Option Validation Outcomes

`combined_option_validation` may complete through:

```text
confirmed_preference
deferred_decision
student_switched_route
blocked_by_boundary
handoff_required
```

`accepted_fallback` should be used cautiously and only when the fallback is explicitly a combined working option.

Typical next behavior:

```text
confirmed combined counseling preference
→ milestone response
→ safe next step or handoff boundary check

student wants to apply/register
→ handoff_preparation

student reopens course/university/pathway uncertainty
→ switch to relevant route
```

### 14.6 Handoff Preparation Outcomes

`handoff_preparation` may complete through:

```text
handoff_required
blocked_by_boundary
student_switched_route
```

The practical outcome detail may be:

```text
handoff_context_prepared
```

But this is not an official action and does not mean application, registration, payment, enrollment, seat, or CRM status changed.

---

## 15. Handoff Trigger Model

The route episode model preserves the Phase 1 handoff triggers:

```text
H1. Ready-to-Apply / Ready-to-Register Intent
H2. Official Action Request
H3. Payment / Seat / Enrollment Commitment
H4. Exception / Appeal / Waiver / Complex Eligibility
H5. Sensitive or High-Risk Context
H6. Student-Requested Human Support
```

When a handoff trigger is detected:

1. boundary behavior wins
2. active route may be forced to `handoff_preparation`
3. progress state may be forced to `handoff`
4. counselor response mode should become `handoff_safe`
5. AI must not continue normal route flow as if nothing happened

---

## 16. Counseling Action Vocabulary

The route episode model preserves the Phase 1 counseling action vocabulary:

```text
A1. Greet / Orient
A2. Collect Routing Context
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

Version 1.3 renames the old conceptual `Collect Minimum Profile` action to `Collect Routing Context` for clarity.

The AI should generally have one primary counseling action per student-facing turn.

---

## 17. Route Readiness and Current Truth Inputs

Although `minimum_profile_route` is replaced, the underlying current-truth inputs remain important.

The system still needs to derive:

1. academic result status
2. course direction status
3. university direction status
4. pathway direction status, when relevant
5. active course direction
6. active university direction
7. active pathway direction
8. preference strength
9. recommendation readiness
10. hard constraints
11. soft preferences
12. decision blockers
13. handoff readiness context

These are not LLM-owned route truth.

They are derived in later phases from accepted semantic artifacts and durable memory/current truth.

---

## 18. Confirmed Counseling Preference Milestone

When the student reaches L4 confirmed counseling preference, the AI should treat it as a counseling milestone.

The AI should:

1. acknowledge progress
2. restate the confirmed counseling preference
3. clarify that the preference is not official application, registration, payment, enrollment, seat reservation, or CRM update
4. summarize why the option fits, if enough evidence exists
5. offer safe next steps

Safe next steps include:

1. compare one final alternative
2. take time to think or discuss with family
3. continue exploring related options
4. speak with a human counselor for official application or registration next steps

Example pattern:

```text
Great — for counseling purposes, your current preferred direction is Psychology
at University A.

This is not an official application or registration yet, but it gives us a clear
counseling direction.

Based on what you shared, this seems to fit your interest and current priorities.
From here, you can compare one final alternative, take time to think, or speak
with a human counselor for the official application step.
```

---

## 19. Deferral and Indecision Behavior

Deferral and indecision are not failures.

They are valid counseling states and may become valid route outcomes.

The AI should:

1. avoid pressuring the student
2. summarize the current decision point
3. identify the blocker if known
4. offer a fallback or pause if appropriate
5. preserve resume context
6. avoid looping through the same comparison repeatedly

Examples of deferral signals:

```text
I need more time.
I want to ask my parents.
I’m still not ready to choose.
Let’s pause this first.
```

Possible route outcome:

```text
deferred_decision
```

---

## 20. Detour and Resume Behavior

Students may freely ask side questions.

The AI should handle detours without losing the active route.

Detour examples:

1. factual question
2. fee question
3. intake question
4. scholarship question
5. side comparison
6. clarification about a term
7. preference-revealing side statement
8. boundary-triggering side request

The AI should:

1. answer safe detours when answerable
2. use knowledge gateway or source governance in later phases when factual accuracy matters
3. capture route-relevant signals if volunteered
4. resume the active route after the detour
5. interrupt normal flow if the detour triggers red-zone boundary

---

## 21. Example Route Episode Flows

### 21.1 Lost Student Flow

```text
Student: I don’t know what to study.

activeRouteEpisode: course_exploration
progressState: opening/exploration
studentPosture: lost_or_confused
responseMode: reassuring_orientation

Goal:
Help the student explore broad course direction.

Valid completion:
confirmed course preference, accepted fallback, deferred decision,
student-led switch, blocked boundary, or handoff.
```

### 21.2 Course-First Student Flow

```text
Student: I want Psychology, but I don’t know which university.

activeRouteEpisode: university_exploration
progressState: opening/exploration
studentPosture: course_first
responseMode: route_explanation

Goal:
Use Psychology as the course context and help resolve university direction.
```

### 21.3 University-First Student Flow

```text
Student: I want to study at Sunway, but I don’t know what course.

activeRouteEpisode: course_exploration_within_university_context
progressState: exploration
studentPosture: university_first

Goal:
Explore suitable course directions within the Sunway context without assuming
Sunway is final unless confirmed.
```

### 21.4 Combined Validation Flow

```text
Student: So Psychology at Sunway seems best for me?

activeRouteEpisode: combined_option_validation
progressState: recommendation_ready or comparison
studentPosture: validation_seeking

Goal:
Validate the combined fit and guide toward confirmation, final comparison,
deferral, or handoff if official intent appears.
```

### 21.5 Boundary Handoff Flow

```text
Student: Great, can you register me now?

boundary: red
activeRouteEpisode: handoff_preparation
progressState: handoff
responseMode: handoff_safe

Goal:
Stop autonomous counseling, explain boundary, summarize context, and prepare
human handoff. Do not register the student.
```

---

## 22. Operating-Model Rules Locked by Phase 1 v1.3

The following decisions are locked by this specification:

1. Phase 1 uses `CounselingRouteEpisode` as the primary counseling goal frame.
2. `minimum_profile_route` is replaced as the primary route abstraction.
3. Old S1–S9 journey states are deprecated as primary runtime states.
4. S1–S9 may remain as migration references.
5. S2 Minimum Profile Reached is reclassified as a route-readiness/current-truth checkpoint.
6. Only one active route episode may exist at a time.
7. Detour/resume is an overlay, not a second active route.
8. Route progress uses reusable progress states.
9. Route completion is outcome-based.
10. L3 expressed preference does not complete a route.
11. Shortlist-only does not complete a route.
12. Recommendation-presented-only does not complete a route.
13. Collected fit signals alone do not complete a route.
14. Confirmed preference is route-scoped.
15. Accepted fallback is not L4 unless explicitly confirmed as chosen counseling direction.
16. Deferral is a valid counseling outcome.
17. Student-led route switch is valid and not a failure.
18. Boundary override wins over route flow.
19. Counseling preference remains separate from official action.
20. AI may propose route-relevant signals, but platform owns route state, transition, outcome validation, and commit.

---

## 23. Open Questions Deferred to Later Phases

Phase 1 v1.3 does not resolve:

1. final runtime module contracts for route episode planning
2. final durable route outcome memory schema
3. route outcome projection rules in `CurrentTruthProjection`
4. skill metadata updates for active routes and progress states
5. semantic delta route-relevant signal schema
6. full route validation implementation
7. production evaluation metrics
8. route analytics dashboard
9. recommendation scoring and ranking
10. handoff package structure
11. CRM integration
12. production guardrails
13. multi-route goal graph, if ever needed
14. additional route types such as affordability, location, or career route

These are deferred to Phase 5, Phase 3, Phase 2, Phase 4, Roadmap v8.0, and prototype alignment updates.

---

## 24. Appendix — Old State Migration Reference

The old S1–S9 state model is preserved here only as a migration reference.

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

Recommended migration:

```text
S1 → initial_route_selection + opening
S2 → route-readiness/current-truth checkpoint
S3 → activeRoute + exploration
S4 → activeRoute + recommendation_ready
S5 → activeRoute + comparison
S6 → activeRoute + confirmed_preference + route outcome candidate
S7 → handoff_preparation + handoff
S8 → activeRoute + decision_support / deferral_indecision
S9 → detour overlay with resume route
```

---

## 25. Appendix — Conceptual Type Summary

```ts
type RouteType =
  | "initial_route_selection"
  | "course_exploration"
  | "university_exploration"
  | "course_exploration_within_university_context"
  | "pathway_exploration"
  | "combined_option_validation"
  | "handoff_preparation";

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

type RouteOutcome =
  | "confirmed_preference"
  | "accepted_fallback"
  | "deferred_decision"
  | "student_switched_route"
  | "blocked_by_boundary"
  | "handoff_required";

type RouteTransitionPriority =
  | "boundary_override"
  | "human_support_request"
  | "student_led_route_switch"
  | "active_route_outcome_reached"
  | "detour_resume"
  | "loop_risk_or_deferral"
  | "continue_active_route"
  | "initial_route_selection";

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

---

## 26. Appendix — Non-Official Boundary Reminder

Confirmed counseling preference, accepted fallback, deferred decision, route switch, and handoff readiness are counseling-side concepts only.

They must never mean:

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

The platform remains:

```text
AI-first for counseling.
Human-owned for official action.
```
