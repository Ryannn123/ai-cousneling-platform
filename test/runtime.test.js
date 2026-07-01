import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { BoundaryEngine } from "../src/runtime/boundaryEngine.js";
import { SkillControlService } from "../src/runtime/skillControlService.js";
import { KnowledgeGateway } from "../src/runtime/knowledgeGateway.js";
import { ValidationPipeline } from "../src/runtime/validationPipeline.js";
import { CounselingTurnOrchestrator } from "../src/runtime/counselingTurnOrchestrator.js";
import { AIExecutionClient } from "../src/runtime/aiExecutionClient.js";
import { AIInterpretationClient } from "../src/runtime/aiInterpretationClient.js";
import { parseLlmInterpretation } from "../src/runtime/interpretationLayer.js";
import { InterpretationValidator } from "../src/runtime/interpretationValidator.js";

test("boundary detection catches apply/register/payment/official action language", () => {
  const engine = new BoundaryEngine();
  for (const message of ["I want to apply now", "Can you register me?", "How do I pay?", "Can you reserve my seat?"]) {
    const result = engine.evaluate({ studentMessage: message });
    assert.equal(result.finalZone, "red");
    assert.equal(result.allowedNextBehavior, "handoff");
  }
});

test("ambiguous proceed language asks for clarification instead of promotion", () => {
  const result = new BoundaryEngine().evaluate({ studentMessage: "Ok proceed with it" });
  assert.equal(result.finalZone, "yellow");
  assert.equal(result.allowedNextBehavior, "clarify");
});

test("validation blocks official-action memory outputs", () => {
  const result = new ValidationPipeline().validate({
    boundaryResult: { allowedNextBehavior: "continue", finalZone: "green" },
    operatingContext: { recommendationReadiness: "R2" },
    skillSelection: { allowedMemoryOutputTypes: ["confirmed_counseling_preference"] },
    aiExecutionResult: {
      response: { studentMessage: "Done", responseIntent: "answer" },
      proposedContextUpdate: {},
      proposedOutputs: {
        memoryOutputs: [{ type: "registration_completed", value: {}, confidence: "high", evidence: "test" }],
        recommendationOutputs: []
      },
      validationFlags: {}
    }
  });
  assert.equal(result.blockedOutputs[0].reason, "official_action_output_not_commit_eligible");
});

test("confirmed counseling preference cannot become official registration state", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });
  const preference = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer Psychology as my choice for now."
  });
  assert.equal(preference.operatingContext.currentMainState, "S6");
  assert.equal(preference.operatingContext.preferenceStrength, "L4");
  assert.equal(preference.runtimeState.handoff, null);
  assert.equal(preference.runtimeState.memoryOutputs.some((output) => output.type === "registration_completed"), false);
});

test("weak interest is not over-promoted to confirmed preference", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology sounds interesting."
  });
  assert.notEqual(result.operatingContext.preferenceStrength, "L4");
  assert.equal(result.acceptedInterpretation.accepted.flowDriving.preferenceStrengthCandidate.level, "L1");
  assert.equal(result.acceptedInterpretation.accepted.flowDriving.confirmedCounselingCoursePreference, undefined);
  assert.equal(result.runtimeState.memoryOutputs.some((output) => output.type === "confirmed_counseling_preference"), false);
});

test("phase 4 extracts course university and pathway considering fields", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I am considering Psychology at University A through foundation."
  });

  const flowDriving = result.acceptedInterpretation.accepted.flowDriving;
  assert.equal(flowDriving.coursesConsidering[0].courseOrProgram, "Psychology");
  assert.equal(flowDriving.universitiesConsidering[0].university, "University A");
  assert.equal(flowDriving.pathwaysConsidering[0].pathway, "Foundation");
});

test("route profile sends no course or university direction to course/pathway exploration", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits. I don't know what course or university I want yet."
  });

  assert.equal(result.operatingContext.profileCompleteness, "minimum_complete");
  assert.equal(result.operatingContext.minimumProfileRoute, "course_or_pathway_exploration");
  assert.equal(result.operatingContext.currentMainState, "S3");
  assert.equal(result.operatingContext.primaryCounselingAction, "A3");
  assert.equal(result.operatingContext.recommendationReadiness, "R1");
  assert.equal(result.operatingContext.studentPosture, "lost_or_confused");
});

