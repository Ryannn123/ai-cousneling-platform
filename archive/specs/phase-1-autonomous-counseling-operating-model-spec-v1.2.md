# Phase 1 — Autonomous Counseling Operating Model Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 1 — Autonomous Counseling Operating Model  
**Version:** 1.2  
**Date:** 2026-06-29  
**Status:** Approved exploration output for Phase 1, amended for minimum counseling profile routing and counselor-like flow behavior  
**Source Context:** Phase 0 Bounded Autonomy Baseline, Updated Exploration Roadmap, Phase 1 exploration discussion, minimum counseling profile routing amendment, and counselor-like flow behavior amendment

---

## 1. Purpose

This specification defines the **Phase 1 autonomous counseling operating model** for the AI-first counseling platform.

It answers the Phase 1 core question:

```text
What counseling journey should the AI autonomously guide before red-zone handoff is required?
```

Phase 1 defines how the AI counselor should operate across the **pre-registration student journey**, including profile collection, exploration, recommendation, comparison, preference confirmation, deferral handling, detours, recovery, and red-zone handoff.

This specification intentionally stays at the **operating-model level**. It does not define implementation architecture, runtime design, durable memory schema, SOP package format, knowledge retrieval implementation, CRM workflow, evaluation metrics, or prototype details. Those belong to later phases.

### 1.1 Version 1.1 Amendment Summary

Version 1.1 updates the Phase 1 minimum profile model.

The previous minimum profile emphasized early university-fit criteria:

```text
1. academic results
2. ranking/prestige vs budget/value university preference
3. preferred location
```

The revised minimum counseling profile is now route-oriented:

```text
1. academic result
2. course direction status
3. university direction status
```

This change means ranking/prestige preference, budget/value preference, preferred location, campus preference, intake/timeline, and similar fit details are no longer universal minimum-profile gates. They are collected during university exploration, recommendation refinement, comparison, or when stated as hard constraints.

Core amendment principle:

```text
Minimum profile should determine the next counseling route.
University-fit criteria should be collected when the route actually requires
university exploration, recommendation refinement, or comparison.
```

### 1.2 Version 1.2 Amendment Summary

Version 1.2 adds a counselor-like flow behavior layer on top of the existing flexible journey graph and route-based minimum counseling profile.

The routing model remains unchanged:

```text
Minimum profile determines the next counseling route.
The journey remains a flexible state graph, not a rigid funnel.
```

Version 1.2 clarifies how the AI counselor should guide students through that route in a more counselor-like way.

Core counselor-like flow principle:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

This amendment adds:

1. counselor-like navigation principles
2. student posture as a non-state counseling context
3. decision-support micro-loops across exploration, recommendation, comparison, and indecision
4. milestone behavior for confirmed counseling preference
5. soft summary checkpoints before recommendation and preference confirmation
6. clearer placement of counselor-like response guidance for Phase 2 skills
7. lightweight operating-context implications for Phase 3 and interpretation implications for Phase 4

Important boundary:

```text
Counselor-like behavior improves how the AI guides the student.
It does not loosen Phase 0 boundaries, official-action rules, or red-zone handoff requirements.
```

---

## 2. Phase 0 Inheritance

Phase 1 inherits the approved Phase 0 autonomy baseline.

### 2.1 Core Autonomy Stance

```text
Autonomy by default.
Conservative at boundaries.
```

The AI counselor should autonomously handle ordinary pre-registration counseling, including:

1. onboarding
2. profile and academic information collection
3. interest exploration
4. course and pathway exploration
5. university and program exploration
6. option comparison
7. recommendation
8. decision support
9. counseling preference confirmation
10. deferral handling
11. readiness-to-register detection
12. handoff context preparation

Humans remain responsible for:

1. ready-to-register students
2. application, enrollment, payment, or seat-reservation actions
3. official CRM/application/registration state changes
4. high-risk or sensitive actions
5. complex or exception-based cases
6. student-requested human support
7. scenarios outside approved SOP coverage

### 2.2 Boundary Principle

```text
Counseling decision does not equal official action.
```

The AI may guide and record counseling decisions, but it must not perform or imply completion of official business actions.

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
10. readiness-to-register signal

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

### 2.3 Zone Model

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

The operating model must support high autonomy in normal counseling while reliably detecting red-zone boundaries.

---

## 3. Target Student Scope

Phase 1 covers **pre-registration prospects only**.

A pre-registration prospect is a student who is still exploring or deciding before official application, registration, payment, enrollment, or seat reservation.

This phase does not cover the full operating model for already-registered students, post-registration support, payment servicing, document processing, visa processing, enrollment operations, or CRM workflow management.

---

## 4. Counseling Outcome Scope

The AI counselor’s primary Phase 1 outcome is to guide students toward a **counseling preference**, not an official business transaction.

The AI should guide students toward:

1. course/program preference
2. university choice
3. pathway choice

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

## 5. Journey State Model

Phase 1 models the pre-registration counseling journey as a **flexible state graph**, not a rigid linear funnel.

The operating model uses nine journey states:

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

The student does not have to move through these states in a strict sequence.

The AI may:

1. jump between states
2. pause and resume
3. answer detours
4. return to a previous journey point
5. revise active direction when the student changes their mind
6. interrupt the journey when red-zone handoff is required

### 5.1 State Summary

| State | Meaning | Default Zone Bias |
|---|---|---|
| S1 First Contact / Profile Incomplete | Student has entered but minimum counseling profile is incomplete | Green |
| S2 Minimum Profile Reached | Minimum counseling route profile is known: academic result, course direction status, and university direction status | Green / Yellow |
| S3 Exploration Mode | Student is exploring courses, programs, universities, or pathways | Green |
| S4 Recommendation-Ready | AI has enough context to recommend | Green / Yellow |
| S5 Shortlist / Comparison | Student is comparing or narrowing options | Green / Yellow |
| S6 Confirmed Counseling Preference | Student confirms a counseling direction, not official action | Yellow |
| S7 Ready-to-Register / Apply Handoff | Student crosses into official next-step intent | Red |
| S8 Deferral or Indecision | Student pauses, hesitates, or is stuck | Green / Yellow |
| S9 Detour and Resume | Student asks side question before returning to main journey | Green / Yellow / Red depending on content |

### 5.2 Minimum Counseling Profile Routing Principle

S2 no longer means the AI has a complete university recommendation profile.

S2 means the AI knows enough to choose the next counseling route:

```text
academic result
+ course direction status
+ university direction status
```

The AI should use these statuses to decide whether the student needs:

1. course exploration
2. university exploration
3. pathway exploration
4. recommendation
5. comparison
6. preference confirmation
7. handoff

University-fit details such as ranking/prestige preference, budget/value preference, location, campus, intake, and family constraints should be collected when relevant to the active route, not as universal intake gates.

### 5.3 Student Posture as Non-State Counseling Context

Version 1.2 introduces **student posture** as a lightweight counseling context.

Student posture helps the AI adapt tone, pacing, and next-step framing. It is not a journey state and must not replace:

1. journey state
2. route context
3. recommendation readiness
4. preference strength
5. boundary status
6. handoff status

Student posture describes how the student appears to be approaching the counseling conversation.

Possible posture values include:

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

Examples:

```text
Student: I don’t know what to study.
Posture: lost_or_confused
Counseling implication: reassure, orient, and start course/pathway exploration.
```

```text
Student: I want Psychology but I don’t know which university.
Posture: course_first
Counseling implication: validate course direction and route to university exploration.
```

```text
Student: Is Sunway better than Taylor’s for Business?
Posture: comparison_oriented
Counseling implication: compare using the student’s priorities and avoid restarting intake.
```

Student posture is advisory in Phase 1. Later phases may use validated interpretation to populate posture in the operating context, but posture should not directly commit durable memory or official truth.

---

## 6. State Transition Rules

The AI should evaluate possible state transitions using a priority-based model.

Recommended transition priority:

```text
1. Red-zone boundary check
2. Sensitive / complex-case check
3. Detour check
4. Preference-strength check
5. Profile-completeness check
6. Normal journey progress
```

### 6.1 Transition Principle

Each student message should either:

1. progress the main counseling journey
2. temporarily detour and resume
3. clarify uncertainty
4. confirm a stronger counseling state
5. trigger red-zone handoff

