export class AISemanticDeltaExtractor {
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

  async extract(turnInput, fastBoundarySignals = []) {
    if (!this.hasApiKey()) throw new Error("AI semantic delta API key is required for extraction");
    return this.extractLive(turnInput, fastBoundarySignals);
  }

  async extractRaw(turnInput) {
    if (!this.hasApiKey()) throw new Error("AI semantic delta API key is required for raw extraction");
    if (this.provider === "gemini") return this.extractGeminiRaw(turnInput);
    return this.extractOpenAiRaw(turnInput);
  }

  async extractLive(turnInput, fastBoundarySignals) {
    if (this.provider === "gemini") return this.extractGeminiLive(turnInput, fastBoundarySignals);
    return this.extractOpenAiLive(turnInput, fastBoundarySignals);
  }

  hasApiKey() {
    return this.provider === "gemini" ? Boolean(this.geminiApiKey) : Boolean(this.openaiApiKey);
  }

  async extractOpenAiLive(turnInput, fastBoundarySignals) {
    const text = await this.fetchOpenAiSemanticDeltaText(turnInput, fastBoundarySignals);
    return parseSemanticDelta(text, "OpenAI", turnInput);
  }

  async extractOpenAiRaw(turnInput) {
    const text = await this.fetchOpenAiSemanticDeltaText(turnInput);
    return parseRawSemanticDelta(text, "OpenAI");
  }

  async fetchOpenAiSemanticDeltaText(turnInput, fastBoundarySignals) {
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
            content: "Extract SemanticDeltaResult JSON only. It is an untrusted proposal, not truth. currentTruthBeforeTurn is read-only context for interpreting the new student message. Do not re-emit existing memory as a new delta unless the student restates, corrects, rejects, or changes it. Do not output platform metadata, minimum-profile state, route readiness, operating context, durable memory, CRM truth, or official application, registration, payment, enrollment, or seat truth."
          },
          {
            role: "user",
            content: JSON.stringify(semanticDeltaInput(turnInput, fastBoundarySignals))
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "SemanticDeltaResult",
            schema: semanticDeltaResultSchema()
          }
        }
      })
    });
    if (!response.ok) throw new Error(`OpenAI Responses API returned ${response.status}`);
    const payload = await response.json();
    const text = payload.output_text || payload.output?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")?.text;
    if (!text) throw new Error("OpenAI semantic delta response did not include output text");
    return text;
  }

  async extractGeminiLive(turnInput, fastBoundarySignals) {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/interactions");
    const request = geminiSemanticDeltaRequest(turnInput, fastBoundarySignals, this.model);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.geminiApiKey },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error(`Gemini API returned ${response.status}: ${await responseText(response)}`);
    return parseGeminiSemanticDeltaResponse(response, turnInput);
  }

  async extractGeminiRaw(turnInput) {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/interactions");
    const request = geminiSemanticDeltaRequest(turnInput, undefined, this.model);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.geminiApiKey },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error(`Gemini API returned ${response.status}: ${await responseText(response)}`);
    const payload = await response.json();
    const text = geminiInteractionText(payload);
    if (!text) throw new Error("Gemini semantic delta response did not include output text");
    return parseRawSemanticDelta(text, "Gemini");
  }
}

function geminiSemanticDeltaRequest(turnInput, fastBoundarySignals, model) {
  return {
    model: cleanGeminiModelName(model),
    system_instruction: "Extract SemanticDeltaResult JSON. Include short evidence quotes for every candidate. currentTruthBeforeTurn is read-only context for interpreting the new student message. Do not re-emit existing memory as a new delta unless the student restates, corrects, rejects, or changes it.",
    input: JSON.stringify(semanticDeltaInput(turnInput, fastBoundarySignals)),
    store: false,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: geminiSemanticDeltaResultSchema()
    }
  };
}

