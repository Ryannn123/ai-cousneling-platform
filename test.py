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
from counseling_runtime.schemas import SemanticDeltaResult, MemoryDeltaCandidates, FlowDrivingDeltas, DirectionDelta, Evidence, AcademicResultDelta, QualityEnhancingDelta, BoundarySignal
from counseling_runtime.memory import MemoryStateService
from counseling_runtime.routes import RouteEpisodeCandidateResolver
from counseling_runtime.boundary import BoundaryEngine

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
    route_candidate_resolver = RouteEpisodeCandidateResolver()
    boundary_engine = BoundaryEngine()
    
    delta_result = SemanticDeltaResult(
        memoryDeltaCandidates=MemoryDeltaCandidates(
            flowDrivingDeltas=FlowDrivingDeltas(
                directions=[
                    DirectionDelta(
                        confidence='high',
                        operation='add_new',
                        universityType=None,
                        evidence=[Evidence(quote='IT')],
                        dimension='course',
                        status='confirmed_counseling_preference',
                        value='IT',
                    )
                ]
            ),
            # qualityEnhancingDeltas=[
            #     QualityEnhancingDelta(
            #         confidence='high',
            #         operation='add_new',
            #         sensitivity='none',
            #         usefulness='high',
            #         evidence=[Evidence(quote='logic')],
            #         type='preference',
            #         constraintStrength='soft_preference',
            #         value={'prefer': 'logic'}
            #     )
            # ]
        ),
        runtimeOnlySignalCandidates=[
            BoundarySignal(
                kind='boundary',
                confidence='high',
                evidence=[Evidence(quote='a')],
                recommendedBehavior='handoff',
                severityCandidate='red',
                triggerType='H1',
                type='ready_to_apply_or_register'
            )
        ]
    )
   
    # delta_result = await extractor.extract(turn_input)
    accepted_delta = validator.validate(delta_result, turn_input, extractor)
    boundary_result = boundary_engine.evaluate(accepted_delta)
    # memory_service.commit_pre_response_student_memory(student_id, accepted_delta)
    # truth = memory_service.derive_current_truth(student_id)
    # route_candidate = route_candidate_resolver.resolve(truth, None, {}, '')
    pprint(boundary_result.to_json_dict())
    
asyncio.run(run())
