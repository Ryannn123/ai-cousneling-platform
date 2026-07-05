from pprint import pprint
import asyncio
from src.counseling_runtime.llm import AISemanticDeltaExtractor

async def run():
    turn_input = {
        'studentMessage': 'im considering to study business or IT, but i dont know which one have better job opportunity. I need to talk to counselor'
    }
    extractor = AISemanticDeltaExtractor()
    result = await extractor.extract(turn_input)
    pprint(result)
    
asyncio.run(run())