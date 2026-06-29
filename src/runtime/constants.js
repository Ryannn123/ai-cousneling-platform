export const STATES = {
  S1: "First Contact / Profile Incomplete",
  S2: "Minimum Profile Reached",
  S3: "Exploration Mode",
  S4: "Recommendation-Ready",
  S5: "Shortlist / Comparison",
  S6: "Confirmed Counseling Preference",
  S7: "Ready-to-Register / Apply Handoff",
  S8: "Deferral or Indecision",
  S9: "Detour and Resume"
};

export const ACTIONS = {
  A1: "Greet / Orient",
  A2: "Collect Minimum Profile",
  A3: "Explore Interest",
  A4: "Explain Option",
  A5: "Answer Factual Detour",
  A6: "Recommend",
  A7: "Compare / Shortlist",
  A8: "Clarify Ambiguity",
  A9: "Confirm Counseling Preference",
  A10: "Support Deferral / Indecision",
  A11: "Detect Boundary",
  A12: "Prepare Handoff"
};

export const READINESS = {
  R1: "Not Ready to Recommend",
  R2: "Ready for Directional Recommendation",
  R3: "Ready for High-Quality Recommendation"
};

export const MANDATORY_BOUNDARY_RULES = [
  "no-official-action-boundary",
  "ready-to-register-detection",
  "ambiguous-proceed-clarification",
  "preference-promotion-boundary",
  "internal-only-knowledge-boundary"
];

export const OFFICIAL_ACTION_OUTPUTS = new Set([
  "application_submitted",
  "registration_completed",
  "enrollment_confirmed",
  "payment_confirmed",
  "seat_reserved",
  "crm_status_updated"
]);

export const DEFAULT_CONTEXT = {
  currentMainState: "S1",
  currentZone: "green",
  primaryCounselingAction: "A1",
  profileCompleteness: "incomplete",
  minimumProfileRoute: "collect_academic_result",
  recommendationReadiness: "R1",
  handoffStatus: "none",
  studentPosture: "just_browsing",
  counselorResponseMode: "reassuring_orientation",
  decisionSupportMode: null,
  summaryCheckpointStatus: "not_required",
  milestoneConfirmationStatus: "not_applicable",
  nextBestCounselingMove: "Collect academic result plus course and university direction status."
};
