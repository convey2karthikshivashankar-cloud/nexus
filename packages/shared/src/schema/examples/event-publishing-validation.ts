/**
 * Example: Schema Validation in Event Publishing
 * 
 * This example demonstrates how schema validation is enforced at multiple
 * points in the event publishing pipeline to ensure governance-first architecture.
 * 
 * Requirements: 2.1, 2.4, 2.5
 */

import { DomainEvent, SchemaRegistryPort, EventStorePort } from '../../ports';

/**
 * VALIDATION POINT 1: Command Service - Before Event Persistence
 * 
 * The EventStore validates all events against registered schemas before
 * persisting them to DynamoDB. This is the primary enforcement point.
 */
export class EventStoreWithValidation implements EventStorePort {
  constructor(
    private readonly schemaRegistry: SchemaRegistryPort,
    private readonly storage: any // DynamoDB client
  ) {}

  async append(events: DomainEvent[]): Promise<void> {
    // Pre-publish schema validation
    for (const event of events) {
      const validation = await this.schemaRegistry.validate(event);
      
      if (!validation.valid) {
        // Reject events with unregistered or invalid schemas
        const errorMessage = `Schema validation failed for ${event.eventType}: ${
          validation.errors?.join(', ') || 'Unknown error'
        }`;
        
        // Log schema validation failures
        console.error('[EventStore] Schema validation failed', {
          eventType: event.eventType,
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        });
        
        // Return detailed error messages
        throw new SchemaValidationError(errorMessage, {
          eventType: event.eventType,
          eventId: event.eventId,
          errors: validation.errors || [],
        });
      }
    }

    // Only persist if all events pass validation
    await this.storage.batchWrite(events);
    
    console.log('[EventStore] Events validated and persisted', {
      count: events.length,
      eventTypes: events.map(e => e.eventType),
    });
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    // Implementation...
    return [];
  }
}

/**
 * VALIDATION POINT 2: Event Router - Before Propagation
 * 
 * The Event Router validates events again before routing to Kinesis/SNS.
 * This provides defense-in-depth and catches any events that might have
 * bypassed the EventStore validation.
 */
export class EventRouterWithValidation {
  constructor(
    private readonly schemaRegistry: SchemaRegistryPort,
    private readonly kinesisPublisher: any,
    private readonly snsPublisher: any
  ) {}

  async route(event: DomainEvent): Promise<void> {
    // GOVERNANCE: Validate against schema registry before routing
    const validation = await this.schemaRegistry.validate(event);
    
    if (!validation.valid) {
      // Log schema validation failures
      console.error('[EventRouter] Schema validation failed', {
        eventType: event.eventType,
        eventId: event.eventId,
        errors: validation.errors,
        timestamp: new Date().toISOString(),
      });
      
      // Skip invalid events - do not propagate
      return;
    }

    // Route validated events based on criticality
    if (this.isCoreEvent(event.eventType)) {
      await this.kinesisPublisher.publish(event);
    } else {
      await this.snsPublisher.publish(event);
    }
    
    console.log('[EventRouter] Event validated and routed', {
      eventType: event.eventType,
      eventId: event.eventId,
      path: this.isCoreEvent(event.eventType) ? 'kinesis' : 'sns',
    });
  }

  private isCoreEvent(eventType: string): boolean {
    return ['OrderPlaced', 'OrderCancelled', 'PaymentProcessed'].includes(eventType);
  }
}

/**
 * VALIDATION POINT 3: Command Handler - Integration
 * 
 * The Command Handler relies on EventStore validation but adds
 * business-level validation before event generation.
 */
export class OrderCommandHandler {
  constructor(
    private readonly eventStore: EventStorePort,
    private readonly schemaRegistry: SchemaRegistryPort
  ) {}

  async placeOrder(command: any): Promise<void> {
    // Business validation
    this.validateOrderCommand(command);

    // Generate domain events
    const events: DomainEvent[] = [
      {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: command.orderId,
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          customerId: command.customerId,
          items: command.items,
          totalAmount: command.totalAmount,
        },
        metadata: {
          correlationId: command.correlationId,
          causationId: command.commandId,
          userId: command.userId,
          schemaVersion: '1.0',
        },
      },
    ];

