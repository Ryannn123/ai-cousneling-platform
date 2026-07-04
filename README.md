# Bounded Autonomous Counseling Prototype

Typed Python prototype for a bounded autonomous counseling runtime.

## Commands

- Run the app: `uv run uvicorn counseling_runtime.api.app:app --host 0.0.0.0 --port 3000`
- Run tests: `uv run pytest`

The app serves the existing browser UI from `public/` and exposes API endpoints under `/api`.

## Configuration

Use `.env` for local secrets:

```text
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=3000
```

Gemini is the only live LLM provider. Runtime skills stay in `skills/`, seed catalog data stays in `data/knowledge/`, and runtime JSON/NDJSON files stay under `data/runtime/`.
