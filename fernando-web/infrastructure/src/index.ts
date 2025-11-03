import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FernandoWebStack } from './stacks/fernando-web-stack';

const app = new cdk.App();

new FernandoWebStack(app, 'FernandoWebStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: 'fernando-web-stack',
  description: 'ECS Fargate infrastructure for Fernando Web Next.js application',
});
