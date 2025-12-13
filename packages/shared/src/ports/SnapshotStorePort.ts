import { Snapshot } from '../types';

/**
 * Vendor-neutral interface for Snapshot Store
 * Implementations: DynamoDB (AWS), Firestore (GCP), PostgreSQL (Open Source)
 * 
 * @example
 * ```typescript
 * const store: SnapshotStorePort = new DynamoDBSnapshotStore(config);
 * const snapshot = await store.getLatest('order-123');
 * ```
 */
export interface SnapshotStorePort {
  /**
   * Get the latest snapshot for an aggregate
   * @param aggregateId - The unique identifier of the aggregate
   * @returns The latest snapshot or null if none exists
   */
  getLatest(aggregateId: string): Promise<Snapshot | null>;

  /**
   * Save a new snapshot
   * @param snapshot - The snapshot to persist
   * @throws Error if save fails
   */
  save(snapshot: Snapshot): Promise<void>;

  /**
   * Get snapshot by specific version
   * @param aggregateId - The unique identifier of the aggregate
   * @param version - The specific version to retrieve
   * @returns The snapshot at that version or null if not found
   */
  getByVersion(aggregateId: string, version: number): Promise<Snapshot | null>;
}

/**
 * Configuration options for SnapshotStore implementations
 */
export interface SnapshotStoreConfig {
  /** AWS region or GCP region */
  region?: string;
  
  /** AWS DynamoDB table name */
  tableName?: string;
  
  /** GCP project ID */
  projectId?: string;
  
  /** GCP Firestore collection name */
  collectionName?: string;
  
  /** PostgreSQL connection string */
  connectionString?: string;
  
  /** PostgreSQL schema name */
  schemaName?: string;
  
  /** TTL for snapshots in seconds (default: 90 days) */
  ttlSeconds?: number;
}
