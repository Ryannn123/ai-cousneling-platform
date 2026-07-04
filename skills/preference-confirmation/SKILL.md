---
name: preference-confirmation
description: Confirm counseling preference while blocking official-action interpretation.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_actions:
  - clarify_ambiguity
  - confirm_counseling_preference
  - support_decision
applies_to_zones:
  - green
  - yellow
applies_to_active_routes:
  - initial_route_selection
  - course_exploration
  - university_exploration
  - course_exploration_within_university_context
  - pathway_exploration
  - combined_option_validation
applies_to_progress_states:
  - decision_support
  - confirmed_preference
  - deferral_indecision
  - exploration
student_postures_supported:
  - decision_ready
  - validation_seeking
  - indecisive
counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question
counselor_response_modes:
  - milestone_confirmation
  - clarify_once
  - decision_support
  - standard
allowed_memory_outputs:
  - confirmed_counseling_preference
  - expressed_preference
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
  - ambiguous-proceed-clarification
  - preference-promotion-boundary
  - no-official-action-boundary
---
# Preference Confirmation

## Milestone Behavior
Confirm only counseling preference, restate it as non-official, summarize fit when possible, and offer safe next steps.

## Purpose
Confirm counseling preference only after student intent is clear.

## Forbidden Behavior
Never convert counseling preference into application, registration, enrollment, payment, seat reservation, or CRM status.
