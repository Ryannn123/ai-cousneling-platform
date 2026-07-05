from pprint import pprint
import asyncio
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import Literal
from dotenv import load_dotenv
from uuid import uuid4

from counseling_runtime.contracts import TurnInput
from counseling_runtime.llm import AISemanticDeltaExtractor
from counseling_runtime.semantic_delta import SemanticDeltaValidator
from counseling_runtime.schemas import SemanticDeltaResult, MemoryDeltaCandidates, FlowDrivingDeltas, DirectionDelta, Evidence
from counseling_runtime.memory import MemoryStateService

load_dotenv()

async def run():
    conversation_id = student_id = '123'
    turn_input = TurnInput(
            conversationId = conversation_id,
            turnId = str(uuid4()),
            messageId = str(uuid4()),
            previousRuntimeState = {},
            recentConversationSummary = '',
            currentTruthBeforeTurn = {},
            studentMessage = 'i want to study business at taylor or UM, but i dont know which one is higher ranking. And i prefer uni with rich campus life',
        )
    extractor = AISemanticDeltaExtractor()
    validator = SemanticDeltaValidator()
    memory_service = MemoryStateService()
    
    # delta_result = SemanticDeltaResult(
    #     memoryDeltaCandidates=MemoryDeltaCandidates(
    #         flowDrivingDeltas=FlowDrivingDeltas(
    #             directions=[DirectionDelta(
    #                 confidence='high',
    #                 dimension='university',
    #                 evidence=[Evidence(quote='')],
    #                 operation='add_new',
    #                 status='considering',
    #                 value='a'
    #                 ),
    #             ]
    #         )
    #     )
    # )
   
    delta_result = await extractor.extract(turn_input)
    validated_delta = validator.validate(delta_result, turn_input, extractor)
    pprint(validated_delta.to_json_dict())
    print('='*30)
    commit_result = memory_service.commit_pre_response_student_memory(student_id, validated_delta)
    truth = memory_service.derive_current_truth(student_id)
    pprint(truth.to_json_dict())
    
asyncio.run(run())
