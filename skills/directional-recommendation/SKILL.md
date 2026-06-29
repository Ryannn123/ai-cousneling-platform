---
name: directional-recommendation
description: Give an R2 directional recommendation with assumptions, cautions, and medium confidence.
version: 1.0.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_states:
  - S4
applies_to_actions:
  - A6
applies_to_zones:
  - green
  - yellow
applies_to_recommendation_readiness:
  - R2
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
State recommendation, fit reasons, assumptions, cautions, confidence, and one next question.
