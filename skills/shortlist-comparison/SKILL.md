---
name: shortlist-comparison
description: Compare or shortlist options without converting preference into official action.
version: 1.0.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_states:
  - S5
applies_to_actions:
  - A7
applies_to_zones:
  - green
  - yellow
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