test("route profile sends course-first student to university exploration and allows R2", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I want Psychology, but I don't know which university."
  });

  assert.equal(result.operatingContext.minimumProfileRoute, "university_exploration");
  assert.equal(result.operatingContext.recommendationReadiness, "R2");
  assert.equal(result.operatingContext.studentPosture, "course_first");
  assert.equal(result.operatingContext.counselorResponseMode, "route_explanation");
  assert.equal(result.skillSelection.selectedRuntimeSkill.name, "directional-recommendation");
});

test("route profile sends university-first student to course exploration in university context", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I want University A, but I don't know what course."
  });

  assert.equal(result.operatingContext.minimumProfileRoute, "course_exploration_within_university_context");
  assert.equal(result.operatingContext.currentMainState, "S3");
  assert.equal(result.operatingContext.primaryCounselingAction, "A3");
  assert.equal(result.operatingContext.studentPosture, "university_first");
});

test("budget ranking and location are quality signals not minimum profile gates", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer a budget university around KL with good ranking."
  });

  const accepted = result.acceptedInterpretation.accepted;
  assert.equal(accepted.flowDriving.minimumProfileSignals.academicResultKnown, false);
  assert.equal(result.operatingContext.profileCompleteness, "incomplete");
  assert.deepEqual(accepted.qualityEnhancingSignals.map((signal) => signal.type), ["budget_sensitivity", "university_fit_preference", "location_preference"]);
});

test("student posture signals are accepted for common v1.2 counseling postures", async () => {
  const client = new AIInterpretationClient({ provider: "openai" });
  const cases = [
    ["I'm just browsing.", "just_browsing"],
    ["I already want Psychology, but I don't know which university.", "course_first"],
    ["Which is better, University A or University B?", "comparison_oriented"],
    ["This option seems best for me.", "decision_ready"]
  ];

  for (const [studentMessage, posture] of cases) {
    const raw = await client.interpret({ conversationId: "c", turnId: "t", messageId: "m", studentMessage }, []);
    const accepted = new InterpretationValidator().validate({ rawInterpretation: raw, turnInput: { conversationId: "c", turnId: "t", messageId: "m", studentMessage } });
    assert.equal(accepted.accepted.studentPostureSignal.posture, posture);
  }
});

test("route-incompatible skill metadata is rejected", async () => {
  const skillsDir = await mkdtemp(path.join(tmpdir(), "route-skills-"));
  const dir = path.join(skillsDir, "interest-exploration");
  await mkdir(dir);
  await writeFile(path.join(dir, "SKILL.md"), `---
name: interest-exploration
description: Test route skill
version: 1.2.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_states:
  - S3
applies_to_actions:
  - A3
applies_to_zones:
  - green
applies_to_minimum_profile_routes:
  - university_exploration
allowed_memory_outputs:
  - exploration_prompted
---
# route test
`, "utf8");

  const result = await new SkillControlService(skillsDir).select({
    currentMainState: "S3",
    primaryCounselingAction: "A3",
    currentZone: "green",
    recommendationReadiness: "R1",
    profileCompleteness: "minimum_complete",
    minimumProfileRoute: "course_or_pathway_exploration"
  }, { allowedNextBehavior: "continue", requiredBoundaryRules: [] });

  assert.ok(result.rejectedCandidates.some((candidate) => candidate.reason === "route_course_or_pathway_exploration_not_allowed"));
});

test("phase 4 rejects irrelevant quality noise", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I like coffee."
  });

  assert.equal(result.acceptedInterpretation.accepted.qualityEnhancingSignals.length, 0);
  assert.ok(result.acceptedInterpretation.rejectedSignals.some((signal) => signal.reason === "quality_signal_low_usefulness"));
});

test("phase 4 knowledge needs are accepted for fees entry requirements and ranking", async () => {
  const client = new AIInterpretationClient({ provider: "openai" });
  const result = await client.interpret({
    conversationId: "test",
    turnId: "turn",
    messageId: "message",
    studentMessage: "What are the fees, entry requirements, and ranking for Psychology?"
  }, []);

  assert.deepEqual(result.knowledgeNeedSignals.map((signal) => signal.type), ["fees", "entry_requirements", "ranking"]);
});

