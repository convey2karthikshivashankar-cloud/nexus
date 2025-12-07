#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TicketingStack } from '../infrastructure/TicketingStack';

const app = new cdk.App();

// UNIQUE stack name - will NOT conflict with existing demos
new TicketingStack(app, 'SkeletonTicketingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
  description: 'Skeleton Crew Demo - Support Ticketing App (imports @nexus/shared)',
});