async function parseGeminiSemanticDeltaResponse(response, turnInput) {
  const payload = await response.json();
  const text = geminiInteractionText(payload);
  if (!text) throw new Error("Gemini semantic delta response did not include output text");
  return parseSemanticDelta(text, "Gemini", turnInput);
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

function parseSemanticDelta(text, providerName, turnInput = {}) {
  try {
    return hydrateSemanticDelta(JSON.parse(text), turnInput);
  } catch {
    throw new Error(`${providerName} returned non-JSON SemanticDeltaResult`);
  }
}

function parseRawSemanticDelta(text, providerName) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${providerName} returned non-JSON SemanticDeltaResult`);
  }
}

function semanticDeltaInput(turnInput, fastBoundarySignals) {
  const input = { ...turnInput };
  delete input.conversationId;
  delete input.turnId;
  delete input.messageId;
  delete input.previousRuntimeState;
  if (fastBoundarySignals === undefined) return input;
  return { ...input, fastBoundarySignals };
}

function hydrateSemanticDelta(raw, turnInput = {}) {
  const value = raw && typeof raw === "object" ? raw : {};
  const memory = value.memoryDeltaCandidates && typeof value.memoryDeltaCandidates === "object" ? value.memoryDeltaCandidates : {};
  const flow = memory.flowDrivingDeltas && typeof memory.flowDrivingDeltas === "object" ? memory.flowDrivingDeltas : {};
  const text = turnInput.studentMessage || "";
  return {
    memoryDeltaCandidates: {
      flowDrivingDeltas: {
        academicResults: array(flow.academicResults).map((delta) => hydrateDelta(delta, text)),
        coursesConsidering: array(flow.coursesConsidering).map((delta) => hydrateDelta(delta, text)),
        confirmedCounselingCoursePreferences: hydrateOptionalDelta(flow.confirmedCounselingCoursePreferences, text),
        universitiesConsidering: array(flow.universitiesConsidering).map((delta) => hydrateDelta(delta, text)),
        confirmedCounselingUniversityPreferences: hydrateOptionalDelta(flow.confirmedCounselingUniversityPreferences, text),
        pathwaysConsidering: array(flow.pathwaysConsidering).map((delta) => hydrateDelta(delta, text)),
        confirmedCounselingPathwayPreferences: hydrateOptionalDelta(flow.confirmedCounselingPathwayPreferences, text)
      },
      qualityEnhancingDeltas: array(memory.qualityEnhancingDeltas).map((delta) => hydrateDelta(delta, text))
    },
    runtimeOnlySignalCandidates: array(value.runtimeOnlySignalCandidates).map((signal) => hydrateSignal(signal, text, runtimePromotionRisk(signal)))
  };
}

function hydrateDelta(delta, text) {
  const value = delta && typeof delta === "object" ? delta : {};
  return {
    ...value,
    operation: value.operation || "add_new",
    confidence: ["low", "medium", "high"].includes(value.confidence) ? value.confidence : "medium",
    evidence: evidence(value.evidence, text),
    source: value.source || "current_message",
    promotionRisk: value.promotionRisk || "none"
  };
}

function hydrateOptionalDelta(delta, text) {
  return delta && typeof delta === "object" && !Array.isArray(delta) ? hydrateDelta(delta, text) : null;
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

function runtimePromotionRisk(signal = {}) {
  if (signal.kind === "boundary" && (signal.severityCandidate === "red" || ["official_action_request", "payment_or_seat_request", "exception_or_waiver_request", "human_requested_support"].includes(signal.type))) {
    return "official_action_risk";
  }
  if (signal.kind === "ambiguity") return "requires_confirmation";
  return "none";
}

function semanticDeltaResultSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["memoryDeltaCandidates", "runtimeOnlySignalCandidates"],
    properties: {
      memoryDeltaCandidates: {
        ...memoryDeltaCandidatesSchema(),
        description: "Facts or preferences that may become memory later after platform validation."
      },
      runtimeOnlySignalCandidates: {
        type: "array",
        description: "Current-turn signals for boundary, factual retrieval, posture, or ambiguity; not durable memory.",
        items: runtimeOnlySignalSchema()
      }
    }
  };
}

function memoryDeltaCandidatesSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["flowDrivingDeltas", "qualityEnhancingDeltas"],
    properties: {
      flowDrivingDeltas: {
        ...flowDrivingDeltasSchema(),
      },
      qualityEnhancingDeltas: {
        type: "array",
        description: "Extract every personalization clues stated such as concerns, constraints, preferences, or context.",
        items: qualityEnhancingDeltaSchema()
      }
    }
  };
}

function flowDrivingDeltasSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "academicResults",
      "coursesConsidering",
      "universitiesConsidering",
      "pathwaysConsidering"
    ],
    properties: {
      academicResults: { type: "array", description: "Newly stated academic results only.", items: academicResultDeltaSchema() },
      coursesConsidering: { type: "array", description: "Courses the student is considering or prefers, but has not explicitly confirmed as their counseling choice.", items: courseDeltaSchema() },
      confirmedCounselingCoursePreferences: { ...courseDeltaSchema(), description: "One explicit current counseling course choice only, such as 'my choice is Psychology' or 'let's go with IT'. Omit this field when the student is unsure." },
      universitiesConsidering: { type: "array", description: "Universities the student is considering or prefers, but has not explicitly confirmed as their counseling choice.", items: universityDeltaSchema() },
      confirmedCounselingUniversityPreferences: { ...universityDeltaSchema(), description: "One explicit current counseling university choice only. Omit this field when the student is unsure or has not chosen a university." },
      pathwaysConsidering: { type: "array", description: "Pathways the student is considering or prefers, but has not explicitly confirmed as their counseling choice.", items: pathwayDeltaSchema() },
      confirmedCounselingPathwayPreferences: { ...pathwayDeltaSchema(), description: "One explicit current counseling pathway choice only. Omit this field when the student is unsure or has not chosen a pathway." }
    }
  };
}

function academicResultDeltaSchema() {
  return {
    type: "object",
    description: "A newly stated academic result, qualification, grade, credits, CGPA, or equivalent.",
    additionalProperties: false,
    required: [...baseDeltaRequired(), "value"],
    properties: { ...baseDeltaProperties(), value: { type: "string", description: "The academic result text exactly as understood from the student message." } }
  };
}

function courseDeltaSchema() {
  return {
    type: "object",
    description: "A course or program mentioned as considered, preferred, confirmed for counseling, or rejected.",
    additionalProperties: false,
    required: [...baseDeltaRequired(), "value", "status"],
    properties: {
      ...baseDeltaProperties(),
      value: { type: "string", description: "Course or program name, for example Psychology or Computer Science." },
      status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"], "Strength of the student's course statement; use confirmed only for explicit counseling choice language.")
    }
  };
}

function universityDeltaSchema() {
  return {
    type: "object",
    description: "A university mentioned as considered, preferred, confirmed for counseling, or rejected.",
    additionalProperties: false,
    required: [...baseDeltaRequired(), "value", "status"],
    properties: {
      ...baseDeltaProperties(),
      value: { type: "string", description: "University or college name stated by the student." },
      status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"], "Strength of the student's university statement; use confirmed only for explicit counseling choice language.")
    }
  };
}

function pathwayDeltaSchema() {
  return {
    type: "object",
    description: "A study pathway mentioned as considered, preferred, confirmed for counseling, or rejected.",
    additionalProperties: false,
    required: [...baseDeltaRequired(), "value", "status"],
    properties: {
      ...baseDeltaProperties(),
      value: { type: "string", description: "Pathway name, for example Foundation, Diploma, A-Level, or transfer." },
      status: stringEnum(["considering", "preferred", "confirmed_counseling_preference", "rejected"], "Strength of the student's pathway statement; use confirmed only for explicit counseling choice language.")
    }
  };
}

function qualityEnhancingDeltaSchema() {
  return {
    type: "object",
    description: "A counseling-relevant personalization clue that improves guidance.",
    additionalProperties: false,
    required: [...baseDeltaRequired(), "type", "value", "usefulness", "sensitivity"],
    properties: {
      ...baseDeltaProperties(),
      type: {
        type: "string",
        enum: ["concern_or_blocker", "constraint", "preference", "influence_or_context", "other"],
        description: "Allowed categories: concern_or_blocker=worry, hesitation, confusion, blocker, indecision, or not knowing what course/university/pathway to choose; constraint=practical limit such as budget, location, timeline, study mode, eligibility, or family condition; preference=soft fit preference such as location, campus style, ranking, learning style, or environment; influence_or_context=parent, family, work, or personal context; other=useful clue that does not fit the other categories. Do not invent new type names."
      },
      value: { ...looseObjectSchema(), description: "Small structured summary of the personalization clue." },
      usefulness: stringEnum(["low", "medium", "high"], "How useful this clue is for counseling quality."),
      sensitivity: stringEnum(["none", "possibly_sensitive", "sensitive"], "Privacy or care sensitivity of the clue."),
      constraintStrength: stringEnum(["soft_preference", "hard_constraint"], "Whether the clue is a flexible preference or a hard limit.")
    }
  };
}

function runtimeOnlySignalSchema() {
  return {
    type: "object",
    description: "A current-turn signal for runtime control; it should not be stored as durable memory by default. Must include student_posture",
    additionalProperties: false,
    required: ["kind", "confidence", "evidence"],
    properties: {
      kind: stringEnum(["boundary", "knowledge_need", "student_posture", "ambiguity", "route_episode"], "Runtime bucket for this current-turn signal."),
      type: { type: "string", description: "Specific signal type within the selected kind." },
      signalType: stringEnum(["student_led_route_switch_signal", "route_deferral_signal", "route_confirmation_signal", "route_detour_signal", "route_resume_signal", "route_loop_risk_signal", "route_blocker_signal", "combined_validation_signal"], "Route episode signal type when kind is route_episode."),
      routeHint: stringEnum(["initial_route_selection", "course_exploration", "university_exploration", "course_exploration_within_university_context", "pathway_exploration", "combined_option_validation", "handoff_preparation"], "Optional route hint; the platform owns the final active route."),
      targetHint: { ...looseObjectSchema(), description: "Optional course, university, pathway, or combined option hinted by the student." },
      triggerType: stringEnum(["H1", "H2", "H3", "H4", "H5", "H6"], "Boundary trigger family when kind is boundary."),
      severityCandidate: stringEnum(["yellow", "red"], "Boundary severity candidate; red usually requires handoff."),
      recommendedBehavior: stringEnum(["continue", "clarify_once", "handoff"], "Recommended current-turn control behavior."),
      query: { type: "string", description: "Knowledge retrieval query when kind is knowledge_need." },
      decisionCriticality: stringEnum(["not_decision_critical", "possibly_decision_critical", "decision_critical"], "How important the factual answer is to the student's decision."),
      posture: stringEnum(["just_browsing", "lost_or_confused", "course_first", "university_first", "pathway_first", "comparison_oriented", "validation_seeking", "decision_ready", "indecisive", "constraint_driven", "human_help_seeking"], "Student posture for response mode guidance."),
      counselingImplication: { type: "string", description: "Short implication for how counseling should respond." },
      suggestedResponseMode: { type: "string", description: "Suggested response style for this turn." },
      newClaim: { ...looseObjectSchema(), description: "Possible corrected or conflicting claim when kind is ambiguity." },
      confidence: stringEnum(["low", "medium", "high"], "Confidence that the signal is supported by the message."),
      evidence: evidenceSchema()
    }
  };
}

function baseDeltaRequired() {
  return ["operation", "confidence", "evidence"];
}

function baseDeltaProperties() {
  return {
    operation: stringEnum(["add_new"], "Only add newly stated facts in Phase 4 v1.3."),
    confidence: stringEnum(["low", "medium", "high"], "Confidence that this candidate is supported by the student wording."),
    evidence: evidenceSchema()
  };
}

function evidenceSchema() {
  return {
    type: "array",
    description: "Short direct quote or phrase from the student message supporting this candidate.",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["quote"],
      properties: { quote: { type: "string", description: "Verbatim supporting quote, kept short." } }
    }
  };
}

function geminiSemanticDeltaResultSchema() {
  return semanticDeltaResultSchema();
}

function stringEnum(values, description) {
  return { type: "string", enum: values, ...(description ? { description } : {}) };
}

function looseObjectSchema() {
  return { type: "object", additionalProperties: true };
}

function array(value) {
  return Array.isArray(value) ? value : [];
}
