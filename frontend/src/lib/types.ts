// ============ Model Types ============
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'your_model', name: 'Your Model', description: 'Custom trained model' },
  { id: 'molt5', name: 'MolT5', description: 'Transformer for molecules' },
  { id: 'chemberta', name: 'ChemBERTa', description: 'BERT-based chemistry model' },
];

// ============ API Request Types ============
export interface GenerateRequest {
  prompt: string;
  models: string[];
  experiment_id?: string;
}

export interface ChatRequest {
  query: string;
  session_id?: string;
  context?: string;
}

export interface Mol2TextRequest {
  smiles: string;
  additional_info?: string;
}

// ============ API Response Types ============
export interface SingleModelResult {
  model_name: string;
  smiles: string;
  confidence: number;
  execution_time: number;
  model_version?: string;
  is_valid?: boolean;
}

export interface GenerationRecord {
  id: string;
  prompt: string;
  results: SingleModelResult[];
  experiment_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatResponse {
  answer: string;
  session_id: string;
  sources: string[];
}

export interface Mol2TextResponse {
  smiles: string;
  description: string;
  success: boolean;
  error?: string;
}

export interface Structure3DResponse {
  sdf: string;
}

// ============ Experiment Types ============
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  run_count: number;
}

export interface ExperimentCreate {
  name: string;
  description?: string;
}

// ============ Simulation Types ============
export interface DockingRequest {
  ligand_smiles: string;
  target_id: string;
}

export interface DockingResult {
  affinity: number;
  ligand_pdb: string;
  target_pdb: string;
  score_breakdown: {
    van_der_waals: number;
    electrostatic: number;
    desolvation: number;
  };
}

export interface TargetProtein {
  id: string;
  name: string;
  pdbId: string;
  description: string;
}
