import { readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { listDirectories } from "./fileStore.js";
import { MANDATORY_BOUNDARY_RULES } from "./constants.js";

const SKILLS_DIR = path.join(process.cwd(), "skills");

const ACTION_TO_SKILL = {
  A2: "minimum-profile-collection",
  A3: "interest-exploration",
  A5: "factual-detour-answering",
  A6: "directional-recommendation",
  A7: "shortlist-comparison",
  A8: "preference-confirmation",
  A9: "preference-confirmation",
  A10: "preference-confirmation",
  A12: "ready-to-register-handoff"
};

const STATE_TO_PLAYBOOK = {
  S3: "exploration-first-playbook",
  S4: "exploration-first-playbook",
  S5: "comparison-shortlist-playbook",
  S6: "confirmed-preference-to-handoff-playbook",
  S7: "confirmed-preference-to-handoff-playbook"
};

export class SkillControlService {
  constructor(skillsDir = SKILLS_DIR) {
    this.skillsDir = skillsDir;
  }

  async getSkillInventory() {
    const directories = existsSync(this.skillsDir) ? await listDirectories(this.skillsDir) : [];
    const loaded = [];
    const rejected = [];

    for (const directory of directories) {
      const skillPath = path.join(directory, "SKILL.md");
      if (!existsSync(skillPath)) continue;
      const raw = await readFile(skillPath, "utf8");
      const parsed = parseSkillMarkdown(raw, skillPath);
      if (!hasRequiredMetadata(parsed.metadata)) {
        rejected.push({ skill: parsed.ref, reason: "missing_required_metadata", metadata: parsed.metadata });
        continue;
      }
      if (parsed.metadata.status !== "approved") {
        rejected.push({ skill: parsed.ref, reason: `status_${parsed.metadata.status}`, metadata: parsed.metadata });
        continue;
      }
      loaded.push(parsed);
    }

    return { loaded, rejected };
  }

  async select(operatingContext, boundaryResult) {
    const inventory = await this.getSkillInventory();
    const rejectedCandidates = [...inventory.rejected.map((item) => ({
      skill: item.skill,
      reason: item.reason
    }))];

    const runtimeSkillName = boundaryResult.allowedNextBehavior === "handoff"
      ? "ready-to-register-handoff"
      : ACTION_TO_SKILL[operatingContext.primaryCounselingAction] || "interest-exploration";

    const selectedRuntimeSkill = findCompatible(
      inventory.loaded,
      runtimeSkillName,
      "runtime_skill",
      operatingContext,
      rejectedCandidates
    );
    const selectedRuntimeSkillPackage = selectedRuntimeSkill
      ? inventory.loaded.find((skill) => skill.ref.name === selectedRuntimeSkill.name)
      : undefined;

    const playbookName = STATE_TO_PLAYBOOK[operatingContext.currentMainState];
    const selectedPlaybook = playbookName
      ? findCompatible(inventory.loaded, playbookName, "playbook", operatingContext, rejectedCandidates)
      : undefined;

    const boundaryRuleNames = Array.from(new Set([
      ...MANDATORY_BOUNDARY_RULES,
      ...boundaryResult.requiredBoundaryRules
    ]));

    const loadedBoundaryRules = boundaryRuleNames
      .map((name) => findCompatible(inventory.loaded, name, "boundary_rule", operatingContext, rejectedCandidates, true))
      .filter(Boolean);

    return {
      selectedPlaybook,
      selectedRuntimeSkill: selectedRuntimeSkill || fallbackRef(runtimeSkillName, "runtime_skill"),
      loadedBoundaryRules,
      rejectedCandidates,
      allowedMemoryOutputTypes: selectedRuntimeSkillPackage?.metadata.allowed_memory_outputs || [],
      forbiddenMemoryOutputTypes: selectedRuntimeSkillPackage?.metadata.forbidden_memory_outputs || []
    };
  }
}

function parseSkillMarkdown(raw, sourcePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const metadata = match ? parseYamlSubset(match[1]) : {};
  const body = match ? match[2] : raw;
  const ref = {
    name: metadata.name || path.basename(path.dirname(sourcePath)),
    version: metadata.version || "0.0.0",
    artifactType: metadata.artifact_type || "unknown",
    contentHash: crypto.createHash("sha256").update(raw).digest("hex"),
    sourcePath
  };
  return { metadata, body, ref };
}

function parseYamlSubset(text) {
  // ponytail: SKILL.md frontmatter only needs scalars and string arrays for this prototype.
  const result = {};
  let currentKey = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    if (/^\s+- /.test(line) && currentKey) {
      result[currentKey].push(line.replace(/^\s+- /, "").trim());
      continue;
    }
    const keyValue = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyValue) continue;
    const [, key, value] = keyValue;
    if (value === "") {
      result[key] = [];
      currentKey = key;
    } else {
      result[key] = value.trim();
      currentKey = null;
    }
  }
  return result;
}

function hasRequiredMetadata(metadata) {
  return metadata.name
    && metadata.description
    && metadata.version
    && metadata.artifact_type
    && metadata.status
    && metadata.owner;
}

function findCompatible(loaded, name, artifactType, context, rejectedCandidates, optional = false) {
  const candidate = loaded.find((skill) => skill.metadata.name === name && skill.metadata.artifact_type === artifactType);
  if (!candidate) {
    if (!optional) rejectedCandidates.push({ skill: fallbackRef(name, artifactType), reason: "not_found" });
    return undefined;
  }
  const reason = compatibilityFailure(candidate.metadata, context);
  if (reason) {
    rejectedCandidates.push({ skill: candidate.ref, reason });
    return undefined;
  }
  return candidate.ref;
}

function compatibilityFailure(metadata, context) {
  if (Array.isArray(metadata.applies_to_states) && metadata.applies_to_states.length && !metadata.applies_to_states.includes(context.currentMainState)) {
    return `state_${context.currentMainState}_not_allowed`;
  }
  if (Array.isArray(metadata.applies_to_actions) && metadata.applies_to_actions.length && !metadata.applies_to_actions.includes(context.primaryCounselingAction)) {
    return `action_${context.primaryCounselingAction}_not_allowed`;
  }
  if (Array.isArray(metadata.applies_to_zones) && metadata.applies_to_zones.length && !metadata.applies_to_zones.includes(context.currentZone)) {
    return `zone_${context.currentZone}_not_allowed`;
  }
  if (Array.isArray(metadata.applies_to_recommendation_readiness)
    && metadata.applies_to_recommendation_readiness.length
    && !metadata.applies_to_recommendation_readiness.includes(context.recommendationReadiness)) {
    return `readiness_${context.recommendationReadiness}_not_allowed`;
  }
  return null;
}

function fallbackRef(name, artifactType) {
  return { name, version: "missing", artifactType };
}
