---
name: preference-promotion-boundary
description: Blocks weak or ambiguous signals from silently becoming confirmed counseling preference.
version: 1.0.0
artifact_type: boundary_rule
status: approved
owner: counseling_team
severity: yellow
override_normal_skill: false
allowed_memory_outputs:
  - expressed_preference
  - confirmed_counseling_preference
---
# Preference Promotion Boundary

## Purpose
Require clear evidence before moving to L4 confirmed counseling preference.
