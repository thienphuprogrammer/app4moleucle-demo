#!/bin/bash

# ===========================================
# CHEM.AI - Installation Script
# ===========================================

set -e  # Exit on error

echo "========================================"
echo "   CHEM.AI Installation Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}[1/4] Checking prerequisites...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo -e "${GREEN}✓ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check Yarn
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✓ Yarn installed: $YARN_VERSION${NC}"
else
    echo -e "${YELLOW}! Yarn not found. Installing...${NC}"
    npm install -g yarn
fi

echo ""
echo -e "${YELLOW}[2/4] Installing Backend dependencies...${NC}"

cd "$ROOT_DIR/backend"

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "Installing Python packages..."
pip install -r requirements.txt

# Install additional packages if needed
pip install aiohttp rdkit litellm 2>/dev/null || true

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo ""
echo -e "${YELLOW}[3/4] Installing Frontend dependencies...${NC}"

cd "$ROOT_DIR/frontend"

# Install Node.js dependencies
echo "Installing Node.js packages..."
yarn install

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo ""
echo -e "${YELLOW}[4/4] Setting up environment files...${NC}"

# Backend .env
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    cat > "$ROOT_DIR/backend/.env" << EOF
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/chemdb

# OpenAI API Key (required for chatbot & mol2text)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Or use Emergent LLM Key
EMERGENT_LLM_KEY=
EOF
    echo -e "${YELLOW}! Created backend/.env - Please add your API keys${NC}"
else
    echo -e "${GREEN}✓ Backend .env exists${NC}"
fi

# Frontend .env
if [ ! -f "$ROOT_DIR/frontend/.env" ]; then
    cat > "$ROOT_DIR/frontend/.env" << EOF
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${GREEN}✓ Frontend .env exists${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}   Installation Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Configure API keys in backend/.env"
echo "  2. Start MongoDB: docker run -d -p 27017:27017 mongo"
echo "  3. Run: ./scripts/start.sh"
echo ""
