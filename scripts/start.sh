#!/bin/bash

# ===========================================
# CHEM.AI - Start Script (Production)
# ===========================================

set -e

echo "========================================"
echo "   CHEM.AI - Starting Services"
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

# Create logs directory
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local name=$3
    local max_attempts=30
    local attempt=0
    
    echo -n "Waiting for $name to start"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://$host:$port" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# Check MongoDB
echo -e "${YELLOW}[1/3] Checking MongoDB...${NC}"
if check_port 27017; then
    echo -e "${GREEN}✓ MongoDB is running on port 27017${NC}"
else
    echo -e "${RED}✗ MongoDB is not running!${NC}"
    echo "  Please start MongoDB first:"
    echo "  docker run -d -p 27017:27017 --name mongodb mongo:latest"
    exit 1
fi

# Start Backend
echo ""
echo -e "${YELLOW}[2/3] Starting Backend...${NC}"

if check_port 8001; then
    echo -e "${YELLOW}! Port 8001 is already in use. Killing existing process...${NC}"
    kill $(lsof -t -i:8001) 2>/dev/null || true
    sleep 2
fi

cd "$ROOT_DIR/backend"

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start uvicorn in background
echo "Starting FastAPI backend on port 8001..."
nohup uvicorn server:app --host 0.0.0.0 --port 8001 > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
wait_for_service localhost 8001 "Backend"

# Start Frontend
echo ""
echo -e "${YELLOW}[3/3] Starting Frontend...${NC}"

if check_port 3000; then
    echo -e "${YELLOW}! Port 3000 is already in use. Killing existing process...${NC}"
    kill $(lsof -t -i:3000) 2>/dev/null || true
    sleep 2
fi

cd "$ROOT_DIR/frontend"

# Start Next.js in background
echo "Starting Next.js frontend on port 3000..."
nohup yarn start > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
wait_for_service localhost 3000 "Frontend"

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}   All Services Started!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "${BLUE}Backend:${NC}   http://localhost:8001"
echo -e "${BLUE}API Docs:${NC}  http://localhost:8001/docs"
echo ""
echo "Logs:"
echo "  Backend:  $LOG_DIR/backend.log"
echo "  Frontend: $LOG_DIR/frontend.log"
echo ""
echo "To stop services:"
echo "  ./scripts/stop.sh"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"
