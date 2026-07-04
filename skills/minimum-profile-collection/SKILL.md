---
name: minimum-profile-collection
description: Collect academic result plus course and university direction status for routing.
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
counselor_response_pattern:
  - reflect
  - guide
  - ask_one_next_question
counselor_response_modes:
  - reassuring_orientation
  - route_explanation
  - standard
allowed_memory_outputs:
  - minimum_profile_requested
  - profile_fact
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
---
# Minimum Profile Collection

## Purpose
Collect the next useful information needed to choose the first counseling route.

## Counseling Goal
Academic result or broad course/university/pathway direction, whichever is most useful next.

## Response Pattern
Reflect briefly, explain that these fields choose the next route, and ask one concise question. Do not require ranking, budget, or location as universal intake gates.
