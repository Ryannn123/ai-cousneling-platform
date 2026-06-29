# Phase 0 — Bounded Autonomy Baseline Specification

**Project:** AI Counseling Platform Redesign  
**Specification:** Phase 0 — Bounded Autonomy Baseline  
**Version:** 1.0  
**Date:** 2026-06-27  
**Status:** Approved baseline for Phase 0  
**Source Context:** Bounded Autonomous Counseling Platform roadmap and Phase 0 exploration discussion

---

## 1. Purpose

This specification defines the product-level autonomy baseline for the AI-first counseling platform.

It answers the core Phase 0 question:

> How autonomous should the AI counselor be, and where must autonomy stop?

This baseline should be treated as the foundation for later phases, including the counseling operating model, SOP/skill system, autonomous runtime strategy, student memory, business knowledge governance, recommendation automation, human handoff, guardrails, and evaluation.

---

## 2. Core Autonomy Stance

The platform is an **AI-first bounded autonomous counseling system**.

The AI counselor should autonomously handle ordinary student counseling, including:

1. onboarding
2. profile and academic information collection
3. interest exploration
4. course and pathway exploration
5. university and program exploration
6. option comparison
7. recommendation
8. decision support
9. preference confirmation
10. deferral handling
11. readiness-to-register detection
12. handoff context preparation

Humans are reserved for:

1. registration-ready students
2. application/enrollment/payment-related actions
3. high-risk or sensitive actions
4. complex or exception-based cases
5. student-requested human support
6. scenarios outside approved SOP coverage

### Baseline Principle

```text
Autonomy by default.
Conservative at boundaries.
```

The AI should feel like the primary student-facing counselor, not a triage bot that constantly escalates. However, once the conversation approaches official action, sensitive handling, complex eligibility, business-sensitive judgment, or high-risk consequences, the AI must slow down, clarify, or hand off.

---

## 3. Business Risk Posture

The primary business risk to avoid is **under-handoff**.

Under-handoff means the AI continues autonomously when a human counselor should have taken over.

Therefore:

```text
Red-zone detection should prioritize recall over precision.
```

In practical terms, it is better to hand off a borderline red-zone case slightly early than to allow the AI to continue through a case that required human ownership.

This does not mean the system should hand off every uncertainty. The AI should still handle normal green-zone cases and most yellow-zone cases autonomously. But once a case plausibly crosses into official, sensitive, high-risk, exception-based, or complex territory, the threshold for handoff should be conservative.

---

## 4. Automation Zones

The platform should classify counseling behavior into three automation zones:

1. Green Zone — fully autonomous
2. Yellow Zone — autonomous with caution
3. Red Zone — human handoff required

---

## 5. Green Zone — Fully Autonomous

Green-zone cases are ordinary counseling situations where the AI can continue without human review.

### Green-Zone Examples

The AI may autonomously:

1. greet and onboard the student
2. ask about academic background
3. ask about interests, goals, budget, location, and intake preferences
4. answer normal course, pathway, university, and study-option questions
5. explain course or university differences
6. compare options
7. recommend courses, pathways, universities, or programs
8. explain recommendation fit, assumptions, confidence, and cautions
9. help the student narrow choices
10. record weak interests
11. record expressed preferences
12. record rejected options
13. record concerns
14. record recommendation reactions
15. record deferrals
16. support student decision-making
17. confirm a counseling preference
18. detect readiness to register
19. prepare handoff context when needed

### Green-Zone Rule

```text
The AI may proceed autonomously through ordinary counseling as long as it does not perform or imply official business action.
```

---

## 6. Yellow Zone — Autonomous With Caution

Yellow-zone cases contain uncertainty, ambiguity, incompleteness, or elevated impact, but they do not yet require immediate human handoff.

The AI may continue autonomously, but it must use one or more of the following behaviors:

