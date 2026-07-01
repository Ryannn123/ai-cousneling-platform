import { AIInterpretationClient } from "./aiInterpretationClient.js";

export async function parseLlmInterpretation(turnInput, options = {}) {
  return new AIInterpretationClient(options).interpretRaw(turnInput);
}

async function main() {
  const turnInput = {
    studentMessage: "i confirm to study business"
  }
  const result = await parseLlmInterpretation(turnInput)
  console.dir(result, {depth: null, colors: true})
}

main()