# AWS CDK Infrastructure - Code Reference

Complete code snippets and reference documentation for the Fernando Web ECS infrastructure.

## Main Stack Code Overview

### File: `src/stacks/fernando-web-stack.ts`

This is the primary CDK stack file that defines all AWS infrastructure. Here's what it contains:

**Key sections:**

1. **Imports** - AWS CDK libraries for EC2, ECS, ECR, ELB, Logs, IAM
2. **Environment Variables** - Loaded from `.env.production`
3. **VPC Setup** - Custom VPC with 2 AZs
4. **Security Groups** - ALB and ECS-specific rules
5. **ECS Cluster** - Fargate cluster with Container Insights
6. **ECR Repository** - Docker image storage
7. **CloudWatch Logs** - Centralized logging
8. **IAM Roles** - Task execution and task roles
9. **Task Definition** - Container configuration
10. **Application Load Balancer** - HTTP listener and target group
11. **ECS Service** - Manages tasks and deployment
12. **Auto-Scaling** - CPU and memory-based scaling
13. **Outputs** - Stack outputs for reference

**Total lines: ~650**

### Key Code Sections

#### VPC Creation
```typescript
const vpc = new ec2.Vpc(this, 'FernandoWebVpc', {
  maxAzs: 2,
  cidrMask: 24,
  natGateways: 1,
});
```
- 2 availability zones
- NAT Gateway for private subnet egress
- Auto-creates public and private subnets

#### Security Groups
```typescript
// ALB Security Group
const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
  vpc,
  description: 'Security group for ALB',
  allowAllOutbound: true,
});

albSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(80),
  'Allow HTTP from anywhere'
);

albSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'Allow HTTPS from anywhere'
);

// ECS Security Group
const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
  vpc,
  description: 'Security group for ECS tasks',
  allowAllOutbound: true,
});

ecsSecurityGroup.addIngressRule(
  albSecurityGroup,
  ec2.Port.tcp(containerPort),
  'Allow traffic from ALB'
);
```

#### ECS Cluster
```typescript
const cluster = new ecs.Cluster(this, 'FernandoWebCluster', {
  vpc,
  clusterName,
  containerInsights: true,  // Enable monitoring
});
```

#### Task Definition
```typescript
const taskDefinition = new ecs.FargateTaskDefinition(this, 'FernandoWebTaskDef', {
  family: taskFamily,
  cpu: containerCpu,          // 256 units
  memoryLimitMiB: containerMemory,  // 512 MB
  executionRole: taskExecutionRole,
  taskRole: taskRole,
});

const container = taskDefinition.addContainer('FernandoWebContainer', {
  image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
  portMappings: [
    {
      containerPort,
      protocol: ecs.Protocol.TCP,
    },
  ],
  logging: ecs.LogDriver.awsLogs({
    logGroup,
    streamPrefix: 'ecs',
  }),
  environment,  // From .env.production
});
```

#### Application Load Balancer
```typescript
const alb = new elbv2.ApplicationLoadBalancer(this, 'FernandoWebALB', {
  vpc,
  internetFacing: true,
  loadBalancerName: 'fernando-web-alb',
  securityGroup: albSecurityGroup,
});

const targetGroup = new elbv2.ApplicationTargetGroup(this, 'FernandoWebTargetGroup', {
  vpc,
  port: containerPort,
  protocol: elbv2.ApplicationProtocol.HTTP,
  targetType: elbv2.TargetType.IP,
  targetGroupName: 'fernando-web-tg',
  healthCheck: {
    path: '/',
    interval: cdk.Duration.seconds(30),
    timeout: cdk.Duration.seconds(5),
    healthyThresholdCount: 2,
    unhealthyThresholdCount: 3,
  },
  deregistrationDelay: cdk.Duration.seconds(30),
});

alb.addListener('FernandoWebListener', {
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,
  defaultTargetGroups: [targetGroup],
});
```

#### ECS Service
```typescript
const service = new ecs.FargateService(this, 'FernandoWebService', {
  cluster,
  taskDefinition,
  desiredCount: taskCount,          // 2 tasks
  serviceName: serviceName,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,  // Private subnets
  },
  securityGroups: [ecsSecurityGroup],
  assignPublicIp: false,  // No public IPs
});

service.attachToApplicationTargetGroup(targetGroup);
```