1. ask targeted clarification
2. state assumptions
3. reduce recommendation confidence
4. explain uncertainty
5. provide caveats
6. avoid over-claiming certainty
7. confirm intent before recording stronger state
8. avoid converting weak signals into confirmed decisions

### Yellow-Zone Examples

Yellow-zone cases include:

1. incomplete student profile
2. missing academic details
3. ambiguous interest or preference
4. uncertain but not clearly exceptional eligibility
5. missing budget, location, intake, or timeline information
6. low recommendation confidence
7. partial business knowledge
8. conflicting student goals
9. repeated indecision
10. ambiguous apply/register language
11. high-impact counseling decision
12. student appears close to choosing but has not confirmed intent

### Yellow-Zone Clarification Rule

```text
The AI may attempt 1–2 targeted clarifications.

If uncertainty remains and materially affects eligibility, recommendation quality,
sensitive handling, or official next steps, the AI should hand off.
```

### Yellow-Zone Continuation Target

The target is:

```text
60–75% autonomous continuation for yellow-zone cases.
```

The AI should not escalate every uncertainty. It should clarify and continue when safe.

---

## 7. Red Zone — Human Handoff Required

Red-zone cases require human ownership. The AI must stop autonomous handling and prepare a handoff.

### Red-Zone Examples

Red-zone cases include:

1. ready-to-register intent
2. ready-to-apply intent
3. enrollment intent
4. payment action or payment commitment
5. request to submit an application
6. request to register or enroll the student
7. request to reserve a seat, place, or intake
8. request to update CRM/application/registration state
9. request to send official documents to a university
10. request to confirm application, registration, payment, or enrollment completion
11. exception request
12. appeal request
13. waiver request
14. scholarship exception or negotiation
15. refund, discount, or payment-plan negotiation
16. business-sensitive arrangement
17. sensitive student, family, legal, visa, financial, or medical context
18. unresolved complex eligibility
19. conflicting authoritative business knowledge that materially affects the student decision
20. student explicitly asks for a human counselor
21. the scenario is outside approved SOP coverage

### Red-Zone Rule

```text
The AI may explain the boundary, summarize context, and prepare handoff.

The AI must not perform, imply, or confirm completion of official business actions.
```

### Red-Zone Capture Target

The target is:

```text
95–100% capture of true red-zone cases.
```

Because under-handoff is the higher business risk, borderline red-zone cases may be handed off early.

---

## 8. Target Autonomy Coverage

### Normal Counseling

```text
Target: 80–90% autonomous coverage.
```

The AI should own the student journey through exploration, comparison, recommendation, decision support, and counseling preference confirmation.

### Yellow-Zone Counseling

```text
Target: 60–75% autonomous continuation.
```

The AI should clarify, caveat, or reduce confidence before handing off.

### Red-Zone Handling

```text
Target: 95–100% red-zone capture.
```

The system should prefer catching true red-zone cases over minimizing handoff volume.

---

## 9. Counseling Decisions vs Official Actions

A central boundary of the system is:

```text
Counseling decision does not equal official action.
```

The AI may support and record counseling decisions. It may not execute or confirm official business outcomes.

---

## 10. Allowed Autonomous Counseling Outcomes

The AI may autonomously guide and record:

1. weak interests
2. expressed interests
3. expressed preferences
4. rejected options
5. comparison outcomes
6. student concerns
7. student constraints
8. recommendation reactions
9. deferrals
10. confirmed counseling preferences
11. readiness-to-register signals

### Example: Weak Interest

Student says:

```text
Psychology sounds interesting.
```

Allowed record:

```text
StudentInterest:
  course: Psychology
  strength: weak
  status: expressed_interest
```

Not allowed:

```text
StudentDecision:
  course: Psychology
  status: confirmed
```

---

### Example: Expressed Preference

Student says:

```text
I think I prefer Psychology over Business.
```

Allowed record:

```text
StudentPreference:
  preferred_option: Psychology
  compared_against: Business
  status: expressed_preference
```

