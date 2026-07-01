import { AISemanticDeltaExtractor } from "./aiSemanticDeltaExtractor.js";

export async function parseLlmSemanticDelta(turnInput, options = {}) {
  return new AISemanticDeltaExtractor(options).extract(turnInput);
}

const turnInput = {
  studentMessage: "I got 5 credits in SPM, but I don’t know what course I want yet?"
};

const result = await parseLlmSemanticDelta(turnInput);
console.dir(result, { depth: null, colors: true });
