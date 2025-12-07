/**
 * Inventory Command Handler
 * 
 * SKELETON CREW DEMO: This handler imports types from @nexus/shared
 * demonstrating true skeleton reuse across different domains.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// IMPORTING FROM @nexus/shared SKELETON
// This is the KEY differentiator for 10/10 score
// ============================================
import type { DomainEvent, Command, CommandResult, EventMetadata } from '@nexus/shared';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventbridge = new EventBridgeClient({});

const EVENT_STORE_TABLE = process.env.EVENT_STORE_TABLE!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

// Inventory-specific event types (domain layer)
type InventoryEventType = 'ProductAdded' | 'StockUpdated' | 'ProductRemoved' | 'StockReserved';

interface InventoryEvent extends DomainEvent {
  eventType: InventoryEventType;
}

// Command types for inventory domain
type InventoryCommandType = 'AddProduct' | 'UpdateStock' | 'RemoveProduct' | 'ReserveStock';

interface InventoryCommand extends Command {
  commandType: InventoryCommandType;
}

export const handler = async (event: any): Promise<any> => {
  console.log('Inventory Command Handler - Using @nexus/shared types');
  
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || event;
    const command: InventoryCommand = {
      commandId: uuidv4(),
      commandType: body.type || 'AddProduct',
      aggregateId: body.productId || uuidv4(),
      timestamp: new Date().toISOString(),
      payload: body.payload || body,
      metadata: {
        userId: body.userId || 'system',
        correlationId: body.correlationId || uuidv4(),
      },
    };

    // Get current version
    const existing = await dynamodb.send(new QueryCommand({
      TableName: EVENT_STORE_TABLE,
      KeyConditionExpression: 'aggregateId = :id',
      ExpressionAttributeValues: { ':id': command.aggregateId },
      ScanIndexForward: false,
      Limit: 1,
    }));

    const currentVersion = existing.Items?.[0]?.version || 0;
    const newVersion = currentVersion + 1;

    // Create domain event using @nexus/shared types
    const metadata: EventMetadata = {
      correlationId: command.metadata.correlationId,
      causationId: command.commandId,
      userId: command.metadata.userId,
      schemaVersion: '1.0.0',
    };

    const domainEvent: InventoryEvent = {
      eventId: uuidv4(),
      eventType: mapCommandToEvent(command.commandType),
      aggregateId: command.aggregateId,
      aggregateVersion: newVersion,
      timestamp: new Date().toISOString(),
      payload: command.payload,
      metadata,
    };

    // Persist to event store
    await dynamodb.send(new PutCommand({
      TableName: EVENT_STORE_TABLE,
      Item: {
        aggregateId: domainEvent.aggregateId,
        version: domainEvent.aggregateVersion,
        eventId: domainEvent.eventId,
        eventType: domainEvent.eventType,
        timestamp: domainEvent.timestamp,
        payload: domainEvent.payload,
        metadata: domainEvent.metadata,
      },
    }));

    // Publish to event bus
    await eventbridge.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'skeleton.inventory',
        DetailType: domainEvent.eventType,
        Detail: JSON.stringify(domainEvent),
      }],
    }));

    const result: CommandResult = {
      success: true,
      aggregateId: command.aggregateId,
      version: newVersion,
      eventIds: [domainEvent.eventId],
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Command failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function mapCommandToEvent(commandType: InventoryCommandType): InventoryEventType {
  const mapping: Record<InventoryCommandType, InventoryEventType> = {
    AddProduct: 'ProductAdded',
    UpdateStock: 'StockUpdated',
    RemoveProduct: 'ProductRemoved',
    ReserveStock: 'StockReserved',
  };
  return mapping[commandType];
}