Still not official.

---

### Example: Confirmed Counseling Preference

Student says:

```text
Yes, Psychology at University A is my choice for now.
```

Allowed record:

```text
CounselingDecision:
  course: Psychology
  university: University A
  status: confirmed_counseling_preference
```

Not allowed:

```text
ApplicationSubmitted
RegistrationCompleted
EnrollmentConfirmed
CRMStatusUpdated
SeatReserved
PaymentConfirmed
```

---

### Example: Ready-to-Register Intent

Student says:

```text
Great, I want to apply now.
```

Allowed record:

```text
RegistrationReadinessSignal:
  intent: apply_now
  selected_option: Psychology at University A
  handoff_required: true
```

Required action:

```text
Prepare human handoff.
Do not submit application.
Do not register student.
Do not claim official progress has been completed.
```

---

## 11. Forbidden Official Actions

The AI must not autonomously:

1. submit an application
2. register a student
3. enroll a student
4. reserve a seat, place, or intake
5. take payment
6. confirm payment
7. make payment commitments
8. promise scholarship approval
9. promise eligibility approval
10. approve exception requests
11. approve waiver requests
12. approve appeal requests
13. send official documents to a university
14. update official CRM status
15. update application status
16. update registration status
17. claim that an application has been submitted
18. claim that registration has been completed
19. claim that enrollment has been completed
20. claim that payment has been completed

### Official-Action Boundary Rule

```text
The AI may support a student’s decision.
The AI may not execute or confirm an official business outcome.
```

---

## 12. High-Impact Counseling Decisions

High-impact counseling decisions strongly shape the student’s future but are still part of counseling.

Examples:

1. choosing a preferred course
2. choosing a preferred university
3. narrowing from many options to one or two
4. choosing between foundation, diploma, degree, transfer, or pathway options
5. deciding whether to defer
6. deciding that a recommendation is the current best fit

### Classification

```text
Yellow Zone, but allowed autonomously with explicit confirmation.
```

### Rule

```text
The AI may help the student reach a confirmed counseling preference.
The AI may not convert that preference into application, registration, payment, enrollment, CRM update, or seat reservation.
```

---

## 13. High-Risk Actions

High-risk actions create operational, financial, legal, compliance, or business consequences.

Examples:

1. submit application
2. register student
3. enroll student
4. update CRM/application/registration status
5. make payment commitment
6. promise scholarship approval
7. promise eligibility approval
8. reserve seat, place, or intake
9. send official documents to university
10. modify official student records
11. claim official completion

### Classification

```text
Always Red Zone.
```

### Rule

```text
Any action that changes official business state or creates an external commitment is human-owned for now.
```

---

## 14. Sensitive Actions and Sensitive Information

Sensitive situations create risk due to the type of information or judgment involved.

Examples:

1. identity documents
2. passport or visa-sensitive information
3. financial hardship
4. payment details
5. guardian or parent consent issues
6. disability or accommodation requests
7. medical or personal hardship affecting admission
8. legal status or immigration concerns
9. internal-only counselor guidance
10. business-sensitive exceptions, discounts, waivers, or arrangements

### Classification

```text
Red Zone by default, with narrow Yellow Zone routing clarification allowed.
```

### Rule

```text
The AI may identify sensitive context, but should not independently resolve sensitive cases.
```

The AI may ask minimal routing clarification, such as:

```text
Is this related to admission eligibility, visa process, payment, or special support?
```

The AI should not deeply process highly sensitive details unless a future governed process explicitly allows it.

---

## 15. Complex-Case Handoff Rules

A case is complex when the AI cannot safely continue using:

1. approved SOPs
2. governed business knowledge
3. ordinary counseling judgment
4. normal recommendation logic

Complex cases require human handoff when they involve human judgment, exception handling, sensitive handling, unresolved factual uncertainty, or business-sensitive consequences.

