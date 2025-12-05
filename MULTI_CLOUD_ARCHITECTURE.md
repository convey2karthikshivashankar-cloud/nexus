# Multi-Cloud Architecture: Nexus Blueprint 3.0

## Overview

The Nexus Blueprint 3.0 uses **Ports & Adapters (Hexagonal Architecture)** to achieve vendor neutrality while defaulting to AWS for rapid prototyping. This document explains the multi-cloud strategy, component mappings, and migration paths.

## Architecture Pattern: Ports & Adapters

### Core Principle

```
┌─────────────────────────────────────────────────────────┐
│                   Domain Layer                          │
│              (Vendor-Neutral Business Logic)            │
│                                                         │
│  CommandHandler, Saga, Projection, Policy Engine       │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Uses Ports (Interfaces)
                 │
┌────────────────▼────────────────────────────────────────┐
│                    Ports Layer                          │
│              (Vendor-Neutral Interfaces)                │
│                                                         │
│  EventStorePort, SchemaRegistryPort, EventBusPort       │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Implemented by Adapters
                 │
┌────────────────▼────────────────────────────────────────┐
│                  Adapters Layer                         │
│            (Vendor-Specific Implementations)            │
│                                                         │
│  AWS │ GCP │ Azure │ Open Source                        │
└─────────────────────────────────────────────────────────┘
```

### Benefits

✅ **Vendor Neutrality**: Core logic has zero cloud dependencies
✅ **Plug-and-Play**: Switch providers via configuration
✅ **Testability**: Mock adapters for unit tests
✅ **Future-Proof**: Add new providers without changing core logic

## Component Mapping

### Event Store

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | DynamoDB | ⭐⭐⭐⭐⭐ | **Default** - Fully managed, auto-scaling |
| **GCP** | Firestore | ⭐⭐⭐⭐ | Document model, good for ES |
| **Azure** | Cosmos DB | ⭐⭐⭐⭐ | Multi-model, global distribution |
| **Open Source** | EventStoreDB | ⭐⭐⭐⭐⭐ | Purpose-built for Event Sourcing |
| **Open Source** | PostgreSQL | ⭐⭐⭐⭐ | With JSONB, proven at scale |

**Current Status**: ✅ AWS implemented, 🔨 EventStoreDB skeleton provided

### Event Bus (Stream)

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | Kinesis Data Streams | ⭐⭐⭐⭐⭐ | **Default** - Sub-second latency |
| **GCP** | Pub/Sub | ⭐⭐⭐⭐⭐ | Global, at-least-once delivery |
| **Azure** | Event Hubs | ⭐⭐⭐⭐ | Kafka-compatible |
| **Open Source** | Apache Kafka | ⭐⭐⭐⭐⭐ | Industry standard |
| **Open Source** | Redpanda | ⭐⭐⭐⭐ | Kafka-compatible, simpler ops |

**Current Status**: 🔜 To be implemented

### Event Bus (Queue)

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | SNS/SQS | ⭐⭐⭐⭐⭐ | **Default** - Resilient, DLQ support |
| **GCP** | Pub/Sub | ⭐⭐⭐⭐⭐ | Same as streaming |
| **Azure** | Service Bus | ⭐⭐⭐⭐ | Enterprise messaging |
| **Open Source** | RabbitMQ | ⭐⭐⭐⭐⭐ | Battle-tested |
| **Open Source** | NATS | ⭐⭐⭐⭐ | Lightweight, fast |

**Current Status**: 🔜 To be implemented

### Schema Registry

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | AWS Glue Schema Registry | ⭐⭐⭐⭐ | **Default** - Integrated with AWS |
| **GCP** | Confluent on GCP | ⭐⭐⭐⭐⭐ | Open source, Kafka-native |
| **Azure** | Azure Schema Registry | ⭐⭐⭐⭐ | Event Hubs integration |
| **Open Source** | Confluent Schema Registry | ⭐⭐⭐⭐⭐ | Industry standard |

