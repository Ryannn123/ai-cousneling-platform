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
    if (!this.hasApiKey()) throw new Error("AI execution API key is required for execution");
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
