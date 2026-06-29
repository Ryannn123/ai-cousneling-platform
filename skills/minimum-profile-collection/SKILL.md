---
name: minimum-profile-collection
description: Collect academic results, university preference type, and preferred location.
version: 1.0.0
artifact_type: runtime_skill
status: approved
owner: counseling_team
applies_to_states:
  - S1
applies_to_actions:
  - A2
applies_to_zones:
  - green
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
Collect the minimum information needed for useful counseling.

## Counseling Goal
Academic results, preference for prestige/ranking or budget/value, and preferred location.

## Response Pattern
Ask for the missing items in one concise question.
