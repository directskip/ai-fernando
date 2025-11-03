#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building and pushing Fernando Web Docker image...${NC}"

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPO_NAME="fernando-web"
ECR_REPO_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

echo -e "${GREEN}AWS Account: $AWS_ACCOUNT_ID${NC}"
echo -e "${GREEN}AWS Region: $AWS_REGION${NC}"
echo -e "${GREEN}ECR Repository: $ECR_REPO_URI${NC}"

# Change to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Building Docker image...${NC}"
docker build -f infrastructure/Dockerfile -t fernando-web:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}Docker image built successfully${NC}"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO_URI"

if [ $? -ne 0 ]; then
    echo -e "${RED}ECR login failed${NC}"
    exit 1
fi

echo -e "${GREEN}Logged in to ECR${NC}"

# Tag image
echo -e "${YELLOW}Tagging image...${NC}"
docker tag fernando-web:latest "$ECR_REPO_URI:latest"
docker tag fernando-web:latest "$ECR_REPO_URI:$(date +%Y%m%d-%H%M%S)"

# Push to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push "$ECR_REPO_URI:latest"
docker push "$ECR_REPO_URI:$(date +%Y%m%d-%H%M%S)"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push image to ECR${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully pushed image to ECR${NC}"
echo -e "${GREEN}Image URI: $ECR_REPO_URI:latest${NC}"
