---
name: minimum-profile-collection
description: Collect academic result plus course and university direction status for routing.
version: 1.2.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_states:
  - S1
applies_to_actions:
  - A2
applies_to_zones:
  - green
applies_to_profile_completeness:
  - incomplete
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
Collect the minimum information needed to route the counseling flow.

## Counseling Goal
Academic result status, course direction status, and university direction status.

## Response Pattern
Reflect briefly, explain that these fields choose the next route, and ask one concise question. Do not require ranking, budget, or location as universal intake gates.
