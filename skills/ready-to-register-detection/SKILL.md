---
name: ready-to-register-detection
description: Detects apply, register, enroll, pay, or reserve-seat intent.
version: 1.0.0
artifact_type: boundary_rule
status: approved
owner: counseling_team
trigger_type:
  - H1
severity: red
override_normal_skill: true
allowed_memory_outputs:
  - readiness_to_register_signal
  - handoff_required
---
# Ready To Register Detection

## Purpose
Convert official next-step intent into handoff.
