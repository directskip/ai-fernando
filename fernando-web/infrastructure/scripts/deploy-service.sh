#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying Fernando Web ECS service...${NC}"

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME="fernando-web-cluster"
SERVICE_NAME="fernando-web-service"

echo -e "${GREEN}Cluster: $CLUSTER_NAME${NC}"
echo -e "${GREEN}Service: $SERVICE_NAME${NC}"
echo -e "${GREEN}Region: $AWS_REGION${NC}"

# Force new deployment
echo -e "${YELLOW}Forcing new ECS service deployment...${NC}"
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --force-new-deployment \
  --region "$AWS_REGION"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update ECS service${NC}"
    exit 1
fi

echo -e "${GREEN}ECS service update initiated${NC}"

# Wait for deployment
echo -e "${YELLOW}Waiting for deployment to stabilize (this may take a few minutes)...${NC}"

for i in {1..60}; do
    DEPLOYMENT_COUNT=$(aws ecs describe-services \
      --cluster "$CLUSTER_NAME" \
      --services "$SERVICE_NAME" \
      --query 'services[0].deployments | length(@)' \
      --region "$AWS_REGION" \
      --output text)

    if [ "$DEPLOYMENT_COUNT" -eq 1 ]; then
        echo -e "${GREEN}Deployment complete${NC}"
        break
    fi

    echo -n "."
    sleep 10
done

# Get service details
echo -e "${YELLOW}Service details:${NC}"
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
  --output table

echo -e "${GREEN}Deployment complete!${NC}"