### 6.2 Transition Examples

| Trigger | Current State | Next State | Zone | Behavior |
|---|---|---|---|---|
| Student starts conversation | None | S1 | Green | Start naturally and collect minimum profile |
| Student provides academic result plus course and university direction status | S1 | S2 | Green | Route to course exploration, university exploration, pathway exploration, recommendation, or comparison |
| Student asks about course, university, or pathway | S1/S2/S4/S5 | S3 or S9 | Green | Answer and continue exploration |
| AI has enough info to recommend | S2/S3 | S4 | Green/Yellow | Recommend with assumptions and confidence |
| Student compares multiple options | S3/S4 | S5 | Green/Yellow | Compare trade-offs and help narrow |
| Student confirms choice “for now” | S5 | S6 | Yellow | Confirm as counseling preference only |
| Student says apply/register/enroll/pay/reserve now | Any | S7 | Red | Stop autonomous flow and prepare handoff |
| Student is unsure or wants more time | S3/S4/S5/S6 | S8 | Green/Yellow | Record deferral or support decision-making |
| Student asks side question | Any | S9 overlay | Green/Yellow/Red | Answer, then resume if safe |
| Student asks for human counselor | Any | S7 | Red | Respect request and hand off |
| Student asks exception/appeal/waiver/sensitive issue | Any | S7 or narrow clarification first | Red or Yellow→Red | Do not resolve independently |

---

## 7. State Behavior Contracts

Each state is defined using the following contract format:

```text
1. Purpose
2. Entry signals
3. AI allowed behavior
4. AI forbidden behavior
5. Memory/counseling outputs
6. Exit conditions
7. Zone bias
```

These contracts define operating behavior only. They do not define final memory schema, runtime nodes, tool contracts, or SOP packages.

---

## 8. State Behavior Details

## 8.1 S1 — First Contact / Profile Incomplete

### Purpose

Identify the student as a pre-registration prospect and collect the minimum information needed to route the counseling flow.

The goal is not to collect every recommendation input. The goal is to understand the student’s academic baseline and whether the next counseling move should start with course direction, university direction, pathway direction, recommendation, comparison, or handoff.

### Entry Signals

The student starts a conversation and the AI does not yet know enough to determine the next counseling route.

### AI Allowed Behavior

The AI may:

1. greet naturally
2. ask what the student is looking for
3. ask for academic result
4. ask whether the student already has any course in mind
5. ask whether the student already has any university in mind
6. answer simple initial questions
7. capture weak interests if mentioned naturally
8. capture universities being considered if mentioned naturally
9. capture pathway direction if mentioned naturally

### AI Forbidden Behavior

The AI should not:

1. recommend too confidently
2. force a long questionnaire
3. require ranking/budget/location before any useful guidance
4. treat casual interest as confirmed preference
5. treat a preferred course or university as a confirmed counseling preference without confirmation
6. move into registration/application action

### Memory/Counseling Outputs

Possible conceptual outputs:

1. academic_result_collected
2. course_direction_status_known
3. university_direction_status_known
4. courses_considering, if mentioned
5. universities_considering, if mentioned
6. pathway_direction_status_known, if mentioned
7. weak_interest, if mentioned
8. quality-enhancing fit signals, if naturally mentioned

Examples of quality-enhancing fit signals:

1. location preference
2. budget sensitivity
3. ranking/prestige preference
4. career goal
5. timeline or intake preference
6. family/location constraints

These may be captured if volunteered, but they are not required for S2.

### Exit Conditions

Move to S2 once the AI knows:

1. academic result status
2. course direction status
3. university direction status

### Zone Bias

Mostly Green.

---

## 8.2 S2 — Minimum Profile Reached

### Purpose

Determine the best next counseling route now that the AI knows the student’s academic baseline and current course/university direction status.

S2 is a routing checkpoint, not a guarantee that the AI has enough information for a high-quality university recommendation.

### Entry Signals

The AI knows:

1. academic result
2. course direction status
3. university direction status

### Direction Status Values

Course direction status:

```text
unknown
considering_some_courses
preferred_course_exists
confirmed_counseling_course_preference
```

University direction status:

```text
unknown
considering_some_universities
preferred_university_exists
confirmed_counseling_university_preference
```

Important distinction:

```text
Preferred course/university does not mean confirmed counseling preference.
Confirmed counseling preference requires explicit student confirmation.
Confirmed counseling preference is not application, registration, payment,
enrollment, seat reservation, or CRM truth.
```

### AI Allowed Behavior

The AI may:

1. route the student into course exploration
2. route the student into university exploration
3. route the student into pathway exploration
4. prepare a directional recommendation if enough direction exists
5. ask one optional quality-improving question
6. explain assumptions
7. continue even if ranking/budget/location is not yet known
8. collect university-fit details when the active route requires them

### AI Forbidden Behavior

The AI should not:

1. delay forever by asking too many questions
2. pretend optional fit information is universally required
3. treat ranking/budget/location as mandatory for all counseling
4. overstate recommendation confidence when fit signals are missing
5. treat preferred course/university as confirmed counseling preference without confirmation

### Memory/Counseling Outputs

Possible conceptual outputs:

1. minimum_profile_reached
2. course_direction_status
3. university_direction_status
4. recommendation_readiness_level
5. next_counseling_route
6. optional_missing_info

### Route Selection After S2

Route A — No course, no university:

```text
academic result known
course direction unknown
university direction unknown
→ course/pathway exploration first
```

AI behavior:

```text
Explore interests, strengths, career direction, disliked subjects, and broad course/pathway fit.
Do not force university-fit questions yet.
```

Route B — Course known, university unknown:

```text
academic result known
course direction known
university direction unknown
→ university exploration
→ university comparison
```

AI behavior:

```text
Validate the course direction, then explore suitable universities.
Collect university-fit signals such as ranking/budget/location when useful.
```

Route C — University known, course unknown:

```text
academic result known
course direction unknown
university direction known
→ course exploration within university context
```

AI behavior:

```text
Use the preferred university as context, but avoid assuming it is final unless confirmed.
Explore suitable courses or pathways within that university context.
```

Route D — Course known, university known:

```text
academic result known
course direction known
university direction known
→ recommendation, validation, or comparison
```

AI behavior:

```text
Validate fit, check assumptions, compare alternatives if needed, and confirm counseling preference only if the student clearly chooses.
```

Route E — Pathway issue dominant:

```text
academic result known
pathway uncertainty appears
→ pathway exploration or comparison
```

AI behavior:

```text
Compare foundation, diploma, degree, transfer, or other pathway options.
Do not treat pathway choice as application or registration.
```

### Exit Conditions

Move to:

1. S3, if the student needs course, university, or pathway exploration
2. S4, if enough direction exists for a useful recommendation
3. S5, if the student is comparing or narrowing options
4. S9, if the student asks a side question
5. S7, if the student jumps to apply/register

### Zone Bias

Green, sometimes Yellow if important information is incomplete or a high-impact direction is being narrowed.

---

## 8.3 S3 — Exploration Mode

### Purpose

Help the student understand possible courses, universities, or pathways before recommending too strongly.

### Entry Signals

The student asks about:

1. courses
2. programs
3. pathways
4. universities
5. study directions
6. career/course fit
7. general options

### AI Allowed Behavior

The AI may:

1. explain options
2. compare fields
3. ask lightweight preference questions
4. capture weak interests
5. capture rejected options
6. surface trade-offs

### AI Forbidden Behavior

The AI should not:

1. force premature choice
2. promote weak interest into confirmed preference
3. invent university/program facts
4. resolve sensitive or exception-based cases alone

### Memory/Counseling Outputs

Possible conceptual outputs:

1. weak_interest
2. expressed_interest
3. rejected_option
4. student_concern
5. student_constraint

### Exit Conditions

Move to:

1. S4, when enough fit signal exists
2. S5, if the student compares options
3. S8, if the student is stuck
4. S9, if the student asks a side question

### Zone Bias

Mostly Green.

---

## 8.4 S4 — Recommendation-Ready

### Purpose

Provide a recommendation for course/program, university, or pathway.

### Entry Signals

The AI has enough context to make a useful recommendation.

Minimum directional recommendation basis:

1. academic result
2. at least one usable direction:
   - course direction
   - university direction
   - pathway direction

