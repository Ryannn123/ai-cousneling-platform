from __future__ import annotations

import re


OFFICIAL_TRUTH_PATTERN = re.compile(
    r"\b(application submitted|registration completed|registered|payment confirmed|paid|seat reserved|crm updated|crm status updated|enrollment confirmed|enrolled|scholarship approved|eligibility approved|exception approved|official document submitted)\b",
    re.I,
)
OFFICIAL_COMPLETION_LANGUAGE = re.compile(
    r"\b(application submitted|registered you|registration completed|seat reserved|payment confirmed|enrollment confirmed|updated crm)\b",
    re.I,
)
OLD_MINIMUM_PROFILE_LANGUAGE = re.compile(
    r"\b(prestige/ranking|ranking.*budget|budget.*location|preferred study location)\b",
    re.I,
)
NON_OFFICIAL_LANGUAGE = re.compile(
    r"\bnot (an|official)|does not submit|does not register|not application|not.*registration|not.*payment|not.*seat|not.*crm",
    re.I,
)
ROUTE_COMPLETION_LANGUAGE = re.compile(
    r"\b(route is complete|completed the route|we are done with this route|final choice is locked)\b",
    re.I,
)
EXPLICIT_COUNSELING_CHOICE_LANGUAGE = re.compile(
    r"\b(my choice|choose|chosen|let'?s go with)\b",
    re.I,
)


def contains_official_truth(value: object) -> bool:
    return bool(OFFICIAL_TRUTH_PATTERN.search(str(value)))


def claims_official_completion(text: str) -> bool:
    return bool(OFFICIAL_COMPLETION_LANGUAGE.search(text))


def contains_old_minimum_profile_language(text: str) -> bool:
    return bool(OLD_MINIMUM_PROFILE_LANGUAGE.search(text))


def contains_non_official_clarification(text: str) -> bool:
    return bool(NON_OFFICIAL_LANGUAGE.search(text))


def claims_route_completion(text: str) -> bool:
    return bool(ROUTE_COMPLETION_LANGUAGE.search(text))


def has_explicit_counseling_choice(text: str) -> bool:
    return bool(EXPLICIT_COUNSELING_CHOICE_LANGUAGE.search(text))
