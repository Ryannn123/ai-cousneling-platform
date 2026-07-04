from __future__ import annotations

from pathlib import Path

from .contracts import JsonObject, KnowledgeAnswer
from .settings import CATALOG_PATH
from .storage import read_json


class KnowledgeGateway:
    def __init__(self, catalog_path: Path = CATALOG_PATH) -> None:
        self.catalog_path = catalog_path

    def needs_knowledge(self, student_message: str) -> bool:
        return False

    def answer(self, student_message: str, accepted_semantic_delta: JsonObject | None = None) -> KnowledgeAnswer | None:
        signals = [
            signal for signal in (accepted_semantic_delta or {}).get("acceptedRuntimeOnlySignals", [])
            if signal.get("kind") == "knowledge_need"
        ]
        if not signals:
            return None
        catalog = read_json(self.catalog_path, {"programs": []})
        text = f"{student_message or ''} {' '.join(signal.get('query', '') for signal in signals)}".lower()
        matches = []
        for program in catalog.get("programs", []):
            haystack = f"{program.get('program')} {program.get('university')} {program.get('location')}".lower()
            if any(len(word) > 3 and word in text for word in haystack.split()):
                matches.append(program)

        if not matches:
            return KnowledgeAnswer.model_validate({
                "answerable": False,
                "facts": [],
                "caveat": "I do not have a verified catalog fact for that specific question in this prototype.",
                "sources": [],
                "uncertaintyLevel": "decision_critical",
            })

        facts = [
            {
                "program": item.get("program"),
                "university": item.get("university"),
                "location": item.get("location"),
                "annualFeeMyr": item.get("annualFeeMyr"),
                "pathwayDuration": item.get("pathwayDuration"),
                "rankingBand": item.get("rankingBand"),
                "source": "seed-demo-catalog",
            }
            for item in matches[:3]
        ]
        return KnowledgeAnswer.model_validate({
            "answerable": True,
            "facts": facts,
            "caveat": "These are seed demo facts for prototype counseling, not official university confirmation.",
            "sources": [{"type": "seed_catalog", "label": f"{fact['university']} {fact['program']}"} for fact in facts],
            "uncertaintyLevel": "decision_critical" if any(signal.get("decisionCriticality") == "decision_critical" for signal in signals) else "minor",
        })
