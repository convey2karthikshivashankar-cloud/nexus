#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DemoStack } from '../infrastructure/DemoStack';

const app = new cdk.App();

new DemoStack(app, 'NexusDemoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Nexus Blueprint 3.0 - Interactive Demo Stack (AWS Free Tier Optimized)',
});

app.synth();
