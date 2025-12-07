/**
 * Ticketing Query Handler - SKELETON CREW DEMO
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { DomainEvent } from '@nexus/shared';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const EVENT_STORE_TABLE = process.env.EVENT_STORE_TABLE!;
const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE!;

export const handler = async (event: any): Promise<any> => {
  console.log('Ticketing Query Handler - Using @nexus/shared types');
  
  try {
    const path = event.path || event.rawPath || '';
    const queryParams = event.queryStringParameters || {};

    if (path.includes('/events')) {
      const ticketId = queryParams.ticketId;
      if (ticketId) {
        const result = await dynamodb.send(new QueryCommand({
          TableName: EVENT_STORE_TABLE,
          KeyConditionExpression: 'aggregateId = :id',
          ExpressionAttributeValues: { ':id': ticketId },
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
      const result = await dynamodb.send(new ScanCommand({
        TableName: EVENT_STORE_TABLE,
        Limit: 50,
      }));
      return response(200, { events: result.Items || [], count: result.Items?.length || 0 });
    }

    const result = await dynamodb.send(new ScanCommand({
      TableName: READ_MODEL_TABLE,
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: { ':prefix': 'TICKET#' },
      Limit: 100,
    }));
    const tickets = (result.Items || []).map(item => ({
      ticketId: item.pk.replace('TICKET#', ''),
      ...item,
    }));
    return response(200, { tickets, count: tickets.length });
  } catch (error: any) {
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
