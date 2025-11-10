# Design Document: Online Boutique Integration with Nexus Blueprint 3.0

## Overview

This design transforms Google's Online Boutique microservices demo into an event-sourced e-commerce platform using Nexus Blueprint 3.0 as the foundation. The integration follows a hybrid architecture pattern that preserves existing gRPC microservices while introducing event sourcing for critical transactional flows (checkout and cart management). This approach enables incremental migration, demonstrates multi-cloud portability, and provides a reference implementation for enterprise adoption.

### Core Design Principles

- **Incremental Transformation**: Wrap existing services with event adapters rather than rewriting them
- **Hybrid Architecture**: Coexist event-sourced aggregates with legacy gRPC services during migration
- **Zero Frontend Changes**: Maintain API compatibility so existing clients continue working
- **Multi-Cloud Demonstration**: Deploy identical functionality on AWS, GCP, and open-source infrastructure
- **Governance First**: Apply schema registry and policy engine from day one
- **Production Ready**: Include observability, disaster recovery, and performance benchmarking

### System Context

The integrated system maintains the 11 existing Online Boutique microservices while introducing:
- Event-sourced Order and Cart aggregates
- Saga-based checkout orchestration
- Analytics projections for business intelligence
- Hybrid API gateway for unified access
- Multi-cloud deployment configurations

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Hybrid API Gateway                            │
│  Routes: Commands → Event-Sourced | Queries → Projections | Legacy  │
└────────┬────────────────────────────────────┬─────────────┬──────────┘
         │                                    │             │
         ▼                                    ▼             ▼
┌────────────────────┐            ┌──────────────────┐  ┌──────────┐
│ Checkout           │            │ Analytics        │  │ Legacy   │
│ Orchestrator       │            │ Projections      │  │ Services │
│ (Event-Sourced)    │            │ (Read Models)    │  │ (gRPC)   │
└────────┬───────────┘            └────────▲─────────┘  └────┬─────┘
         │                                 │                  │
         │ Publish Events                  │ Consume Events   │
         ▼                                 │                  │
┌────────────────────┐                    │                  │
│   Event Store      │────CDC Stream──────┘                  │
│   (Multi-Cloud)    │                                       │
└────────────────────┘                                       │
         │                                                   │
         │ gRPC via Event Adapters ─────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Existing Services: │
│ - Payment (gRPC)   │
│ - Shipping (gRPC)  │
│ - Email (gRPC)     │
│ - Product (gRPC)   │
│ - Currency (gRPC)  │
└────────────────────┘
```

### Technology Stack

**Event-Sourced Components** (New):
- Checkout Orchestrator: Node.js/TypeScript Lambda
- Cart Service: Node.js/TypeScript Lambda
- Analytics Projections: Node.js/TypeScript Lambda
- Event Adapters: Node.js/TypeScript Lambda

**Legacy Components** (Preserved):
- Payment Service: Node.js (existing)
- Shipping Service: Go (existing)
- Email Service: Python (existing)
- Product Catalog: Go (existing)
- Currency Service: Node.js (existing)
- Recommendation Service: Python (existing)
- Ad Service: Java (existing)
- Frontend: Go (existing)

**Infrastructure** (Multi-Cloud):
- AWS: DynamoDB Event Store, Kinesis Event Bus, OpenSearch Projections
- GCP: Cloud Spanner Event Store, Pub/Sub Event Bus, BigQuery Projections
- Open Source: EventStoreDB, Kafka, Elasticsearch

**Deployment**:
- Event-Sourced Services: AWS Lambda (serverless)
- Legacy Services: Kubernetes (existing deployment)
- Hybrid Gateway: API Gateway (AWS) / Cloud Endpoints (GCP)

## Components and Interfaces

### 1. Checkout Orchestrator (Event-Sourced)

#### Responsibilities
- Replace synchronous checkout service with saga-based orchestration
- Manage Order aggregate lifecycle
- Coordinate with legacy services via event adapters
- Publish domain events for all order state changes

#### API Endpoints

```typescript
POST /api/orders/place
Request: {
  userId: string;
  userCurrency: string;
  address: Address;
  email: string;
  creditCard: CreditCardInfo;
}
Response: {
  orderId: string;
  version: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}
Status: 202 Accepted

