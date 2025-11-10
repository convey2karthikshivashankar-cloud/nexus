# Design Document: Nexus Blueprint 3.0

## Overview

The Nexus Blueprint 3.0 is a production-ready, vendor-neutral Event-Sourced microservice foundation that addresses commercial viability through standards-based governance, cost-optimized event propagation, and operational simplicity. This design eliminates proprietary toolchain dependencies while maintaining the resilience, auditability, and scalability benefits of Event Sourcing and CQRS patterns.

### Core Design Principles

- **Governance-First Architecture**: Schema Registry and Policy Engine implemented before any service logic to ensure the system is "born governed"
- **Vendor Neutrality**: Architectural governance enforced through industry-standard tools (Schema Registry, Policy-as-Code)
- **Cost Optimization**: Dual-path event propagation using high-throughput streams for core events and queue-based systems for non-critical workflows
- **Operational Simplicity**: Consolidated read model persistence to reduce operational burden while maintaining query performance
- **Standards-Based**: Portable governance framework using Open Policy Agent and standard schema registries
- **Mandatory Testing**: All resilience, integration, and schema evolution tests are required for production readiness

### System Context

The architecture implements strict separation between write operations (Command Service) and read operations (Query Dashboard) using the CQRS pattern. The Event Store serves as the immutable source of truth, with all state changes captured as domain events. This separation enables independent scaling, optimized data models for each concern, and complete audit trails for compliance.

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│  (Routes: Commands → Command Service, Queries → Query Dashboard) │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
             ▼                                    ▼
┌────────────────────────┐            ┌──────────────────────────┐
│   Command Service      │            │   Query Dashboard        │
│   (Write Model)        │            │   (Read Model)           │
│                        │            │                          │
│ ┌────────────────────┐ │            │ ┌──────────────────────┐ │
│ │ Command Handlers   │ │            │ │ Projection Handlers  │ │
│ │ - Validate         │ │            │ │ - Event Consumers    │ │
│ │ - Rehydrate State  │ │            │ │ - Update Read Models │ │
│ │ - Publish Events   │ │            │ │ - Notify Clients     │ │
│ └────────────────────┘ │            │ └──────────────────────┘ │
└────────┬───────────────┘            └────────▲─────────────────┘
         │                                     │
         │ Publish Events                      │ Consume Events
         ▼                                     │
┌────────────────────────┐                    │
│   Event Store          │                    │
│   (DynamoDB)           │                    │
│ - Immutable Log        │────CDC Stream──────┘
│ - Partitioned by       │
│   Aggregate ID         │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Snapshot Manager      │
│  - Multi-Metric        │
│    Triggers            │
└────────────────────────┘
```

### Technology Stack

**Compute**: AWS Lambda (serverless, event-driven, auto-scaling)
**API Layer**: Amazon API Gateway (managed routing, throttling, authentication)
**Event Store**: Amazon DynamoDB (high write throughput, native CDC via Streams)
**Core Event Bus**: AWS Kinesis Data Streams (sub-second latency, cost-efficient at scale)
**Secondary Event Bus**: Amazon SNS/SQS (resilient queue-based propagation)
**Read Store**: Amazon OpenSearch (full-text search, analytics, structured queries)
**Snapshot Store**: Amazon DynamoDB (separate table, optimized for point reads)
**Schema Governance**: AWS Glue Schema Registry (centralized versioning)
**Policy Enforcement**: Open Policy Agent (standards-based architectural rules)
**Observability**: Amazon CloudWatch (metrics, logs, distributed tracing)

### Event Propagation Architecture

The system uses a dual-path event propagation strategy to balance latency, cost, and resilience:

**Path 1: Kinesis Stream (Core Events)**
- Use Case: High-volume domain events requiring low latency
- Latency Target: < 500ms end-to-end (99th percentile)
- Ordering: Guaranteed within partition key (aggregateId)
- Cost Model: Provisioned throughput (shard-hour)
- Delivery: Exactly-once to each consumer

**Path 2: SNS/SQS Chain (Non-Critical Events)**
- Use Case: External integrations, notifications, retry-heavy workflows
- Latency Target: < 5 seconds
- Ordering: Best-effort
- Cost Model: Per-request pricing
- Delivery: At-least-once with DLQ

## Components and Interfaces

### 1. Command Service (Write Model)

#### Responsibilities
- Accept and validate user commands
- Rehydrate aggregate state from Event Store
- Enforce business rules and consistency boundaries
- Publish validated domain events
- Coordinate multi-aggregate workflows via Sagas

#### API Endpoints

```
POST /api/commands/{commandType}
Request: Command payload with metadata
Response: { aggregateId, version, eventIds }
Status: 202 Accepted

