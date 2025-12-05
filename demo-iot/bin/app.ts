#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IoTDemoStack } from '../infrastructure/IoTDemoStack';

const app = new cdk.App();

new IoTDemoStack(app, 'NexusIoTDemoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
  description: 'Nexus Blueprint 3.0 - IoT Sensor Demo (CQRS + Event Sourcing)',
});
