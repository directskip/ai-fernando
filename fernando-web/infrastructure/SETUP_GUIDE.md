# AWS CDK Infrastructure Setup Guide for Fernando Web

This guide walks you through setting up and deploying the Fernando Web Next.js application to AWS ECS Fargate.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Deployment](#deployment)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

### 1. AWS Account
- Active AWS account with appropriate permissions
- AWS Management Console access

### 2. Local Tools

Install the following tools on your machine:

**AWS CLI** (v2 or higher):
```bash
# macOS (using Homebrew)
brew install awscliv2

# or download from
https://aws.amazon.com/cli/

# Verify installation
aws --version
```

**Node.js** (v18 or higher):
```bash
# Using Homebrew (macOS)
brew install node@20

# or download from
https://nodejs.org/

# Verify installation
node --version
npm --version
```

**AWS CDK CLI**:
```bash
npm install -g aws-cdk

# Verify installation
cdk --version
```

**Docker**:
```bash
# Download from
https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
```

### 3. AWS Credentials

Configure your AWS credentials:

```bash
# Interactive configuration
aws configure

# You'll be prompted for:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (use: us-east-1)
# - Default output format (use: json)
```

To get credentials:
1. Go to AWS Management Console
2. IAM > Users > Your User
3. Security credentials > Create access key
4. Download and configure locally

## Quick Start

If you're familiar with AWS and want to get started quickly:

```bash
# 1. Navigate to infrastructure directory
cd infrastructure

# 2. Install dependencies
npm install

# 3. Bootstrap CDK (first time only)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# 4. Deploy
cdk deploy

# 5. Build and push Docker image
bash scripts/build-and-push.sh

# 6. Deploy service
bash scripts/deploy-service.sh
```

## Detailed Setup

### Step 1: Prepare Your Environment

```bash
# Set environment variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
```

Save these in your shell profile (`.bashrc`, `.zshrc`, etc.) for persistent use.

### Step 2: Install Dependencies

```bash
# Navigate to infrastructure directory
cd /path/to/fernando-web/infrastructure

# Install Node.js dependencies
npm install
```

Expected output:
```
added 150 packages in 45s
```

### Step 3: Bootstrap AWS CDK

Bootstrap sets up necessary AWS resources for CDK:

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK
cdk bootstrap aws://$AWS_ACCOUNT_ID/us-east-1
```

This creates:
- An S3 bucket for CDK artifacts
- IAM roles and policies
- CloudFormation stack

Expected output:
```
 ⏳ Bootstrapping environment aws://123456789012/us-east-1...
 ✅ Environment aws://123456789012/us-east-1 bootstrapped.
```

### Step 4: Review the Infrastructure

Synthesize the CloudFormation template:

```bash
npm run cdk:synth
```

This generates `cdk.out/FernandoWebStack.template.json` - the CloudFormation template that will be deployed.

Review the deployment plan:

```bash
npm run cdk:diff
```

This shows all resources that will be created with their configurations.

### Step 5: Configure Environment Variables

The infrastructure uses environment variables from `.env.production`:

```bash
# View current configuration
cat ../.env.production

# Output should include:
# NEXTAUTH_URL=https://fernando.iwantmyown.com
# NEXT_PUBLIC_FERNANDO_API_URL=https://...
# NEXT_PUBLIC_TENANT_ID=peter
# NEXT_PUBLIC_WS_URL=wss://...
# NEXTAUTH_SECRET=...
```

Update these values if needed for your deployment environment.

## Deployment

### Step 1: Deploy Infrastructure

Deploy the CDK stack to AWS:

```bash
npm run cdk:deploy
```

You'll be prompted to confirm:
```
Do you wish to deploy these changes (y/n)? y
```

Deployment takes approximately 10-15 minutes. Monitor progress in the console.

After successful deployment, you'll see outputs:

```
Outputs:
FernandoWebStack.ALBDnsName = fernando-web-alb-1234.us-east-1.elb.amazonaws.com
FernandoWebStack.ECRRepositoryUri = 123456789012.dkr.ecr.us-east-1.amazonaws.com/fernando-web
FernandoWebStack.ClusterName = fernando-web-cluster
FernandoWebStack.ServiceName = fernando-web-service
FernandoWebStack.LogGroupName = /ecs/fernando-web-service
FernandoWebStack.ECRRepositoryName = fernando-web
```

**Save these outputs** - you'll need them for deployment.

### Step 2: Build Docker Image

Navigate to the project root and build the Docker image:

```bash
# From project root
cd ..

# Build image
docker build -f infrastructure/Dockerfile -t fernando-web:latest .
```

Expected output:
```
[+] Building 45.2s (15/15) FINISHED
 => => pushing layers                                    42.3s
 => => pushing manifest sha256:abc123...                 2.1s
```

### Step 3: Push to ECR

Use the provided script or manual commands:

**Using script (recommended):**
```bash
cd infrastructure
bash scripts/build-and-push.sh
```

**Manual steps:**
```bash
# Get ECR repository URI
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_URI="$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fernando-web"

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin "$ECR_REPO_URI"

# Tag image
docker tag fernando-web:latest "$ECR_REPO_URI:latest"

# Push image
docker push "$ECR_REPO_URI:latest"
```

Expected output:
```
latest: digest: sha256:abc123... size: 5000
```

### Step 4: Deploy Service

Update ECS service to use the new image:

```bash
bash scripts/deploy-service.sh
```

Or manually:
```bash
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --force-new-deployment \
  --region us-east-1
```

The script waits for the deployment to complete (typically 2-5 minutes).

## Post-Deployment

### Verify Deployment

Check service status:

```bash
bash scripts/status.sh
```

Expected output:
```
========================================
Fernando Web ECS Service Status
========================================

Service Status:
serviceName | status | runningCount | desiredCount | pendingCount
fernando-web-service | ACTIVE | 2 | 2 | 0

Task Status:
taskArn | lastStatus | taskDefinitionArn
...ecs/fernando-web-task:1 | RUNNING | ...
```

### Access Your Application

Get the ALB DNS name:

```bash
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?LoadBalancerName==`fernando-web-alb`].DNSName' \
  --region us-east-1 \
  --output text