GET /api/sagas/{sagaId}/status
Response: { sagaId, status, currentStep, completedSteps }
Status: 200 OK
```

#### Command Processing Flow

1. **Validation**: API Gateway validates request schema and authentication
2. **Load Snapshot**: Retrieve latest snapshot for aggregate (if exists)
3. **Replay Events**: Load events since snapshot from Event Store
4. **Rehydrate State**: Reconstruct current aggregate state
5. **Execute Business Logic**: Validate command against current state
6. **Generate Events**: Create new domain events
7. **Persist**: Atomically append events to Event Store
8. **Return**: Respond with aggregate version for optimistic consistency

#### Data Structures

```typescript
interface Command {
  commandId: string;
  commandType: string;
  aggregateId: string;
  timestamp: string; // ISO 8601 UTC
  payload: Record<string, unknown>;
  metadata: {
    userId: string;
    correlationId: string;
    causationId?: string;
  };
}

interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateVersion: number;
  timestamp: string; // ISO 8601 UTC
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;
    causationId: string;
    userId: string;
    schemaVersion: string;
  };
}

interface CommandResult {
  success: boolean;
  aggregateId: string;
  version: number;
  eventIds: string[];
}
```

### 2. Event Store

#### Responsibilities
- Persist domain events immutably
- Provide change data capture stream
- Support temporal queries with throttling
- Partition by Aggregate ID for horizontal scaling

#### DynamoDB Schema

```
Table: EventStore
Partition Key: aggregateId (String)
Sort Key: version (Number)

Attributes:
- eventId: String (UUID)
- eventType: String
- timestamp: String (ISO 8601 UTC)
- payload: Map
- metadata: Map
- schemaVersion: String

Global Secondary Index: TimestampIndex
Partition Key: eventType (String)
Sort Key: timestamp (String)
Projection: ALL
```

#### Interface Operations

```typescript
interface EventStore {
  // Append events atomically
  append(events: DomainEvent[]): Promise<void>;
  
  // Get events for aggregate
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]>;
  
  // Temporal query (throttled, read-only)
  getEventsByTimeRange(
    eventType: string,
    startTime: string,
    endTime: string,
    limit: number
  ): Promise<DomainEvent[]>;
  
  // Subscribe to CDC stream
  subscribeToStream(
    handler: (event: DomainEvent) => Promise<void>
  ): void;
}
```

#### Performance Characteristics

- Write Latency: < 50ms (p99)
- Read Latency (single aggregate): < 200ms (p99)
- Throughput: 10,000+ writes/second per partition
- Durability: Multi-AZ replication with 99.999% availability

### 3. Event Bus

#### Dual-Path Event Router

The Event Router Lambda consumes DynamoDB Streams and routes events based on criticality:

```typescript
class EventRouter {
  async route(event: DomainEvent): Promise<void> {
    // Validate against schema registry
    await this.schemaRegistry.validate(event);
    
    // Route based on event criticality
    if (this.isCoreEvent(event.eventType)) {
      // High-throughput, low-latency path
      await this.kinesisPublisher.publish(event, event.aggregateId);
    } else {
      // Resilient, queue-based path
      await this.snsPublisher.publish(event);
    }
    
    // Emit routing metrics
    this.metrics.recordEventRouted(event.eventType, this.getPath(event));
  }
  
  private isCoreEvent(eventType: string): boolean {
    return CORE_EVENT_TYPES.includes(eventType);
  }
}
```

#### Kinesis Configuration

- Shard Count: Auto-scaling based on throughput
- Retention: 24 hours
- Partition Key: aggregateId (ensures ordering per aggregate)
- Consumer: Enhanced fan-out for dedicated throughput per projection

#### SNS/SQS Configuration

- SNS Topic: Fan-out to multiple SQS queues
- SQS Queues: One per projection handler
- Visibility Timeout: 30 seconds
- Max Receive Count: 5 (then move to DLQ)
- DLQ: Separate queue for failed messages

### 4. Snapshot Manager

#### Responsibilities
- Monitor aggregate event streams
- Create snapshots based on multi-metric triggers
- Store snapshots with versioning
- Expose snapshot metrics

#### Multi-Metric Trigger Strategy

Snapshots are created when ANY of the following conditions are met:

1. **Event Count Threshold**: Aggregate has > 1000 events since last snapshot
2. **Aggregate Size Threshold**: Total event payload size > 1MB
3. **Time Elapsed Threshold**: > 24 hours since last snapshot for active aggregates

**Critical Performance Requirement**: Per Requirement 11.2, snapshots must be created within 5 seconds of threshold detection. To meet this strict latency requirement, the trigger evaluation is performed **synchronously within the Command Service** immediately after event publication, rather than relying on CloudWatch metric pipelines which have 1-minute granularity.

```typescript
interface SnapshotTrigger {
  eventCountThreshold: number;      // 1000 events
  aggregateSizeThreshold: number;   // 1MB
  timeElapsedThreshold: number;     // 24 hours
}

class SnapshotManager {
  // Called synchronously by Command Service after event append
  async evaluateTriggerSync(
    aggregateId: string,
    currentVersion: number,
    aggregateSize: number
  ): Promise<boolean> {
    const lastSnapshot = await this.getLastSnapshot(aggregateId);
    
    const eventsSinceSnapshot = currentVersion - (lastSnapshot?.version ?? 0);
    const timeSinceSnapshot = Date.now() - (lastSnapshot?.timestamp ?? 0);
    
    // Synchronous evaluation for critical thresholds
    if (eventsSinceSnapshot >= this.trigger.eventCountThreshold ||
        aggregateSize >= this.trigger.aggregateSizeThreshold) {
      // Trigger snapshot creation asynchronously (fire-and-forget)
      this.createSnapshotAsync(aggregateId).catch(err => 
        this.logger.error('Snapshot creation failed', { aggregateId, err })
      );
      return true;
    }
    
    return false;
  }
  
