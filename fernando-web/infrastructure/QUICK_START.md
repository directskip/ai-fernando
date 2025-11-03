# Quick Start Guide - 5 Minutes to Deployment

Get your Fernando Web application running on AWS ECS in just a few steps.

## Prerequisites Checklist

Before starting, ensure you have:
```bash
✓ AWS account with credentials configured: aws configure
✓ Node.js v18+: node --version
✓ AWS CDK installed: npm install -g aws-cdk
✓ Docker installed: docker --version
```

## 5-Minute Quick Start

### 1. Setup Infrastructure (2 minutes)

```bash
# Navigate to infrastructure directory
cd /path/to/fernando-web/infrastructure

# Install dependencies
npm install

# Bootstrap AWS CDK (first time only)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# Deploy infrastructure to AWS
cdk deploy
# Answer "y" when prompted to confirm deployment
# Wait for completion (5-10 minutes)
```

**Save the outputs** shown at the end - you'll need them later.

### 2. Build and Push Docker Image (2 minutes)

```bash
# Go to project root
cd ..

# Build Docker image
docker build -f infrastructure/Dockerfile -t fernando-web:latest .

# Push to ECR (using provided script)
cd infrastructure
bash scripts/build-and-push.sh
```

### 3. Deploy Service (1 minute)

```bash
# Deploy updated service
bash scripts/deploy-service.sh

# Wait for deployment to complete
bash scripts/status.sh
```

### 4. Access Your Application

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?LoadBalancerName==`fernando-web-alb`].DNSName' \
  --output text
```

Open the DNS name in your browser: `http://fernando-web-alb-xxxx.us-east-1.elb.amazonaws.com`

## Useful Commands

```bash
# View service status
bash scripts/status.sh

# Stream logs
bash scripts/logs.sh

# View recent logs without streaming
bash scripts/logs.sh ""

# Update application code (after making changes)
docker build -f infrastructure/Dockerfile -t fernando-web:latest . && \
cd infrastructure && \
bash scripts/build-and-push.sh && \
bash scripts/deploy-service.sh

# Cleanup resources
cdk destroy
```

## Environment Variables

The stack uses variables from `.env.production`:
- `NEXTAUTH_URL` - Your app's URL
- `NEXTAUTH_SECRET` - Secret key for auth
- `NEXT_PUBLIC_FERNANDO_API_URL` - API endpoint
- `NEXT_PUBLIC_TENANT_ID` - Tenant ID
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

Update `.env.production` before deployment if needed.

## Architecture Created

```
┌─────────────────────────────────────────────────┐
│              AWS ECS Infrastructure              │
├─────────────────────────────────────────────────┤
│                                                   │
│  Internet → ALB (fernando-web-alb)              │
│              ↓                                    │
│         Target Group                            │
│              ↓                                    │
│    ECS Service (fernando-web-service)           │
│         ↙       ↙                               │
│    Task 1   Task 2 (Auto-scaling: 1-4)         │
│    (Running in private subnets)                 │
│              ↓                                    │
│         ECR Repository                          │
│         Docker Images                           │
│              ↓                                    │
│         CloudWatch Logs                         │
│         /ecs/fernando-web-service               │
│                                                   │
└─────────────────────────────────────────────────┘
```

## Key Resources

| Resource | Name | Details |
|----------|------|---------|
| ECS Cluster | fernando-web-cluster | Fargate cluster |
| ECS Service | fernando-web-service | 2 tasks (1-4 with auto-scaling) |
| Task Definition | fernando-web-task | 256 CPU, 512 MB memory |
| ECR Repository | fernando-web | Docker image storage |
| Load Balancer | fernando-web-alb | Application Load Balancer |
| VPC | Auto-created | 2 AZs, NAT Gateway |
| Logs | /ecs/fernando-web-service | CloudWatch Log Group |

## Monitoring

```bash
# Check service health
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service

# View running tasks
aws ecs list-tasks \
  --cluster fernando-web-cluster

# Stream logs in real-time
bash scripts/logs.sh

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## Common Issues

### Tasks won't start
```bash
# Check logs for errors
bash scripts/logs.sh

# Verify image exists in ECR
aws ecr describe-images --repository-name fernando-web
```

### ALB returns 502
```bash
# Check if tasks are running
bash scripts/status.sh

# Check target group health
aws elbv2 describe-target-health --target-group-arn <arn>
```

### Can't push Docker image
```bash
# Make sure you're logged in to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

## Scaling

Auto-scaling is already configured (min: 1, max: 4 tasks).

To manually scale:
```bash
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --desired-count 3
```

## Cleanup

Remove all AWS resources to stop charges:
```bash
cd infrastructure
cdk destroy
```

## Next Steps

1. **Monitor your app** - Check logs regularly
2. **Update your app** - Rebuild and redeploy when code changes
3. **Setup custom domain** - Use Route53 + ACM certificate
4. **Enable HTTPS** - Add TLS to ALB listener
5. **Scale up** - Increase task count if needed

## Detailed Documentation

- [Complete Setup Guide](SETUP_GUIDE.md)
- [README with Architecture Details](README.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

---

**Need help?**
- View logs: `bash scripts/logs.sh`
- Check status: `bash scripts/status.sh`
- AWS CDK docs: https://docs.aws.amazon.com/cdk/
- ECS docs: https://docs.aws.amazon.com/ecs/
