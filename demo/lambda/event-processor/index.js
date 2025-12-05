"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const ORDERS_TABLE = process.env.READ_MODEL_TABLE || process.env.ORDERS_TABLE;
// Helper to extract payload from DynamoDB stream record
function extractPayload(newImage) {
    // Try string first (S type)
    if (newImage.payload?.S) {
        try {
            return JSON.parse(newImage.payload.S);
        }
        catch {
            return {};
        }
    }
    // Try map type (M type) - unmarshall the whole record and get payload
    if (newImage.payload?.M) {
        return (0, util_dynamodb_1.unmarshall)(newImage.payload.M);
    }
    // Fallback: unmarshall entire record and extract payload
    try {
        const unmarshalled = (0, util_dynamodb_1.unmarshall)(newImage);
        return unmarshalled.payload || {};
    }
    catch {
        return {};
    }
}
const handler = async (event) => {
    console.log('Processing stream events:', event.Records.length);
    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            try {
                const newImage = record.dynamodb?.NewImage;
                if (!newImage)
                    continue;
                const eventType = newImage.eventType?.S;
                const payload = extractPayload(newImage);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQTBGO0FBRTFGLDBEQUFvRDtBQUVwRCxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRTVELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFhLENBQUM7QUFFL0Usd0RBQXdEO0FBQ3hELFNBQVMsY0FBYyxDQUFDLFFBQTJDO0lBQ2pFLDRCQUE0QjtJQUM1QixJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztJQUNILENBQUM7SUFDRCxzRUFBc0U7SUFDdEUsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sSUFBQSwwQkFBVSxFQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBUSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNELHlEQUF5RDtJQUN6RCxJQUFJLENBQUM7UUFDSCxNQUFNLFlBQVksR0FBRyxJQUFBLDBCQUFVLEVBQUMsUUFBZSxDQUFDLENBQUM7UUFDakQsT0FBTyxZQUFZLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0FBQ0gsQ0FBQztBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEwQixFQUFFLEVBQUU7SUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRS9ELEtBQUssTUFBTSxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25DLElBQUksTUFBTSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxRQUFRO29CQUFFLFNBQVM7Z0JBRXhCLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsUUFBZSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUU1QyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixTQUFTLFFBQVEsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFFakUscUJBQXFCO2dCQUNyQixJQUFJLFNBQVMsS0FBSyxhQUFhLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNsQixJQUFJLHlCQUFVLENBQUM7d0JBQ2IsU0FBUyxFQUFFLFlBQVk7d0JBQ3ZCLElBQUksRUFBRTs0QkFDSixPQUFPLEVBQUUsV0FBVzs0QkFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVOzRCQUM5QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFOzRCQUMxQixXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVcsSUFBSSxDQUFDOzRCQUNyQyxNQUFNLEVBQUUsUUFBUTs0QkFDaEIsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs0QkFDaEMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQzt5QkFDakM7cUJBQ0YsQ0FBQyxDQUNILENBQUM7b0JBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztnQkFFRCx3QkFBd0I7Z0JBQ3hCLElBQUksU0FBUyxLQUFLLGdCQUFnQixFQUFFLENBQUM7b0JBQ25DLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FDbEIsSUFBSSw0QkFBYSxDQUFDO3dCQUNoQixTQUFTLEVBQUUsWUFBWTt3QkFDdkIsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRTt3QkFDN0IsZ0JBQWdCLEVBQUUsK0NBQStDO3dCQUNqRSx3QkFBd0IsRUFBRTs0QkFDeEIsU0FBUyxFQUFFLFFBQVE7eUJBQ3BCO3dCQUNELHlCQUF5QixFQUFFOzRCQUN6QixTQUFTLEVBQUUsV0FBVzs0QkFDdEIsWUFBWSxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQzt5QkFDcEM7cUJBQ0YsQ0FBQyxDQUNILENBQUM7b0JBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDakQsQ0FBQztZQUNILENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2pELG9DQUFvQztZQUN0QyxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7QUFDaEQsQ0FBQyxDQUFDO0FBNURXLFFBQUEsT0FBTyxXQTREbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFB1dENvbW1hbmQsIFVwZGF0ZUNvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xyXG5pbXBvcnQgeyBEeW5hbW9EQlN0cmVhbUV2ZW50LCBBdHRyaWJ1dGVWYWx1ZSB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyB1bm1hcnNoYWxsIH0gZnJvbSAnQGF3cy1zZGsvdXRpbC1keW5hbW9kYic7XHJcblxyXG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xyXG5jb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vQ2xpZW50KTtcclxuXHJcbmNvbnN0IE9SREVSU19UQUJMRSA9IHByb2Nlc3MuZW52LlJFQURfTU9ERUxfVEFCTEUgfHwgcHJvY2Vzcy5lbnYuT1JERVJTX1RBQkxFITtcclxuXHJcbi8vIEhlbHBlciB0byBleHRyYWN0IHBheWxvYWQgZnJvbSBEeW5hbW9EQiBzdHJlYW0gcmVjb3JkXHJcbmZ1bmN0aW9uIGV4dHJhY3RQYXlsb2FkKG5ld0ltYWdlOiB7IFtrZXk6IHN0cmluZ106IEF0dHJpYnV0ZVZhbHVlIH0pOiBhbnkge1xyXG4gIC8vIFRyeSBzdHJpbmcgZmlyc3QgKFMgdHlwZSlcclxuICBpZiAobmV3SW1hZ2UucGF5bG9hZD8uUykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobmV3SW1hZ2UucGF5bG9hZC5TKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4ge307XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vIFRyeSBtYXAgdHlwZSAoTSB0eXBlKSAtIHVubWFyc2hhbGwgdGhlIHdob2xlIHJlY29yZCBhbmQgZ2V0IHBheWxvYWRcclxuICBpZiAobmV3SW1hZ2UucGF5bG9hZD8uTSkge1xyXG4gICAgcmV0dXJuIHVubWFyc2hhbGwobmV3SW1hZ2UucGF5bG9hZC5NIGFzIGFueSk7XHJcbiAgfVxyXG4gIC8vIEZhbGxiYWNrOiB1bm1hcnNoYWxsIGVudGlyZSByZWNvcmQgYW5kIGV4dHJhY3QgcGF5bG9hZFxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1bm1hcnNoYWxsZWQgPSB1bm1hcnNoYWxsKG5ld0ltYWdlIGFzIGFueSk7XHJcbiAgICByZXR1cm4gdW5tYXJzaGFsbGVkLnBheWxvYWQgfHwge307XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogRHluYW1vREJTdHJlYW1FdmVudCkgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIHN0cmVhbSBldmVudHM6JywgZXZlbnQuUmVjb3Jkcy5sZW5ndGgpO1xyXG5cclxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBldmVudC5SZWNvcmRzKSB7XHJcbiAgICBpZiAocmVjb3JkLmV2ZW50TmFtZSA9PT0gJ0lOU0VSVCcpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBuZXdJbWFnZSA9IHJlY29yZC5keW5hbW9kYj8uTmV3SW1hZ2U7XHJcbiAgICAgICAgaWYgKCFuZXdJbWFnZSkgY29udGludWU7XHJcblxyXG4gICAgICAgIGNvbnN0IGV2ZW50VHlwZSA9IG5ld0ltYWdlLmV2ZW50VHlwZT8uUztcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0gZXh0cmFjdFBheWxvYWQobmV3SW1hZ2UgYXMgYW55KTtcclxuICAgICAgICBjb25zdCBhZ2dyZWdhdGVJZCA9IG5ld0ltYWdlLmFnZ3JlZ2F0ZUlkPy5TO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBldmVudDogJHtldmVudFR5cGV9IGZvciAke2FnZ3JlZ2F0ZUlkfWApO1xyXG5cclxuICAgICAgICAvLyBIYW5kbGUgT3JkZXJQbGFjZWRcclxuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnT3JkZXJQbGFjZWQnKSB7XHJcbiAgICAgICAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChcclxuICAgICAgICAgICAgbmV3IFB1dENvbW1hbmQoe1xyXG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogT1JERVJTX1RBQkxFLFxyXG4gICAgICAgICAgICAgIEl0ZW06IHtcclxuICAgICAgICAgICAgICAgIG9yZGVySWQ6IGFnZ3JlZ2F0ZUlkLFxyXG4gICAgICAgICAgICAgICAgY3VzdG9tZXJJZDogcGF5bG9hZC5jdXN0b21lcklkLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IHBheWxvYWQuaXRlbXMgfHwgW10sXHJcbiAgICAgICAgICAgICAgICB0b3RhbEFtb3VudDogcGF5bG9hZC50b3RhbEFtb3VudCB8fCAwLFxyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnUExBQ0VEJyxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3SW1hZ2UudGltZXN0YW1wPy5TLFxyXG4gICAgICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXdJbWFnZS50aW1lc3RhbXA/LlMsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgT3JkZXIgY3JlYXRlZDogJHthZ2dyZWdhdGVJZH1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBPcmRlckNhbmNlbGxlZFxyXG4gICAgICAgIGlmIChldmVudFR5cGUgPT09ICdPcmRlckNhbmNlbGxlZCcpIHtcclxuICAgICAgICAgIGF3YWl0IGRvY0NsaWVudC5zZW5kKFxyXG4gICAgICAgICAgICBuZXcgVXBkYXRlQ29tbWFuZCh7XHJcbiAgICAgICAgICAgICAgVGFibGVOYW1lOiBPUkRFUlNfVEFCTEUsXHJcbiAgICAgICAgICAgICAgS2V5OiB7IG9yZGVySWQ6IGFnZ3JlZ2F0ZUlkIH0sXHJcbiAgICAgICAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogJ1NFVCAjc3RhdHVzID0gOnN0YXR1cywgdXBkYXRlZEF0ID0gOnVwZGF0ZWRBdCcsXHJcbiAgICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XHJcbiAgICAgICAgICAgICAgICAnI3N0YXR1cyc6ICdzdGF0dXMnLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgICAgICAgICAgJzpzdGF0dXMnOiAnQ0FOQ0VMTEVEJyxcclxuICAgICAgICAgICAgICAgICc6dXBkYXRlZEF0JzogbmV3SW1hZ2UudGltZXN0YW1wPy5TLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYE9yZGVyIGNhbmNlbGxlZDogJHthZ2dyZWdhdGVJZH1gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyByZWNvcmQ6JywgZXJyb3IpO1xyXG4gICAgICAgIC8vIENvbnRpbnVlIHByb2Nlc3Npbmcgb3RoZXIgcmVjb3Jkc1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAsIGJvZHk6ICdQcm9jZXNzZWQnIH07XHJcbn07XHJcbiJdfQ==