  private async createSnapshotAsync(aggregateId: string): Promise<void> {
    const events = await this.eventStore.getEvents(aggregateId);
    const state = this.rehydrate(events);
    
    await this.snapshotStore.save({
      aggregateId,
      version: events.length,
      state,
      timestamp: Date.now(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: {
        eventCount: events.length,
        aggregateSize: this.calculateSize(events)
      }
    });
  }
}
```

#### Hybrid Automation Strategy

**Synchronous Triggers** (Command Service):
- Event Count Threshold: Evaluated immediately after event append
- Aggregate Size Threshold: Evaluated immediately after event append
- Guarantees 5-second latency requirement

**Asynchronous Triggers** (EventBridge):
- Time Elapsed Threshold: Scheduled daily evaluation for active aggregates
- Backup mechanism for missed synchronous triggers

#### Snapshot Schema

```
Table: Snapshots
Partition Key: aggregateId (String)
Sort Key: version (Number)

Attributes:
- timestamp: Number (Unix timestamp)
- state: Map (aggregate state)
- schemaVersion: String
- metadata: Map (eventCount, aggregateSize)
```

### 5. Query Dashboard (Read Model)

#### Responsibilities
- Consume events from Event Bus
- Maintain optimized read projections
- Serve query requests with low latency
- Provide real-time update notifications
- Support temporal queries via Event Store

#### Dual Persistence Strategy

**Primary Store: Amazon OpenSearch**
- Structured queries with complex filters
- Full-text search with sub-second response times
- Analytical aggregations
- Real-time dashboards
- Optimized indexes for common query patterns

**Audit Store: Event Store (Read-Only)**
- Temporal queries (time travel)
- Compliance audits
- Historical reconstruction
- Rate-limited access (10 requests/minute/client)

#### Projection Handler Pattern

```typescript
class ProjectionHandler {
  async handleEvent(event: DomainEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Transform event to read model
      const readModel = this.transform(event);
      
      // Update OpenSearch with optimistic concurrency
      await this.openSearch.upsert(readModel, event.aggregateVersion);
      
      // Publish real-time notification
      await this.notificationService.notify({
        aggregateId: event.aggregateId,
        version: event.aggregateVersion,
        eventId: event.eventId,
        timestamp: event.timestamp
      });
      
      // Record projection lag metric
      const lag = Date.now() - new Date(event.timestamp).getTime();
      this.metrics.recordProjectionLag(lag);
      
    } catch (error) {
      this.logger.error('Projection failed', { event, error });
      throw error; // Triggers retry with exponential backoff
    }
  }
  
  private transform(event: DomainEvent): ReadModel {
    // Apply upcasting if needed for schema evolution
    const upcastedEvent = this.upcaster.upcast(event);
    
    // Transform to denormalized read model
    return this.transformer.toReadModel(upcastedEvent);
  }
}
```

#### Query API Endpoints

```
GET /api/queries/{resourceType}
Query Parameters: filters, pagination, sort
Response: { items: [], total, nextToken }
Cache-Control: max-age=60
Rate Limit: 1000 requests/minute/client

GET /api/queries/{resourceType}/search
Query Parameters: q (search term), filters, facets
Response: { results: [], total, facets, took }
Rate Limit: 100 requests/minute/client

GET /api/queries/temporal/{aggregateId}
Query Parameters: asOf (ISO 8601 timestamp)
Response: Historical state at specified time
Rate Limit: 10 requests/minute/client
Max Time Range: 90 days

WebSocket: /api/subscriptions
Protocol: WebSocket
Messages: { type: 'update', aggregateId, version, eventId }
Connection Limit: 1000 concurrent per client
```

#### Real-Time Notifications

Replaces inefficient client-side polling with push-based notifications:

```typescript
class NotificationService {
  private connections: Map<string, WebSocket> = new Map();
  
  async notify(update: ProjectionUpdate): Promise<void> {
    const message = {
      type: 'projection_updated',
      aggregateId: update.aggregateId,
      version: update.version,
      eventId: update.eventId,
      timestamp: update.timestamp
    };
    
    // Find subscribed clients
    const subscribers = this.getSubscribers(update.aggregateId);
    
    // Push notification to all subscribers
    await Promise.all(
      subscribers.map(ws => this.send(ws, message))
    );
    
    // Throttle: max 100 notifications/second/client
    await this.throttle(subscribers);
  }
  
