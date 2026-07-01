const COURSES = ["psychology", "business", "computer science", "it", "design", "engineering", "accounting"];
const PATHWAYS = ["foundation", "diploma", "a-level", "a level"];
const UNIVERSITIES = ["demo metropolitan university", "demo valley university", "demo tech institute", "university a", "university b", "sunway", "taylor's", "taylors", "monash", "apu", "inti", "help", "utar"];
const NO_COURSE_DIRECTION = /\b(don'?t know what course|do not know what course|no course|not sure what to study|don't know what to study|do not know what to study)\b/i;
const NO_UNIVERSITY_DIRECTION = /\b(don'?t know which university|do not know which university|no university|not sure which university|haven'?t chosen.*university|have not chosen.*university)\b/i;

export class AIInterpretationClient {
  constructor({
    provider = process.env.AI_PROVIDER || inferProvider(process.env.AI_MODEL || process.env.GEMINI_MODEL || process.env.OPENAI_MODEL),
    apiKey,
    openaiApiKey = apiKey || process.env.OPENAI_API_KEY,
    geminiApiKey = process.env.GEMINI_API_KEY,
    model = process.env.AI_MODEL || (provider === "gemini"
      ? process.env.GEMINI_MODEL || "gemini-3.1-flash-lite"
      : process.env.OPENAI_MODEL || "gpt-4.1-mini")
  } = {}) {
    this.provider = provider;
    this.openaiApiKey = openaiApiKey;
    this.geminiApiKey = geminiApiKey;
    this.model = model;
  }

  async interpret(turnInput, fastBoundarySignals = []) {
    if (!this.hasApiKey()) return mockInterpretation(turnInput, fastBoundarySignals);
    return this.interpretLive(turnInput, fastBoundarySignals);
  }

  async interpretRaw(turnInput) {
    if (!this.hasApiKey()) throw new Error("AI interpretation API key is required for raw interpretation");
    if (this.provider === "gemini") return this.interpretGeminiRaw(turnInput);
    return this.interpretOpenAiRaw(turnInput);
  }

  async interpretLive(turnInput, fastBoundarySignals) {
    if (this.provider === "gemini") return this.interpretGeminiLive(turnInput, fastBoundarySignals);
    return this.interpretOpenAiLive(turnInput, fastBoundarySignals);
  }

  hasApiKey() {
    return this.provider === "gemini" ? Boolean(this.geminiApiKey) : Boolean(this.openaiApiKey);
  }

  async interpretOpenAiLive(turnInput, fastBoundarySignals) {
    const text = await this.fetchOpenAiInterpretationText(turnInput, fastBoundarySignals);
    return parseInterpretation(text, "OpenAI", turnInput);
  }

  async interpretOpenAiRaw(turnInput) {
    const text = await this.fetchOpenAiInterpretationText(turnInput);
    return parseRawInterpretation(text, "OpenAI");
  }

  async fetchOpenAiInterpretationText(turnInput, fastBoundarySignals) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content: "Extract counseling interpretation as JSON. The result is a proposal, not truth. Do not create official application, registration, payment, enrollment, seat, or CRM truth."
          },
          {
            role: "user",
            content: JSON.stringify(interpretationInput(turnInput, fastBoundarySignals))
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "InterpretationResult",
            schema: interpretationResultSchema()
          }
        }
      })
    });
    if (!response.ok) throw new Error(`OpenAI Responses API returned ${response.status}`);
    const payload = await response.json();
    const text = payload.output_text || payload.output?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")?.text;
    if (!text) throw new Error("OpenAI interpretation response did not include output text");
    return text;
  }

  async interpretGeminiLive(turnInput, fastBoundarySignals) {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/interactions");
    const request = geminiInterpretationRequest(turnInput, fastBoundarySignals, this.model);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.geminiApiKey },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}: ${await responseText(response)}`);
    }
    return parseGeminiInterpretationResponse(response, turnInput);
  }

  async interpretGeminiRaw(turnInput) {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/interactions");
    const request = geminiInterpretationRequest(turnInput, undefined, this.model);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.geminiApiKey },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}: ${await responseText(response)}`);
    }

    const payload = await response.json();
    const text = geminiInteractionText(payload);
    if (!text) throw new Error("Gemini interpretation response did not include output text");
    return parseRawInterpretation(text, "Gemini");
  }
}

function geminiInterpretationRequest(turnInput, fastBoundarySignals, model) {
  return {
    model: cleanGeminiModelName(model),
    system_instruction: "Extract counseling interpretation as JSON. Do not include conversationId, turnId, messageId, source, or promotionRisk; the platform fills those fields. Include short evidence quotes for extracted signals. The result is a proposal, not truth. Do not create official application, registration, payment, enrollment, seat, or CRM truth.",
    input: JSON.stringify(interpretationInput(turnInput, fastBoundarySignals)),
    store: false,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: geminiRawInterpretationResultSchema()
    }
  };
}

async function parseGeminiInterpretationResponse(response, turnInput) {
  const payload = await response.json();
  const text = geminiInteractionText(payload);
  if (!text) throw new Error("Gemini interpretation response did not include output text");
  console.dir(JSON.parse(text), {depth: null, colors: true})
  return parseInterpretation(text, "Gemini", turnInput);
}

async function responseText(response) {
  if (typeof response.text === "function") return response.text();
  try {
    return JSON.stringify(await response.json());
  } catch {
    return "";
  }
}

function inferProvider(model) {
  return cleanGeminiModelName(model).toLowerCase().startsWith("gemini") ? "gemini" : "openai";
}

