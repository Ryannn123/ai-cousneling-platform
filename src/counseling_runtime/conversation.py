from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from .constants import default_context
from .contracts import CommitResult, ConversationState, JsonObject
from .storage import conversation_path, read_json, write_json


def create_conversation() -> ConversationState:
    conversation_id = str(uuid4())
    now = datetime.now(UTC).isoformat()
    state = {
        "conversationId": conversation_id,
        "createdAt": now,
        "updatedAt": now,
        "operatingContext": default_context(),
        "currentTruth": None,
        "messages": [],
        "recommendationOutputs": [],
        "routeOutcomeOutputs": [],
        "handoff": None,
        "blockedOutputs": [],
    }
    write_json(conversation_path(conversation_id), state)
    return ConversationState.model_validate(state)


def load_conversation(conversation_id: str) -> JsonObject | None:
    return read_json(conversation_path(conversation_id))


def commit_turn(
    conversation_id: str,
    student_message: str,
    previous_state: JsonObject,
    operating_context: JsonObject,
    validation_result: JsonObject,
    current_truth: JsonObject,
) -> CommitResult:
    now = datetime.now(UTC).isoformat()
    state = previous_state or {"conversationId": conversation_id, "messages": []}
    state["updatedAt"] = now
    state["operatingContext"] = operating_context
    state["currentTruth"] = current_truth
    state.setdefault("routeOutcomeOutputs", [])
    state.pop("memoryOutputs", None)
    state.setdefault("messages", []).append({"role": "student", "content": student_message, "timestamp": now})
    state["messages"].append({"role": "assistant", "content": validation_result["finalResponse"], "timestamp": now})

    recommendation_ids = append_outputs(
        state.setdefault("recommendationOutputs", []),
        validation_result["acceptedOutputs"].get("recommendationOutputs", []),
        now,
    )
    route_outcome = validation_result["acceptedOutputs"].get("routeOutcomeOutput")
    route_outcome_ids = append_outputs(state.setdefault("routeOutcomeOutputs", []), [route_outcome] if route_outcome else [], now)

    handoff = validation_result["acceptedOutputs"].get("handoffOutput")
    if handoff and handoff.get("required"):
        state["handoff"] = {**handoff, "timestamp": now}
    state.setdefault("blockedOutputs", []).extend({**item, "timestamp": now} for item in validation_result.get("blockedOutputs", []))
    write_json(conversation_path(conversation_id), state)

    return CommitResult.model_validate({
        "committedContext": operating_context,
        "committedRecommendationOutputIds": recommendation_ids,
        "committedRouteOutcomeOutputIds": route_outcome_ids,
        "handoffPrepared": bool(state.get("handoff")),
        "blockedOutputCount": len(validation_result.get("blockedOutputs", [])),
    })


def append_outputs(target: list[JsonObject], outputs: list[JsonObject], timestamp: str) -> list[str]:
    ids = []
    for output in outputs:
        output_id = str(uuid4())
        target.append({"id": output_id, **output, "timestamp": timestamp})
        ids.append(output_id)
    return ids