```

Open in browser:
```
http://fernando-web-alb-xxxx.us-east-1.elb.amazonaws.com
```

### View Logs

Stream logs in real-time:

```bash
bash scripts/logs.sh

# Or view last 100 lines without following
bash scripts/logs.sh ""
```

### Monitor Auto-scaling

Check auto-scaling metrics and activities:

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=fernando-web-service \
                Name=ClusterName,Value=fernando-web-cluster \
  --statistics Average \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300
```

## Common Tasks

### Update Application

When you update your Next.js application:

```bash
# Rebuild and push Docker image
cd infrastructure
bash scripts/build-and-push.sh

# Deploy updated image
bash scripts/deploy-service.sh

# Monitor deployment
bash scripts/status.sh
```

### Scale Service Manually

```bash
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --desired-count 3 \
  --region us-east-1
```

### View Service Details

```bash
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service \
  --region us-east-1
```

### List Running Tasks

```bash
aws ecs list-tasks \
  --cluster fernando-web-cluster \
  --service-name fernando-web-service \
  --region us-east-1
```

### Execute Command in Running Task

```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster fernando-web-cluster \
  --service-name fernando-web-service \
  --query 'taskArns[0]' \
  --output text \
  --region us-east-1)

# Execute command
aws ecs execute-command \
  --cluster fernando-web-cluster \
  --task "$TASK_ARN" \
  --container FernandoWebContainer \
  --interactive \
  --command "/bin/sh"
```

## Troubleshooting

### Deployment Fails at Stack Creation

**Error**: "The user is not authorized to perform: ec2:CreateSecurityGroup"

**Solution**: Ensure your AWS user has appropriate IAM permissions. Required policies:
- AmazonEC2FullAccess
- AmazonECSFullAccess
- AmazonECRFullAccess
- IAMFullAccess
- CloudFormationFullAccess
- CloudWatchLogsFullAccess
- ElasticLoadBalancingFullAccess

