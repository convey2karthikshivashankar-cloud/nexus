import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DomainEvent, StoredEvent, SchemaRegistry } from '@nexus/shared';

export interface EventStoreConfig {
  tableName: string;
  region: string;
  schemaRegistry?: SchemaRegistry;
}

export class EventStore {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly schemaRegistry?: SchemaRegistry;
  private readonly rateLimiter: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT = 10; // requests per minute per client
  private readonly RATE_WINDOW = 60000; // 1 minute in ms

  constructor(config: EventStoreConfig) {
    const dynamoClient = new DynamoDBClient({ region: config.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.tableName;
    this.schemaRegistry = config.schemaRegistry;
  }

  async append(events: DomainEvent[]): Promise<void> {
    // Validate events against schema registry if configured
    if (this.schemaRegistry) {
      for (const event of events) {
        const validation = await this.schemaRegistry.validate(event);
        if (!validation.valid) {
          throw new Error(
            `Event validation failed for ${event.eventType}: ${validation.errors?.join(', ')}`
          );
        }
      }
    }
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const items = events.map((event, index) => ({
          PutRequest: {
            Item: {
              aggregateId: event.aggregateId,
              version: event.aggregateVersion,
              eventId: event.eventId,
              eventType: event.eventType,
              timestamp: event.timestamp,
              payload: event.payload,
              metadata: event.metadata,
            },
          },
        }));

        await this.client.send(
          new BatchWriteCommand({
            RequestItems: {
              [this.tableName]: items,
            },
          })
        );
        return;
      } catch (error: any) {
        if (error.name === 'ProvisionedThroughputExceededException') {
          attempt++;
          if (attempt >= maxAttempts) throw error;
          await this.sleep(Math.pow(2, attempt) * 1000);
        } else {
          throw error;
        }
      }
    }
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]> {
    const params: any = {
      TableName: this.tableName,
      KeyConditionExpression: 'aggregateId = :aggregateId',
      ExpressionAttributeValues: {
        ':aggregateId': aggregateId,
      },
    };

    if (fromVersion !== undefined) {
      params.KeyConditionExpression += ' AND version >= :fromVersion';
      params.ExpressionAttributeValues[':fromVersion'] = fromVersion;
    }

    if (toVersion !== undefined) {
      params.KeyConditionExpression += ' AND version <= :toVersion';
      params.ExpressionAttributeValues[':toVersion'] = toVersion;
    }

    const result = await this.client.send(new QueryCommand(params));
    return (result.Items || []) as DomainEvent[];
  }

  async getEventsByTimeRange(
    eventType: string,
    startTime: string,
    endTime: string,
    limit: number,
    clientId: string
  ): Promise<DomainEvent[]> {
    // Rate limiting check
    if (!this.checkRateLimit(clientId)) {
      throw new Error('Rate limit exceeded: 10 requests per minute per client');
    }

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'TimestampIndex',
        KeyConditionExpression: 'eventType = :eventType AND #ts BETWEEN :startTime AND :endTime',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':eventType': eventType,
          ':startTime': startTime,
          ':endTime': endTime,
        },
        Limit: limit,
      })
    );

    return (result.Items || []) as DomainEvent[];
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(clientId) || [];
    
    // Remove requests outside the time window
    const validRequests = requests.filter(time => now - time < this.RATE_WINDOW);
    
    if (validRequests.length >= this.RATE_LIMIT) {
      return false;
    }
    
    validRequests.push(now);
    this.rateLimiter.set(clientId, validRequests);
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
