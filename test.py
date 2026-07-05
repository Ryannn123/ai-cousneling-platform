from pprint import pprint
import asyncio
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import Literal
from dotenv import load_dotenv

from counseling_runtime.llm import AISemanticDeltaExtractor
from counseling_runtime.semantic_delta import SemanticDeltaValidator
from counseling_runtime.schemas import SemanticDeltaResult, MemoryDeltaCandidates, FlowDrivingDeltas, DirectionDelta, Evidence

load_dotenv()

async def run():
    turn_input = {
        'studentMessage': 'i want to study business at Taylor or UM'
    }
    extractor = AISemanticDeltaExtractor()
    # result = await extractor.extract(turn_input)
    # pprint(result.model_dump())
    
    # class Result(BaseModel):
    #     type: Literal['query', 'request']
    #     response: str
    
    # agent = Agent('google:gemini-3.1-flash-lite-preview', output_type=Result)
    # result = await agent.run('what is ai?')
    # print(result)
    
    delta_result = SemanticDeltaResult(
        memoryDeltaCandidates=MemoryDeltaCandidates(
            flowDrivingDeltas=FlowDrivingDeltas(
                coursesConsidering=[DirectionDelta(
                    confidence='high',
                    evidence=[Evidence(quote='a')],
                    operation='add_new',
                    status='considering',
                    value='a'
                )]
            )
        )
    )
    validator = SemanticDeltaValidator()
    validated_delta = validator.validate(delta_result, turn_input, extractor)
    pprint(validated_delta)
    
asyncio.run(run())