from __future__ import annotations

from typing import Any


BOUNDARY_RULES_BY_TYPE = {
    "ready_to_apply_or_register": ["no-official-action-boundary", "ready-to-register-detection"],
    "official_action_request": ["no-official-action-boundary", "ready-to-register-detection"],
    "payment_or_seat_request": ["no-official-action-boundary", "ready-to-register-detection"],
    "exception_or_waiver_request": ["no-official-action-boundary"],
    "sensitive_context": ["no-official-action-boundary"],
    "human_requested_support": ["no-official-action-boundary"],
    "ambiguous_proceed_language": ["ambiguous-proceed-clarification", "preference-promotion-boundary"],
}

REASONS_BY_TYPE = {
    "ready_to_apply_or_register": "Student is asking to apply or register.",
    "official_action_request": "Student is asking for an official action.",
    "payment_or_seat_request": "Student is asking about payment, enrollment, or seat commitment.",
    "exception_or_waiver_request": "Student is asking about an exception, appeal, waiver, or complex eligibility.",
    "sensitive_context": "Student raised a sensitive or high-risk context.",
    "human_requested_support": "Student explicitly requested human support.",
    "ambiguous_proceed_language": "Proceed language may refer to preference confirmation or official action.",
}


class BoundaryEngine:
    def evaluate(self, turn_input: dict[str, Any], accepted_semantic_delta: dict[str, Any] | None = None) -> dict[str, Any]:
        return BoundaryResolver().resolve(accepted_semantic_delta or {})


class BoundaryResolver:
    def resolve(self, accepted_semantic_delta: dict[str, Any] | None = None) -> dict[str, Any]:
        signals = [
            signal for signal in (accepted_semantic_delta or {}).get("acceptedRuntimeOnlySignals", [])
            if signal.get("kind") == "boundary"
        ]
        red = next((signal for signal in signals if signal.get("severityCandidate") == "red" or signal.get("recommendedBehavior") == "handoff"), None)
        if red:
            return self.red_result(red, signals)
        yellow = next((signal for signal in signals if signal.get("type") == "ambiguous_proceed_language" or signal.get("recommendedBehavior") == "clarify_once"), None)
        if yellow:
            return {
                "finalZone": "yellow",
                "handoffStatus": "possible_clarify",
                "detectedSignals": detected_signals(signals),
                "aiBoundaryReason": REASONS_BY_TYPE.get(yellow.get("type"), "Boundary-sensitive ambiguity requires clarification."),
                "requiredBoundaryRules": rules_for(signals),
                "allowedNextBehavior": "clarify",
            }
        return {
            "finalZone": "green",
            "handoffStatus": "none",
            "detectedSignals": detected_signals(signals),
            "requiredBoundaryRules": ["no-official-action-boundary"],
            "allowedNextBehavior": "continue",
        }

    def red_result(self, signal: dict[str, Any], all_signals: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "finalZone": "red",
            "handoffStatus": "required",
            "triggerType": signal.get("triggerType") or "H1",
            "detectedSignals": detected_signals(all_signals),
            "aiBoundaryReason": REASONS_BY_TYPE.get(signal.get("type"), "Student is asking for a red-zone official next step."),
            "requiredBoundaryRules": rules_for(all_signals),
            "allowedNextBehavior": "handoff",
        }


def detected_signals(signals: list[dict[str, Any]]) -> list[str]:
    return list(dict.fromkeys(signal.get("type") for signal in signals if signal.get("type")))


def rules_for(signals: list[dict[str, Any]]) -> list[str]:
    rules = ["no-official-action-boundary"]
    for signal in signals:
        rules.extend(BOUNDARY_RULES_BY_TYPE.get(signal.get("type"), []))
    return list(dict.fromkeys(rules))
