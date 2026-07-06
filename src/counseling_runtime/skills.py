from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

import yaml

from .constants import MANDATORY_BOUNDARY_RULES
from .contracts import JsonObject, SkillSelection
from .boundary import BoundaryResult
from .settings import SKILLS_DIR


ACTION_TO_SKILL = {
    "orient_initial_route": "initial-route-orientation",
    "explore_route": "interest-exploration",
    "answer_detour": "factual-detour-answering",
    "recommend_directionally": "directional-recommendation",
    "compare_shortlist": "shortlist-comparison",
    "clarify_ambiguity": "preference-confirmation",
    "confirm_counseling_preference": "preference-confirmation",
    "support_decision": "deferral-indecision",
    "prepare_handoff": "ready-to-register-handoff",
}

PROGRESS_TO_PLAYBOOK = {
    "exploration": "exploration-first-playbook",
    "recommendation_ready": "exploration-first-playbook",
    "recommendation_presented": "exploration-first-playbook",
    "comparison": "comparison-shortlist-playbook",
    "confirmed_preference": "confirmed-preference-to-handoff-playbook",
    "handoff": "confirmed-preference-to-handoff-playbook",
}

REQUIRED_METADATA = {"name", "description", "version", "artifact_type", "status", "owner"}


@dataclass(slots=True)
class ParsedSkill:
    metadata: JsonObject
    body: str
    ref: JsonObject


class SkillControlService:
    def __init__(self, skills_dir: Path = SKILLS_DIR) -> None:
        self.skills_dir = Path(skills_dir)

    def get_skill_inventory(self) -> JsonObject:
        loaded: list[ParsedSkill] = []
        rejected: list[JsonObject] = []
        if not self.skills_dir.exists():
            return {"loaded": [], "rejected": []}

        for directory in sorted(path for path in self.skills_dir.iterdir() if path.is_dir()):
            skill_path = directory / "SKILL.md"
            if not skill_path.exists():
                continue
            parsed = parse_skill_markdown(skill_path.read_text(encoding="utf-8"), skill_path)
            if not REQUIRED_METADATA.issubset(parsed.metadata):
                rejected.append({"skill": parsed.ref, "reason": "missing_required_metadata", "metadata": parsed.metadata})
                continue
            if parsed.metadata["status"] != "approved":
                rejected.append({"skill": parsed.ref, "reason": f"status_{parsed.metadata['status']}", "metadata": parsed.metadata})
                continue
            loaded.append(parsed)
        return {"loaded": loaded, "rejected": rejected}

    def select(self, operating_context: JsonObject, boundary_result: BoundaryResult) -> SkillSelection:
        inventory = self.get_skill_inventory()
        rejected_candidates = [{"skill": item["skill"], "reason": item["reason"]} for item in inventory["rejected"]]
        primary_action = operating_context.get("primaryCounselingAction")
        runtime_skill_name = (
            "ready-to-register-handoff"
            if boundary_result.allowedNextBehavior == "handoff"
            else ACTION_TO_SKILL.get(primary_action if isinstance(primary_action, str) else "", "interest-exploration")
        )

        selected_runtime_skill = find_compatible(inventory["loaded"], runtime_skill_name, "runtime_skill", operating_context, rejected_candidates)
        selected_runtime_package = next((skill for skill in inventory["loaded"] if skill.ref.get("name") == selected_runtime_skill.get("name")), None) if selected_runtime_skill else None
        route = operating_context.get("activeRouteEpisode") or {}
        progress_state = route.get("progressState")
        playbook_name = PROGRESS_TO_PLAYBOOK.get(progress_state if isinstance(progress_state, str) else "")
        selected_playbook = find_compatible(inventory["loaded"], playbook_name, "playbook", operating_context, rejected_candidates, True) if playbook_name else None
        required_rules = boundary_result.requiredBoundaryRules
        boundary_rule_names = [
            name
            for name in dict.fromkeys([*MANDATORY_BOUNDARY_RULES, *(required_rules if isinstance(required_rules, list) else [])])
            if isinstance(name, str)
        ]
        loaded_boundary_rules = [
            item
            for name in boundary_rule_names
            if (item := find_compatible(inventory["loaded"], name, "boundary_rule", operating_context, rejected_candidates, True))
        ]

        return SkillSelection.model_validate({
            "selectedPlaybook": selected_playbook,
            "selectedRuntimeSkill": selected_runtime_skill or fallback_ref(runtime_skill_name, "runtime_skill"),
            "selectedRuntimeSkillBody": selected_runtime_package.body if selected_runtime_package else "",
            "loadedBoundaryRules": loaded_boundary_rules,
            "rejectedCandidates": rejected_candidates,
            "allowedMemoryOutputTypes": (selected_runtime_package.metadata.get("allowed_memory_outputs", []) if selected_runtime_package else []),
            "forbiddenMemoryOutputTypes": (selected_runtime_package.metadata.get("forbidden_memory_outputs", []) if selected_runtime_package else []),
        })


def parse_skill_markdown(raw: str, source_path: Path) -> ParsedSkill:
    metadata: JsonObject = {}
    body = raw
    if raw.startswith("---"):
        _, frontmatter, body = raw.split("---", 2)
        metadata = yaml.safe_load(frontmatter) or {}
    ref = {
        "name": metadata.get("name") or source_path.parent.name,
        "version": metadata.get("version") or "0.0.0",
        "artifactType": metadata.get("artifact_type") or "unknown",
        "contentHash": hashlib.sha256(raw.encode("utf-8")).hexdigest(),
        "sourcePath": str(source_path),
    }
    return ParsedSkill(metadata=metadata, body=body.lstrip(), ref=ref)


def find_compatible(
    loaded: list[ParsedSkill],
    name: str,
    artifact_type: str,
    context: JsonObject,
    rejected_candidates: list[JsonObject],
    optional: bool = False,
) -> JsonObject | None:
    candidate = next((skill for skill in loaded if skill.metadata.get("name") == name and skill.metadata.get("artifact_type") == artifact_type), None)
    if not candidate:
        if not optional:
            rejected_candidates.append({"skill": fallback_ref(name, artifact_type), "reason": "not_found"})
        return None
    reason = compatibility_failure(candidate.metadata, context)
    if reason:
        rejected_candidates.append({"skill": candidate.ref, "reason": reason})
        return None
    return candidate.ref


def compatibility_failure(metadata: JsonObject, context: JsonObject) -> str | None:
    route = context.get("activeRouteEpisode") or {}
    route_episode = metadata.get("route_episode", {})
    route_episode = route_episode if isinstance(route_episode, dict) else {}
    checks = [
        (route_episode.get("applies_to_active_routes") or metadata.get("applies_to_active_routes"), route.get("routeType"), "route"),
        (route_episode.get("applies_to_progress_states") or metadata.get("applies_to_progress_states"), route.get("progressState"), "progress"),
        (metadata.get("applies_to_actions"), context.get("primaryCounselingAction"), "action"),
        (metadata.get("applies_to_zones"), context.get("currentZone"), "zone"),
        (metadata.get("applies_to_recommendation_readiness"), context.get("recommendationReadiness"), "readiness"),
        (metadata.get("student_postures_supported"), context.get("studentPosture"), "posture"),
        (metadata.get("counselor_response_modes"), context.get("counselorResponseMode"), "response_mode"),
    ]
    for allowed, value, label in checks:
        if isinstance(allowed, list) and allowed and value and value not in allowed:
            return f"{label}_{value}_not_allowed"
    return None


def fallback_ref(name: str, artifact_type: str) -> JsonObject:
    return {"name": name, "version": "missing", "artifactType": artifact_type}