GET /api/orders/{orderId}
Response: {
  orderId: string;
  status: string;
  items: OrderItem[];
  total: Money;
  timeline: OrderEvent[];
}
Status: 200 OK

GET /api/orders/{orderId}/history?asOf=2024-01-15T10:30:00Z
Response: Historical order state at specified timestamp
Status: 200 OK
```


#### Order Aggregate Events

```typescript
// Domain Events
interface OrderPlaced {
  eventType: 'OrderPlaced';
  orderId: string;
  userId: string;
  items: CartItem[];
  shippingAddress: Address;
  totalAmount: Money;
  timestamp: string;
}

interface PaymentRequested {
  eventType: 'PaymentRequested';
  orderId: string;
  amount: Money;
  creditCard: CreditCardInfo;
  timestamp: string;
}

interface PaymentCompleted {
  eventType: 'PaymentCompleted';
  orderId: string;
  transactionId: string;
  amount: Money;
  timestamp: string;
}

interface ShipmentScheduled {
  eventType: 'ShipmentScheduled';
  orderId: string;
  trackingId: string;
  estimatedDelivery: string;
  timestamp: string;
}

interface OrderCompleted {
  eventType: 'OrderCompleted';
  orderId: string;
  completedAt: string;
}

interface OrderFailed {
  eventType: 'OrderFailed';
  orderId: string;
  reason: string;
  failedStep: string;
  timestamp: string;
}
```

#### Saga Implementation

```typescript
class CheckoutSaga {
  async execute(command: PlaceOrderCommand): Promise<SagaResult> {
    const saga: Saga = {
      sagaId: uuid(),
      sagaType: 'CheckoutSaga',
      steps: [
        {
          stepId: 'retrieve-cart',
          command: { type: 'GetCart', userId: command.userId },
          compensatingCommand: null,
          timeout: 5000
        },
        {
          stepId: 'process-payment',
          command: { type: 'ChargeCard', ...command.creditCard },
          compensatingCommand: { type: 'RefundPayment' },
          timeout: 30000
        },
        {
          stepId: 'schedule-shipment',
          command: { type: 'ShipOrder', address: command.address },
          compensatingCommand: { type: 'CancelShipment' },
          timeout: 10000
        },
        {
          stepId: 'send-confirmation',
          command: { type: 'SendEmail', email: command.email },
          compensatingCommand: null,
          timeout: 5000
        },
        {
          stepId: 'empty-cart',
          command: { type: 'EmptyCart', userId: command.userId },
          compensatingCommand: null,
          timeout: 5000
        }
      ],
      metadata: {
        correlationId: command.correlationId,
        userId: command.userId
      }
    };

    return await this.sagaCoordinator.executeSaga(saga);
  }
}
```


### 2. Event Adapters for Legacy Services

#### Responsibilities
- Translate between event-driven and gRPC communication
- Maintain correlation IDs for distributed tracing
- Handle errors and publish failure events
- Support both sync and async patterns

#### Payment Service Adapter

```typescript
class PaymentServiceAdapter {
  constructor(
    private grpcClient: PaymentServiceClient,
    private eventBus: EventBusPort
  ) {}

  async handlePaymentRequested(event: PaymentRequested): Promise<void> {
    const correlationId = event.metadata.correlationId;
    
    try {
      // Call legacy gRPC service
      const response = await this.grpcClient.Charge({
        amount: event.amount,
        creditCard: event.creditCard
      });

      // Publish success event
      await this.eventBus.publish({
        eventType: 'PaymentCompleted',
        orderId: event.orderId,
        transactionId: response.transactionId,
        amount: event.amount,
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId,
          causationId: event.eventId
        }
      });
    } catch (error) {
      // Publish failure event
      await this.eventBus.publish({
        eventType: 'PaymentFailed',
        orderId: event.orderId,
        reason: error.message,
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId,
          causationId: event.eventId
        }
      });
    }
  }
}
```

#### Shipping Service Adapter

```typescript
class ShippingServiceAdapter {
  constructor(
    private grpcClient: ShippingServiceClient,
    private eventBus: EventBusPort
  ) {}

