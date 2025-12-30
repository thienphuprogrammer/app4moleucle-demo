"""
LLM Service for RAG Chatbot and Molecule-to-Text Generation

Using OpenAI GPT-4o via litellm library
"""

import os
import logging
from typing import Optional, List, Dict
from dotenv import load_dotenv
import litellm

load_dotenv()

logger = logging.getLogger(__name__)

# Get API key from environment
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')

# Configure litellm
if OPENAI_API_KEY:
    os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY

CHEMISTRY_SYSTEM_MESSAGE = """You are an expert chemistry assistant specializing in molecular science.
You help users understand chemical compounds, molecular structures, and their properties.

When answering questions:
1. Provide accurate scientific information
2. Explain complex concepts in accessible terms
3. Reference chemical properties, uses, and safety information when relevant
4. If discussing specific molecules, mention their SMILES notation when applicable
5. Always clarify if information might be uncertain or requires verification

You have knowledge about:
- Organic chemistry and molecular structures
- Drug compounds and their mechanisms
- Chemical properties and reactions
- Safety and handling information
- Industrial and pharmaceutical applications"""

MOL2TEXT_SYSTEM_MESSAGE = """You are an expert chemistry assistant that describes molecular structures.

When given a SMILES notation or molecule name:
1. Identify the compound (if known)
2. Describe its structure in simple terms
3. List key properties (molecular weight, functional groups)
4. Mention common uses and applications
5. Include relevant safety information

Provide responses in a structured, educational format."""


class MoleculeKnowledgeChat:
    """RAG-powered chatbot for molecular chemistry knowledge"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.messages: List[Dict] = [
            {"role": "system", "content": CHEMISTRY_SYSTEM_MESSAGE}
        ]
    
    async def ask(self, question: str, context: Optional[str] = None) -> Dict:
        """Ask a question to the chemistry chatbot"""
        try:
            # Build message with optional context
            message_text = question
            if context:
                message_text = f"Context: {context}\n\nQuestion: {question}"
            
            self.messages.append({"role": "user", "content": message_text})
            
            response = await litellm.acompletion(
                model="gpt-4o",
                messages=self.messages
            )
            
            answer = response.choices[0].message.content
            self.messages.append({"role": "assistant", "content": answer})
            
            return {
                'success': True,
                'answer': answer,
                'session_id': self.session_id
            }
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return {
                'success': False,
                'error': str(e),
                'session_id': self.session_id
            }


class MoleculeToTextGenerator:
    """Generate natural language descriptions from molecules"""
    
    def __init__(self):
        self.system_message = MOL2TEXT_SYSTEM_MESSAGE
    
    async def generate_description(self, smiles: str, additional_info: Optional[str] = None) -> Dict:
        """Generate text description from SMILES"""
        try:
            prompt = f"""Analyze and describe this molecule:

SMILES: {smiles}

{f'Additional context: {additional_info}' if additional_info else ''}

Please provide:
1. Common name (if recognizable)
2. Structural description
3. Key functional groups
4. Likely properties and uses
5. Any notable characteristics"""
            
            messages = [
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": prompt}
            ]
            
            response = await litellm.acompletion(
                model="gpt-4o",
                messages=messages
            )
            
            description = response.choices[0].message.content
            
            return {
                'success': True,
                'smiles': smiles,
                'description': description
            }
        except Exception as e:
            logger.error(f"Mol2Text error: {e}")
            return {
                'success': False,
                'smiles': smiles,
                'error': str(e)
            }


# Singleton instances
_chat_sessions: Dict[str, MoleculeKnowledgeChat] = {}
_mol2text_generator: Optional[MoleculeToTextGenerator] = None


def get_chat_session(session_id: str) -> MoleculeKnowledgeChat:
    """Get or create a chat session"""
    if session_id not in _chat_sessions:
        _chat_sessions[session_id] = MoleculeKnowledgeChat(session_id)
    return _chat_sessions[session_id]


def get_mol2text_generator() -> MoleculeToTextGenerator:
    """Get the molecule-to-text generator"""
    global _mol2text_generator
    if _mol2text_generator is None:
        _mol2text_generator = MoleculeToTextGenerator()
    return _mol2text_generator