High-quality recommendation basis usually also includes enough fit signals, such as:

1. ranking/prestige vs budget/value preference
2. location preference or hard location constraint
3. budget sensitivity or hard budget constraint
4. career goal
5. timeline or intake preference
6. campus or study mode preference
7. rejected options
8. student concerns
9. comparison priorities

Important:

```text
Ranking/budget/location improve recommendation quality, especially for university
recommendations, but they are not universal minimum-profile gates.
```

### AI Allowed Behavior

The AI may:

1. recommend one or more options
2. explain fit reasons
3. state assumptions
4. state missing information
5. state confidence level
6. suggest next comparison question
7. ask one targeted fit question if recommendation quality depends on it

### AI Forbidden Behavior

The AI should not:

1. present recommendation as guaranteed admission
2. promise eligibility approval
3. claim the student is registered
4. submit or start application
5. imply that missing university-fit signals are always mandatory before any useful guidance

### Memory/Counseling Outputs

Possible conceptual outputs:

1. recommendation_made
2. recommendation_confidence
3. recommendation_assumptions
4. recommendation_cautions
5. recommendation_reaction, if student responds

### Exit Conditions

Move to:

1. S5, if multiple options remain
2. S6, if student clearly chooses
3. S8, if student wants time
4. S7, if student says apply/register now

### Zone Bias

Green if facts are clear. Yellow if recommendation quality depends on missing or uncertain facts.

---

## 8.5 S5 — Shortlist / Comparison

### Purpose

Help the student narrow multiple options.

### Entry Signals

The student is comparing:

1. Course A vs Course B
2. University A vs University B
3. ranking vs budget
4. nearby vs further location
5. foundation vs diploma vs degree/pathway

### AI Allowed Behavior

The AI may:

1. compare trade-offs
2. rank options by fit
3. explain why one may suit better
4. ask which trade-off matters most
5. help narrow to top 1–3 options

### AI Forbidden Behavior

The AI should not:

1. force one answer when evidence is weak
2. ignore stated student constraints
3. treat a shortlist as a confirmed decision

### Memory/Counseling Outputs

Possible conceptual outputs:

1. comparison_outcome
2. expressed_preference
3. rejected_option
4. shortlist
5. student_tradeoff_priority

### Exit Conditions

Move to:

1. S6, if student confirms one choice
2. S4, if a new recommendation is needed
3. S8, if student cannot decide
4. S9, if side question appears

### Zone Bias

Green to Yellow. It becomes Yellow when the narrowing is high-impact.

---

## 8.6 S6 — Confirmed Counseling Preference

### Purpose

Record that the student has chosen a preferred counseling direction, while making clear this is not registration.

### Entry Signals

Student says something like:

```text
Yes, this is my choice for now.
I think I want Psychology at University A.
This option seems best for me.
Let’s go with this course.
```

### AI Allowed Behavior

The AI may:

1. confirm the preference
2. summarize the chosen course/program/university/pathway
3. state that this is a counseling preference
4. ask whether the student wants to continue exploring or speak to a counselor for next steps

### Counselor-Like Milestone Behavior

S6 should feel like a counseling milestone, not a database update.

When confirming a counseling preference, the AI should:

1. acknowledge progress lightly
2. restate the confirmed counseling preference
3. clearly state that this is not official application, registration, payment, enrollment, seat reservation, or CRM update
4. summarize why the option fits based on known counseling evidence
5. offer safe next steps

Safe next steps include:

1. compare one final alternative
2. take time to think or discuss with family
3. continue exploring related options
4. speak with a human counselor for official application or registration next steps

Example student-facing pattern:

```text
Great — for counseling purposes, your current preferred direction is Psychology
at University A.

This is not an official application or registration yet, but it gives us a clear
counseling direction.

Based on what you shared, this seems to fit your interest and current priorities.
From here, you can compare one final alternative, take time to think, or speak
with a human counselor for the official application step.
```

### AI Forbidden Behavior

The AI must not:

1. submit application
2. register student
3. reserve seat
4. confirm payment
5. update CRM/application status
6. claim official progress is completed

### Memory/Counseling Outputs

Possible conceptual outputs:

1. confirmed_counseling_preference
2. selected_course_or_program
3. selected_university_if_available
4. selected_pathway_if_available
5. confirmation_evidence

### Exit Conditions

Move to:

1. S7, if the student wants to apply/register
2. S8, if the student wants time
3. S3/S5, if the student reopens exploration or comparison

### Zone Bias

Yellow, because this is high-impact but still allowed autonomously with explicit confirmation.

---

## 8.7 S7 — Ready-to-Register / Apply Handoff

### Purpose

Stop autonomous counseling and prepare human handoff.

### Entry Signals

Student says:

```text
I want to apply now.
Can you register me?
Can you submit my application?
I want to enroll.
Can I reserve a seat?
How do I pay?
Can a human counselor help me?
```

### AI Allowed Behavior

The AI may:

1. explain the boundary
2. summarize student context
3. summarize confirmed preference
4. summarize unresolved questions
5. prepare handoff context
6. collect safe contact preference if later approved by policy

### AI Forbidden Behavior

The AI must not:

1. perform official action
2. claim registration/application/payment is completed
3. negotiate exceptions
4. promise approval
5. continue normal counseling if handoff is clearly required

### Memory/Counseling Outputs

Possible conceptual outputs:

1. readiness_to_register_signal
2. handoff_required
3. handoff_reason
4. handoff_summary

### Exit Conditions

This is terminal for autonomous counseling unless a human returns the student to AI counseling later or the student clearly returns to non-official exploration.

### Zone Bias

Red.

---

## 8.8 S8 — Deferral or Indecision

### Purpose

Support a student who is not ready to decide.

### Entry Signals

Student says:

```text
I need to think.
I’m still unsure.
I keep changing my mind.
I don’t know what I want.
Maybe later.
```

### AI Allowed Behavior

The AI may:

1. summarize current shortlist
2. ask what concern is blocking decision
3. offer comparison framework
4. record deferral
5. suggest next small step
6. offer human help if repeatedly stuck

### AI Forbidden Behavior

The AI should not:

1. pressure the student
2. turn indecision into confirmed preference
3. loop endlessly with the same questions

### Memory/Counseling Outputs

Possible conceptual outputs:

1. deferral
2. decision_blocker
3. student_concern
4. shortlist_saved
5. needs_more_time

### Exit Conditions

Move to:

1. S3, if student wants to explore more
2. S5, if student wants to compare
3. S6, if student decides
4. S7, if student asks for human support

### Zone Bias

Green for simple deferral. Yellow for repeated indecision or deadlock.

---

## 8.9 S9 — Detour and Resume

### Purpose

Handle side questions without losing the main journey.

### Entry Signals

Student asks something outside the current state, such as:

```text
What is the fee?
Which university is higher ranked?
Can I study near KL?
What is the difference between diploma and foundation?
How long is the course?
```

### AI Allowed Behavior

The AI may:

1. answer the side question
2. retrieve factual knowledge if needed in later implementation
3. state uncertainty if facts are incomplete
4. then resume the previous main state

### AI Forbidden Behavior

The AI should not:

1. reset the counseling journey
2. forget the previous state
3. invent missing facts
4. continue if the detour becomes red-zone

### Memory/Counseling Outputs

Possible conceptual outputs:

1. detour_topic
2. knowledge_question_answered
3. resume_target_state
4. new_preference_or_constraint_if_discovered

### Exit Conditions

Return to the prior main state unless the detour reveals a stronger transition.

### Zone Bias

Usually Green. Yellow if facts are uncertain. Red if the detour becomes official, sensitive, exception-based, or human-requested.

---

## 9. Per-Turn Operating Loop

Each student message should conceptually pass through a risk-tiered counseling operating loop.

Recommended loop:

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

### 9.1 Risk-Tiered Principle

```text
Lightweight by default.
Structured at decision points.
Strict at boundaries.
```

For ordinary Green-zone exploration, the AI may respond naturally while tracking state in the background.

For Yellow-zone moments such as recommendation, comparison, high-impact preference confirmation, missing important information, or repeated indecision, the AI must become more structured through clarification, caveats, confidence reduction, or explicit confirmation.

For Red-zone moments such as apply/register intent, official action requests, sensitive/high-risk issues, complex cases, exception requests, or human-requested support, the AI must stop autonomous counseling and prepare handoff.

