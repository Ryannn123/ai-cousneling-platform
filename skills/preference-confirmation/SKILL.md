---
name: preference-confirmation
description: Confirm counseling preference while blocking official-action interpretation.
version: 1.0.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_actions:
  - A8
  - A9
  - A10
applies_to_zones:
  - green
  - yellow
allowed_memory_outputs:
  - confirmed_counseling_preference
  - expressed_preference
  - deferral_signal
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

## Purpose
Confirm counseling preference only after student intent is clear.

## Forbidden Behavior
Never convert counseling preference into application, registration, enrollment, payment, seat reservation, or CRM status.
