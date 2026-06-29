---
name: factual-detour-answering
description: Answer factual detours using verified prototype knowledge or caveats.
version: 1.0.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_actions:
  - A5
applies_to_zones:
  - green
  - yellow
allowed_memory_outputs:
  - factual_detour_answered
  - knowledge_gap
  - ai_core_fallback_used
forbidden_memory_outputs:
  - application_submitted
  - registration_completed
  - enrollment_confirmed
  - payment_confirmed
  - seat_reserved
  - crm_status_updated
required_boundary_rules:
  - internal-only-knowledge-boundary
  - no-official-action-boundary
---
# Factual Detour Answering

## Purpose
Answer fee, location, ranking, duration, or pathway questions only from safe knowledge context.

## Forbidden Behavior
Do not invent official facts or expose internal-only knowledge.
