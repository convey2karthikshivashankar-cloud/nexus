import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBStreamEvent, AttributeValue } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ORDERS_TABLE = process.env.READ_MODEL_TABLE || process.env.ORDERS_TABLE!;

// Helper to extract payload from DynamoDB stream record
function extractPayload(newImage: { [key: string]: AttributeValue }): any {
  // Try string first (S type)
  if (newImage.payload?.S) {
    try {
      return JSON.parse(newImage.payload.S);
    } catch {
      return {};
    }
  }
  // Try map type (M type) - unmarshall the whole record and get payload
  if (newImage.payload?.M) {
    return unmarshall(newImage.payload.M as any);
  }
  // Fallback: unmarshall entire record and extract payload
  try {
    const unmarshalled = unmarshall(newImage as any);
    return unmarshalled.payload || {};
  } catch {
    return {};
  }
}

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing stream events:', event.Records.length);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      try {
        const newImage = record.dynamodb?.NewImage;
        if (!newImage) continue;

        const eventType = newImage.eventType?.S;
        const payload = extractPayload(newImage as any);
        const aggregateId = newImage.aggregateId?.S;

        console.log(`Processing event: ${eventType} for ${aggregateId}`);

        // Handle OrderPlaced
        if (eventType === 'OrderPlaced') {
          await docClient.send(
            new PutCommand({
              TableName: ORDERS_TABLE,
              Item: {
                orderId: aggregateId,
                customerId: payload.customerId,
                items: payload.items || [],
                totalAmount: payload.totalAmount || 0,
                status: 'PLACED',
                createdAt: newImage.timestamp?.S,
                updatedAt: newImage.timestamp?.S,
              },
            })
          );
          console.log(`Order created: ${aggregateId}`);
        }

        // Handle OrderCancelled
        if (eventType === 'OrderCancelled') {
          await docClient.send(
            new UpdateCommand({
              TableName: ORDERS_TABLE,
              Key: { orderId: aggregateId },
              UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':status': 'CANCELLED',
                ':updatedAt': newImage.timestamp?.S,
              },
            })
          );
          console.log(`Order cancelled: ${aggregateId}`);
        }
      } catch (error) {
        console.error('Error processing record:', error);
        // Continue processing other records
      }
    }
  }

  return { statusCode: 200, body: 'Processed' };
};
