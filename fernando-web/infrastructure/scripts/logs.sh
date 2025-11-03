#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LOG_GROUP="/ecs/fernando-web-service"
FOLLOW=${1:-"--follow"}  # Default to follow, can be empty to get recent logs

echo -e "${YELLOW}Streaming logs from $LOG_GROUP...${NC}"
echo -e "${GREEN}Press Ctrl+C to stop${NC}"
echo ""

aws logs tail "$LOG_GROUP" $FOLLOW --timestamp