  subscribe(clientId: string, aggregateIds: string[]): void {
    const ws = this.connections.get(clientId);
    if (ws) {
      this.subscriptions.set(clientId, aggregateIds);
    }
  }
}
```

#### OpenSearch Index Schema

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "aggregateId": { "type": "keyword" },
      "version": { "type": "long" },
      "lastUpdated": { "type": "date" },
      "status": { "type": "keyword" },
      "searchableText": { 
        "type": "text",
        "analyzer": "standard"
      },
      "metadata": {
        "type": "object",
        "enabled": true
      },
      "tags": { "type": "keyword" }
    }
  },
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 2,
    "refresh_interval": "1s"
  }
}
```

### 6. Schema Registry

#### Responsibilities
- Store event and command schemas with versions
- Validate compatibility on schema changes
- Enforce backward compatibility rules
- Provide schema retrieval API

#### AWS Glue Schema Registry Integration

```typescript
interface SchemaRegistry {
  // Register new schema version
  registerSchema(
    schemaName: string,
    schemaDefinition: string,
    compatibilityMode: 'BACKWARD' | 'FORWARD' | 'FULL'
  ): Promise<SchemaVersion>;
  
  // Validate event against schema
  validate(event: DomainEvent): Promise<ValidationResult>;
  
  // Get schema by version
  getSchema(
    schemaName: string, 
    version: number
  ): Promise<Schema>;
  
  // Check compatibility
  checkCompatibility(
    schemaName: string,
    newSchema: string
  ): Promise<CompatibilityResult>;
}
```

#### Schema Evolution Rules

**Additive Changes (Allowed - Backward Compatible)**
- Add optional fields with defaults
- Add new event types
- Extend enums with new values
- Add new metadata fields

**Breaking Changes (Require Major Version Increment)**
- Remove fields
- Rename fields
- Change field types
- Make optional fields required
- Remove enum values

**Upcasting Strategy**

Projection Handlers implement version-specific transformers:

```typescript
class EventUpcaster {
  upcast(event: DomainEvent): DomainEvent {
    const currentVersion = CURRENT_SCHEMA_VERSION;
    const eventVersion = event.metadata.schemaVersion;
    
    if (eventVersion === currentVersion) {
      return event;
    }
    
    // Apply transformation chain
    let upcastedEvent = event;
    for (let v = eventVersion; v < currentVersion; v++) {
      upcastedEvent = this.transformers[v].transform(upcastedEvent);
    }
    
    return upcastedEvent;
  }
}

// Example transformer
class V1ToV2Transformer {
  transform(event: DomainEvent): DomainEvent {
    // Split 'fullName' into 'firstName' and 'lastName'
    const { fullName, ...rest } = event.payload;
    const [firstName, lastName] = fullName.split(' ');
    
    return {
      ...event,
      payload: {
        ...rest,
        firstName,
        lastName
      },
      metadata: {
        ...event.metadata,
        schemaVersion: '2.0'
      }
    };
  }
}
```

### 7. Policy Engine

#### Responsibilities
- Enforce architectural constraints in CI/CD
- Validate service communication patterns
- Prevent Event Store mutations
- Verify schema compliance

#### Open Policy Agent Rules

```rego
package nexus.architecture

# Rule: Services must communicate via Event Bus only
deny[msg] {
  input.type == "service_call"
  input.source == "command_service"
  input.target == "query_dashboard"
  input.protocol == "http"
  
  msg := "Direct HTTP calls between Command Service and Query Dashboard are prohibited. Use Event Bus."
}

# Rule: Event Store is append-only
deny[msg] {
  input.type == "database_operation"
  input.table == "EventStore"
  input.operation in ["UPDATE", "DELETE"]
  
  msg := "Event Store mutations are prohibited. Only INSERT operations allowed."
}

# Rule: All events must have registered schemas
deny[msg] {
  input.type == "event_publish"
  not schema_exists(input.eventType)
  
  msg := sprintf("Event type '%s' has no registered schema in Schema Registry", [input.eventType])
}

# Rule: Temporal queries must be rate-limited
deny[msg] {
  input.type == "api_endpoint"
  input.path == "/api/queries/temporal/*"
  not has_rate_limit(input, 10)
  
  msg := "Temporal query endpoints must have rate limit of 10 requests/minute/client"
}
```

#### CI/CD Integration

```yaml
# .github/workflows/policy-check.yml
name: Policy Validation

on: [push, pull_request]

jobs:
  policy-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa
      
      - name: Run Policy Tests
        run: ./opa test policies/
      
      - name: Validate Architecture
        run: |
          ./opa exec --decision nexus/architecture/deny \
            --bundle policies/ \
            --input build-artifacts/service-graph.json
      
      - name: Fail on Violations
        run: |
          if [ -s violations.json ]; then
            echo "Policy violations detected"
            cat violations.json
            exit 1
          fi
```

### 8. Saga Coordinator

#### Responsibilities
- Coordinate multi-aggregate workflows
- Track saga state via events
- Execute compensating transactions on failure
- Handle timeouts and retries

#### Saga Pattern Implementation