---

## 16. Complex-Case Categories

### 16.1 Eligibility Complexity

Examples:

1. unclear qualification equivalency
2. failed or repeated subjects
3. partial transcripts
4. international qualification comparison
5. student does not clearly meet entry requirements
6. student asks whether they can still enter despite missing requirements

Classification:

```text
Yellow → Red
```

Rule:

```text
The AI may clarify once or explain uncertainty.
If eligibility remains unclear and affects the recommendation or admission advice, hand off.
```

---

### 16.2 Exception, Appeal, or Waiver Requests

Examples:

1. Can the university make an exception?
2. Can I appeal?
3. Can I skip the foundation pathway?
4. Can my work experience replace the academic requirement?
5. Can I still apply even though I do not meet the requirement?

Classification:

```text
Red Zone
```

Rule:

```text
The AI must not decide exceptions, appeals, or waivers. Handoff required.
```

---

### 16.3 Conflicting or Missing Business Knowledge

Examples:

1. public university data says one requirement
2. internal sheet says another requirement
3. Google Drive document appears outdated
4. intake, fee, duration, or eligibility information is missing
5. source authority is unclear

Classification:

```text
Yellow → Red
```

Rule:

```text
The AI may answer with caveat when uncertainty is minor.
If the student’s decision depends on the missing or conflicting fact, hand off.
```

---

### 16.4 Sensitive Student or Family Context

Examples:

1. visa-sensitive situation
2. legal status concern
3. guardian or parent consent issue
4. financial hardship or payment difficulty
5. disability or accommodation request
6. medical or personal hardship affecting admission
7. confidential documents or identity details

Classification:

```text
Red Zone by default
```

Rule:

```text
The AI should not deeply process or resolve sensitive cases.
It may acknowledge, ask minimal routing clarification, and hand off.
```

---

### 16.5 Business-Sensitive Negotiation

Examples:

1. scholarship exception
2. special discount
3. refund
4. payment plan
5. seat reservation
6. special intake arrangement
7. partnership, agent, or internal business rule

Classification:

```text
Red Zone
```

Rule:

```text
The AI must not negotiate, promise, or approve. Handoff required.
```

---

### 16.6 Repeated Indecision or Counseling Deadlock

Examples:

1. student cycles between many choices
2. student contradicts prior preferences repeatedly
3. student cannot decide after multiple recommendation attempts
4. AI cannot form a useful recommendation with available information

Classification:

```text
Yellow → optional Red
```

Rule:

```text
The AI should continue using decision-support behavior for a reasonable number of turns.
If the loop persists and the AI is no longer helping the student progress, offer human counselor support.
```

---

### 16.7 Student Explicitly Requests Human Help

Examples:

1. Can I talk to a real counselor?
2. I want someone to call me.
3. Can a human check this?
4. I do not trust the AI answer.

Classification:

```text
Red Zone
```

Rule:

```text
Handoff required. Do not force continued AI counseling.
```

---

## 17. Clarification-Before-Handoff Rule

For yellow-to-red complexity, the AI may ask one targeted clarification before handoff.

```text
For yellow-to-red complexity, the AI may ask one targeted clarification.
If the answer still affects eligibility, official action, sensitive handling,
or recommendation confidence, the AI should hand off.
```

The AI should not loop indefinitely or invent certainty.

---

## 18. Handoff Behavior

When handoff is required, the AI should:

1. explain the boundary in student-safe language
2. avoid alarming the student unnecessarily
3. summarize the student’s current context
4. summarize the selected or preferred option if available
5. summarize unresolved questions or risks
6. identify why handoff is required
7. prepare handoff context for a counselor
8. avoid making official claims
9. avoid promising specific outcomes

### Example Student-Facing Handoff Response

```text
You seem ready to move from counseling into the application or registration step.
I can help prepare the context, but a human counselor needs to handle the official application or registration process.
I’ll summarize your preferred option and the key details so the counselor can continue from here.
```