test("openai interpretation client passes InterpretationResult schema", async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return { output_text: JSON.stringify(interpretationFixture()) };
      }
    };
  };

  try {
    const client = new AIInterpretationClient({ provider: "openai", openaiApiKey: "test-key", model: "gpt-test" });
    const result = await client.interpret({
      conversationId: "conversation",
      turnId: "turn",
      messageId: "message",
      studentMessage: "Psychology sounds interesting."
    }, []);

    assert.match(capturedRequest.url, /api\.openai\.com\/v1\/responses/);
    assert.equal(capturedRequest.body.text.format.type, "json_schema");
    assert.equal(capturedRequest.body.text.format.name, "InterpretationResult");
    assert.ok(capturedRequest.body.text.format.schema.required.includes("flowDriving"));
    assert.ok(capturedRequest.body.text.format.schema.properties.flowDriving.properties.coursesConsidering);
    assert.equal(result.flowDriving.coursesConsidering[0].courseOrProgram, "Psychology");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini interpretation client passes concise JSON schema without platform metadata", async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return {
          steps: [{
            type: "model_output",
            content: [{ type: "text", text: JSON.stringify(interpretationFixture()) }]
          }]
        };
      }
    };
  };

  try {
    const client = new AIInterpretationClient({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    const result = await client.interpret({
      conversationId: "conversation",
      turnId: "turn",
      messageId: "message",
      studentMessage: "Psychology sounds interesting."
    }, []);

    assert.match(capturedRequest.url, /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    assert.equal(capturedRequest.body.model, "gemini-test");
    assert.equal(capturedRequest.body.store, false);
    assert.equal(capturedRequest.body.response_format.mime_type, "application/json");
    assert.equal(capturedRequest.body.response_format.schema.type, "object");
    assert.ok(capturedRequest.body.response_format.schema.required.includes("flowDriving"));
    assert.equal(capturedRequest.body.response_format.schema.required.includes("conversationId"), false);
    assert.equal(capturedRequest.body.response_format.schema.properties.conversationId, undefined);
    assert.equal(capturedRequest.body.response_format.schema.properties.flowDriving.properties.coursesConsidering.items.properties.source, undefined);
    assert.equal(capturedRequest.body.response_format.schema.properties.flowDriving.properties.minimumProfileSignals.properties.courseDirectionStatus.type, "string");
    assert.equal(result.flowDriving.coursesConsidering[0].courseOrProgram, "Psychology");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini concise interpretation response is hydrated before validation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        steps: [{
          type: "model_output",
          content: [{ type: "text", text: JSON.stringify(conciseInterpretationFixture()) }]
        }]
      };
    }
  });

  try {
    const client = new AIInterpretationClient({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    const result = await client.interpret({
      conversationId: "conversation",
      turnId: "turn",
      messageId: "message",
      studentMessage: "Psychology sounds interesting."
    }, []);

    assert.equal(result.conversationId, "conversation");
    assert.equal(result.flowDriving.coursesConsidering[0].source, "current_message");
    assert.equal(result.flowDriving.coursesConsidering[0].promotionRisk, "none");
    assert.equal(result.flowDriving.minimumProfileSignals.courseDirectionStatus.value, "considering_some_courses");
    assert.equal(result.qualityEnhancingSignals[0].evidence[0].quote, "people focused");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini interpretation client surfaces live Gemini 400", async () => {
  const originalFetch = globalThis.fetch;
  const capturedRequests = [];
  globalThis.fetch = async (url, options) => {
    capturedRequests.push({ url: String(url), body: JSON.parse(options.body) });
    return {
      ok: false,
      status: 400,
      async text() {
        return "schema rejected";
      }
    };
  };

  try {
    const client = new AIInterpretationClient({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    await assert.rejects(client.interpret({
      conversationId: "conversation",
      turnId: "turn",
      messageId: "message",
      studentMessage: "Psychology sounds interesting."
    }, []), /Gemini API returned 400: schema rejected/);

    assert.equal(capturedRequests.length, 1);
    assert.equal(capturedRequests[0].body.response_format.mime_type, "application/json");
    assert.equal(capturedRequests[0].body.response_format.schema.type, "object");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("raw interpretation layer returns parsed OpenAI output without hydration or fast boundary input", async () => {
  const originalFetch = globalThis.fetch;
  const rawInterpretation = rawInterpretationFixture();
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return { output_text: JSON.stringify(rawInterpretation) };
      }
    };
  };

  try {
    const result = await parseLlmInterpretation({
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    }, { provider: "openai", openaiApiKey: "test-key", model: "gpt-test" });

    assert.match(capturedRequest.url, /api\.openai\.com\/v1\/responses/);
    assert.deepEqual(JSON.parse(capturedRequest.body.input[1].content), {
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    });
    assert.deepEqual(result, rawInterpretation);
    assert.equal(result.conversationId, undefined);
    assert.equal(result.flowDriving.coursesConsidering[0].source, undefined);
    assert.equal(result.flowDriving.coursesConsidering[0].promotionRisk, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("raw interpretation layer returns parsed Gemini output without hydration or fast boundary input", async () => {
  const originalFetch = globalThis.fetch;
  const rawInterpretation = rawInterpretationFixture();
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return {
          steps: [{
            type: "model_output",
            content: [{ type: "text", text: JSON.stringify(rawInterpretation) }]
          }]
        };
      }
    };
  };

  try {
    const result = await parseLlmInterpretation({
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    }, { provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });

    assert.match(capturedRequest.url, /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    assert.deepEqual(JSON.parse(capturedRequest.body.input), {
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    });
    assert.deepEqual(result, rawInterpretation);
    assert.equal(result.conversationId, undefined);
    assert.equal(result.flowDriving.coursesConsidering[0].source, undefined);
    assert.equal(result.flowDriving.coursesConsidering[0].promotionRisk, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("raw interpretation layer requires a provider API key", async () => {
  await assert.rejects(parseLlmInterpretation({
    studentMessage: "Psychology sounds interesting."
  }, { provider: "openai", openaiApiKey: "" }), /API key is required/);
});

test("phase 4 direction change creates contradiction and switches active direction", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Actually, I don't want Psychology anymore. I want IT."
  });

  assert.equal(result.acceptedInterpretation.accepted.contradictionSignals[0].type, "direction_change");
  assert.equal(result.operatingContext.activeStudentDirection.courseOrProgram, "IT");
});

test("phase 4 audit records accepted rejected and downgraded interpretation", async () => {
  const app = new CounselingTurnOrchestrator({
    aiInterpretationClient: {
      async interpret(turnInput) {
        return {
          conversationId: turnInput.conversationId,
          turnId: turnInput.turnId,
          messageId: turnInput.messageId,
          flowDriving: {
            coursesConsidering: [],
            universitiesConsidering: [],
            pathwaysConsidering: [],
            confirmedCounselingCoursePreference: {
              courseOrProgram: "Psychology",
              status: "confirmed_counseling_preference",
              confidence: "high",
              evidence: [{ quote: "I prefer Psychology" }],
              source: "current_message",
              promotionRisk: "none"
            },
            minimumProfileSignals: {}
          },
          qualityEnhancingSignals: [{
            type: "other",
            value: { trivia: "coffee" },
            usefulness: "low",
            sensitivity: "none",
            confidence: "high",
            evidence: [{ quote: "coffee" }],
            source: "current_message",
            promotionRisk: "none"
          }],
          boundaryCandidateSignals: [],
          knowledgeNeedSignals: [],
          contradictionSignals: [],
          confidenceSummary: { overallConfidence: "medium", requiresClarification: false }
        };
      }
    }
  });
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer Psychology"
  });

  assert.ok(result.auditEvent.interpretationAudit.acceptedInterpretation);
  assert.ok(result.auditEvent.interpretationAudit.rejectedSignals.some((signal) => signal.reason === "quality_signal_low_usefulness"));
  assert.ok(result.auditEvent.interpretationAudit.downgradedSignals.some((signal) => signal.reason === "courseOrProgram_confirmation_not_explicit"));
});

test("phase 4 invalid interpretation evidence falls back safely", async () => {
  const app = new CounselingTurnOrchestrator({
    aiInterpretationClient: {
      async interpret(turnInput) {
        return {
          conversationId: turnInput.conversationId,
          turnId: turnInput.turnId,
          messageId: turnInput.messageId,
          flowDriving: {
            coursesConsidering: [{
              courseOrProgram: "Psychology",
              status: "considering",
              confidence: "high",
              evidence: [],
              source: "current_message",
              promotionRisk: "none"
            }],
            universitiesConsidering: [],
            pathwaysConsidering: [],
            minimumProfileSignals: {}
          },
          qualityEnhancingSignals: [],
          boundaryCandidateSignals: [],
          knowledgeNeedSignals: [],
          contradictionSignals: [],
          confidenceSummary: { overallConfidence: "medium", requiresClarification: false }
        };
      }
    }
  });
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology"
  });

  assert.equal(result.acceptedInterpretation.status, "safe_fallback");
  assert.ok(result.acceptedInterpretation.rejectedSignals.some((signal) => signal.reason === "missing_evidence"));
});

test("draft skills are rejected and approved skills are loaded with hashes", async () => {
  const skillsDir = await mkdtemp(path.join(tmpdir(), "counseling-skills-"));
  await writeSkill(skillsDir, "approved-skill", "approved");
  await writeSkill(skillsDir, "draft-invalid-skill", "draft");

  const inventory = await new SkillControlService(skillsDir).getSkillInventory();
  assert.ok(inventory.loaded.some((skill) => skill.metadata.name === "approved-skill"));
  assert.ok(inventory.loaded.every((skill) => skill.ref.contentHash));
  assert.ok(inventory.rejected.some((skill) => skill.skill.name === "draft-invalid-skill" && skill.reason === "status_draft"));
});

test("knowledge gateway answers only from seed catalog and caveats unknowns", async () => {
  const gateway = new KnowledgeGateway();
  const known = await gateway.answer("What is the fee for Psychology in Kuala Lumpur?");
  assert.equal(known.answerable, true);
  assert.equal(known.facts[0].program, "Psychology");

  const unknown = await gateway.answer("What is the fee for Medicine in London?");
  assert.equal(unknown.answerable, false);
  assert.equal(unknown.uncertaintyLevel, "decision_critical");
});

test("phase 12 scenario reaches recommendation, comparison, preference, handoff, and audit evidence", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();

  const opening = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Hi"
  });
  assert.equal(opening.operatingContext.primaryCounselingAction, "A2");
  assert.equal(opening.skillSelection.selectedRuntimeSkill.name, "minimum-profile-collection");

  const recommendation = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });
  assert.equal(recommendation.operatingContext.recommendationReadiness, "R2");
  assert.equal(recommendation.skillSelection.selectedRuntimeSkill.name, "directional-recommendation");
  assert.equal(recommendation.validationResult.acceptedOutputs.recommendationOutputs[0].confidence, "medium");

  const detour = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "What are the fees for Psychology?"
  });
  assert.equal(detour.operatingContext.overlayState, "S9");
  assert.equal(detour.skillSelection.selectedRuntimeSkill.name, "factual-detour-answering");

  const comparison = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Compare Psychology and Business for me."
  });
  assert.equal(comparison.operatingContext.currentMainState, "S5");
  assert.equal(comparison.skillSelection.selectedRuntimeSkill.name, "shortlist-comparison");

  const preference = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer Psychology as my choice for now."
  });
  assert.equal(preference.operatingContext.currentMainState, "S6");
  assert.equal(preference.validationResult.acceptedOutputs.memoryOutputs[0].type, "confirmed_counseling_preference");

  const handoff = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I want to apply now."
  });
  assert.equal(handoff.boundaryResult.finalZone, "red");
  assert.equal(handoff.acceptedInterpretation.accepted.flowDriving.readinessToRegisterSignal.intent, "apply_now");
  assert.equal(handoff.validationResult.status, "handoff_override");
  assert.equal(handoff.commitResult.handoffPrepared, true);
  assert.equal(handoff.runtimeState.handoff.required, true);
  assert.ok(handoff.auditEvent.skillSelection.selectedRuntimeSkill);
  assert.ok(handoff.auditEvent.commitResult);
});