---

## 10. Main Journey Backbone and Detour Overlay

Phase 1 uses a **main counseling backbone** plus **detour overlays**.

### 10.1 Main Backbone

The default counseling direction is:

```text
S1 Profile Incomplete
  → S2 Minimum Profile Reached
  → S3 Exploration
  → S4 Recommendation-Ready
  → S5 Shortlist / Comparison
  → S6 Confirmed Counseling Preference
  → S7 Ready-to-Register Handoff
```

This is not a mandatory sequence. It is the default direction the AI uses to avoid becoming aimless.

### 10.1.1 Route-Based Backbone After S2

After S2, the AI should route by the student's current direction status:

```text
Academic result known
+ no course direction
+ no university direction
→ course/pathway exploration

Academic result known
+ course direction known
+ no university direction
→ university exploration / comparison

Academic result known
+ university direction known
+ no course direction
→ course exploration within university context

Academic result known
+ course direction known
+ university direction known
→ recommendation / validation / comparison

Academic result known
+ pathway uncertainty dominant
→ pathway exploration / comparison
```

This route model prevents the AI from forcing university-fit questions before the student has a meaningful course or university direction.

### 10.1.2 Counselor-Like Navigation Principle

The route-based flow decides where the counseling should go.

The counselor-like behavior layer decides how the AI should guide the student there.

The AI should not only route the student correctly. It should help the student feel understood while moving them one useful step forward.

Default counselor-like navigation pattern:

```text
1. Reflect the student’s current situation.
2. Identify the most useful counseling route or decision point.
3. Explain why that route, trade-off, or question matters.
4. Ask one purposeful next question or offer one clear next step.
```

Short operating rule:

```text
Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

Examples:

```text
Student: I got 5 credits but I don't know what to study.

Counselor-like response direction:
So you have your academic baseline, but both course and university direction are
still open. That is normal. I would start with course/pathway exploration first,
because the university choice will be easier once we know the field.
```

```text
Student: I want Psychology but not sure which university.

Counselor-like response direction:
Since you already have Psychology in mind, we do not need to start from zero.
The next useful step is university exploration. To make that useful, we should
look at the trade-offs that matter most to you, such as ranking, budget, and
location.
```

```text
Student: Is University A better than University B?

Counselor-like response direction:
You are already in comparison mode, so I will not restart intake. The useful
thing is to compare them against your priorities, such as course fit, budget,
location, ranking, and student environment.
```

### 10.2 Detour Overlay

S9 Detour and Resume is an overlay, not a replacement state.

Example:

```text
Main state: S5 Shortlist / Comparison
Student asks: “What is the fee for this option?”
Temporary overlay: S9 Detour and Resume
Resume target: S5 Shortlist / Comparison
```

### 10.3 Detour Types

Phase 1 distinguishes four detour types:

1. informational detour
2. factual knowledge detour
3. preference-revealing detour
4. boundary detour

Safe detours are answered and resumed.

Preference-revealing detours update counseling context.

Boundary detours interrupt the journey and trigger handoff.

---

## 11. Recommendation Readiness Model

Phase 1 defines three recommendation readiness levels.

```text
R1. Not Ready to Recommend
R2. Ready for Directional Recommendation
R3. Ready for High-Quality Recommendation
```

The readiness model distinguishes between **route readiness** and **recommendation quality**.

The AI can often give useful directional guidance before it has every university-fit detail. However, confidence must remain disciplined when fit signals are missing.

### 11.1 R1 — Not Ready to Recommend

The AI does not yet have enough information to make a useful recommendation.

Usually true when:

1. academic result is missing, unclear, or unusable
2. the student has no usable course, university, or pathway direction
3. the student only asks a broad question and has not provided enough context for recommendation

AI behavior:

1. ask for the missing academic result or a lightweight direction question
2. provide general explanation if useful
3. avoid specific or confident recommendation
4. route to exploration if the student is unsure

Example:

```text
Before I recommend specific options, I need to understand your academic result and whether you already have any course or university in mind.
```

### 11.2 R2 — Ready for Directional Recommendation

The AI is ready for a directional recommendation when:

1. academic result is known
2. at least one direction is known:
   - course direction
   - university direction
   - pathway direction

Optional information may still be missing, such as:

1. ranking/prestige vs budget/value preference
2. location preference
3. budget amount
4. career goal
5. intake/timeline
6. campus preference
7. parent/family constraints
8. learning preference
9. preferred study mode

AI behavior:

1. provide directional recommendation
2. state assumptions
3. state missing information
4. use low-to-medium or medium confidence
5. ask one useful follow-up question
6. avoid pretending the recommendation is final or official

Example:

```text
Based on your result and your interest in Psychology, I can suggest a few suitable university directions. To make the university recommendation stronger, the next useful question is whether you care more about ranking/prestige, budget/value, or location.
```

### 11.3 R3 — Ready for High-Quality Recommendation

The AI is ready for a high-quality recommendation when:

1. academic result is known
2. course, university, or pathway direction is clear enough
3. enough fit signals are available to explain why the recommendation suits the student

Typical additional signals:

1. course interest or career goal
2. ranking/prestige preference
3. budget/value preference or budget sensitivity
4. preferred location or hard location constraint
5. preferred intake/timeline
6. campus preference
7. parent/family constraints
8. learning preference or study mode
9. rejected options
10. student concerns
11. comparison priorities

AI behavior:

1. give stronger recommendation
2. explain fit reasons
3. provide cautions and trade-offs
4. state confidence level
5. suggest comparison or confirmation next step

### 11.4 Recommendation Output Shape

A recommendation should usually include:

1. recommended option or shortlist
2. why it fits
3. assumptions used
4. missing information, if any
5. cautions or trade-offs
6. confidence level
7. next counseling step

Important rule:

```text
High recommendation confidence means counseling confidence only.
It does not mean guaranteed admission, eligibility approval, application,
registration, payment, seat reservation, or official status.
```

### 11.5 University-Fit Signal Placement

The following are no longer universal minimum-profile requirements:

1. ranking/prestige vs budget/value preference
2. preferred location
3. budget sensitivity
4. campus preference
5. intake or timeline
6. family/location constraints

They belong primarily in:

1. university exploration
2. university comparison
3. recommendation refinement
4. high-quality recommendation
5. hard-constraint handling when stated strongly

Examples:

```text
"I prefer KL."
→ quality-enhancing location preference

"I can only study in KL."
→ flow-driving hard location constraint

"Budget is important."
→ quality-enhancing budget sensitivity

