const SIGNAL_PATTERNS = [
  {
    type: "ready_to_apply_or_register",
    triggerType: "H1",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    patterns: [/\b(apply now|ready to apply|register me|ready to register|start application|enroll me|enrol me)\b/i]
  },
  {
    type: "official_action_request",
    triggerType: "H2",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    patterns: [/\b(submit my application|submit.*documents?|update.*status|update.*crm|confirm.*registration)\b/i]
  },
  {
    type: "payment_or_seat_request",
    triggerType: "H3",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    patterns: [/\b(pay|payment|deposit|invoice|receipt|reserve.*seat|secure.*intake|confirm.*place|enroll now|enrol now)\b/i]
  },
  {
    type: "exception_or_waiver_request",
    triggerType: "H4",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    patterns: [/\b(exception|appeal|waiver|skip.*requirement|still enter|complex eligibility)\b/i]
  },
  {
    type: "sensitive_context",
    triggerType: "H5",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    patterns: [/\b(visa issue|legal issue|disability|accommodation|financial hardship|medical hardship|guardian consent|confidential document)\b/i]
  },
  {
    type: "human_requested_support",
    triggerType: "H6",
    severityCandidate: "red",
    recommendedBehavior: "handoff",
    patterns: [/\b(human counselor|human counsellor|real person|someone call me|talk to.*human|staff|agent|do not trust ai)\b/i]
  },
  {
    type: "ambiguous_proceed_language",
    severityCandidate: "yellow",
    recommendedBehavior: "clarify_once",
    patterns: [/\b(go ahead|proceed|next step|let'?s do this|continue with (it|this|this option)|move forward)\b/i]
  }
];

export class FastBoundarySignalScanner {
  scan(studentMessage = "") {
    const signals = [];
    for (const group of SIGNAL_PATTERNS) {
      for (const pattern of group.patterns) {
        const match = studentMessage.match(pattern);
        if (!match) continue;
        signals.push({
          type: group.type,
          triggerType: group.triggerType,
          matchedText: match[0],
          severityCandidate: group.severityCandidate,
          recommendedBehavior: group.recommendedBehavior
        });
        break;
      }
    }
    return signals;
  }
}