test("ambiguous proceed after recommendation clarifies without confirming preference", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Ok proceed with it."
  });

  assert.equal(result.boundaryResult.finalZone, "yellow");
  assert.equal(result.validationResult.status, "clarify");
  assert.equal(result.operatingContext.primaryCounselingAction, "A8");
  assert.equal(result.runtimeState.memoryOutputs.some((output) => output.type === "confirmed_counseling_preference"), false);
});

test("official-action wording variants hand off instead of continuing counseling", async () => {
  const app = new CounselingTurnOrchestrator();

  for (const studentMessage of [
    "I want to submit my application today.",
    "Can I pay the deposit now?",
    "Please enroll me in this course."
  ]) {
    const conversation = await app.createConversation();
    const result = await app.handleTurn({ conversationId: conversation.conversationId, studentMessage });
    assert.equal(result.boundaryResult.finalZone, "red");
    assert.equal(result.validationResult.status, "handoff_override");
    assert.equal(result.runtimeState.handoff.required, true);
    assert.equal(result.runtimeState.memoryOutputs.some((output) => output.type === "registration_completed"), false);
  }
});

test("detour answer resumes normal journey on the next turn", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });

  const detour = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "What are the fees for Psychology?"
  });
  assert.equal(detour.operatingContext.overlayState, "S9");
  assert.equal(detour.operatingContext.primaryCounselingAction, "A5");

  const resumed = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Compare Psychology and Business for me."
  });
  assert.equal(resumed.operatingContext.overlayState, undefined);
  assert.equal(resumed.operatingContext.currentMainState, "S5");
  assert.equal(resumed.skillSelection.selectedRuntimeSkill.name, "shortlist-comparison");
});

