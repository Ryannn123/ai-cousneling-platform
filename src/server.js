import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path"; 
import { CounselingTurnOrchestrator } from "./runtime/counselingTurnOrchestrator.js";
import { ACTIONS, COUNSELING_ACTIONS, READINESS, ROUTE_OUTCOMES, ROUTE_PROGRESS_STATES, ROUTE_TYPES, STATES } from "./runtime/constants.js";

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(process.cwd(), "public");
const orchestrator = new CounselingTurnOrchestrator();

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/conversations") {
      return json(res, await orchestrator.createConversation());
    }

    if (req.method === "POST" && req.url === "/api/turn") {
      const body = await parseJson(req);
      return json(res, await orchestrator.handleTurn(body));
    }

    if (req.method === "GET" && req.url?.startsWith("/api/conversations/")) {
      const conversationId = decodeURIComponent(req.url.split("/").pop());
      const conversation = await orchestrator.getConversation(conversationId);
      if (!conversation) return json(res, { error: "Conversation not found" }, 404);
      return json(res, conversation);
    }

    if (req.method === "GET" && req.url === "/api/skills") {
      return json(res, await orchestrator.getSkills());
    }

    if (req.method === "GET" && req.url === "/api/labels") {
      return json(res, {
        states: STATES,
        actions: { ...ACTIONS, ...COUNSELING_ACTIONS },
        readiness: READINESS,
        routes: ROUTE_TYPES,
        progressStates: ROUTE_PROGRESS_STATES,
        routeOutcomes: ROUTE_OUTCOMES
      });
    }

    if (req.method === "GET") {
      return serveStatic(req, res);
    }

    return json(res, { error: "Not found" }, 404);
  } catch (error) {
    return json(res, { error: error.message }, error.statusCode || 500);
  }
});

server.listen(PORT, () => {
  console.log(`Bounded counseling prototype listening on http://localhost:${PORT}`);
});

async function parseJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function json(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload, null, 2));
}

async function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestPath));
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    return json(res, { error: "Not found" }, 404);
  }
  const ext = path.extname(filePath);
  const type = ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "text/html";
  res.writeHead(200, { "Content-Type": type });
  res.end(await readFile(filePath));
}
