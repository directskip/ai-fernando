# ECS Deployment Guide for Fernando Web

This guide documents the complete setup for deploying the Fernando Web application to AWS ECS with GitHub Actions CI/CD.

## Overview

The deployment pipeline automates building, containerizing, and deploying the Next.js application to Amazon ECS. The workflow:
1. Builds Docker image in GitHub Actions
2. Pushes image to AWS ECR (Elastic Container Registry)
3. Updates ECS service with new image
4. Auto-triggers on push to main branch

## Prerequisites

Before starting, ensure you have:
- AWS account with appropriate permissions
- GitHub repository with admin access
- AWS CLI installed locally (for verification)
- Docker installed locally (for local testing)

## Step 1: Configure GitHub Secrets

Add the following secrets to your GitHub repository settings (`Settings > Secrets and Variables > Actions`):

### Required Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | IAM user access key for AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key | IAM user secret key for AWS authentication |
| `AWS_REGION` | `us-east-1` | AWS region for ECR and ECS resources |
| `AWS_ACCOUNT_ID` | `640303036491` | AWS account ID for ECR repository URL |

### How to Create AWS Credentials

1. Sign in to AWS Management Console
2. Go to IAM > Users > Create User (or use existing)
3. Attach policy: `AmazonEC2ContainerRegistryPowerUser` for ECR push
4. Attach policy: `AmazonECS_FullAccess` for ECS updates
5. Generate access keys under Security Credentials
6. Add keys to GitHub Secrets

### GitHub Secrets Setup Command

```bash
# Using GitHub CLI
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_KEY"
gh secret set AWS_REGION --body "us-east-1"
gh secret set AWS_ACCOUNT_ID --body "640303036491"
```

## Step 2: Create AWS Resources

### 2.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name fernando-web \
  --region us-east-1
```

**Output**: You'll receive an ECR repository URI like:
```
640303036491.dkr.ecr.us-east-1.amazonaws.com/fernando-web
```

### 2.2 Create VPC and Subnets (or use default)

**Option A: Use Default VPC** (Recommended for quick start)
```bash
# Verify default VPC exists
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region us-east-1
```

**Option B: Create Custom VPC**
```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region us-east-1 \
  --query 'Vpc.VpcId' --output text)

# Create subnets (2 for load balancer)
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --query 'Subnet.SubnetId' --output text)

SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --query 'Subnet.SubnetId' --output text)

# Create Internet Gateway
IGW=$(aws ec2 create-internet-gateway \
  --query 'InternetGateway.InternetGatewayId' --output text)

aws ec2 attach-internet-gateway --internet-gateway-id $IGW --vpc-id $VPC_ID

# Create route table
RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)

# Add route to IGW
aws ec2 create-route --route-table-id $RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW
```

### 2.3 Create Security Groups

**ALB Security Group** (allows HTTP/HTTPS traffic)
```bash
ALB_SG=$(aws ec2 create-security-group \
  --group-name fernando-alb-sg \
  --description "Security group for Fernando ALB" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow HTTP
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

**ECS Task Security Group** (allows traffic from ALB)
```bash
ECS_SG=$(aws ec2 create-security-group \
  --group-name fernando-ecs-sg \
  --description "Security group for Fernando ECS tasks" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow traffic from ALB to port 3000
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp --port 3000 \
  --source-group $ALB_SG
```

### 2.4 Create Application Load Balancer

```bash
# Create ALB
ALB=$(aws elbv2 create-load-balancer \
  --name fernando-alb \
  --subnets $SUBNET_1 $SUBNET_2 \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Get ALB DNS name
aws elbv2 describe-load-balancers --load-balancer-arns $ALB --query 'LoadBalancers[0].DNSName'

# Create target group
TG=$(aws elbv2 create-target-group \
  --name fernando-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Configure health check
aws elbv2 modify-target-group \
  --target-group-arn $TG \
  --health-check-path "/" \
  --health-check-protocol HTTP \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG
```

### 2.5 Create IAM Roles

**ECS Task Execution Role** (allows ECS to pull images from ECR)
```bash
# Create role
EXEC_ROLE=$(aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --query 'Role.Arn' --output text)

# Attach policy for ECR access
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

**ECS Task Role** (allows container to access AWS services)
```bash
# Create role
TASK_ROLE=$(aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --query 'Role.Arn' --output text)

# Attach policies for application needs (Bedrock, DynamoDB, etc.)
aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

### 2.6 Create ECS Cluster

```bash
# Create cluster
CLUSTER=$(aws ecs create-cluster \
  --cluster-name fernando-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1,base=1 \
  --query 'cluster.clusterName' --output text)

echo "Cluster created: $CLUSTER"
```

## Step 3: Create ECS Task Definition

Create a task definition that pulls from ECR and runs your Next.js app:

```bash
# Register task definition
aws ecs register-task-definition \
  --family fernando-web-task \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 256 \
  --memory 512 \
  --execution-role-arn $EXEC_ROLE \
  --task-role-arn $TASK_ROLE \
  --container-definitions '[
    {
      "name": "fernando-web",
      "image": "640303036491.dkr.ecr.us-east-1.amazonaws.com/fernando-web:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fernando-web",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ]
    }
  ]'
```

**Note**: Adjust CPU (256, 512, 1024, 2048, 4096) and memory based on your needs.

## Step 4: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster fernando-cluster \
  --service-name fernando-web-service \
  --task-definition fernando-web-task:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[$SUBNET_1,$SUBNET_2],
    securityGroups=[$ECS_SG],
    assignPublicIp=ENABLED
  }" \
  --load-balancers "targetGroupArn=$TG,containerName=fernando-web,containerPort=3000" \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
  --enable-ecs-managed-tags
