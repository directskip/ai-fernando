/**
 * Infrastructure Configuration
 * Copy this file to config.ts and customize for your environment
 */

export interface InfrastructureConfig {
  // Project Configuration
  projectName: string;
  environment: 'dev' | 'staging' | 'production';

  // AWS Configuration
  aws: {
    region: string;
    accountId?: string;
  };

  // Cluster Configuration
  cluster: {
    name: string;
    containerInsights: boolean;
  };

  // Service Configuration
  service: {
    name: string;
    taskFamily: string;
    desiredCount: number;
    minCapacity: number;
    maxCapacity: number;
  };

  // Task Configuration
  task: {
    cpu: number; // 256, 512, 1024, 2048, 4096
    memory: number; // 512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192
    containerPort: number;
  };

  // ECR Configuration
  ecr: {
    repositoryName: string;
    imageScanOnPush: boolean;
  };

  // ALB Configuration
  alb: {
    name: string;
    internetFacing: boolean;
    healthCheck: {
      path: string;
      interval: number;
      timeout: number;
      healthyThreshold: number;
      unhealthyThreshold: number;
    };
  };

  // VPC Configuration
  vpc: {
    maxAzs: number;
    cidrMask: number;
    natGateways: number;
  };

  // Logging Configuration
  logging: {
    logGroupName: string;
    retentionDays: number;
  };

  // Environment Variables
  environmentVariables: Record<string, string>;
}

/**
 * Development Configuration
 */
export const devConfig: InfrastructureConfig = {
  projectName: 'fernando-web-dev',
  environment: 'dev',
  aws: {
    region: 'us-east-1',
  },
  cluster: {
    name: 'fernando-web-cluster-dev',
    containerInsights: true,
  },
  service: {
    name: 'fernando-web-service-dev',
    taskFamily: 'fernando-web-task-dev',
    desiredCount: 1,
    minCapacity: 1,
    maxCapacity: 2,
  },
  task: {
    cpu: 256,
    memory: 512,
    containerPort: 3000,
  },
  ecr: {
    repositoryName: 'fernando-web-dev',
    imageScanOnPush: true,
  },
  alb: {
    name: 'fernando-web-alb-dev',
    internetFacing: true,
    healthCheck: {
      path: '/',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
    },
  },
  vpc: {
    maxAzs: 2,
    cidrMask: 24,
    natGateways: 1,
  },
  logging: {
    logGroupName: '/ecs/fernando-web-dev',
    retentionDays: 7,
  },
  environmentVariables: {
    NODE_ENV: 'development',
    NEXTAUTH_URL: 'https://dev.fernando.iwantmyown.com',
  },
};

/**
 * Production Configuration
 */
export const productionConfig: InfrastructureConfig = {
  projectName: 'fernando-web',
  environment: 'production',
  aws: {
    region: 'us-east-1',
  },
  cluster: {
    name: 'fernando-web-cluster',
    containerInsights: true,
  },
  service: {
    name: 'fernando-web-service',
    taskFamily: 'fernando-web-task',
    desiredCount: 2,
    minCapacity: 2,
    maxCapacity: 4,
  },
  task: {
    cpu: 256,
    memory: 512,
    containerPort: 3000,
  },
  ecr: {
    repositoryName: 'fernando-web',
    imageScanOnPush: true,
  },
  alb: {
    name: 'fernando-web-alb',
    internetFacing: true,
    healthCheck: {
      path: '/',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
    },
  },
  vpc: {
    maxAzs: 2,
    cidrMask: 24,
    natGateways: 1,
  },
  logging: {
    logGroupName: '/ecs/fernando-web-service',
    retentionDays: 30,
  },
  environmentVariables: {
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://fernando.iwantmyown.com',
  },
};

/**
 * Get configuration based on environment
 */
export function getConfig(environment: string = process.env.ENVIRONMENT || 'production'): InfrastructureConfig {
  switch (environment.toLowerCase()) {
    case 'dev':
    case 'development':
      return devConfig;
    case 'prod':
    case 'production':
      return productionConfig;
    default:
      return productionConfig;
  }
}
