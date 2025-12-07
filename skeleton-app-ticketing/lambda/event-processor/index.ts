/**
 * Ticketing Event Processor - SKELETON CREW DEMO
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { DomainEvent } from '@nexus/shared';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE!;

export const handler = async (event: any): Promise<void> => {
  console.log('Ticketing Event Processor - Using @nexus/shared types');
  
  for (const record of event.Records || []) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const newImage = record.dynamodb?.NewImage;
      if (!newImage) continue;

      const domainEvent: DomainEvent = {
        eventId: newImage.eventId?.S || '',
        eventType: newImage.eventType?.S || '',
        aggregateId: newImage.aggregateId?.S || '',
        aggregateVersion: parseInt(newImage.version?.N || '0'),
        timestamp: newImage.timestamp?.S || '',
        payload: JSON.parse(newImage.payload?.S || newImage.payload?.M ? JSON.stringify(unmarshallMap(newImage.payload.M)) : '{}'),
        metadata: {
          correlationId: newImage.metadata?.M?.correlationId?.S || '',
          causationId: newImage.metadata?.M?.causationId?.S || '',
          userId: newImage.metadata?.M?.userId?.S || '',
          schemaVersion: newImage.metadata?.M?.schemaVersion?.S || '1.0.0',
        },
      };
      await updateProjection(domainEvent);
    }
  }
};

async function updateProjection(event: DomainEvent): Promise<void> {
  const ticketId = event.aggregateId;
  
  switch (event.eventType) {
    case 'TicketCreated':
      await dynamodb.send(new PutCommand({
        TableName: READ_MODEL_TABLE,
        Item: {
          pk: `TICKET#${ticketId}`,
          sk: 'DETAILS',
          ticketId,
          title: event.payload.title || 'Untitled',
          description: event.payload.description || '',
          priority: event.payload.priority || 'medium',
          status: 'open',
          createdBy: event.metadata.userId,
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
          version: event.aggregateVersion,
        },
      }));
      break;

    case 'TicketAssigned':
      await dynamodb.send(new UpdateCommand({
        TableName: READ_MODEL_TABLE,
        Key: { pk: `TICKET#${ticketId}`, sk: 'DETAILS' },
        UpdateExpression: 'SET assignee = :a, #status = :s, updatedAt = :ts',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':a': event.payload.assignee,
          ':s': 'assigned',
          ':ts': event.timestamp,
        },
      }));
      break;

    case 'TicketResolved':
      await dynamodb.send(new UpdateCommand({
        TableName: READ_MODEL_TABLE,
        Key: { pk: `TICKET#${ticketId}`, sk: 'DETAILS' },
        UpdateExpression: 'SET #status = :s, resolution = :r, updatedAt = :ts',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':s': 'resolved',
          ':r': event.payload.resolution || '',
          ':ts': event.timestamp,
        },
      }));
      break;

    case 'TicketClosed':
      await dynamodb.send(new UpdateCommand({
        TableName: READ_MODEL_TABLE,
        Key: { pk: `TICKET#${ticketId}`, sk: 'DETAILS' },
        UpdateExpression: 'SET #status = :s, closedAt = :ts, updatedAt = :ts',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':s': 'closed', ':ts': event.timestamp },
      }));
      break;
  }
}

function unmarshallMap(m: any): any {
  const result: any = {};
  for (const key of Object.keys(m || {})) {
    const val = m[key];
    if (val.S) result[key] = val.S;
    else if (val.N) result[key] = parseFloat(val.N);
    else if (val.BOOL !== undefined) result[key] = val.BOOL;
    else if (val.M) result[key] = unmarshallMap(val.M);
  }
  return result;
}
