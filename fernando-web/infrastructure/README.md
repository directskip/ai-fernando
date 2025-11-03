# Fernando Web - AWS CDK Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the Fernando Web Next.js application to ECS Fargate.

## Architecture Overview

The infrastructure includes:

- **ECS Fargate Cluster**: fernando-web-cluster
- **ECS Service**: fernando-web-service (running 2 tasks with auto-scaling)
- **Application Load Balancer (ALB)**: Distributes traffic to ECS tasks
- **ECR Repository**: fernando-web (stores Docker images)
- **VPC**: Custom VPC with public/private subnets across 2 AZs
- **Security Groups**: Configured for ALB and ECS task communication
- **CloudWatch Logs**: Centralized logging for ECS tasks
- **Auto-scaling**: Based on CPU and memory utilization (1-4 tasks)

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI
   ```bash
   aws --version
   aws configure
   ```
3. **Node.js**: v18 or higher
   ```bash
   node --version
   ```
4. **Docker**: For building and testing images locally
   ```bash
   docker --version
   ```
5. **AWS CDK CLI**: Install globally
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

## Setup Instructions

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Bootstrap AWS CDK (First Time Only)

The bootstrap process creates the necessary S3 bucket and IAM roles for CDK.

```bash
cdk bootstrap aws://ACCOUNT_ID/REGION
```

Replace `ACCOUNT_ID` with your AWS account ID and `REGION` with your desired region (e.g., `us-east-1`).

Example:
```bash
cdk bootstrap aws://123456789012/us-east-1
```

### 3. Review the Stack

Before deploying, review what will be created:

```bash
npm run cdk:synth
```

This generates the CloudFormation template.

### 4. Review Changes (Optional)

See a detailed diff of what will be deployed:

```bash
npm run cdk:diff
```

### 5. Build Docker Image

Before deploying, build the Docker image and push it to ECR:

```bash
# Navigate to the project root
cd ..

# Build the Docker image
docker build -f infrastructure/Dockerfile -t fernando-web:latest .

# Get ECR repository URI from CDK outputs
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ECR_REPO_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/fernando-web

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI

# Tag the image
docker tag fernando-web:latest $ECR_REPO_URI:latest

# Push to ECR
docker push $ECR_REPO_URI:latest
```

### 6. Deploy the Stack

```bash
npm run cdk:deploy
```

The deployment will:
- Create the VPC with subnets and NAT Gateway
- Create ECS cluster and service
- Create ECR repository
- Set up ALB and security groups
- Configure CloudWatch logging
- Set up auto-scaling policies

### 7. Get Outputs

After deployment, CDK will output important values:

```
Outputs:
FernandoWebStack.ALBDnsName = fernando-web-alb-xxxx.us-east-1.elb.amazonaws.com
FernandoWebStack.ECRRepositoryUri = 123456789012.dkr.ecr.us-east-1.amazonaws.com/fernando-web
FernandoWebStack.ClusterName = fernando-web-cluster
FernandoWebStack.ServiceName = fernando-web-service
FernandoWebStack.LogGroupName = /ecs/fernando-web-service
FernandoWebStack.ECRRepositoryName = fernando-web
```

## Environment Variables

The stack automatically reads environment variables from `../.env.production`:

- `NEXTAUTH_URL`: NextAuth.js authentication URL
- `NEXTAUTH_SECRET`: Secret key for NextAuth (should be 32+ characters)
- `NEXT_PUBLIC_FERNANDO_API_URL`: Fernando API Gateway URL
- `NEXT_PUBLIC_TENANT_ID`: Tenant identifier
- `NEXT_PUBLIC_WS_URL`: WebSocket server URL

### Managing Secrets

For sensitive data like `NEXTAUTH_SECRET`, consider using AWS Secrets Manager:

1. Create a secret in AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name fernando/nextauth-secret \
  --secret-string 'your-secret-value'
```

2. Update the task definition to use it (see commented section in stack code)

## Deploying Updates

When you update your Next.js application:

1. Build and push new Docker image:
```bash
docker build -f infrastructure/Dockerfile -t fernando-web:latest .
docker tag fernando-web:latest $ECR_REPO_URI:latest
docker push $ECR_REPO_URI:latest
```

2. Update the ECS service to use the new image:
```bash
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --force-new-deployment \
  --region us-east-1
