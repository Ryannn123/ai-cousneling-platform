---
name: course-program-exploration
description: Explore course or program direction inside a course exploration route.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - course_exploration
applies_to_progress_states:
  - opening
  - exploration
  - decision_support
applies_to_actions:
  - explore_route
applies_to_zones:
  - green
  - yellow
counselor_response_modes:
  - reassuring_orientation
  - standard
  - decision_support
allowed_memory_outputs:
  - exploration_prompted
  - weak_interest
  - expressed_interest
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
# Course Program Exploration

## Purpose
Help the student resolve course or program direction.
