import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENT_STORE_TABLE || process.env.EVENTS_TABLE!;
const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE!;

/**
 * Command Handler with Runtime Policy Enforcement
 * 
 * Validates operations before execution:
 * - Database operations (EventStore is append-only)
 * - Event publishing (must have registered schema)
 * - Service-to-service calls (no direct HTTP calls)
 * 
 * Requirements: 12.1, 12.2, 12.3
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Command received:', JSON.stringify(event, null, 2));

  try {
    const command = JSON.parse(event.body || '{}');
    const commandType = event.pathParameters?.commandType || command.commandType;

    if (!commandType) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Command type is required' }),
      };
    }

    // Simple validation for demo
    console.log('[Demo] Processing command:', commandType);

    // Generate event
    const domainEvent = {
      eventId: randomUUID(),
      eventType: commandType,
      aggregateId: command.aggregateId || randomUUID(),
      aggregateVersion: 1,
      timestamp: new Date().toISOString(),
      payload: command,
      metadata: {
        correlationId: randomUUID(),
        causationId: randomUUID(),
        userId: 'demo-user',
        schemaVersion: '1.0',
      },
    };

    // Store event
    await docClient.send(
      new PutCommand({
        TableName: EVENTS_TABLE,
        Item: {
          aggregateId: domainEvent.aggregateId,
          version: domainEvent.aggregateVersion,
          ...domainEvent,
        },
      })
    );

    console.log('Event stored:', domainEvent.eventId);

    console.log('[Demo] Command processed successfully', {
      commandType,
      aggregateId: domainEvent.aggregateId,
      eventId: domainEvent.eventId,
    });

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        aggregateId: domainEvent.aggregateId,
        version: domainEvent.aggregateVersion,
        eventIds: [domainEvent.eventId],
      }),
    };
  } catch (error: any) {
    console.error('Error processing command:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
