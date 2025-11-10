import { Snapshot } from '../types';

/**
 * Vendor-neutral interface for Snapshot Store
 * Implementations: DynamoDB (AWS), Firestore (GCP), PostgreSQL (Open Source)
 */
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

export interface SnapshotStoreConfig {
  // Common config
  region?: string;
  
  // AWS-specific
  tableName?: string;
  
  // GCP-specific
  projectId?: string;
  collectionName?: string;
  
  // PostgreSQL-specific
  connectionString?: string;
  schemaName?: string;
}