```typescript
interface SagaStep {
  stepId: string;
  command: Command;
  compensatingCommand?: Command;
  timeout: number; // milliseconds
}

interface Saga {
  sagaId: string;
  sagaType: string;
  steps: SagaStep[];
  metadata: {
    correlationId: string;
    userId: string;
  };
}

class SagaCoordinator {
  async executeSaga(saga: Saga): Promise<SagaResult> {
    const sagaState: SagaState = {
      sagaId: saga.sagaId,
      status: 'IN_PROGRESS',
      completedSteps: [],
      currentStep: 0,
      startTime: Date.now()
    };
    
    // Publish saga started event
    await this.publishSagaEvent('SagaStarted', sagaState);
    
    try {
      for (const step of saga.steps) {
        // Execute step with timeout
        const result = await this.executeStepWithTimeout(step);
        
        sagaState.completedSteps.push(step.stepId);
        sagaState.currentStep++;
        
        await this.publishSagaEvent('SagaStepCompleted', {
          ...sagaState,
          stepId: step.stepId,
          result
        });
      }
      
      sagaState.status = 'COMPLETED';
      sagaState.endTime = Date.now();
      await this.publishSagaEvent('SagaCompleted', sagaState);
      
      return { success: true, sagaId: saga.sagaId };
      
    } catch (error) {
      // Execute compensating transactions in reverse order
      await this.compensate(saga, sagaState.completedSteps.reverse());
      
      sagaState.status = 'COMPENSATED';
      sagaState.endTime = Date.now();
      sagaState.error = error.message;
      await this.publishSagaEvent('SagaCompensated', sagaState);
      
      return { success: false, sagaId: saga.sagaId, error };
    }
  }
  
  private async executeStepWithTimeout(step: SagaStep): Promise<CommandResult> {
    return Promise.race([
      this.commandService.execute(step.command),
      this.timeout(step.timeout)
    ]);
  }
  
  private async compensate(saga: Saga, completedStepIds: string[]): Promise<void> {
    for (const stepId of completedStepIds) {
      const step = saga.steps.find(s => s.stepId === stepId);
      if (step?.compensatingCommand) {
        try {
          await this.commandService.execute(step.compensatingCommand);
        } catch (error) {
          this.logger.error('Compensation failed', { stepId, error });
          // Continue with remaining compensations
        }
      }
    }
  }
}
```

#### Saga State Events

```typescript
interface SagaEvent extends DomainEvent {
  eventType: 'SagaStarted' | 'SagaStepCompleted' | 'SagaCompleted' | 'SagaCompensated';
  payload: {
    sagaId: string;
    sagaType: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'COMPENSATED';
    completedSteps: string[];
    currentStep: number;
    startTime: number;
    endTime?: number;
    error?: string;
  };
}
```

## Data Models

### Event Store Schema

```typescript
interface StoredEvent {
  aggregateId: string;        // Partition key
  version: number;            // Sort key
  eventId: string;            // UUID
  eventType: string;          // e.g., "OrderPlaced"
  timestamp: string;          // ISO 8601 UTC
  payload: {
    // Event-specific data
  };
  metadata: {
    correlationId: string;    // Request tracking
    causationId: string;      // Causing event/command
    userId: string;           // Actor
    schemaVersion: string;    // For evolution
  };
}
```

### Snapshot Schema

```typescript
interface Snapshot {
  aggregateId: string;        // Partition key
  version: number;            // Sort key (event count at snapshot)
  timestamp: number;          // Unix timestamp
  state: {
    // Aggregate-specific state
  };
  schemaVersion: string;      // For evolution
  metadata: {
    eventCount: number;
    aggregateSize: number;    // bytes
  };
}
```

### Read Model Schema (OpenSearch)

```typescript
interface ReadModel {
  id: string;
  aggregateId: string;
  version: number;
  lastUpdated: string;        // ISO 8601
  status: string;
  searchableText: string;
  metadata: Record<string, unknown>;
  tags: string[];
}
```

### Command Schema

```typescript
interface Command {
  commandId: string;
  commandType: string;
  aggregateId: string;
  timestamp: string;
  payload: Record<string, unknown>;
  metadata: {
    userId: string;
    correlationId: string;
    causationId?: string;
  };
}
```

## Error Handling

### Failure Modes and Mitigation

#### 1. Command Validation Failure

**Cause**: Invalid command payload or business rule violation
**Response**: 400 Bad Request with detailed error message
**Mitigation**: 
- Schema validation at API Gateway
- Comprehensive business rule checks in Command Handler
- Clear error messages with field-level details

```typescript
interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  fields: {
    field: string;
    error: string;
  }[];
}
```

#### 2. Event Store Write Failure

**Cause**: DynamoDB throttling, network issues, capacity exceeded
**Response**: 503 Service Unavailable
**Mitigation**:
- Exponential backoff retry (3 attempts: 1s, 2s, 4s)
- DynamoDB auto-scaling for write capacity
- Client-side retry with jitter
- CloudWatch alarms on throttled requests

```typescript
class EventStoreClient {
  async append(events: DomainEvent[]): Promise<void> {
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        await this.dynamodb.batchWriteItem({
          RequestItems: {
            EventStore: events.map(e => ({
              PutRequest: { Item: this.serialize(e) }
            }))
          }
        });
        return;
      } catch (error) {
        if (error.code === 'ProvisionedThroughputExceededException') {
          attempt++;
          if (attempt >= maxAttempts) throw error;
          await this.sleep(Math.pow(2, attempt) * 1000);
        } else {
          throw error;
        }
      }
    }
  }
}
```

