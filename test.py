from pprint import pprint
import asyncio
from src.counseling_runtime.llm import AISemanticDeltaExtractor
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import Literal
from dotenv import load_dotenv

load_dotenv()

async def run():
    # turn_input = {
    #     'studentMessage': 'im considering to study business or IT, but i dont know which one have better job opportunity. I need to talk to counselor'
    # }
    # extractor = AISemanticDeltaExtractor()
    # result = await extractor.extract(turn_input)
    # pprint(result)
    
    class Result(BaseModel):
        type: Literal['query', 'request']
        response: str
    
    agent = Agent('google:gemini-3.1-flash-lite-preview', output_type=Result)
    result = await agent.run('what is ai?')
    print(result)
    
asyncio.run(run())