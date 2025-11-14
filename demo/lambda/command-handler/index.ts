import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

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

    // Generate event
    const domainEvent = {
      eventId: uuidv4(),
      eventType: commandType,
      aggregateId: command.aggregateId || uuidv4(),
      aggregateVersion: 1,
      timestamp: new Date().toISOString(),
      payload: command,
      metadata: {
        correlationId: uuidv4(),
        causationId: uuidv4(),
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
