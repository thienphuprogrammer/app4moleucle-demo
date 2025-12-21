from fastapi import APIRouter, HTTPException, Depends
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from models import MoleculeGenerationRequest, GenerationRecord, GenerationHistoryResponse
from services.molecule_service import generate_molecules

router = APIRouter(prefix="/molecules", tags=["molecules"])

def get_db():
    from server import db
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
