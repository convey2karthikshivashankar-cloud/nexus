const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ORDERS_TABLE = process.env.READ_MODEL_TABLE;

exports.handler = async (event) => {
  console.log('Processing stream events:', event.Records.length);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      try {
        const newImage = record.dynamodb?.NewImage;
        if (!newImage) continue;

        const eventType = newImage.eventType?.S;
        const payload = newImage.payload?.S ? JSON.parse(newImage.payload.S) : {};
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
