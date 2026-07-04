import crypto from "node:crypto";
import { conversationPath, readJson, writeJson } from "./fileStore.js";
import { DEFAULT_CONTEXT } from "./constants.js";

export async function createConversation() {
  const conversationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const state = newConversationState(conversationId, now);
  await writeJson(conversationPath(conversationId), state);
  return state;
}

export async function loadConversation(conversationId) {
  return readJson(conversationPath(conversationId));
}

export async function commitTurn({ conversationId, studentMessage, previousState, operatingContext, validationResult, currentTruth }) {
  const now = new Date().toISOString();
  const state = previousState || newConversationState(conversationId, now);
  const committedContext = operatingContext;

  state.updatedAt = now;
  state.operatingContext = committedContext;
  state.currentTruth = currentTruth;
  state.routeOutcomeOutputs ||= [];
  delete state.memoryOutputs;
  state.messages.push({ role: "student", content: studentMessage, timestamp: now });
  state.messages.push({ role: "assistant", content: validationResult.finalResponse, timestamp: now });

  const recommendationIds = appendOutputs(state.recommendationOutputs, validationResult.acceptedOutputs.recommendationOutputs, now);
  const routeOutcomeIds = appendOutputs(state.routeOutcomeOutputs, arrayOf(validationResult.acceptedOutputs.routeOutcomeOutput), now);

  if (validationResult.acceptedOutputs.handoffOutput?.required) {
    state.handoff = { ...validationResult.acceptedOutputs.handoffOutput, timestamp: now };
  }

  state.blockedOutputs.push(...validationResult.blockedOutputs.map((item) => ({ ...item, timestamp: now })));
  await writeJson(conversationPath(conversationId), state);

  return {
    committedContext,
    committedRecommendationOutputIds: recommendationIds,
    committedRouteOutcomeOutputIds: routeOutcomeIds,
    handoffPrepared: Boolean(state.handoff),
    blockedOutputCount: validationResult.blockedOutputs.length
  };
}

function newConversationState(conversationId, now) {
  return {
    conversationId,
    createdAt: now,
    updatedAt: now,
    operatingContext: DEFAULT_CONTEXT,
    currentTruth: null,
    messages: [],
    recommendationOutputs: [],
    routeOutcomeOutputs: [],
    handoff: null,
    blockedOutputs: []
  };
}

function appendOutputs(target, outputs, timestamp) {
  return outputs.map((output) => {
    const id = crypto.randomUUID();
    target.push({ id, ...output, timestamp });
    return id;
  });
}

function arrayOf(value) {
  return value ? [value] : [];
}
