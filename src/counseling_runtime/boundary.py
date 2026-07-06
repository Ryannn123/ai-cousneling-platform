from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import TYPE_CHECKING, Any
from .schemas import BoundarySignal

if TYPE_CHECKING:
    from .semantic_delta import AcceptedSemanticDelta

@dataclass(slots=True)
class BoundaryResult:
    finalZone: str
    handoffStatus: str
    allowedNextBehavior: str
    detectedSignals: list[str] = field(default_factory=list)
    requiredBoundaryRules: list[str] = field(default_factory=list)
    aiBoundaryReason: str | None = None
    triggerType: str | None = None

    def __getitem__(self, key: str) -> Any:
        return getattr(self, key)

    def to_json_dict(self) -> dict[str, Any]:
        return {
            item.name: value
            for item in fields(self)
            if (value := getattr(self, item.name)) is not None
        }


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
    def evaluate(self, accepted_semantic_delta: AcceptedSemanticDelta) -> BoundaryResult:
        signals = [
            signal for signal in accepted_semantic_delta.accepted_runtime_only_signals if signal.kind == "boundary"
        ]
        
        red = next((signal for signal in signals if signal.severityCandidate == "red" or signal.recommendedBehavior == "handoff"), None)
        if red:
            return BoundaryResult(
                finalZone="red",
                handoffStatus="required",
                triggerType=red.triggerType or "H1",
                detectedSignals=detected_signals(signals),
                aiBoundaryReason=reason_for_signal(red, "Student is asking for a red-zone official next step."),
                requiredBoundaryRules=rules_for(signals),
                allowedNextBehavior="handoff",
            )

        
        yellow = next((signal for signal in signals if signal.type == "ambiguous_proceed_language" or signal.recommendedBehavior == "clarify_once"), None)
        if yellow:
            return BoundaryResult(
                finalZone="yellow",
                handoffStatus="possible_clarify",
                detectedSignals=detected_signals(signals),
                aiBoundaryReason=reason_for_signal(yellow, "Boundary-sensitive ambiguity requires clarification."),
                requiredBoundaryRules=rules_for(signals),
                allowedNextBehavior="clarify",
            )
            
        return BoundaryResult(
            finalZone="green",
            handoffStatus="none",
            detectedSignals=detected_signals(signals),
            requiredBoundaryRules=["no-official-action-boundary"],
            allowedNextBehavior="continue",
        )
        

def detected_signals(signals: list[BoundarySignal]) -> list[str]:
    return list(dict.fromkeys(signal.type for signal in signals))


def rules_for(signals: list[BoundarySignal]) -> list[str]:
    rules = ["no-official-action-boundary"]
    for signal in signals:
        rules.extend(BOUNDARY_RULES_BY_TYPE.get(signal.type, []))
    return list(dict.fromkeys(rules))


def reason_for_signal(signal: BoundarySignal, default: str) -> str:
    return REASONS_BY_TYPE.get(signal.type, default)
