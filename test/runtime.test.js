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
import { SemanticDeltaValidator } from "../src/runtime/semanticDeltaValidator.js";
import { AuditEventStore } from "../src/runtime/auditEventStore.js";
import { CurrentTruthProjector } from "../src/runtime/currentTruthProjector.js";
import { MemoryEventStore } from "../src/runtime/memoryEventStore.js";
import { MemoryEventValidator } from "../src/runtime/memoryEventValidator.js";
import { MemoryStateService } from "../src/runtime/memoryStateService.js";

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

async function phase5MemoryHarness() {
  const dir = await mkdtemp(path.join(tmpdir(), "phase5-memory-"));
  const memoryEventStore = new MemoryEventStore(path.join(dir, "memory-events.ndjson"));
  const auditEventStore = new AuditEventStore(path.join(dir, "audit.ndjson"));
  return {
    service: new MemoryStateService({ memoryEventStore, auditEventStore }),
    memoryEventStore,
    auditEventStore
  };
}

function acceptedDeltaFromRaw(rawSemanticDelta, ids = {}) {
  return new SemanticDeltaValidator().validate({
    rawSemanticDelta,
    fastBoundarySignals: [],
    turnInput: {
      conversationId: ids.conversationId || "conversation-1",
      turnId: ids.turnId || "turn-1",
      messageId: ids.messageId || "message-1",
      studentMessage: ids.studentMessage || "Psychology sounds interesting."
    },
    extractor: { provider: "mock", model: "test" }
  });
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
      ...ambiguitySignals(text),
      ...routeEpisodeSignals(text)
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

function routeEpisodeSignals(text) {
  const signals = [];
  if (/\b(actually|forget .+ first|before choosing|help me choose university|choose university)\b/i.test(text)) {
    signals.push({
      ...baseSignal(text, text, "high", "student_redirected_route"),
      kind: "route_episode",
      signalType: "student_led_route_switch_signal",
      routeHint: /university/i.test(text) ? "university_exploration" : "course_exploration"
    });
  }
  if (/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) {
    signals.push({
      ...baseSignal(text, text, "high", "explicit_route_confirmation"),
      kind: "route_episode",
      signalType: "route_confirmation_signal",
      routeHint: /sunway|taylor|monash|apu|university/i.test(text) ? "university_exploration" : "course_exploration"
    });
  }
  if (/\b(discuss with my parents|more time|pause this|think about it|not ready to choose)\b/i.test(text)) {
    signals.push({
      ...baseSignal(text, text, "high", "route_deferred"),
      kind: "route_episode",
      signalType: "route_deferral_signal"
    });
  }
  return signals;
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
  if (/\b(human counselor|human counsellor|real person|talk to.*human)\b/i.test(text)) return posture(text, "human_help_seeking", "prepare_handoff", "handoff_safe");
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
  const { responsePlan = {}, studentMessage, knowledge } = executionContext;
  const requiredBehavior = responsePlan.requiredBehavior || "continue_normal_counseling";
  const action = responsePlan.primaryCounselingAction;
  const baseFlags = {
    needsClarification: requiredBehavior === "ask_clarification",
    boundarySensitive: responsePlan.zone !== "green",
    officialActionRisk: responsePlan.zone === "red",
    memoryWriteRequiresValidation: true,
    knowledgeUsed: Boolean(knowledge),
    knowledgeUncertain: knowledge?.uncertaintyLevel === "decision_critical"
  };

  if (requiredBehavior === "prepare_handoff") {
    return {
      response: {
        studentMessage: "I can help prepare the next step, but application, registration, payment, or seat confirmation needs a human counselor. I will prepare a handoff summary so the team can continue with you.",
        responseIntent: "handoff"
      },
      proposedContextUpdate: { primaryCounselingAction: "prepare_handoff", handoffStatus: "prepared", preferenceStrength: "L5" },
      proposedOutputs: {
        recommendationOutputs: [],
        handoffOutput: {
          required: true,
          triggerType: responsePlan.triggerType,
          reason: responsePlan.boundaryReason,
          summary: `Student said: "${studentMessage}". Human counselor should handle official next steps.`
        }
      },
      validationFlags: baseFlags
    };
  }

  if (requiredBehavior === "ask_clarification") {
    return {
      response: {
        studentMessage: "When you say proceed, do you mean this is your counseling preference for now, or that you want to apply or register officially?",
        responseIntent: "ask_clarification"
      },
      proposedContextUpdate: { primaryCounselingAction: "clarify_ambiguity" },
      proposedOutputs: { recommendationOutputs: [] },
      validationFlags: baseFlags
    };
  }

  if (action === "answer_detour") {
    const facts = knowledge?.answer?.facts || [];
    const factText = facts.length
      ? facts.map((fact) => `${fact.program} at ${fact.university}: ${fact.location}, about MYR ${fact.annualFeeMyr}/year, ${fact.pathwayDuration}.`).join(" ")
      : knowledge?.answer?.caveat || "I do not have a verified fact for that in the prototype catalog.";
    return executionResult("answer", `${factText} After that, we can return to choosing the best-fit direction.`, {
      proposedContextUpdate: {}
    }, baseFlags);
  }

  if (action === "orient_initial_route") {
    return executionResult("ask_clarification", "To guide you properly, I only need the routing basics first: your academic result, whether you already have a course in mind, and whether you already have a university in mind.", {
      proposedContextUpdate: {}
    }, baseFlags);
  }

  if (action === "recommend_directionally") {
    return executionResult("recommend", "You already have enough direction for a first counseling recommendation. Based on what you shared, I can make a medium-confidence suggestion and then refine it with one fit question. Psychology could fit if you want people-focused work; Business stays broader if you want management, marketing, or finance flexibility. Which matters more to you now: career direction, budget, or location?", {
      proposedContextUpdate: {},
      recommendationOutputs: [{
        option: "R2 directional shortlist based on current course or pathway direction",
        fitReasons: ["Uses the student's academic result and stated direction"],
        assumptions: ["University-fit details can still refine the recommendation"],
        cautions: ["Counseling recommendation only; not admission or registration approval"],
        confidence: "medium"
      }]
    }, baseFlags);
  }

  if (action === "compare_shortlist") {
    return executionResult("compare", "You are comparing directions, so the useful move is to narrow by trade-off instead of adding more options. Psychology is stronger if you want counseling, HR, or human behavior. Business is broader if you want management, marketing, or finance flexibility. Which trade-off matters more to you: focused interest or broader flexibility?", {
      proposedContextUpdate: {}
    }, baseFlags);
  }

  if (action === "confirm_counseling_preference") {
    return executionResult("confirm_preference", "For counseling purposes, I can treat this as your current preferred direction. This is not an application, registration, payment, enrollment, seat reservation, or CRM update. It just gives us a clear counseling milestone; from here, you can compare one final alternative, take time to think, or speak with a human counselor for official next steps.", {
      proposedContextUpdate: {}
    }, baseFlags);
  }

  return executionResult("answer", "It sounds like you are still finding the right direction. We can start broad and use your strengths, disliked subjects, and career interest to narrow the route before talking about university fit. What kind of subjects or work do you usually prefer?", {
    proposedContextUpdate: {}
  }, baseFlags);
}

function executionResult(responseIntent, studentMessage, proposals, flags) {
  return {
    response: { studentMessage, responseIntent },
    proposedContextUpdate: proposals.proposedContextUpdate || {},
    proposedOutputs: {
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
  assert.equal(preference.operatingContext.activeRouteEpisode.progressState, "confirmed_preference");
  assert.equal(preference.operatingContext.activeRouteEpisode.routeOutcomeCandidate, "confirmed_preference");
  assert.equal(preference.operatingContext.preferenceStrength, "L4");
  assert.equal(preference.runtimeState.handoff, null);
  assert.equal("memoryOutputs" in preference.runtimeState, false);
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
  assert.equal("memoryOutputs" in result.runtimeState, false);
});

test("broad course interest stays in course exploration until university intent is explicit", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM result is 5 credits."
  });
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology sounds interesting."
  });

  assert.equal(result.routeCandidate.routeType, "course_exploration");
  assert.equal(result.operatingContext.activeRouteEpisode.routeType, "course_exploration");
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

