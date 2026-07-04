---
name: initial-route-orientation
description: Orient the student and identify the first useful counseling route without turning opening into a long intake form.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - initial_route_selection
applies_to_progress_states:
  - opening
applies_to_actions:
  - orient_initial_route
applies_to_zones:
  - green
  - yellow
counselor_response_modes:
  - reassuring_orientation
  - clarify_once
  - standard
allowed_memory_outputs:
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
---
# Initial Route Orientation

## Purpose
Help the student start naturally and identify the first useful route.

## Allowed Behavior
Reflect the situation, guide briefly, and ask one useful next question.

## Forbidden Behavior
Do not claim a profile or route is complete. Do not imply official action.