```

## Step 5: Create GitHub Actions Workflow

Create `.github/workflows/deploy-ecs.yml`:

```yaml
name: Deploy to ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: fernando-web
  ECS_SERVICE: fernando-web-service
  ECS_CLUSTER: fernando-cluster
  ECS_TASK_DEFINITION: fernando-web-task

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        id: image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: .github/task-definition.json
          container-name: fernando-web
          image: ${{ steps.image.outputs.image }}

      - name: Deploy to Amazon ECS service
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

Create `.github/task-definition.json`:

```json
{
  "family": "fernando-web-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::640303036491:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::640303036491:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "fernando-web",
      "image": "640303036491.dkr.ecr.us-east-1.amazonaws.com/fernando-web:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fernando-web",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

## Step 6: Create Dockerfile

Create `Dockerfile` in repository root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
```

## Step 7: Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/fernando-web \
  --region us-east-1

# Set retention policy (optional)
aws logs put-retention-policy \
  --log-group-name /ecs/fernando-web \
  --retention-in-days 7
```

## Step 8: Verify Deployment

### Check GitHub Actions Workflow

1. Push a change to main branch
2. Go to GitHub repository > Actions
3. Monitor the "Deploy to ECS" workflow
4. Verify each step completes successfully

### Check ECS Service Status

```bash
# View service status
aws ecs describe-services \
  --cluster fernando-cluster \
  --services fernando-web-service \
  --region us-east-1 \
  --query 'services[0].[status,desiredCount,runningCount]'

# View task status
aws ecs list-tasks \
  --cluster fernando-cluster \
  --service-name fernando-web-service \
  --region us-east-1

# View task details
aws ecs describe-tasks \
  --cluster fernando-cluster \
  --tasks <TASK_ARN> \
  --region us-east-1
```

### Check Application Health

```bash
# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names fernando-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test endpoint
curl http://$ALB_DNS/
```

### Check Logs

```bash
# View recent logs
aws logs tail /ecs/fernando-web --follow --region us-east-1
```

## Deployment Workflow

### Automatic (Default)

1. Make changes to code
2. Commit to main branch
3. GitHub Actions triggers automatically
4. Docker image builds and pushes to ECR
5. ECS task definition updates with new image
6. ECS service pulls new task definition
7. Deployment complete (rolling update)

### Manual Deployment

```bash
# Force new deployment without code changes
aws ecs update-service \
  --cluster fernando-cluster \
  --service fernando-web-service \
  --force-new-deployment \
  --region us-east-1
```

### Rollback

```bash
# Revert to previous task definition version
aws ecs update-service \
  --cluster fernando-cluster \
  --service fernando-web-service \
  --task-definition fernando-web-task:2 \
  --region us-east-1
```

## Cost Estimation

| Resource | Pricing | Monthly Cost |
|----------|---------|--------------|
| ECR | $0.10 per GB stored | ~$1 |
| ECS (Fargate 256 CPU, 512 MB) | $0.01295 per hour | ~$9.50/task |
| ALB | $0.0225/hour + $0.006/LCU | ~$20 |
| CloudWatch Logs | $0.50 per GB | ~$1-5 |
| Data Transfer | $0.12/GB out | ~$5-10 |
| **Total (2 tasks)** | - | **~$50-70/month** |

## Troubleshooting

### Issue: Task fails to start

**Solutions**:
1. Check CloudWatch logs: `aws logs tail /ecs/fernando-web --follow`
2. Verify task role has required permissions
3. Check port 3000 is accessible from ALB security group
4. Verify ECR image URI is correct in task definition

### Issue: Deployment stuck at "Waiting for service stability"

**Solutions**:
1. Check target group health checks: `aws elbv2 describe-target-health --target-group-arn <ARN>`
2. Verify container health check in task definition
3. Check application logs for startup errors
4. Increase `wait-for-service-stability` timeout in GitHub Actions

### Issue: Image push fails from GitHub Actions

**Solutions**:
1. Verify AWS credentials in GitHub Secrets
2. Check IAM user has `AmazonEC2ContainerRegistryPowerUser` policy
3. Verify ECR repository exists
4. Check account ID matches AWS_ACCOUNT_ID secret

### Issue: Application not accessible via ALB

**Solutions**:
1. Verify security group allows traffic from ALB to port 3000
2. Check health check is passing: `aws elbv2 describe-target-health --target-group-arn <ARN>`
3. Verify application is listening on 0.0.0.0:3000 (not localhost)
4. Check ALB is in correct subnets with internet gateway

## Next Steps

1. **Set up custom domain**: Use Route 53 to create DNS record pointing to ALB
2. **Enable HTTPS**: Request SSL certificate from ACM and attach to ALB listener
3. **Auto-scaling**: Configure CloudWatch alarms and auto-scaling policies
4. **Monitoring**: Set up CloudWatch dashboards and SNS alerts
5. **Backup**: Configure EBS snapshots and database backups

## References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [GitHub Actions AWS Integration](https://github.com/aws-actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: November 2, 2025
**Status**: Complete and Ready for Deployment
