import { mkdir, readFile, readdir, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data", "runtime");
export const CONVERSATION_DIR = path.join(DATA_DIR, "conversations");
export const AUDIT_PATH = path.join(DATA_DIR, "audit.ndjson");
export const MEMORY_EVENTS_PATH = path.join(DATA_DIR, "memory-events.ndjson");

export async function ensureRuntimeDirs() {
  await mkdir(CONVERSATION_DIR, { recursive: true });
}

export function conversationPath(conversationId) {
  return path.join(CONVERSATION_DIR, `${conversationId}.json`);
}

export async function readJson(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function appendNdjson(filePath, event) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readNdjson(filePath) {
  if (!existsSync(filePath)) return [];
  const raw = (await readFile(filePath, "utf8")).trim();
  if (!raw) return [];
  return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

export async function readAuditEvents(conversationId, limit = 50) {
  return (await readNdjson(AUDIT_PATH))
    .filter((event) => event.conversationId === conversationId)
    .slice(-limit);
}

export async function listDirectories(parentPath) {
  const entries = await readdir(parentPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(parentPath, entry.name));
}