    // Schema validation happens automatically in EventStore.append()
    // Invalid events will throw SchemaValidationError
    try {
      await this.eventStore.append(events);
      console.log('[CommandHandler] Order placed successfully', {
        orderId: command.orderId,
        eventCount: events.length,
      });
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        console.error('[CommandHandler] Schema validation failed', {
          orderId: command.orderId,
          error: error.message,
          details: error.details,
        });
        throw error;
      }
      throw error;
    }
  }

  private validateOrderCommand(command: any): void {
    if (!command.customerId) {
      throw new Error('Customer ID is required');
    }
    if (!command.items || command.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
  }
}

/**
 * Custom Error Class for Schema Validation Failures
 */
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly details: {
      eventType: string;
      eventId: string;
      errors: string[];
    }
  ) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Example Usage: Complete Flow
 */
export async function demonstrateSchemaValidation() {
  // Setup (in real implementation, these come from AdapterFactory)
  const schemaRegistry: SchemaRegistryPort = {} as any; // AWS Glue or Confluent
  const eventStore = new EventStoreWithValidation(schemaRegistry, {} as any);
  const commandHandler = new OrderCommandHandler(eventStore, schemaRegistry);

  // Scenario 1: Valid Event
  try {
    await commandHandler.placeOrder({
      orderId: 'order-123',
      customerId: 'cust-456',
      items: [{ productId: 'prod-789', quantity: 2 }],
      totalAmount: 99.99,
      correlationId: 'corr-123',
      commandId: 'cmd-123',
      userId: 'user-123',
    });
    console.log('✓ Valid event published successfully');
  } catch (error) {
    console.error('✗ Failed to publish valid event:', error);
  }

  // Scenario 2: Invalid Event (Missing Required Field)
  try {
    const invalidEvent: DomainEvent = {
      eventId: 'evt-456',
      eventType: 'OrderPlaced',
      aggregateId: 'order-456',
      aggregateVersion: 1,
      timestamp: new Date().toISOString(),
      payload: {
        // Missing required 'customerId' field
        items: [],
        totalAmount: 0,
      },
      metadata: {
        correlationId: 'corr-456',
        causationId: 'cmd-456',
        userId: 'user-456',
        schemaVersion: '1.0',
      },
    };

    await eventStore.append([invalidEvent]);
    console.error('✗ Invalid event should have been rejected');
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      console.log('✓ Invalid event correctly rejected:', error.message);
      console.log('  Details:', error.details);
    }
  }

  // Scenario 3: Unregistered Schema
  try {
    const unregisteredEvent: DomainEvent = {
      eventId: 'evt-789',
      eventType: 'UnknownEventType', // Not registered in schema registry
      aggregateId: 'agg-789',
      aggregateVersion: 1,
      timestamp: new Date().toISOString(),
      payload: {},
      metadata: {
        correlationId: 'corr-789',
        causationId: 'cmd-789',
        userId: 'user-789',
        schemaVersion: '1.0',
      },
    };

    await eventStore.append([unregisteredEvent]);
    console.error('✗ Unregistered event should have been rejected');
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      console.log('✓ Unregistered event correctly rejected:', error.message);
    }
  }
}

/**
 * Logging Best Practices
 * 
 * All schema validation failures are logged with:
 * - Event type and ID for traceability
 * - Specific validation errors for debugging
 * - Timestamp for audit trail
 * - Correlation ID for request tracking
 * 
 * Logs are structured for easy parsing and alerting:
 * - CloudWatch Logs for centralized logging
 * - CloudWatch Metrics for validation failure rates
 * - CloudWatch Alarms for threshold breaches
 */

/**
 * Error Message Format
 * 
 * Detailed error messages include:
 * - What failed: "Schema validation failed for OrderPlaced"
 * - Why it failed: "Missing required field 'customerId'"
 * - How to fix: "Ensure all required fields are present"
 * - Context: Event ID, aggregate ID, schema version
 */
