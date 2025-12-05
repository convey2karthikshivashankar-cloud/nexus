#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { QueryServiceStack } from '../infrastructure/QueryStack';

const app = new cdk.App();

new QueryServiceStack(app, 'NexusQueryServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2'
  },
  description: 'Nexus Blueprint - Skeleton Crew App #2: Query Service'
});

app.synth();
