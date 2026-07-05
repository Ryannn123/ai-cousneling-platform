# Repository Guidelines

## Project Structure & Module Organization

This is a typed Python prototype for a bounded autonomous counseling runtime. The FastAPI entry point is `src/counseling_runtime/api/app.py`, which serves the browser UI from `public/` and exposes API endpoints under `/api`. Runtime services live in `src/counseling_runtime/`, including boundary checks, skill control, validation, audit writing, memory, knowledge loading, LLM integration, and orchestration. Runtime skills are Markdown artifacts in `skills/*/SKILL.md`; keep their front matter complete and use `status: approved` for loadable skills. Seed catalog data lives in `data/knowledge/`, runtime JSON/NDJSON logs live under `data/runtime/`, and product and phase notes live in `specs/`. Tests are in `tests/`.

## Build, Test, and Development Commands

- `uv run uvicorn counseling_runtime.api.app:app --host 0.0.0.0 --port 3000`: run the FastAPI server.
- `uv run uvicorn counseling_runtime.api.app:app --host 0.0.0.0 --port 3000 --reload`: run the server with reload for local iteration.
- `uv run pytest`: run all tests.
- `uv run pyright`: run static type checking.

The app expects Python `>=3.12` and uses `uv` for dependency management. By default the server listens on `http://localhost:3000`; override the port in the uvicorn command or with `PORT=...` in `.env` where supported by runtime settings.

## Coding Style & Naming Conventions

Use modern typed Python. Match the existing style: four-space indentation, explicit type hints on public interfaces, `snake_case` for variables and functions, and `PascalCase` for classes and Pydantic models. Runtime classes use clear responsibility names, for example `BoundaryEngine` or `CounselingTurnOrchestrator`. Keep runtime modules focused on one responsibility and prefer Python standard-library APIs before adding dependencies.

## Testing Guidelines

Tests use `pytest` with `pytest-asyncio` for async behavior. Add coverage in `tests/test_runtime.py` or a new `test_*.py` file under `tests/` when behavior changes. Name tests by the behavior being protected, such as `test_official_action_wording_variants_hand_off_instead_of_continuing_counseling`. Include both happy paths and safety boundaries for counseling state, skill selection, output validation, and provider fallbacks.

## Security & Configuration Tips

Keep secrets in `.env` and do not commit API keys or generated runtime logs containing sensitive conversation data. Gemini is the live LLM provider; configure it with `GEMINI_API_KEY` and `GEMINI_MODEL`. Validate any new memory or recommendation output through `ValidationPipeline` before committing it to runtime state. Official actions such as registration, payment, enrollment, reservation, or application submission must remain red-zone handoff behavior.

## Agent-Specific Instructions

### Think Before Coding

Do not assume or hide confusion. Before implementing, state assumptions explicitly. If multiple interpretations exist, present them instead of picking silently. If a simpler approach exists, say so and push back when warranted. If something is unclear, stop, name the confusion, and ask.

### Simplicity First

Use the minimum code that solves the problem. Do not add features beyond what was asked, abstractions for single-use code, speculative flexibility, or error handling for impossible scenarios. If a solution is much longer than it needs to be, rewrite it smaller.

### Surgical Changes

Touch only what the request requires. Do not improve adjacent code, comments, or formatting. Match existing style, even when another style might be preferable. Remove only imports, variables, functions, or files made unused by your own changes. Mention unrelated dead code instead of deleting it.

### Refactoring

When refactoring code, optimize for the new design directly. Do not leave legacy compatibility paths, aliases, wrappers, duplicate APIs, or fallback behavior solely to preserve the pre-refactor implementation.

### Goal-Driven Execution

Turn tasks into verifiable goals and loop until checked. For multi-step tasks, state a brief plan with verification for each step, for example:

```text
1. Add validation -> verify: invalid-input test fails first
2. Implement fix -> verify: targeted test passes
3. Run suite -> verify: npm test passes
```

These guidelines are working when diffs stay small, rewrites from overcomplication decrease, and clarifying questions come before implementation mistakes.