function cleanGeminiModelName(model) {
  return String(model || "gemini-3.5-flash").replace(/^models\//, "");
}

function geminiInteractionText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const output = payload?.steps?.filter((step) => step.type === "model_output").at(-1);
  const text = output?.content?.filter((item) => item.type === "text").map((item) => item.text).filter(Boolean).join("");
  if (text) return text;
  const legacyText = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("");
  return legacyText || JSON.stringify(payload);
}

function parseInterpretation(text, providerName, turnInput = {}) {
  try {
    return hydrateInterpretation(JSON.parse(text), turnInput);
  } catch {
    throw new Error(`${providerName} returned non-JSON InterpretationResult`);
  }
}

function parseRawInterpretation(text, providerName) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${providerName} returned non-JSON InterpretationResult`);
  }
}

function interpretationInput(turnInput, fastBoundarySignals) {
  if (fastBoundarySignals === undefined) return { ...turnInput };
  return { ...turnInput, fastBoundarySignals };
}

function hydrateInterpretation(raw, turnInput = {}) {
  const value = raw && typeof raw === "object" ? raw : {};
  const flowDriving = value.flowDriving && typeof value.flowDriving === "object" ? value.flowDriving : {};
  const text = turnInput.studentMessage || "";
  const hydratedFlowDriving = {
    coursesConsidering: array(flowDriving.coursesConsidering).map((signal) => hydrateSignal(signal, text)),
    universitiesConsidering: array(flowDriving.universitiesConsidering).map((signal) => hydrateSignal(signal, text)),
    pathwaysConsidering: array(flowDriving.pathwaysConsidering).map((signal) => hydrateSignal(signal, text)),
    minimumProfileSignals: hydrateMinimumProfileSignals(flowDriving.minimumProfileSignals, text)
  };

  for (const key of [
    "confirmedCounselingCoursePreference",
    "confirmedCounselingUniversityPreference",
    "confirmedCounselingPathwayPreference",
    "academicResult",
    "preferenceStrengthCandidate",
    "readinessToRegisterSignal"
  ]) {
    if (flowDriving[key]) hydratedFlowDriving[key] = hydrateSignal(flowDriving[key], text);
  }

  return {
    conversationId: turnInput.conversationId || value.conversationId,
    turnId: turnInput.turnId || value.turnId,
    messageId: turnInput.messageId || value.messageId,
    flowDriving: hydratedFlowDriving,
    qualityEnhancingSignals: array(value.qualityEnhancingSignals).map((signal) => hydrateSignal(signal, text)),
    ...(value.studentPostureSignal ? { studentPostureSignal: hydrateSignal(value.studentPostureSignal, text) } : {}),
    boundaryCandidateSignals: array(value.boundaryCandidateSignals).map((signal) => hydrateSignal(signal, text, boundaryPromotionRisk(signal))),
    knowledgeNeedSignals: array(value.knowledgeNeedSignals).map((signal) => hydrateSignal(signal, text)),
    contradictionSignals: array(value.contradictionSignals).map((signal) => hydrateSignal(signal, text, "requires_confirmation")),
    confidenceSummary: {
      overallConfidence: value.confidenceSummary?.overallConfidence || "medium",
      requiresClarification: Boolean(value.confidenceSummary?.requiresClarification),
      ...(value.confidenceSummary?.clarificationReason ? { clarificationReason: value.confidenceSummary.clarificationReason } : {}),
      ...(value.confidenceSummary?.highestRiskSignal ? { highestRiskSignal: value.confidenceSummary.highestRiskSignal } : {})
    }
  };
}

function hydrateMinimumProfileSignals(raw, text) {
  const value = raw && typeof raw === "object" ? raw : {};
  return {
    academicResultKnown: Boolean(value.academicResultKnown),
    courseDirectionStatusKnown: Boolean(value.courseDirectionStatusKnown),
    universityDirectionStatusKnown: Boolean(value.universityDirectionStatusKnown),
    ...(value.academicResultStatus ? { academicResultStatus: hydrateSignalValue(value.academicResultStatus, text) } : {}),
    ...(value.courseDirectionStatus ? { courseDirectionStatus: hydrateSignalValue(value.courseDirectionStatus, text) } : {}),
    ...(value.universityDirectionStatus ? { universityDirectionStatus: hydrateSignalValue(value.universityDirectionStatus, text) } : {}),
    ...(value.routeReadiness ? { routeReadiness: hydrateSignalValue(value.routeReadiness, text) } : {}),
    ...(value.suggestedCounselingRoute ? { suggestedCounselingRoute: hydrateSignalValue(value.suggestedCounselingRoute, text) } : {})
  };
}

function hydrateSignalValue(signal, text) {
  if (signal && typeof signal === "object") return hydrateSignal(signal, text);
  return hydrateSignal({ value: signal }, text);
}

function hydrateSignal(signal, text, promotionRisk = "none") {
  const value = signal && typeof signal === "object" ? signal : {};
  return {
    ...value,
    confidence: ["low", "medium", "high"].includes(value.confidence) ? value.confidence : "medium",
    evidence: evidence(value.evidence, text),
    source: value.source || "current_message",
    promotionRisk: value.promotionRisk || promotionRisk
  };
}

function evidence(value, text) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  const normalized = items
    .map((item) => typeof item === "string" ? { quote: item } : item)
    .filter((item) => item && typeof item.quote === "string" && item.quote.trim())
    .map((item) => ({ quote: item.quote.slice(0, 160) }));
  return normalized.length ? normalized : [{ quote: String(text || "No direct quote supplied.").slice(0, 160) }];
}

function boundaryPromotionRisk(signal = {}) {
  if (signal.severityCandidate === "red" || ["official_action_request", "payment_or_seat_request", "exception_or_waiver_request", "human_requested_support"].includes(signal.type)) {
    return "official_action_risk";
  }
  return "requires_confirmation";
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function interpretationResultSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "conversationId",
      "turnId",
      "messageId",
      "flowDriving",
      "qualityEnhancingSignals",
      "boundaryCandidateSignals",
      "knowledgeNeedSignals",
      "contradictionSignals",
      "confidenceSummary"
    ],
    properties: {
      conversationId: { type: "string" },
      turnId: { type: "string" },
      messageId: { type: "string" },
      flowDriving: flowDrivingSchema(),
      qualityEnhancingSignals: { type: "array", items: qualityEnhancingSignalSchema() },
      studentPostureSignal: studentPostureSignalSchema(),
      boundaryCandidateSignals: { type: "array", items: boundaryCandidateSignalSchema() },
      knowledgeNeedSignals: { type: "array", items: knowledgeNeedSignalSchema() },
      contradictionSignals: { type: "array", items: contradictionSignalSchema() },
      confidenceSummary: {
        type: "object",
        additionalProperties: false,
        required: ["overallConfidence", "requiresClarification"],
        properties: {
          overallConfidence: stringEnum(["low", "medium", "high"]),
          requiresClarification: { type: "boolean" },
          clarificationReason: { type: "string" },
          highestRiskSignal: { type: "string" },
          fallbackUsed: { type: "boolean" },
          fallbackReason: { type: "string" }
        }
      }
    }
  };
}

function flowDrivingSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["coursesConsidering", "universitiesConsidering", "pathwaysConsidering", "minimumProfileSignals"],
    properties: {
      coursesConsidering: { type: "array", items: courseSignalSchema() },
      confirmedCounselingCoursePreference: courseSignalSchema(),
      universitiesConsidering: { type: "array", items: universitySignalSchema() },
      confirmedCounselingUniversityPreference: universitySignalSchema(),
      pathwaysConsidering: { type: "array", items: pathwaySignalSchema() },
      confirmedCounselingPathwayPreference: pathwaySignalSchema(),
      academicResult: {
        type: "object",
        additionalProperties: false,
        required: [...baseRequired(), "value"],
        properties: { ...baseProperties(), value: { type: "string" } }
      },
      minimumProfileSignals: {
        type: "object",
        additionalProperties: false,
        required: ["academicResultKnown", "courseDirectionStatusKnown", "universityDirectionStatusKnown"],
        properties: {
          academicResultKnown: { type: "boolean" },
          courseDirectionStatusKnown: { type: "boolean" },
          universityDirectionStatusKnown: { type: "boolean" },
          academicResultStatus: signalValueSchema(["known", "unknown", "unclear"]),
          courseDirectionStatus: signalValueSchema(["unknown", "considering_some_courses", "preferred_course_exists", "confirmed_counseling_course_preference"]),
          universityDirectionStatus: signalValueSchema(["unknown", "considering_some_universities", "preferred_university_exists", "confirmed_counseling_university_preference"]),
          routeReadiness: signalValueSchema(["minimum_profile_incomplete", "route_ready", "route_ready_with_optional_fit_gaps"]),
          suggestedCounselingRoute: signalValueSchema(["collect_academic_result", "course_or_pathway_exploration", "university_exploration", "course_exploration_within_university_context", "recommendation_or_validation", "comparison_or_shortlist", "handoff_boundary_check"])
        }
      },
      preferenceStrengthCandidate: {
        type: "object",
        additionalProperties: false,
        required: [...baseRequired(), "level", "label"],
        properties: {
          ...baseProperties(),
          level: stringEnum(["L1", "L2", "L3", "L4", "L5"]),
          label: { type: "string" }
        }
      },
      readinessToRegisterSignal: {
        type: "object",
        additionalProperties: false,
        required: [...baseRequired(), "intent", "triggerType"],
        properties: {
          ...baseProperties(),
          intent: stringEnum(["apply_now", "register_now", "enroll_now", "pay_now", "reserve_seat"]),
          triggerType: stringEnum(["H1", "H2", "H3"])
        }
      }
    }
  };
}

function courseSignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "courseOrProgram", "status"],
    properties: {
      ...baseProperties(),
      courseOrProgram: { type: "string" },
      status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"])
    }
  };
}

function universitySignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "university", "status"],
    properties: {
      ...baseProperties(),
      university: { type: "string" },
      status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"])
    }
  };
}

function pathwaySignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "pathway", "status"],
    properties: {
      ...baseProperties(),
      pathway: { type: "string" },
      status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"])
    }
  };
}

function qualityEnhancingSignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "type", "value", "usefulness", "sensitivity"],
    properties: {
      ...baseProperties(),
      type: stringEnum(["concern", "budget_sensitivity", "university_fit_preference", "location_preference", "family_influence", "learning_preference", "study_mode_preference", "timeline_preference", "career_interest", "personality_preference", "other"]),
      value: looseObjectSchema(),
      usefulness: stringEnum(["low", "medium", "high"]),
      sensitivity: stringEnum(["none", "possibly_sensitive", "sensitive"])
    }
  };
}

function studentPostureSignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "posture", "counselingImplication"],
    properties: {
      ...baseProperties(),
      posture: stringEnum(["just_browsing", "lost_or_confused", "course_first", "university_first", "pathway_first", "comparison_oriented", "validation_seeking", "decision_ready", "indecisive", "constraint_driven", "human_help_seeking"]),
      counselingImplication: stringEnum(["reassure_and_orient", "route_to_course_exploration", "route_to_university_exploration", "route_to_pathway_exploration", "compare_options", "validate_fit", "confirm_preference", "support_indecision", "handoff_boundary_check"]),
      suggestedResponseMode: stringEnum(["reassuring_orientation", "route_explanation", "decision_support", "summary_checkpoint", "milestone_confirmation", "clarify_once", "handoff_safe"])
    }
  };
}

function signalValueSchema(values) {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "value"],
    properties: { ...baseProperties(), value: stringEnum(values) }
  };
}

function boundaryCandidateSignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "type", "severityCandidate", "recommendedBehavior"],
    properties: {
      ...baseProperties(),
      type: stringEnum(["ready_to_apply_or_register", "official_action_request", "payment_or_seat_request", "exception_or_waiver_request", "sensitive_context", "human_requested_support", "ambiguous_proceed_language"]),
      triggerType: stringEnum(["H1", "H2", "H3", "H4", "H5", "H6"]),
      severityCandidate: stringEnum(["yellow", "red"]),
      recommendedBehavior: stringEnum(["continue", "clarify_once", "handoff"])
    }
  };
}

function knowledgeNeedSignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "type", "query", "decisionCriticality"],
    properties: {
      ...baseProperties(),
      type: stringEnum(["fees", "entry_requirements", "eligibility", "intake", "duration", "campus_location", "ranking", "scholarship", "specific_program_fact", "specific_university_fact", "pathway_requirement"]),
      query: { type: "string" },
      decisionCriticality: stringEnum(["not_decision_critical", "possibly_decision_critical", "decision_critical"])
    }
  };
}

function contradictionSignalSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [...baseRequired(), "type", "newClaim", "recommendedBehavior"],
    properties: {
      ...baseProperties(),
      type: stringEnum(["correction", "direction_change", "preference_downgrade", "constraint_conflict", "profile_conflict"]),
      conflictsWith: looseObjectSchema(),
      newClaim: looseObjectSchema(),
      recommendedBehavior: stringEnum(["update_current_truth", "preserve_history_and_switch_active_direction", "ask_clarification"])
    }
  };
}

function baseRequired() {
  return ["confidence", "evidence", "source", "promotionRisk"];
}

function baseProperties() {
  return {
    confidence: stringEnum(["low", "medium", "high"]),
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote"],
        properties: { quote: { type: "string" } }
      }
    },
    source: stringEnum(["current_message", "conversation_context"]),
    promotionRisk: stringEnum(["none", "possible_over_promotion", "requires_confirmation", "official_action_risk"])
  };
}

function stringEnum(values) {
  return { type: "string", enum: values };
}

function looseObjectSchema() {
  return { type: "object", additionalProperties: true };
}

function geminiRawInterpretationResultSchema() {
  return {
    type: "object",
    required: [
      "flowDriving",
      "qualityEnhancingSignals",
      "boundaryCandidateSignals",
      "knowledgeNeedSignals",
      "contradictionSignals",
      "confidenceSummary"
    ],
    properties: {
      flowDriving: {
        type: "object",
        required: ["coursesConsidering", "universitiesConsidering", "pathwaysConsidering"],
        properties: {
          coursesConsidering: { type: "array", items: geminiSignalSchema({ courseOrProgram: { type: "string" }, status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"]) }, ["courseOrProgram", "status"]) },
          confirmedCounselingCoursePreference: geminiSignalSchema({ courseOrProgram: { type: "string" }, status: stringEnum(["confirmed_counseling_preference"]) }, ["courseOrProgram", "status"]),
          universitiesConsidering: { type: "array", items: geminiSignalSchema({ university: { type: "string" }, status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"]) }, ["university", "status"]) },
          confirmedCounselingUniversityPreference: geminiSignalSchema({ university: { type: "string" }, status: stringEnum(["confirmed_counseling_preference"]) }, ["university", "status"]),
          pathwaysConsidering: { type: "array", items: geminiSignalSchema({ pathway: { type: "string" }, status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"]) }, ["pathway", "status"]) },
          confirmedCounselingPathwayPreference: geminiSignalSchema({ pathway: { type: "string" }, status: stringEnum(["confirmed_counseling_preference"]) }, ["pathway", "status"]),
          academicResult: geminiSignalSchema({ value: { type: "string" } }, ["value"]),
          readinessToRegisterSignal: geminiSignalSchema({ intent: stringEnum(["apply_now", "register_now", "enroll_now", "pay_now", "reserve_seat"]), triggerType: stringEnum(["H1", "H2", "H3"]) }, ["intent", "triggerType"])
        }
      },
      qualityEnhancingSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["concern", "budget_sensitivity", "university_fit_preference", "location_preference", "family_influence", "learning_preference", "study_mode_preference", "timeline_preference", "career_interest", "personality_preference", "other"]), value: looseObjectSchema(), usefulness: stringEnum(["low", "medium", "high"]), sensitivity: stringEnum(["none", "possibly_sensitive", "sensitive"]) }, ["type", "value", "usefulness", "sensitivity"]) },
      studentPostureSignal: geminiSignalSchema({ posture: stringEnum(["just_browsing", "lost_or_confused", "course_first", "university_first", "pathway_first", "comparison_oriented", "validation_seeking", "decision_ready", "indecisive", "constraint_driven", "human_help_seeking"]), counselingImplication: stringEnum(["reassure_and_orient", "route_to_course_exploration", "route_to_university_exploration", "route_to_pathway_exploration", "compare_options", "validate_fit", "confirm_preference", "support_indecision", "handoff_boundary_check"]), suggestedResponseMode: stringEnum(["reassuring_orientation", "route_explanation", "decision_support", "summary_checkpoint", "milestone_confirmation", "clarify_once", "handoff_safe"]) }, ["posture", "counselingImplication"]),
      boundaryCandidateSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["ready_to_apply_or_register", "official_action_request", "payment_or_seat_request", "exception_or_waiver_request", "sensitive_context", "human_requested_support", "ambiguous_proceed_language"]), triggerType: stringEnum(["H1", "H2", "H3", "H4", "H5", "H6"]), severityCandidate: stringEnum(["yellow", "red"]), recommendedBehavior: stringEnum(["continue", "clarify_once", "handoff"]) }, ["type", "severityCandidate", "recommendedBehavior"]) },
      knowledgeNeedSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["fees", "entry_requirements", "eligibility", "intake", "duration", "campus_location", "ranking", "scholarship", "specific_program_fact", "specific_university_fact", "pathway_requirement"]), query: { type: "string" }, decisionCriticality: stringEnum(["not_decision_critical", "possibly_decision_critical", "decision_critical"]) }, ["type", "query", "decisionCriticality"]) },
      contradictionSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["correction", "direction_change", "preference_downgrade", "constraint_conflict", "profile_conflict"]), conflictsWith: looseObjectSchema(), newClaim: looseObjectSchema(), recommendedBehavior: stringEnum(["update_current_truth", "preserve_history_and_switch_active_direction", "ask_clarification"]) }, ["type", "newClaim", "recommendedBehavior"]) },
      confidenceSummary: {
        type: "object",
        required: ["overallConfidence", "requiresClarification"],
        properties: {
          overallConfidence: stringEnum(["low", "medium", "high"]),
          requiresClarification: { type: "boolean" },
          clarificationReason: { type: "string" },
          highestRiskSignal: { type: "string" }
        }
      }
    }
  };
}

function geminiInterpretationResultSchema() {
  return {
    type: "object",
    required: [
      "flowDriving",
      "qualityEnhancingSignals",
      "boundaryCandidateSignals",
      "knowledgeNeedSignals",
      "contradictionSignals",
      "confidenceSummary"
    ],
    properties: {
      flowDriving: {
        type: "object",
        required: ["coursesConsidering", "universitiesConsidering", "pathwaysConsidering", "minimumProfileSignals"],
        properties: {
          coursesConsidering: { type: "array", items: geminiSignalSchema({ courseOrProgram: { type: "string" }, status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"]) }, ["courseOrProgram", "status"]) },
          confirmedCounselingCoursePreference: geminiSignalSchema({ courseOrProgram: { type: "string" }, status: stringEnum(["confirmed_counseling_preference"]) }, ["courseOrProgram", "status"]),
          universitiesConsidering: { type: "array", items: geminiSignalSchema({ university: { type: "string" }, status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"]) }, ["university", "status"]) },
          confirmedCounselingUniversityPreference: geminiSignalSchema({ university: { type: "string" }, status: stringEnum(["confirmed_counseling_preference"]) }, ["university", "status"]),
          pathwaysConsidering: { type: "array", items: geminiSignalSchema({ pathway: { type: "string" }, status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"]) }, ["pathway", "status"]) },
          confirmedCounselingPathwayPreference: geminiSignalSchema({ pathway: { type: "string" }, status: stringEnum(["confirmed_counseling_preference"]) }, ["pathway", "status"]),
          academicResult: geminiSignalSchema({ value: { type: "string" } }, ["value"]),
          minimumProfileSignals: {
            type: "object",
            required: ["academicResultKnown", "courseDirectionStatusKnown", "universityDirectionStatusKnown"],
            properties: {
              academicResultKnown: { type: "boolean" },
              courseDirectionStatusKnown: { type: "boolean" },
              universityDirectionStatusKnown: { type: "boolean" },
              academicResultStatus: stringEnum(["known", "unknown", "unclear"]),
              courseDirectionStatus: stringEnum(["unknown", "considering_some_courses", "preferred_course_exists", "confirmed_counseling_course_preference"]),
              universityDirectionStatus: stringEnum(["unknown", "considering_some_universities", "preferred_university_exists", "confirmed_counseling_university_preference"]),
              routeReadiness: stringEnum(["minimum_profile_incomplete", "route_ready", "route_ready_with_optional_fit_gaps"]),
              suggestedCounselingRoute: stringEnum(["collect_academic_result", "course_or_pathway_exploration", "university_exploration", "course_exploration_within_university_context", "recommendation_or_validation", "comparison_or_shortlist", "handoff_boundary_check"])
            }
          },
          preferenceStrengthCandidate: geminiSignalSchema({ level: stringEnum(["L1", "L2", "L3", "L4", "L5"]), label: { type: "string" } }, ["level", "label"]),
          readinessToRegisterSignal: geminiSignalSchema({ intent: stringEnum(["apply_now", "register_now", "enroll_now", "pay_now", "reserve_seat"]), triggerType: stringEnum(["H1", "H2", "H3"]) }, ["intent", "triggerType"])
        }
      },
      qualityEnhancingSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["concern", "budget_sensitivity", "university_fit_preference", "location_preference", "family_influence", "learning_preference", "study_mode_preference", "timeline_preference", "career_interest", "personality_preference", "other"]), value: looseObjectSchema(), usefulness: stringEnum(["low", "medium", "high"]), sensitivity: stringEnum(["none", "possibly_sensitive", "sensitive"]) }, ["type", "value", "usefulness", "sensitivity"]) },
      studentPostureSignal: geminiSignalSchema({ posture: stringEnum(["just_browsing", "lost_or_confused", "course_first", "university_first", "pathway_first", "comparison_oriented", "validation_seeking", "decision_ready", "indecisive", "constraint_driven", "human_help_seeking"]), counselingImplication: stringEnum(["reassure_and_orient", "route_to_course_exploration", "route_to_university_exploration", "route_to_pathway_exploration", "compare_options", "validate_fit", "confirm_preference", "support_indecision", "handoff_boundary_check"]), suggestedResponseMode: stringEnum(["reassuring_orientation", "route_explanation", "decision_support", "summary_checkpoint", "milestone_confirmation", "clarify_once", "handoff_safe"]) }, ["posture", "counselingImplication"]),
      boundaryCandidateSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["ready_to_apply_or_register", "official_action_request", "payment_or_seat_request", "exception_or_waiver_request", "sensitive_context", "human_requested_support", "ambiguous_proceed_language"]), triggerType: stringEnum(["H1", "H2", "H3", "H4", "H5", "H6"]), severityCandidate: stringEnum(["yellow", "red"]), recommendedBehavior: stringEnum(["continue", "clarify_once", "handoff"]) }, ["type", "severityCandidate", "recommendedBehavior"]) },
      knowledgeNeedSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["fees", "entry_requirements", "eligibility", "intake", "duration", "campus_location", "ranking", "scholarship", "specific_program_fact", "specific_university_fact", "pathway_requirement"]), query: { type: "string" }, decisionCriticality: stringEnum(["not_decision_critical", "possibly_decision_critical", "decision_critical"]) }, ["type", "query", "decisionCriticality"]) },
      contradictionSignals: { type: "array", items: geminiSignalSchema({ type: stringEnum(["correction", "direction_change", "preference_downgrade", "constraint_conflict", "profile_conflict"]), conflictsWith: looseObjectSchema(), newClaim: looseObjectSchema(), recommendedBehavior: stringEnum(["update_current_truth", "preserve_history_and_switch_active_direction", "ask_clarification"]) }, ["type", "newClaim", "recommendedBehavior"]) },
      confidenceSummary: {
        type: "object",
        required: ["overallConfidence", "requiresClarification"],
        properties: {
          overallConfidence: stringEnum(["low", "medium", "high"]),
          requiresClarification: { type: "boolean" },
          clarificationReason: { type: "string" },
          highestRiskSignal: { type: "string" }
        }
      }
    }
  };
}

function geminiSignalSchema(properties = {}, required = []) {
  return {
    type: "object",
    required: [...required, "confidence", "evidence"],
    properties: {
      ...properties,
      confidence: stringEnum(["low", "medium", "high"]),
      evidence: {
        type: "array",
        items: {
          type: "object",
          required: ["quote"],
          properties: { quote: { type: "string" } }
        }
      }
    }
  };
}

function mockInterpretation(turnInput, fastBoundarySignals) {
  const text = turnInput.studentMessage || "";
  const flowDriving = {
    coursesConsidering: courseSignals(text),
    universitiesConsidering: universitySignals(text),
    pathwaysConsidering: pathwaySignals(text)
  };
  const academicResult = academicResultSignal(text);
  if (academicResult) flowDriving.academicResult = academicResult;
  flowDriving.minimumProfileSignals = minimumProfileSignals(text);

  const preference = preferenceStrengthSignal(text);
  if (preference) flowDriving.preferenceStrengthCandidate = preference;

  const confirmedCourse = confirmedCourseSignal(text);
  if (confirmedCourse) flowDriving.confirmedCounselingCoursePreference = confirmedCourse;
  const confirmedUniversity = confirmedUniversitySignal(text);
  if (confirmedUniversity) flowDriving.confirmedCounselingUniversityPreference = confirmedUniversity;
  const confirmedPathway = confirmedPathwaySignal(text);
  if (confirmedPathway) flowDriving.confirmedCounselingPathwayPreference = confirmedPathway;

  const readiness = readinessSignal(text);
  if (readiness) flowDriving.readinessToRegisterSignal = readiness;

  const boundaryCandidateSignals = boundaryCandidates(text, fastBoundarySignals);
  const knowledgeNeedSignals = knowledgeNeeds(text);
  const contradictionSignals = contradictions(text);
  const qualityEnhancingSignals = qualitySignals(text);
  const studentPostureSignal = postureSignal(text, flowDriving);

  return {
    conversationId: turnInput.conversationId,
    turnId: turnInput.turnId,
    messageId: turnInput.messageId,
    flowDriving,
    qualityEnhancingSignals,
    ...(studentPostureSignal ? { studentPostureSignal } : {}),
    boundaryCandidateSignals,
    knowledgeNeedSignals,
    contradictionSignals,
    confidenceSummary: {
      overallConfidence: "medium",
      requiresClarification: boundaryCandidateSignals.some((signal) => signal.type === "ambiguous_proceed_language"),
      clarificationReason: boundaryCandidateSignals.some((signal) => signal.type === "ambiguous_proceed_language")
        ? "Ambiguous proceed language may mean counseling preference or official application step."
        : undefined,
      highestRiskSignal: boundaryCandidateSignals.find((signal) => signal.severityCandidate === "red")?.type
        || boundaryCandidateSignals[0]?.type
    }
  };
}

function courseSignals(text) {
  const lower = text.toLowerCase();
  return COURSES
    .filter((course) => includesTerm(lower, course))
    .map((course) => ({
      ...baseSignal(text, course),
      courseOrProgram: course === "it" ? "IT" : title(course),
      status: /\bprefer\b/i.test(text) && includesTerm(lower, course) ? "preferred" : "considering"
    }));
}

function confirmedCourseSignal(text) {
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) return undefined;
  const course = courseSignals(text)[0];
  return course ? { ...course, ...baseSignal(text, text), status: "confirmed_counseling_preference", confidence: "high" } : undefined;
}

function universitySignals(text) {
  const lower = text.toLowerCase();
  return UNIVERSITIES
    .filter((university) => includesTerm(lower, university))
    .map((university) => ({
      ...baseSignal(text, university),
      university: university.includes("university ") ? title(university) : title(university).replace(/\bApu\b/, "APU").replace(/\bUtar\b/, "UTAR"),
      status: /\bprefer\b/i.test(text) && includesTerm(lower, university) ? "preferred" : "considering"
    }));
}

function confirmedUniversitySignal(text) {
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) return undefined;
  const university = universitySignals(text)[0];
  return university ? { ...university, ...baseSignal(text, text), status: "confirmed_counseling_preference", confidence: "high" } : undefined;
}

function pathwaySignals(text) {
  const lower = text.toLowerCase();
  return PATHWAYS
    .filter((pathway) => lower.includes(pathway))
    .map((pathway) => ({
      ...baseSignal(text, pathway),
      pathway: title(pathway),
      status: /\bprefer\b/i.test(text) && lower.includes(pathway) ? "preferred" : "considering"
    }));
}

function confirmedPathwaySignal(text) {
  if (!/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) return undefined;
  const pathway = pathwaySignals(text)[0];
  return pathway ? { ...pathway, ...baseSignal(text, text), status: "confirmed_counseling_preference", confidence: "high" } : undefined;
}

function academicResultSignal(text) {
  const match = text.match(/\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?|credits?)\b[^.?!]*/i);
  if (!match) return undefined;
  return {
    ...baseSignal(text, match[0]),
    value: match[0].trim()
  };
}

function minimumProfileSignals(text) {
  const academicResultKnown = /\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?|credits?)\b/i.test(text);
  const courseSignalsFound = courseSignals(text);
  const universitySignalsFound = universitySignals(text);
  const courseDirectionKnown = courseSignalsFound.length > 0 || NO_COURSE_DIRECTION.test(text);
  const universityDirectionKnown = universitySignalsFound.length > 0 || NO_UNIVERSITY_DIRECTION.test(text);
  const courseStatus = courseSignalsFound.some((signal) => signal.status === "preferred")
    ? "preferred_course_exists"
    : courseSignalsFound.length ? "considering_some_courses" : "unknown";
  const universityStatus = universitySignalsFound.some((signal) => signal.status === "preferred")
    ? "preferred_university_exists"
    : universitySignalsFound.length ? "considering_some_universities" : "unknown";
  const route = suggestedRoute(academicResultKnown, courseStatus, universityStatus);
  return {
    academicResultKnown,
    courseDirectionStatusKnown: courseDirectionKnown,
    universityDirectionStatusKnown: universityDirectionKnown,
    academicResultStatus: signalValue(text, academicResultKnown ? "known" : "unknown"),
    courseDirectionStatus: signalValue(text, courseStatus),
    universityDirectionStatus: signalValue(text, universityStatus),
    routeReadiness: signalValue(text, academicResultKnown && courseDirectionKnown && universityDirectionKnown ? "route_ready" : "minimum_profile_incomplete"),
    suggestedCounselingRoute: signalValue(text, route)
  };
}

function suggestedRoute(academicResultKnown, courseStatus, universityStatus) {
  if (!academicResultKnown) return "collect_academic_result";
  const hasCourse = courseStatus !== "unknown";
  const hasUniversity = universityStatus !== "unknown";
  if (!hasCourse && !hasUniversity) return "course_or_pathway_exploration";
  if (hasCourse && !hasUniversity) return "university_exploration";
  if (!hasCourse && hasUniversity) return "course_exploration_within_university_context";
  return "recommendation_or_validation";
}

function preferenceStrengthSignal(text) {
  if (/\b(apply|register|enroll|enrol|pay|deposit|reserve.*seat)\b/i.test(text)) {
    return { level: "L5", label: "ready_to_register_or_apply", ...baseSignal(text, text) };
  }
  if (/\b(my choice|choose|chosen|let'?s go with)\b/i.test(text)) {
    return { level: "L4", label: "confirmed_counseling_preference", ...baseSignal(text, text) };
  }
  if (/\bprefer\b/i.test(text)) return { level: "L3", label: "expressed_preference", ...baseSignal(text, text) };
  if (/\b(interested|interesting|considering|sounds good)\b/i.test(text)) {
    return { level: "L1", label: "weak_interest", ...baseSignal(text, text) };
  }
  return undefined;
}

function readinessSignal(text) {
  const match = text.match(/\b(apply now|ready to apply|register me|ready to register|submit my application|enroll now|enrol now)\b/i);
  if (!match) return undefined;
  return {
    intent: /apply|application/i.test(match[0]) ? "apply_now" : "register_now",
    triggerType: "H1",
    ...baseSignal(text, match[0], "high", "official_action_risk")
  };
}

function boundaryCandidates(text, fastBoundarySignals) {
  const fromFast = fastBoundarySignals.map((signal) => ({
    ...baseSignal(text, signal.matchedText, "high", signal.severityCandidate === "red" ? "official_action_risk" : "requires_confirmation"),
    type: signal.type,
    triggerType: signal.triggerType,
    severityCandidate: signal.severityCandidate,
    recommendedBehavior: signal.recommendedBehavior === "clarify_once" ? "clarify_once" : "handoff"
  }));
  const sensitive = /\b(financial hardship|disability|medical hardship|visa issue|legal issue)\b/i.test(text)
    ? [{
      ...baseSignal(text, text, "medium", "official_action_risk"),
      type: "sensitive_context",
      triggerType: "H5",
      severityCandidate: "red",
      recommendedBehavior: "handoff"
    }]
    : [];
  return dedupeSignals([...fromFast, ...sensitive], "type");
}

function knowledgeNeeds(text) {
  const patterns = [
    ["fees", /\b(fee|fees|cost|tuition)\b/i],
    ["entry_requirements", /\b(entry requirement|requirements?|qualify|eligible|eligibility)\b/i],
    ["intake", /\b(intake|start date)\b/i],
    ["duration", /\b(duration|how long)\b/i],
    ["campus_location", /\b(campus|location|where)\b/i],
    ["ranking", /\b(ranking|rank|ranked|higher)\b/i],
    ["scholarship", /\b(scholarship)\b/i],
    ["pathway_requirement", /\b(pathway requirement|foundation requirement|diploma requirement)\b/i]
  ];
  return patterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([type, pattern]) => ({
      ...baseSignal(text, text.match(pattern)?.[0] || text),
      type,
      query: text,
      decisionCriticality: ["entry_requirements", "eligibility", "pathway_requirement"].includes(type)
        ? "decision_critical"
        : "possibly_decision_critical"
    }));
}

function contradictions(text) {
  if (!/\b(actually|instead|anymore|not sure anymore|i said .* earlier|now i prefer)\b/i.test(text)) return [];
  const newCourse = courseSignals(text).find((signal) => !/\b(don'?t want|do not want|not)\b/i.test(text.slice(Math.max(0, text.toLowerCase().indexOf(signal.courseOrProgram.toLowerCase()) - 20), text.toLowerCase().indexOf(signal.courseOrProgram.toLowerCase()))));
  return [{
    ...baseSignal(text, text),
    type: /\bnot sure anymore\b/i.test(text) ? "preference_downgrade" : "direction_change",
    newClaim: newCourse ? { courseOrProgram: newCourse.courseOrProgram } : { message: text },
    recommendedBehavior: newCourse ? "preserve_history_and_switch_active_direction" : "ask_clarification"
  }];
}

function qualitySignals(text) {
  const signals = [];
  if (/\b(budget|affordable|cheap|low cost|value)\b/i.test(text)) {
    signals.push({ ...quality("budget_sensitivity", text, { preference: "budget_or_value" }), usefulness: "high" });
  }
  if (/\b(ranking|prestige|reputation)\b/i.test(text)) {
    signals.push({ ...quality("university_fit_preference", text, { preference: "ranking_or_prestige" }), usefulness: "high" });
  }
  if (/\b(kl|kuala lumpur|selangor|penang|johor|nearby|near campus)\b/i.test(text)) {
    signals.push({ ...quality("location_preference", text, { location: text.match(/\b(kl|kuala lumpur|selangor|penang|johor|nearby)\b/i)?.[0] || "stated_location" }), usefulness: "high" });
  }
  if (/\b(parent|parents|family|guardian)\b/i.test(text)) {
    signals.push({ ...quality("family_influence", text, { influence: "family_or_guardian" }), usefulness: "medium" });
  }
  if (/\b(job prospects?|career|work as|become)\b/i.test(text)) {
    signals.push({ ...quality("career_interest", text, { interest: "career_outcome" }), usefulness: "high" });
  }
  if (/\b(worried|concern|afraid|confused)\b/i.test(text)) {
    signals.push({ ...quality("concern", text, { concern: "student_concern" }), usefulness: "high" });
  }
  if (/\b(coffee|movie|football)\b/i.test(text)) {
    signals.push({ ...quality("other", text, { trivia: text }), usefulness: "low" });
  }
  return signals;
}

function postureSignal(text, flowDriving) {
  const lower = text.toLowerCase();
  if (/\b(human counselor|human counsellor|real person|talk to.*human)\b/i.test(text)) {
    return posture(text, "human_help_seeking", "handoff_boundary_check", "handoff_safe");
  }
  if (/\b(just browsing|browsing only|looking around)\b/i.test(text)) return posture(text, "just_browsing", "reassure_and_orient", "reassuring_orientation");
  if (/\b(compare|versus|vs|better|between)\b/i.test(text)) return posture(text, "comparison_oriented", "compare_options", "decision_support");
  if (/\b(my choice|choose|chosen|this option seems best|let'?s go with)\b/i.test(text)) return posture(text, "decision_ready", "confirm_preference", "milestone_confirmation");
  if ((flowDriving.coursesConsidering || []).length && (NO_UNIVERSITY_DIRECTION.test(text) || lower.includes("which university"))) {
    return posture(text, "course_first", "route_to_university_exploration", "route_explanation");
  }
  if ((flowDriving.universitiesConsidering || []).length && (NO_COURSE_DIRECTION.test(text) || lower.includes("what course"))) {
    return posture(text, "university_first", "route_to_course_exploration", "route_explanation");
  }
  if (/\b(confused|undecided|not sure|don'?t know what course|do not know what course)\b/i.test(text)) return posture(text, "lost_or_confused", "reassure_and_orient", "reassuring_orientation");
  if ((flowDriving.pathwaysConsidering || []).length) return posture(text, "pathway_first", "route_to_pathway_exploration", "route_explanation");
  return undefined;
}

function posture(text, postureValue, counselingImplication, suggestedResponseMode) {
  return {
    ...baseSignal(text, text, "high"),
    posture: postureValue,
    counselingImplication,
    suggestedResponseMode
  };
}

function signalValue(text, value) {
  return {
    ...baseSignal(text, text, "high"),
    value
  };
}

function quality(type, text, value) {
  return {
    ...baseSignal(text, text),
    type,
    value,
    usefulness: "medium",
    sensitivity: /\b(financial hardship|disability|medical hardship|visa issue|legal issue)\b/i.test(text) ? "possibly_sensitive" : "none"
  };
}

function baseSignal(text, quote, confidence = "high", promotionRisk = "none") {
  return {
    confidence,
    evidence: [{ quote: String(quote || text).slice(0, 160) }],
    source: "current_message",
    promotionRisk
  };
}

function dedupeSignals(signals, key) {
  const seen = new Set();
  return signals.filter((signal) => {
    const value = signal[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
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
