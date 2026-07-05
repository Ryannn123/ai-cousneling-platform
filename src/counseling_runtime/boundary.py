from __future__ import annotations

from .contracts import BoundaryResult, JsonObject, TurnInput


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
    def evaluate(self, turn_input: TurnInput | JsonObject, accepted_semantic_delta: JsonObject | None = None) -> BoundaryResult:
        return BoundaryResolver().resolve(accepted_semantic_delta or {})


class BoundaryResolver:
    def resolve(self, accepted_semantic_delta: JsonObject | None = None) -> BoundaryResult:
        signals = [
            signal for signal in (accepted_semantic_delta or {}).get("acceptedRuntimeOnlySignals", [])
            if signal.get("kind") == "boundary"
        ]
        red = next((signal for signal in signals if signal.get("severityCandidate") == "red" or signal.get("recommendedBehavior") == "handoff"), None)
        if red:
            return self.red_result(red, signals)
        yellow = next((signal for signal in signals if signal.get("type") == "ambiguous_proceed_language" or signal.get("recommendedBehavior") == "clarify_once"), None)
        if yellow:
            return BoundaryResult.model_validate({
                "finalZone": "yellow",
                "handoffStatus": "possible_clarify",
                "detectedSignals": detected_signals(signals),
                "aiBoundaryReason": reason_for_signal(yellow, "Boundary-sensitive ambiguity requires clarification."),
                "requiredBoundaryRules": rules_for(signals),
                "allowedNextBehavior": "clarify",
            })
        return BoundaryResult.model_validate({
            "finalZone": "green",
            "handoffStatus": "none",
            "detectedSignals": detected_signals(signals),
            "requiredBoundaryRules": ["no-official-action-boundary"],
            "allowedNextBehavior": "continue",
        })

    def red_result(self, signal: JsonObject, all_signals: list[JsonObject]) -> BoundaryResult:
        return BoundaryResult.model_validate({
            "finalZone": "red",
            "handoffStatus": "required",
            "triggerType": signal.get("triggerType") or "H1",
            "detectedSignals": detected_signals(all_signals),
            "aiBoundaryReason": reason_for_signal(signal, "Student is asking for a red-zone official next step."),
            "requiredBoundaryRules": rules_for(all_signals),
            "allowedNextBehavior": "handoff",
        })


def detected_signals(signals: list[JsonObject]) -> list[str]:
    return list(dict.fromkeys(signal_type for signal in signals if isinstance((signal_type := signal.get("type")), str)))


def rules_for(signals: list[JsonObject]) -> list[str]:
    rules = ["no-official-action-boundary"]
    for signal in signals:
        signal_type = signal.get("type")
        if isinstance(signal_type, str):
            rules.extend(BOUNDARY_RULES_BY_TYPE.get(signal_type, []))
    return list(dict.fromkeys(rules))


def reason_for_signal(signal: JsonObject, default: str) -> str:
    signal_type = signal.get("type")
    return REASONS_BY_TYPE.get(signal_type, default) if isinstance(signal_type, str) else default
