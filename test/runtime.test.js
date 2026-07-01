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
import { AISemanticDeltaExtractor } from "../src/runtime/aiSemanticDeltaExtractor.js";
import { parseLlmSemanticDelta } from "../src/runtime/semanticDeltaLayer.js";
import { SemanticDeltaValidator } from "../src/runtime/semanticDeltaValidator.js";

function flowDrivingDeltas(result) {
  return result.acceptedSemanticDelta.acceptedMemoryDeltas.flowDrivingDeltas;
}

function qualityEnhancingDeltas(result) {
  return result.acceptedSemanticDelta.acceptedMemoryDeltas.qualityEnhancingDeltas;
}

function runtimeSignals(result, kind) {
  return result.acceptedSemanticDelta.acceptedRuntimeOnlySignals.filter((signal) => signal.kind === kind);
}

function testApp(services = {}) {
  return new CounselingTurnOrchestrator({
    aiSemanticDeltaExtractor: testSemanticDeltaExtractor(),
    aiExecutionClient: testExecutionClient(),
    ...services
  });
}

function testSemanticDeltaExtractor() {
  return {
    provider: "mock",
    model: "test",
    async extract(turnInput, fastBoundarySignals = []) {
      return mockSemanticDelta(turnInput, fastBoundarySignals);
    }
  };
}

function testExecutionClient() {
  return {
    async execute(executionContext) {
      return mockExecution(executionContext);
    }
  };
}

const TEST_COURSES = ["psychology", "business", "computer science", "it", "design", "engineering", "accounting"];
const TEST_PATHWAYS = ["foundation", "diploma", "a-level", "a level"];
const TEST_UNIVERSITIES = ["demo metropolitan university", "demo valley university", "demo tech institute", "university a", "university b", "sunway", "taylor's", "taylors", "monash", "apu", "inti", "help", "utar"];
const TEST_NO_COURSE_DIRECTION = /\b(don'?t know what course|do not know what course|no course|not sure what to study|don't know what to study|do not know what to study)\b/i;
const TEST_NO_UNIVERSITY_DIRECTION = /\b(don'?t know (which )?university|do not know (which )?university|no university|not sure which university|haven'?t chosen.*university|have not chosen.*university|what course or university)\b/i;

function mockSemanticDelta(turnInput, fastBoundarySignals) {
  const text = turnInput.studentMessage || "";
  const flowDrivingDeltas = {
    academicResults: arrayOf(academicResultDelta(text)),
    coursesConsidering: courseDeltas(text),
    confirmedCounselingCoursePreferences: confirmedCourseDelta(text) || null,
    universitiesConsidering: universityDeltas(text),
    confirmedCounselingUniversityPreferences: confirmedUniversityDelta(text) || null,
    pathwaysConsidering: pathwayDeltas(text),
    confirmedCounselingPathwayPreferences: confirmedPathwayDelta(text) || null
  };
  return {
    memoryDeltaCandidates: {
      flowDrivingDeltas,
      qualityEnhancingDeltas: qualityDeltas(text)
    },
    runtimeOnlySignalCandidates: [
      ...boundarySignals(text, fastBoundarySignals),
      ...knowledgeNeeds(text),
      ...arrayOf(postureSignal(text, flowDrivingDeltas)),
      ...ambiguitySignals(text)
    ]
  };
}

function courseDeltas(text) {
  const lower = text.toLowerCase();
  return TEST_COURSES
    .filter((course) => includesTerm(lower, course))
    .map((course) => ({
      ...baseDelta(text, course),
      value: course === "it" ? "IT" : title(course),
      status: /\bprefer\b/i.test(text) && includesTerm(lower, course) ? "preferred" : "considering"
    }));
}

function confirmedCourseDelta(text) {
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) return undefined;
  const course = courseDeltas(text)[0];
  return course ? { ...course, ...baseDelta(text, text), status: "confirmed_counseling_preference", confidence: "high" } : undefined;
}

