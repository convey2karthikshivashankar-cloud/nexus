/**
 * Represents a domain event in the event-sourced system.
 * Domain events are immutable facts that have occurred in the system.
 * 
 * @example
 * ```typescript
 * const event: DomainEvent = {
 *   eventId: 'evt-123',
 *   eventType: 'OrderPlaced',
 *   aggregateId: 'order-456',
 *   aggregateVersion: 1,
 *   timestamp: '2025-01-01T00:00:00.000Z',
 *   payload: { orderId: 'order-456', amount: 99.99 },
 *   metadata: {
 *     correlationId: 'corr-789',
 *     causationId: 'cmd-012',
 *     userId: 'user-345',
 *     schemaVersion: '1.0.0',
 *   },
 * };
 * ```
 */
export interface DomainEvent {
  /** Unique identifier for this event (UUID recommended) */
  eventId: string;
  
  /** Type of the event (e.g., 'OrderPlaced', 'PaymentReceived') */
  eventType: string;
  
  /** ID of the aggregate this event belongs to */
  aggregateId: string;
  
  /** Version of the aggregate after this event is applied */
  aggregateVersion: number;
  
  /** ISO 8601 UTC timestamp when the event occurred */
  timestamp: string;
  
  /** Event-specific data payload */
  payload: Record<string, unknown>;
  
  /** Metadata for tracing and governance */
  metadata: EventMetadata;
}

/**
 * Metadata attached to every domain event for tracing and governance.
 */
export interface EventMetadata {
  /** ID to correlate related events across services */
  correlationId: string;
  
  /** ID of the command or event that caused this event */
  causationId: string;
  
  /** ID of the user who initiated the action */
  userId: string;
  
  /** Version of the schema this event conforms to */
  schemaVersion: string;
}

/**
 * Represents a domain event as stored in DynamoDB.
 * Extends DomainEvent with storage-specific fields.
 */
export interface StoredEvent extends DomainEvent {
  /** DynamoDB sort key (same as aggregateVersion) */
  version: number;
}
