import axios, { AxiosInstance } from 'axios';
import type {
  GenerateRequest,
  GenerationRecord,
  Structure3DResponse,
  ChatRequest,
  ChatResponse,
  Mol2TextRequest,
  Mol2TextResponse,
  Experiment,
  ExperimentCreate,
} from './types';

// Get API base URL from environment
function getBaseUrl(): string {
  let baseUrl = process.env.REACT_APP_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  
  if (baseUrl && baseUrl.startsWith('http:')) {
    baseUrl = baseUrl.replace('http:', 'https:');
  }
  
  if (baseUrl && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  return baseUrl;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Molecules API ============
export const moleculesApi = {
  generate: async (request: GenerateRequest): Promise<GenerationRecord> => {
    const response = await api.post<GenerationRecord>('/api/molecules/generate', request);
    return response.data;
  },

  getHistory: async (): Promise<GenerationRecord[]> => {
    const response = await api.get<GenerationRecord[]>('/api/molecules/history');
    return response.data;
  },

  get3DStructure: async (smiles: string): Promise<Structure3DResponse> => {
    const response = await api.get<Structure3DResponse>('/api/molecules/3d', {
      params: { smiles },
    });
    return response.data;
  },

  updateHistory: async (recordId: string, prompt: string): Promise<void> => {
    await api.patch(`/api/molecules/history/${recordId}`, { prompt });
  },

  regenerate: async (recordId: string, models: string[]): Promise<GenerationRecord> => {
    const response = await api.post<GenerationRecord>(`/api/molecules/regenerate/${recordId}`, { models });
    return response.data;
  },
};

// ============ Knowledge API ============
export const knowledgeApi = {
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/api/knowledge/chat', request);
    return response.data;
  },

  mol2text: async (request: Mol2TextRequest): Promise<Mol2TextResponse> => {
    const response = await api.post<Mol2TextResponse>('/api/knowledge/mol2text', request);
    return response.data;
  },

  getAvailableModels: async (): Promise<Record<string, unknown>> => {
    const response = await api.get('/api/knowledge/models/available');
    return response.data;
  },
};

// ============ Experiments API ============
export const experimentsApi = {
  list: async (): Promise<Experiment[]> => {
    const response = await api.get<Experiment[]>('/api/experiments');
    return response.data;
  },

  create: async (data: ExperimentCreate): Promise<Experiment> => {
    const response = await api.post<Experiment>('/api/experiments', data);
    return response.data;
  },

  get: async (id: string): Promise<Experiment> => {
    const response = await api.get<Experiment>(`/api/experiments/${id}`);
    return response.data;
  },

  getRuns: async (id: string): Promise<GenerationRecord[]> => {
    const response = await api.get<GenerationRecord[]>(`/api/experiments/${id}/runs`);
    return response.data;
  },

  generateInExperiment: async (experimentId: string, request: GenerateRequest): Promise<GenerationRecord> => {
    const response = await api.post<GenerationRecord>(`/api/experiments/${experimentId}/generate`, request);
    return response.data;
  },
};

// ============ Simulation API ============
export const simulationApi = {
  runDocking: async (ligandSmiles: string, targetId: string) => {
    const response = await api.post('/api/simulation/docking/run', {
      ligand_smiles: ligandSmiles,
      target_id: targetId,
    });
    return response.data;
  },
};

export default api;
