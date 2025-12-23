from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import random
import requests
from rdkit import Chem
from rdkit.Chem import AllChem

router = APIRouter(prefix="/simulation", tags=["simulation"])

class DockingRequest(BaseModel):
    ligand_smiles: str
    target_id: str 

class DockingResult(BaseModel):
    affinity: float 
    ligand_pdb: str 
    target_pdb: str 
    score_breakdown: dict

# Preset Targets with PDB IDs and approx active site centers (x,y,z)
TARGETS = {
    "covid_protease": {"id": "6LU7", "name": "SARS-CoV-2 Main Protease", "center": (-10.7, 12.4, 68.8)},
    "hiv_protease": {"id": "1HSG", "name": "HIV-1 Protease", "center": (16.0, 26.0, 5.0)},
    "breast_cancer": {"id": "3ERT", "name": "Estrogen Receptor Alpha", "center": (30.0, -2.0, 25.0)},
}

# Fallback PDB (Small part of a helix) if RCSB fails
MOCK_PROTEIN_PDB = """ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N  
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00  0.00           C  
ATOM      3  C   ALA A   1       2.009   1.396   0.000  1.00  0.00           C  
ATOM      4  O   ALA A   1       1.272   2.432   0.000  1.00  0.00           O  
ATOM      5  CB  ALA A   1       2.000  -0.767   1.217  1.00  0.00           C  
"""

@router.post("/docking/run", response_model=DockingResult)
async def run_docking_simulation(request: DockingRequest):
    # 1. Fetch Target PDB 
    target_info = TARGETS.get(request.target_id)
    if not target_info:
        raise HTTPException(status_code=404, detail="Target not found")
        
    pdb_id = target_info["id"]
    target_pdb_data = MOCK_PROTEIN_PDB # Default fallback
    
    try:
        # Real fetch from RCSB PDB
        # Add timeout to avoid hanging
        pdb_url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
        response = requests.get(pdb_url, timeout=5)
        if response.status_code == 200:
            target_pdb_data = response.text
    except Exception as e:
        print(f"PDB Fetch Warning: {e}")
        # Continue with mock if fetch fails

    # 2. Prepare Ligand (RDKit)
    try:
        mol = Chem.MolFromSmiles(request.ligand_smiles)
        if not mol:
             raise Exception("Invalid SMILES")
             
        mol = Chem.AddHs(mol)
        res = AllChem.EmbedMolecule(mol, randomSeed=42)
        if res == -1:
             res = AllChem.EmbedMolecule(mol, useRandomCoords=True)
             
        if res != -1:
            try:
                AllChem.UFFOptimizeMolecule(mol)
            except: pass
        
        # 3. Translation
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
        
        if num_atoms > 0:
            centroid = [c/num_atoms for c in centroid]
            shift = [center[0]-centroid[0], center[1]-centroid[1], center[2]-centroid[2]]
            
            # Apply shift
            for i in range(num_atoms):
                pos = conf.GetAtomPosition(i)
                conf.SetAtomPosition(i, [pos.x+shift[0], pos.y+shift[1], pos.z+shift[2]])
            
        ligand_pdb_block = Chem.MolToPDBBlock(mol)
        
        # 4. Calculate Mock Affinity
        mw = Chem.rdMolDescriptors.CalcExactMolWt(mol)
        base_score = -5.0 - (mw / 100.0 * 0.5) 
        affinity = base_score + random.uniform(-1.5, 0.5)
        
        await asyncio.sleep(1.0)
        
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
