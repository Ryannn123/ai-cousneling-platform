# Phase 4 Interpretation & Extraction Layer Spec v1.3

**Project:** AI Counseling Platform Redesign  
**Status:** Current prototype contract  
**Purpose:** Replace broad per-turn interpretation snapshots with validated semantic delta proposals while preserving bounded autonomy, platform validation, runtime safety, and Phase 5 memory ownership.

---

## 1. Core Contract

Phase 4 v1.3 converts raw student language into semantic delta proposals and runtime-only signal proposals.

```text
SemanticDeltaResult
-> SemanticDeltaValidator
-> AcceptedSemanticDelta
```

The LLM may extract and interpret, but it does not own truth. The platform validates every candidate before downstream runtime modules consume it.

```text
SemanticDeltaResult is a proposal, not truth.
AcceptedSemanticDelta is not durable memory.
AcceptedSemanticDelta is not CRM truth.
AcceptedSemanticDelta is not official application, registration, enrollment, payment, seat, or business-status truth.
```

---

## 2. Raw LLM Output

The raw extractor output is:

```ts
type SemanticDeltaResult = {
  memoryDeltaCandidates: {
    flowDrivingDeltas: {
      academicResults: AcademicResultDelta[];
      coursesConsidering: CourseDelta[];
      confirmedCounselingCoursePreferences?: CourseDelta;
      universitiesConsidering: UniversityDelta[];
      confirmedCounselingUniversityPreferences?: UniversityDelta;
      pathwaysConsidering: PathwayDelta[];
      confirmedCounselingPathwayPreferences?: PathwayDelta;
    };
    qualityEnhancingDeltas: QualityEnhancingDelta[];
  };
  runtimeOnlySignalCandidates: RuntimeOnlySignalCandidate[];
};
```

The LLM must not output platform metadata such as conversation, turn, message, timestamp, model, prompt, validator, skill hash, or audit IDs.

The LLM must not output minimum-profile state or derived routing fields such as `academicResultKnown`, `courseDirectionStatusKnown`, `universityDirectionStatusKnown`, `routeReadiness`, or `suggestedCounselingRoute`.

---

## 3. Delta Rules

Phase 4 v1.3 activates only one delta operation:

```ts
type DeltaOperation = "add_new";
```

Flow-driving deltas may include academic results, courses, universities, pathways, rejected options, and confirmed counseling preferences. They must not include official business truth such as application submitted, registration completed, payment confirmed, seat reserved, enrollment confirmed, or CRM updated.

Quality-enhancing deltas represent counseling-relevant personalization:

```ts
type QualityEnhancingDelta = {
  kind: "quality_enhancing";
  operation: "add_new";
  type:
    | "concern_or_blocker"
    | "constraint"
    | "preference"
    | "goal_or_motivation"
    | "influence_or_context"
    | "other";
  value: Record<string, unknown>;
  usefulness: "low" | "medium" | "high";
  sensitivity: "none" | "possibly_sensitive" | "sensitive";
  constraintStrength?: "soft_preference" | "hard_constraint";
  confidence: "low" | "medium" | "high";
  evidence: { quote: string }[];
};
```

Use `concern_or_blocker` for worry, hesitation, confusion, blockers, indecision, or not knowing what course, university, or pathway to choose.

Use `goal_or_motivation` only for positive desired outcomes such as career interest, job prospects, migration, prestige, or personal purpose. Do not use it for uncertainty or missing direction.

Corrections, removals, contradictions, preference upgrades/downgrades, stale memory replacement, and confidence changes are not memory mutation behaviors in Phase 4 v1.3. They may surface as runtime-only ambiguity signals and are deferred to Phase 5 memory/state policy.

---

## 4. Runtime-Only Signals

Runtime-only candidates affect the current turn by default and do not automatically become durable memory.

```ts
type RuntimeOnlySignalCandidate =
  | BoundaryRuntimeSignal
  | KnowledgeNeedRuntimeSignal
  | StudentPostureRuntimeSignal
  | AmbiguityRuntimeSignal;
```

Runtime-only signals include boundary risks, official-action intent, payment/seat/enrollment requests, human-help requests, sensitive context, knowledge needs, student posture, ambiguous proceed language, possible correction or contradiction, and unclear intent.

They may guide the boundary resolver, knowledge gateway, operating context manager, skill control, execution context, validation pipeline, audit writer, and memory merge eligibility. They must not directly commit durable memory, recommendations, handoff records, CRM status, or official business truth.

---

## 5. Accepted Artifact

Downstream modules consume only:

```ts
type AcceptedSemanticDelta = {
  platformMetadata: SemanticDeltaMetadata;
  acceptedMemoryDeltas: AcceptedMemoryDeltas;
  acceptedRuntimeOnlySignals: AcceptedRuntimeOnlySignal[];
  rejectedCandidates: RejectedSemanticCandidate[];
  downgradedCandidates: DowngradedSemanticCandidate[];
  validationEvents: SemanticDeltaValidationEvent[];
  status:
    | "accepted"
    | "accepted_with_downgrades"
    | "requires_clarification"
    | "rejected"
    | "safe_fallback";
};
```

Platform metadata is attached outside the LLM response and includes conversation, turn, message, created time, extractor provider/model/schema version, validator versions, optional skill context, and optional audit references.

---

## 6. Runtime Placement

```text
Student message
-> FastBoundarySignalScanner
-> AISemanticDeltaExtractor
-> SemanticDeltaValidator
-> AcceptedSemanticDelta
-> Memory/state merge eligibility
-> Current truth derivation
-> BoundaryResolver
-> OperatingContextManager
-> SkillControlService
-> KnowledgeGateway
-> ExecutionContextComposer
-> AIExecutionClient
-> ValidationPipeline
-> OutputCommitService
-> AuditEventWriter
```

The deterministic fast boundary scanner remains before the AI extractor and continues catching obvious red-zone signals.

---

## 7. Phase 5 Deferral

Phase 5 owns durable student memory, current truth versus history, memory update and merge policy, correction handling, removal handling, contradiction handling, preference changes, confidence changes, stale memory replacement, retention/deletion, route derivation from durable memory, minimum-profile derivation from memory/state, and counseling memory versus CRM truth enforcement.
