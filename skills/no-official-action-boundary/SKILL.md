---
name: no-official-action-boundary
description: Blocks any autonomous official business action or claim of completion.
version: 1.0.0
artifact_type: boundary_rule
status: approved
owner: counseling_team
trigger_type:
  - H1
  - H2
  - H3
severity: red
override_normal_skill: true
blocks_actions:
  - submit_application
  - register_student
  - reserve_seat
  - take_payment
  - update_crm_status
  - confirm_enrollment
allowed_memory_outputs:
  - readiness_to_register_signal
  - handoff_required
  - handoff_reason
  - handoff_summary
---
# No Official Action Boundary

## Purpose
Official action outputs are never commit-eligible in this prototype.