test("route episode sends no course or university direction to course exploration", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits. I don't know what course or university I want yet."
  });

  assert.equal(result.operatingContext.currentTruth.routeReadiness, "incomplete");
  assert.equal(result.operatingContext.activeRouteEpisode.routeType, "course_exploration");
  assert.equal(result.operatingContext.activeRouteEpisode.progressState, "exploration");
  assert.equal(result.operatingContext.primaryCounselingAction, "explore_route");
  assert.equal(result.operatingContext.recommendationReadiness, "R1");
  assert.equal(result.operatingContext.studentPosture, "lost_or_confused");
});

test("route episode sends course-first student to university exploration and allows R2", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I want Psychology, but I don't know which university."
  });

  assert.equal(result.operatingContext.activeRouteEpisode.routeType, "university_exploration");
  assert.equal(result.operatingContext.activeRouteEpisode.progressState, "recommendation_ready");
  assert.equal(result.operatingContext.recommendationReadiness, "R2");
  assert.equal(result.operatingContext.studentPosture, "course_first");
  assert.equal(result.operatingContext.counselorResponseMode, "route_explanation");
  assert.equal(result.skillSelection.selectedRuntimeSkill.name, "directional-recommendation");
});

test("route episode sends university-first student to course exploration in university context", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I want University A, but I don't know what course."
  });

  assert.equal(result.operatingContext.activeRouteEpisode.routeType, "course_exploration_within_university_context");
  assert.equal(result.operatingContext.activeRouteEpisode.progressState, "exploration");
  assert.equal(result.operatingContext.primaryCounselingAction, "explore_route");
  assert.equal(result.operatingContext.studentPosture, "university_first");
});