function universityDeltas(text) {
  const lower = text.toLowerCase();
  return TEST_UNIVERSITIES
    .filter((university) => includesTerm(lower, university))
    .map((university) => ({
      ...baseDelta(text, university),
      value: university.includes("university ") ? title(university) : title(university).replace(/\bApu\b/, "APU").replace(/\bUtar\b/, "UTAR"),
      status: /\bprefer\b/i.test(text) && includesTerm(lower, university) ? "preferred" : "considering"
    }));
}

function confirmedUniversityDelta(text) {
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) return undefined;
  const university = universityDeltas(text)[0];
  return university ? { ...university, ...baseDelta(text, text), status: "confirmed_counseling_preference", confidence: "high" } : undefined;
}

function pathwayDeltas(text) {
  const lower = text.toLowerCase();
  return TEST_PATHWAYS
    .filter((pathway) => lower.includes(pathway))
    .map((pathway) => ({
      ...baseDelta(text, pathway),
      value: title(pathway),
      status: /\bprefer\b/i.test(text) && lower.includes(pathway) ? "preferred" : "considering"
    }));
}

function confirmedPathwayDelta(text) {
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) return undefined;
  const pathway = pathwayDeltas(text)[0];
  return pathway ? { ...pathway, ...baseDelta(text, text), status: "confirmed_counseling_preference", confidence: "high" } : undefined;
}

function academicResultDelta(text) {
  const match = text.match(/\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?|credits?)\b[^.?!]*/i);
  return match ? { ...baseDelta(text, match[0]), value: match[0].trim() } : undefined;
}

function boundarySignals(text, fastBoundarySignals = []) {
  return fastBoundarySignals.map((signal) => ({
    ...baseSignal(text, signal.matchedText, "high", signal.severityCandidate === "red" ? "official_action_risk" : "requires_confirmation"),
    kind: "boundary",
    type: signal.type,
    triggerType: signal.triggerType,
    severityCandidate: signal.severityCandidate,
    recommendedBehavior: signal.recommendedBehavior === "clarify_once" ? "clarify_once" : "handoff"
  }));
}

function knowledgeNeeds(text) {
  const patterns = [
    ["fees", /\b(fee|fees|cost|tuition)\b/i],
    ["entry_requirements", /\b(entry requirement|requirements?|qualify|eligible|eligibility)\b/i],
    ["ranking", /\b(ranking|rank|ranked|higher)\b/i]
  ];
  return patterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([type, pattern]) => ({
      ...baseSignal(text, text.match(pattern)?.[0] || text),
      kind: "knowledge_need",
      type,
      query: text,
      decisionCriticality: type === "entry_requirements" ? "decision_critical" : "possibly_decision_critical"
    }));
}

