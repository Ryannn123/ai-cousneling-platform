import { readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { listDirectories } from "./fileStore.js";
import { MANDATORY_BOUNDARY_RULES } from "./constants.js";

const SKILLS_DIR = path.join(process.cwd(), "skills");

const ACTION_TO_SKILL = {
  orient_initial_route: "initial-route-orientation",
  explore_route: "interest-exploration",
  answer_detour: "factual-detour-answering",
  recommend_directionally: "directional-recommendation",
  compare_shortlist: "shortlist-comparison",
  clarify_ambiguity: "preference-confirmation",
  confirm_counseling_preference: "preference-confirmation",
  support_decision: "deferral-indecision",
  prepare_handoff: "ready-to-register-handoff"
};

const PROGRESS_TO_PLAYBOOK = {
  exploration: "exploration-first-playbook",
  recommendation_ready: "exploration-first-playbook",
  recommendation_presented: "exploration-first-playbook",
  comparison: "comparison-shortlist-playbook",
  confirmed_preference: "confirmed-preference-to-handoff-playbook",
  handoff: "confirmed-preference-to-handoff-playbook"
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

    const playbookName = PROGRESS_TO_PLAYBOOK[operatingContext.activeRouteEpisode?.progressState];
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
  // ponytail: SKILL.md frontmatter only needs scalars, one-level maps, and string arrays for this prototype.
  const result = {};
  let currentKey = null;
  let currentParent = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (/^\s+- /.test(line) && currentKey) {
      const target = currentParent ? result[currentParent][currentKey] : result[currentKey];
      target.push(line.replace(/^\s+- /, "").trim());
      continue;
    }
    const keyValue = line.trim().match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyValue) continue;
    const [, key, value] = keyValue;
    if (indent === 0) currentParent = null;
    if (indent > 0 && !currentParent && currentKey && Array.isArray(result[currentKey])) {
      currentParent = currentKey;
      result[currentParent] = {};
    }
    if (value === "") {
      if (indent > 0 && currentParent) {
        result[currentParent][key] = [];
        currentKey = key;
      } else {
        result[key] = [];
        currentKey = key;
      }
    } else {
      if (indent > 0 && currentParent) result[currentParent][key] = value.trim();
      else result[key] = value.trim();
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
  const route = context.activeRouteEpisode;
  const activeRoutes = metadata.route_episode?.applies_to_active_routes || metadata.applies_to_active_routes;
  if (Array.isArray(activeRoutes) && activeRoutes.length && route?.routeType && !activeRoutes.includes(route.routeType)) {
    return `route_${route.routeType}_not_allowed`;
  }
  const progressStates = metadata.route_episode?.applies_to_progress_states || metadata.applies_to_progress_states;
  if (Array.isArray(progressStates) && progressStates.length && route?.progressState && !progressStates.includes(route.progressState)) {
    return `progress_${route.progressState}_not_allowed`;
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
  if (Array.isArray(metadata.student_postures_supported)
    && metadata.student_postures_supported.length
    && context.studentPosture
    && !metadata.student_postures_supported.includes(context.studentPosture)) {
    return `posture_${context.studentPosture}_not_allowed`;
  }
  if (Array.isArray(metadata.counselor_response_modes)
    && metadata.counselor_response_modes.length
    && context.counselorResponseMode
    && !metadata.counselor_response_modes.includes(context.counselorResponseMode)) {
    return `response_mode_${context.counselorResponseMode}_not_allowed`;
  }
  return null;
}

function fallbackRef(name, artifactType) {
  return { name, version: "missing", artifactType };
}
