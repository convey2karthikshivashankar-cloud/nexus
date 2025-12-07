#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InventoryStack } from '../infrastructure/InventoryStack';

const app = new cdk.App();

// UNIQUE stack name - will NOT conflict with existing demos
new InventoryStack(app, 'SkeletonInventoryStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
  description: 'Skeleton Crew Demo - Inventory Management App (imports @nexus/shared)',
});
