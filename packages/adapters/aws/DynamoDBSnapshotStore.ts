import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SnapshotStorePort, Snapshot } from '@nexus/shared';

export interface DynamoDBSnapshotStoreConfig {
  tableName: string;
  region: string;
  /** TTL for snapshots in days. Default: 90 days. Set to 0 to disable TTL. */
  ttlDays?: number;
}

/**
 * AWS DynamoDB implementation of SnapshotStorePort
 * 
 * @example
 * ```typescript
 * const snapshotStore = new DynamoDBSnapshotStore({
 *   tableName: 'Snapshots',
 *   region: 'us-east-1',
 *   ttlDays: 90,
 * });
 * ```
 */
export class DynamoDBSnapshotStore implements SnapshotStorePort {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly ttlDays: number;

  constructor(config: DynamoDBSnapshotStoreConfig) {
    // Input validation
    if (!config.tableName || config.tableName.trim() === '') {
      throw new Error('DynamoDBSnapshotStore: tableName is required');
    }
    if (!config.region || config.region.trim() === '') {
      throw new Error('DynamoDBSnapshotStore: region is required');
    }

    const dynamoClient = new DynamoDBClient({ region: config.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.tableName;
    this.ttlDays = config.ttlDays ?? 90;
  }

  async getLatest(aggregateId: string): Promise<Snapshot | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'aggregateId = :aggregateId',
        ExpressionAttributeValues: {
          ':aggregateId': aggregateId,
        },
        ScanIndexForward: false,
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return result.Items[0] as Snapshot;
  }

  async save(snapshot: Snapshot): Promise<void> {
    // Input validation
    if (!snapshot.aggregateId || snapshot.aggregateId.trim() === '') {
      throw new Error('DynamoDBSnapshotStore.save: aggregateId is required');
    }
    if (typeof snapshot.version !== 'number' || snapshot.version < 0) {
      throw new Error('DynamoDBSnapshotStore.save: version must be a non-negative number');
    }

    const item: Record<string, unknown> = {
      aggregateId: snapshot.aggregateId,
      version: snapshot.version,
      timestamp: snapshot.timestamp,
      state: snapshot.state,
      schemaVersion: snapshot.schemaVersion,
      metadata: snapshot.metadata,
    };

    // Add TTL if enabled
    if (this.ttlDays > 0) {
      item.ttl = Math.floor(Date.now() / 1000) + (this.ttlDays * 24 * 60 * 60);
    }

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
  }

  async getByVersion(aggregateId: string, version: number): Promise<Snapshot | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'aggregateId = :aggregateId AND version = :version',
        ExpressionAttributeValues: {
          ':aggregateId': aggregateId,
          ':version': version,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return result.Items[0] as Snapshot;
  }
}
