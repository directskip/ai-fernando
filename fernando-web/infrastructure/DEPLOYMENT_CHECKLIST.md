# Fernando Web - ECS Deployment Checklist

Use this checklist to ensure a successful deployment of the Fernando Web application to AWS ECS.

## Pre-Deployment Checklist

### AWS Account Setup
- [ ] AWS account created and activated
- [ ] IAM user created with appropriate permissions
- [ ] Access keys generated and configured locally
  ```bash
  aws configure
  ```
- [ ] AWS region set (us-east-1)
  ```bash
  echo $AWS_DEFAULT_REGION
  ```
- [ ] Account ID known
  ```bash
  aws sts get-caller-identity --query Account --output text
  ```

### Local Environment
- [ ] Node.js v18+ installed
  ```bash
  node --version  # Should be v18+
  ```
- [ ] npm v9+ installed
  ```bash
  npm --version   # Should be v9+
  ```
- [ ] AWS CLI v2 installed
  ```bash
  aws --version   # Should be AWS CLI 2.x
  ```
- [ ] AWS CDK installed globally
  ```bash
  npm install -g aws-cdk
  cdk --version
  ```
- [ ] Docker installed and running
  ```bash
  docker --version
  docker run hello-world
  ```
- [ ] Git installed and configured
  ```bash
  git --version
  git config user.name
  git config user.email
  ```

### Project Setup
- [ ] Source code cloned
  ```bash
  cd /path/to/fernando-web
  ```
- [ ] Dependencies installed
  ```bash
  npm install
  ```
- [ ] Application builds successfully
  ```bash
  npm run build
  ```
- [ ] Application runs locally
  ```bash
  npm run dev  # Should start on port 3000
  ```

### Environment Configuration
- [ ] `.env.production` file exists and is valid
  ```bash
  cat .env.production
  ```
