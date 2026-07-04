# Phase 1 — Autonomous Counseling Operating Model Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 1 — Autonomous Counseling Operating Model  
**Version:** 1.0  
**Date:** 2026-06-28  
**Status:** Approved exploration output for Phase 1  
**Source Context:** Phase 0 Bounded Autonomy Baseline, Updated Exploration Roadmap, and Phase 1 exploration discussion

---

## 1. Purpose

This specification defines the **Phase 1 autonomous counseling operating model** for the AI-first counseling platform.

It answers the Phase 1 core question:

```text
What counseling journey should the AI autonomously guide before red-zone handoff is required?
```

Phase 1 defines how the AI counselor should operate across the **pre-registration student journey**, including profile collection, exploration, recommendation, comparison, preference confirmation, deferral handling, detours, recovery, and red-zone handoff.

This specification intentionally stays at the **operating-model level**. It does not define implementation architecture, runtime design, durable memory schema, SOP package format, knowledge retrieval implementation, CRM workflow, evaluation metrics, or prototype details. Those belong to later phases.

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
| S2 Minimum Profile Reached | Minimum useful recommendation profile is known | Green / Yellow |
| S3 Exploration Mode | Student is exploring courses, programs, universities, or pathways | Green |
| S4 Recommendation-Ready | AI has enough context to recommend | Green / Yellow |
| S5 Shortlist / Comparison | Student is comparing or narrowing options | Green / Yellow |
| S6 Confirmed Counseling Preference | Student confirms a counseling direction, not official action | Yellow |
| S7 Ready-to-Register / Apply Handoff | Student crosses into official next-step intent | Red |
| S8 Deferral or Indecision | Student pauses, hesitates, or is stuck | Green / Yellow |
| S9 Detour and Resume | Student asks side question before returning to main journey | Green / Yellow / Red depending on content |

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
| Student provides academic results, university preference type, and location | S1 | S2 | Green | Move into useful guidance |
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

Identify the student as a pre-registration prospect and collect the minimum useful counseling profile.

### Entry Signals

The student starts a conversation and has not provided enough information for meaningful guidance.

### AI Allowed Behavior

The AI may:

1. greet naturally
2. ask what the student is looking for
3. ask for academic results
4. ask preferred study location
5. ask ranking/prestige university vs budget/value university preference
6. answer simple initial questions

### AI Forbidden Behavior

The AI should not:

1. recommend too confidently
2. force a long questionnaire
3. treat casual interest as confirmed preference
4. move into registration/application action

### Memory/Counseling Outputs

Possible conceptual outputs:

1. academic_result_collected
2. location_preference_collected
3. university_preference_type_collected
4. weak_interest, if mentioned

### Exit Conditions

Move to S2 once the minimum profile is known.

### Zone Bias

Mostly Green.

---

## 8.2 S2 — Minimum Profile Reached

### Purpose

Determine the best next counseling move now that basic recommendation context exists.

### Entry Signals

The AI knows:

1. academic results
2. ranking/prestige vs budget/value university preference
3. preferred location

### AI Allowed Behavior

The AI may:

1. ask one optional quality-improving question
2. move into course/pathway exploration
3. move into university exploration
4. prepare a low-to-medium confidence recommendation
5. explain assumptions

### AI Forbidden Behavior

The AI should not:

1. delay forever by asking too many questions
2. pretend optional information is required
3. overstate recommendation confidence

### Memory/Counseling Outputs

Possible conceptual outputs:

1. minimum_profile_reached
2. optional_missing_info
3. recommendation_readiness_level

### Exit Conditions

Move to:

1. S3, if the student still wants to explore
2. S4, if enough information exists to recommend
3. S9, if the student asks a side question
4. S7, if the student jumps to apply/register

### Zone Bias

Green, sometimes Yellow if important information is incomplete.

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

Minimum recommendation basis:

1. academic results
2. location
3. ranking/prestige vs budget/value preference
4. some course/pathway/university direction

### AI Allowed Behavior

The AI may:

1. recommend one or more options
2. explain fit reasons
3. state assumptions
4. state missing information
5. state confidence level
6. suggest next comparison question

### AI Forbidden Behavior

The AI should not:

1. present recommendation as guaranteed admission
2. promise eligibility approval
3. claim the student is registered
4. submit or start application

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

### 11.1 R1 — Not Ready to Recommend

The AI does not yet have enough information to make a useful recommendation.

Usually missing one or more of:

1. academic results
2. ranking/prestige university vs budget/value university preference
3. preferred location

AI behavior:

1. ask for missing minimum information
2. provide general explanation if useful
3. avoid specific or confident recommendation

### 11.2 R2 — Ready for Directional Recommendation

The minimum profile is available, but some quality-improving information is missing.

Known:

1. academic results
2. ranking/prestige vs budget/value preference
3. location

