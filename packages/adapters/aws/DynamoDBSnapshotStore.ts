import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SnapshotStorePort, Snapshot } from '@nexus/shared';

export interface DynamoDBSnapshotStoreConfig {
  tableName: string;
  region: string;
}

/**
 * AWS DynamoDB implementation of SnapshotStorePort
 */
export class DynamoDBSnapshotStore implements SnapshotStorePort {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(config: DynamoDBSnapshotStoreConfig) {
    const dynamoClient = new DynamoDBClient({ region: config.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.tableName;
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
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          aggregateId: snapshot.aggregateId,
          version: snapshot.version,
          timestamp: snapshot.timestamp,
          state: snapshot.state,
          schemaVersion: snapshot.schemaVersion,
          metadata: snapshot.metadata,
          ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
        },
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
