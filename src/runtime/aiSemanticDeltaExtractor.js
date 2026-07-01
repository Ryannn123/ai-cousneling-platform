const COURSES = ["psychology", "business", "computer science", "it", "design", "engineering", "accounting"];
const PATHWAYS = ["foundation", "diploma", "a-level", "a level"];
const UNIVERSITIES = ["demo metropolitan university", "demo valley university", "demo tech institute", "university a", "university b", "sunway", "taylor's", "taylors", "monash", "apu", "inti", "help", "utar"];
const NO_COURSE_DIRECTION = /\b(don'?t know what course|do not know what course|no course|not sure what to study|don't know what to study|do not know what to study)\b/i;
const NO_UNIVERSITY_DIRECTION = /\b(don'?t know which university|do not know which university|no university|not sure which university|haven'?t chosen.*university|have not chosen.*university)\b/i;

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
    if (!this.hasApiKey()) return mockSemanticDelta(turnInput, fastBoundarySignals);
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
            content: "Extract SemanticDeltaResult JSON only. It is an untrusted proposal, not truth. Do not output platform metadata, minimum-profile state, route readiness, operating context, durable memory, CRM truth, or official application, registration, payment, enrollment, or seat truth."
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
    system_instruction: "Extract SemanticDeltaResult JSON. Include short evidence quotes for every candidate.",
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
        confirmedCounselingCoursePreferences: array(flow.confirmedCounselingCoursePreferences).map((delta) => hydrateDelta(delta, text)),
        universitiesConsidering: array(flow.universitiesConsidering).map((delta) => hydrateDelta(delta, text)),
        confirmedCounselingUniversityPreferences: array(flow.confirmedCounselingUniversityPreferences).map((delta) => hydrateDelta(delta, text)),
        pathwaysConsidering: array(flow.pathwaysConsidering).map((delta) => hydrateDelta(delta, text)),
        confirmedCounselingPathwayPreferences: array(flow.confirmedCounselingPathwayPreferences).map((delta) => hydrateDelta(delta, text))
      },
      qualityEnhancingDeltas: array(memory.qualityEnhancingDeltas).map((delta) => hydrateDelta({ kind: "quality_enhancing", ...delta }, text))
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
        description: "Personalization clues such as concerns, constraints, preferences, goals, or context.",
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
      "confirmedCounselingCoursePreferences",
      "universitiesConsidering",
      "confirmedCounselingUniversityPreferences",
      "pathwaysConsidering",
      "confirmedCounselingPathwayPreferences"
    ],
    properties: {
      academicResults: { type: "array", items: academicResultDeltaSchema() },
      coursesConsidering: { type: "array", items: courseDeltaSchema() },
      confirmedCounselingCoursePreferences: { type: "object", items: courseDeltaSchema() },
      universitiesConsidering: { type: "array", items: universityDeltaSchema() },
      confirmedCounselingUniversityPreferences: { type: "object", items: universityDeltaSchema() },
      pathwaysConsidering: { type: "array", items: pathwayDeltaSchema() },
      confirmedCounselingPathwayPreferences: { type: "object", items: pathwayDeltaSchema() }
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
        description: "Category of personalization signal.",
        oneOf: [
          { const: "concern_or_blocker", description: "A worry, hesitation, blocker, fear, confusion, or decision obstacle the student raises." },
          { const: "constraint", description: "A practical limit or requirement, such as budget, location, timeline, study mode, eligibility, or family condition." },
          { const: "preference", description: "A soft preference that can improve fit, such as location, campus style, ranking, learning style, or environment." },
          { const: "goal_or_motivation", description: "A desired outcome or motivation, such as career interest, job prospects, migration, prestige, or personal purpose." },
          { const: "influence_or_context", description: "Relevant surrounding context, such as parent influence, family expectations, work situation, or personal circumstances." },
          { const: "other", description: "A counseling-relevant clue that does not fit the other categories." }
        ]
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
    description: "A current-turn signal for runtime control; it should not be stored as durable memory by default.",
    additionalProperties: false,
    required: ["kind", "confidence", "evidence"],
    properties: {
      kind: stringEnum(["boundary", "knowledge_need", "student_posture", "ambiguity"], "Runtime bucket for this current-turn signal."),
      type: { type: "string", description: "Specific signal type within the selected kind." },
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

function mockSemanticDelta(turnInput, fastBoundarySignals) {
  const text = turnInput.studentMessage || "";
  const flowDrivingDeltas = {
    academicResults: arrayOf(academicResultDelta(text)),
    coursesConsidering: courseDeltas(text),
    confirmedCounselingCoursePreferences: arrayOf(confirmedCourseDelta(text)),
    universitiesConsidering: universityDeltas(text),
    confirmedCounselingUniversityPreferences: arrayOf(confirmedUniversityDelta(text)),
    pathwaysConsidering: pathwayDeltas(text),
    confirmedCounselingPathwayPreferences: arrayOf(confirmedPathwayDelta(text))
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
  return COURSES
    .filter((course) => includesTerm(lower, course))
    .map((course) => ({
      ...baseDelta(text, course),
      courseOrProgram: course === "it" ? "IT" : title(course),
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
  return UNIVERSITIES
    .filter((university) => includesTerm(lower, university))
    .map((university) => ({
      ...baseDelta(text, university),
      university: university.includes("university ") ? title(university) : title(university).replace(/\bApu\b/, "APU").replace(/\bUtar\b/, "UTAR"),
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
  return PATHWAYS
    .filter((pathway) => lower.includes(pathway))
    .map((pathway) => ({
      ...baseDelta(text, pathway),
      pathway: title(pathway),
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
  if (!match) return undefined;
  return {
    ...baseDelta(text, match[0]),
    value: match[0].trim()
  };
}

function boundarySignals(text, fastBoundarySignals = []) {
  const fromFast = fastBoundarySignals.map((signal) => ({
    ...baseSignal(text, signal.matchedText, "high", signal.severityCandidate === "red" ? "official_action_risk" : "requires_confirmation"),
    kind: "boundary",
    type: signal.type,
    triggerType: signal.triggerType,
    severityCandidate: signal.severityCandidate,
    recommendedBehavior: signal.recommendedBehavior === "clarify_once" ? "clarify_once" : "handoff"
  }));
  const sensitive = /\b(financial hardship|disability|medical hardship|visa issue|legal issue)\b/i.test(text)
    ? [{
      ...baseSignal(text, text, "medium", "official_action_risk"),
      kind: "boundary",
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
      kind: "knowledge_need",
      type,
      query: text,
      decisionCriticality: ["entry_requirements", "eligibility", "pathway_requirement"].includes(type)
        ? "decision_critical"
        : "possibly_decision_critical"
    }));
}

function ambiguitySignals(text) {
  if (!/\b(actually|instead|anymore|not sure anymore|i said .* earlier|now i prefer)\b/i.test(text)) return [];
  const newCourse = courseDeltas(text).find((delta) => !/\b(don'?t want|do not want|not)\b/i.test(text.slice(Math.max(0, text.toLowerCase().indexOf(delta.courseOrProgram.toLowerCase()) - 20), text.toLowerCase().indexOf(delta.courseOrProgram.toLowerCase()))));
  return [{
    ...baseSignal(text, text, "medium", "requires_confirmation"),
    kind: "ambiguity",
    type: /\bnot sure anymore\b/i.test(text) ? "preference_downgrade" : "direction_change",
    newClaim: newCourse ? { courseOrProgram: newCourse.courseOrProgram } : { message: text },
    recommendedBehavior: "clarify_once"
  }];
}

function qualityDeltas(text) {
  const deltas = [];
  if (/\b(budget|affordable|cheap|low cost|value)\b/i.test(text)) {
    deltas.push({ ...quality("budget_sensitivity", text, { preference: "budget_or_value" }), usefulness: "high" });
  }
  if (/\b(ranking|prestige|reputation)\b/i.test(text)) {
    deltas.push({ ...quality("university_fit_preference", text, { preference: "ranking_or_prestige" }), usefulness: "high" });
  }
  if (/\b(kl|kuala lumpur|selangor|penang|johor|nearby|near campus)\b/i.test(text)) {
    deltas.push({ ...quality("location_preference", text, { location: text.match(/\b(kl|kuala lumpur|selangor|penang|johor|nearby)\b/i)?.[0] || "stated_location" }), usefulness: "high" });
  }
  if (/\b(parent|parents|family|guardian)\b/i.test(text)) {
    deltas.push({ ...quality("family_influence", text, { influence: "family_or_guardian" }), usefulness: "medium" });
  }
  if (/\b(job prospects?|career|work as|become)\b/i.test(text)) {
    deltas.push({ ...quality("career_interest", text, { interest: "career_outcome" }), usefulness: "high" });
  }
  if (/\b(worried|concern|afraid|confused)\b/i.test(text)) {
    deltas.push({ ...quality("concern", text, { concern: "student_concern" }), usefulness: "high" });
  }
  if (/\b(coffee|movie|football)\b/i.test(text)) {
    deltas.push({ ...quality("other", text, { trivia: text }), usefulness: "low" });
  }
  return deltas;
}

function postureSignal(text, flowDrivingDeltas) {
  const lower = text.toLowerCase();
  if (/\b(human counselor|human counsellor|real person|talk to.*human)\b/i.test(text)) {
    return posture(text, "human_help_seeking", "handoff_boundary_check", "handoff_safe");
  }
  if (/\b(just browsing|browsing only|looking around)\b/i.test(text)) return posture(text, "just_browsing", "reassure_and_orient", "reassuring_orientation");
  if (/\b(compare|versus|vs|better|between)\b/i.test(text)) return posture(text, "comparison_oriented", "compare_options", "decision_support");
  if (/\b(my choice|choose|chosen|this option seems best|let'?s go with)\b/i.test(text)) return posture(text, "decision_ready", "confirm_preference", "milestone_confirmation");
  if ((flowDrivingDeltas.coursesConsidering || []).length && (NO_UNIVERSITY_DIRECTION.test(text) || lower.includes("which university"))) {
    return posture(text, "course_first", "route_to_university_exploration", "route_explanation");
  }
  if ((flowDrivingDeltas.universitiesConsidering || []).length && (NO_COURSE_DIRECTION.test(text) || lower.includes("what course"))) {
    return posture(text, "university_first", "route_to_course_exploration", "route_explanation");
  }
  if (/\b(confused|undecided|not sure|don'?t know what course|do not know what course)\b/i.test(text)) return posture(text, "lost_or_confused", "reassure_and_orient", "reassuring_orientation");
  if ((flowDrivingDeltas.pathwaysConsidering || []).length) return posture(text, "pathway_first", "route_to_pathway_exploration", "route_explanation");
  return undefined;
}

function posture(text, postureValue, counselingImplication, suggestedResponseMode) {
  return {
    ...baseSignal(text, text, "high"),
    kind: "student_posture",
    posture: postureValue,
    counselingImplication,
    suggestedResponseMode
  };
}

function quality(type, text, value) {
  return {
    ...baseDelta(text, text),
    kind: "quality_enhancing",
    type,
    value,
    usefulness: "medium",
    sensitivity: /\b(financial hardship|disability|medical hardship|visa issue|legal issue)\b/i.test(text) ? "possibly_sensitive" : "none",
    constraintStrength: /\b(can only|must|need to|cannot|can't)\b/i.test(text) ? "hard_constraint" : "soft_preference"
  };
}

function baseDelta(text, quote, confidence = "high", promotionRisk = "none") {
  return {
    operation: "add_new",
    confidence,
    evidence: [{ quote: String(quote || text).slice(0, 160) }],
    source: "current_message",
    promotionRisk
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

function array(value) {
  return Array.isArray(value) ? value : [];
}

function arrayOf(value) {
  return value ? [value] : [];
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
