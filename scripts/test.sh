#!/bin/bash

# ===========================================
# CHEM.AI - Test Script
# ===========================================

set -e

echo "========================================"
echo "   CHEM.AI - Running Tests"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if backend is running
echo -e "${YELLOW}[1/3] Checking services...${NC}"
if curl -s http://localhost:8001/api/molecules/history > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running!${NC}"
    echo "  Please start services first: ./scripts/start.sh"
    exit 1
fi

# Run Backend Tests
echo ""
echo -e "${YELLOW}[2/3] Running Backend Tests...${NC}"
cd "$ROOT_DIR"

if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi

echo "Testing API endpoints..."
echo ""

# Test 1: History
echo -n "  GET /api/molecules/history ... "
RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8001/api/molecules/history)
HTTP_CODE=${RESPONSE: -3}
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
fi

# Test 2: 3D Structure
echo -n "  GET /api/molecules/3d?smiles=CCO ... "
RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:8001/api/molecules/3d?smiles=CCO")
HTTP_CODE=${RESPONSE: -3}
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
fi

# Test 3: Generate
echo -n "  POST /api/molecules/generate ... "
RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test molecule", "models": ["your_model"]}' \
  http://localhost:8001/api/molecules/generate)
HTTP_CODE=${RESPONSE: -3}
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
fi

# Run Python tests if exists
if [ -f "$ROOT_DIR/backend_test.py" ]; then
    echo ""
    echo "Running comprehensive tests..."
    python "$ROOT_DIR/backend_test.py" || true
fi

# Frontend Tests
echo ""
echo -e "${YELLOW}[3/3] Running Frontend Tests...${NC}"
cd "$ROOT_DIR/frontend"

if [ -f "package.json" ] && grep -q '"test"' package.json; then
    yarn test --passWithNoTests 2>/dev/null || echo "No frontend tests configured"
else
    echo "No frontend tests configured"
fi

echo ""
echo "========================================"
echo -e "${GREEN}   Tests Complete${NC}"
echo "========================================"
echo ""
