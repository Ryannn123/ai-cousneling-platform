import { AISemanticDeltaExtractor } from "./aiSemanticDeltaExtractor.js";

export async function parseLlmSemanticDelta(turnInput, options = {}) {
  return new AISemanticDeltaExtractor(options).extract(turnInput);
}

const turnInput = {
  studentMessage: "I’m considering Business and Psychology, but my parent want me to study law, which one have better job opportunity?"
};

const result = await parseLlmSemanticDelta(turnInput);
console.dir(result, { depth: null, colors: true });
