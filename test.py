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
            studentMessage = 'i want to study business at taylor or UM',
        )
    extractor = AISemanticDeltaExtractor()
    # delta_result = await extractor.extract(turn_input)
    # pprint(result.model_dump())
    
    # delta_result = SemanticDeltaResult(
    #     memoryDeltaCandidates=MemoryDeltaCandidates(
    #         flowDrivingDeltas=FlowDrivingDeltas(
    #             directions=[DirectionDelta(
    #                 confidence='high',
    #                 dimension='course',
    #                 evidence=[Evidence(quote='a')],
    #                 operation='add_new',
    #                 status='considering',
    #                 value='a'
    #             ), DirectionDelta(
    #                 confidence='low',
    #                 dimension='course',
    #                 evidence=[Evidence(quote='a')],
    #                 operation='add_new',
    #                 status='confirmed_counseling_preference',
    #                 value='a'
    #             )]
    #         )
    #     )
    # )
    # validator = SemanticDeltaValidator()
    # validated_delta = validator.validate(delta_result, turn_input, extractor)
    
    memory_service = MemoryStateService()
    # commit_result = memory_service.commit_pre_response_student_memory(studentId, validated_delta)
    # pprint(commit_result.to_json_dict())
    truth = memory_service.derive_current_truth(student_id)
    pprint(truth)
    
asyncio.run(run())
