"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const handler = async (event) => {
    console.log('Processing stream events:', event.Records.length);
    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            try {
                const newImage = record.dynamodb?.NewImage;
                if (!newImage)
                    continue;
                const eventType = newImage.eventType?.S;
                const payload = newImage.payload?.S ? JSON.parse(newImage.payload.S) : {};
                const aggregateId = newImage.aggregateId?.S;
                console.log(`Processing event: ${eventType} for ${aggregateId}`);
                // Handle OrderPlaced
                if (eventType === 'OrderPlaced') {
                    await docClient.send(new lib_dynamodb_1.PutCommand({
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
                    }));
                    console.log(`Order created: ${aggregateId}`);
                }
                // Handle OrderCancelled
                if (eventType === 'OrderCancelled') {
                    await docClient.send(new lib_dynamodb_1.UpdateCommand({
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
                    }));
                    console.log(`Order cancelled: ${aggregateId}`);
                }
            }
            catch (error) {
                console.error('Error processing record:', error);
                // Continue processing other records
            }
        }
    }
    return { statusCode: 200, body: 'Processed' };
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQTBGO0FBRzFGLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFNUQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFhLENBQUM7QUFFeEMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTBCLEVBQUUsRUFBRTtJQUMxRCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFL0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsSUFBSSxNQUFNLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQztnQkFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLFFBQVE7b0JBQUUsU0FBUztnQkFFeEIsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUUsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7Z0JBRTVDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLFNBQVMsUUFBUSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUVqRSxxQkFBcUI7Z0JBQ3JCLElBQUksU0FBUyxLQUFLLGFBQWEsRUFBRSxDQUFDO29CQUNoQyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ2xCLElBQUkseUJBQVUsQ0FBQzt3QkFDYixTQUFTLEVBQUUsWUFBWTt3QkFDdkIsSUFBSSxFQUFFOzRCQUNKLE9BQU8sRUFBRSxXQUFXOzRCQUNwQixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7NEJBQzlCLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUU7NEJBQzFCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUM7NEJBQ3JDLE1BQU0sRUFBRSxRQUFROzRCQUNoQixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDOzRCQUNoQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO3lCQUNqQztxQkFDRixDQUFDLENBQ0gsQ0FBQztvQkFDRixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2dCQUVELHdCQUF3QjtnQkFDeEIsSUFBSSxTQUFTLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQztvQkFDbkMsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNsQixJQUFJLDRCQUFhLENBQUM7d0JBQ2hCLFNBQVMsRUFBRSxZQUFZO3dCQUN2QixHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFO3dCQUM3QixnQkFBZ0IsRUFBRSwrQ0FBK0M7d0JBQ2pFLHdCQUF3QixFQUFFOzRCQUN4QixTQUFTLEVBQUUsUUFBUTt5QkFDcEI7d0JBQ0QseUJBQXlCLEVBQUU7NEJBQ3pCLFNBQVMsRUFBRSxXQUFXOzRCQUN0QixZQUFZLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO3lCQUNwQztxQkFDRixDQUFDLENBQ0gsQ0FBQztvQkFDRixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO1lBQ0gsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDakQsb0NBQW9DO1lBQ3RDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQztBQUNoRCxDQUFDLENBQUM7QUE1RFcsUUFBQSxPQUFPLFdBNERsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcclxuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgUHV0Q29tbWFuZCwgVXBkYXRlQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYic7XHJcbmltcG9ydCB7IER5bmFtb0RCU3RyZWFtRXZlbnQgfSBmcm9tICdhd3MtbGFtYmRhJztcclxuXHJcbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XHJcbmNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xyXG5cclxuY29uc3QgT1JERVJTX1RBQkxFID0gcHJvY2Vzcy5lbnYuT1JERVJTX1RBQkxFITtcclxuXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBEeW5hbW9EQlN0cmVhbUV2ZW50KSA9PiB7XHJcbiAgY29uc29sZS5sb2coJ1Byb2Nlc3Npbmcgc3RyZWFtIGV2ZW50czonLCBldmVudC5SZWNvcmRzLmxlbmd0aCk7XHJcblxyXG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGV2ZW50LlJlY29yZHMpIHtcclxuICAgIGlmIChyZWNvcmQuZXZlbnROYW1lID09PSAnSU5TRVJUJykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG5ld0ltYWdlID0gcmVjb3JkLmR5bmFtb2RiPy5OZXdJbWFnZTtcclxuICAgICAgICBpZiAoIW5ld0ltYWdlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgY29uc3QgZXZlbnRUeXBlID0gbmV3SW1hZ2UuZXZlbnRUeXBlPy5TO1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBuZXdJbWFnZS5wYXlsb2FkPy5TID8gSlNPTi5wYXJzZShuZXdJbWFnZS5wYXlsb2FkLlMpIDoge307XHJcbiAgICAgICAgY29uc3QgYWdncmVnYXRlSWQgPSBuZXdJbWFnZS5hZ2dyZWdhdGVJZD8uUztcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYFByb2Nlc3NpbmcgZXZlbnQ6ICR7ZXZlbnRUeXBlfSBmb3IgJHthZ2dyZWdhdGVJZH1gKTtcclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIE9yZGVyUGxhY2VkXHJcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ09yZGVyUGxhY2VkJykge1xyXG4gICAgICAgICAgYXdhaXQgZG9jQ2xpZW50LnNlbmQoXHJcbiAgICAgICAgICAgIG5ldyBQdXRDb21tYW5kKHtcclxuICAgICAgICAgICAgICBUYWJsZU5hbWU6IE9SREVSU19UQUJMRSxcclxuICAgICAgICAgICAgICBJdGVtOiB7XHJcbiAgICAgICAgICAgICAgICBvcmRlcklkOiBhZ2dyZWdhdGVJZCxcclxuICAgICAgICAgICAgICAgIGN1c3RvbWVySWQ6IHBheWxvYWQuY3VzdG9tZXJJZCxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBwYXlsb2FkLml0ZW1zIHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgdG90YWxBbW91bnQ6IHBheWxvYWQudG90YWxBbW91bnQgfHwgMCxcclxuICAgICAgICAgICAgICAgIHN0YXR1czogJ1BMQUNFRCcsXHJcbiAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ld0ltYWdlLnRpbWVzdGFtcD8uUyxcclxuICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogbmV3SW1hZ2UudGltZXN0YW1wPy5TLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYE9yZGVyIGNyZWF0ZWQ6ICR7YWdncmVnYXRlSWR9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBIYW5kbGUgT3JkZXJDYW5jZWxsZWRcclxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnT3JkZXJDYW5jZWxsZWQnKSB7XHJcbiAgICAgICAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChcclxuICAgICAgICAgICAgbmV3IFVwZGF0ZUNvbW1hbmQoe1xyXG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogT1JERVJTX1RBQkxFLFxyXG4gICAgICAgICAgICAgIEtleTogeyBvcmRlcklkOiBhZ2dyZWdhdGVJZCB9LFxyXG4gICAgICAgICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgI3N0YXR1cyA9IDpzdGF0dXMsIHVwZGF0ZWRBdCA9IDp1cGRhdGVkQXQnLFxyXG4gICAgICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xyXG4gICAgICAgICAgICAgICAgJyNzdGF0dXMnOiAnc3RhdHVzJyxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcclxuICAgICAgICAgICAgICAgICc6c3RhdHVzJzogJ0NBTkNFTExFRCcsXHJcbiAgICAgICAgICAgICAgICAnOnVwZGF0ZWRBdCc6IG5ld0ltYWdlLnRpbWVzdGFtcD8uUyxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBPcmRlciBjYW5jZWxsZWQ6ICR7YWdncmVnYXRlSWR9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgcmVjb3JkOicsIGVycm9yKTtcclxuICAgICAgICAvLyBDb250aW51ZSBwcm9jZXNzaW5nIG90aGVyIHJlY29yZHNcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBib2R5OiAnUHJvY2Vzc2VkJyB9O1xyXG59O1xyXG4iXX0=