# Fernando Web - AWS CDK Infrastructure Index

Complete AWS CDK infrastructure for deploying Fernando Web (Next.js) to ECS Fargate.

## Quick Navigation

### Getting Started (Start Here!)
1. **[QUICK_START.md](infrastructure/QUICK_START.md)** - 5-minute deployment guide
2. **[SETUP_GUIDE.md](infrastructure/SETUP_GUIDE.md)** - Complete step-by-step setup

### For Deployment
3. **[DEPLOYMENT_CHECKLIST.md](infrastructure/DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment validation
4. **[Deployment Scripts](infrastructure/scripts/)** - Automated deployment helpers

### For Reference
5. **[README.md](infrastructure/README.md)** - Architecture and operations
6. **[DEPLOYMENT_SUMMARY.md](infrastructure/DEPLOYMENT_SUMMARY.md)** - Complete overview

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                  AWS Infrastructure                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  🌐 Internet                                             │
│    ↓                                                      │
│  📊 Application Load Balancer (fernando-web-alb)        │
│    ↓                                                      │
│  🎯 Target Group                                         │
│    ↓                                                      │
│  📦 ECS Service (fernando-web-service)                   │
│    ├─ Task 1 (256 CPU, 512 MB) ─┐                      │
│    └─ Task 2 (256 CPU, 512 MB) ─┼─ Auto-scaling (1-4) │
│                                   │                       │
│  🐳 ECR Repository (fernando-web) ←┘                    │
│    ├─ Docker Images                                      │
│    └─ Image Scanning                                     │
│                                                           │
│  📝 CloudWatch Logs                                      │
│    └─ /ecs/fernando-web-service (30-day retention)    │
│                                                           │
│  🔒 Security Groups & VPC                               │
│    ├─ Private Subnets (Tasks)                           │
│    ├─ Public Subnet (ALB)                               │
│    └─ NAT Gateway (Egress)                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## File Structure

### Core Infrastructure Code
```
infrastructure/
├── src/
│   ├── index.ts                    CDK app entry point
│   └── stacks/
│       └── fernando-web-stack.ts   Main stack (~600 lines)
```

**What the stack creates:**
- ECS Fargate cluster
- ECS service with auto-scaling
- Application Load Balancer
- Target groups with health checks
- ECR repository
- VPC with subnets and NAT Gateway
- Security groups (ALB and ECS)
- CloudWatch Log Group
- IAM roles and policies
- Auto-scaling configuration

### Configuration Files
```
infrastructure/
├── package.json          NPM dependencies
├── tsconfig.json         TypeScript config
├── cdk.json             CDK configuration
├── Dockerfile           Multi-stage Docker build
├── .dockerignore         Docker exclusions
├── .gitignore           Git exclusions
└── config.example.ts    Configuration template
```

### Deployment Scripts
```
infrastructure/scripts/
├── build-and-push.sh    Build & push Docker image to ECR
├── deploy-service.sh    Update & deploy ECS service
├── logs.sh             Stream CloudWatch logs
└── status.sh           Check service/task status
```

### Documentation
```
infrastructure/
├── QUICK_START.md              5-minute deployment
├── SETUP_GUIDE.md              Comprehensive guide (20 pages)
├── README.md                   Architecture details
├── DEPLOYMENT_CHECKLIST.md     Validation checklist
├── DEPLOYMENT_SUMMARY.md       This deployment summary
└── config.example.ts           Configuration template
```

## Key Deployment Steps

### 1. Prerequisites (5 minutes)
```bash
# Install required tools
brew install awscliv2 node@20 docker
npm install -g aws-cdk

# Configure AWS
aws configure
```

### 2. Bootstrap AWS CDK (5 minutes, one-time)
```bash
cd infrastructure
npm install
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### 3. Deploy Infrastructure (10-15 minutes)
```bash
npm run cdk:deploy
# Confirms all resources to be created
# Creates: ECS, ALB, VPC, ECR, CloudWatch, etc.
```

### 4. Build & Push Docker Image (5 minutes)
```bash
cd ..
docker build -f infrastructure/Dockerfile -t fernando-web:latest .
cd infrastructure
bash scripts/build-and-push.sh
```

### 5. Deploy Service (5 minutes)
```bash
bash scripts/deploy-service.sh
# Waits for deployment to stabilize
```

### 6. Access Application (Immediate)
```bash
# Get ALB DNS name and open in browser
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?LoadBalancerName==`fernando-web-alb`].DNSName' \
  --output text
