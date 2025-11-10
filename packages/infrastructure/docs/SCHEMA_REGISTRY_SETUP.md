# AWS Glue Schema Registry Setup Guide

## Overview

This guide covers the deployment and configuration of the AWS Glue Schema Registry for the Nexus Blueprint 3.0. The Schema Registry is a critical governance component that must be deployed before any service logic.

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Node.js 18+ and npm/yarn
- AWS account with permissions for:
  - AWS Glue
  - IAM
  - CloudFormation

## Deployment Steps

### 1. Install Dependencies

```bash
cd packages/infrastructure
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 3. Deploy Schema Registry Stack

```bash
# Synthesize CloudFormation template
cdk synth NexusSchemaRegistryStack

# Deploy the stack
cdk deploy NexusSchemaRegistryStack
```

### 4. Verify Deployment

After deployment, note the outputs:
- `SchemaRegistryName`: Name of the registry (default: `nexus-event-schema-registry`)
- `SchemaRegistryArn`: ARN for the registry
- `SchemaRoleArn`: IAM role ARN for Lambda functions

```bash
# Verify registry exists
aws glue get-registry --registry-id RegistryName=nexus-event-schema-registry
```

## Configuration

### Environment Variables

Set these environment variables for your Lambda functions:

```bash
SCHEMA_REGISTRY_NAME=nexus-event-schema-registry
AWS_REGION=us-east-1
```

### IAM Permissions

The deployed IAM role includes permissions for:
- `glue:GetRegistry`
- `glue:GetSchema`
- `glue:GetSchemaVersion`
- `glue:RegisterSchemaVersion`
- `glue:CheckSchemaVersionValidity`
- `glue:GetSchemaByDefinition`
- `glue:ListSchemaVersions`
- `glue:CreateSchema`
- `glue:UpdateSchema`

Attach this role to Lambda functions that need schema operations.

## Usage

### Registering a Schema

```typescript
import { GlueSchemaRegistry } from '@nexus/adapters-aws';

const registry = new GlueSchemaRegistry({
  registryName: 'nexus-event-schema-registry',
  region: 'us-east-1',
  enableLogging: true,
});

const schemaDefinition = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    orderId: { type: 'string' },
    customerId: { type: 'string' },
    totalAmount: { type: 'number' },
  },
  required: ['orderId', 'customerId', 'totalAmount'],
});

const result = await registry.registerSchema(
  'OrderPlaced',
  schemaDefinition,
  'BACKWARD'
);

console.log(`Schema registered: version ${result.version}`);
```

### Validating Events

```typescript
const event: DomainEvent = {
  eventId: 'evt-123',
  eventType: 'OrderPlaced',
  aggregateId: 'order-123',
  aggregateVersion: 1,
  timestamp: '2025-01-01T00:00:00Z',
  payload: {
    orderId: 'order-123',
    customerId: 'cust-456',
    totalAmount: 99.99,
  },
  metadata: {
    correlationId: 'corr-1',
    causationId: 'cmd-1',
    userId: 'user-1',
    schemaVersion: '1.0',
  },
};

const validationResult = await registry.validate(event);

if (!validationResult.valid) {
  console.error('Validation failed:', validationResult.errors);
}
```

### Checking Compatibility

```typescript
const newSchema = JSON.stringify({
  type: 'object',
  properties: {
    orderId: { type: 'string' },
    customerId: { type: 'string' },
    totalAmount: { type: 'number' },
    orderDate: { type: 'string' }, // New optional field
  },
  required: ['orderId', 'customerId', 'totalAmount'],
});

const compatResult = await registry.checkCompatibility(
  'OrderPlaced',
  newSchema
);

if (!compatResult.compatible) {
  console.error('Incompatible schema:', compatResult.violations);
}
```

## Compatibility Modes

### BACKWARD (Default)

- New schema can read data written by old schema
- Allows: Adding optional fields, removing optional fields
- Disallows: Removing required fields, changing field types, making optional fields required

### FORWARD

- Old schema can read data written by new schema
- Allows: Removing fields, adding optional fields
- Disallows: Adding required fields

### FULL

- Both BACKWARD and FORWARD compatibility
- Most restrictive mode

### NONE

- No compatibility checks
- Not recommended for production

## Schema Evolution Best Practices

### 1. Always Add Optional Fields

```json
{
  "properties": {
    "existingField": { "type": "string" },
    "newField": { "type": "string" }  // Optional by default
  },
  "required": ["existingField"]  // Don't add newField here
}
```

### 2. Never Remove Required Fields

```json
// ❌ BAD - Removes required field
{
  "properties": {
    "orderId": { "type": "string" }
    // customerId removed
  },
  "required": ["orderId"]
}

// ✅ GOOD - Keep all required fields
{
  "properties": {
    "orderId": { "type": "string" },
    "customerId": { "type": "string" }
  },
  "required": ["orderId", "customerId"]
}
```

### 3. Never Change Field Types

```json
// ❌ BAD - Changes type
{
  "properties": {
    "totalAmount": { "type": "string" }  // Was number
  }
}

// ✅ GOOD - Keep original type
{
  "properties": {
    "totalAmount": { "type": "number" }
  }
}
```

### 4. Use Semantic Versioning

- Major version: Breaking changes (requires explicit version increment)
- Minor version: Backward-compatible additions
- Patch version: Bug fixes in schema definitions

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- Schema registration rate
- Validation failures
- Compatibility check failures

### CloudWatch Logs

Enable logging in the GlueSchemaRegistry constructor:

```typescript
const registry = new GlueSchemaRegistry({
  registryName: 'nexus-event-schema-registry',
  region: 'us-east-1',
  enableLogging: true,  // Enable detailed logging
});
```

## Troubleshooting

### Schema Not Found

```
Error: Schema retrieval failed: Schema not found
```

**Solution**: Ensure the schema is registered before validation:

```bash
aws glue list-schemas --registry-id RegistryName=nexus-event-schema-registry
```

### Compatibility Check Failed

```
Error: Schema is not compatible: Field 'customerId' was removed
```

**Solution**: Review the compatibility violations and adjust the schema to maintain backward compatibility.

### Permission Denied

```
Error: User is not authorized to perform: glue:GetSchema
```

**Solution**: Attach the SchemaRegistryRole to your Lambda function or add the required permissions to your execution role.

## Cost Optimization

### Schema Caching

The GlueSchemaRegistry implementation includes a 5-minute cache to reduce API calls:

```typescript
// Cache is automatic, but you can clear it if needed
registry.clearCache();
```

### API Call Pricing

- Schema registration: $0.40 per 1M requests
- Schema retrieval: $0.40 per 1M requests
- Compatibility checks: Included in registration

Typical costs for 10,000 events/second:
- ~$35/month for schema operations

## Integration with CI/CD

See the Policy Engine documentation for integrating schema validation into your CI/CD pipeline.

## Next Steps

After deploying the Schema Registry:

1. ✅ Register your first event schema
2. ⏭️ Set up Policy Engine (Task 4.2) to enforce schema validation in CI/CD
3. ⏭️ Integrate schema validation in Command Service (Task 5.1)
4. ⏭️ Write integration tests (Task 3.4)

## References

- [AWS Glue Schema Registry Documentation](https://docs.aws.amazon.com/glue/latest/dg/schema-registry.html)
- [JSON Schema Specification](https://json-schema.org/)
- Nexus Blueprint Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