test("unknown factual detour is caveated and recorded as low-confidence knowledge gap", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "What is the fee for Medicine in London?"
  });

  const detourOutput = result.runtimeState.memoryOutputs.find((output) => output.type === "factual_detour_answered");
  assert.equal(result.operatingContext.overlayState, "S9");
  assert.match(result.finalResponse, /do not have a verified catalog fact/i);
  assert.equal(detourOutput.confidence, "low");
  assert.equal(detourOutput.value.answerable, false);
});

test("human-requested support produces red-zone handoff", async () => {
  const app = new CounselingTurnOrchestrator();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Can I talk to a human counselor?"
  });

  assert.equal(result.boundaryResult.finalZone, "red");
  assert.equal(result.boundaryResult.triggerType, "H6");
  assert.equal(result.commitResult.handoffPrepared, true);
});

test("invalid AI official-action output is blocked before commit", async () => {
  const app = new CounselingTurnOrchestrator({
    aiExecutionClient: {
      async execute() {
        return {
          response: {
            studentMessage: "Your registration completed successfully.",
            responseIntent: "answer"
          },
          proposedContextUpdate: {},
          proposedOutputs: {
            memoryOutputs: [{
              type: "registration_completed",
              value: { program: "Psychology" },
              confidence: "high",
              evidence: "test"
            }],
            recommendationOutputs: []
          },
          validationFlags: {}
        };
      }
    }
  });
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });

  assert.equal(result.validationResult.status, "safe_fallback");
  assert.match(result.finalResponse, /cannot complete application/i);
  assert.equal(result.validationResult.blockedOutputs[0].reason, "official_action_output_not_commit_eligible");
  assert.equal(result.runtimeState.memoryOutputs.some((output) => output.type === "registration_completed"), false);
});

