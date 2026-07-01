import { AISemanticDeltaExtractor } from "./aiSemanticDeltaExtractor.js";

export async function parseLlmSemanticDelta(turnInput, options = {}) {
  return new AISemanticDeltaExtractor(options).extractRaw(turnInput);
}

// const turnInput = {
//   studentMessage: "i want to study business, psycology and IT. What these course study about and which one have better job opportunity"
// };
//
// const result = await parseLlmSemanticDelta(turnInput);
// console.dir(result, { depth: null, colors: true });