**Current Status**: ✅ AWS implemented, 🔨 Confluent skeleton provided

### Search/Query Store

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | OpenSearch | ⭐⭐⭐⭐⭐ | **Default** - Managed Elasticsearch fork |
| **GCP** | Elasticsearch on GCP | ⭐⭐⭐⭐⭐ | Managed service |
| **Azure** | Cognitive Search | ⭐⭐⭐⭐ | AI-powered |
| **Open Source** | Elasticsearch | ⭐⭐⭐⭐⭐ | Original, feature-rich |
| **Open Source** | Meilisearch | ⭐⭐⭐⭐ | Fast, easy to use |

**Current Status**: 🔜 To be implemented

### Compute

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | Lambda | ⭐⭐⭐⭐⭐ | **Default** - Serverless, auto-scaling |
| **GCP** | Cloud Functions | ⭐⭐⭐⭐⭐ | Similar to Lambda |
| **Azure** | Azure Functions | ⭐⭐⭐⭐ | .NET-first |
| **Open Source** | Kubernetes + Knative | ⭐⭐⭐⭐ | Serverless on K8s |

**Current Status**: ✅ AWS Lambda (via CDK)

### API Gateway

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **AWS** | API Gateway | ⭐⭐⭐⭐⭐ | **Default** - Fully managed |
| **GCP** | Cloud Endpoints | ⭐⭐⭐⭐ | OpenAPI-based |
| **Azure** | API Management | ⭐⭐⭐⭐ | Enterprise features |
| **Open Source** | Kong | ⭐⭐⭐⭐⭐ | Plugin ecosystem |
| **Open Source** | Traefik | ⭐⭐⭐⭐ | Cloud-native |

**Current Status**: ✅ AWS API Gateway (via CDK)

### Policy Engine

| Provider | Implementation | Maturity | Notes |
|----------|---------------|----------|-------|
| **All** | Open Policy Agent (OPA) | ⭐⭐⭐⭐⭐ | **Already vendor-neutral!** |

**Current Status**: ✅ Implemented (cloud-agnostic)

## Configuration-Driven Provider Selection

### Environment Variables

```bash
# Select cloud provider (defaults to AWS)
CLOUD_PROVIDER=aws  # or 'gcp', 'azure', 'opensource'

# AWS Configuration
AWS_REGION=us-east-1
EVENT_STORE_TABLE=nexus-event-store
SNAPSHOTS_TABLE=nexus-snapshots
SCHEMA_REGISTRY_NAME=nexus-event-schema-registry

# Open Source Configuration (EventStoreDB)
EVENTSTORE_CONNECTION_STRING=esdb://localhost:2113

# Open Source Configuration (Confluent Schema Registry)
SCHEMA_REGISTRY_URL=http://localhost:8081

# Open Source Configuration (Kafka)
KAFKA_BROKERS=localhost:9092
```

### Code Example

```typescript
import { AdapterFactory, CloudProvider } from '@nexus/shared';

// Configuration-driven selection
const provider: CloudProvider = process.env.CLOUD_PROVIDER || 'aws';

// Create adapters
const eventStore = await AdapterFactory.createEventStore({
  provider,
  eventStore: {
    // AWS config
    tableName: process.env.EVENT_STORE_TABLE,
    region: process.env.AWS_REGION,
    // OR Open Source config
    connectionString: process.env.EVENTSTORE_CONNECTION_STRING,
  }
});

// Domain logic uses port interface (vendor-neutral)
await eventStore.append(events);
```

## Migration Paths

### AWS → Open Source

**Scenario**: Move from AWS to self-hosted open source stack

**Steps**:
1. Deploy open source infrastructure (Kafka, EventStoreDB, Elasticsearch)
2. Update environment variables:
   ```bash
   CLOUD_PROVIDER=opensource
   EVENTSTORE_CONNECTION_STRING=esdb://your-host:2113
   KAFKA_BROKERS=your-kafka:9092
   SCHEMA_REGISTRY_URL=http://your-registry:8081
   ```
