import { mkdir, readFile, readdir, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data", "runtime");
export const CONVERSATION_DIR = path.join(DATA_DIR, "conversations");
export const AUDIT_PATH = path.join(DATA_DIR, "audit.ndjson");

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

export async function readAuditEvents(conversationId, limit = 50) {
  if (!existsSync(AUDIT_PATH)) return [];
  const lines = (await readFile(AUDIT_PATH, "utf8")).trim().split(/\r?\n/).filter(Boolean);
  return lines
    .map((line) => JSON.parse(line))
    .filter((event) => event.conversationId === conversationId)
    .slice(-limit);
}

export async function listDirectories(parentPath) {
  const entries = await readdir(parentPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(parentPath, entry.name));
}