#### Auto-Scaling
```typescript
const scaling = service.autoScaleTaskCount({
  minCapacity: 1,  // Minimum 1 task
  maxCapacity: 4,  // Maximum 4 tasks
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,  // Scale at 70% CPU
});

scaling.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 80,  // Scale at 80% memory
});
```

#### Stack Outputs
```typescript
new cdk.CfnOutput(this, 'ALBDnsName', {
  value: alb.loadBalancerDnsName,
  description: 'DNS name of the load balancer',
  exportName: 'FernandoWebALBDnsName',
});

new cdk.CfnOutput(this, 'ECRRepositoryUri', {
  value: repository.repositoryUri,
  description: 'ECR Repository URI',
  exportName: 'FernandoWebECRUri',
});

// ... more outputs
```

## Configuration Files

### `package.json`

NPM dependencies required:
- `aws-cdk-lib@^2.100.0` - CDK library
- `constructs@^10.0.0` - CDK construct base class
- `dotenv@^16.3.1` - Environment variable loading
- `typescript@^5.0.0` - TypeScript compiler

Key scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "cdk:synth": "cdk synth",
    "cdk:deploy": "cdk deploy",
    "cdk:destroy": "cdk destroy",
    "cdk:diff": "cdk diff"
  }
}
```

### `tsconfig.json`

TypeScript configuration for CDK:
- Target: ES2020
- Module: commonjs
- Output: ./lib
- Strict mode enabled
- JSON module support

### `cdk.json`

CDK configuration:
```json
{
  "app": "npx ts-node src/index.ts",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "lib/**"]
  }
}
```

## Docker Configuration

### `Dockerfile`

Multi-stage build for Next.js:

**Stage 1: Builder**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```
- Installs dependencies
- Builds Next.js application
- Creates `.next` directory

**Stage 2: Production**
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init  # Signal handling
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

**Key features:**
- Alpine Linux base (~150MB smaller)
- Multi-stage (builder image not in production)
- Non-root user (nextjs, UID 1001)
- Proper signal handling (dumb-init)
- Production dependencies only

### `.dockerignore`

Files excluded from Docker build:
- node_modules (rebuild in container)
- .git (not needed in image)
- .env files (use task definition instead)
- .next, .vercel (rebuild in container)

## Deployment Scripts

### `scripts/build-and-push.sh`

```bash
#!/bin/bash
set -e

# Get AWS account and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPO_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/fernando-web"

# Build Docker image
docker build -f infrastructure/Dockerfile -t fernando-web:latest .

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REPO_URI"

# Tag and push
docker tag fernando-web:latest "$ECR_REPO_URI:latest"
docker push "$ECR_REPO_URI:latest"
```

**What it does:**
1. Gets AWS account ID and region
2. Builds Docker image locally
3. Authenticates with ECR
4. Tags image with timestamp
5. Pushes to ECR repository

### `scripts/deploy-service.sh`

```bash
#!/bin/bash
set -e

aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --force-new-deployment \
  --region us-east-1

# Wait for deployment to complete
for i in {1..60}; do
  DEPLOYMENT_COUNT=$(aws ecs describe-services \
    --cluster fernando-web-cluster \
    --services fernando-web-service \
    --query 'services[0].deployments | length(@)' \
    --output text)

  if [ "$DEPLOYMENT_COUNT" -eq 1 ]; then
    echo "Deployment complete"
    break
  fi
  sleep 10
done
```

**What it does:**
1. Forces new ECS service deployment
2. Polls for deployment completion
3. Shows final status

### `scripts/logs.sh`

```bash
#!/bin/bash

aws logs tail /ecs/fernando-web-service \
  ${1:-"--follow"} \
  --timestamp
```

**Usage:**
- `bash scripts/logs.sh` - Stream logs (follows)
- `bash scripts/logs.sh ""` - Show last 100 lines

### `scripts/status.sh`

```bash
#!/bin/bash

# Service status
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service \
  --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
  --output table

# Task status
aws ecs list-tasks --cluster fernando-web-cluster \
  --query 'taskArns[]' --output text | \
aws ecs describe-tasks \
  --cluster fernando-web-cluster \
  --tasks ... \
  --output table
```

**Shows:**
- Service name, status, running/desired count
- List of running tasks
- Recent service events
- Auto-scaling activities

## Environment Variable Injection

### How Variables Are Loaded

**File: `src/stacks/fernando-web-stack.ts` (lines 15-17)**

