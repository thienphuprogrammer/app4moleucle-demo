#!/bin/bash

# ===========================================
# CHEM.AI - Stop Script
# ===========================================

echo "========================================"
echo "   CHEM.AI - Stopping Services"
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
LOG_DIR="$ROOT_DIR/logs"

# Stop Backend
echo -e "${YELLOW}Stopping Backend...${NC}"
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✓ Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}! Backend was not running${NC}"
    fi
    rm -f "$LOG_DIR/backend.pid"
else
    # Try to kill by port
    if lsof -t -i:8001 >/dev/null 2>&1; then
        kill $(lsof -t -i:8001) 2>/dev/null
        echo -e "${GREEN}✓ Backend stopped (port 8001)${NC}"
    else
        echo -e "${YELLOW}! Backend was not running${NC}"
    fi
fi

# Stop Frontend
echo -e "${YELLOW}Stopping Frontend...${NC}"
if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}! Frontend was not running${NC}"
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    # Try to kill by port
    if lsof -t -i:3000 >/dev/null 2>&1; then
        kill $(lsof -t -i:3000) 2>/dev/null
        echo -e "${GREEN}✓ Frontend stopped (port 3000)${NC}"
    else
        echo -e "${YELLOW}! Frontend was not running${NC}"
    fi
fi

echo ""
echo -e "${GREEN}All services stopped.${NC}"
echo ""