function ambiguitySignals(text) {
  if (!/\b(actually|instead|anymore|not sure anymore|i said .* earlier|now i prefer)\b/i.test(text)) return [];
  const newCourse = courseDeltas(text).find((delta) => !/\b(don'?t want|do not want|not)\b/i.test(text.slice(Math.max(0, text.toLowerCase().indexOf(delta.value.toLowerCase()) - 20), text.toLowerCase().indexOf(delta.value.toLowerCase()))));
  return [{
    ...baseSignal(text, text, "medium", "requires_confirmation"),
    kind: "ambiguity",
    type: /\bnot sure anymore\b/i.test(text) ? "preference_downgrade" : "direction_change",
    newClaim: newCourse ? { value: newCourse.value } : { message: text },
    recommendedBehavior: "clarify_once"
  }];
}

function qualityDeltas(text) {
  const deltas = [];
  if (/\b(budget|affordable|cheap|low cost|value)\b/i.test(text)) deltas.push({ ...quality("constraint", text, { budget: "important" }), usefulness: "high" });
  if (/\b(ranking|prestige|reputation)\b/i.test(text)) deltas.push({ ...quality("preference", text, { fit: "ranking_or_prestige" }), usefulness: "high" });
  if (/\b(kl|kuala lumpur|selangor|penang|johor|nearby|near campus)\b/i.test(text)) deltas.push({ ...quality("preference", text, { location: "stated_location" }), usefulness: "high" });
  if (/\b(coffee|movie|football)\b/i.test(text)) deltas.push({ ...quality("other", text, { trivia: text }), usefulness: "low" });
  return deltas;
}

function postureSignal(text, flowDrivingDeltas) {
  const lower = text.toLowerCase();
  if (/\b(human counselor|human counsellor|real person|talk to.*human)\b/i.test(text)) return posture(text, "human_help_seeking", "handoff_boundary_check", "handoff_safe");
  if (/\b(just browsing|browsing only|looking around)\b/i.test(text)) return posture(text, "just_browsing", "reassure_and_orient", "reassuring_orientation");
  if (/\b(compare|versus|vs|better|between)\b/i.test(text)) return posture(text, "comparison_oriented", "compare_options", "decision_support");
  if (/\b(my choice|choose|chosen|this option seems best|let'?s go with)\b/i.test(text)) return posture(text, "decision_ready", "confirm_preference", "milestone_confirmation");
  if ((flowDrivingDeltas.coursesConsidering || []).length && (TEST_NO_UNIVERSITY_DIRECTION.test(text) || lower.includes("which university"))) return posture(text, "course_first", "route_to_university_exploration", "route_explanation");
  if ((flowDrivingDeltas.universitiesConsidering || []).length && (TEST_NO_COURSE_DIRECTION.test(text) || lower.includes("what course"))) return posture(text, "university_first", "route_to_course_exploration", "route_explanation");
  if (/\b(confused|undecided|not sure|don'?t know what course|do not know what course)\b/i.test(text)) return posture(text, "lost_or_confused", "reassure_and_orient", "reassuring_orientation");
  if ((flowDrivingDeltas.pathwaysConsidering || []).length) return posture(text, "pathway_first", "route_to_pathway_exploration", "route_explanation");
  return undefined;
}

function posture(text, postureValue, counselingImplication, suggestedResponseMode) {
  return { ...baseSignal(text, text, "high"), kind: "student_posture", posture: postureValue, counselingImplication, suggestedResponseMode };
}

function quality(type, text, value) {
  return { ...baseDelta(text, text), kind: "quality_enhancing", type, value, usefulness: "medium", sensitivity: "none", constraintStrength: type === "constraint" ? "hard_constraint" : "soft_preference" };
}

function baseDelta(text, quote, confidence = "high", promotionRisk = "none") {
  return { operation: "add_new", confidence, evidence: [{ quote: String(quote || text).slice(0, 160) }], source: "current_message", promotionRisk };
}

function baseSignal(text, quote, confidence = "high", promotionRisk = "none") {
  return { confidence, evidence: [{ quote: String(quote || text).slice(0, 160) }], source: "current_message", promotionRisk };
}

function arrayOf(value) {
  return value ? [value] : [];
}

function title(value) {
  return value.split(/\s+/).map((word) => word.toUpperCase() === "IT" ? "IT" : `${word[0].toUpperCase()}${word.slice(1)}`).join(" ");
}

function includesTerm(lowerText, term) {
  return new RegExp(`\\b${escapeRegex(term.toLowerCase()).replace(/\\ /g, "\\s+")}\\b`).test(lowerText);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mockExecution(executionContext) {
  const { operatingContext, boundaryResult, studentMessage, knowledgeContext } = executionContext;
  const baseFlags = {
    needsClarification: boundaryResult.allowedNextBehavior === "clarify",
    boundarySensitive: boundaryResult.finalZone !== "green",
    officialActionRisk: boundaryResult.finalZone === "red",
    memoryWriteRequiresValidation: true,
    knowledgeUsed: Boolean(knowledgeContext),
    knowledgeUncertain: knowledgeContext?.uncertaintyLevel === "decision_critical"
  };

  if (boundaryResult.allowedNextBehavior === "handoff") {
    return {
      response: {
        studentMessage: "I can help prepare the next step, but application, registration, payment, or seat confirmation needs a human counselor. I will prepare a handoff summary so the team can continue with you.",
        responseIntent: "handoff"
      },
      proposedContextUpdate: { currentMainState: "S7", primaryCounselingAction: "A12", handoffStatus: "prepared", preferenceStrength: "L5" },
      proposedOutputs: {
        memoryOutputs: [
          { type: "readiness_to_register_signal", value: { message: studentMessage }, confidence: "high", evidence: studentMessage },
          { type: "handoff_required", value: { triggerType: boundaryResult.triggerType }, confidence: "high", evidence: boundaryResult.aiBoundaryReason }
        ],
        recommendationOutputs: [],
        handoffOutput: {
          required: true,
          triggerType: boundaryResult.triggerType,
          reason: boundaryResult.aiBoundaryReason,
          summary: `Student said: "${studentMessage}". Human counselor should handle official next steps.`
        }
      },
      validationFlags: baseFlags
    };
  }

  if (boundaryResult.allowedNextBehavior === "clarify") {
    return {
      response: {
        studentMessage: "When you say proceed, do you mean this is your counseling preference for now, or that you want to apply or register officially?",
        responseIntent: "ask_clarification"
      },
      proposedContextUpdate: { primaryCounselingAction: "A8" },
      proposedOutputs: { memoryOutputs: [], recommendationOutputs: [] },
      validationFlags: baseFlags
    };
  }

  if (operatingContext.primaryCounselingAction === "A5") {
    const facts = knowledgeContext?.sources?.facts || [];
    const factText = facts.length
      ? facts.map((fact) => `${fact.program} at ${fact.university}: ${fact.location}, about MYR ${fact.annualFeeMyr}/year, ${fact.pathwayDuration}.`).join(" ")
      : knowledgeContext?.sources?.caveat || "I do not have a verified fact for that in the prototype catalog.";
    return executionResult("answer", `${factText} After that, we can return to choosing the best-fit direction.`, {
      proposedContextUpdate: { overlayState: "S9" },
      memoryOutputs: [{ type: "factual_detour_answered", value: { answerable: facts.length > 0 }, confidence: facts.length ? "medium" : "low", evidence: studentMessage }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A2") {
    return executionResult("ask_clarification", "To guide you properly, I only need the routing basics first: your academic result, whether you already have a course in mind, and whether you already have a university in mind.", {
      memoryOutputs: [{ type: "minimum_profile_requested", value: {}, confidence: "high", evidence: "Minimum profile incomplete." }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A6") {
    return executionResult("recommend", "You already have enough direction for a first counseling recommendation. Based on what you shared, I can make a medium-confidence suggestion and then refine it with one fit question. Psychology could fit if you want people-focused work; Business stays broader if you want management, marketing, or finance flexibility. Which matters more to you now: career direction, budget, or location?", {
      proposedContextUpdate: { currentMainState: "S4", recommendationReadiness: "R2" },
      recommendationOutputs: [{
        option: "R2 directional shortlist based on current course or pathway direction",
        fitReasons: ["Uses the student's academic result and stated direction"],
        assumptions: ["University-fit details can still refine the recommendation"],
        cautions: ["Counseling recommendation only; not admission or registration approval"],
        confidence: "medium"
      }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A7") {
    return executionResult("compare", "You are comparing directions, so the useful move is to narrow by trade-off instead of adding more options. Psychology is stronger if you want counseling, HR, or human behavior. Business is broader if you want management, marketing, or finance flexibility. Which trade-off matters more to you: focused interest or broader flexibility?", {
      proposedContextUpdate: { currentMainState: "S5" },
      memoryOutputs: [{ type: "shortlist", value: { options: ["Psychology", "Business"] }, confidence: "medium", evidence: studentMessage }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A9") {
    return executionResult("confirm_preference", "For counseling purposes, I can treat this as your current preferred direction. This is not an application, registration, payment, enrollment, seat reservation, or CRM update. It just gives us a clear counseling milestone; from here, you can compare one final alternative, take time to think, or speak with a human counselor for official next steps.", {
      proposedContextUpdate: { currentMainState: "S6", preferenceStrength: "L4" },
      memoryOutputs: [{ type: "confirmed_counseling_preference", value: { direction: studentMessage }, confidence: "medium", evidence: studentMessage }]
    }, baseFlags);
  }

  return executionResult("answer", "It sounds like you are still finding the right direction. We can start broad and use your strengths, disliked subjects, and career interest to narrow the route before talking about university fit. What kind of subjects or work do you usually prefer?", {
    proposedContextUpdate: { currentMainState: "S3", primaryCounselingAction: "A3" },
    memoryOutputs: [{ type: "exploration_prompted", value: {}, confidence: "medium", evidence: studentMessage }]
  }, baseFlags);
}

function executionResult(responseIntent, studentMessage, proposals, flags) {
  return {
    response: { studentMessage, responseIntent },
    proposedContextUpdate: proposals.proposedContextUpdate || {},
    proposedOutputs: {
      memoryOutputs: proposals.memoryOutputs || [],
      recommendationOutputs: proposals.recommendationOutputs || [],
      handoffOutput: proposals.handoffOutput
    },
    validationFlags: flags
  };
}

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
  const app = testApp();
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
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology sounds interesting."
  });
  assert.notEqual(result.operatingContext.preferenceStrength, "L4");
  assert.equal(flowDrivingDeltas(result).coursesConsidering[0].status, "considering");
  assert.equal(flowDrivingDeltas(result).confirmedCounselingCoursePreferences, null);
  assert.equal(result.runtimeState.memoryOutputs.some((output) => output.type === "confirmed_counseling_preference"), false);
});

test("phase 4 extracts course university and pathway considering fields", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I am considering Psychology at University A through foundation."
  });

  const flowDriving = flowDrivingDeltas(result);
  assert.equal(flowDriving.coursesConsidering[0].value, "Psychology");
  assert.equal(flowDriving.universitiesConsidering[0].value, "University A");
  assert.equal(flowDriving.pathwaysConsidering[0].value, "Foundation");
});

test("route profile sends no course or university direction to course/pathway exploration", async () => {
  const app = testApp();
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
  const app = testApp();
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
  const app = testApp();
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
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer a budget university around KL with good ranking."
  });

  const qualityDeltas = qualityEnhancingDeltas(result);
  assert.equal(flowDrivingDeltas(result).academicResults.length, 0);
  assert.equal(result.operatingContext.profileCompleteness, "incomplete");
  assert.deepEqual(qualityDeltas.map((delta) => delta.type), ["constraint", "preference", "preference"]);
});

test("student posture signals are accepted as runtime-only signals", async () => {
  const extractor = testSemanticDeltaExtractor();
  const cases = [
    ["I'm just browsing.", "just_browsing"],
    ["I already want Psychology, but I don't know which university.", "course_first"],
    ["Which is better, University A or University B?", "comparison_oriented"],
    ["This option seems best for me.", "decision_ready"]
  ];

  for (const [studentMessage, posture] of cases) {
    const raw = await extractor.extract({ conversationId: "c", turnId: "t", messageId: "m", studentMessage }, []);
    const accepted = new SemanticDeltaValidator().validate({ rawSemanticDelta: raw, turnInput: { conversationId: "c", turnId: "t", messageId: "m", studentMessage } });
    assert.equal(accepted.acceptedRuntimeOnlySignals.find((signal) => signal.kind === "student_posture").posture, posture);
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
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I like coffee."
  });

  assert.equal(qualityEnhancingDeltas(result).length, 0);
  assert.ok(result.acceptedSemanticDelta.rejectedCandidates.some((candidate) => candidate.reason === "quality_signal_low_usefulness"));
});

test("phase 4 rejects invented quality enhancing types", () => {
  const result = new SemanticDeltaValidator().validate({
    rawSemanticDelta: {
      memoryDeltaCandidates: {
        flowDrivingDeltas: {
          academicResults: [],
          coursesConsidering: [],
          confirmedCounselingCoursePreferences: null,
          universitiesConsidering: [],
          confirmedCounselingUniversityPreferences: null,
          pathwaysConsidering: [],
          confirmedCounselingPathwayPreferences: null
        },
        qualityEnhancingDeltas: [{
          operation: "add_new",
          kind: "quality_enhancing",
          type: "counseling_goal",
          value: { status: "undecided_on_course" },
          usefulness: "high",
          sensitivity: "none",
          confidence: "high",
          evidence: [{ quote: "I don't know what course I want yet" }]
        }]
      },
      runtimeOnlySignalCandidates: []
    },
    turnInput: { studentMessage: "I don't know what course I want yet" }
  });

  assert.equal(result.acceptedMemoryDeltas.qualityEnhancingDeltas.length, 0);
  assert.ok(result.rejectedCandidates.some((candidate) => candidate.reason === "quality_type_invalid"));
});

test("phase 4 knowledge needs are accepted for fees entry requirements and ranking", async () => {
  const extractor = testSemanticDeltaExtractor();
  const result = await extractor.extract({
    conversationId: "test",
    turnId: "turn",
    messageId: "message",
    studentMessage: "What are the fees, entry requirements, and ranking for Psychology?"
  }, []);

  assert.deepEqual(result.runtimeOnlySignalCandidates.filter((signal) => signal.kind === "knowledge_need").map((signal) => signal.type), ["fees", "entry_requirements", "ranking"]);
});

test("openai semantic delta extractor passes SemanticDeltaResult schema", async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return { output_text: JSON.stringify(semanticDeltaFixture()) };
      }
    };
  };

  try {
    const extractor = new AISemanticDeltaExtractor({ provider: "openai", openaiApiKey: "test-key", model: "gpt-test" });
    const result = await extractor.extract({
      conversationId: "conversation",
      turnId: "turn",
      messageId: "message",
      studentMessage: "Psychology sounds interesting."
    }, []);

    assert.match(capturedRequest.url, /api\.openai\.com\/v1\/responses/);
    assert.equal(capturedRequest.body.text.format.type, "json_schema");
    assert.equal(capturedRequest.body.text.format.name, "SemanticDeltaResult");
    assert.ok(capturedRequest.body.text.format.schema.required.includes("memoryDeltaCandidates"));
    assert.equal(capturedRequest.body.text.format.schema.properties.conversationId, undefined);
    const flowSchema = capturedRequest.body.text.format.schema.properties.memoryDeltaCandidates.properties.flowDrivingDeltas;
    const qualityTypeSchema = capturedRequest.body.text.format.schema.properties.memoryDeltaCandidates.properties.qualityEnhancingDeltas.items.properties.type;
    assert.equal(flowSchema.properties.minimumProfileSignals, undefined);
    assert.equal(flowSchema.properties.confirmedCounselingCoursePreferences.type, "object");
    assert.equal(flowSchema.required.includes("confirmedCounselingCoursePreferences"), false);
    assert.deepEqual(qualityTypeSchema.enum, ["concern_or_blocker", "constraint", "preference", "influence_or_context", "other"]);
    assert.match(qualityTypeSchema.description, /not knowing what course/);
    assert.equal(qualityTypeSchema.oneOf, undefined);
    assert.equal(qualityTypeSchema.anyOf, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].value, "Psychology");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini semantic delta extractor passes concise JSON schema without platform metadata", async () => {
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
            content: [{ type: "text", text: JSON.stringify(semanticDeltaFixture()) }]
          }]
        };
      }
    };
  };

  try {
    const extractor = new AISemanticDeltaExtractor({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    const result = await extractor.extract({
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
    assert.ok(capturedRequest.body.response_format.schema.required.includes("memoryDeltaCandidates"));
    assert.equal(capturedRequest.body.response_format.schema.required.includes("conversationId"), false);
    assert.equal(capturedRequest.body.response_format.schema.properties.conversationId, undefined);
    const flowSchema = capturedRequest.body.response_format.schema.properties.memoryDeltaCandidates.properties.flowDrivingDeltas;
    const qualityTypeSchema = capturedRequest.body.response_format.schema.properties.memoryDeltaCandidates.properties.qualityEnhancingDeltas.items.properties.type;
    assert.equal(flowSchema.properties.coursesConsidering.items.properties.source, undefined);
    assert.equal(flowSchema.properties.minimumProfileSignals, undefined);
    assert.equal(flowSchema.properties.confirmedCounselingCoursePreferences.type, "object");
    assert.equal(flowSchema.required.includes("confirmedCounselingCoursePreferences"), false);
    assert.match(qualityTypeSchema.description, /not knowing what course/);
    assert.equal(qualityTypeSchema.oneOf, undefined);
    assert.equal(qualityTypeSchema.anyOf, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].value, "Psychology");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini concise semantic delta response is hydrated before validation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        steps: [{
          type: "model_output",
          content: [{ type: "text", text: JSON.stringify(conciseSemanticDeltaFixture()) }]
        }]
      };
    }
  });

  try {
    const extractor = new AISemanticDeltaExtractor({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    const result = await extractor.extract({
      conversationId: "conversation",
      turnId: "turn",
      messageId: "message",
      studentMessage: "Psychology sounds interesting."
    }, []);

    assert.equal(result.conversationId, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].source, "current_message");
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].promotionRisk, "none");
    assert.equal(result.memoryDeltaCandidates.qualityEnhancingDeltas[0].evidence[0].quote, "people focused");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("gemini semantic delta extractor surfaces live Gemini 400", async () => {
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
    const extractor = new AISemanticDeltaExtractor({ provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });
    await assert.rejects(extractor.extract({
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

test("raw semantic delta layer returns parsed OpenAI output without hydration or fast boundary input", async () => {
  const originalFetch = globalThis.fetch;
  const rawSemanticDelta = rawSemanticDeltaFixture();
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return { output_text: JSON.stringify(rawSemanticDelta) };
      }
    };
  };

  try {
    const result = await parseLlmSemanticDelta({
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    }, { provider: "openai", openaiApiKey: "test-key", model: "gpt-test" });

    assert.match(capturedRequest.url, /api\.openai\.com\/v1\/responses/);
    assert.deepEqual(JSON.parse(capturedRequest.body.input[1].content), {
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    });
    assert.deepEqual(result, rawSemanticDelta);
    assert.equal(result.conversationId, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].source, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].promotionRisk, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("raw semantic delta layer returns parsed Gemini output without hydration or fast boundary input", async () => {
  const originalFetch = globalThis.fetch;
  const rawSemanticDelta = rawSemanticDeltaFixture();
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url: String(url), body: JSON.parse(options.body) };
    return {
      ok: true,
      async json() {
        return {
          steps: [{
            type: "model_output",
            content: [{ type: "text", text: JSON.stringify(rawSemanticDelta) }]
          }]
        };
      }
    };
  };

  try {
    const result = await parseLlmSemanticDelta({
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    }, { provider: "gemini", geminiApiKey: "test-key", model: "gemini-test" });

    assert.match(capturedRequest.url, /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    assert.deepEqual(JSON.parse(capturedRequest.body.input), {
      studentMessage: "Psychology sounds interesting.",
      recentConversationSummary: "student: hello"
    });
    assert.deepEqual(result, rawSemanticDelta);
    assert.equal(result.conversationId, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].source, undefined);
    assert.equal(result.memoryDeltaCandidates.flowDrivingDeltas.coursesConsidering[0].promotionRisk, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("raw semantic delta layer requires a provider API key", async () => {
  await assert.rejects(parseLlmSemanticDelta({
    studentMessage: "Psychology sounds interesting."
  }, { provider: "openai", openaiApiKey: "" }), /API key is required/);
});

test("phase 4 direction change creates runtime-only ambiguity without rewriting active direction", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Actually, I don't want Psychology anymore. I want IT."
  });

  assert.equal(runtimeSignals(result, "ambiguity")[0].type, "direction_change");
  assert.equal(result.operatingContext.activeStudentDirection.courseOrProgram, "Psychology");
  assert.equal(result.operatingContext.counselorResponseMode, "clarify_once");
});

test("phase 4 audit records accepted rejected and downgraded semantic deltas", async () => {
  const app = testApp({
    aiSemanticDeltaExtractor: {
      provider: "mock",
      model: "test",
      async extract() {
        return {
          memoryDeltaCandidates: {
            flowDrivingDeltas: {
              academicResults: [],
              coursesConsidering: [],
              confirmedCounselingCoursePreferences: {
                operation: "add_new",
                value: "Psychology",
                status: "confirmed_counseling_preference",
                confidence: "high",
                evidence: [{ quote: "I prefer Psychology" }]
              },
              universitiesConsidering: [],
              confirmedCounselingUniversityPreferences: null,
              pathwaysConsidering: [],
              confirmedCounselingPathwayPreferences: null
            },
            qualityEnhancingDeltas: [{
              operation: "add_new",
              kind: "quality_enhancing",
              type: "other",
              value: { trivia: "coffee" },
              usefulness: "low",
              sensitivity: "none",
              confidence: "high",
              evidence: [{ quote: "coffee" }]
            }]
          },
          runtimeOnlySignalCandidates: []
        };
      }
    }
  });
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer Psychology"
  });

  assert.ok(result.auditEvent.semanticDeltaAudit.acceptedSemanticDelta);
  assert.ok(result.auditEvent.semanticDeltaAudit.rejectedCandidates.some((candidate) => candidate.reason === "quality_signal_low_usefulness"));
  assert.ok(result.auditEvent.semanticDeltaAudit.downgradedCandidates.some((candidate) => candidate.reason === "value_confirmation_not_explicit"));
});

test("phase 4 invalid semantic delta evidence falls back safely", async () => {
  const app = testApp({
    aiSemanticDeltaExtractor: {
      provider: "mock",
      model: "test",
      async extract() {
        return {
          memoryDeltaCandidates: {
            flowDrivingDeltas: {
              academicResults: [],
              coursesConsidering: [{
                operation: "add_new",
                value: "Psychology",
                status: "considering",
                confidence: "high",
                evidence: []
              }],
              confirmedCounselingCoursePreferences: null,
              universitiesConsidering: [],
              confirmedCounselingUniversityPreferences: null,
              pathwaysConsidering: [],
              confirmedCounselingPathwayPreferences: null
            },
            qualityEnhancingDeltas: []
          },
          runtimeOnlySignalCandidates: []
        };
      }
    }
  });
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology"
  });

  assert.equal(result.acceptedSemanticDelta.status, "safe_fallback");
  assert.ok(result.acceptedSemanticDelta.rejectedCandidates.some((candidate) => candidate.reason === "missing_evidence"));
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
  const app = testApp();
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
  assert.equal(runtimeSignals(handoff, "boundary").find((signal) => signal.type === "ready_to_apply_or_register").triggerType, "H1");
  assert.equal(handoff.validationResult.status, "handoff_override");
  assert.equal(handoff.commitResult.handoffPrepared, true);
  assert.equal(handoff.runtimeState.handoff.required, true);
  assert.ok(handoff.auditEvent.skillSelection.selectedRuntimeSkill);
  assert.ok(handoff.auditEvent.commitResult);
});

