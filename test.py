from pprint import pprint
import asyncio
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import Literal
from dotenv import load_dotenv

from counseling_runtime.llm import AISemanticDeltaExtractor
from counseling_runtime.semantic_delta import SemanticDeltaValidator
from counseling_runtime.schemas import SemanticDeltaResult, MemoryDeltaCandidates, FlowDrivingDeltas, DirectionDelta, Evidence
from counseling_runtime.memory_ingestion import MemoryIngestionPolicy

load_dotenv()

async def run():
    turn_input = {
        'studentMessage': 'i perhaps maybe confirm study business'
    }
    extractor = AISemanticDeltaExtractor()
    # delta_result = await extractor.extract(turn_input)
    # pprint(result.model_dump())
    
    delta_result = SemanticDeltaResult(
        memoryDeltaCandidates=MemoryDeltaCandidates(
            flowDrivingDeltas=FlowDrivingDeltas(
                coursesConsidering=[DirectionDelta(
                    confidence='high',
                    evidence=[Evidence(quote='a')],
                    operation='add_new',
                    status='considering',
                    value='a'
                )],
                confirmedCounselingCoursePreferences=DirectionDelta(
                    confidence='low',
                    evidence=[Evidence(quote='a')],
                    operation='add_new',
                    status='confirmed_counseling_preference',
                    value='a'
                )
            )
        )
    )
    validator = SemanticDeltaValidator()
    validated_delta = validator.validate(delta_result, turn_input, extractor)
    
    memory_ingestor = MemoryIngestionPolicy()
    decisions = memory_ingestor.pre_response_decisions('a', validated_delta)
    pprint(validated_delta.to_json_dict())
    pprint(decisions)
    
asyncio.run(run())