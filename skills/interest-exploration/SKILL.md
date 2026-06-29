---
name: interest-exploration
description: Explore course, career, and university interest after minimum profile is available.
version: 1.0.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_states:
  - S3
applies_to_actions:
  - A3
applies_to_zones:
  - green
allowed_memory_outputs:
  - exploration_prompted
  - weak_interest
  - expressed_interest
  - active_student_direction
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
Ask one useful question, reflect interests, and avoid premature recommendation confidence.