Optional information may be missing:

1. career goal
2. course interest
3. budget amount
4. intake/timeline
5. campus preference
6. parent/family constraints
7. learning preference

AI behavior:

1. provide directional recommendation
2. state assumptions
3. state missing information
4. use medium confidence
5. ask one useful follow-up question

### 11.3 R3 — Ready for High-Quality Recommendation

The AI has the minimum profile plus enough optional context to make a stronger recommendation.

Typical additional signals:

1. course interest or career goal
2. budget sensitivity
3. preferred intake/timeline
4. campus preference
5. rejected options
6. student concerns
7. comparison priorities

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

### 16.1 Minimum Required Profile

The AI should collect these early:

1. academic results
2. ranking/prestige vs budget/value university preference
3. preferred location

### 16.2 Optional Quality-Improving Information

The AI may ask for optional details when useful:

1. career goal
2. course interest
3. budget amount
4. intake/timeline
5. campus preference
6. parent/family constraints
7. learning style
8. preferred study mode

### 16.3 Question Rules

The AI should:

1. avoid long questionnaires
2. ask one main question at a time after the minimum profile
3. not block guidance unnecessarily
4. use student answers immediately
5. ask less when the student is exploring
6. ask more carefully near decision points
7. clarify ambiguous preference or boundary language once
8. avoid unnecessary sensitive detail collection

### 16.4 Operating Principle

```text
Collect enough to be useful.
Do not wait until everything is perfect.
Refine as the student continues.
```

---

## 17. Counseling Action Types

Phase 1 defines twelve counseling action types.

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

Each student-facing turn should have one primary counseling action while still allowing natural conversation.

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

### 17.2 Important Rule

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
10. unresolved_decision_point
11. handoff_status
12. next_best_counseling_move
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
| unresolved_decision_point | Current blocker or decision trade-off |
| handoff_status | No Handoff Needed, Possible Handoff — Clarify, Handoff Required, Handoff Prepared |
| next_best_counseling_move | Smallest useful next counseling action |

### 19.2 Example Snapshot

Student says:

```text
I got 5 credits, prefer budget-friendly universities, and want to study around KL.
I’m thinking about Psychology but also maybe Business.
```

Snapshot:

```text
current_main_state: S2 Minimum Profile Reached
overlay_state: none
resume_target_state: none
current_zone: Green
primary_counseling_action: A3 Explore Interest
profile_completeness: Minimum Complete
recommendation_readiness: R2 Ready for Directional Recommendation
preference_strength: L2 Expressed Interest
active_student_direction: Psychology / Business
unresolved_decision_point: course direction unclear
handoff_status: No Handoff Needed
next_best_counseling_move: compare Psychology vs Business by fit and career direction
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

Student quickly provides minimum context or asks for recommendation.

Typical path:

```text
S1 → S2 → S4 → S5 → S6 or S8
```

AI should collect missing minimum profile, recommend directionally, state assumptions/confidence, and avoid forcing immediate choice.

### 20.2 P2 — Exploration-First Path

Student is unsure what they want.

Typical path:

```text
S1 → S3 → S2 → S4 → S5
```

AI should explore interests lightly, explain course areas, ask minimum profile questions naturally, and move toward recommendation when enough signal exists.

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

AI should confirm the preference as non-official, then hand off if the student wants application/registration.

---

## 21. Success Criteria

Phase 1 defines lightweight operating-model success criteria.

Formal evaluation scenarios, rubrics, metrics, and regression tests belong to later phases.

The Phase 1 operating model is successful if:

1. **Pre-registration scope is clear.**  
   The model does not mix pre-registration counseling with post-registration support.

2. **Minimum profile collection feels natural.**  
   The AI collects academic results, university preference type, and location without sounding like a long form.

3. **The AI guides toward counseling preference.**  
   The AI helps students move toward course/program preference, university choice, and pathway choice.

4. **Recommendations use readiness and confidence levels.**  
   The AI can recommend early when minimum context exists, while stating assumptions and confidence.

5. **Comparison and shortlisting work.**  
   The AI can narrow options using trade-offs without pretending there is one universal best answer.

6. **Confirmed counseling preference remains non-official.**  
   The AI can confirm a counseling preference without implying application, registration, payment, seat reservation, enrollment, or CRM status.

7. **Detours do not break the journey.**  
   The AI can answer side questions and resume the previous main state.

8. **Deferral and indecision are handled safely.**  
   The AI does not pressure the student, does not loop forever, and offers human support when the AI is no longer helping.

9. **Red-zone handoff is reliable.**  
   The AI interrupts normal counseling for clear red-zone triggers and clarifies ambiguous boundary language once.

10. **Journey recovery works.**  
   The AI resumes from the last meaningful state, summarizes briefly, and lets the student continue or update direction.

---

## 22. Decisions Locked by Phase 1

Phase 1 locks the following decisions:

1. Phase 1 covers pre-registration prospects only.

2. The AI’s counseling goal is to guide students toward:
   - course/program preference
   - university choice
   - pathway choice

3. The minimum profile for useful recommendation is:
   - academic results
   - ranking/prestige vs budget/value university preference
   - preferred location

4. The journey uses a flexible 9-state graph, not a rigid funnel.

5. S9 Detour and Resume is an overlay state, not a replacement state.

6. Each state has a behavior contract:
   - purpose
   - entry signals
   - allowed behavior
   - forbidden behavior
   - outputs
   - exit conditions
   - zone bias

7. Each turn uses a risk-tiered operating loop:
   - lightweight in Green
   - structured in Yellow
   - strict in Red

8. Recommendation readiness uses:
   - R1 Not Ready to Recommend
   - R2 Ready for Directional Recommendation
   - R3 Ready for High-Quality Recommendation

9. Preference strength uses:
   - L1 Weak Interest
   - L2 Expressed Interest
   - L3 Expressed Preference
   - L4 Confirmed Counseling Preference
   - L5 Ready-to-Register / Apply Intent

10. The AI may guide students up to confirmed counseling preference, but may not treat that as official application, registration, payment, enrollment, CRM update, or seat reservation.

11. Deferral and indecision use four categories:
   - D1 Simple Deferral
   - D2 Normal Indecision
   - D3 Repeated Indecision
   - D4 Counseling Deadlock

12. Red-zone handoff triggers include:
   - ready-to-apply/register intent
   - official action requests
   - payment/seat/enrollment commitment
   - exception/appeal/waiver/complex eligibility
   - sensitive or high-risk context
   - student-requested human support

13. Recovery behavior resumes from the last meaningful counseling state while allowing the student to update or change direction.

14. Conversation pacing uses minimum intake plus conversational refinement.

15. Each response should have one primary counseling action.

16. Zone behavior uses default state zone bias plus per-turn override.

17. The AI maintains a lightweight operating context snapshot conceptually.

18. Phase 1 defines six canonical journey paths.

19. Phase 1 success criteria are lightweight operating-model criteria, not formal evaluation metrics.

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

14. What should the prototype vertical slice implement first?

---

## 24. Final Phase 1 Policy Statement

```text
The Phase 1 counseling operating model defines the AI counselor as the primary
pre-registration counseling guide.

