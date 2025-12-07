/**
 * Inventory Event Processor (Projections)
 * 
 * SKELETON CREW DEMO: Uses DomainEvent from @nexus/shared for projections
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// IMPORTING FROM @nexus/shared SKELETON
import type { DomainEvent } from '@nexus/shared';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE!;

export const handler = async (event: any): Promise<void> => {
  console.log('Inventory Event Processor - Using @nexus/shared types');
  
  for (const record of event.Records || []) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const newImage = record.dynamodb?.NewImage;
      if (!newImage) continue;

      // Parse DynamoDB stream record into DomainEvent
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
  const productId = event.aggregateId;
  
  switch (event.eventType) {
    case 'ProductAdded':
      await dynamodb.send(new PutCommand({
        TableName: READ_MODEL_TABLE,
        Item: {
          pk: `PRODUCT#${productId}`,
          sk: 'DETAILS',
          productId,
          name: event.payload.name || 'Unknown Product',
          sku: event.payload.sku || '',
          quantity: event.payload.quantity || 0,
          price: event.payload.price || 0,
          status: 'active',
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
          version: event.aggregateVersion,
        },
      }));
      break;

    case 'StockUpdated':
      await dynamodb.send(new UpdateCommand({
        TableName: READ_MODEL_TABLE,
        Key: { pk: `PRODUCT#${productId}`, sk: 'DETAILS' },
        UpdateExpression: 'SET quantity = :qty, updatedAt = :ts, version = :v',
        ExpressionAttributeValues: {
          ':qty': event.payload.quantity || 0,
          ':ts': event.timestamp,
          ':v': event.aggregateVersion,
        },
      }));
      break;

    case 'ProductRemoved':
      await dynamodb.send(new UpdateCommand({
        TableName: READ_MODEL_TABLE,
        Key: { pk: `PRODUCT#${productId}`, sk: 'DETAILS' },
        UpdateExpression: 'SET #status = :s, updatedAt = :ts',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':s': 'removed', ':ts': event.timestamp },
      }));
      break;

    case 'StockReserved':
      await dynamodb.send(new UpdateCommand({
        TableName: READ_MODEL_TABLE,
        Key: { pk: `PRODUCT#${productId}`, sk: 'DETAILS' },
        UpdateExpression: 'SET reservedQty = if_not_exists(reservedQty, :zero) + :qty, updatedAt = :ts',
        ExpressionAttributeValues: {
          ':qty': event.payload.quantity || 0,
          ':zero': 0,
          ':ts': event.timestamp,
        },
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
