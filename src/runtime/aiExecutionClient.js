export class AIExecutionClient {
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

  async execute(executionContext) {
    if (!this.hasApiKey()) return mockExecution(executionContext);
    try {
      return await this.executeLive(executionContext);
    } catch (error) {
      const fallback = mockExecution(executionContext);
      fallback.validationFlags.knowledgeUncertain = true;
      fallback.proposedOutputs.memoryOutputs.push({
        type: "ai_core_fallback_used",
        value: { reason: error.message },
        confidence: "low",
        evidence: `Live ${this.provider} call failed; mock fallback used.`
      });
      return fallback;
    }
  }

  async executeLive(executionContext) {
    if (this.provider === "gemini") return this.executeGeminiLive(executionContext);
    return this.executeOpenAiLive(executionContext);
  }

  hasApiKey() {
    return this.provider === "gemini" ? Boolean(this.geminiApiKey) : Boolean(this.openaiApiKey);
  }

  async executeOpenAiLive(executionContext) {
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
            content: "You are a bounded autonomous pre-registration education counselor. Return only JSON matching the requested schema. Do not claim official actions are completed."
          },
          {
            role: "user",
            content: JSON.stringify(executionContext)
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "AIExecutionResult",
            schema: aiExecutionResultSchema(),
            strict: true
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Responses API returned ${response.status}`);
    }

    const payload = await response.json();
    const text = payload.output_text || payload.output?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")?.text;
    if (!text) throw new Error("OpenAI response did not include output text");
    return parseAiExecutionResult(text, "OpenAI");
  }

  async executeGeminiLive(executionContext) {
    const modelPath = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`);
    url.searchParams.set("key", this.geminiApiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "You are a bounded autonomous pre-registration education counselor. Return only JSON matching the requested schema. Do not claim official actions are completed."
          }]
        },
        contents: [{
          role: "user",
          parts: [{ text: JSON.stringify(executionContext) }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiAiExecutionResultSchema()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("");
    if (!text) throw new Error("Gemini response did not include output text");
    return parseAiExecutionResult(text, "Gemini");
  }
}

function inferProvider(model) {
  return String(model || "").toLowerCase().startsWith("gemini") ? "gemini" : "openai";
}

function parseAiExecutionResult(text, providerName) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${providerName} returned non-JSON AIExecutionResult`);
  }

  const reason = aiExecutionResultFailure(parsed);
  if (reason) {
    throw new Error(`${providerName} returned invalid AIExecutionResult: ${reason}`);
  }
  return parsed;
}

function aiExecutionResultFailure(value) {
  if (!isPlainObject(value)) return "root_must_be_object";
  if (!isPlainObject(value.response)) return "response_must_be_object";
  if (typeof value.response.studentMessage !== "string") return "response.studentMessage_must_be_string";
  if (!["answer", "ask_clarification", "recommend", "compare", "confirm_preference", "handoff"].includes(value.response.responseIntent)) {
    return "response.responseIntent_invalid";
  }
  if (!isPlainObject(value.proposedContextUpdate)) return "proposedContextUpdate_must_be_object";
  if (!isPlainObject(value.proposedOutputs)) return "proposedOutputs_must_be_object";
  if (!Array.isArray(value.proposedOutputs.memoryOutputs)) return "proposedOutputs.memoryOutputs_must_be_array";
  if (!Array.isArray(value.proposedOutputs.recommendationOutputs)) return "proposedOutputs.recommendationOutputs_must_be_array";
  if (value.proposedOutputs.handoffOutput != null && !isPlainObject(value.proposedOutputs.handoffOutput)) {
    return "proposedOutputs.handoffOutput_must_be_object_or_null";
  }
  if (!isPlainObject(value.validationFlags)) return "validationFlags_must_be_object";
  for (const key of ["needsClarification", "boundarySensitive", "officialActionRisk", "memoryWriteRequiresValidation", "knowledgeUsed", "knowledgeUncertain"]) {
    if (typeof value.validationFlags[key] !== "boolean") return `validationFlags.${key}_must_be_boolean`;
  }
  return null;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    return result("answer", `${factText} After that, we can return to choosing the best-fit direction.`, {
      proposedContextUpdate: { overlayState: "S9" },
      memoryOutputs: [{ type: "factual_detour_answered", value: { answerable: facts.length > 0 }, confidence: facts.length ? "medium" : "low", evidence: studentMessage }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A2") {
    return result("ask_clarification", "To recommend usefully, I need three things: your academic results, whether you prefer prestige/ranking or budget/value, and your preferred study location.", {
      memoryOutputs: [{ type: "minimum_profile_requested", value: {}, confidence: "high", evidence: "Minimum profile incomplete." }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A6") {
    return result("recommend", "Based on your minimum profile, I can make a directional recommendation with medium confidence. Psychology or Business could fit depending on whether you want people-focused work or broader commercial options. My assumption is that location and value matter, so I would compare affordable KL/Selangor options next.", {
      proposedContextUpdate: { currentMainState: "S4", recommendationReadiness: "R2" },
      recommendationOutputs: [{
        option: "R2 directional shortlist: Psychology or Business in KL/Selangor value-focused universities",
        fitReasons: ["Matches stated course interest", "Uses known location/preference signals"],
        assumptions: ["Career goal and budget amount are not fully confirmed"],
        cautions: ["Counseling recommendation only; not admission or registration approval"],
        confidence: "medium"
      }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A7") {
    return result("compare", "For a shortlist, Psychology is stronger if you want counseling, HR, or human behavior. Business is broader if you want management, marketing, or finance flexibility. I would keep both shortlisted until we confirm career direction.", {
      proposedContextUpdate: { currentMainState: "S5" },
      memoryOutputs: [{ type: "shortlist", value: { options: ["Psychology", "Business"] }, confidence: "medium", evidence: studentMessage }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A9") {
    return result("confirm_preference", "I can record that as your counseling preference for now. This does not submit an application or register you; it only keeps your preferred direction clear for the next counseling step.", {
      proposedContextUpdate: { currentMainState: "S6", preferenceStrength: "L4" },
      memoryOutputs: [{ type: "confirmed_counseling_preference", value: { direction: studentMessage }, confidence: "medium", evidence: studentMessage }]
    }, baseFlags);
  }

  return result("answer", "Tell me what course area you are considering, and I will help narrow it using your results, location, and university preference.", {
    proposedContextUpdate: { currentMainState: "S3", primaryCounselingAction: "A3" },
    memoryOutputs: [{ type: "exploration_prompted", value: {}, confidence: "medium", evidence: studentMessage }]
  }, baseFlags);
}

function result(responseIntent, studentMessage, proposals, flags) {
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

function aiExecutionResultSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["response", "proposedContextUpdate", "proposedOutputs", "validationFlags"],
    properties: {
      response: {
        type: "object",
        additionalProperties: false,
        required: ["studentMessage", "responseIntent"],
        properties: {
          studentMessage: { type: "string" },
          responseIntent: { enum: ["answer", "ask_clarification", "recommend", "compare", "confirm_preference", "handoff"] }
        }
      },
      proposedContextUpdate: { type: "object" },
      proposedOutputs: {
        type: "object",
        additionalProperties: false,
        required: ["memoryOutputs", "recommendationOutputs"],
        properties: {
          memoryOutputs: { type: "array", items: { type: "object" } },
          recommendationOutputs: { type: "array", items: { type: "object" } },
          handoffOutput: { type: ["object", "null"] }
        }
      },
      validationFlags: {
        type: "object",
        additionalProperties: false,
        required: ["needsClarification", "boundarySensitive", "officialActionRisk", "memoryWriteRequiresValidation", "knowledgeUsed", "knowledgeUncertain"],
        properties: {
          needsClarification: { type: "boolean" },
          boundarySensitive: { type: "boolean" },
          officialActionRisk: { type: "boolean" },
          memoryWriteRequiresValidation: { type: "boolean" },
          knowledgeUsed: { type: "boolean" },
          knowledgeUncertain: { type: "boolean" }
        }
      }
    }
  };
}

function geminiAiExecutionResultSchema() {
  return {
    type: "object",
    required: ["response", "proposedContextUpdate", "proposedOutputs", "validationFlags"],
    properties: {
      response: {
        type: "object",
        required: ["studentMessage", "responseIntent"],
        properties: {
          studentMessage: { type: "string" },
          responseIntent: { type: "string", enum: ["answer", "ask_clarification", "recommend", "compare", "confirm_preference", "handoff"] }
        }
      },
      proposedContextUpdate: { type: "object" },
      proposedOutputs: {
        type: "object",
        required: ["memoryOutputs", "recommendationOutputs"],
        properties: {
          memoryOutputs: { type: "array", items: { type: "object" } },
          recommendationOutputs: { type: "array", items: { type: "object" } },
          handoffOutput: { type: "object", nullable: true }
        }
      },
      validationFlags: {
        type: "object",
        required: ["needsClarification", "boundarySensitive", "officialActionRisk", "memoryWriteRequiresValidation", "knowledgeUsed", "knowledgeUncertain"],
        properties: {
          needsClarification: { type: "boolean" },
          boundarySensitive: { type: "boolean" },
          officialActionRisk: { type: "boolean" },
          memoryWriteRequiresValidation: { type: "boolean" },
          knowledgeUsed: { type: "boolean" },
          knowledgeUncertain: { type: "boolean" }
        }
      }
    }
  };
}
