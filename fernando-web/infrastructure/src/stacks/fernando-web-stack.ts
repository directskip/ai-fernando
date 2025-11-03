import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.production
const envPath = path.join(__dirname, '../../.env.production');
dotenv.config({ path: envPath });

interface FernandoWebStackProps extends cdk.StackProps {
  stackName?: string;
  description?: string;
}

export class FernandoWebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: FernandoWebStackProps) {
    super(scope, id, props);

    // Configuration
    const clusterName = 'fernando-web-cluster';
    const serviceName = 'fernando-web-service';
    const taskFamily = 'fernando-web-task';
    const ecrRepoName = 'fernando-web';
    const containerPort = 3000;
    const taskCount = 2;
    const containerMemory = 512;
    const containerCpu = 256;

    // Environment variables from .env.production
    const environment = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://fernando.iwantmyown.com',
      NEXT_PUBLIC_FERNANDO_API_URL:
        process.env.NEXT_PUBLIC_FERNANDO_API_URL ||
        'https://p1k9c6b251.execute-api.us-east-1.amazonaws.com/prod',
      NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID || 'peter',
      NEXT_PUBLIC_WS_URL:
        process.env.NEXT_PUBLIC_WS_URL ||
        'wss://m8xcc0194m.execute-api.us-east-1.amazonaws.com/prod',
      NODE_ENV: 'production',
    };

    // Secrets (should be stored in AWS Secrets Manager)
    // NEXTAUTH_SECRET is handled via environment variables

    // VPC
    const vpc = new ec2.Vpc(this, 'FernandoWebVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Security Groups
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

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'FernandoWebCluster', {
      vpc,
      clusterName,
      containerInsights: true,
    });

    // ECR Repository
    const repository = new ecr.Repository(this, 'FernandoWebRepository', {
      repositoryName: ecrRepoName,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      imageScanOnPush: true,
    });

    // CloudWatch Logs
    const logGroup = new logs.LogGroup(this, 'FernandoWebLogGroup', {
      logGroupName: `/ecs/${serviceName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for ECS Task Execution
    const taskExecutionRole = new iam.Role(this, 'FernandoWebTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Add permissions to read secrets from Secrets Manager (optional)
    taskExecutionRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'kms:Decrypt',
        ],
        resources: ['arn:aws:secretsmanager:*:*:secret:fernando-*'],
      })
    );

    // IAM Role for ECS Task
    const taskRole = new iam.Role(this, 'FernandoWebTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FernandoWebTaskDef', {
      family: taskFamily,
      cpu: containerCpu,
      memoryLimitMiB: containerMemory,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Add container to task definition
    taskDefinition.addContainer('FernandoWebContainer', {
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
      environment,
      // Note: For secrets, you would need to create them in Secrets Manager first
      // and then reference them here using:
      // secrets: {
      //   NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(
      //     secretsManager.Secret.fromSecretNameV2(this, 'NextAuthSecret', 'fernando/nextauth-secret')
      //   ),
      // },
    });

    // Application Load Balancer
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

    // ALB Listener
    alb.addListener('FernandoWebListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ECS Service
    const service = new ecs.FargateService(this, 'FernandoWebService', {
      cluster,
      taskDefinition,
      desiredCount: taskCount,
      serviceName: serviceName,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
    });

    // Attach service to target group
    service.attachToApplicationTargetGroup(targetGroup);

    // Auto-scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Outputs
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

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: 'FernandoWebClusterName',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: service.serviceName,
      description: 'ECS Service Name',
      exportName: 'FernandoWebServiceName',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group Name',
      exportName: 'FernandoWebLogGroupName',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryName', {
      value: repository.repositoryName,
      description: 'ECR Repository Name',
      exportName: 'FernandoWebECRRepoName',
    });
  }
}