"I cannot consider expensive universities at all."
→ flow-driving hard budget constraint
```

---

## 12. Preference Strength and Confirmation Model

Phase 1 uses a five-level preference ladder.

```text
L1. Weak Interest
L2. Expressed Interest
L3. Expressed Preference
L4. Confirmed Counseling Preference
L5. Ready-to-Register / Apply Intent
```

The AI must not silently skip levels.

### 12.1 L1 — Weak Interest

Example:

```text
Psychology sounds interesting.
Maybe business is okay.
I kind of like design.
```

Meaning:

```text
The student is showing curiosity, not preference.
```

Allowed record:

```text
weak_interest
```

### 12.2 L2 — Expressed Interest

Example:

```text
I’m interested in psychology.
I want to know more about IT.
Business is one of the courses I’m considering.
```

Meaning:

```text
The student is actively considering an area.
```

Allowed record:

```text
expressed_interest
```

### 12.3 L3 — Expressed Preference

Example:

```text
I think I prefer Psychology over Business.
I like University A more than University B.
Budget-friendly universities are better for me.
```

Meaning:

```text
The student is leaning toward one option, but has not confirmed a counseling decision.
```

Allowed record:

```text
expressed_preference
```

### 12.4 L4 — Confirmed Counseling Preference

Example:

```text
Yes, Psychology at University A is my choice for now.
Let’s go with this pathway.
This is the option I prefer.
```

Meaning:

```text
The student has confirmed a counseling direction.
This is still not official application or registration.
```

Allowed record:

```text
confirmed_counseling_preference
```

Forbidden interpretation:

```text
application_submitted
registration_completed
seat_reserved
payment_confirmed
CRM_status_updated
```

### 12.5 L5 — Ready-to-Register / Apply Intent

Example:

```text
I want to apply now.
Can you register me?
Can you submit the application?
I want to enroll.
Can I reserve my seat?
How do I pay?
```

Meaning:

```text
The student is moving from counseling into official next steps.
```

Allowed record:

```text
readiness_to_register_signal
handoff_required
handoff_reason
```

Zone:

```text
Red
```

### 12.6 Ambiguous Preference Rule

Some phrases are ambiguous:

```text
Let’s do this.
I’ll take this one.
I want this course.
Can we proceed?
```

These may mean confirmed counseling preference or ready-to-apply/register intent.

The AI should clarify once:

```text
Just to confirm, do you mean this is your preferred counseling choice for now,
or do you want to start the official application/registration step with a human counselor?
```

---

## 13. Deferral, Indecision, and Deadlock Model

Phase 1 defines four deferral/indecision types.

```text
D1. Simple Deferral
D2. Normal Indecision
D3. Repeated Indecision
D4. Counseling Deadlock
```

### 13.1 D1 — Simple Deferral

Example:

```text
I need to think first.
Maybe later.
I’ll discuss with my parents.
```

AI behavior:

1. acknowledge the pause
2. summarize current options
3. save the current shortlist or preference state
4. offer a simple next step for later
5. avoid pressure

Zone: Green.

### 13.2 D2 — Normal Indecision

Example:

```text
I’m not sure between Psychology and Business.
I like both options.
I don’t know whether ranking or budget matters more.
```

AI behavior:

1. compare trade-offs
2. ask one priority question
3. narrow to top 2–3 options
4. reflect uncertainty without forcing a choice

Zone: Green to Yellow.

### 13.3 D3 — Repeated Indecision

Example:

```text
The student keeps switching between many courses.
The student rejects every recommendation but gives no new criteria.
The student repeatedly asks for “the best” but cannot define what best means.
```

AI behavior:

1. stop adding more options
2. summarize known criteria
3. reduce the choice set
4. ask the student to pick the most important trade-off
5. offer a structured decision frame

Zone: Yellow.

### 13.4 D4 — Counseling Deadlock

Example:

```text
The student cycles repeatedly after multiple recommendation attempts.
The AI cannot form a useful recommendation with available information.
The student contradicts their own constraints and cannot choose a priority.
The student is frustrated and says the AI is not helping.
```

AI behavior:

1. stop looping
2. summarize the deadlock respectfully
3. offer human counselor support
4. preserve current context for handoff if accepted

Zone: Yellow → optional Red.

### 13.5 Escalation Ladder

```text
First uncertainty:
  clarify or compare

Second uncertainty:
  narrow options and expose trade-offs

Repeated loop:
  stop adding options and use decision frame

Persistent deadlock:
  offer human counselor support

Explicit human request:
  handoff
```

### 13.6 Decision-Support Micro-Loops

Decision-support behavior is not limited to S8 Deferral or Indecision.

The AI may use decision-support micro-loops inside:

1. S3 Exploration Mode
2. S4 Recommendation-Ready
3. S5 Shortlist / Comparison
4. S8 Deferral or Indecision

Use decision-support micro-loops when the student is:

1. overwhelmed by too many options
2. asking for “the best” without clear criteria
3. comparing options but unsure what matters most
4. repeatedly changing direction
5. rejecting recommendations without adding new criteria
6. stuck between course, university, pathway, budget, ranking, location, or family preference

The AI should use the lightest useful loop first.

#### Loop 1 — Clarify Trade-Off

Purpose:

```text
Help the student name what matters most.
```

Example:

```text
To compare properly, which matters most to you right now: career fit, budget,
location, ranking, pathway speed, or confidence that you can handle the course?
```

#### Loop 2 — Narrow Options

Purpose:

```text
Reduce many options into a manageable shortlist.
```

Example:

```text
Instead of comparing all options at once, let’s narrow this to your top two.
From what you said, Psychology and Business seem to be the strongest candidates.
```

#### Loop 3 — Reflect Blocker

Purpose:

```text
Name the likely reason the student is stuck.
```

Example:

```text
It sounds like the main blocker is not whether you like Psychology, but whether
the cost and career outcome feel safe enough.
```

#### Loop 4 — Decision Frame

Purpose:

```text
Show how the best option changes depending on the student’s priority.
```

Example:

```text
If budget is the top priority, Option A looks stronger.
If ranking and campus environment matter more, Option B may be better.
If you want the safest middle option, Option C is the balanced choice.
```

#### Loop 5 — Stop Looping

Purpose:

```text
Avoid endless repetitive counseling when the AI is no longer helping the student progress.
```

Example:

```text
We may be going in circles now. I can summarize the options and your concerns so
a human counselor can give you another perspective.
```

Decision-support micro-loops should remain non-pressuring. They help the student clarify thinking; they must not force a decision or convert indecision into confirmed preference.

---

## 14. Handoff and Red-Zone Interruption Model

Phase 1 defines six handoff trigger types.

```text
H1. Ready-to-Apply / Ready-to-Register Intent
H2. Official Action Request
H3. Payment / Seat / Enrollment Commitment
H4. Exception / Appeal / Waiver / Complex Eligibility
H5. Sensitive or High-Risk Context
H6. Student-Requested Human Support
```

### 14.1 H1 — Ready-to-Apply / Ready-to-Register Intent

Examples:

```text
I want to apply now.
I want to register.
I’m ready to proceed.
How do I enroll?
Can we start the application?
```

AI behavior:

1. stop normal autonomous counseling
2. acknowledge readiness
3. explain that official application/registration requires a human counselor
4. summarize preferred option and context
5. prepare handoff

### 14.2 H2 — Official Action Request

Examples:

```text
Can you submit my application?
Can you update my registration status?
Can you send my documents to the university?
Can you confirm I am registered?
Can you mark me as enrolled?
```

AI behavior:

1. politely enforce the official-action boundary
2. do not imply the action was done
3. prepare human handoff

### 14.3 H3 — Payment / Seat / Enrollment Commitment

Examples:

```text
Can I pay now?
Can you reserve my seat?
Can you secure my intake?
Can I pay the deposit?
Is my place confirmed?
```

AI behavior:

1. do not take payment
2. do not confirm payment
3. do not reserve a seat
4. do not promise intake availability
5. hand off to a human counselor

### 14.4 H4 — Exception / Appeal / Waiver / Complex Eligibility

Examples:

```text
Can the university make an exception?
Can I enter even though I do not meet the requirement?
Can I skip foundation?
Can my work experience replace the academic requirement?
Can I appeal?
```

AI behavior:

1. clarify minimally if needed
2. do not approve or reject the exception
3. do not promise eligibility
4. hand off if the issue materially affects admission or recommendation

### 14.5 H5 — Sensitive or High-Risk Context

Examples:

1. visa-sensitive situation
2. legal status concern
3. medical or disability accommodation
4. financial hardship
5. guardian or parent consent issue
6. confidential identity/document issue
7. special payment difficulty

AI behavior:

1. acknowledge carefully
2. avoid unnecessary sensitive details
3. ask only minimal routing clarification if useful
4. hand off to a human counselor

### 14.6 H6 — Student-Requested Human Support

Examples:

```text
Can I talk to a real counselor?
Can someone call me?
I want a human to check this.
I don’t trust the AI answer.
```

AI behavior:

1. respect the request
2. do not force continued AI counseling
3. prepare handoff context

### 14.7 Handoff Response Pattern

When handoff is required, the AI response should include:

1. boundary acknowledgment
2. student-safe explanation
3. context summary
4. human handoff next step

Example:

```text
You seem ready to move from counseling into the application or registration step.

I can help prepare the context, but a human counselor needs to handle the official application or registration process.

Here is the summary so far: you are interested in Psychology, prefer a budget-friendly university around KL, and your current preferred option is University A.

