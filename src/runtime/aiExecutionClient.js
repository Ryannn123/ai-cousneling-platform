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
    return this.executeLive(executionContext);
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
            content: "You are a bounded autonomous pre-registration education counselor. Return only JSON matching the requested schema. Use counselor-like flow: reflect the student's situation, guide the next step, and ask only one purposeful question when needed. Do not claim official actions are completed."
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
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/interactions");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.geminiApiKey },
      body: JSON.stringify({
        model: cleanGeminiModelName(this.model),
        system_instruction: "You are a bounded autonomous pre-registration education counselor. Return only JSON matching the requested schema. Use counselor-like flow: reflect the student's situation, guide the next step, and ask only one purposeful question when needed. Do not claim official actions are completed.",
        input: JSON.stringify(executionContext),
        store: false,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: geminiAiExecutionResultSchema()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const payload = await response.json();
    const text = geminiInteractionText(payload);
    if (!text) throw new Error("Gemini response did not include output text");
    return parseAiExecutionResult(text, "Gemini");
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
    return result("ask_clarification", "To guide you properly, I only need the routing basics first: your academic result, whether you already have a course in mind, and whether you already have a university in mind.", {
      memoryOutputs: [{ type: "minimum_profile_requested", value: {}, confidence: "high", evidence: "Minimum profile incomplete." }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A6") {
    return result("recommend", "You already have enough direction for a first counseling recommendation. Based on what you shared, I can make a medium-confidence suggestion and then refine it with one fit question. Psychology could fit if you want people-focused work; Business stays broader if you want management, marketing, or finance flexibility. Which matters more to you now: career direction, budget, or location?", {
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
    return result("compare", "You are comparing directions, so the useful move is to narrow by trade-off instead of adding more options. Psychology is stronger if you want counseling, HR, or human behavior. Business is broader if you want management, marketing, or finance flexibility. Which trade-off matters more to you: focused interest or broader flexibility?", {
      proposedContextUpdate: { currentMainState: "S5" },
      memoryOutputs: [{ type: "shortlist", value: { options: ["Psychology", "Business"] }, confidence: "medium", evidence: studentMessage }]
    }, baseFlags);
  }

  if (operatingContext.primaryCounselingAction === "A9") {
    return result("confirm_preference", "For counseling purposes, I can treat this as your current preferred direction. This is not an application, registration, payment, enrollment, seat reservation, or CRM update. It just gives us a clear counseling milestone; from here, you can compare one final alternative, take time to think, or speak with a human counselor for official next steps.", {
      proposedContextUpdate: { currentMainState: "S6", preferenceStrength: "L4" },
      memoryOutputs: [{ type: "confirmed_counseling_preference", value: { direction: studentMessage }, confidence: "medium", evidence: studentMessage }]
    }, baseFlags);
  }

  return result("answer", "It sounds like you are still finding the right direction. We can start broad and use your strengths, disliked subjects, and career interest to narrow the route before talking about university fit. What kind of subjects or work do you usually prefer?", {
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
      proposedContextUpdate: { type: "object", additionalProperties: true },
      proposedOutputs: {
        type: "object",
        required: ["memoryOutputs", "recommendationOutputs"],
        properties: {
          memoryOutputs: { type: "array", items: { type: "object", additionalProperties: true } },
          recommendationOutputs: { type: "array", items: { type: "object", additionalProperties: true } },
          handoffOutput: { type: "object", additionalProperties: true }
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
