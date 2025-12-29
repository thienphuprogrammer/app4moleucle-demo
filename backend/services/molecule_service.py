"""
Molecule Generation Service

This service orchestrates molecule generation from multiple AI models.
Supports: Your Model (custom), MolT5, ChemBERTa

When models are not available (API down), mock responses are used for testing.
"""

import asyncio
import logging
from typing import List, Dict, Optional
from models import SingleModelResult
from services.model_clients import (
    get_model_client, 
    check_all_models_health,
    MODEL_CLIENTS
)

logger = logging.getLogger(__name__)

# Model name mapping (frontend names -> backend names)
MODEL_NAME_MAP = {
    'your_model': 'your_model',
    'molt5': 'molt5', 
    'chemberta': 'chemberta',
    # Legacy mappings for backward compatibility
    'model_a': 'your_model',
    'model_b': 'molt5',
    'model_c': 'chemberta',
}


def normalize_model_name(name: str) -> str:
    """Normalize model name to backend format"""
    return MODEL_NAME_MAP.get(name.lower(), name.lower())


async def call_external_model(model_name: str, prompt: str) -> SingleModelResult:
    """
    Call a single external model to generate molecule from text.
    Falls back to mock if model is unavailable.
    """
    normalized_name = normalize_model_name(model_name)
    
    try:
        client = await get_model_client(normalized_name)
        result = await client.generate(prompt)
        
        return SingleModelResult(
            model_name=model_name,  # Keep original name for frontend
            smiles=result.smiles,
            confidence=result.confidence,
            execution_time=result.execution_time_ms / 1000,  # Convert to seconds
            model_version=result.model_version,
            is_valid=result.is_valid
        )
    except Exception as e:
        logger.error(f"Error calling model {model_name}: {e}")
        # Return a fallback result
        return SingleModelResult(
            model_name=model_name,
            smiles="C",  # Methane as fallback
            confidence=0.0,
            execution_time=0.0,
            model_version="error",
            is_valid=False
        )


async def generate_molecules(prompt: str, models: List[str]) -> List[SingleModelResult]:
    """
    Generate molecules from multiple models in parallel.
    
    Args:
        prompt: Natural language description of the molecule
        models: List of model names to use
        
    Returns:
        List of results from each model
    """
    if not models:
        models = ['your_model']  # Default model
    
    # Run all models in parallel
    tasks = [call_external_model(model, prompt) for model in models]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter out exceptions and convert to results
    valid_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Model {models[i]} failed: {result}")
            valid_results.append(SingleModelResult(
                model_name=models[i],
                smiles="C",
                confidence=0.0,
                execution_time=0.0,
                model_version="error",
                is_valid=False
            ))
        else:
            valid_results.append(result)
    
    return valid_results


async def get_available_models() -> Dict[str, Dict]:
    """
    Get list of available models and their health status.
    """
    health_status = await check_all_models_health()
    
    models_info = {}
    for name in MODEL_CLIENTS.keys():
        models_info[name] = {
            'name': name,
            'display_name': name.replace('_', ' ').title(),
            'is_available': health_status.get(name, False),
            'description': get_model_description(name)
        }
    
    return models_info


def get_model_description(model_name: str) -> str:
    """Get human-readable description for each model"""
    descriptions = {
        'your_model': 'Custom Text-to-Molecule model trained on your dataset',
        'molt5': 'MolT5 - Transformer model for molecular language understanding',
        'chemberta': 'ChemBERTa - BERT-based model pretrained on SMILES'
    }
    return descriptions.get(model_name, 'AI model for molecule generation')


async def validate_smiles(smiles: str) -> Dict:
    """
    Validate a SMILES string and return information about it.
    """
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors
    
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return {'valid': False, 'error': 'Invalid SMILES string'}
        
        return {
            'valid': True,
            'smiles': smiles,
            'canonical_smiles': Chem.MolToSmiles(mol),
            'molecular_formula': rdMolDescriptors.CalcMolFormula(mol),
            'molecular_weight': round(Descriptors.MolWt(mol), 2),
            'num_atoms': mol.GetNumAtoms(),
            'num_heavy_atoms': mol.GetNumHeavyAtoms(),
            'num_rings': rdMolDescriptors.CalcNumRings(mol),
            'num_rotatable_bonds': rdMolDescriptors.CalcNumRotatableBonds(mol)
        }
    except Exception as e:
        return {'valid': False, 'error': str(e)}
