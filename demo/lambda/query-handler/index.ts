import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ORDERS_TABLE = process.env.ORDERS_TABLE!;
const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Query received:', JSON.stringify(event, null, 2));

  try {
    const path = event.path;

    // Get all orders
    if (path === '/orders' || path.endsWith('/orders')) {
      const result = await docClient.send(
        new ScanCommand({
          TableName: ORDERS_TABLE,
        })
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          items: result.Items || [],
          total: result.Count || 0,
        }),
      };
    }

    // Get all events
    if (path === '/events' || path.endsWith('/events')) {
      const result = await docClient.send(
        new ScanCommand({
          TableName: EVENTS_TABLE,
          Limit: 100,
        })
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          items: result.Items || [],
          total: result.Count || 0,
        }),
      };
    }

    // Get single order
    const orderId = event.pathParameters?.orderId;
    if (orderId) {
      const result = await docClient.send(
        new GetCommand({
          TableName: ORDERS_TABLE,
          Key: { orderId },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Order not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result.Item),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid query' }),
    };
  } catch (error: any) {
    console.error('Error processing query:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
