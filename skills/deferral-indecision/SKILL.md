---
name: deferral-indecision
description: Support safe deferral or indecision inside the active route without forcing a confirmed preference.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - course_exploration
  - university_exploration
  - course_exploration_within_university_context
  - pathway_exploration
  - combined_option_validation
applies_to_progress_states:
  - decision_support
  - deferral_indecision
applies_to_actions:
  - support_decision
applies_to_zones:
  - green
  - yellow
student_postures_supported:
  - indecisive
  - validation_seeking
  - constraint_driven
counselor_response_modes:
  - decision_support
allowed_memory_outputs:
  - deferral_signal
  - exploration_prompted
  - ai_core_fallback_used
forbidden_memory_outputs:
  - application_submitted
  - registration_completed
  - enrollment_confirmed
  - payment_confirmed
  - seat_reserved
  - crm_status_updated
required_boundary_rules:
  - no-official-action-boundary
  - preference-promotion-boundary
---
# Deferral Indecision

## Purpose
Help the student pause, reflect a blocker, or accept a safe fallback without pressure.

## Forbidden Behavior
Do not force confirmation or treat deferral as official action.