#### 3. Projection Handler Failure

**Cause**: Transformation error, OpenSearch unavailable, poison pill event
**Response**: Message remains in queue for retry
**Mitigation**:
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 5 minutes)
- Maximum 5 retry attempts
- After exhaustion, move to DLQ
- CloudWatch alarm on DLQ depth > 0
- Manual review and reprocessing workflow

```typescript
class ProjectionHandler {
  async handleEvent(event: DomainEvent): Promise<void> {
    try {
      const readModel = this.transform(event);
      await this.openSearch.upsert(readModel);
      await this.notificationService.notify(event);
    } catch (error) {
      this.logger.error('Projection failed', { 
        event, 
        error,
        retryCount: this.getRetryCount(event)
      });
      throw error; // Triggers SQS retry
    }
  }
}
```

#### 4. Saga Step Timeout

**Cause**: Downstream service slow or unavailable
**Response**: Execute compensating transactions
**Mitigation**:
- Configurable timeout per step (default 30s)
- Automatic compensation in reverse order
- Saga state events for complete audit trail
- Retry with exponential backoff before compensation

```typescript
class SagaCoordinator {
  private async executeStepWithTimeout(step: SagaStep): Promise<CommandResult> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Step timeout')), step.timeout);
    });
    
    try {
      return await Promise.race([
        this.commandService.execute(step.command),
        timeoutPromise
      ]);
    } catch (error) {
      if (error.message === 'Step timeout') {
        this.metrics.recordSagaTimeout(step.stepId);
      }
      throw error;
    }
  }
}
```

#### 5. Schema Incompatibility

**Cause**: Breaking schema change deployed without proper versioning
**Response**: Schema Registry rejects registration (CI/CD fails)
**Mitigation**:
- Compatibility checks in CI/CD pipeline
- Upcasting logic in Projection Handlers
- Schema version in event metadata
- Gradual rollout with canary deployments

```typescript
class SchemaValidator {
  async validateCompatibility(
    schemaName: string,
    newSchema: string
  ): Promise<void> {
    const existingSchema = await this.registry.getLatestSchema(schemaName);
    const result = await this.registry.checkCompatibility(
      schemaName,
      newSchema
    );
    
    if (!result.compatible) {
      throw new Error(
        `Schema incompatibility detected: ${result.violations.join(', ')}`
      );
    }
  }
}
```

### Dead Letter Queue Handling

```typescript
class DLQProcessor {
  async processDLQ(): Promise<void> {
    const messages = await this.dlq.receive(10);
    
    for (const message of messages) {
      try {
        // Log for investigation
        await this.logger.error('DLQ Message', {
          messageId: message.id,
          event: message.body,
          failureReason: message.attributes.failureReason,
          retryCount: message.attributes.retryCount,
          firstFailureTime: message.attributes.firstFailureTime
        });
        
        // Determine action based on error type
        const action = await this.determineAction(message);
        
        if (action === 'RETRY') {
          // Republish to main queue
          await this.eventBus.republish(message.body);
          await this.dlq.delete(message.id);
        } else if (action === 'SKIP') {
          // Permanently skip this message
          await this.archiveMessage(message);
          await this.dlq.delete(message.id);
        }
        // else: leave in DLQ for manual review
        
      } catch (error) {
        this.logger.error('DLQ processing failed', { message, error });
      }
    }
  }
  
  private async determineAction(message: DLQMessage): Promise<Action> {
    const error = message.attributes.failureReason;
    
    // Transient errors: retry
    if (error.includes('timeout') || error.includes('unavailable')) {
      return 'RETRY';
    }
    
    // Schema errors: skip (needs code fix)
    if (error.includes('schema') || error.includes('validation')) {
      return 'SKIP';
    }
    
    // Unknown: manual review
    return 'MANUAL';
  }
}
```

### Monitoring and Alerting

CloudWatch Alarms configured for:

```yaml
Alarms:
  - Name: HighProjectionLag
    Metric: ProjectionLag
    Threshold: 5000ms
    EvaluationPeriods: 2
    Action: SNS notification to ops team
  
  - Name: DLQDepthHigh
    Metric: DLQMessageCount
    Threshold: 1
    EvaluationPeriods: 1
    Action: PagerDuty alert
  
  - Name: CommandServiceErrors
    Metric: CommandHandlerErrors
    Threshold: 10 per minute
    EvaluationPeriods: 2
    Action: SNS notification
  
  - Name: EventStoreThrottling
    Metric: ThrottledRequests
    Threshold: 5 per minute
    EvaluationPeriods: 1
    Action: Auto-scale trigger + alert
```

## Testing Strategy

### Unit Testing

**Scope**: Individual components in isolation
**Focus**: Business logic, state transitions, validation rules
**Tools**: Jest, TypeScript

