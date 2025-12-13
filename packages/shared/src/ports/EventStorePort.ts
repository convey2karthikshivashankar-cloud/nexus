import { DomainEvent } from '../types';

/**
 * Vendor-neutral Event Store interface
 * Implementations: DynamoDB (AWS), Firestore (GCP), EventStoreDB (Open Source)
 */
export interface EventStorePort {
  /**
   * Append events atomically to the event store
   */
  append(events: DomainEvent[]): Promise<void>;

  /**
   * Get events for a specific aggregate
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * Get events by time range (for temporal queries)
   * Must enforce rate limiting
   */
  getEventsByTimeRange(
    eventType: string,
    startTime: string,
    endTime: string,
    limit: number,
    clientId: string
  ): Promise<DomainEvent[]>;

  /**
   * Subscribe to event stream changes (CDC)
   */
  subscribeToStream?(
    handler: (event: DomainEvent) => Promise<void>
  ): void;
}

// SnapshotStorePort moved to SnapshotStorePort.ts to avoid duplication
// Import Snapshot from types/Snapshot.ts for single source of truth