The AI should guide students flexibly through profile collection, exploration,
recommendation, comparison, preference confirmation, deferral handling, detours,
and recovery.

The journey is modeled as a flexible 9-state graph with detour overlays, not a
rigid funnel.

The AI may guide students up to a confirmed counseling preference, but this
remains non-official.

When the student expresses ready-to-apply/register intent, requests official
action, asks about payment/seat/enrollment commitment, raises exception or
sensitive/high-risk issues, presents unresolved complex eligibility, or requests
human support, the AI must stop normal counseling and prepare human handoff.

The model should feel natural in Green, structured in Yellow, and strict in Red.
```

---

## 25. Relationship to Next Phases

Phase 1 is now ready to inform later phases:

1. **Phase 2 — Behavior Control, SOP & Skill System**  
   Convert journey states, action types, confirmation rules, and handoff triggers into governed skills/SOPs.

2. **Phase 3 — Autonomous Runtime Strategy**  
   Decide how the state graph, per-turn loop, detour overlay, boundary scan, and operating context snapshot are executed.

3. **Phase 4 — Student Memory & Counseling State**  
   Formalize durable memory fields for profile, interests, preferences, deferrals, recommendation reactions, confirmed counseling preferences, and readiness signals.

4. **Phase 5 — Business Knowledge & Source Governance**  
   Define how factual detours and recommendation facts are retrieved, prioritized, filtered, and conflict-checked.

5. **Phase 6 — Recommendation & Decision Support Automation**  
   Formalize recommendation generation, explanation, persistence, confidence, and lifecycle.

6. **Phase 7 — Registration Boundary & Human Handoff**  
   Define the exact handoff package, counselor-facing summary, routing behavior, and operational workflow.

7. **Phase 9 — Guardrails, Policy & Boundary Enforcement**  
   Convert Green/Yellow/Red behavior and red-zone triggers into enforceable guardrail logic.

8. **Phase 10 — Evaluation, Simulation & Quality Monitoring**  
   Convert Phase 1 success criteria into scenario suites, metrics, and regression tests.

---

## 26. One-Sentence Summary

```text
Phase 1 defines a flexible, stateful, detour-tolerant pre-registration counseling
journey where the AI autonomously guides students toward course, university, and
pathway preferences while preserving strict handoff boundaries for official,
sensitive, complex, high-risk, or human-requested situations.
```