  async handleShipmentRequested(event: ShipmentRequested): Promise<void> {
    try {
      const response = await this.grpcClient.ShipOrder({
        address: event.address,
        items: event.items
      });

      await this.eventBus.publish({
        eventType: 'ShipmentScheduled',
        orderId: event.orderId,
        trackingId: response.trackingId,
        estimatedDelivery: this.calculateDelivery(),
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId: event.metadata.correlationId,
          causationId: event.eventId
        }
      });
    } catch (error) {
      await this.eventBus.publish({
        eventType: 'ShipmentFailed',
        orderId: event.orderId,
        reason: error.message,
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId: event.metadata.correlationId,
          causationId: event.eventId
        }
      });
    }
  }
}
```


### 3. Event-Sourced Cart Aggregate

#### Responsibilities
- Track all cart mutations with complete history
- Support temporal queries for abandonment analysis
- Dual-write to Redis during migration
- Publish abandonment events for marketing

#### Cart Events

```typescript
interface ItemAdded {
  eventType: 'ItemAdded';
  cartId: string;
  userId: string;
  productId: string;
  quantity: number;
  price: Money;
  timestamp: string;
}

interface ItemRemoved {
  eventType: 'ItemRemoved';
  cartId: string;
  userId: string;
  productId: string;
  timestamp: string;
}

interface QuantityUpdated {
  eventType: 'QuantityUpdated';
  cartId: string;
  userId: string;
  productId: string;
  oldQuantity: number;
  newQuantity: number;
  timestamp: string;
}

interface CartAbandoned {
  eventType: 'CartAbandoned';
  cartId: string;
  userId: string;
  items: CartItem[];
  totalValue: Money;
  lastActivity: string;
  timestamp: string;
}
```

#### Dual-Write Strategy

```typescript
class CartService {
  constructor(
    private eventStore: EventStorePort,
    private redisClient: RedisClient, // Legacy
    private eventBus: EventBusPort
  ) {}

  async addItem(userId: string, item: CartItem): Promise<void> {
    // Write to event store (new)
    const event: ItemAdded = {
      eventType: 'ItemAdded',
      cartId: userId,
      userId,
      productId: item.productId,
      quantity: item.quantity,
      price: await this.getProductPrice(item.productId),
      timestamp: new Date().toISOString(),
      metadata: {
        correlationId: uuid(),
        schemaVersion: '1.0'
      }
    };

    await this.eventStore.append([event]);
    await this.eventBus.publish(event);

    // Write to Redis (legacy - for gradual migration)
    await this.redisClient.hset(
      `cart:${userId}`,
      item.productId,
      item.quantity
    );
  }

  async getCart(userId: string): Promise<Cart> {
    // Read from event store
    const events = await this.eventStore.getEvents(userId);
    return this.rehydrateCart(events);
  }
}
```


### 4. Analytics Projections

#### Responsibilities
- Consume order and cart events
- Maintain denormalized views for BI queries
- Calculate real-time metrics
- Support dashboard APIs

#### Projection Schemas

```typescript
// Order Analytics Projection
interface OrderAnalytics {
  orderId: string;
  userId: string;
  orderDate: string;
  totalAmount: Money;
  itemCount: number;
  status: string;
  processingTime: number; // milliseconds
  paymentMethod: string;
  shippingCountry: string;
  productCategories: string[];
}

// Cart Abandonment Projection
interface CartAbandonmentRecord {
  cartId: string;
  userId: string;
  email: string;
  items: CartItem[];
  totalValue: Money;
  lastActivity: string;
  abandonedAt: string;
  recoveryEmailSent: boolean;
}

// Real-Time Metrics Projection
interface MetricsSummary {
  timestamp: string;
  ordersPerHour: number;
  averageOrderValue: Money;
  conversionRate: number;
  cartAbandonmentRate: number;
  topProducts: ProductMetric[];
}
```

#### Projection Handler

```typescript
class OrderAnalyticsProjection {
  constructor(
    private openSearch: OpenSearchClient,
    private notificationService: NotificationService
  ) {}