3. Redeploy application (no code changes!)
4. Migrate data using event replay

**Effort**: Infrastructure setup (1-2 weeks), Data migration (depends on volume)

### AWS → GCP

**Scenario**: Move from AWS to Google Cloud

**Steps**:
1. Implement GCP adapters (similar to AWS adapters)
2. Deploy GCP infrastructure (Firestore, Pub/Sub, etc.)
3. Update environment variables:
   ```bash
   CLOUD_PROVIDER=gcp
   GCP_PROJECT_ID=your-project
   ```
4. Redeploy application
5. Migrate data

**Effort**: Adapter implementation (1 week), Infrastructure (1 week), Migration (depends on volume)

### Hybrid Cloud

**Scenario**: Run Command Service on AWS, Query Dashboard on GCP

**Approach**:
- Command Service uses AWS adapters
- Query Dashboard uses GCP adapters
- Event Bus bridges clouds (Kafka or Confluent Cloud)

**Use Case**: Regulatory requirements, disaster recovery, cost optimization

## Open Source Stack

### Complete Open Source Alternative

```yaml
# docker-compose.yml for local development
services:
  eventstoredb:
    image: eventstore/eventstore:latest
    ports:
      - "2113:2113"
    environment:
      - EVENTSTORE_INSECURE=true
  
  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"
  
  schema-registry:
    image: confluentinc/cp-schema-registry:latest
    ports:
      - "8081:8081"
    depends_on:
      - kafka
  
  elasticsearch:
    image: elasticsearch:8.11.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
  
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=nexus_snapshots
```

### Cost Comparison

| Scale | AWS (Serverless) | Open Source (K8s) |
|-------|------------------|-------------------|
| **Low** (< 1M events/month) | ~$50/month | ~$150/month (cluster overhead) |
| **Medium** (10M events/month) | ~$500/month | ~$300/month |
| **High** (100M events/month) | ~$5000/month | ~$1500/month |

**Conclusion**: AWS cheaper at low scale, open source cheaper at high scale

## Implementation Status

### ✅ Completed

- Ports (interfaces) defined for all components
- AWS adapters implemented (DynamoDB, Glue)
- Adapter factory with configuration-driven selection
- Policy Engine (OPA) - already vendor-neutral
- Documentation for multi-cloud strategy

### 🔨 In Progress

- EventStoreDB adapter skeleton (needs implementation)
- Confluent Schema Registry adapter skeleton (needs implementation)

### 🔜 To Do

- GCP adapters (Firestore, Pub/Sub)
- Azure adapters (Cosmos DB, Event Hubs)
- Kafka event bus adapter
- Complete open source adapter implementations
- Migration tooling for data transfer

## Recommendations

### For Prototyping (Current Phase)
✅ **Use AWS** - Fast, managed, low operational overhead

### For Production (Small Scale)
✅ **Use AWS** - Cost-effective, proven, easy to operate

### For Production (Large Scale)
✅ **Consider Open Source** - Lower cost, more control, portable

### For Multi-Region/Compliance
✅ **Use Hybrid** - Different providers per region

### For Maximum Portability
✅ **Use Open Source** - Run anywhere, zero vendor lock-in

## Next Steps

1. ✅ **Complete AWS implementation** (current focus)
2. **Implement one open source adapter** (proof of portability)
3. **Add GCP adapters** (if needed)
4. **Create migration tooling** (event replay, data sync)
5. **Performance benchmarks** (compare providers)

## Contributing

Want to add support for another cloud provider?

1. Implement the port interfaces in `packages/adapters/{provider}/`
2. Add provider to `AdapterFactory`
3. Update this documentation
4. Submit PR!

**Needed Adapters**:
- GCP (Firestore, Pub/Sub, Cloud Functions)
- Azure (Cosmos DB, Event Hubs, Azure Functions)
- Complete open source implementations

---

**The architecture is vendor-neutral. AWS is just the default.**
