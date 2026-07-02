# Repository Guidelines

## Project Structure & Module Organization

This is a Node.js ESM prototype for a bounded autonomous counseling runtime. The HTTP entry point is `src/server.js`, which serves the browser UI from `public/` and exposes API endpoints under `/api`. Runtime services live in `src/runtime/`, including boundary checks, skill control, validation, audit writing, and orchestration. Runtime skills are Markdown artifacts in `skills/*/SKILL.md`; keep their front matter complete and use `status: approved` for loadable skills. Seed knowledge and runtime logs live under `data/`, while product and phase notes live in `specs/`. Tests are in `test/`.

## Build, Test, and Development Commands

- `npm start`: run the server with `.env` loaded via `node --env-file=.env src/server.js`.
- `npm run dev`: run the server in Node watch mode for local iteration.
- `npm test`: run all tests with Node's built-in test runner.

The app expects Node `>=22`. By default the server listens on `http://localhost:3000`; override with `PORT=...` in `.env`.

## Coding Style & Naming Conventions

Use modern JavaScript modules with explicit `.js` imports. Match the existing style: two-space indentation, double quotes, semicolons, and `camelCase` for variables and functions. Runtime classes use `PascalCase` and are exported by name, for example `BoundaryEngine` or `CounselingTurnOrchestrator`. Keep runtime modules focused on one responsibility and prefer Node standard-library APIs before adding dependencies.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`. Add coverage in `test/runtime.test.js` or a new `*.test.js` file under `test/` when behavior changes. Name tests by the behavior being protected, such as `official-action wording variants hand off instead of continuing counseling`. Include both happy paths and safety boundaries for counseling state, skill selection, output validation, and provider fallbacks.

## Security & Configuration Tips

Keep secrets in `.env` and do not commit API keys or generated runtime logs containing sensitive conversation data. Validate any new memory or recommendation output through `ValidationPipeline` before committing it to runtime state. Official actions such as registration, payment, enrollment, reservation, or application submission must remain red-zone handoff behavior.

## Agent-Specific Instructions

### Think Before Coding

Do not assume or hide confusion. Before implementing, state assumptions explicitly. If multiple interpretations exist, present them instead of picking silently. If a simpler approach exists, say so and push back when warranted. If something is unclear, stop, name the confusion, and ask.

### Simplicity First

Use the minimum code that solves the problem. Do not add features beyond what was asked, abstractions for single-use code, speculative flexibility, or error handling for impossible scenarios. If a solution is much longer than it needs to be, rewrite it smaller.

### Surgical Changes

Touch only what the request requires. Do not improve adjacent code, comments, or formatting. Match existing style, even when another style might be preferable. Remove only imports, variables, functions, or files made unused by your own changes. Mention unrelated dead code instead of deleting it.

### Goal-Driven Execution

Turn tasks into verifiable goals and loop until checked. For multi-step tasks, state a brief plan with verification for each step, for example:

```text
1. Add validation -> verify: invalid-input test fails first
2. Implement fix -> verify: targeted test passes
3. Run suite -> verify: npm test passes
```

These guidelines are working when diffs stay small, rewrites from overcomplication decrease, and clarifying questions come before implementation mistakes.
