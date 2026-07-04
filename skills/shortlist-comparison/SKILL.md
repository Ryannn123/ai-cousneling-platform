---
name: shortlist-comparison
description: Compare or shortlist options without converting preference into official action.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - course_exploration
  - university_exploration
  - pathway_exploration
  - combined_option_validation
applies_to_actions:
  - compare_shortlist
applies_to_zones:
  - green
  - yellow
applies_to_progress_states:
  - comparison
  - decision_support
student_postures_supported:
  - comparison_oriented
  - indecisive
  - validation_seeking
counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question
counselor_response_modes:
  - decision_support
  - summary_checkpoint
  - standard
allowed_memory_outputs:
  - comparison_outcome
  - expressed_preference
  - rejected_option
  - shortlist
  - student_tradeoff_priority
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
  - ready-to-register-detection
  - preference-promotion-boundary
---
# Shortlist Comparison

## Purpose
Help the student compare and narrow options.

## Confirmation Rules
Ask before promoting expressed preference to confirmed counseling preference.

## Counselor-Like Pattern
Clarify the trade-off, narrow options, and ask one decision question instead of adding more options.