  async handleOrderPlaced(event: OrderPlaced): Promise<void> {
    const analytics: OrderAnalytics = {
      orderId: event.orderId,
      userId: event.userId,
      orderDate: event.timestamp,
      totalAmount: event.totalAmount,
      itemCount: event.items.length,
      status: 'PLACED',
      processingTime: 0,
      paymentMethod: 'CREDIT_CARD',
      shippingCountry: event.shippingAddress.country,
      productCategories: this.extractCategories(event.items)
    };

    await this.openSearch.index({
      index: 'order-analytics',
      id: event.orderId,
      body: analytics
    });

    // Notify real-time dashboard
    await this.notificationService.notify({
      type: 'order_placed',
      orderId: event.orderId,
      timestamp: event.timestamp
    });
  }

  async handleOrderCompleted(event: OrderCompleted): Promise<void> {
    const orderPlaced = await this.getOrderPlacedEvent(event.orderId);
    const processingTime = new Date(event.completedAt).getTime() - 
                          new Date(orderPlaced.timestamp).getTime();

    await this.openSearch.update({
      index: 'order-analytics',
      id: event.orderId,
      body: {
        doc: {
          status: 'COMPLETED',
          processingTime
        }
      }
    });
  }
}
```


### 5. Hybrid API Gateway

#### Responsibilities
- Route commands to event-sourced services
- Route queries to projections or legacy services
- Maintain API compatibility with existing frontend
- Implement feature flags for gradual rollout

#### Routing Configuration

```typescript
const routingConfig = {
  // Event-sourced routes
  'POST /api/orders/place': {
    target: 'checkout-orchestrator',
    type: 'command',
    featureFlag: 'use-event-sourced-checkout'
  },
  'GET /api/orders/:id': {
    target: 'analytics-projection',
    type: 'query',
    fallback: 'legacy-checkout-service'
  },
  'POST /api/cart/add': {
    target: 'cart-service',
    type: 'command',
    featureFlag: 'use-event-sourced-cart'
  },
  
  // Legacy routes (preserved)
  'GET /api/products': {
    target: 'product-catalog-service',
    type: 'query'
  },
  'POST /api/currency/convert': {
    target: 'currency-service',
    type: 'query'
  },
  'GET /api/recommendations': {
    target: 'recommendation-service',
    type: 'query'
  }
};
```

#### Feature Flag Implementation

```typescript
class HybridGateway {
  async routeRequest(req: Request): Promise<Response> {
    const route = this.matchRoute(req.path, req.method);
    
    // Check feature flag
    if (route.featureFlag) {
      const enabled = await this.featureFlagService.isEnabled(
        route.featureFlag,
        req.user
      );
      
      if (!enabled && route.fallback) {
        return this.routeToLegacy(req, route.fallback);
      }
    }
    
    // Route to target
    if (route.type === 'command') {
      return this.routeToCommandService(req, route.target);
    } else {
      return this.routeToQueryService(req, route.target);
    }
  }
}
```


## Multi-Cloud Deployment Configurations

### AWS Deployment

```typescript
const awsConfig = {
  eventStore: {
    provider: 'aws',
    adapter: 'DynamoDBEventStore',
    config: {
      tableName: 'online-boutique-events',
      region: 'us-east-1',
      billingMode: 'PAY_PER_REQUEST'
    }
  },
  eventBus: {
    provider: 'aws',
    adapter: 'KinesisEventBus',
    config: {
      streamName: 'online-boutique-events',
      shardCount: 2
    }
  },
  projectionStore: {
    provider: 'aws',
    adapter: 'OpenSearchProjectionStore',
    config: {
      endpoint: 'https://search-domain.us-east-1.es.amazonaws.com',
      index: 'order-analytics'
    }
  },
  compute: {
    provider: 'aws',
    adapter: 'LambdaCompute',
    config: {
      runtime: 'nodejs18.x',
      memory: 512,
      timeout: 30
    }
  }
};
```

### GCP Deployment

```typescript
const gcpConfig = {
  eventStore: {
    provider: 'gcp',
    adapter: 'SpannerEventStore',
    config: {
      instance: 'online-boutique',
      database: 'events',
      table: 'event_store'
    }
  },
  eventBus: {
    provider: 'gcp',
    adapter: 'PubSubEventBus',
    config: {
      topic: 'online-boutique-events',
      subscription: 'projections-sub'
    }
  },
  projectionStore: {
    provider: 'gcp',
    adapter: 'BigQueryProjectionStore',
    config: {
      dataset: 'analytics',
      table: 'order_analytics'
    }
  },
  compute: {
    provider: 'gcp',
    adapter: 'CloudRunCompute',
    config: {
      region: 'us-central1',
      memory: '512Mi',
      timeout: 30
    }
  }
};
```

### Open Source Deployment

```typescript
const openSourceConfig = {
  eventStore: {
    provider: 'opensource',
    adapter: 'EventStoreDBAdapter',
    config: {
      connectionString: 'esdb://localhost:2113',
      database: 'online-boutique'
    }
  },
  eventBus: {
    provider: 'opensource',
    adapter: 'KafkaEventBus',
    config: {
      brokers: ['localhost:9092'],
      topic: 'online-boutique-events'
    }
  },
  projectionStore: {
    provider: 'opensource',
    adapter: 'ElasticsearchProjectionStore',
    config: {
      node: 'http://localhost:9200',
      index: 'order-analytics'
    }
  },
  compute: {
    provider: 'kubernetes',
    adapter: 'KubernetesCompute',
    config: {
      namespace: 'online-boutique',
      replicas: 3
    }
  }
};
```


## Data Models

### Event Store Schema

```typescript
interface StoredEvent {
  aggregateId: string;        // userId for cart, orderId for order
  aggregateType: string;      // 'Order' | 'Cart'
  version: number;
  eventId: string;
  eventType: string;
  timestamp: string;
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;
    causationId: string;
    userId: string;
    schemaVersion: string;
    source: string;           // 'checkout-orchestrator' | 'cart-service'
  };
}
```

### Projection Schemas

```typescript
// OpenSearch Order Analytics Index
interface OrderAnalyticsDocument {
  orderId: string;
  userId: string;
  orderDate: string;
  completedDate?: string;
  status: 'PLACED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalAmount: {
    currencyCode: string;
    units: number;
    nanos: number;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: Money;
    category: string;
  }>;
  shippingAddress: {
    country: string;
    city: string;
    state: string;
  };
  processingTime: number;
  paymentTransactionId?: string;
  shippingTrackingId?: string;
}

