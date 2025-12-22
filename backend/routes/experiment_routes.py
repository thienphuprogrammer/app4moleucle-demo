from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from datetime import datetime, timezone
from models import Experiment, ExperimentCreate, GenerationRecord, MoleculeGenerationRequest
from services.molecule_service import generate_molecules

router = APIRouter(prefix="/experiments", tags=["experiments"])

def get_db():
    from server import db
    return db

@router.post("/", response_model=Experiment)
async def create_experiment(experiment: ExperimentCreate, db=Depends(get_db)):
    exp_obj = Experiment(**experiment.model_dump())
    doc = exp_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.experiments.insert_one(doc)
    return exp_obj

@router.get("/", response_model=List[Experiment])
async def list_experiments(db=Depends(get_db)):
    cursor = db.experiments.find({}, {"_id": 0}).sort("updated_at", -1)
    experiments = await cursor.to_list(length=100)
    
    # Enrich with run counts (optional optimization: store count in experiment doc)
    for exp in experiments:
        count = await db.generation_history.count_documents({"experiment_id": exp['id']})
        exp['run_count'] = count
        
    return experiments

@router.get("/{experiment_id}", response_model=Experiment)
async def get_experiment(experiment_id: str, db=Depends(get_db)):
    exp = await db.experiments.find_one({"id": experiment_id}, {"_id": 0})
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Get run count
    exp['run_count'] = await db.generation_history.count_documents({"experiment_id": experiment_id})
    return exp

@router.get("/{experiment_id}/runs", response_model=List[GenerationRecord])
async def get_experiment_runs(experiment_id: str, db=Depends(get_db)):
    cursor = db.generation_history.find({"experiment_id": experiment_id}, {"_id": 0}).sort("created_at", -1)
    runs = await cursor.to_list(length=200)
    return runs

@router.post("/{experiment_id}/generate", response_model=GenerationRecord)
async def generate_in_experiment(experiment_id: str, request: MoleculeGenerationRequest, db=Depends(get_db)):
    # Verify experiment exists
    exp = await db.experiments.find_one({"id": experiment_id})
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    try:
        results = await generate_molecules(request.prompt, request.models)
        
        record = GenerationRecord(
            prompt=request.prompt,
            results=results,
            experiment_id=experiment_id
        )
        
        doc = record.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.generation_history.insert_one(doc)
        
        # Update experiment timestamp
        await db.experiments.update_one(
            {"id": experiment_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
