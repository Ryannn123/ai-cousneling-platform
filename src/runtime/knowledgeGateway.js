import path from "node:path";
import { readJson } from "./fileStore.js";

const CATALOG_PATH = path.join(process.cwd(), "data", "knowledge", "catalog.json");

export class KnowledgeGateway {
  constructor(catalogPath = CATALOG_PATH) {
    this.catalogPath = catalogPath;
  }

  needsKnowledge(studentMessage) {
    return /\b(fee|fees|cost|tuition|location|campus|ranking|rank|duration|pathway|intake)\b/i.test(studentMessage || "");
  }

  async answer(studentMessage, acceptedSemanticDelta) {
    const knowledgeNeedSignals = (acceptedSemanticDelta?.acceptedRuntimeOnlySignals || [])
      .filter((signal) => signal.kind === "knowledge_need");
    if (!knowledgeNeedSignals.length && !this.needsKnowledge(studentMessage)) return undefined;
    const catalog = await readJson(this.catalogPath, { programs: [] });
    const text = `${studentMessage || ""} ${knowledgeNeedSignals.map((signal) => signal.query).join(" ")}`.toLowerCase();
    const matches = catalog.programs.filter((program) => {
      const haystack = `${program.program} ${program.university} ${program.location}`.toLowerCase();
      return haystack.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
    });

    if (!matches.length) {
      return {
        answerable: false,
        facts: [],
        caveat: "I do not have a verified catalog fact for that specific question in this prototype.",
        sources: [],
        uncertaintyLevel: knowledgeNeedSignals.some((signal) => signal.decisionCriticality === "decision_critical") ? "decision_critical" : "decision_critical"
      };
    }

    const facts = matches.slice(0, 3).map((program) => ({
      program: program.program,
      university: program.university,
      location: program.location,
      annualFeeMyr: program.annualFeeMyr,
      pathwayDuration: program.pathwayDuration,
      rankingBand: program.rankingBand,
      source: "seed-demo-catalog"
    }));

    return {
      answerable: true,
      facts,
      caveat: "These are seed demo facts for prototype counseling, not official university confirmation.",
      sources: facts.map((fact) => ({ type: "seed_catalog", label: `${fact.university} ${fact.program}` })),
      uncertaintyLevel: knowledgeNeedSignals.some((signal) => signal.decisionCriticality === "decision_critical") ? "decision_critical" : "minor"
    };
  }
}
