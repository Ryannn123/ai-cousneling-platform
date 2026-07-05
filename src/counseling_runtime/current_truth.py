from __future__ import annotations

from .current_truth_derive import CurrentTruthDeriver
from .current_truth_draft import CurrentTruthDraft
from .current_truth_normalize import CurrentTruthNormalizer
from .current_truth_schema import CurrentTruthProjection
from .memory_validation import DurableMemoryEvent


class CurrentTruthProjector:
    def __init__(
        self,
        normalizer: CurrentTruthNormalizer | None = None,
        deriver: CurrentTruthDeriver | None = None,
    ) -> None:
        self.normalizer = normalizer or CurrentTruthNormalizer()
        self.deriver = deriver or CurrentTruthDeriver()

    def project(self, student_id: str, events: list[DurableMemoryEvent]) -> CurrentTruthProjection:
        draft = CurrentTruthDraft.empty(student_id, events)
        for fact in self.normalizer.facts_from_events(events):
            draft.apply(fact)
        return self.deriver.derive(draft)
