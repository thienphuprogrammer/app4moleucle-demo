import axios from 'axios';
import { getApiUrl } from './utils';
import type {
  GenerationRecord,
  MoleculeGenerationRequest,
  ChatRequest,
  ChatResponse,
  Mol2TextRequest,
  Mol2TextResponse,
} from './types';

const api = axios.create({
  timeout: 60000,
});

// Molecules API
export const moleculesApi = {
  generate: async (request: MoleculeGenerationRequest): Promise<GenerationRecord> => {
    const response = await api.post(getApiUrl('/api/molecules/generate'), request);
    return response.data;
  },

  get3DStructure: async (smiles: string): Promise<{ sdf: string }> => {
    const response = await api.get(getApiUrl('/api/molecules/3d'), { params: { smiles } });
    return response.data;
  },

  getHistory: async (): Promise<GenerationRecord[]> => {
    const response = await api.get(getApiUrl('/api/molecules/history'));
    return response.data;
  },

  updateDescription: async (recordId: string, prompt: string): Promise<void> => {
    await api.patch(getApiUrl(`/api/molecules/history/${recordId}`), { prompt });
  },
};

// Knowledge API
export const knowledgeApi = {
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post(getApiUrl('/api/knowledge/chat'), request);
    return response.data;
  },

  mol2text: async (request: Mol2TextRequest): Promise<Mol2TextResponse> => {
    const response = await api.post(getApiUrl('/api/knowledge/mol2text'), request);
    return response.data;
  },
};
