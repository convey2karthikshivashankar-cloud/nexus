export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateVersion: number;
  timestamp: string; // ISO 8601 UTC
  payload: Record<string, unknown>;
  metadata: EventMetadata;
}

export interface EventMetadata {
  correlationId: string;
  causationId: string;
  userId: string;
  schemaVersion: string;
}

export interface StoredEvent extends DomainEvent {
  // DynamoDB storage representation
  version: number; // Sort key
}
