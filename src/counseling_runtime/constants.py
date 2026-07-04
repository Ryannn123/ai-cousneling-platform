from __future__ import annotations

from copy import deepcopy


READINESS = {
    "R1": "Not Ready to Recommend",
    "R2": "Ready for Directional Recommendation",
    "R3": "Ready for High-Quality Recommendation",
}

ROUTE_TYPES = {
    "initial_route_selection": "Initial Route Selection",
    "course_exploration": "Course Exploration",
    "university_exploration": "University Exploration",
    "course_exploration_within_university_context": "Course Exploration Within University Context",
    "pathway_exploration": "Pathway Exploration",
    "combined_option_validation": "Combined Option Validation",
    "handoff_preparation": "Handoff Preparation",
}

ROUTE_PROGRESS_STATES = {
    "opening": "Opening",
    "exploration": "Exploration",
    "recommendation_ready": "Recommendation Ready",
    "recommendation_presented": "Recommendation Presented",
    "comparison": "Comparison",
    "decision_support": "Decision Support",
    "confirmed_preference": "Confirmed Preference",
    "deferral_indecision": "Deferral / Indecision",
    "detour_resume": "Detour / Resume",
    "handoff": "Handoff",
    "completed": "Completed",
}

ROUTE_OUTCOMES = {
    "confirmed_preference": "Confirmed Preference",
    "accepted_fallback": "Accepted Fallback",
    "deferred_decision": "Deferred Decision",
    "student_switched_route": "Student Switched Route",
    "blocked_by_boundary": "Blocked By Boundary",
    "handoff_required": "Handoff Required",
}

COUNSELING_ACTIONS = {
    "orient_initial_route": "Orient Initial Route",
    "explore_route": "Explore Route",
    "answer_detour": "Answer Detour",
    "recommend_directionally": "Recommend Directionally",
    "compare_shortlist": "Compare / Shortlist",
    "clarify_ambiguity": "Clarify Ambiguity",
    "confirm_counseling_preference": "Confirm Counseling Preference",
    "support_decision": "Support Decision",
    "prepare_handoff": "Prepare Handoff",
}

MANDATORY_BOUNDARY_RULES = [
    "no-official-action-boundary",
    "ready-to-register-detection",
    "ambiguous-proceed-clarification",
    "preference-promotion-boundary",
    "internal-only-knowledge-boundary",
]

OFFICIAL_ACTION_OUTPUTS = {
    "application_submitted",
    "registration_completed",
    "enrollment_confirmed",
    "payment_confirmed",
    "seat_reserved",
    "crm_status_updated",
}

DEFAULT_CONTEXT = {
    "currentZone": "green",
    "activeRouteEpisode": {
        "routeType": "initial_route_selection",
        "routeGoal": "Identify the first useful counseling route.",
        "progressState": "opening",
        "transitionDecision": {
            "decision": "continue_active_route",
            "priority": "initial_route_selection",
            "activeRoute": "initial_route_selection",
            "progressState": "opening",
            "evidence": [],
            "requiresValidation": False,
            "auditReason": "Default opening route.",
        },
        "recommendationReadiness": "R1",
        "preferenceStrength": "none",
        "activeDirections": {},
        "routeConstraints": [],
        "decisionBlockers": [],
        "source": {
            "derivedFromCurrentTruth": False,
            "usedAcceptedSemanticDelta": False,
            "usedPriorOperatingContext": False,
            "usedBoundaryResult": False,
            "usedRouteOutcomeHistory": False,
        },
    },
    "primaryCounselingAction": "orient_initial_route",
    "recommendationReadiness": "R1",
    "preferenceStrength": "none",
    "handoffStatus": "none",
    "studentPosture": "just_browsing",
    "counselorResponseMode": "reassuring_orientation",
    "decisionSupportMode": None,
    "summaryCheckpointStatus": "not_required",
    "milestoneConfirmationStatus": "not_applicable",
    "nextBestCounselingMove": "Identify the first useful counseling route.",
    "validationRequirements": [],
}


def default_context() -> dict:
    return deepcopy(DEFAULT_CONTEXT)
