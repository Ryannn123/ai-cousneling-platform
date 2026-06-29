---
name: internal-only-knowledge-boundary
description: Prevents unsupported or internal-only facts from being presented as verified student-safe facts.
version: 1.0.0
artifact_type: boundary_rule
status: approved
owner: counseling_team
severity: yellow
override_normal_skill: false
allowed_memory_outputs:
  - factual_detour_answered
  - knowledge_gap
---
# Internal Only Knowledge Boundary

## Purpose
Use only student-safe seed catalog facts and caveat unknowns.
