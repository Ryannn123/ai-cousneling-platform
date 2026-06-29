const COURSES = ["psychology", "business", "computer science", "it", "design", "engineering", "accounting"];
const PATHWAYS = ["foundation", "diploma", "a-level", "a level"];
const UNIVERSITIES = ["demo metropolitan university", "demo valley university", "demo tech institute", "university a", "university b"];

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
    try {
      return await this.interpretLive(turnInput, fastBoundarySignals);
    } catch (error) {
      const fallback = mockInterpretation(turnInput, fastBoundarySignals);
      fallback.confidenceSummary = {
        ...fallback.confidenceSummary,
        overallConfidence: "low",
        fallbackUsed: true,
        fallbackReason: error.message
      };
      return fallback;
    }
  }

  async interpretLive(turnInput, fastBoundarySignals) {
    if (this.provider === "gemini") return this.interpretGeminiLive(turnInput, fastBoundarySignals);
    return this.interpretOpenAiLive(turnInput, fastBoundarySignals);
  }

  hasApiKey() {
    return this.provider === "gemini" ? Boolean(this.geminiApiKey) : Boolean(this.openaiApiKey);
  }

  async interpretOpenAiLive(turnInput, fastBoundarySignals) {
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
            content: JSON.stringify({ ...turnInput, fastBoundarySignals })
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
    return parseInterpretation(text, "OpenAI");
  }

  async interpretGeminiLive(turnInput, fastBoundarySignals) {
    const modelPath = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`);
    url.searchParams.set("key", this.geminiApiKey);
    const request = geminiInterpretationRequest(turnInput, fastBoundarySignals);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const modernError = await responseText(response);
      if (response.status === 400) {
        const legacyResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toLegacyGeminiRequest(request))
        });
        if (legacyResponse.ok) return parseGeminiInterpretationResponse(legacyResponse);
        const legacyError = await responseText(legacyResponse);
        throw new Error(`Gemini API returned ${legacyResponse.status}. responseFormat error: ${modernError}; responseSchema error: ${legacyError}`);
      }
      throw new Error(`Gemini API returned ${response.status}: ${modernError}`);
    }
    return parseGeminiInterpretationResponse(response);
  }
}

function geminiInterpretationRequest(turnInput, fastBoundarySignals) {
  return {
    systemInstruction: {
      parts: [{
        text: "Extract counseling interpretation as JSON. The result is a proposal, not truth. Do not create official application, registration, payment, enrollment, seat, or CRM truth."
      }]
    },
    contents: [{
      role: "user",
      parts: [{ text: JSON.stringify({ ...turnInput, fastBoundarySignals }) }]
    }],
    generationConfig: {
      responseFormat: {
        text: {
          mimeType: "application/json",
          schema: geminiInterpretationResultSchema()
        }
      }
    }
  };
}

function toLegacyGeminiRequest(request) {
  return {
    ...request,
    generationConfig: {
      responseMimeType: request.generationConfig.responseFormat.text.mimeType,
      responseSchema: request.generationConfig.responseFormat.text.schema
    }
  };
}

async function parseGeminiInterpretationResponse(response) {
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("");
  if (!text) throw new Error("Gemini interpretation response did not include output text");
  return parseInterpretation(text, "Gemini");
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
  return String(model || "").toLowerCase().startsWith("gemini") ? "gemini" : "openai";
}

function parseInterpretation(text, providerName) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${providerName} returned non-JSON InterpretationResult`);
  }
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
        required: ["hasAcademicResults", "hasUniversityPreferenceType", "hasPreferredLocation", "hasCourseInterest"],
        properties: {
          hasAcademicResults: { type: "boolean" },
          hasUniversityPreferenceType: { type: "boolean" },
          hasPreferredLocation: { type: "boolean" },
          hasCourseInterest: { type: "boolean" }
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
      type: stringEnum(["concern", "budget_sensitivity", "location_preference", "family_influence", "learning_preference", "study_mode_preference", "timeline_preference", "career_interest", "personality_preference", "other"]),
      value: looseObjectSchema(),
      usefulness: stringEnum(["low", "medium", "high"]),
      sensitivity: stringEnum(["none", "possibly_sensitive", "sensitive"])
    }
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

function geminiInterpretationResultSchema() {
  const schema = structuredClone(interpretationResultSchema());
  replaceLooseGeminiObjects(schema);
  stripUnsupportedGeminiSchemaFields(schema);
  return schema;
}

function replaceLooseGeminiObjects(value) {
  if (!value || typeof value !== "object") return;
  if (value.type === "object" && value.additionalProperties === true && !value.properties) {
    value.properties = {
      summary: { type: "string" }
    };
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(replaceLooseGeminiObjects);
    else replaceLooseGeminiObjects(child);
  }
}

function stripUnsupportedGeminiSchemaFields(value) {
  if (!value || typeof value !== "object") return;
  delete value.additionalProperties;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(stripUnsupportedGeminiSchemaFields);
    else stripUnsupportedGeminiSchemaFields(child);
  }
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

  return {
    conversationId: turnInput.conversationId,
    turnId: turnInput.turnId,
    messageId: turnInput.messageId,
    flowDriving,
    qualityEnhancingSignals,
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
    .filter((course) => lower.includes(course))
    .map((course) => ({
      ...baseSignal(text, course),
      courseOrProgram: course === "it" ? "IT" : title(course),
      status: /\bprefer\b/i.test(text) && lower.includes(course) ? "preferred" : "considering"
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
    .filter((university) => lower.includes(university))
    .map((university) => ({
      ...baseSignal(text, university),
      university: title(university),
      status: /\bprefer\b/i.test(text) && lower.includes(university) ? "preferred" : "considering"
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
  return {
    hasAcademicResults: /\b(spm|a[- ]?level|foundation|diploma|cgpa|gpa|result|results|grades?|credits?)\b/i.test(text),
    hasUniversityPreferenceType: /\b(ranking|prestige|budget|affordable|value|cheap|low cost)\b/i.test(text),
    hasPreferredLocation: /\b(kl|kuala lumpur|selangor|penang|johor|malaysia|overseas|nearby|location)\b/i.test(text),
    hasCourseInterest: COURSES.some((course) => text.toLowerCase().includes(course))
  };
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