```

## Monitoring

### View Logs

```bash
# Using AWS CLI
aws logs tail /ecs/fernando-web-service --follow

# Using CloudWatch console
# Navigate to CloudWatch > Log Groups > /ecs/fernando-web-service
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service \
  --region us-east-1
```

### View ECS Events

```bash
aws ecs describe-services \
  --cluster fernando-web-cluster \
  --services fernando-web-service \
  --query 'services[0].events[0:10]' \
  --region us-east-1
```

## Scaling

The service is configured with auto-scaling:

- **Min Tasks**: 1
- **Max Tasks**: 4
- **CPU Target**: 70%
- **Memory Target**: 80%

To manually adjust:

```bash
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --desired-count 3 \
  --region us-east-1
```

## Cleanup

To destroy all resources and avoid AWS charges:

```bash
npm run cdk:destroy
```

This will remove:
- ECS cluster and services
- ALB and target groups
- VPC and subnets
- CloudWatch logs
- Security groups
- ECR repository (with RETAIN policy - you may need to delete manually)

## Troubleshooting

### Docker Build Issues

If the Docker build fails, ensure you're in the project root directory:
```bash
cd ../..  # Navigate to fernando-web root
docker build -f infrastructure/Dockerfile -t fernando-web:latest .
```

### Tasks Not Starting

Check the logs:
```bash
aws logs tail /ecs/fernando-web-service --follow
```

Common issues:
- Docker image not found in ECR - push the image first
- Task role missing permissions - update IAM policies
- Environment variables misconfigured - check .env.production

### ALB Not Responding

1. Verify tasks are running:
```bash
aws ecs list-tasks --cluster fernando-web-cluster
```

2. Check target group health:
```bash
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...
```

### Permission Denied Errors

Ensure your AWS credentials have permissions for:
- EC2, ECS, ECR, ELB, IAM, CloudWatch, CloudFormation

### Stack Already Exists

If you get an error about the stack already existing:
```bash
cdk destroy  # Destroy existing stack first
cdk deploy   # Then deploy again
```

## Security Considerations

1. **Secrets Management**: Use AWS Secrets Manager for sensitive values
2. **IAM Roles**: Tasks run with minimal required permissions
3. **VPC**: ECS tasks run in private subnets with egress through NAT Gateway
4. **Security Groups**: Configured to restrict traffic appropriately
5. **Image Scanning**: ECR repository has image scan on push enabled
6. **Non-root User**: Docker image runs as 'nextjs' user (UID 1001)

## Cost Optimization

- **NAT Gateway**: ~$32/month - Required for private tasks to access internet
- **ALB**: ~$16/month + data processing charges
- **ECS**: Pay only for vCPU and memory consumed
- **ECR**: Pay for storage (~$0.10 per GB) and data transfer

To reduce costs:
- Use spot instances (not supported with Fargate, but available with EC2)
- Reduce task count during off-hours
- Use CloudFront for static assets

## Advanced Customization

### Adding HTTPS/TLS

1. Request an ACM certificate for your domain
2. Update the ALB listener to use HTTPS
3. Redirect HTTP to HTTPS

### Database Connection

If you need to connect to a database:
1. Place database in same VPC
2. Update security groups to allow ECS-to-database traffic
3. Add database credentials via Secrets Manager
4. Update task role permissions

### Custom Domain

To use a custom domain:
1. Create Route53 hosted zone or use existing
2. Add ALB DNS name as CNAME record
3. Use ACM certificate for HTTPS

## Scripts Reference

```bash
npm run build        # Compile TypeScript
npm run cdk:synth    # Generate CloudFormation template
npm run cdk:deploy   # Deploy to AWS
npm run cdk:destroy  # Destroy stack
npm run cdk:diff     # Show deployment diff
```

## Support

For issues with AWS CDK: https://github.com/aws/aws-cdk/issues
For Next.js deployment: https://nextjs.org/docs/deployment/docker
For ECS documentation: https://docs.aws.amazon.com/ecs/