test("gemini provider calls interactions and parses JSON output", async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return {
          steps: [{
            type: "model_output",
            content: [{
              type: "text",
              text: JSON.stringify({
                response: { studentMessage: "Gemini response", responseIntent: "answer" },
                proposedContextUpdate: {},
                proposedOutputs: { memoryOutputs: [], recommendationOutputs: [] },
                validationFlags: {
                  needsClarification: false,
                  boundarySensitive: false,
                  officialActionRisk: false,
                  memoryWriteRequiresValidation: true,
                  knowledgeUsed: false,
                  knowledgeUncertain: false
                }
              })
            }]
          }]
        };
      }
    };
  };

  try {
    const client = new AIExecutionClient({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    const result = await client.execute({
      studentMessage: "Hello",
      operatingContext: {},
      boundaryResult: { finalZone: "green" }
    });

    assert.match(capturedRequest.url, /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    assert.equal(capturedRequest.body.model, "gemini-test");
    assert.equal(capturedRequest.body.response_format.mime_type, "application/json");
    assert.deepEqual(capturedRequest.body.response_format.schema.required, ["response", "proposedContextUpdate", "proposedOutputs", "validationFlags"]);
    assert.deepEqual(capturedRequest.body.response_format.schema.properties.response.required, ["studentMessage", "responseIntent"]);
    assert.equal(result.response.studentMessage, "Gemini response");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini malformed JSON shape surfaces live provider error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
        return {
          steps: [{
            type: "model_output",
            content: [{
              type: "text",
              text: JSON.stringify({
                response: "Please provide your full name and SPM examination year.",
                status: "continue_normal_counseling",
                memoryUpdate: {
                  action: "minimum_profile_requested",
                  details: "Requested student name and SPM examination year."
                },
                nextStep: "Collect missing profile information."
              })
            }]
          }]
        };
    }
  });

  try {
    const client = new AIExecutionClient({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    await assert.rejects(client.execute({
      studentMessage: "My SPM results are good.",
      operatingContext: { primaryCounselingAction: "A2" },
      boundaryResult: { finalZone: "green", allowedNextBehavior: "continue" }
    }), /Gemini returned invalid AIExecutionResult/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

async function writeSkill(skillsDir, name, status) {
  const dir = path.join(skillsDir, name);
  await mkdir(dir);
  await writeFile(path.join(dir, "SKILL.md"), `---
name: ${name}
description: Test skill
version: 1.0.0
artifact_type: runtime_skill
status: ${status}
owner: counseling_team
---
# ${name}
`, "utf8");
}

function interpretationFixture() {
  return {
    conversationId: "conversation",
    turnId: "turn",
    messageId: "message",
    flowDriving: {
      coursesConsidering: [{
        courseOrProgram: "Psychology",
        status: "considering",
        confidence: "high",
        evidence: [{ quote: "Psychology sounds interesting" }],
        source: "current_message",
        promotionRisk: "none"
      }],
      universitiesConsidering: [],
      pathwaysConsidering: [],
      minimumProfileSignals: {
        academicResultKnown: false,
        courseDirectionStatusKnown: true,
        universityDirectionStatusKnown: false
      }
    },
    qualityEnhancingSignals: [],
    boundaryCandidateSignals: [],
    knowledgeNeedSignals: [],
    contradictionSignals: [],
    confidenceSummary: {
      overallConfidence: "medium",
      requiresClarification: false
    }
  };
}

function conciseInterpretationFixture() {
  return {
    flowDriving: {
      coursesConsidering: [{
        courseOrProgram: "Psychology",
        status: "considering",
        confidence: "high",
        evidence: [{ quote: "Psychology sounds interesting" }]
      }],
      universitiesConsidering: [],
      pathwaysConsidering: [],
      minimumProfileSignals: {
        academicResultKnown: false,
        courseDirectionStatusKnown: true,
        universityDirectionStatusKnown: false,
        courseDirectionStatus: "considering_some_courses",
        suggestedCounselingRoute: "collect_academic_result"
      }
    },
    qualityEnhancingSignals: [{
      type: "career_interest",
      value: { interest: "people focused" },
      usefulness: "high",
      sensitivity: "none",
      confidence: "medium",
      evidence: [{ quote: "people focused" }]
    }],
    boundaryCandidateSignals: [],
    knowledgeNeedSignals: [],
    contradictionSignals: [],
    confidenceSummary: {
      overallConfidence: "medium",
      requiresClarification: false
    }
  };
}

function rawInterpretationFixture() {
  return {
    flowDriving: {
      coursesConsidering: [{
        courseOrProgram: "Psychology",
        status: "considering",
        confidence: "high",
        evidence: [{ quote: "Psychology sounds interesting" }]
      }],
      universitiesConsidering: [],
      pathwaysConsidering: [],
      minimumProfileSignals: {
        academicResultKnown: false,
        courseDirectionStatusKnown: true,
        universityDirectionStatusKnown: false,
        courseDirectionStatus: "considering_some_courses"
      }
    },
    qualityEnhancingSignals: [],
    boundaryCandidateSignals: [],
    knowledgeNeedSignals: [],
    contradictionSignals: [],
    confidenceSummary: {
      overallConfidence: "medium",
      requiresClarification: false
    }
  };
}
