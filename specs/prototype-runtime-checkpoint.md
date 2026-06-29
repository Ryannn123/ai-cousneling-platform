# Prototype Runtime Checkpoint

**Project:** AI Counseling Platform Redesign  
**Checkpoint Date:** 2026-06-28  
**Checkpoint Status:** Runtime vertical slice proven; not production-functional  
**Intended Reader:** Future roadmap exploration sessions, especially Phase 4

---

## 1. Purpose

This checkpoint records what the prototype has proven and what it has intentionally left shallow.

Future phases should use this prototype as evidence for the runtime control loop, not as the final product architecture, memory model, knowledge model, recommendation model, or production implementation.

---

## 2. Prototype Status

The prototype proves the Phase 3 / Phase 12 runtime vertical slice:

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

The current test suite covers the core vertical slice plus adversarial safety cases:

```text
1. red-zone official-action detection
2. ambiguous proceed clarification
3. official-action memory output blocking
4. confirmed counseling preference does not become registration truth
5. weak interest is not over-promoted
6. draft skills are rejected
7. approved skills are loaded with hashes
8. knowledge gateway caveats unknown facts
9. recommendation -> detour -> comparison -> preference -> handoff journey
10. detour and resume behavior
11. human-requested handoff
12. invalid AI official-action response fallback/blocking
13. Gemini provider structured-output request wiring
14. malformed Gemini JSON shape rejected before runtime validation
```

Latest verified command:

```bash
npm test
```

Verified result:

```text
16/16 tests passing
```

---

## 3. Proven Runtime Principle

The prototype validates the central runtime principle:

```text
AI proposes.
Platform validates.
Only validated outputs commit.
```

The platform, not the AI, owns final authority for:

```text
1. final boundary zone
2. handoff decision
3. selected runtime skill
4. loaded boundary rules
5. allowed memory output types
6. blocked official-action outputs
7. committed operating context
8. committed memory/recommendation/handoff outputs
9. audit evidence
```

---

## 4. What The Prototype Actually Proves

### 4.1 Runtime Control Loop

The prototype has a real orchestrated turn pipeline. It is not only a UI mock.

Each turn:

```text
1. loads previous conversation runtime state
2. evaluates boundary signals
3. builds an operating context snapshot
4. selects SKILL.md artifacts by approved metadata
5. calls a knowledge gateway for factual detours
6. calls an AI execution client or mock fallback
7. validates AI-proposed outputs
8. commits accepted outputs only
9. records blocked outputs
10. writes structured audit evidence
```

### 4.2 Skill Control Metadata

The prototype proves that approved `SKILL.md` packages can be loaded, filtered, selected, hashed, and audited.

The prototype uses skill metadata for:

```text
1. artifact type
2. approval status
3. applicable states
4. applicable actions
5. applicable zones
6. recommendation readiness constraints
7. allowed memory outputs
8. forbidden memory outputs
9. boundary rule requirements
10. content hash auditability
```

### 4.3 Boundary And Official-Action Safety

The prototype proves that ordinary counseling can continue while official actions are blocked or handed off.

Blocked official-action concepts include:

```text
1. application submitted
2. registration completed
3. enrollment confirmed
4. payment confirmed
5. seat reserved
6. CRM status updated
```

### 4.4 Knowledge Gateway Placement

The prototype proves the placement of a runtime-owned knowledge gateway before response generation for factual detours.

The seed knowledge catalog is only demo data. The important proven contract is:

```text
The AI should receive answerability, safe facts, sources, caveats, and uncertainty.
The AI should not freely invent official facts.
```

### 4.5 Provider Safety Wrapper

The prototype supports OpenAI and Gemini execution clients.

Gemini is configured with:

```text
1. AI_PROVIDER=gemini
2. GEMINI_API_KEY
3. optional GEMINI_MODEL or AI_MODEL
4. JSON response MIME type
5. response schema request
6. post-parse AIExecutionResult validation
7. safe fallback when provider JSON shape is invalid
```

Provider output is not trusted just because it is valid JSON.

---

## 5. Intentional Prototype Limits

The following areas are intentionally shallow and should not be mistaken for production design.

### 5.1 AI Extraction And Classification

The prototype uses deterministic heuristics for:

```text
1. boundary signal detection
2. profile signal extraction
3. factual detour detection
4. comparison detection
5. preference confirmation detection
6. journey state transitions
7. recommendation readiness
8. preference strength movement
```

This is acceptable for the prototype.

Future AI classifiers may replace some heuristics, but classifier outputs must still pass platform validation.

### 5.2 Counseling Quality

The prototype does not prove that the AI is already a great counselor.

It does not deeply prove:

```text
1. nuanced counselor tone
2. advanced interpretation
3. rich personalization
4. high-quality recommendation reasoning
5. emotionally intelligent response style
6. production-grade conversation quality
```

Current response quality only needs to be understandable, bounded, and structurally valid.

