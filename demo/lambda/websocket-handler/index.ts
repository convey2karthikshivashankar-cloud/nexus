import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId!;

  console.log(`WebSocket ${routeKey} for connection ${connectionId}`);

  try {
    switch (routeKey) {
      case '$connect':
        await docClient.send(
          new PutCommand({
            TableName: CONNECTIONS_TABLE,
            Item: {
              connectionId,
              connectedAt: new Date().toISOString(),
            },
          })
        );
        return { statusCode: 200, body: 'Connected' };

      case '$disconnect':
        await docClient.send(
          new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId },
          })
        );
        return { statusCode: 200, body: 'Disconnected' };

      default:
        return { statusCode: 200, body: 'OK' };
    }
  } catch (error: any) {
    console.error('WebSocket error:', error);
    return { statusCode: 500, body: 'Error: ' + error.message };
  }
};
