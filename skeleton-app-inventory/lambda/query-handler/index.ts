/**
 * Inventory Query Handler
 * 
 * SKELETON CREW DEMO: Imports DomainEvent from @nexus/shared
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// IMPORTING FROM @nexus/shared SKELETON
import type { DomainEvent } from '@nexus/shared';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const EVENT_STORE_TABLE = process.env.EVENT_STORE_TABLE!;
const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE!;

export const handler = async (event: any): Promise<any> => {
  console.log('Inventory Query Handler - Using @nexus/shared types');
  
  try {
    const path = event.path || event.rawPath || '';
    const queryParams = event.queryStringParameters || {};

    if (path.includes('/events')) {
      // Get events from event store
      const productId = queryParams.productId;
      
      if (productId) {
        const result = await dynamodb.send(new QueryCommand({
          TableName: EVENT_STORE_TABLE,
          KeyConditionExpression: 'aggregateId = :id',
          ExpressionAttributeValues: { ':id': productId },
        }));
        
        const events: DomainEvent[] = (result.Items || []).map(item => ({
          eventId: item.eventId,
          eventType: item.eventType,
          aggregateId: item.aggregateId,
          aggregateVersion: item.version,
          timestamp: item.timestamp,
          payload: item.payload,
          metadata: item.metadata,
        }));

        return response(200, { events, count: events.length });
      }

      // Scan recent events
      const result = await dynamodb.send(new ScanCommand({
        TableName: EVENT_STORE_TABLE,
        Limit: 50,
      }));

      return response(200, { 
        events: result.Items || [],
        count: result.Items?.length || 0,
      });
    }

    // Query read model for products
    const result = await dynamodb.send(new ScanCommand({
      TableName: READ_MODEL_TABLE,
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: { ':prefix': 'PRODUCT#' },
      Limit: 100,
    }));

    const products = (result.Items || []).map(item => ({
      productId: item.pk.replace('PRODUCT#', ''),
      ...item,
    }));

    return response(200, { products, count: products.length });
  } catch (error: any) {
    console.error('Query failed:', error);
    return response(500, { error: error.message });
  }
};

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
