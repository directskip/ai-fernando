#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME="fernando-web-cluster"
SERVICE_NAME="fernando-web-service"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fernando Web ECS Service Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Service status
echo -e "${YELLOW}Service Status:${NC}"
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[0].[serviceName,status,runningCount,desiredCount,pendingCount]' \
  --output table

echo ""
echo -e "${YELLOW}Task Status:${NC}"
TASK_ARNS=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'taskArns[]' \
  --output text)

if [ -z "$TASK_ARNS" ]; then
    echo "No tasks running"
else
    aws ecs describe-tasks \
      --cluster "$CLUSTER_NAME" \
      --tasks $TASK_ARNS \
      --region "$AWS_REGION" \
      --query 'tasks[*].[taskArn,lastStatus,taskDefinitionArn]' \
      --output table
fi

echo ""
echo -e "${YELLOW}Recent Events:${NC}"
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[0].events[0:5].[createdAt,message]' \
  --output table

echo ""
echo -e "${YELLOW}Auto-scaling Status:${NC}"
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --query 'ScalingActivities[0:5].[StartTime,StatusMessage,StatusCode]' \
  --output table 2>/dev/null || echo "No scaling activities found"

echo ""
echo -e "${BLUE}========================================${NC}"
