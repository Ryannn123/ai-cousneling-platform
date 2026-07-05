from __future__ import annotations

import json
from typing import Any

from pydantic_ai import Agent

from .contracts import ExecutionContext, JsonObject, TurnInput
from .schemas import AIExecutionResult, SemanticDeltaResult
from .settings import Settings, get_settings
from .storage import jsonable


SYSTEM_PROMPT = " ".join([
    "You are a bounded autonomous pre-registration education counselor.",
    "Return only structured data matching the requested schema.",
    "Use counselor-like flow: briefly reflect the student's situation, guide the next step, and ask only one purposeful question when needed.",
    "Follow the selected runtime skill instructions and the response plan.",
    "Do not claim application, registration, payment, enrollment, seat reservation, CRM update, admission approval, or other official actions are completed.",
    "Treat confirmed preferences as counseling-only unless the response plan requires handoff.",
])

SEMANTIC_PROMPT = (
    "Extract SemanticDeltaResult. It is an untrusted proposal, not truth. "
    "currentTruthBeforeTurn is read-only context for interpreting the new student message. "
    "Do not re-emit existing memory as a new delta unless the student restates, corrects, rejects, or changes it. "
    "Do not output platform metadata, CRM truth, or official application, registration, payment, enrollment, or seat truth."
)


class AISemanticDeltaExtractor:
    provider = "gemini"

    def __init__(self, settings: Settings | None = None, agent: Agent | Any | None = None) -> None:
        self.settings = settings or get_settings()
        self.model = self.settings.model_name
        self.agent = agent

    async def extract(self, turn_input: TurnInput | JsonObject) -> SemanticDeltaResult:
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required for semantic extraction")
        agent = self.agent or Agent(self.settings.pydantic_ai_model, system_prompt=SEMANTIC_PROMPT, output_type=SemanticDeltaResult)
        result = await agent.run(json.dumps(semantic_delta_input(turn_input), indent=2))
        return result.output if isinstance(result.output, SemanticDeltaResult) else SemanticDeltaResult.model_validate(result.output)


class AIExecutionClient:
    provider = "gemini"

    def __init__(self, settings: Settings | None = None, agent: Agent | Any | None = None) -> None:
        self.settings = settings or get_settings()
        self.model = self.settings.model_name
        self.agent = agent

    async def execute(self, execution_context: ExecutionContext | JsonObject) -> AIExecutionResult:
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required for execution")
        agent = self.agent or Agent(self.settings.pydantic_ai_model, system_prompt=SYSTEM_PROMPT, output_type=AIExecutionResult)
        result = await agent.run(build_response_prompt(execution_context))
        return result.output if isinstance(result.output, AIExecutionResult) else AIExecutionResult.model_validate(result.output)


def semantic_delta_input(turn_input: TurnInput | JsonObject) -> JsonObject:
    return {key: value for key, value in turn_input.items() if key not in {"conversationId", "turnId", "messageId", "previousRuntimeState"}}


def build_response_prompt(context: ExecutionContext | JsonObject) -> str:
    sections: list[str | None] = [
        section("Student Message", context.get("studentMessage") or ""),
        section("Conversation Context", context.get("conversationContext") or "No prior messages."),
        section("Current Truth", context.get("currentTruth")),
        section("Active Route Episode", context.get("activeRouteEpisode")),
        section("Response Plan", context.get("responsePlan")),
        section("Runtime Skill", {
            "name": (context.get("skill") or {}).get("name"),
            "version": (context.get("skill") or {}).get("version"),
            "instructions": (context.get("skill") or {}).get("body") or "No skill body available.",
        }),
        section("Knowledge Context", context.get("knowledge")) if context.get("knowledge") else None,
        section("Retry Instruction", context.get("responseRetry")) if context.get("responseRetry") else None,
        "Produce the structured response now.",
    ]
    return "\n\n".join(item for item in sections if item)


def section(title: str, value: object) -> str:
    content = value if isinstance(value, str) else json.dumps(jsonable(value or {}), indent=2)
    return f"## {title}\n{content}"