```typescript
const envPath = path.join(__dirname, '../../.env.production');
dotenv.config({ path: envPath });
```

Loads variables from `.env.production` into `process.env`.

### How Variables Are Passed to Container

**File: `src/stacks/fernando-web-stack.ts` (lines 35-42)**

```typescript
const environment = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://fernando.iwantmyown.com',
  NEXT_PUBLIC_FERNANDO_API_URL: process.env.NEXT_PUBLIC_FERNANDO_API_URL || '...',
  NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID || 'peter',
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '...',
  NODE_ENV: 'production',
};
```

**File: `src/stacks/fernando-web-stack.ts` (line 230)**

```typescript
const container = taskDefinition.addContainer('FernandoWebContainer', {
  // ...
  environment,  // Pass environment object
  // ...
});
```

Variables are injected into task definition and available to application.

## Common Customizations

### Change Task Count

**File: `src/stacks/fernando-web-stack.ts` (line 33)**

```typescript
const taskCount = 2;  // Change to 1, 3, 4, etc.
```

Then redeploy:
```bash
npm run cdk:deploy
```

### Change CPU/Memory

**File: `src/stacks/fernando-web-stack.ts` (lines 31-32)**

```typescript
const containerMemory = 512;   // Valid: 512, 1024, 2048, etc.
const containerCpu = 256;      // Valid: 256, 512, 1024, 2048
```

Valid combinations: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html

### Change Scaling Thresholds

**File: `src/stacks/fernando-web-stack.ts` (lines 291-301)**

```typescript
const scaling = service.autoScaleTaskCount({
  minCapacity: 1,   // Change minimum
  maxCapacity: 4,   // Change maximum
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,  // Change to 60, 75, etc.
});

scaling.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 80,  // Change to 70, 85, etc.
});
```

### Add HTTPS Support

**Update in `src/stacks/fernando-web-stack.ts`:**

```typescript
// Add ACM certificate (must exist)
const certificate = acm.Certificate.fromCertificateArn(this, 'Cert',
  'arn:aws:acm:us-east-1:123456789012:certificate/...');

// Update ALB listener to HTTPS
alb.addListener('FernandoWebListener', {
  port: 443,
  protocol: elbv2.ApplicationProtocol.HTTPS,
  certificates: [certificate],
  defaultTargetGroups: [targetGroup],
});

// Add HTTP to HTTPS redirect
alb.addListener('HttpRedirect', {
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,
  defaultAction: elbv2.ListenerAction.redirect({
    protocol: 'HTTPS',
    port: '443',
    permanent: true,
  }),
});
```

### Connect to Database

**Add to IAM task role:**

```typescript
taskRole.addToPrincipalPolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'rds-db:connect',
    ],
    resources: [
      'arn:aws:rds:region:account:db:database-name',
    ],
  })
);
```

**Update security group:**

```typescript
const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
  this, 'DbSG', 'sg-xxxxx'
);

ecsSecurityGroup.addEgressRule(
  dbSecurityGroup,
  ec2.Port.tcp(5432),  // PostgreSQL
  'Allow connection to database'
);

dbSecurityGroup.addIngressRule(
  ecsSecurityGroup,
  ec2.Port.tcp(5432),
  'Allow ECS to database'
);
```

## Debugging Tips

### View CloudFormation Template

```bash
npm run cdk:synth
cat cdk.out/FernandoWebStack.template.json | jq .
```

### Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name FernandoWebStack \
  --query 'Stacks[0].StackStatus'
```

### View Stack Events

```bash
aws cloudformation describe-stack-events \
  --stack-name FernandoWebStack \
  --query 'StackEvents[0:10]'
```

### Get Task Logs

```bash
aws logs filter-log-events \
  --log-group-name /ecs/fernando-web-service \
  --query 'events[*].message' \
  --output text
```

### Describe Service

```bash
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service \
  --query 'services[0]' \
  --output json | jq .
```

## Reference Links

- **AWS CDK API Reference**: https://docs.aws.amazon.com/cdk/api/latest/
- **ECS Best Practices**: https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/
- **Fargate Task Sizing**: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
- **Next.js Docker**: https://nextjs.org/docs/deployment/docker
- **AWS CLI ECS Commands**: https://docs.aws.amazon.com/cli/latest/reference/ecs/

---

**Version**: 1.0.0
**Last Updated**: November 2, 2024