// Cart Abandonment Index
interface CartAbandonmentDocument {
  cartId: string;
  userId: string;
  email: string;
  lastActivity: string;
  abandonedAt: string;
  items: CartItem[];
  totalValue: Money;
  recoveryEmailSent: boolean;
  recoveryEmailSentAt?: string;
  recovered: boolean;
  recoveredAt?: string;
}
```

## Error Handling

### Saga Compensation

```typescript
class CheckoutSagaCompensation {
  async compensate(saga: Saga, completedSteps: string[]): Promise<void> {
    // Reverse order compensation
    for (const stepId of completedSteps.reverse()) {
      const step = saga.steps.find(s => s.stepId === stepId);
      
      if (step?.compensatingCommand) {
        try {
          await this.executeCompensation(step.compensatingCommand);
          
          await this.eventBus.publish({
            eventType: 'SagaStepCompensated',
            sagaId: saga.sagaId,
            stepId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // Log compensation failure but continue
          this.logger.error('Compensation failed', {
            sagaId: saga.sagaId,
            stepId,
            error
          });
        }
      }
    }
  }
}
```

### Event Adapter Error Handling

```typescript
class EventAdapterErrorHandler {
  async handleGrpcError(
    event: DomainEvent,
    error: GrpcError
  ): Promise<void> {
    // Publish failure event
    await this.eventBus.publish({
      eventType: `${event.eventType}Failed`,
      originalEventId: event.eventId,
      reason: error.message,
      grpcCode: error.code,
      timestamp: new Date().toISOString(),
      metadata: {
        correlationId: event.metadata.correlationId,
        causationId: event.eventId
      }
    });

    // Trigger saga compensation if needed
    if (this.isCompensatable(event)) {
      await this.sagaCoordinator.triggerCompensation(
        event.metadata.correlationId
      );
    }
  }
}
```


## Testing Strategy

### Integration Testing

```typescript
describe('Checkout Saga Integration', () => {
  it('should complete order with all steps successful', async () => {
    // Arrange
    const command = createPlaceOrderCommand();
    const mockPaymentService = createMockPaymentService();
    const mockShippingService = createMockShippingService();
    
    // Act
    const result = await checkoutOrchestrator.placeOrder(command);
    
    // Assert
    expect(result.status).toBe('COMPLETED');
    expect(mockPaymentService.charge).toHaveBeenCalled();
    expect(mockShippingService.shipOrder).toHaveBeenCalled();
    
    // Verify events published
    const events = await eventStore.getEvents(result.orderId);
    expect(events).toContainEventType('OrderPlaced');
    expect(events).toContainEventType('PaymentCompleted');
    expect(events).toContainEventType('ShipmentScheduled');
    expect(events).toContainEventType('OrderCompleted');
  });

  it('should compensate on payment failure', async () => {
    // Arrange
    const command = createPlaceOrderCommand();
    const mockPaymentService = createFailingPaymentService();
    
    // Act
    const result = await checkoutOrchestrator.placeOrder(command);
    
    // Assert
    expect(result.status).toBe('FAILED');
    
    // Verify compensation events
    const events = await eventStore.getEvents(result.orderId);
    expect(events).toContainEventType('PaymentFailed');
    expect(events).toContainEventType('OrderFailed');
  });
});
```

### Performance Benchmarking

```typescript
class PerformanceBenchmark {
  async compareCheckoutLatency(): Promise<BenchmarkResult> {
    const legacyLatencies: number[] = [];
    const eventSourcedLatencies: number[] = [];
    
    // Run 1000 orders through each implementation
    for (let i = 0; i < 1000; i++) {
      const command = generateRandomOrder();
      
      // Legacy checkout
      const legacyStart = Date.now();
      await legacyCheckoutService.placeOrder(command);
      legacyLatencies.push(Date.now() - legacyStart);
      
      // Event-sourced checkout
      const esStart = Date.now();
      await checkoutOrchestrator.placeOrder(command);
      eventSourcedLatencies.push(Date.now() - esStart);
    }
    
    return {
      legacy: {
        p50: percentile(legacyLatencies, 50),
        p95: percentile(legacyLatencies, 95),
        p99: percentile(legacyLatencies, 99),
        avg: average(legacyLatencies)
      },
      eventSourced: {
        p50: percentile(eventSourcedLatencies, 50),
        p95: percentile(eventSourcedLatencies, 95),
        p99: percentile(eventSourcedLatencies, 99),
        avg: average(eventSourcedLatencies)
      }
    };
  }
}
```

### Schema Evolution Testing

```typescript
describe('Event Schema Evolution', () => {
  it('should upcast v1 events to v2 format', async () => {
    // Arrange: Store v1 event
    const v1Event = {
      eventType: 'OrderPlaced',
      orderId: '123',
      customerName: 'John Doe', // v1: single field
      schemaVersion: '1.0'
    };
    await eventStore.append([v1Event]);
    
    // Act: Read with v2 projection
    const projection = new OrderAnalyticsProjection();
    await projection.handleOrderPlaced(v1Event);
    
    // Assert: v2 format with split name
    const analytics = await openSearch.get('order-analytics', '123');
    expect(analytics.customerFirstName).toBe('John');
    expect(analytics.customerLastName).toBe('Doe');
  });
});
```


## Migration Strategy

### Phase 1: Parallel Run (Weeks 1-2)

**Objective**: Deploy event-sourced components alongside legacy services without routing production traffic.

**Steps**:
1. Deploy Checkout Orchestrator with feature flag disabled
2. Deploy Event Adapters for payment, shipping, email services
3. Deploy Analytics Projections consuming events
4. Configure dual-write for cart service (Redis + Event Store)
5. Run synthetic load tests comparing both implementations
6. Validate event schemas in Schema Registry
7. Verify projection consistency

**Success Criteria**:
- Event-sourced checkout completes 1000 test orders successfully
- Projection lag remains under 2 seconds
- No errors in DLQ
- Performance within 20% of legacy implementation

### Phase 2: Canary Rollout (Weeks 3-4)

**Objective**: Route 10% of production traffic to event-sourced checkout.

**Steps**:
1. Enable feature flag for 10% of users (based on user ID hash)
2. Monitor error rates, latency, and business metrics
3. Compare order completion rates between cohorts
4. Gradually increase to 25%, 50%, 75% based on metrics
5. Implement automated rollback on error threshold breach

**Success Criteria**:
- Error rate < 0.1% for event-sourced cohort
- P95 latency < 2 seconds
- Order completion rate matches legacy within 1%
- Zero data loss or corruption incidents

### Phase 3: Full Migration (Week 5)

**Objective**: Route 100% of traffic to event-sourced implementation.

**Steps**:
1. Enable feature flag for all users
2. Monitor for 48 hours with rollback capability
3. Decommission legacy checkout service
4. Migrate cart service fully to event store (stop dual-write)
5. Remove Redis dependency for cart state

**Success Criteria**:
- All orders processed through event-sourced path
- Legacy services successfully decommissioned
- Documentation updated
- Runbooks created for operations team

### Phase 4: Multi-Cloud Expansion (Weeks 6-8)

**Objective**: Deploy to GCP and open-source infrastructure.

**Steps**:
1. Configure GCP deployment with Spanner and Pub/Sub
2. Configure open-source deployment with EventStoreDB and Kafka
3. Run parallel deployments across all three platforms
4. Validate identical functionality
5. Implement cross-cloud disaster recovery

**Success Criteria**:
- Identical order processing on AWS, GCP, and open-source
- Configuration-only provider switching
- Disaster recovery tested with failover < 5 minutes


## Observability

### Distributed Tracing

```typescript
class TracingMiddleware {
  async traceCheckoutSaga(command: PlaceOrderCommand): Promise<void> {
    const tracer = otel.trace.getTracer('checkout-orchestrator');
    
    const span = tracer.startSpan('checkout.placeOrder', {
      attributes: {
        'order.userId': command.userId,
        'order.itemCount': command.items.length,
        'order.totalAmount': command.totalAmount.units
      }
    });

    try {
      // Propagate trace context through events
      const correlationId = span.spanContext().traceId;
      
      await this.checkoutOrchestrator.placeOrder({
        ...command,
        metadata: {
          correlationId,
          traceId: span.spanContext().traceId,
          spanId: span.spanContext().spanId
        }
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### Metrics Collection

```typescript
class MetricsCollector {
  recordOrderPlaced(event: OrderPlaced): void {
    // Counter: Total orders
    this.metrics.increment('orders.placed.total', {
      currency: event.totalAmount.currencyCode,
      country: event.shippingAddress.country
    });

    // Histogram: Order value distribution
    this.metrics.histogram('orders.value', event.totalAmount.units, {
      currency: event.totalAmount.currencyCode
    });

    // Gauge: Active orders
    this.metrics.gauge('orders.active', this.getActiveOrderCount());
  }

  recordSagaStep(step: string, duration: number, success: boolean): void {
    // Histogram: Step duration
    this.metrics.histogram(`saga.step.${step}.duration`, duration);

    // Counter: Step outcomes
    this.metrics.increment(`saga.step.${step}.${success ? 'success' : 'failure'}`);
  }

  recordProjectionLag(projectionName: string, lag: number): void {
    // Gauge: Projection lag in seconds
    this.metrics.gauge(`projection.${projectionName}.lag`, lag);
  }
}
```

### Alerting Rules

```yaml
alerts:
  - name: HighOrderFailureRate
    condition: rate(orders.failed.total[5m]) > 0.05
    severity: critical
    message: "Order failure rate exceeds 5% over 5 minutes"
    
  - name: HighProjectionLag
    condition: projection.order_analytics.lag > 10
    severity: warning
    message: "Order analytics projection lag exceeds 10 seconds"
    
  - name: SagaCompensationSpike
    condition: rate(saga.compensated.total[5m]) > 10
    severity: warning
    message: "Saga compensation rate exceeds 10 per 5 minutes"
    
  - name: DLQDepthIncreasing
    condition: dlq.depth > 100
    severity: critical
    message: "Dead letter queue depth exceeds 100 messages"
```

## Security Considerations

### Authentication and Authorization

```typescript
class SecurityMiddleware {
  async validateOrderCommand(
    command: PlaceOrderCommand,
    user: AuthenticatedUser
  ): Promise<void> {
    // Verify user owns the cart
    if (command.userId !== user.userId) {
      throw new UnauthorizedError('Cannot place order for another user');
    }

    // Verify payment method ownership
    const paymentMethods = await this.paymentService.getUserPaymentMethods(
      user.userId
    );
    if (!paymentMethods.includes(command.creditCard.last4)) {
      throw new UnauthorizedError('Invalid payment method');
    }

    // Rate limiting
    const recentOrders = await this.getRecentOrders(user.userId, '1h');
    if (recentOrders.length > 10) {
      throw new RateLimitError('Too many orders in short period');
    }
  }
}
```

### PII Protection

```typescript
class PIIProtection {
  sanitizeEventForLogging(event: DomainEvent): DomainEvent {
    const sanitized = { ...event };
    
    // Mask credit card numbers
    if (sanitized.payload.creditCard) {
      sanitized.payload.creditCard = {
        ...sanitized.payload.creditCard,
        creditCardNumber: this.maskCreditCard(
          sanitized.payload.creditCard.creditCardNumber
        ),
        creditCardCvv: '***'
      };
    }

    // Mask email addresses
    if (sanitized.payload.email) {
      sanitized.payload.email = this.maskEmail(sanitized.payload.email);
    }

    return sanitized;
  }

  private maskCreditCard(number: string): string {
    return `****-****-****-${number.slice(-4)}`;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
}
```

## Cost Optimization

### Resource Sizing

```typescript
const resourceConfig = {
  aws: {
    lambda: {
      checkoutOrchestrator: {
        memory: 512, // MB
        timeout: 30, // seconds
        reservedConcurrency: 100
      },
      eventAdapters: {
        memory: 256,
        timeout: 10,
        reservedConcurrency: 50
      },
      projections: {
        memory: 512,
        timeout: 60,
        reservedConcurrency: 20
      }
    },
    dynamodb: {
      eventStore: {
        billingMode: 'PAY_PER_REQUEST', // Cost-effective for variable load
        pointInTimeRecovery: true
      }
    },
    kinesis: {
      shardCount: 2, // Auto-scale based on throughput
      retentionHours: 24
    }
  }
};
```

### Cost Monitoring

```typescript
class CostMonitor {
  async calculateCostPerOrder(): Promise<CostBreakdown> {
    const period = '24h';
    
    const lambdaInvocations = await this.cloudWatch.getMetric(
      'AWS/Lambda',
      'Invocations',
      period
    );
    
    const dynamodbWrites = await this.cloudWatch.getMetric(
      'AWS/DynamoDB',
      'ConsumedWriteCapacityUnits',
      period
    );
    
    const kinesisRecords = await this.cloudWatch.getMetric(
      'AWS/Kinesis',
      'IncomingRecords',
      period
    );
    
    const ordersProcessed = await this.getOrderCount(period);
    
    return {
      lambdaCost: (lambdaInvocations * 0.0000002) / ordersProcessed,
      dynamodbCost: (dynamodbWrites * 0.00000125) / ordersProcessed,
      kinesisCost: (kinesisRecords * 0.000001) / ordersProcessed,
      totalCostPerOrder: this.calculateTotal()
    };
  }
}
```

## Disaster Recovery

### Event Store Backup

```typescript
class EventStoreBackup {
  async createBackup(): Promise<BackupResult> {
    // Export events to S3
    const events = await this.eventStore.getAllEvents();
    const backup = {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
      events: events
    };
    
    await this.s3.putObject({
      Bucket: 'online-boutique-backups',
      Key: `events-${backup.timestamp}.json.gz`,
      Body: gzip(JSON.stringify(backup))
    });
    
    return {
      backupId: backup.timestamp,
      eventCount: events.length,
      size: this.calculateSize(backup)
    };
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    // Download backup
    const backup = await this.s3.getObject({
      Bucket: 'online-boutique-backups',
      Key: `events-${backupId}.json.gz`
    });
    
    const events = JSON.parse(gunzip(backup.Body));
    
    // Replay events to rebuild projections
    for (const event of events.events) {
      await this.eventBus.publish(event);
    }
  }
}
```

## Conclusion

This design provides a comprehensive blueprint for integrating Online Boutique with Nexus Blueprint 3.0, demonstrating:

- **Incremental Migration**: Preserve existing services while introducing event sourcing
- **Multi-Cloud Portability**: Deploy on AWS, GCP, or open-source with configuration changes only
- **Production Readiness**: Include observability, security, disaster recovery, and cost optimization
- **Reference Implementation**: Serve as a template for enterprise event sourcing adoption

The hybrid architecture enables gradual transformation while maintaining system availability and providing immediate value through analytics and audit capabilities.