I’ll pass this context to a counselor so they can guide you on the official next step.
```

---

## 15. Journey Recovery and Resume Behavior

Phase 1 defines five recovery situations.

```text
Rcv1. Same-session resume after detour
Rcv2. Same-session resume after deferral
Rcv3. New-session resume after incomplete counseling
Rcv4. Resume after confirmed counseling preference
Rcv5. Resume after handoff boundary was previously triggered
```

### 15.1 Rcv1 — Same-Session Resume After Detour

AI behavior:

1. answer the detour
2. use the answer to improve counseling
3. return to the previous main state

### 15.2 Rcv2 — Same-Session Resume After Deferral

AI behavior:

1. briefly summarize where the student paused
2. do not restart from the beginning
3. offer the next useful step

### 15.3 Rcv3 — New-Session Resume After Incomplete Counseling

AI behavior:

1. recognize last meaningful state
2. summarize only useful context
3. ask whether the student wants to continue or update anything

### 15.4 Rcv4 — Resume After Confirmed Counseling Preference

AI behavior:

1. restate the confirmed counseling preference
2. clarify whether the student wants more exploration or official next steps
3. do not treat confirmed preference as official action

### 15.5 Rcv5 — Resume After Handoff Boundary Was Previously Triggered

AI behavior:

1. do not assume official action happened
2. do not say application or registration is complete
3. check whether the student wants to continue counseling or follow up with a human counselor

### 15.6 Direction Change Rule

Students may change their mind.

Example:

```text
Actually, I don’t want Psychology anymore. I want to consider IT.
```

AI behavior:

1. accept the correction
2. update active counseling direction
3. preserve prior direction as history, not current truth
4. return to exploration or recommendation-readiness

### 15.7 Recovery Summary Rule

When resuming, the AI should summarize:

1. current main state
2. known minimum profile
3. active interests or preferences
4. unresolved decision point
5. next useful step

The AI should not dump the full conversation history.

---

## 16. Conversation Pacing and Question Strategy

Phase 1 uses a **minimum-intake plus conversational-refinement** question strategy.

Version 1.1 clarified that the minimum intake should route the counseling flow, not collect every university-fit field upfront. Version 1.2 adds counselor-like question behavior so intake and refinement questions feel purposeful rather than mechanical.

### 16.1 Minimum Counseling Profile

The AI should collect these early:

1. academic result
2. course direction status
3. university direction status

Course direction status may be:

```text
unknown
considering_some_courses
preferred_course_exists
confirmed_counseling_course_preference
```

University direction status may be:

```text
unknown
considering_some_universities
preferred_university_exists
confirmed_counseling_university_preference
```

A natural opening question may be:

```text
To guide you properly, can I know your academic result, and whether you already have any course or university in mind?
```

### 16.2 Optional Quality-Improving Information

The AI may ask for optional details when useful:

1. career goal
2. course interest
3. ranking/prestige vs budget/value preference
4. preferred location
5. budget amount or budget sensitivity
6. intake/timeline
7. campus preference
8. parent/family constraints
9. learning style
10. preferred study mode

These details improve recommendation quality, but they should be asked based on the active counseling route.

### 16.3 Route-Based Question Strategy

If the student has no course and no university direction, the AI should ask about:

1. interests
2. strengths
3. disliked subjects
4. career direction
5. broad field preference
6. pathway fit

If the student has course direction but no university direction, the AI should ask about:

1. ranking/prestige vs budget/value preference
2. preferred location
3. budget sensitivity
4. campus preference
5. intake/timeline
6. comparison priorities

If the student has university direction but no course direction, the AI should ask about:

1. fields available or suitable within that university context
2. interests and strengths
3. preferred career direction
4. whether the university preference is strong or only tentative

If the student has both course and university direction, the AI should:

1. validate fit
2. identify missing assumptions
3. compare alternatives if needed
4. move toward recommendation or confirmation

### 16.4 Question Rules

The AI should:

1. avoid long questionnaires
2. ask one main question at a time after the minimum profile
3. not block guidance unnecessarily
4. use student answers immediately
5. ask less when the student is exploring
6. ask more carefully near decision points
7. clarify ambiguous preference or boundary language once
8. avoid unnecessary sensitive detail collection
9. avoid forcing university-fit questions before they are relevant

### 16.5 Counselor-Like Question Pattern

Questions should feel purposeful, not like a form.

Before asking a question, the AI should usually explain why the question matters to the current route.

Preferred pattern:

```text
Reflect → Explain route or trade-off → Ask one purposeful question
```

Examples:

```text
Since you already have Psychology in mind, the next useful step is choosing a
university. For that, ranking, budget, and location usually affect the best fit.
Which of those matters most to you?
```

```text
Because you do not have a course or university in mind yet, I would not start
with university ranking first. Let’s first understand what fields may suit you.
Which subjects or activities do you usually enjoy more?
```

Bad pattern:

```text
What is your result?
Preferred course?
Preferred university?
Ranking or budget?
Preferred location?
```

Better pattern:

```text
To guide you properly, I need just enough to choose the right direction: your
academic result, whether you already have a course in mind, and whether you
already have a university in mind. After that, I can guide you through the right
route instead of asking unnecessary questions.
```

### 16.6 Soft Summary Checkpoints

At important counseling moments, the AI should summarize what it believes it knows before moving forward.

Use a soft summary checkpoint before:

1. making a recommendation
2. comparing a serious shortlist
3. confirming a counseling preference
4. handling a major direction change
5. preparing handoff

Recommended structure:

```text
Let me summarize first:
- Academic result: ...
- Course direction: ...
- University direction: ...
- Current priorities or concerns: ...

Based on that, the next useful step is ...
```

The summary should be short. It should not become a long transcript summary or uncontrolled memory blob.

### 16.7 Operating Principle

```text
Collect enough to choose the right counseling route.
Do not wait until everything is perfect.
Refine as the student continues.

Reflect before routing.
Guide before asking.
Ask only the next useful question.
```

---

## 17. Counseling Action Types

Phase 1 defines twelve counseling action types.

```text
A1. Greet / Orient
A2. Collect Minimum Counseling Profile
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

Each student-facing turn should have one primary counseling action while still allowing natural conversation.

A2 now means:

```text
Collect academic result and determine whether the student already has course or university direction.
```

It does not mean collecting every university-fit criterion upfront.

### 17.1 Action Priority

When multiple actions are possible, use this priority:

```text
1. Detect Boundary
2. Prepare Handoff, if red-zone is confirmed
3. Clarify Ambiguity, if meaning affects decision or boundary
4. Answer the student’s direct question or detour
5. Update/explore counseling context
6. Recommend or compare, if ready
7. Confirm preference, if clearly appropriate
8. Ask one next useful question
```

### 17.2 Counselor-Like Action Framing

The primary counseling action should be framed in a counselor-like way.

For most non-red-zone responses, the action should include:

```text
1. acknowledge or reflect
2. guide or explain
3. ask or offer one next step
```

This framing does not create additional actions. It improves how the primary action is delivered.

### 17.3 Important Rule

The AI should usually choose **one primary counseling action per response**.

Bad pattern:

```text
Ask profile questions, explain three pathways, recommend universities, compare options,
confirm preference, and ask if the student wants to register all in one turn.
```

Better pattern:

```text
Answer the student’s current question, then take one useful next counseling step.
```

---

## 18. Zone-Based Operating Behavior

The journey state tells the AI where the student is.

The zone tells the AI how cautiously to behave.

Phase 1 uses default state zone bias plus per-turn override.

```text
Each state has a normal zone bias,
but the student’s latest message can override the zone immediately.
```

### 18.1 Green-Zone Behavior

Meaning:

```text
The student is in ordinary counseling.
```

AI may:

1. continue autonomously
2. answer naturally
3. ask lightweight questions
4. explore interests
5. recommend directionally
6. compare options
7. record weak interests or expressed preferences
8. resume after detours

Style:

```text
helpful
natural
not overly cautious
not too many caveats
one useful next step
```

### 18.2 Yellow-Zone Behavior

Meaning:

```text
The student is still within autonomous counseling,
but the AI should slow down or add safeguards.
```

Yellow conditions include:

1. important missing information
2. ambiguous intent
3. low recommendation confidence
4. high-impact narrowing
5. preference confirmation
6. eligibility uncertainty
7. conflicting goals
8. repeated indecision
9. decision-critical factual uncertainty

AI may continue, but should:

1. ask one targeted clarification
2. state assumptions
3. reduce confidence
4. give caveats
5. confirm before recording stronger preference
6. avoid over-claiming
7. avoid silently upgrading memory state
8. offer human help if deadlock persists

### 18.3 Red-Zone Behavior

Meaning:

```text
The student has crossed into a human-owned boundary.
```

