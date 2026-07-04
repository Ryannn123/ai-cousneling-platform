from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse

from counseling_runtime.constants import COUNSELING_ACTIONS, READINESS, ROUTE_OUTCOMES, ROUTE_PROGRESS_STATES, ROUTE_TYPES
from counseling_runtime.orchestrator import CounselingTurnOrchestrator, RuntimeErrorWithStatus
from counseling_runtime.settings import PUBLIC_DIR


app = FastAPI(title="Bounded Counseling Prototype")
orchestrator = CounselingTurnOrchestrator()


@app.post("/api/conversations")
async def create_conversation() -> dict[str, Any]:
    return orchestrator.create_conversation()


@app.post("/api/turn")
async def handle_turn(body: dict[str, Any]) -> dict[str, Any]:
    return await orchestrator.handle_turn(body)


@app.get("/api/conversations/{conversation_id}", response_model=None)
async def get_conversation(conversation_id: str):
    conversation = orchestrator.get_conversation(conversation_id)
    if not conversation:
        return JSONResponse({"error": "Conversation not found"}, status_code=404)
    return conversation


@app.get("/api/skills")
async def get_skills() -> dict[str, Any]:
    return orchestrator.get_skills()


@app.get("/api/labels")
async def get_labels() -> dict[str, Any]:
    return {"actions": COUNSELING_ACTIONS, "readiness": READINESS, "routes": ROUTE_TYPES, "progressStates": ROUTE_PROGRESS_STATES, "routeOutcomes": ROUTE_OUTCOMES}


@app.exception_handler(RuntimeErrorWithStatus)
async def runtime_error_handler(request: Request, exc: RuntimeErrorWithStatus) -> JSONResponse:
    return JSONResponse({"error": str(exc)}, status_code=exc.status_code)


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse({"error": str(exc)}, status_code=500)


@app.get("/{request_path:path}", response_model=None)
async def serve_static(request_path: str = ""):
    requested = "index.html" if request_path in {"", "/"} else request_path
    public_root = PUBLIC_DIR.resolve()
    path = (PUBLIC_DIR / requested).resolve()
    if public_root not in [path, *path.parents] or not path.exists() or not path.is_file():
        return JSONResponse({"error": "Not found"}, status_code=404)
    media_type = "text/css" if path.suffix == ".css" else "text/javascript" if path.suffix == ".js" else "text/html"
    return FileResponse(path, media_type=media_type)