- [ ] All required environment variables are set:
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXT_PUBLIC_FERNANDO_API_URL`
  - [ ] `NEXT_PUBLIC_TENANT_ID`
  - [ ] `NEXT_PUBLIC_WS_URL`
- [ ] `.env.production` is in `.gitignore`
  ```bash
  grep ".env.production" .gitignore
  ```

## Infrastructure Setup

### CDK Initialization
- [ ] Infrastructure directory exists
  ```bash
  ls infrastructure/
  ```
- [ ] CDK dependencies installed
  ```bash
  cd infrastructure
  npm install
  ```
- [ ] TypeScript compiles without errors
  ```bash
  npm run build
  ```
- [ ] CDK stack can be synthesized
  ```bash
  npm run cdk:synth
  ```

### AWS Bootstrap
- [ ] CDK bootstrap completed
  ```bash
  cdk bootstrap aws://ACCOUNT_ID/us-east-1
  ```
- [ ] Bootstrap S3 bucket exists
  ```bash
  aws s3 ls | grep cdk
  ```

### Stack Review
- [ ] Stack diff reviewed
  ```bash
  npm run cdk:diff
  ```
- [ ] CloudFormation template reviewed
  ```bash
  cat cdk.out/FernandoWebStack.template.json | jq .
  ```
- [ ] Resource naming is acceptable:
  - [ ] Cluster: fernando-web-cluster
  - [ ] Service: fernando-web-service
  - [ ] Task Family: fernando-web-task
  - [ ] ECR Repo: fernando-web
  - [ ] ALB: fernando-web-alb

## Deployment Execution

### Infrastructure Deployment
- [ ] Stack deployed successfully
  ```bash
  npm run cdk:deploy
  ```
- [ ] All resources created in AWS Console:
  - [ ] ECS Cluster (fernando-web-cluster)
  - [ ] VPC with subnets
  - [ ] Security Groups
  - [ ] Application Load Balancer
  - [ ] Target Group
  - [ ] ECR Repository (fernando-web)
  - [ ] CloudWatch Log Group

### Docker Image Build
- [ ] Dockerfile exists and is valid
  ```bash
  cat Dockerfile
  ```
- [ ] Docker image builds successfully
  ```bash
  docker build -f infrastructure/Dockerfile -t fernando-web:latest .
  ```
- [ ] Docker image can be run locally
  ```bash
  docker run -p 3000:3000 fernando-web:latest
  # Navigate to http://localhost:3000
  ```

### Docker Image Push
- [ ] Logged in to ECR
  ```bash
  aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
  ```
- [ ] Image tagged correctly
  ```bash
  docker tag fernando-web:latest \
    ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fernando-web:latest
  ```
- [ ] Image pushed to ECR
  ```bash
  docker push \
    ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fernando-web:latest
  ```
- [ ] Image available in ECR
  ```bash
  aws ecr describe-images --repository-name fernando-web
  ```

### Service Deployment
- [ ] ECS service deployed
  ```bash
  aws ecs update-service \
    --cluster fernando-web-cluster \
    --service fernando-web-service \
    --force-new-deployment
  ```
- [ ] Deployment completed (wait 5-10 minutes)
  ```bash
  bash scripts/status.sh
  ```
- [ ] Tasks are running
  ```bash
  aws ecs list-tasks --cluster fernando-web-cluster
  ```

## Post-Deployment Validation

### Health Checks
- [ ] ECS service is ACTIVE
  ```bash
  aws ecs describe-services \
    --cluster fernando-web-cluster \
    --services fernando-web-service \
    --query 'services[0].status'
  ```
- [ ] Tasks are RUNNING
  ```bash
  bash scripts/status.sh
  ```
- [ ] Running count equals desired count
  ```bash
  bash scripts/status.sh  # runningCount should equal desiredCount
  ```

### Application Access
- [ ] Get ALB DNS name
  ```bash
  aws elbv2 describe-load-balancers \
    --query 'LoadBalancers[?LoadBalancerName==`fernando-web-alb`].DNSName' \
    --output text
  ```
- [ ] ALB health check is passing
  ```bash
  aws elbv2 describe-target-health \
    --target-group-arn <target-group-arn> \
    --query 'TargetHealthDescriptions[].TargetHealth.State'
  ```
- [ ] Application responds to HTTP requests
  ```bash
  curl -I http://fernando-web-alb-xxxx.us-east-1.elb.amazonaws.com
  # Should return 200 OK or 301 Redirect
  ```
- [ ] Application is accessible in browser
  - [ ] Open http://ALB-DNS-NAME in browser
  - [ ] Page loads without errors
  - [ ] All assets load correctly

### Logging Verification
- [ ] CloudWatch log group exists
  ```bash
  aws logs describe-log-groups \
    --log-group-name-prefix /ecs/fernando-web-service
  ```
- [ ] Logs are being written
  ```bash
  bash scripts/logs.sh ""  # Show last 100 lines
  ```
- [ ] No error messages in logs
  - [ ] Review logs for exceptions
  - [ ] Check for environment variable errors
  - [ ] Verify API connectivity

### Environment Variables
- [ ] Environment variables passed to container
  ```bash
  TASK_ARN=$(aws ecs list-tasks --cluster fernando-web-cluster --query 'taskArns[0]' --output text)
  aws ecs describe-tasks --cluster fernando-web-cluster --tasks $TASK_ARN --query 'tasks[0].containers[0].environment'
  ```
- [ ] Secrets accessible (if using Secrets Manager)
- [ ] API connectivity verified from container

## Monitoring Setup

### CloudWatch Monitoring
- [ ] CloudWatch Container Insights enabled
  ```bash
  aws ecs describe-clusters --clusters fernando-web-cluster \
    --query 'clusters[0].settings'
  ```
- [ ] CPU metrics available in CloudWatch
  ```bash
  aws cloudwatch list-metrics --namespace AWS/ECS \
    --dimensions Name=ServiceName,Value=fernando-web-service
  ```
- [ ] Memory metrics available in CloudWatch

### Auto-scaling Configuration
- [ ] Auto-scaling targets created
  ```bash
  aws application-autoscaling describe-scaling-targets \
    --service-namespace ecs
  ```
- [ ] Scaling policies created
  ```bash
  aws application-autoscaling describe-scaling-policies \
    --service-namespace ecs
  ```
- [ ] Capacity configured (min: 1, max: 4)

## Post-Deployment Tasks

### DNS and Routing
- [ ] Route53 record created (if using custom domain)
  ```bash
  aws route53 list-resource-record-sets --hosted-zone-id <zone-id>
  ```
- [ ] CNAME or A record points to ALB
- [ ] DNS propagation verified
  ```bash
  nslookup fernando.iwantmyown.com
  ```

### HTTPS/TLS (Optional)
- [ ] ACM certificate requested (if using custom domain)
- [ ] Certificate validation completed
- [ ] ALB listener configured for HTTPS
- [ ] HTTP to HTTPS redirect configured

### Backup and Disaster Recovery
- [ ] ECR image backup strategy defined
- [ ] CloudWatch log retention set (30 days)
- [ ] Database backups configured (if applicable)

### Documentation
- [ ] Deployment documented
  - [ ] ALB DNS name recorded
  - [ ] Architecture diagram created
  - [ ] Runbook created
- [ ] Team informed of deployment
- [ ] Access credentials securely shared

## Testing

### Functional Testing
- [ ] Application home page loads
- [ ] Navigation works
- [ ] API calls work
  - [ ] Check NEXTAUTH_URL connectivity
  - [ ] Check NEXT_PUBLIC_FERNANDO_API_URL connectivity
  - [ ] Check NEXT_PUBLIC_WS_URL connectivity
- [ ] WebSocket connections work
- [ ] File uploads work (if applicable)
- [ ] Database queries work (if applicable)

### Performance Testing
- [ ] Response times acceptable
- [ ] No obvious memory leaks
- [ ] CPU utilization reasonable
- [ ] Network latency acceptable

### Security Testing
- [ ] HTTPS enabled (if custom domain)
- [ ] Security headers present (if configured)
- [ ] No sensitive data in logs
- [ ] No exposed secrets

## Troubleshooting Log

Document any issues encountered:

### Issue 1: [Issue Description]
- **Date/Time**:
- **Error Message**:
- **Root Cause**:
- **Resolution**:
- **Time to Resolve**:

### Issue 2: [Issue Description]
- **Date/Time**:
- **Error Message**:
- **Root Cause**:
- **Resolution**:
- **Time to Resolve**:

## Sign-Off

- [ ] Deployment completed successfully
- [ ] All health checks passing
- [ ] Application accessible and functional
- [ ] Team notified
- [ ] Monitoring configured

**Deployed By**: _____________________
**Date**: _____________________
**Environment**: Production / Staging / Development
**Version**: _____________________
**Notes**:

---

## Next Steps

1. Monitor application for 24 hours for any issues
2. Review CloudWatch metrics and logs regularly
3. Plan for regular updates and maintenance
4. Document any lessons learned
5. Schedule post-deployment retrospective

## Rollback Plan

If critical issues occur:

```bash
# Get previous image from ECR
aws ecr describe-images --repository-name fernando-web

# Tag and push previous image
docker pull ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fernando-web:previous-tag
docker tag ... fernando-web:latest
docker push ...

# Force new deployment
aws ecs update-service \
  --cluster fernando-web-cluster \
  --service fernando-web-service \
  --force-new-deployment
```

Or destroy and redeploy:
```bash
# From infrastructure directory
cdk destroy
cdk deploy
```
