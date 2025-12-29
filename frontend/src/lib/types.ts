// API Types
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

export interface MoleculeGenerationRequest {
  prompt: string;
  models: string[];
  experiment_id?: string;
}

export interface ChatRequest {
  query: string;
  session_id?: string;
  context?: string;
}

export interface ChatResponse {
  answer: string;
  session_id: string;
  sources: string[];
}

export interface Mol2TextRequest {
  smiles: string;
  additional_info?: string;
}

export interface Mol2TextResponse {
  smiles: string;
  description: string;
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

// Model Types
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'your_model', name: 'Your Model', description: 'Custom trained model', icon: 'cpu' },
  { id: 'molt5', name: 'MolT5', description: 'Transformer for molecules', icon: 'beaker' },
  { id: 'chemberta', name: 'ChemBERTa', description: 'BERT-based chemistry model', icon: 'atom' },
];

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: string;
}
