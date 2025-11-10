# Nexus Blueprint 3.0 - Deployment Guide

## Overview

This guide walks you through deploying the Nexus Blueprint 3.0 Event-Sourced microservice foundation. The system is vendor-neutral but defaults to AWS for rapid deployment.

## Prerequisites

### Required Tools

```bash
# Node.js and npm
node --version  # v20.x or later
npm --version   # v10.x or later

# AWS CLI (for AWS deployment)
aws --version   # v2.x or later
aws configure   # Set up credentials

# AWS CDK
npm install -g aws-cdk
cdk --version   # v2.100.0 or later

# TypeScript
npm install -g typescript
tsc --version   # v5.x or later
```

### AWS Account Setup

1. **Create AWS Account** (if you don't have one)
2. **Configure IAM User** with permissions:
   - DynamoDB (full access)
   - Lambda (full access)
   - API Gateway (full access)
   - Kinesis (full access)
   - SNS/SQS (full access)
   - CloudWatch (full access)
   - AWS Glue (Schema Registry access)
   - IAM (role creation)

3. **Set AWS Credentials**:
   ```bash
   aws configure
   # AWS Access Key ID: YOUR_KEY
   # AWS Secret Access Key: YOUR_SECRET
   # Default region: us-east-1
   # Default output format: json
   ```

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd nexus-blueprint-3.0

# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces

# Build all packages
npm run build
```

### 2. Verify Installation

```bash
# Check TypeScript compilation
npm run build

# Run tests
npm test

# Run policy tests
cd policies
opa test . -v
```

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Cloud Provider Selection
CLOUD_PROVIDER=aws  # or 'gcp', 'azure', 'opensource'

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# Table Names
EVENT_STORE_TABLE=nexus-event-store
SNAPSHOTS_TABLE=nexus-snapshots

# Schema Registry
SCHEMA_REGISTRY_NAME=nexus-event-schema-registry

# Event Bus
CORE_EVENT_STREAM_NAME=nexus-core-events
NON_CRITICAL_TOPIC_ARN=arn:aws:sns:region:account:nexus-non-critical-events

# Application
NODE_ENV=production
LOG_LEVEL=info
```

### CDK Configuration

Update `packages/infrastructure/cdk.json` if needed:

```json
{
  "app": "node dist/app.js",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## Deployment Steps

### Step 1: Bootstrap CDK (First Time Only)

```bash
cd packages/infrastructure

# Bootstrap CDK in your AWS account
cdk bootstrap aws://ACCOUNT-ID/REGION

# Example:
cdk bootstrap aws://123456789012/us-east-1
```

### Step 2: Build Infrastructure Code

```bash
# Build infrastructure package
npm run build
```

### Step 3: Synthesize CloudFormation

```bash
# Generate CloudFormation templates
cdk synth

# Review the generated templates
ls cdk.out/
```

### Step 4: Deploy Infrastructure

```bash
# Deploy all stacks
cdk deploy --all

# Or deploy specific stacks
cdk deploy NexusEventStoreStack
cdk deploy NexusSchemaRegistryStack
cdk deploy NexusEventBusStack
cdk deploy NexusApiGatewayStack
```

**Expected Output:**
```
✅ NexusEventStoreStack
✅ NexusSchemaRegistryStack  
✅ NexusEventBusStack
✅ NexusApiGatewayStack

Outputs:
NexusApiGatewayStack.ApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
NexusEventStoreStack.EventStoreTableName = nexus-event-store
NexusEventStoreStack.SnapshotsTableName = nexus-snapshots
NexusSchemaRegistryStack.SchemaRegistryName = nexus-event-schema-registry
```

### Step 5: Register Event Schemas

```bash
# Register OrderPlaced schema
aws glue create-schema \
  --registry-id RegistryName=nexus-event-schema-registry \
  --schema-name OrderPlaced \
  --data-format JSON \
  --compatibility BACKWARD \
  --schema-definition file://schemas/OrderPlaced.json

# Register OrderCancelled schema
aws glue create-schema \
  --registry-id RegistryName=nexus-event-schema-registry \
  --schema-name OrderCancelled \
  --data-format JSON \
  --compatibility BACKWARD \
  --schema-definition file://schemas/OrderCancelled.json
```

### Step 6: Deploy Lambda Functions

```bash
# Build command service
cd packages/command-service
npm run build

# Build event router
cd ../event-router
npm run build

# Package and deploy (handled by CDK)
cd ../infrastructure
cdk deploy --all
```

## Verification

### 1. Check Infrastructure

```bash
# List DynamoDB tables
aws dynamodb list-tables

# Check Kinesis streams
aws kinesis list-streams

# Check SNS topics
aws sns list-topics

# Check Lambda functions
aws lambda list-functions
```

### 2. Test API Endpoint

```bash
# Get API URL from CDK output
API_URL=$(aws cloudformation describe-stacks \
  --stack-name NexusApiGatewayStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo $API_URL

# Test health endpoint (if implemented)
curl $API_URL/health
```

### 3. Place Test Order

```bash
# Place an order
curl -X POST $API_URL/api/commands/PlaceOrder \
  -H "Content-Type: application/json" \
  -d '{
    "aggregateId": "order-001",
    "customerId": "customer-123",
    "items": [
      {
        "productId": "product-456",
        "quantity": 2,
        "price": 29.99
      }
    ]
  }'

# Expected response:
# {
#   "aggregateId": "order-001",
#   "version": 1,
#   "eventIds": ["evt-xxx"]
# }
```

### 4. Verify Event Storage

```bash
# Query DynamoDB for the event
aws dynamodb query \
  --table-name nexus-event-store \
  --key-condition-expression "aggregateId = :id" \
  --expression-attribute-values '{":id":{"S":"order-001"}}'
```

### 5. Check CloudWatch Logs

```bash
# View Command Service logs
aws logs tail /aws/lambda/NexusCommandService --follow

# View Event Router logs
aws logs tail /aws/lambda/NexusEventRouter --follow
```

## Monitoring

### CloudWatch Dashboards

Access CloudWatch Console:
1. Go to AWS Console → CloudWatch → Dashboards
2. Look for `nexus-*` dashboards

### Key Metrics to Monitor

- **Command Processing Latency** (target: < 200ms p99)
- **Event Publication Rate** (events/second)
- **Projection Lag** (target: < 2 seconds)
- **DLQ Message Count** (should be 0)
- **Error Rate** (should be < 1%)

### CloudWatch Alarms

Check configured alarms:
```bash
aws cloudwatch describe-alarms --alarm-name-prefix nexus
```

## Troubleshooting

### Common Issues

#### 1. CDK Deploy Fails

**Error**: "Unable to resolve AWS account"
```bash
# Solution: Configure AWS credentials
aws configure
aws sts get-caller-identity
```

**Error**: "Stack already exists"
```bash
# Solution: Update existing stack
cdk deploy --all --force
```

#### 2. Lambda Function Errors

**Error**: "Cannot find module '@nexus/shared'"
```bash
# Solution: Rebuild and redeploy
cd packages/command-service
npm run build
cd ../infrastructure
cdk deploy
```

#### 3. Schema Validation Fails

**Error**: "Event validation failed"
```bash
# Solution: Check schema registration
aws glue get-schema \
  --schema-id SchemaName=OrderPlaced,RegistryName=nexus-event-schema-registry
```

#### 4. DynamoDB Throttling

**Error**: "ProvisionedThroughputExceededException"
```bash
# Solution: Enable auto-scaling (already configured in CDK)
# Or switch to on-demand billing mode
```

### Debug Mode

Enable detailed logging:
```bash
# Set environment variable
export LOG_LEVEL=debug

# Redeploy
cdk deploy --all
```

### View Logs

```bash
# Command Service logs
aws logs tail /aws/lambda/NexusCommandService --since 1h

# Event Router logs
aws logs tail /aws/lambda/NexusEventRouter --since 1h

# Filter for errors
aws logs filter-pattern "ERROR" \
  --log-group-name /aws/lambda/NexusCommandService
```

## Scaling

### Auto-Scaling Configuration

The system auto-scales by default:

- **Lambda**: Automatic concurrency scaling
- **DynamoDB**: On-demand billing mode
- **Kinesis**: On-demand mode
- **API Gateway**: Automatic scaling

### Manual Scaling Adjustments

```bash
# Increase Lambda reserved concurrency
aws lambda put-function-concurrency \
  --function-name NexusCommandService \
  --reserved-concurrent-executions 100

# Adjust Kinesis shard count (if using provisioned mode)
aws kinesis update-shard-count \
  --stream-name nexus-core-events \
  --target-shard-count 4 \
  --scaling-type UNIFORM_SCALING
```

## Cost Optimization

### Estimated Monthly Costs (Low Volume)

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 1M requests | $0.20 |
| DynamoDB | 1M writes | $1.25 |
| Kinesis | On-demand | $0.40 |
| SNS/SQS | 1M messages | $0.50 |
| API Gateway | 1M requests | $3.50 |
| **Total** | | **~$6/month** |

### Cost Reduction Tips

1. **Use Reserved Capacity** for predictable workloads
2. **Enable DynamoDB TTL** for old snapshots (already configured)
3. **Optimize Lambda memory** based on actual usage
4. **Use CloudWatch Logs Insights** instead of exporting logs

## Backup and Recovery

### Automated Backups

DynamoDB Point-in-Time Recovery is enabled:
```bash
# Verify PITR is enabled
aws dynamodb describe-continuous-backups \
  --table-name nexus-event-store
```

### Manual Backup

```bash
# Create on-demand backup
aws dynamodb create-backup \
  --table-name nexus-event-store \
  --backup-name nexus-event-store-backup-$(date +%Y%m%d)
```

### Restore from Backup

```bash
# List backups
aws dynamodb list-backups --table-name nexus-event-store

# Restore
aws dynamodb restore-table-from-backup \
  --target-table-name nexus-event-store-restored \
  --backup-arn arn:aws:dynamodb:region:account:table/nexus-event-store/backup/xxx
```

## Cleanup

### Remove All Resources

```bash
cd packages/infrastructure

# Destroy all stacks
cdk destroy --all

# Confirm deletion
# Type 'y' when prompted
```

### Manual Cleanup (if needed)

```bash
# Delete DynamoDB tables
aws dynamodb delete-table --table-name nexus-event-store
aws dynamodb delete-table --table-name nexus-snapshots

# Delete Kinesis stream
aws kinesis delete-stream --stream-name nexus-core-events

# Delete SNS topic
aws sns delete-topic --topic-arn arn:aws:sns:region:account:nexus-non-critical-events

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /aws/lambda/NexusCommandService
aws logs delete-log-group --log-group-name /aws/lambda/NexusEventRouter
```

## Multi-Cloud Deployment

### Switching to Open Source Stack

See [MULTI_CLOUD_ARCHITECTURE.md](MULTI_CLOUD_ARCHITECTURE.md) for details.

```bash
# Set environment variable
export CLOUD_PROVIDER=opensource

# Deploy open source infrastructure
docker-compose up -d

# Update configuration
export EVENTSTORE_CONNECTION_STRING=esdb://localhost:2113
export KAFKA_BROKERS=localhost:9092

# Deploy application
npm run deploy
```

## Next Steps

1. **Implement Query Dashboard** (Task 8)
2. **Add Real-Time Notifications** (Task 9)
3. **Set up Observability** (Task 12)
4. **Run Performance Tests** (Task 18)
5. **Create Operational Runbook** (Task 17)

## Support

- **Documentation**: See README.md and architecture docs
- **Issues**: Check TROUBLESHOOTING.md
- **Architecture**: See .github/ARCHITECTURE.md
- **Multi-Cloud**: See MULTI_CLOUD_ARCHITECTURE.md

---

**Deployment Status**: ✅ Core infrastructure ready for production
**Next**: Implement Query Dashboard for complete CQRS pattern
