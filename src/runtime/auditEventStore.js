import crypto from "node:crypto";
import { appendNdjson, AUDIT_PATH, readNdjson } from "./fileStore.js";

export class AuditEventStore {
  constructor(auditPath = AUDIT_PATH) {
    this.auditPath = auditPath;
  }

  async appendAuditEvent({ event, idempotencyKey }) {
    const records = await readNdjson(this.auditPath);
    if (idempotencyKey) {
      const duplicate = records.find((record) => record.idempotencyKey === idempotencyKey);
      if (duplicate) return { status: "already_exists", auditEventId: duplicate.auditEventId };
    }

    const auditEvent = {
      auditEventId: event.auditEventId || crypto.randomUUID(),
      createdAt: event.createdAt || new Date().toISOString(),
      ...event,
      ...(idempotencyKey ? { idempotencyKey } : {})
    };
    await appendNdjson(this.auditPath, auditEvent);
    return { status: "appended", auditEventId: auditEvent.auditEventId };
  }

  async getAuditEventsForTurn({ conversationId, turnId }) {
    return (await readNdjson(this.auditPath))
      .filter((event) => event.conversationId === conversationId && event.turnId === turnId);
  }

  async getAuditEventsForStudent({ studentId, eventTypes, limit = 50 }) {
    const typeSet = eventTypes?.length ? new Set(eventTypes) : null;
    return (await readNdjson(this.auditPath))
      .filter((event) => !studentId || event.studentId === studentId)
      .filter((event) => !typeSet || typeSet.has(event.eventType))
      .slice(-limit);
  }

  async getAuditEventsByCorrelation(correlation = {}) {
    const entries = Object.entries(correlation).filter(([, value]) => value);
    return (await readNdjson(this.auditPath))
      .filter((event) => entries.every(([key, value]) => event.correlation?.[key] === value));
  }
}
