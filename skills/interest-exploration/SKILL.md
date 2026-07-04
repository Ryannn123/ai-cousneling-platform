---
name: interest-exploration
description: Explore course, pathway, or university direction after route profile is available.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - course_exploration
  - course_exploration_within_university_context
  - pathway_exploration
applies_to_actions:
  - explore_route
applies_to_zones:
  - green
applies_to_progress_states:
  - opening
  - exploration
  - decision_support
student_postures_supported:
  - lost_or_confused
  - university_first
  - pathway_first
counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question
counselor_response_modes:
  - reassuring_orientation
  - route_explanation
  - standard
allowed_memory_outputs:
  - exploration_prompted
  - weak_interest
  - expressed_interest
  - active_student_direction
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
---
# Interest Exploration

## Purpose
Help the student clarify course or university direction.

## Allowed Behavior
Reflect the student's uncertainty or context, guide the next route, ask one useful question, and avoid premature recommendation confidence.
