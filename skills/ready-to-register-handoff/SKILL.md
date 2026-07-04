---
name: ready-to-register-handoff
description: Prepare handoff when the student wants to apply, register, pay, enroll, or reserve a seat.
version: 1.3.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_active_routes:
  - handoff_preparation
applies_to_progress_states:
  - handoff
applies_to_actions:
  - prepare_handoff
applies_to_zones:
  - red
allowed_memory_outputs:
  - readiness_to_register_signal
  - handoff_required
  - handoff_reason
  - handoff_summary
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
# Ready To Register Handoff

## Purpose
Stop autonomous counseling and prepare human handoff.

## Response Pattern
Explain the boundary, summarize context, and avoid claiming official completion.