```typescript
describe('CommandHandler', () => {
  let handler: CommandHandler;
  let mockEventStore: jest.Mocked<EventStore>;
  let mockSnapshotStore: jest.Mocked<SnapshotStore>;
  
  beforeEach(() => {
    mockEventStore = createMockEventStore();
    mockSnapshotStore = createMockSnapshotStore();
    handler = new CommandHandler(mockEventStore, mockSnapshotStore);
  });
  
  it('should reject invalid commands', async () => {
    const invalidCommand = { /* missing required fields */ };
    
    await expect(handler.handle(invalidCommand))
      .rejects.toThrow('Invalid command');
  });
  
  it('should generate correct events from valid command', async () => {
    const command = createValidCommand();
    mockEventStore.getEvents.mockResolvedValue([]);
    
    const result = await handler.handle(command);
    
    expect(result.success).toBe(true);
    expect(mockEventStore.append).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'OrderPlaced' })
      ])
    );
  });
  
  it('should use snapshot when available', async () => {
    const snapshot = createSnapshot();
    mockSnapshotStore.getLatest.mockResolvedValue(snapshot);
    mockEventStore.getEvents.mockResolvedValue([]);
    
    await handler.handle(createValidCommand());
    
    expect(mockEventStore.getEvents).toHaveBeenCalledWith(
      expect.any(String),
      snapshot.version
    );
  });
});
```

### Integration Testing

**Scope**: Component interactions, AWS service integration
**Focus**: Event flow, data persistence, API contracts
**Tools**: Jest, LocalStack (for AWS services), Testcontainers

```typescript
describe('Event Propagation', () => {
  let eventStore: EventStore;
  let eventBus: EventBus;
  let queryDashboard: QueryDashboard;
  
  beforeAll(async () => {
    // Setup LocalStack for DynamoDB, Kinesis, OpenSearch
    await setupLocalStack();
    eventStore = new DynamoDBEventStore(localStackConfig);
    eventBus = new KinesisEventBus(localStackConfig);
    queryDashboard = new QueryDashboard(localStackConfig);
  });
  
  it('should propagate events from Event Store to Projection Handler', async () => {
    // Arrange: Publish event to Event Store
    const event = createDomainEvent();
    await eventStore.append([event]);
    
    // Act: Wait for propagation through Kinesis
    await waitForProjection(event.aggregateId, event.aggregateVersion, 5000);
    
    // Assert: Verify read model updated in OpenSearch
    const readModel = await queryDashboard.get(event.aggregateId);
    expect(readModel.version).toBe(event.aggregateVersion);
    expect(readModel.lastUpdated).toBeDefined();
  });
  
  it('should handle projection failures with retry', async () => {
    // Arrange: Inject temporary OpenSearch failure
    await queryDashboard.simulateFailure(2); // Fail 2 times
    
    const event = createDomainEvent();
    await eventStore.append([event]);
    
    // Act: Wait for retry and eventual success
    await waitForProjection(event.aggregateId, event.aggregateVersion, 10000);
    
    // Assert: Projection eventually succeeds
    const readModel = await queryDashboard.get(event.aggregateId);
    expect(readModel.version).toBe(event.aggregateVersion);
  });
});
```

### End-to-End Testing

**Scope**: Complete user workflows
**Focus**: Command → Event → Projection → Query flow
**Tools**: Playwright, Supertest

```typescript
describe('Order Placement Workflow', () => {
  let apiClient: APIClient;
  
  beforeAll(() => {
    apiClient = new APIClient(process.env.API_BASE_URL);
  });
  
  it('should complete order placement end-to-end', async () => {
    // 1. Submit command
    const response = await apiClient.post('/api/commands/PlaceOrder', {
      customerId: 'cust-123',
      items: [{ productId: 'prod-456', quantity: 2 }]
    });
    
    expect(response.status).toBe(202);
    const { aggregateId, version } = response.data;
    
    // 2. Wait for projection (with timeout)
    await waitForVersion(aggregateId, version, 3000);
    
    // 3. Query read model
    const order = await apiClient.get(`/api/queries/orders/${aggregateId}`);
    expect(order.status).toBe(200);
    expect(order.data.status).toBe('PLACED');
    expect(order.data.items).toHaveLength(1);
    expect(order.data.items[0].productId).toBe('prod-456');
  });
  
  it('should support real-time notifications', async () => {
    // 1. Connect WebSocket
    const ws = await apiClient.connectWebSocket('/api/subscriptions');
    const notifications: any[] = [];
    ws.on('message', msg => notifications.push(JSON.parse(msg)));
    
    // 2. Subscribe to aggregate
    ws.send(JSON.stringify({
      type: 'subscribe',
      aggregateIds: ['order-123']
    }));
    
    // 3. Submit command
    await apiClient.post('/api/commands/PlaceOrder', {
      aggregateId: 'order-123',
      customerId: 'cust-123',
      items: []
    });
    
    // 4. Wait for notification
    await waitFor(() => notifications.length > 0, 3000);
    
    // 5. Verify notification
    expect(notifications[0]).toMatchObject({
      type: 'projection_updated',
      aggregateId: 'order-123'
    });
  });
});
```

### Performance Testing

