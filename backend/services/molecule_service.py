import asyncio
import random
from typing import List
from models import SingleModelResult

# Mock data for demonstration purposes since actual endpoints weren't provided in the prompt
# In a real scenario, these would call the user's external APIs
MOCK_RESPONSES = {
    "aspirin": "CC(=O)OC1=CC=CC=C1C(=O)O",
    "ethanol": "CCO",
    "caffeine": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    "benzene": "c1ccccc1",
    "water": "O",
    "glucose": "OC[C@@H](O1)[C@@H](O)[C@H](O)[C@@H](O)[C@H](O)1"
}

async def call_external_model(model_name: str, prompt: str) -> SingleModelResult:
    # Simulate network delay
    await asyncio.sleep(random.uniform(0.5, 2.0))
    
    # Simple keyword matching for mock results
    prompt_lower = prompt.lower()
    smiles = "C" # Default methane
    
    for key, val in MOCK_RESPONSES.items():
        if key in prompt_lower:
            smiles = val
            break
            
    # Artificial variation for model comparison
    if model_name == "model_b":
        # Maybe Model B generates a slightly different variant or isomer (mocking)
        if smiles == "CCO": smiles = "C(O)C" 
    
    return SingleModelResult(
        model_name=model_name,
        smiles=smiles,
        confidence=random.uniform(0.85, 0.99),
        execution_time=random.uniform(0.1, 0.5)
    )

async def generate_molecules(prompt: str, models: List[str]) -> List[SingleModelResult]:
    tasks = [call_external_model(model, prompt) for model in models]
    results = await asyncio.gather(*tasks)
    return results
