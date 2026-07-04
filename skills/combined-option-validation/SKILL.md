---
name: combined-option-validation
description: Validate a combined course, university, or pathway counseling option without treating it as official action.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - combined_option_validation
applies_to_progress_states:
  - exploration
  - recommendation_ready
  - comparison
  - decision_support
  - confirmed_preference
applies_to_actions:
  - explore_route
  - recommend_directionally
  - compare_shortlist
  - confirm_counseling_preference
applies_to_zones:
  - green
  - yellow
allowed_memory_outputs:
  - exploration_prompted
  - confirmed_counseling_preference
  - shortlist
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
# Combined Option Validation

## Purpose
Validate a combined counseling option while keeping it non-official.