```

**Total time: ~40 minutes**

## Environment Variables

The stack reads from `.env.production`:

| Variable | Purpose | Example |
|----------|---------|---------|
| NEXTAUTH_URL | Auth endpoint | https://fernando.iwantmyown.com |
| NEXTAUTH_SECRET | Auth secret (32+ chars) | fernando-production-secret-... |
| NEXT_PUBLIC_FERNANDO_API_URL | API gateway | https://p1k9c6b251.execute-api.us-east-1.amazonaws.com/prod |
| NEXT_PUBLIC_TENANT_ID | Tenant identifier | peter |
| NEXT_PUBLIC_WS_URL | WebSocket URL | wss://m8xcc0194m.execute-api.us-east-1.amazonaws.com/prod |

All are injected into task definition automatically.

## AWS Resources Created

### Compute
- **ECS Cluster**: `fernando-web-cluster`
- **ECS Service**: `fernando-web-service` (2 tasks, auto-scale 1-4)
- **Task Definition**: `fernando-web-task` (256 CPU, 512 MB)

### Load Balancing
- **Application Load Balancer**: `fernando-web-alb`
- **Target Group**: Health checks on `/` every 30s

### Storage & Images
- **ECR Repository**: `fernando-web` (image scanning enabled)

### Networking
- **VPC**: Custom with 2 AZs
- **Security Groups**: ALB + ECS (proper port/protocol rules)
- **NAT Gateway**: For private subnet egress

### Monitoring
- **CloudWatch Log Group**: `/ecs/fernando-web-service` (30-day retention)
- **Container Insights**: Enabled for metrics

### IAM
- **Task Execution Role**: ECR, CloudWatch, Secrets Manager access
- **Task Role**: Application permissions (extensible)

## Useful Commands

### Deployment & Updates
```bash
# Build & deploy Docker image
docker build -f infrastructure/Dockerfile -t fernando-web:latest .
cd infrastructure && bash scripts/build-and-push.sh
bash scripts/deploy-service.sh

# Update infrastructure code
npm run cdk:diff
npm run cdk:deploy

# Destroy all resources
cdk destroy
```

### Monitoring & Debugging
```bash
# View service status
bash scripts/status.sh

# Stream logs
bash scripts/logs.sh

# List tasks
aws ecs list-tasks --cluster fernando-web-cluster

# Describe service
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service

# View ALB details
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?LoadBalancerName==`fernando-web-alb`]'
```

### Scaling
```bash
# View current task count
bash scripts/status.sh

# Manual scale (e.g., 3 tasks)
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --desired-count 3
```

## Cost Estimation

**Monthly breakdown (us-east-1)**:
- NAT Gateway: $32/month
- ALB: $16/month + data processing
- ECS Fargate (2×256 CPU, 512MB): $15-30/month
- ECR: <$1/month
- CloudWatch: $2-5/month
- **Total**: ~$65-85/month

## Documentation Map

```
START HERE
    ↓
QUICK_START.md (5 min)
    ↓
    ├─→ Ready to deploy? → SETUP_GUIDE.md (detailed)
    │
    └─→ During deployment → DEPLOYMENT_CHECKLIST.md
    │
    └─→ Post-deployment → README.md (operations)
