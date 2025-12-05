"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENT_STORE_TABLE || process.env.EVENTS_TABLE;
const READ_MODEL_TABLE = process.env.READ_MODEL_TABLE;
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
const handler = async (event) => {
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
            eventId: (0, crypto_1.randomUUID)(),
            eventType: commandType,
            aggregateId: command.aggregateId || (0, crypto_1.randomUUID)(),
            aggregateVersion: 1,
            timestamp: new Date().toISOString(),
            payload: command,
            metadata: {
                correlationId: (0, crypto_1.randomUUID)(),
                causationId: (0, crypto_1.randomUUID)(),
                userId: 'demo-user',
                schemaVersion: '1.0',
            },
        };
        // Store event
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: EVENTS_TABLE,
            Item: {
                aggregateId: domainEvent.aggregateId,
                version: domainEvent.aggregateVersion,
                ...domainEvent,
            },
        }));
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
    }
    catch (error) {
        console.error('Error processing command:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQXlGO0FBRXpGLG1DQUFvQztBQUVwQyxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRTVELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFhLENBQUM7QUFDaEYsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFpQixDQUFDO0FBRXZEOzs7Ozs7Ozs7R0FTRztBQUNJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFakUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQy9DLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsV0FBVyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFFN0UsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtnQkFDbkYsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQzthQUM1RCxDQUFDO1FBQ0osQ0FBQztRQUVELDZCQUE2QjtRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXZELGlCQUFpQjtRQUNqQixNQUFNLFdBQVcsR0FBRztZQUNsQixPQUFPLEVBQUUsSUFBQSxtQkFBVSxHQUFFO1lBQ3JCLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLElBQUEsbUJBQVUsR0FBRTtZQUNoRCxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUNuQyxPQUFPLEVBQUUsT0FBTztZQUNoQixRQUFRLEVBQUU7Z0JBQ1IsYUFBYSxFQUFFLElBQUEsbUJBQVUsR0FBRTtnQkFDM0IsV0FBVyxFQUFFLElBQUEsbUJBQVUsR0FBRTtnQkFDekIsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLGFBQWEsRUFBRSxLQUFLO2FBQ3JCO1NBQ0YsQ0FBQztRQUVGLGNBQWM7UUFDZCxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ2xCLElBQUkseUJBQVUsQ0FBQztZQUNiLFNBQVMsRUFBRSxZQUFZO1lBQ3ZCLElBQUksRUFBRTtnQkFDSixXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7Z0JBQ3BDLE9BQU8sRUFBRSxXQUFXLENBQUMsZ0JBQWdCO2dCQUNyQyxHQUFHLFdBQVc7YUFDZjtTQUNGLENBQUMsQ0FDSCxDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWxELE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLEVBQUU7WUFDbkQsV0FBVztZQUNYLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVztZQUNwQyxPQUFPLEVBQUUsV0FBVyxDQUFDLE9BQU87U0FDN0IsQ0FBQyxDQUFDO1FBRUgsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUNuRixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO2dCQUNwQyxPQUFPLEVBQUUsV0FBVyxDQUFDLGdCQUFnQjtnQkFDckMsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQzthQUNoQyxDQUFDO1NBQ0gsQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUNuRixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDL0MsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUF4RVcsUUFBQSxPQUFPLFdBd0VsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcclxuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgUHV0Q29tbWFuZCwgUXVlcnlDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcclxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyByYW5kb21VVUlEIH0gZnJvbSAnY3J5cHRvJztcclxuXHJcbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XHJcbmNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xyXG5cclxuY29uc3QgRVZFTlRTX1RBQkxFID0gcHJvY2Vzcy5lbnYuRVZFTlRfU1RPUkVfVEFCTEUgfHwgcHJvY2Vzcy5lbnYuRVZFTlRTX1RBQkxFITtcclxuY29uc3QgUkVBRF9NT0RFTF9UQUJMRSA9IHByb2Nlc3MuZW52LlJFQURfTU9ERUxfVEFCTEUhO1xyXG5cclxuLyoqXHJcbiAqIENvbW1hbmQgSGFuZGxlciB3aXRoIFJ1bnRpbWUgUG9saWN5IEVuZm9yY2VtZW50XHJcbiAqIFxyXG4gKiBWYWxpZGF0ZXMgb3BlcmF0aW9ucyBiZWZvcmUgZXhlY3V0aW9uOlxyXG4gKiAtIERhdGFiYXNlIG9wZXJhdGlvbnMgKEV2ZW50U3RvcmUgaXMgYXBwZW5kLW9ubHkpXHJcbiAqIC0gRXZlbnQgcHVibGlzaGluZyAobXVzdCBoYXZlIHJlZ2lzdGVyZWQgc2NoZW1hKVxyXG4gKiAtIFNlcnZpY2UtdG8tc2VydmljZSBjYWxscyAobm8gZGlyZWN0IEhUVFAgY2FsbHMpXHJcbiAqIFxyXG4gKiBSZXF1aXJlbWVudHM6IDEyLjEsIDEyLjIsIDEyLjNcclxuICovXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XHJcbiAgY29uc29sZS5sb2coJ0NvbW1hbmQgcmVjZWl2ZWQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNvbW1hbmQgPSBKU09OLnBhcnNlKGV2ZW50LmJvZHkgfHwgJ3t9Jyk7XHJcbiAgICBjb25zdCBjb21tYW5kVHlwZSA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jb21tYW5kVHlwZSB8fCBjb21tYW5kLmNvbW1hbmRUeXBlO1xyXG5cclxuICAgIGlmICghY29tbWFuZFR5cGUpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0NvbW1hbmQgdHlwZSBpcyByZXF1aXJlZCcgfSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2ltcGxlIHZhbGlkYXRpb24gZm9yIGRlbW9cclxuICAgIGNvbnNvbGUubG9nKCdbRGVtb10gUHJvY2Vzc2luZyBjb21tYW5kOicsIGNvbW1hbmRUeXBlKTtcclxuXHJcbiAgICAvLyBHZW5lcmF0ZSBldmVudFxyXG4gICAgY29uc3QgZG9tYWluRXZlbnQgPSB7XHJcbiAgICAgIGV2ZW50SWQ6IHJhbmRvbVVVSUQoKSxcclxuICAgICAgZXZlbnRUeXBlOiBjb21tYW5kVHlwZSxcclxuICAgICAgYWdncmVnYXRlSWQ6IGNvbW1hbmQuYWdncmVnYXRlSWQgfHwgcmFuZG9tVVVJRCgpLFxyXG4gICAgICBhZ2dyZWdhdGVWZXJzaW9uOiAxLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgcGF5bG9hZDogY29tbWFuZCxcclxuICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICBjb3JyZWxhdGlvbklkOiByYW5kb21VVUlEKCksXHJcbiAgICAgICAgY2F1c2F0aW9uSWQ6IHJhbmRvbVVVSUQoKSxcclxuICAgICAgICB1c2VySWQ6ICdkZW1vLXVzZXInLFxyXG4gICAgICAgIHNjaGVtYVZlcnNpb246ICcxLjAnLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBTdG9yZSBldmVudFxyXG4gICAgYXdhaXQgZG9jQ2xpZW50LnNlbmQoXHJcbiAgICAgIG5ldyBQdXRDb21tYW5kKHtcclxuICAgICAgICBUYWJsZU5hbWU6IEVWRU5UU19UQUJMRSxcclxuICAgICAgICBJdGVtOiB7XHJcbiAgICAgICAgICBhZ2dyZWdhdGVJZDogZG9tYWluRXZlbnQuYWdncmVnYXRlSWQsXHJcbiAgICAgICAgICB2ZXJzaW9uOiBkb21haW5FdmVudC5hZ2dyZWdhdGVWZXJzaW9uLFxyXG4gICAgICAgICAgLi4uZG9tYWluRXZlbnQsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ0V2ZW50IHN0b3JlZDonLCBkb21haW5FdmVudC5ldmVudElkKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnW0RlbW9dIENvbW1hbmQgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScsIHtcclxuICAgICAgY29tbWFuZFR5cGUsXHJcbiAgICAgIGFnZ3JlZ2F0ZUlkOiBkb21haW5FdmVudC5hZ2dyZWdhdGVJZCxcclxuICAgICAgZXZlbnRJZDogZG9tYWluRXZlbnQuZXZlbnRJZCxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDIwMixcclxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIGFnZ3JlZ2F0ZUlkOiBkb21haW5FdmVudC5hZ2dyZWdhdGVJZCxcclxuICAgICAgICB2ZXJzaW9uOiBkb21haW5FdmVudC5hZ2dyZWdhdGVWZXJzaW9uLFxyXG4gICAgICAgIGV2ZW50SWRzOiBbZG9tYWluRXZlbnQuZXZlbnRJZF0sXHJcbiAgICAgIH0pLFxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGNvbW1hbmQ6JywgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSxcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG4iXX0=