test("budget ranking and location are quality signals not route gates", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer a budget university around KL with good ranking."
  });

  const qualityDeltas = qualityEnhancingDeltas(result);
  assert.equal(flowDrivingDeltas(result).academicResults.length, 0);
  assert.equal(result.operatingContext.currentTruth.routeReadiness, "incomplete");
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
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - university_exploration
applies_to_actions:
  - explore_route
applies_to_zones:
  - green
allowed_memory_outputs:
  - exploration_prompted
---
# route test
`, "utf8");

  const result = await new SkillControlService(skillsDir).select({
    activeRouteEpisode: { routeType: "course_exploration", progressState: "exploration" },
    primaryCounselingAction: "explore_route",
    currentZone: "green",
    recommendationReadiness: "R1"
  }, { allowedNextBehavior: "continue", requiredBoundaryRules: [] });

  assert.ok(result.rejectedCandidates.some((candidate) => candidate.reason === "route_course_exploration_not_allowed"));
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

test("phase 5 commits accepted semantic deltas into durable memory and current truth", async () => {
  const { service, memoryEventStore } = await phase5MemoryHarness();
  const acceptedSemanticDelta = acceptedDeltaFromRaw(conciseSemanticDeltaFixture(), {
    conversationId: "student-phase5-1",
    turnId: "turn-phase5-1",
    messageId: "message-phase5-1"
  });

  const before = await service.deriveCurrentTruth({ studentId: "student-phase5-1" });
  const commit = await service.commitPreResponseStudentMemory({
    studentId: "student-phase5-1",
    acceptedSemanticDelta,
    currentTruthBeforeCommit: before
  });
  const currentTruth = await service.deriveCurrentTruth({ studentId: "student-phase5-1" });
  const events = await memoryEventStore.getEventsForProjection({ studentId: "student-phase5-1" });

  assert.equal(commit.appendedMemoryEventIds.length, 2);
  assert.equal(events.every((event) => event.officialTruthBoundary.isOfficialTruth === false), true);
  assert.equal(currentTruth.direction.courseDirectionStatus, "considering_some_courses");
  assert.equal(currentTruth.recommendationReadiness.basis.hasEnoughFitSignalsForHighQualityRecommendation, true);
});

test("phase 5 runtime-only signals do not become durable memory", async () => {
  const { service, memoryEventStore } = await phase5MemoryHarness();
  const acceptedSemanticDelta = acceptedDeltaFromRaw({
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
      qualityEnhancingDeltas: []
    },
    runtimeOnlySignalCandidates: [{
      kind: "student_posture",
      posture: "lost_or_confused",
      confidence: "high",
      evidence: [{ quote: "I'm confused" }]
    }]
  }, {
    conversationId: "student-phase5-runtime-only",
    turnId: "turn-phase5-runtime-only",
    messageId: "message-phase5-runtime-only",
    studentMessage: "I'm confused."
  });

  const commit = await service.commitPreResponseStudentMemory({
    studentId: "student-phase5-runtime-only",
    acceptedSemanticDelta,
    currentTruthBeforeCommit: await service.deriveCurrentTruth({ studentId: "student-phase5-runtime-only" })
  });
  const events = await memoryEventStore.getEventsForProjection({ studentId: "student-phase5-runtime-only" });

  assert.deepEqual(commit.appendedMemoryEventIds, []);
  assert.deepEqual(events, []);
});

test("phase 5 rejects official-truth durable memory drafts", () => {
  const result = new MemoryEventValidator().validate({
    draft: {
      studentId: "student-phase5-official",
      category: "handoff_readiness",
      operation: "add_new",
      payload: { value: "registration completed" },
      confidence: "high",
      evidence: [{ quote: "registration completed", source: "student_message" }],
      source: {
        acceptedSemanticDeltaId: "semantic-1",
        acceptedDeltaId: "delta-1",
        conversationId: "student-phase5-official",
        turnId: "turn-1",
        messageId: "message-1"
      },
      merge: { projectionIntent: "may_update_current_truth" },
      officialTruthBoundary: { isOfficialTruth: false }
    }
  });

  assert.equal(result.status, "reject");
  assert.equal(result.invariantChecks.officialTruthSafe, false);
  assert.ok(result.errors.includes("official_truth_not_memory"));
});

test("phase 5 duplicate idempotency keys do not duplicate memory events", async () => {
  const { service, memoryEventStore } = await phase5MemoryHarness();
  const acceptedSemanticDelta = acceptedDeltaFromRaw(semanticDeltaFixture(), {
    conversationId: "student-phase5-duplicate",
    turnId: "turn-phase5-duplicate",
    messageId: "message-phase5-duplicate"
  });
  const before = await service.deriveCurrentTruth({ studentId: "student-phase5-duplicate" });

  const first = await service.commitPreResponseStudentMemory({
    studentId: "student-phase5-duplicate",
    acceptedSemanticDelta,
    currentTruthBeforeCommit: before
  });
  const second = await service.commitPreResponseStudentMemory({
    studentId: "student-phase5-duplicate",
    acceptedSemanticDelta,
    currentTruthBeforeCommit: before
  });
  const events = await memoryEventStore.getEventsForProjection({ studentId: "student-phase5-duplicate" });

  assert.equal(first.appendedMemoryEventIds.length, 1);
  assert.equal(second.ignoredDuplicateEventIds.length, 1);
  assert.equal(events.length, 1);
});

test("route outcome memory records accepted fallback without promoting to L4", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I don't know what course or university I want yet."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Okay, let's use Business as my backup for now."
  });

  assert.equal(result.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "accepted_fallback");
  assert.notEqual(result.currentTruth.preference.preferenceStrength, "L4");
  assert.equal(result.currentTruth.routeEpisodeProjection.fallbackHistory[0].outcome, "accepted_fallback");
});

test("route outcome memory records deferral and resume route hint", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I want Psychology, but I don't know which university."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I need more time to discuss with my parents first."
  });

  assert.equal(result.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "deferred_decision");
  assert.equal(result.currentTruth.routeEpisodeProjection.routeDeferralHistory[0].routeType, "university_exploration");
  assert.equal(result.currentTruth.routeEpisodeProjection.resumeRouteCandidateHint, "university_exploration");
});

test("student-led route switch creates route outcome memory with evidence", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I don't know what course or university I want yet."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Actually, I already know I want Psychology. Help me choose university."
  });

  assert.equal(result.operatingContext.activeRouteEpisode.routeType, "university_exploration");
  assert.equal(result.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "student_switched_route");
  assert.equal(result.currentTruth.routeEpisodeProjection.routeSwitchHistory[0].value.nextRouteCandidate, "university_exploration");
});

test("confirmed course route advances to university comparison without stale active direction", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I don't know what course or university I want yet."
  });

  const preference = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology is my choice for now."
  });
  assert.equal(preference.operatingContext.activeRouteEpisode.routeOutcomeCandidate, "confirmed_preference");
  assert.equal(preference.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "confirmed_preference");

  const comparison = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Compare different universities that offer Psychology."
  });

  assert.equal(comparison.routeCandidate.routeType, "university_exploration");
  assert.equal(comparison.operatingContext.activeRouteEpisode.routeType, "university_exploration");
  assert.equal(comparison.operatingContext.activeRouteEpisode.progressState, "comparison");
  assert.equal(comparison.operatingContext.activeRouteEpisode.activeDirections.course, "Psychology");
  assert.equal(comparison.operatingContext.activeStudentDirection.courseOrProgram, "Psychology");
  assert.equal(comparison.validationResult.acceptedOutputs.routeOutcomeOutput, undefined);
  assert.equal("memoryOutputs" in comparison.validationResult.acceptedOutputs, false);
  assert.equal("memoryOutputs" in comparison.runtimeState, false);
});

test("rejected route confirmation signal does not commit inferred university route", async () => {
  const baseExtractor = testSemanticDeltaExtractor();
  const app = testApp({
    aiSemanticDeltaExtractor: {
      provider: "mock",
      model: "route-regression",
      async extract(turnInput, fastBoundarySignals = []) {
        const raw = await baseExtractor.extract(turnInput, fastBoundarySignals);
        if (/systems and development side of technology/i.test(turnInput.studentMessage)) {
          raw.runtimeOnlySignalCandidates.push({
            ...baseSignal(turnInput.studentMessage, "systems and development side of technology", "high", "over-eager confirmation"),
            kind: "route_episode",
            signalType: "route_confirmation_signal",
            routeHint: "university_exploration"
          });
        }
        return raw;
      }
    }
  });
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and I don't know what course or university I want yet."
  });

  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer the systems and development side of technology."
  });

  assert.equal(result.validationResult.routeOutcomeValidation.status, "reject");
  assert.equal(result.operatingContext.activeRouteEpisode.routeType, "course_exploration");
  assert.equal(result.operatingContext.activeRouteEpisode.progressState, "decision_support");
  assert.equal(result.operatingContext.activeRouteEpisode.routeOutcomeCandidate, undefined);
  assert.equal(result.runtimeState.operatingContext.activeRouteEpisode.routeType, "course_exploration");
});

test("current truth promotes confirmed direction events into confirmed counseling preference", () => {
  const currentTruth = new CurrentTruthProjector().project({
    studentId: "student-confirmed-direction",
    events: [{
      eventId: "event-1",
      studentId: "student-confirmed-direction",
      createdAt: "2026-07-04T08:00:00.000Z",
      category: "course_direction",
      operation: "add_new",
      payload: { value: "Business Information Systems", status: "confirmed_counseling_preference" },
      confidence: "high",
      evidence: [{ quote: "i want Business Information Systems" }],
      officialTruthBoundary: { isOfficialTruth: false }
    }]
  });

  assert.equal(currentTruth.preference.preferenceStrength, "L4");
  assert.equal(currentTruth.preference.confirmedCounselingPreference.courseOrProgram, "Business Information Systems");
  assert.equal(currentTruth.direction.courseDirectionStatus, "confirmed_counseling_course_preference");
});

test("shortlist and recommendation alone do not create route outcome memory", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const recommendation = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });
  const comparison = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Compare Psychology and Business for me."
  });

  assert.equal(recommendation.validationResult.acceptedOutputs.routeOutcomeOutput, undefined);
  assert.equal(comparison.validationResult.acceptedOutputs.routeOutcomeOutput, undefined);
  assert.equal(comparison.currentTruth.routeEpisodeProjection.routeOutcomeHistory.length, 0);
});

test("route audit events record candidate transition and outcome validation", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I got 5 credits and Psychology is my choice for now."
  });
  const stored = await app.getConversation(conversation.conversationId);
  const eventTypes = stored.auditEvents.map((event) => event.eventType);

  assert.equal(result.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "confirmed_preference");
  assert.ok(eventTypes.includes("route_candidate_selected"));
  assert.ok(eventTypes.includes("route_transition_decision"));
  assert.ok(eventTypes.includes("route_outcome_accepted"));
  assert.ok(eventTypes.includes("route_outcome_memory_accepted"));
});

test("phase 5 duplicate route outcome idempotency keys do not duplicate memory events", async () => {
  const { service, memoryEventStore } = await phase5MemoryHarness();
  const acceptedSemanticDelta = acceptedDeltaFromRaw({
    memoryDeltaCandidates: { flowDrivingDeltas: {}, qualityEnhancingDeltas: [] },
    runtimeOnlySignalCandidates: []
  }, { conversationId: "route-dup", turnId: "turn-route-dup", messageId: "message-route-dup" });
  const validationResult = {
    status: "accepted",
    acceptedOutputs: {
      recommendationOutputs: [],
      routeOutcomeOutput: {
        type: "route_outcome",
        value: {
          outcome: "deferred_decision",
          routeType: "course_exploration",
          progressState: "deferral_indecision",
          reason: "Student needs more time."
        },
        confidence: "medium",
        evidence: [{ quote: "I need more time." }]
      }
    }
  };

  await service.commitPostResponseAIOutputs({
    studentId: "student-route-dup",
    acceptedSemanticDelta,
    validatedAIOutput: {},
    validationResult,
    finalBoundaryResult: { allowedNextBehavior: "continue" },
    selectedSkillContext: { selectedRuntimeSkill: { name: "deferral-indecision", version: "1.3.0" } }
  });
  await service.commitPostResponseAIOutputs({
    studentId: "student-route-dup",
    acceptedSemanticDelta,
    validatedAIOutput: {},
    validationResult,
    finalBoundaryResult: { allowedNextBehavior: "continue" },
    selectedSkillContext: { selectedRuntimeSkill: { name: "deferral-indecision", version: "1.3.0" } }
  });

  const events = await memoryEventStore.getEventsForProjection({ studentId: "student-route-dup" });
  assert.equal(events.filter((event) => event.category === "route_outcome").length, 1);
});

test("phase 5 current truth projection is deterministic from memory events", () => {
  const projector = new CurrentTruthProjector();
  const events = [{
    eventId: "event-1",
    studentId: "student-phase5-projector",
    category: "academic",
    operation: "add_new",
    payload: { rawText: "5 credits" },
    confidence: "high",
    officialTruthBoundary: { isOfficialTruth: false },
    createdAt: "2026-07-02T00:00:00.000Z"
  }, {
    eventId: "event-2",
    studentId: "student-phase5-projector",
    category: "course_direction",
    operation: "add_new",
    payload: { value: "Psychology", status: "preferred" },
    confidence: "high",
    officialTruthBoundary: { isOfficialTruth: false },
    createdAt: "2026-07-02T00:00:01.000Z"
  }, {
    eventId: "event-3",
    studentId: "student-phase5-projector",
    category: "handoff_readiness",
    operation: "add_new",
    payload: { type: "handoff_required", value: { triggerType: "H1", reason: "Student is asking to apply." } },
    confidence: "high",
    officialTruthBoundary: { isOfficialTruth: false },
    createdAt: "2026-07-02T00:00:02.000Z"
  }];

  const currentTruth = projector.project({ studentId: "student-phase5-projector", events });

  assert.equal(currentTruth.academic.academicResultStatus, "known");
  assert.equal(currentTruth.direction.courseDirectionStatus, "preferred_course_exists");
  assert.equal(currentTruth.preference.preferenceStrength, "L5");
  assert.equal(currentTruth.handoffReadiness.handoffRequired, true);
  assert.equal(currentTruth.handoffReadiness.officialTruthBoundary.applicationSubmitted, false);
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
  assert.equal(opening.operatingContext.primaryCounselingAction, "orient_initial_route");
  assert.equal(opening.operatingContext.activeRouteEpisode.routeType, "initial_route_selection");
  assert.equal(opening.skillSelection.selectedRuntimeSkill.name, "initial-route-orientation");

  const recommendation = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "My SPM results are good, I prefer budget value universities in Kuala Lumpur, and I am interested in Psychology."
  });
  assert.equal(recommendation.operatingContext.recommendationReadiness, "R3");
  assert.equal(recommendation.skillSelection.selectedRuntimeSkill.name, "directional-recommendation");
  assert.equal(recommendation.validationResult.acceptedOutputs.recommendationOutputs[0].confidence, "medium");

  const detour = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "What are the fees for Psychology?"
  });
  assert.equal(detour.operatingContext.activeRouteEpisode.progressState, "detour_resume");
  assert.equal(detour.operatingContext.activeRouteEpisode.detourOverlay.detourKind, "factual_knowledge");
  assert.equal(detour.skillSelection.selectedRuntimeSkill.name, "factual-detour-answering");

  const comparison = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Compare Psychology and Business for me."
  });
  assert.equal(comparison.operatingContext.activeRouteEpisode.progressState, "comparison");
  assert.equal(comparison.skillSelection.selectedRuntimeSkill.name, "shortlist-comparison");

  const preference = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I prefer Psychology as my choice for now."
  });
  assert.equal(preference.operatingContext.activeRouteEpisode.progressState, "confirmed_preference");
  assert.equal(preference.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "confirmed_preference");
  assert.equal("memoryOutputs" in preference.validationResult.acceptedOutputs, false);

  const handoff = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "I want to apply now."
  });
  assert.equal(handoff.boundaryResult.finalZone, "red");
  assert.equal(runtimeSignals(handoff, "boundary").find((signal) => signal.type === "ready_to_apply_or_register").triggerType, "H1");
  assert.equal(handoff.validationResult.status, "handoff_override");
  assert.equal(handoff.operatingContext.activeRouteEpisode.routeType, "handoff_preparation");
  assert.equal(handoff.validationResult.acceptedOutputs.routeOutcomeOutput.value.outcome, "handoff_required");
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
  assert.equal(result.operatingContext.primaryCounselingAction, "clarify_ambiguity");
  assert.equal("memoryOutputs" in result.runtimeState, false);
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
    assert.equal("memoryOutputs" in result.runtimeState, false);
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
  assert.equal(detour.operatingContext.activeRouteEpisode.progressState, "detour_resume");
  assert.equal(detour.operatingContext.primaryCounselingAction, "answer_detour");

  const resumed = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Compare Psychology and Business for me."
  });
  assert.equal(resumed.operatingContext.activeRouteEpisode.detourOverlay, undefined);
  assert.equal(resumed.operatingContext.activeRouteEpisode.progressState, "comparison");
  assert.equal(resumed.skillSelection.selectedRuntimeSkill.name, "shortlist-comparison");
});

test("unknown factual detour is caveated without committing AI memory output", async () => {
  const app = testApp();
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "What is the fee for Medicine in London?"
  });

  assert.equal(result.operatingContext.activeRouteEpisode.progressState, "detour_resume");
  assert.match(result.finalResponse, /do not have a verified catalog fact/i);
  assert.equal("memoryOutputs" in result.validationResult.acceptedOutputs, false);
  assert.equal("memoryOutputs" in result.runtimeState, false);
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
  assert.equal("memoryOutputs" in result.runtimeState, false);
});

test("phase 5 response retry does not duplicate pre-response memory", async () => {
  let calls = 0;
  const app = testApp({
    aiExecutionClient: {
      async execute(executionContext) {
        calls += 1;
        if (calls === 1) {
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
            validationFlags: {
              needsClarification: false,
              boundarySensitive: false,
              officialActionRisk: true,
              memoryWriteRequiresValidation: true,
              knowledgeUsed: false,
              knowledgeUncertain: false
            }
          };
        }
        return mockExecution(executionContext);
      }
    }
  });
  const conversation = await app.createConversation();
  const result = await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology sounds interesting."
  });

  assert.equal(calls, 2);
  assert.equal(result.validationResult.responseRetry.attempted, true);
  assert.equal(result.preResponseMemoryCommitResult.appendedMemoryEventIds.length, 1);
  assert.equal(result.preResponseMemoryCommitResult.ignoredDuplicateEventIds.length, 0);
  assert.equal(result.currentTruth.direction.activeCourseDirections.length, 1);
  assert.equal("memoryOutputs" in result.runtimeState, false);
});

test("phase 5 passes current truth before turn into semantic extraction", async () => {
  const currentTruthInputs = [];
  const app = testApp({
    aiSemanticDeltaExtractor: {
      provider: "mock",
      model: "test",
      async extract(turnInput, fastBoundarySignals = []) {
        currentTruthInputs.push(turnInput.currentTruthBeforeTurn);
        return mockSemanticDelta(turnInput, fastBoundarySignals);
      }
    }
  });
  const conversation = await app.createConversation();
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Psychology sounds interesting."
  });
  await app.handleTurn({
    conversationId: conversation.conversationId,
    studentMessage: "Actually, I want IT."
  });

  assert.equal(currentTruthInputs[0].courseDirectionStatus, "unknown");
  assert.equal(currentTruthInputs[1].courseDirectionStatus, "considering_some_courses");
  assert.deepEqual(currentTruthInputs[1].activeCourseDirections, [{ value: "Psychology", status: "considering" }]);
  assert.match(currentTruthInputs[1].instruction, /read-only context/i);
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
                proposedOutputs: { recommendationOutputs: [] },
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
      conversationContext: "student: I have SPM 5A",
      currentTruth: { academic: { status: "known", result: "SPM 5A" } },
      activeRouteEpisode: { routeType: "course_exploration", progressState: "exploration" },
      responsePlan: { requiredBehavior: "continue_normal_counseling", primaryCounselingAction: "explore_route" },
      skill: { name: "interest-exploration", version: "1.3.0", body: "# Interest Exploration\nAsk one useful next question." }
    });

    assert.match(capturedRequest.url, /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    assert.equal(capturedRequest.body.model, "gemini-test");
    assert.match(capturedRequest.body.system_instruction, /reflect the student's situation/i);
    assert.match(capturedRequest.body.input, /## Student Message\nHello/);
    assert.match(capturedRequest.body.input, /## Current Truth/);
    assert.match(capturedRequest.body.input, /## Runtime Skill/);
    assert.match(capturedRequest.body.input, /# Interest Exploration/);
    assert.doesNotMatch(capturedRequest.body.input, /"studentMessage"/);
    assert.equal(capturedRequest.body.response_format.mime_type, "application/json");
    assert.deepEqual(capturedRequest.body.response_format.schema.required, ["response", "proposedContextUpdate", "proposedOutputs", "validationFlags"]);
    assert.deepEqual(capturedRequest.body.response_format.schema.properties.response.required, ["studentMessage", "responseIntent"]);
    assert.deepEqual(capturedRequest.body.response_format.schema.properties.proposedOutputs.required, ["recommendationOutputs"]);
    assert.equal(capturedRequest.body.response_format.schema.properties.proposedOutputs.properties.memoryOutputs, undefined);
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
                  action: "route_orientation_requested",
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
      currentTruth: { academic: { status: "known", result: "SPM results are good" } },
      responsePlan: { requiredBehavior: "continue_normal_counseling", primaryCounselingAction: "orient_initial_route" },
      skill: { name: "initial-route-orientation", body: "# Initial Route Orientation" }
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