```

### By Use Case

**First-time deployer**
1. QUICK_START.md
2. SETUP_GUIDE.md (sections 1-5)
3. DEPLOYMENT_CHECKLIST.md (pre-deployment)
4. Deploy → DEPLOYMENT_CHECKLIST.md (post-deployment)

**DevOps/Infrastructure**
1. DEPLOYMENT_SUMMARY.md (overview)
2. src/stacks/fernando-web-stack.ts (code)
3. README.md (detailed)

**Operational**
1. README.md (monitoring section)
2. DEPLOYMENT_CHECKLIST.md (common issues)
3. scripts/ (automation)

**Troubleshooting**
1. SETUP_GUIDE.md (troubleshooting section)
2. scripts/status.sh and scripts/logs.sh
3. DEPLOYMENT_CHECKLIST.md (post-deployment)

## Architecture Decisions

### Fargate vs EC2
✅ **Fargate** chosen for:
- Reduced operational overhead
- Automatic patching
- Pay-per-task pricing
- Perfect for containerized apps

### Single vs Multi-Region
✅ **Single region** (us-east-1) for:
- Simplicity
- Cost reduction
- Matches existing API deployment

### Network Configuration
✅ **Private subnets** for:
- Security (no direct internet access to tasks)
- Use NAT Gateway for outbound
- ALB handles inbound

### Monitoring
✅ **Container Insights** for:
- Native CloudWatch integration
- CPU/memory metrics
- Task-level visibility

### Scaling
✅ **CPU + Memory scaling** for:
- Responsive to load
- Multiple metrics reduce flapping
- Conservative targets (70%, 80%)

## Customization Examples

### Run Single Task (Dev)
```typescript
const taskCount = 1;
const desiredCount = 1;
maxCapacity = 1;
```

### Larger Tasks
```typescript
const containerCpu = 512;
const containerMemory = 1024;
```

### Add Custom Domain
```typescript
// Create Route53 record pointing to ALB
// Update NEXTAUTH_URL in .env.production
```

### Enable HTTPS
```typescript
// Request ACM certificate
// Update ALB listener to HTTPS (port 443)
// Redirect HTTP to HTTPS
```

### Connect to Database
```typescript
// Add RDS security group rule
// Add DB credentials via Secrets Manager
// Update task role permissions
```

## Security Checklist

✅ **Network Security**
- Tasks in private subnets
- NAT Gateway for egress
- Security groups restrict traffic

✅ **Image Security**
- ECR image scanning enabled
- Non-root user in container (UID 1001)
- Multi-stage build (small image)

✅ **Access Control**
- IAM roles with minimal permissions
- Task execution role for container startup
- Task role for application runtime

✅ **Secrets Management**
- Environment variables injected at runtime
- Sensitive data ready for Secrets Manager
- Task role has SecretsManager permissions

## Next Steps

1. **Read QUICK_START.md** (5 minutes)
   ```bash
   cat infrastructure/QUICK_START.md
   ```

2. **Review architecture** (10 minutes)
   ```bash
   cat infrastructure/README.md
   ```

3. **Start deployment** (40 minutes total)
   ```bash
   cd infrastructure
   npm install
   cdk bootstrap aws://ACCOUNT_ID/us-east-1
   cdk deploy
   ```

4. **Build & deploy app** (10 minutes)
   ```bash
   docker build -f infrastructure/Dockerfile -t fernando-web:latest .
   cd infrastructure && bash scripts/build-and-push.sh
   bash scripts/deploy-service.sh
   ```

5. **Monitor & operate** (ongoing)
   ```bash
   bash scripts/status.sh
   bash scripts/logs.sh
   ```

## Support Resources

- **AWS CDK Docs**: https://docs.aws.amazon.com/cdk/
- **ECS Docs**: https://docs.aws.amazon.com/ecs/
- **AWS CLI**: https://aws.amazon.com/cli/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **GitHub Issues**: https://github.com/aws/aws-cdk/issues

## Contact & Questions

For infrastructure issues:
1. Check SETUP_GUIDE.md troubleshooting section
2. Review CloudWatch logs: `bash scripts/logs.sh`
3. Check service status: `bash scripts/status.sh`
4. Review AWS Console for detailed error messages

---

**Created**: November 2, 2024
**Version**: 1.0.0
**Framework**: AWS CDK v2.100+
**Runtime**: Node.js 20 LTS, Next.js 15

**Last updated**: 2024-11-02
