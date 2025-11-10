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

export interface SnapshotStorePort {
  /**
   * Get the latest snapshot for an aggregate
   */
  getLatest(aggregateId: string): Promise<Snapshot | null>;

  /**
   * Save a new snapshot
   */
  save(snapshot: Snapshot): Promise<void>;

  /**
   * Get snapshot by specific version
   */
  getByVersion(aggregateId: string, version: number): Promise<Snapshot | null>;
}

export interface Snapshot {
  aggregateId: string;
  version: number;
  timestamp: number;
  state: Record<string, unknown>;
  schemaVersion: string;
  metadata: {
    eventCount: number;
    aggregateSize: number;
  };
}
