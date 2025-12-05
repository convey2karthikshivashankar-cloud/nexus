#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CommandServiceStack } from '../infrastructure/CommandStack';

const app = new cdk.App();

new CommandServiceStack(app, 'NexusCommandServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2'
  },
  description: 'Nexus Blueprint - Skeleton Crew App #1: Command Service'
});

app.synth();
