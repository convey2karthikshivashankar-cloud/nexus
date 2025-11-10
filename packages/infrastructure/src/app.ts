#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EventStoreStack } from './stacks/EventStoreStack';
import { SchemaRegistryStack } from './stacks/SchemaRegistryStack';
import { EventBusStack } from './stacks/EventBusStack';
import { SecondaryEventBusStack } from './stacks/SecondaryEventBusStack';
import { ApiGatewayStack } from './stacks/ApiGatewayStack';

const app = new cdk.App();

// Foundation: Event Store
const eventStoreStack = new EventStoreStack(app, 'NexusEventStoreStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Governance First: Schema Registry (must be deployed before services)
const schemaRegistryStack = new SchemaRegistryStack(app, 'NexusSchemaRegistryStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Event Bus: Primary (Kinesis) for core events
const eventBusStack = new EventBusStack(app, 'NexusEventBusStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Event Bus: Secondary (SNS/SQS) for non-critical events
const secondaryEventBusStack = new SecondaryEventBusStack(app, 'NexusSecondaryEventBusStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// API Gateway (depends on Event Store and Schema Registry)
const apiGatewayStack = new ApiGatewayStack(app, 'NexusApiGatewayStack', {
  eventStoreTableName: eventStoreStack.eventStoreTable.tableName,
  snapshotsTableName: eventStoreStack.snapshotsTable.tableName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

apiGatewayStack.addDependency(eventStoreStack);
apiGatewayStack.addDependency(schemaRegistryStack);
apiGatewayStack.addDependency(eventBusStack);
apiGatewayStack.addDependency(secondaryEventBusStack);

app.synth();