---

## 19. Memory Implications

The autonomy baseline requires careful state labeling.

The system must distinguish between:

1. weak interest
2. expressed interest
3. expressed preference
4. confirmed counseling preference
5. readiness-to-register signal
6. official application status
7. official registration status

### Memory Rule

```text
Weak interest, enthusiasm, or inferred preference must not silently become a confirmed counseling decision.

Confirmed counseling preference must not silently become application, registration, enrollment, payment, seat reservation, or CRM status change.
```

---

## 20. Audit Implications

Each counseling turn should be auditable enough to explain:

1. what the student said
2. what the AI interpreted
3. which automation zone applied
4. whether the case approached a boundary
5. what memory updates were proposed or committed
6. what recommendation was made
7. what knowledge was used
8. what caveats or uncertainty were surfaced
9. why the AI continued or handed off
10. whether any red-zone condition was detected

---

## 21. Evaluation Implications

The Phase 0 baseline should be tested with scenario suites covering:

1. normal autonomous counseling
2. weak interest vs confirmed preference
3. confirmed preference vs application intent
4. ready-to-register detection
5. ambiguous apply/register language
6. eligibility uncertainty
7. exception and appeal requests
8. sensitive student situations
9. conflicting knowledge
10. repeated indecision
11. human-requested handoff
12. red-zone under-handoff prevention
13. over-handoff measurement
14. boundary-safe student-facing responses

The most important evaluation priority is red-zone recall.

```text
The system should be optimized to avoid missing true handoff-required cases.
```

---

## 22. Final Phase 0 Policy Statement

```text
The platform is an AI-first bounded autonomous counseling system.

The AI counselor should autonomously handle ordinary student counseling,
including profile collection, interest exploration, option comparison,
recommendation, decision support, and confirmed counseling preferences.

The AI should continue through most yellow-zone uncertainty using clarification,
caveats, and confidence reduction.

The AI must hand off red-zone cases, including registration/application intent,
official business actions, sensitive or high-risk scenarios, exception handling,
unresolved complex eligibility, conflicting authoritative knowledge, and
student-requested human support.

Because under-handoff is the higher business risk, boundary detection should
prioritize catching true red-zone cases, even at the cost of some extra handoffs.
```

---

## 23. Decisions Locked by Phase 0

This phase locks the following decisions:

1. The AI is the primary student-facing counselor.
2. The AI is autonomous by default for ordinary counseling.
3. Humans are reserved for registration, complex cases, sensitive/high-risk actions, and explicit human requests.
4. The AI may guide students to confirmed counseling preferences.
5. The AI may not perform official registration, application, payment, enrollment, CRM status, or seat-reservation actions.
6. Green-zone cases are fully autonomous.
7. Yellow-zone cases are autonomous with caution.
8. Red-zone cases require human handoff.
9. Under-handoff is the greater business risk.
10. Red-zone detection should favor recall over precision.
11. Weak interest must not become confirmed decision silently.
12. Confirmed counseling preference must not become official action silently.
13. Complex cases require handoff when normal SOP-guided counseling is insufficient.
14. Phase 1 may now define the autonomous counseling operating model using this baseline.

---

## 24. Open Questions for Later Phases

The following questions are intentionally deferred:

1. What exact counseling journey should the AI guide across the student lifecycle?
2. What SOP/skill packages are needed for each major counseling situation?
3. What runtime architecture should enforce this boundary model?
4. What memory schema should represent interests, preferences, decisions, and readiness signals?
5. How should business knowledge be retrieved, filtered, cited, and conflict-checked?
6. How should recommendation records be generated and evaluated?
7. What handoff package should be created for human counselors?
8. How should CRM read/write boundaries evolve over time?
9. What guardrail checks should run pre-response, post-response, and post-turn?
10. What scenario simulations prove the AI is safe enough for autonomous counseling?

---