**Scope**: Latency, throughput, resource utilization
**Focus**: Meeting SLA requirements from requirements document
**Tools**: Artillery, k6, custom load generators

```typescript
describe('Performance SLAs', () => {
  it('should process commands under 200ms (p99)', async () => {
    const latencies: number[] = [];
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await commandService.handle(createCommand());
      latencies.push(Date.now() - start);
    }
    
    const p99 = percentile(latencies, 99);
    expect(p99).toBeLessThan(200);
  });
  
  it('should achieve projection lag under 2 seconds', async () => {
    const measurements: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const event = await publishEvent();
      const lag = await measureProjectionTime(event.eventId);
      measurements.push(lag);
    }
    
    const avgLag = average(measurements);
    expect(avgLag).toBeLessThan(2000);
  });
  
  it('should handle 10000 events/second throughput', async () => {
    const startTime = Date.now();
    const eventCount = 10000;
    
    // Publish events in parallel
    await Promise.all(
      Array(eventCount).fill(0).map(() => publishEvent())
    );
    
    const duration = Date.now() - startTime;
    const throughput = eventCount / (duration / 1000);
    
    expect(throughput).toBeGreaterThan(10000);
  });
});
```

### Chaos Testing

**Scope**: Resilience under failure conditions
**Focus**: DLQ behavior, retry logic, compensation
**Tools**: AWS Fault Injection Simulator, custom chaos scripts

```typescript
describe('Resilience', () => {
  it('should move poison pill events to DLQ after retries', async () => {
    // Inject event that always fails projection
    const poisonEvent = createPoisonPillEvent();
    await eventBus.publish(poisonEvent);
    
    // Wait for retry exhaustion (5 retries with exponential backoff)
    await sleep(60000);
    
    // Verify in DLQ
    const dlqMessages = await dlq.receive();
    expect(dlqMessages).toContainEqual(
      expect.objectContaining({ eventId: poisonEvent.eventId })
    );
    
    // Verify main queue is clear
    const mainQueueDepth = await eventBus.getQueueDepth();
    expect(mainQueueDepth).toBe(0);
  });
  
  it('should compensate saga on step failure', async () => {
    // Create saga with compensating commands
    const saga = createTestSaga();
    
    // Inject failure on step 2
    await commandService.injectFailure('step-2');
    
    // Execute saga
    const result = await sagaCoordinator.executeSaga(saga);
    
    // Verify compensation occurred
    expect(result.success).toBe(false);
    expect(result.status).toBe('COMPENSATED');
    
    // Verify step 1 was compensated
    const events = await eventStore.getEvents(saga.aggregateId);
    expect(events).toContainEqual(
      expect.objectContaining({ eventType: 'Step1Compensated' })
    );
  });
  
  it('should handle OpenSearch unavailability', async () => {
    // Simulate OpenSearch outage
    await openSearch.simulateOutage(30000); // 30 seconds
    
    // Publish events during outage
    const events = await publishMultipleEvents(10);
    
    // Wait for OpenSearch recovery
    await sleep(35000);
    
    // Verify all events eventually projected
    for (const event of events) {
      const readModel = await queryDashboard.get(event.aggregateId);
      expect(readModel.version).toBe(event.aggregateVersion);
    }
  });
});
```

### Schema Evolution Testing

**Scope**: Backward compatibility, upcasting
**Focus**: Ensuring old events work with new code
**Tools**: Jest, custom schema validators

```typescript
describe('Schema Evolution', () => {
  it('should upcast v1 events to v2 format', async () => {
    // Create v1 event (old format)
    const v1Event = {
      eventId: 'evt-123',
      eventType: 'UserRegistered',
      aggregateId: 'user-456',
      aggregateVersion: 1,
      timestamp: '2025-01-01T00:00:00Z',
      payload: {
        fullName: 'John Doe',
        email: 'john@example.com'
      },
      metadata: {
        schemaVersion: '1.0',
        correlationId: 'corr-123',
        causationId: 'cmd-123',
        userId: 'system'
      }
    };
    
    // Apply upcasting
    const upcaster = new EventUpcaster();
    const v2Event = upcaster.upcast(v1Event);
    
    // Verify transformation
    expect(v2Event.payload).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    expect(v2Event.metadata.schemaVersion).toBe('2.0');
  });
  
  it('should reject breaking schema changes', async () => {
    const existingSchema = await schemaRegistry.getLatestSchema('UserRegistered');
    
    // Attempt to register breaking change (remove required field)
    const breakingSchema = {
      ...existingSchema,
      properties: {
        email: { type: 'string' }
        // Missing 'firstName' and 'lastName'
      }
    };
    
    await expect(
      schemaRegistry.registerSchema('UserRegistered', breakingSchema, 'BACKWARD')
    ).rejects.toThrow('Schema incompatibility');
  });
});
```

---

This design provides a complete, production-ready architecture that addresses all requirements while maintaining vendor neutrality, cost efficiency, and operational simplicity. The dual-path event propagation, consolidated read model, and standards-based governance eliminate commercial viability gaps while ensuring the system meets all performance and reliability requirements.
