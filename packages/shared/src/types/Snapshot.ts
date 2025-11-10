export interface Snapshot {
  aggregateId: string;
  version: number;
  timestamp: number;
  state: Record<string, unknown>;
  schemaVersion: string;
  metadata: SnapshotMetadata;
}

export interface SnapshotMetadata {
  eventCount: number;
  aggregateSize: number; // bytes
}

export interface SnapshotTrigger {
  eventCountThreshold: number;
  aggregateSizeThreshold: number;
  timeElapsedThreshold: number;
}