test("ambiguous proceed after recommendation clarifies without confirming preference", async () => {
  const app = testApp();
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
  const app = testApp();

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
  const app = testApp();
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
  const app = testApp();
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
  const app = testApp();
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
  const app = testApp({
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

function semanticDeltaFixture() {
  return {
    memoryDeltaCandidates: {
      flowDrivingDeltas: {
        academicResults: [],
        coursesConsidering: [{
          operation: "add_new",
          value: "Psychology",
          status: "considering",
          confidence: "high",
          evidence: [{ quote: "Psychology sounds interesting" }]
        }],
        confirmedCounselingCoursePreferences: null,
        universitiesConsidering: [],
        confirmedCounselingUniversityPreferences: null,
        pathwaysConsidering: [],
        confirmedCounselingPathwayPreferences: null
      },
      qualityEnhancingDeltas: []
    },
    runtimeOnlySignalCandidates: []
  };
}

function conciseSemanticDeltaFixture() {
  return {
    memoryDeltaCandidates: {
      flowDrivingDeltas: {
        academicResults: [],
        coursesConsidering: [{
          operation: "add_new",
          value: "Psychology",
          status: "considering",
          confidence: "high",
          evidence: [{ quote: "Psychology sounds interesting" }]
        }],
        confirmedCounselingCoursePreferences: null,
        universitiesConsidering: [],
        confirmedCounselingUniversityPreferences: null,
        pathwaysConsidering: [],
        confirmedCounselingPathwayPreferences: null
      },
      qualityEnhancingDeltas: [{
        operation: "add_new",
        kind: "quality_enhancing",
        type: "preference",
        value: { interest: "people focused" },
        usefulness: "high",
        sensitivity: "none",
        confidence: "medium",
        evidence: [{ quote: "people focused" }]
      }]
    },
    runtimeOnlySignalCandidates: []
  };
}

function rawSemanticDeltaFixture() {
  return semanticDeltaFixture();
}

