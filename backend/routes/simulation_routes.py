from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import random
import requests
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolTransforms

router = APIRouter(prefix="/simulation", tags=["simulation"])

class DockingRequest(BaseModel):
    ligand_smiles: str
    target_id: str # e.g., "6LU7" (COVID-19), "1HSG" (HIV)

class DockingResult(BaseModel):
    affinity: float # kcal/mol
    ligand_pdb: str # PDB block of the ligand in docked position
    target_pdb: str # PDB block of the target
    score_breakdown: dict

# Preset Targets with PDB IDs and approx active site centers (x,y,z)
TARGETS = {
    "covid_protease": {"id": "6LU7", "name": "SARS-CoV-2 Main Protease", "center": (-10.7, 12.4, 68.8)},
    "hiv_protease": {"id": "1HSG", "name": "HIV-1 Protease", "center": (16.0, 26.0, 5.0)},
    "breast_cancer": {"id": "3ERT", "name": "Estrogen Receptor Alpha", "center": (30.0, -2.0, 25.0)},
}

@router.post("/docking/run", response_model=DockingResult)
async def run_docking_simulation(request: DockingRequest):
    # 1. Fetch Target PDB (Simulate local cache)
    target_info = TARGETS.get(request.target_id)
    if not target_info:
        raise HTTPException(status_code=404, detail="Target not found")
        
    pdb_id = target_info["id"]
    try:
        # Real fetch from RCSB PDB
        pdb_url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
        response = requests.get(pdb_url)
        if response.status_code != 200:
            raise Exception("Failed to fetch PDB")
        target_pdb_data = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Target retrieval failed: {str(e)}")

    # 2. Prepare Ligand (RDKit)
    try:
        mol = Chem.MolFromSmiles(request.ligand_smiles)
        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, randomSeed=42)
        AllChem.UFFOptimizeMolecule(mol)
        
        # 3. "Mock" Docking Translation
        # Move ligand to the known active site center of the protein
        conf = mol.GetConformer()
        center = target_info["center"]
        
        # Calculate current centroid
        centroid = [0,0,0]
        num_atoms = mol.GetNumAtoms()
        for i in range(num_atoms):
            pos = conf.GetAtomPosition(i)
            centroid[0] += pos.x
            centroid[1] += pos.y
            centroid[2] += pos.z
        centroid = [c/num_atoms for c in centroid]
        
        # Translate
        shift = [center[0]-centroid[0], center[1]-centroid[1], center[2]-centroid[2]]
        for i in range(num_atoms):
            pos = conf.GetAtomPosition(i)
            conf.SetAtomPosition(i, [pos.x+shift[0], pos.y+shift[1], pos.z+shift[2]])
            
        ligand_pdb_block = Chem.MolToPDBBlock(mol)
        
        # 4. Calculate Mock Affinity
        # Heuristic: MW * random factor + H-bonds? 
        # Let's just generate a realistic looking score between -6.0 and -10.0
        mw = Chem.rdMolDescriptors.CalcExactMolWt(mol)
        base_score = -5.0 - (mw / 100.0 * 0.5) 
        affinity = base_score + random.uniform(-1.5, 0.5)
        
        # Simulation delay
        await asyncio.sleep(2.0)
        
        return DockingResult(
            affinity=round(affinity, 2),
            ligand_pdb=ligand_pdb_block,
            target_pdb=target_pdb_data,
            score_breakdown={
                "van_der_waals": round(affinity * 0.6, 2),
                "electrostatic": round(affinity * 0.3, 2),
                "desolvation": round(affinity * 0.1, 2)
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