Red conditions include:

1. ready-to-apply/register intent
2. official action request
3. payment request
4. seat reservation
5. application submission
6. enrollment action
7. exception/appeal/waiver request
8. sensitive/high-risk context
9. unresolved complex eligibility
10. student-requested human support

AI must:

1. stop normal autonomous counseling
2. explain the boundary
3. avoid performing or implying official action
4. summarize context
5. prepare handoff

---

## 19. Operating Context Snapshot

Phase 1 defines a lightweight conceptual operating context snapshot.

This is not the final memory schema, database model, or runtime state implementation.

The snapshot includes:

```text
1. current_main_state
2. overlay_state
3. resume_target_state
4. current_zone
5. primary_counseling_action
6. profile_completeness
7. recommendation_readiness
8. preference_strength
9. active_student_direction
10. student_posture
11. counselor_response_mode
12. unresolved_decision_point
13. handoff_status
14. next_best_counseling_move
```

### 19.1 Snapshot Field Definitions

| Field | Meaning |
|---|---|
| current_main_state | Current main journey state, S1–S8 |
| overlay_state | Temporary detour state, usually S9 or empty |
| resume_target_state | State to return to after safe detour |
| current_zone | Green, Yellow, or Red |
| primary_counseling_action | Main action type A1–A12 |
| profile_completeness | Incomplete, Minimum Complete, or Rich Profile |
| recommendation_readiness | R1, R2, or R3 |
| preference_strength | L1–L5 |
| active_student_direction | Current course/university/pathway direction |
| student_posture | Advisory counseling posture such as lost_or_confused, course_first, comparison_oriented, or indecisive |
| counselor_response_mode | Advisory response mode such as standard, reassuring_orientation, route_explanation, decision_support, summary_checkpoint, or milestone_confirmation |
| unresolved_decision_point | Current blocker or decision trade-off |
| handoff_status | No Handoff Needed, Possible Handoff — Clarify, Handoff Required, Handoff Prepared |
| next_best_counseling_move | Smallest useful next counseling action |

### 19.2 Profile Completeness Semantics

Profile completeness should use the revised minimum counseling profile.

```text
incomplete:
  academic result, course direction status, or university direction status is missing.

minimum_complete:
  academic result, course direction status, and university direction status are known.

rich_profile:
  minimum profile is complete and additional fit signals are available.
```

Important:

```text
minimum_complete does not mean enough information for a high-quality university recommendation.
It means enough information to route the counseling flow.
```

### 19.3 Student Posture and Counselor Response Mode Semantics

`student_posture` is advisory. It helps the AI choose tone, pacing, and response framing. It must not override boundary status, preference strength, recommendation readiness, or handoff triggers.

Possible values include:

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

`counselor_response_mode` describes how the next response should be framed.

Possible values include:

```text
standard
reassuring_orientation
route_explanation
decision_support
summary_checkpoint
milestone_confirmation
boundary_safe_handoff
```

Examples:

```text
lost_or_confused → reassuring_orientation
course_first → route_explanation
comparison_oriented → decision_support
decision_ready → milestone_confirmation or boundary check
human_help_seeking → boundary_safe_handoff
```

### 19.4 Example Snapshot — Course Exploration Route

Student says:

```text
I got 5 credits. I don't know what course or university I want yet.
```

Snapshot:

```text
current_main_state: S2 Minimum Profile Reached
overlay_state: none
resume_target_state: none
current_zone: Green
primary_counseling_action: A3 Explore Interest
profile_completeness: Minimum Complete
recommendation_readiness: R1 Not Ready to Recommend
preference_strength: none
active_student_direction: none
student_posture: lost_or_confused
counselor_response_mode: reassuring_orientation
unresolved_decision_point: course and university direction unclear
handoff_status: No Handoff Needed
next_best_counseling_move: explore interests, strengths, and broad course/pathway fit
```

### 19.5 Example Snapshot — Directional Recommendation Route

Student says:

```text
I got 5 credits and I’m thinking about Psychology, but I don’t know which university.
```

Snapshot:

```text
current_main_state: S2 Minimum Profile Reached
overlay_state: none
resume_target_state: none
current_zone: Green
primary_counseling_action: A6 Recommend or A3 Explore Interest
profile_completeness: Minimum Complete
recommendation_readiness: R2 Ready for Directional Recommendation
preference_strength: L2 Expressed Interest
active_student_direction: Psychology
student_posture: course_first
counselor_response_mode: route_explanation
unresolved_decision_point: university direction unclear
handoff_status: No Handoff Needed
next_best_counseling_move: validate Psychology direction and ask one university-fit question
```

---

## 20. Canonical Journey Paths

Phase 1 defines six canonical journey paths.

These do not replace the flexible state graph. They describe common operating patterns the model should support.

```text
P1. Direct Recommendation Path
P2. Exploration-First Path
P3. Comparison / Shortlist Path
P4. Detour-Heavy Path
P5. Indecision / Deferral Path
P6. Confirmed Preference to Handoff Path
```

### 20.1 P1 — Direct Recommendation Path

Student quickly provides academic result and at least one usable course, university, or pathway direction, or asks for recommendation.

Typical path:

```text
S1 → S2 → S4 → S5 → S6 or S8
```

AI should collect missing minimum counseling profile, recommend directionally, state assumptions/confidence, and avoid forcing immediate choice.

### 20.2 P2 — Exploration-First Path

Student is unsure what they want.

Typical path:

```text
S1 → S2 → S3 → S4 → S5
```

AI should collect the minimum routing profile naturally, explore interests lightly, explain course or pathway areas, and move toward recommendation when enough direction exists.

### 20.3 P3 — Comparison / Shortlist Path

Student already has options.

Typical path:

```text
S3 → S5 → S6 or S8
```

AI should compare trade-offs and confirm before recording counseling preference.

### 20.4 P4 — Detour-Heavy Path

Student asks many side questions.

Typical pattern:

```text
Current main state → S9 → return to previous main state
```

AI should answer detours, capture new preferences/constraints, and resume without restarting.

### 20.5 P5 — Indecision / Deferral Path

Student hesitates, pauses, or keeps changing direction.

Typical path:

```text
S4 or S5 → S8 → S3, S5, S6, or human support if deadlocked
```

AI should summarize, narrow options, identify blockers, avoid pressure, and offer human support if deadlock persists.

### 20.6 P6 — Confirmed Preference to Handoff Path

Student confirms a counseling preference and later wants to proceed officially.

Typical path:

```text
S5 → S6 → S7
```

AI should treat the confirmed preference as a milestone: acknowledge progress, restate the counseling preference, clarify that no official action has occurred, summarize fit, and then hand off only if the student wants application/registration.

---

## 21. Success Criteria

Phase 1 defines lightweight operating-model success criteria.

Formal evaluation scenarios, rubrics, metrics, and regression tests belong to later phases.

The Phase 1 operating model is successful if:

1. **Pre-registration scope is clear.**  
   The model does not mix pre-registration counseling with post-registration support.

2. **Minimum counseling profile collection feels natural.**  
   The AI collects academic result, course direction status, and university direction status without sounding like a long form.

3. **Counselor-like navigation is visible.**  
   The AI reflects the student's situation, explains the current route or trade-off, and asks only one purposeful next question.

4. **Questions feel purposeful.**  
   The AI explains why ranking, budget, location, academic result, course direction, or university direction is being asked when the reason is not obvious.

5. **Decision support reduces confusion.**  
   The AI uses trade-off clarification, option narrowing, blocker reflection, and decision frames instead of repeatedly adding more options.

6. **Confirmed preference feels like a milestone.**  
   S6 responses acknowledge progress, restate the counseling preference, clarify non-official status, summarize fit, and offer safe next steps.

7. **The AI guides toward counseling preference.**  
   The AI helps students move toward course/program preference, university choice, and pathway choice.

8. **Recommendations use readiness and confidence levels.**  
   The AI can recommend directionally when academic result and at least one usable direction exist, while stating assumptions and confidence.

9. **Comparison and shortlisting work.**  
   The AI can narrow options using trade-offs without pretending there is one universal best answer.

10. **Confirmed counseling preference remains non-official.**  
   The AI can confirm a counseling preference without implying application, registration, payment, seat reservation, enrollment, or CRM status.

