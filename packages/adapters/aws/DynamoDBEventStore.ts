import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DomainEvent, EventStorePort, SchemaRegistryPort, policyEnforcer } from '@nexus/shared';

export interface DynamoDBEventStoreConfig {
  tableName: string;
  region: string;
  schemaRegistry?: SchemaRegistryPort;
  enableSchemaValidation?: boolean;
}

/**
 * AWS DynamoDB implementation of EventStorePort with schema validation
 */
export class DynamoDBEventStore implements EventStorePort {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly schemaRegistry?: SchemaRegistryPort;
  private readonly enableSchemaValidation: boolean;
  private readonly rateLimiter: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT = 10;
  private readonly RATE_WINDOW = 60000;

  constructor(config: DynamoDBEventStoreConfig) {
    const dynamoClient = new DynamoDBClient({ region: config.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.tableName;
    this.schemaRegistry = config.schemaRegistry;
    this.enableSchemaValidation = config.enableSchemaValidation ?? true;
    
    if (this.enableSchemaValidation && !this.schemaRegistry) {
      console.warn('[DynamoDBEventStore] Schema validation enabled but no schema registry provided');
    }
  }

  async append(events: DomainEvent[]): Promise<void> {
    // RUNTIME POLICY ENFORCEMENT: Validate database operation
    policyEnforcer.validateDatabaseOperation('EventStore', 'INSERT');

    // GOVERNANCE FIRST: Validate all events against schema registry before persisting
    if (this.enableSchemaValidation && this.schemaRegistry) {
      console.log(`[DynamoDBEventStore] Validating ${events.length} events against schema registry`);
      
      for (const event of events) {
        // Validate event has registered schema
        try {
          await this.schemaRegistry.getSchema(event.eventType);
          policyEnforcer.validateEventPublish(event.eventType, true);
        } catch (error) {
          policyEnforcer.validateEventPublish(event.eventType, false);
        }

        const validationResult = await this.schemaRegistry.validate(event);
        
        if (!validationResult.valid) {
          const errorMsg = `Schema validation failed for event ${event.eventType} (${event.eventId}): ${validationResult.errors?.join(', ')}`;
          console.error(`[DynamoDBEventStore] ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        console.log(`[DynamoDBEventStore] Event ${event.eventType} validated successfully`);
      }
    }

    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const items = events.map(event => ({
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
        
        console.log(`[DynamoDBEventStore] Successfully appended ${events.length} events`);
        return;
      } catch (error: any) {
        if (error.name === 'ProvisionedThroughputExceededException') {
          attempt++;
          if (attempt >= maxAttempts) {
            console.error(`[DynamoDBEventStore] Max retry attempts reached for append operation`);
            throw error;
          }
          const backoffMs = Math.pow(2, attempt) * 1000;
          console.warn(`[DynamoDBEventStore] Throttled, retrying in ${backoffMs}ms (attempt ${attempt}/${maxAttempts})`);
          await this.sleep(backoffMs);
        } else {
          console.error(`[DynamoDBEventStore] Append failed:`, error);
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