### Docker Build Fails

**Error**: "COPY failed: file not found"

**Solution**:
```bash
# Ensure you're in the project root directory
pwd
# Should show: /path/to/fernando-web

# Check Dockerfile path
ls -la infrastructure/Dockerfile

# Build with correct path
docker build -f infrastructure/Dockerfile -t fernando-web:latest .
```

### Image Push Fails

**Error**: "denied: User: arn:aws:iam::... is not authorized to perform: ecr:GetDownloadUrlForLayer"

**Solution**: ECR repository might not exist or needs proper permissions
```bash
# Check repository exists
aws ecr describe-repositories --repository-names fernando-web

# If it doesn't exist, create it manually
aws ecr create-repository --repository-name fernando-web

# Ensure you're logged in
aws ecr get-login-password | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
```

### Tasks Won't Start

**Error**: "Essential container in task exited"

**Causes**:
1. Docker image not found in ECR
2. Environment variables misconfigured
3. Application crashes at startup

**Solution**:
```bash
# Check logs
bash scripts/logs.sh

# Verify image exists
aws ecr describe-images --repository-name fernando-web

# Check task definition
aws ecs describe-task-definition \
  --task-definition fernando-web-task \
  --query 'taskDefinition.containerDefinitions[0]' \
  --output json
```

### ALB Returns 502 Bad Gateway

**Causes**:
1. Tasks not healthy
2. Security group blocking traffic
3. Application not listening on correct port

**Solution**:
```bash
# Check task health
bash scripts/status.sh

# Verify security groups
aws ec2 describe-security-groups \
  --filter "Name=group-name,Values=ECSSecurityGroup"

# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### Logs Not Appearing

**Causes**:
1. CloudWatch Logs group doesn't exist
2. Task execution role missing permissions
3. Application not writing to stdout/stderr

**Solution**:
```bash
# Check log group exists
aws logs describe-log-groups --log-group-name-prefix /ecs/

# Check task execution role permissions
aws iam get-role-policy \
  --role-name FernandoWebTaskExecutionRole \
  --policy-name service-role/AmazonECSTaskExecutionRolePolicy

# Verify application logs to stdout
# Check app configuration in Next.js
```

### Scaling Not Working

**Causes**:
1. Scaling targets not configured
2. CloudWatch metrics not available
3. Auto-scaling role missing permissions

**Solution**:
```bash
# Check scaling targets
aws application-autoscaling describe-scaling-targets \
  --service-namespace ecs

# Check scaling policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs

# Enable Container Insights for better metrics
# This is already enabled in the stack
```

## Getting Help

- **AWS CDK Documentation**: https://docs.aws.amazon.com/cdk/
- **ECS Documentation**: https://docs.aws.amazon.com/ecs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment/docker
- **AWS Support**: https://console.aws.amazon.com/support/

## Cleanup

To destroy all resources and stop incurring costs:

```bash
# From infrastructure directory
cdk destroy

# Confirm when prompted
# Are you sure you want to delete: FernandoWebStack (y/n)? y
```

This removes all AWS resources created by the CDK stack.

**Note**: The ECR repository has a RETAIN policy, so you may need to delete it manually if you want to completely remove all traces:

```bash
aws ecr delete-repository \
  --repository-name fernando-web \
  --force
```

## Cost Estimation

Monthly costs (approximate, us-east-1):

| Service | Component | Cost |
|---------|-----------|------|
| EC2 | NAT Gateway | $32.00 |
| ELB | Application Load Balancer | $16.00 |
| ECS | 2 tasks × 256 CPU × 512 MB (variable) | $10-30 |
| ECR | Storage (2 GB) + transfers | $0.50 |
| CloudWatch | Logs + metrics | $2-5 |
| **Total** | | **$60-85/month** |

To reduce costs:
- Reduce task count to 1
- Use lifecycle policies for log retention
- Consider RDS read replicas for databases

---

**Last Updated**: 2024
**Infrastructure Version**: 1.0.0