11. **Detours do not break the journey.**  
   The AI can answer side questions and resume the previous main state.

12. **Deferral and indecision are handled safely.**  
   The AI does not pressure the student, does not loop forever, and offers human support when the AI is no longer helping.

13. **Red-zone handoff is reliable.**  
   The AI interrupts normal counseling for clear red-zone triggers and clarifies ambiguous boundary language once.

14. **Journey recovery works.**  
   The AI resumes from the last meaningful state, summarizes briefly, and lets the student continue or update direction.

---

## 22. Decisions Locked by Phase 1

Phase 1 locks the following decisions:

1. Phase 1 covers pre-registration prospects only.

2. The AI’s counseling goal is to guide students toward:
   - course/program preference
   - university choice
   - pathway choice

3. The minimum counseling profile for routing is:
   - academic result
   - course direction status
   - university direction status

4. Ranking/prestige preference, budget/value preference, preferred location, campus preference, intake/timeline, and similar fit details are not universal minimum-profile gates. They are collected when relevant to university exploration, recommendation refinement, comparison, or hard-constraint handling.

5. S2 Minimum Profile Reached means the AI can route the counseling flow, not necessarily that it can make a high-quality university recommendation.

6. The journey uses a flexible 9-state graph, not a rigid funnel.

7. S9 Detour and Resume is an overlay state, not a replacement state.

8. Counselor-like navigation follows:
   - reflect before routing
   - guide before asking
   - ask only the next useful question

9. Student posture is a non-state advisory counseling context. It may influence tone, pacing, and next-step framing, but it does not replace journey state, route context, recommendation readiness, preference strength, boundary status, or handoff status.

10. Decision-support micro-loops may be used inside exploration, recommendation, comparison, and indecision; they are not limited to S8.

11. S6 Confirmed Counseling Preference should be treated as a counseling milestone while preserving the non-official boundary.

12. Soft summary checkpoints should be used before recommendation, serious comparison, preference confirmation, major direction change, or handoff preparation.

13. Each state has a behavior contract:
   - purpose
   - entry signals
   - allowed behavior
   - forbidden behavior
   - outputs
   - exit conditions
   - zone bias

14. Each turn uses a risk-tiered operating loop:
   - lightweight in Green
   - structured in Yellow
   - strict in Red

15. Recommendation readiness uses:
   - R1 Not Ready to Recommend
   - R2 Ready for Directional Recommendation
   - R3 Ready for High-Quality Recommendation

16. R2 requires academic result plus at least one usable course, university, or pathway direction. R3 requires clearer direction plus enough fit signals for stronger recommendation quality.

17. Preference strength uses:
   - L1 Weak Interest
   - L2 Expressed Interest
   - L3 Expressed Preference
   - L4 Confirmed Counseling Preference
   - L5 Ready-to-Register / Apply Intent

18. The AI may guide students up to confirmed counseling preference, but may not treat that as official application, registration, payment, enrollment, CRM update, or seat reservation.

19. Deferral and indecision use four categories:
   - D1 Simple Deferral
   - D2 Normal Indecision
   - D3 Repeated Indecision
   - D4 Counseling Deadlock

20. Red-zone handoff triggers include:
   - ready-to-apply/register intent
   - official action requests
   - payment/seat/enrollment commitment
   - exception/appeal/waiver/complex eligibility
   - sensitive or high-risk context
   - student-requested human support

21. Recovery behavior resumes from the last meaningful counseling state while allowing the student to update or change direction.

22. Conversation pacing uses minimum intake plus conversational refinement.

23. Each response should have one primary counseling action.

24. Zone behavior uses default state zone bias plus per-turn override.

25. The AI maintains a lightweight operating context snapshot conceptually.

26. Phase 1 defines six canonical journey paths.

27. Phase 1 success criteria are lightweight operating-model criteria, not formal evaluation metrics.

---
## 23. Open Questions for Later Phases

Phase 1 intentionally defers the following questions:

1. What exact SOP/skill package schema should control each behavior?

2. How should skills be versioned, approved, tested, and rolled back?

3. Should the runtime use LangGraph, Deep Agents, a deterministic planner, or a hybrid model?

4. Where should zone classification and boundary enforcement live technically?

5. What durable memory schema should store interests, preferences, recommendation reactions, deferrals, and confirmed counseling preferences?

6. How should memory writes be validated before commit?

7. How should business knowledge be retrieved, prioritized, cited, freshness-checked, and conflict-checked?

8. How should recommendation records be persisted and evaluated?

9. What exact fields should be included in the human handoff package?

10. How should CRM read/write boundaries evolve?

11. What guardrails should run pre-response, post-response, and post-turn?

12. What evaluation scenarios, scoring rubrics, and metrics should prove red-zone recall and recommendation quality?

13. What admin tooling is needed for business users to maintain SOPs, knowledge, policies, and quality controls?

14. How should student posture be interpreted, validated, and consumed without becoming a permanent identity label?

15. Which counselor-like response patterns should be shared globally, and which should remain skill-specific examples?

16. What should the prototype vertical slice implement first?

---

## 24. Final Phase 1 Policy Statement

```text
The Phase 1 counseling operating model defines the AI counselor as the primary
pre-registration counseling guide.

The AI should guide students flexibly through minimum counseling profile collection,
route-based exploration, recommendation, comparison, preference confirmation,
deferral handling, detours, and recovery while using counselor-like navigation: 
reflect before routing, guide before asking, and ask only the next useful question.

The journey is modeled as a flexible 9-state graph with detour overlays, not a
rigid funnel.

The AI may guide students up to a confirmed counseling preference, but this
remains non-official.

When the student expresses ready-to-apply/register intent, requests official
action, asks about payment/seat/enrollment commitment, raises exception or
sensitive/high-risk issues, presents unresolved complex eligibility, or requests
human support, the AI must stop normal counseling and prepare human handoff.

The model should feel natural and counselor-like in Green, structured and confidence-disciplined in Yellow, and strict in Red.
```

---

## 25. Relationship to Next Phases

Phase 1 is now ready to inform later phases:

1. **Phase 2 — Behavior Control, SOP & Skill System**  
   Convert journey states, action types, confirmation rules, handoff triggers, revised minimum-profile collection behavior, counselor-like response patterns, decision-support micro-loops, and S6 milestone behavior into governed skills/SOPs.

2. **Phase 3 — Autonomous Runtime Strategy**  
   Execute the state graph, per-turn loop, detour overlay, boundary scan, operating context snapshot, profile completeness semantics, recommendation readiness model, student posture context, and counselor response mode.

3. **Phase 4 — Interpretation & Extraction Layer**  
   Extract and validate academic result, course direction status, university direction status, flow-driving preferences, quality-enhancing signals, optional student posture signals, boundary signals, and contradiction signals.

4. **Phase 5 — Student Memory & Counseling State**  
   Formalize durable memory fields for academic result, course/university/pathway direction, interests, preferences, deferrals, decision blockers, recommendation reactions, confirmed counseling preferences, and readiness signals, while avoiding permanent identity labels from transient posture.

5. **Phase 6 — Business Knowledge & Source Governance**  
   Define how factual detours and recommendation facts are retrieved, prioritized, filtered, and conflict-checked.

6. **Phase 7 — Recommendation & Decision Support Automation**  
   Formalize recommendation generation, explanation, soft summary checkpoints, persistence, confidence, lifecycle, and use of university-fit signals after the routing profile is known.

7. **Phase 8 — Registration Boundary & Human Handoff**  
   Define the exact handoff package, counselor-facing summary, routing behavior, and operational workflow.

8. **Phase 10 — Guardrails, Policy & Boundary Enforcement**  
   Convert Green/Yellow/Red behavior and red-zone triggers into enforceable guardrail logic.

9. **Phase 11 — Evaluation, Simulation & Quality Monitoring**  
   Convert Phase 1 success criteria into scenario suites, metrics, and regression tests.

---

## 26. One-Sentence Summary

```text
Phase 1 defines a flexible, stateful, detour-tolerant pre-registration counseling
journey where the AI uses academic result plus course/university direction status
to route students toward course, university, and pathway preferences, then guides
them with counselor-like navigation — reflect before routing, guide before asking,
and ask only the next useful question — while preserving strict handoff boundaries
for official, sensitive, complex, high-risk, or human-requested situations.
```
