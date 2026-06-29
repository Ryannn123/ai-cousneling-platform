let conversationId = null;
const labels = await getJson("/api/labels");

const els = {
  conversationId: document.querySelector("#conversationId"),
  messages: document.querySelector("#messages"),
  form: document.querySelector("#turnForm"),
  input: document.querySelector("#studentMessage"),
  newConversation: document.querySelector("#newConversation"),
  zoneBadge: document.querySelector("#zoneBadge"),
  stateValue: document.querySelector("#stateValue"),
  overlayValue: document.querySelector("#overlayValue"),
  actionValue: document.querySelector("#actionValue"),
  readinessValue: document.querySelector("#readinessValue"),
  preferenceValue: document.querySelector("#preferenceValue"),
  handoffValue: document.querySelector("#handoffValue"),
  skillsOutput: document.querySelector("#skillsOutput"),
  acceptedOutput: document.querySelector("#acceptedOutput"),
  acceptedInterpretationOutput: document.querySelector("#acceptedInterpretationOutput"),
  blockedOutput: document.querySelector("#blockedOutput"),
  handoffOutput: document.querySelector("#handoffOutput")
};

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const studentMessage = els.input.value.trim();
  if (!studentMessage || !conversationId) return;
  els.input.value = "";
  addMessage("student", studentMessage);
  setBusy(true);
  try {
    const result = await postJson("/api/turn", { conversationId, studentMessage });
    addMessage("assistant", result.finalResponse);
    renderDebug(result);
  } catch (error) {
    addMessage("assistant", `Error: ${error.message}`);
  } finally {
    setBusy(false);
  }
});

els.newConversation.addEventListener("click", startConversation);

await startConversation();

async function getJson(url) {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

async function startConversation() {
  setBusy(true);
  const conversation = await postJson("/api/conversations", {});
  conversationId = conversation.conversationId;
  els.conversationId.textContent = conversationId;
  els.messages.replaceChildren();
  addMessage("assistant", "Hi, I can help you explore study options. Tell me your results, preferred location, and whether you care more about ranking/prestige or budget/value.");
  renderContext(conversation.operatingContext);
  setBusy(false);
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

function addMessage(role, content) {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = content;
  els.messages.append(el);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function setBusy(isBusy) {
  els.form.querySelector("button").disabled = isBusy;
  els.newConversation.disabled = isBusy;
}

function renderDebug(result) {
  renderContext(result.operatingContext);
  els.skillsOutput.textContent = JSON.stringify({
    selectedPlaybook: result.skillSelection.selectedPlaybook,
    selectedRuntimeSkill: result.skillSelection.selectedRuntimeSkill,
    loadedBoundaryRules: result.skillSelection.loadedBoundaryRules,
    rejectedCandidates: result.skillSelection.rejectedCandidates
  }, null, 2);
  els.acceptedOutput.textContent = JSON.stringify(result.validationResult.acceptedOutputs, null, 2);
  els.acceptedInterpretationOutput.textContent = JSON.stringify(result.acceptedInterpretation, null, 2);
  els.blockedOutput.textContent = JSON.stringify(result.validationResult.blockedOutputs, null, 2);
  els.handoffOutput.textContent = JSON.stringify(result.runtimeState.handoff, null, 2);
}

function renderContext(context) {
  els.zoneBadge.textContent = context.currentZone;
  els.zoneBadge.className = `badge ${context.currentZone}`;
  els.stateValue.textContent = label(context.currentMainState, labels.states);
  els.overlayValue.textContent = context.overlayState ? label(context.overlayState, labels.states) : "none";
  els.actionValue.textContent = label(context.primaryCounselingAction, labels.actions);
  els.readinessValue.textContent = label(context.recommendationReadiness, labels.readiness);
  els.preferenceValue.textContent = context.preferenceStrength || "none";
  els.handoffValue.textContent = context.handoffStatus;
}

function label(code, names) {
  return names[code] ? `${code} - ${names[code]}` : code;
}
