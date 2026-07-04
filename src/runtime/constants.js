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

export const ROUTE_TYPES = {
  initial_route_selection: "Initial Route Selection",
  course_exploration: "Course Exploration",
  university_exploration: "University Exploration",
  course_exploration_within_university_context: "Course Exploration Within University Context",
  pathway_exploration: "Pathway Exploration",
  combined_option_validation: "Combined Option Validation",
  handoff_preparation: "Handoff Preparation"
};

export const ROUTE_PROGRESS_STATES = {
  opening: "Opening",
  exploration: "Exploration",
  recommendation_ready: "Recommendation Ready",
  recommendation_presented: "Recommendation Presented",
  comparison: "Comparison",
  decision_support: "Decision Support",
  confirmed_preference: "Confirmed Preference",
  deferral_indecision: "Deferral / Indecision",
  detour_resume: "Detour / Resume",
  handoff: "Handoff",
  completed: "Completed"
};

export const ROUTE_OUTCOMES = {
  confirmed_preference: "Confirmed Preference",
  accepted_fallback: "Accepted Fallback",
  deferred_decision: "Deferred Decision",
  student_switched_route: "Student Switched Route",
  blocked_by_boundary: "Blocked By Boundary",
  handoff_required: "Handoff Required"
};

export const ROUTE_TRANSITION_PRIORITIES = {
  boundary_override: "Boundary Override",
  human_support_request: "Human Support Request",
  student_led_route_switch: "Student-Led Route Switch",
  active_route_outcome_reached: "Active Route Outcome Reached",
  detour_resume: "Detour / Resume",
  loop_risk_or_deferral: "Loop Risk / Deferral",
  continue_active_route: "Continue Active Route",
  initial_route_selection: "Initial Route Selection"
};

export const COUNSELING_ACTIONS = {
  orient_initial_route: "Orient Initial Route",
  explore_route: "Explore Route",
  answer_detour: "Answer Detour",
  recommend_directionally: "Recommend Directionally",
  compare_shortlist: "Compare / Shortlist",
  clarify_ambiguity: "Clarify Ambiguity",
  confirm_counseling_preference: "Confirm Counseling Preference",
  support_decision: "Support Decision",
  prepare_handoff: "Prepare Handoff"
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
  currentZone: "green",
  activeRouteEpisode: {
    routeType: "initial_route_selection",
    routeGoal: "Identify the first useful counseling route.",
    progressState: "opening",
    transitionDecision: {
      decision: "continue_active_route",
      priority: "initial_route_selection",
      activeRoute: "initial_route_selection",
      progressState: "opening",
      evidence: [],
      requiresValidation: false,
      auditReason: "Default opening route."
    },
    recommendationReadiness: "R1",
    preferenceStrength: "none",
    activeDirections: {},
    routeConstraints: [],
    decisionBlockers: [],
    source: {
      derivedFromCurrentTruth: false,
      usedAcceptedSemanticDelta: false,
      usedPriorOperatingContext: false,
      usedBoundaryResult: false,
      usedRouteOutcomeHistory: false
    }
  },
  primaryCounselingAction: "orient_initial_route",
  recommendationReadiness: "R1",
  preferenceStrength: "none",
  handoffStatus: "none",
  studentPosture: "just_browsing",
  counselorResponseMode: "reassuring_orientation",
  decisionSupportMode: null,
  summaryCheckpointStatus: "not_required",
  milestoneConfirmationStatus: "not_applicable",
  nextBestCounselingMove: "Identify the first useful counseling route.",
  validationRequirements: []
};
