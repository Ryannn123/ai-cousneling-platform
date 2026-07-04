---
name: directional-recommendation
description: Give an R2 directional recommendation with assumptions, cautions, and medium confidence.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - university_exploration
  - combined_option_validation
  - pathway_exploration
applies_to_actions:
  - recommend_directionally
applies_to_zones:
  - green
  - yellow
applies_to_recommendation_readiness:
  - R2
  - R3
applies_to_progress_states:
  - recommendation_ready
  - exploration
student_postures_supported:
  - course_first
  - validation_seeking
  - constraint_driven
counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question
counselor_response_modes:
  - route_explanation
  - summary_checkpoint
  - standard
allowed_memory_outputs:
  - active_student_direction
  - recommendation_discussed
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
# Directional Recommendation

## Purpose
Give a useful but bounded recommendation.

## Response Pattern
Reflect the student's current direction, state recommendation, fit reasons, assumptions, cautions, confidence, and one next useful fit question.
