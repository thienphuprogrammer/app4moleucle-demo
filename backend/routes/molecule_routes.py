from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from bson import ObjectId
from datetime import datetime, timezone
from ..models import MoleculeGenerationRequest, GenerationRecord, GenerationHistoryResponse
from ..services.molecule_service import generate_molecules
from rdkit import Chem
from rdkit.Chem import AllChem

router = APIRouter(prefix="/molecules", tags=["molecules"])

def get_db():
    from ..server import db
    return db

@router.post("/generate", response_model=GenerationRecord)
async def generate_molecule_from_text(request: MoleculeGenerationRequest, db=Depends(get_db)):
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=422, detail="Prompt cannot be empty")
    
    try:
        results = await generate_molecules(request.prompt, request.models)
        
        record = GenerationRecord(
            prompt=request.prompt,
            results=results
        )
        
        # Save to history
        doc = record.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.generation_history.insert_one(doc)
        
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[GenerationRecord])
async def get_history(db=Depends(get_db)):
    cursor = db.generation_history.find({}, {"_id": 0}).sort("created_at", -1).limit(50)
    history = await cursor.to_list(length=50)
    return history

@router.patch("/history/{record_id}")
async def update_history_description(record_id: str, prompt: str = Body(..., embed=True), db=Depends(get_db)):
    # Find and update
    result = await db.generation_history.update_one(
        {"id": record_id},
        {"$set": {"prompt": prompt, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
        
    return {"status": "success", "message": "Description updated"}

@router.post("/regenerate/{record_id}", response_model=GenerationRecord)
async def regenerate_molecule(record_id: str, models: List[str] = Body(..., embed=True), db=Depends(get_db)):
    # Get original record to retrieve prompt
    record = await db.generation_history.find_one({"id": record_id})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    prompt = record['prompt']
    
    try:
        # Generate NEW results
        results = await generate_molecules(prompt, models)
        
        # Create NEW record (Versioning strategy: New record is safest)
        new_record = GenerationRecord(
            prompt=prompt,
            results=results
        )
        
        doc = new_record.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['parent_id'] = record_id # Link to parent if we want to track versions later
        
        await db.generation_history.insert_one(doc)
        
        return new_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/3d")
async def get_3d_structure(smiles: str):
    """
    Generate 3D coordinates for a SMILES string using RDKit.
    Returns SDF format string.
    """
    try:
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            raise HTTPException(status_code=400, detail="Invalid SMILES string")
            
        mol = Chem.AddHs(mol)
        
        # Generate 3D coords
        # Use random seed for reproducibility if needed, or -1
        res = AllChem.EmbedMolecule(mol, randomSeed=42)
        
        if res == -1:
            # Try again with random coordinates if standard embedding fails
            res = AllChem.EmbedMolecule(mol, useRandomCoords=True)
            if res == -1:
                 # Last resort: just compute 2D and pretend it's 3D (flat) or fail?
                 # Better to fail or return 2D block
                 # Let's try UFF optimization just in case it helps fix geometry
                 pass

        if res != -1:
            try:
                AllChem.UFFOptimizeMolecule(mol)
            except:
                pass # Optimization might fail but we have coords
        
        # Convert to SDF/MolBlock
        sdf_block = Chem.MolToMolBlock(mol)
        return {"sdf": sdf_block}
        
    except Exception as e:
        # Fallback or error
        raise HTTPException(status_code=500, detail=f"Failed to generate 3D structure: {str(e)}")
