import { appendNdjson, MEMORY_EVENTS_PATH, readNdjson } from "./fileStore.js";

export class MemoryEventStore {
  constructor(memoryEventsPath = MEMORY_EVENTS_PATH) {
    this.memoryEventsPath = memoryEventsPath;
  }

  async appendValidatedEvent({ event, idempotencyKey }) {
    if (!event?.validation?.validated) {
      return { status: "rejected_not_validated", reasons: ["event_not_validated"] };
    }

    const records = await this.readRecords();
    const duplicate = records.find((record) => record.idempotencyKey === idempotencyKey);
    if (duplicate) {
      return {
        status: "already_exists",
        existingEventId: duplicate.event.eventId,
        reasons: ["duplicate_idempotency_key"]
      };
    }

    await appendNdjson(this.memoryEventsPath, { idempotencyKey, event });
    return { status: "appended", eventId: event.eventId, reasons: [] };
  }

  async getEventsForProjection({ studentId, categories } = {}) {
    const categorySet = categories?.length ? new Set(categories) : null;
    return (await this.readEvents())
      .filter((event) => !studentId || event.studentId === studentId)
      .filter((event) => !categorySet || categorySet.has(event.category))
      .sort(compareEvents);
  }

  async getEventById(eventId) {
    return (await this.readEvents()).find((event) => event.eventId === eventId) || null;
  }

  async getEventsByTurn({ studentId, turnId }) {
    return (await this.readEvents())
      .filter((event) => event.studentId === studentId && event.turnId === turnId)
      .sort(compareEvents);
  }

  async getEventsByAcceptedSemanticDelta({ acceptedSemanticDeltaId }) {
    return (await this.readEvents())
      .filter((event) => event.source?.acceptedSemanticDeltaId === acceptedSemanticDeltaId)
      .sort(compareEvents);
  }

  async readEvents() {
    return (await this.readRecords()).map((record) => record.event || record);
  }

  async readRecords() {
    return readNdjson(this.memoryEventsPath);
  }
}

function compareEvents(a, b) {
  return String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.eventId).localeCompare(String(b.eventId));
}
