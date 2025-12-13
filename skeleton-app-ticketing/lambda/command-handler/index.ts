/**
 * Ticketing Command Handler - SKELETON CREW DEMO
 * Imports types from @nexus/shared - different domain, same skeleton!
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';

// IMPORTING FROM @nexus/shared SKELETON
import type { DomainEvent, Command, CommandResult, EventMetadata } from '@nexus/shared';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventbridge = new EventBridgeClient({});
const EVENT_STORE_TABLE = process.env.EVENT_STORE_TABLE!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

// Ticketing-specific event types
type TicketEventType = 'TicketCreated' | 'TicketAssigned' | 'TicketResolved' | 'TicketClosed' | 'CommentAdded';

interface TicketEvent extends DomainEvent {
  eventType: TicketEventType;
}

type TicketCommandType = 'CreateTicket' | 'AssignTicket' | 'ResolveTicket' | 'CloseTicket' | 'AddComment';

export const handler = async (event: any): Promise<any> => {
  console.log('Ticketing Command Handler - Using @nexus/shared types');
  
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || event;
    const command: Command = {
      commandId: uuidv4(),
      commandType: body.type || 'CreateTicket',
      aggregateId: body.ticketId || uuidv4(),
      timestamp: new Date().toISOString(),
      payload: body.payload || body,
      metadata: {
        userId: body.userId || 'system',
        correlationId: body.correlationId || uuidv4(),
      },
    };

    const existing = await dynamodb.send(new QueryCommand({
      TableName: EVENT_STORE_TABLE,
      KeyConditionExpression: 'aggregateId = :id',
      ExpressionAttributeValues: { ':id': command.aggregateId },
      ScanIndexForward: false,
      Limit: 1,
    }));

    const currentVersion = existing.Items?.[0]?.version || 0;
    const newVersion = currentVersion + 1;

    const metadata: EventMetadata = {
      correlationId: command.metadata.correlationId,
      causationId: command.commandId,
      userId: command.metadata.userId,
      schemaVersion: '1.0.0',
    };

    const domainEvent: TicketEvent = {
      eventId: uuidv4(),
      eventType: mapCommandToEvent(command.commandType as TicketCommandType),
      aggregateId: command.aggregateId,
      aggregateVersion: newVersion,
      timestamp: new Date().toISOString(),
      payload: command.payload,
      metadata,
    };

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

    await eventbridge.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source: 'skeleton.ticketing',
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function mapCommandToEvent(commandType: TicketCommandType): TicketEventType {
  const mapping: Record<TicketCommandType, TicketEventType> = {
    CreateTicket: 'TicketCreated',
    AssignTicket: 'TicketAssigned',
    ResolveTicket: 'TicketResolved',
    CloseTicket: 'TicketClosed',
    AddComment: 'CommentAdded',
  };
  return mapping[commandType];
}
