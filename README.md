# Fernando AI Assistant

Complete AI assistant stack including core engine, cloud infrastructure, and web portal.

## Structure

- **fernando/**: Core AI assistant engine
- **fernando-cloud/**: AWS Lambda infrastructure and API
- **fernando-web/**: Next.js web portal (deployed to ECS)

## Deployment

The fernando-web application is automatically deployed to AWS ECS via GitHub Actions on every push to main.

### Infrastructure

- **ECS Cluster**: fernando-web-cluster
- **ECS Service**: fernando-web-service (ACTIVE, 1 task running)
- **ECR Repository**: fernando-web
- **Load Balancer**: fernando-web-alb (active)
- **URL**: http://fernando-web-alb-2017529406.us-east-1.elb.amazonaws.com
- **Status**: ✅ DEPLOYED AND RUNNING

### Manual Deployment

If you need to manually trigger a deployment, push to the main branch:

```bash
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build the Docker image
2. Push to ECR
3. Update the ECS task definition
4. Deploy to ECS with zero downtime
