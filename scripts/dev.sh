#!/bin/bash

# ===========================================
# CHEM.AI - Development Mode Script
# ===========================================

set -e

echo "========================================"
echo "   CHEM.AI - Development Mode"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check MongoDB
echo -e "${YELLOW}Checking MongoDB...${NC}"
if lsof -Pi :27017 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${YELLOW}Starting MongoDB with Docker...${NC}"
    docker run -d -p 27017:27017 --name mongodb mongo:latest 2>/dev/null || \
    docker start mongodb 2>/dev/null || \
    echo -e "${RED}Please start MongoDB manually${NC}"
fi

echo ""

# Start Backend with hot reload
echo -e "${YELLOW}Starting Backend (hot reload)...${NC}"
cd "$ROOT_DIR/backend"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

# Start Frontend with hot reload
echo ""
echo -e "${YELLOW}Starting Frontend (hot reload)...${NC}"
cd "$ROOT_DIR/frontend"
yarn dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo -e "${GREEN}   Development Mode Active${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "${BLUE}Backend:${NC}   http://localhost:8001"
echo -e "${BLUE}API Docs:${NC}  http://localhost:8001/docs"
echo ""
echo -e "${YELLOW}Hot reload enabled. Press Ctrl+C to stop.${NC}"
echo ""

# Wait for processes
wait