### 5.3 Skill Body Prompting

The prototype primarily proves skill metadata control.

It does not yet prove that the Markdown body of selected skills, playbooks, or boundary rules meaningfully shapes live-model behavior.

Future live-model evaluation should include:

```text
1. selected runtime skill body
2. selected playbook excerpt when relevant
3. mandatory boundary rule body excerpts
4. strict conflict precedence
5. metadata as enforceable contract
```

Metadata must remain platform-enforced even after skill bodies are included in prompts.

### 5.4 Durable Memory

The current file-based conversation state is prototype storage only.

It should not be treated as the final memory schema.

### 5.5 Production Knowledge

The seed catalog is only enough to prove knowledge gateway placement.

It does not solve:

```text
1. source freshness
2. source priority
3. source conflict handling
4. Google Sheets ingestion
5. Google Drive retrieval
6. public university data
7. internal-only knowledge visibility
8. official source confirmation
```

### 5.6 CRM And Official Truth

The prototype does not integrate with CRM.

It intentionally keeps counseling memory separate from official application, registration, payment, enrollment, seat, and CRM truth.

---

## 6. What Phase 4 Should Inherit

Phase 4 should inherit these contracts and constraints from the prototype.

### 6.1 Accepted Operating Context

Phase 4 should define how accepted operating context is durably represented, including:

```text
1. current main state
2. overlay state
3. resume target state
4. current zone
5. primary counseling action
6. profile completeness
7. recommendation readiness
8. preference strength
9. active student direction
10. unresolved decision point
11. handoff status
12. next best counseling move
```

### 6.2 Accepted Memory Outputs

Phase 4 should define durable records for accepted memory outputs.

Each accepted memory record should likely include:

```text
1. memory id
2. type
3. value
4. confidence
5. evidence
6. source turn id
7. source message id
8. source skill name
9. source skill version
10. source skill content hash
11. validator result
12. timestamp
13. current/active status
```

### 6.3 Blocked Outputs

Phase 4 should preserve blocked output records.

Blocked records are important for:

```text
1. safety audit
2. model evaluation
3. skill regression analysis
4. red-zone monitoring
5. under-handoff/over-handoff tuning
```

Blocked records should not silently disappear.

### 6.4 Evidence And Confidence

Phase 4 should treat evidence and confidence as first-class fields, not prose buried in summaries.

This is especially important for:

```text
1. weak interest
2. expressed interest
3. expressed preference
4. confirmed counseling preference
5. recommendation reaction
6. readiness-to-register signal
7. handoff reason
```

### 6.5 Preference History And Corrections

Phase 4 must handle changes over time.

Students may:

```text
1. change preferred course
2. reject a previous option
3. move from weak interest to confirmed preference
4. downgrade certainty
5. defer the decision
6. contradict earlier constraints
7. clarify ambiguous proceed language
```

The memory model should support current truth and historical records.

### 6.6 Recommendation And Handoff Records

Phase 4 should define durable state for:

```text
1. recommendation shown
2. recommendation confidence
3. assumptions
4. cautions
5. student reaction
6. shortlist
7. handoff required
8. handoff prepared
9. handoff trigger type
10. handoff summary
```

### 6.7 CRM Truth Separation

Phase 4 must preserve this boundary:

```text
Counseling memory may record preferences, signals, recommendations, and handoff readiness.
Counseling memory must never become official application, registration, payment, enrollment, seat, or CRM truth.
```

Official truth remains outside autonomous counseling memory.

---

## 7. Recommended Phase 4 Starting Question

Phase 4 should start with:

```text
What durable memory and counseling state model can persist Phase 3 validated outputs
while preserving Phase 0 boundaries, Phase 1 preference/readiness state, and Phase 2
skill output permissions?
```

The first design pass should prioritize:

```text
1. memory categories
2. record schemas
3. current truth vs event history
4. correction behavior
5. evidence/confidence model
6. blocked output retention
7. skill/version/hash traceability
8. handoff state
9. CRM separation
10. prototype-to-production storage boundary
```

---

## 8. Open Risks For Future Phases

Future phases should address these known gaps:

```text
1. live Gemini schema adherence across real scenarios
2. live OpenAI/Gemini counseling quality comparison
3. skill body prompt injection and precedence behavior
4. AI classifier replacement for heuristic extraction
5. durable memory schema
6. correction and contradiction handling
7. recommendation lifecycle model
8. handoff package structure
9. knowledge freshness and source governance
10. production evaluation labels and dashboards
11. CRM read/write boundary
12. production storage, privacy, and retention
```

---

## 9. How To Use This Checkpoint

Use this checkpoint as a boundary marker:

```text
The prototype has proven the runtime control loop.
The next exploration should design durable memory/state around validated outputs.
Do not keep expanding prototype behavior before Phase 4 clarifies what must persist.
```

The prototype should remain useful as a test harness after Phase 4 defines memory contracts.

