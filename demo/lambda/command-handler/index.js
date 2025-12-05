"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const shared_1 = require("@nexus/shared");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const ENABLE_POLICY_ENFORCEMENT = process.env.ENABLE_POLICY_ENFORCEMENT !== 'false';
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
        // POLICY ENFORCEMENT: Validate database operation (EventStore is append-only)
        if (ENABLE_POLICY_ENFORCEMENT) {
            try {
                shared_1.policyEnforcer.validateDatabaseOperation('EventStore', 'INSERT');
                console.log('[PolicyEnforcement] ✅ Database operation validated');
            }
            catch (error) {
                console.error('[PolicyEnforcement] ❌ Policy violation:', error.message);
                return {
                    statusCode: 403,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        error: 'Policy Violation',
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    }),
                };
            }
        }
        // POLICY ENFORCEMENT: Validate event publishing (check if schema registered)
        if (ENABLE_POLICY_ENFORCEMENT) {
            try {
                // In production, check Schema Registry
                // For demo, allow known event types
                const knownEventTypes = ['OrderPlaced', 'OrderCancelled', 'PaymentProcessed'];
                const hasSchema = knownEventTypes.includes(commandType);
                shared_1.policyEnforcer.validateEventPublish(commandType, hasSchema);
                console.log('[PolicyEnforcement] ✅ Event publish validated');
            }
            catch (error) {
                console.error('[PolicyEnforcement] ❌ Policy violation:', error.message);
                return {
                    statusCode: 403,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        error: 'Policy Violation',
                        message: error.message,
                        details: `Event type '${commandType}' has no registered schema`,
                        timestamp: new Date().toISOString(),
                    }),
                };
            }
        }
        // Generate event
        const domainEvent = {
            eventId: (0, uuid_1.v4)(),
            eventType: commandType,
            aggregateId: command.aggregateId || (0, uuid_1.v4)(),
            aggregateVersion: 1,
            timestamp: new Date().toISOString(),
            payload: command,
            metadata: {
                correlationId: (0, uuid_1.v4)(),
                causationId: (0, uuid_1.v4)(),
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
        // Log successful operation for audit trail
        if (ENABLE_POLICY_ENFORCEMENT) {
            console.log('[PolicyEnforcement] ✅ Command processed successfully', {
                commandType,
                aggregateId: domainEvent.aggregateId,
                eventId: domainEvent.eventId,
                timestamp: new Date().toISOString(),
            });
        }
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
        // Log policy violations separately
        if (ENABLE_POLICY_ENFORCEMENT) {
            const violations = shared_1.policyEnforcer.getViolations();
            if (violations.length > 0) {
                console.error('[PolicyEnforcement] Policy violations detected:', violations);
            }
        }
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQXlGO0FBRXpGLCtCQUFvQztBQUNwQywwQ0FBK0M7QUFFL0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sU0FBUyxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUU1RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQWEsQ0FBQztBQUMvQyxNQUFNLHlCQUF5QixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEtBQUssT0FBTyxDQUFDO0FBRXBGOzs7Ozs7Ozs7R0FTRztBQUNJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFakUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQy9DLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsV0FBVyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFFN0UsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtnQkFDbkYsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQzthQUM1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O1FBRUQsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUNuRixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDL0MsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUE5SFcsUUFBQSxPQUFPLFdBOEhsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcclxuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgUHV0Q29tbWFuZCwgUXVlcnlDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcclxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcclxuaW1wb3J0IHsgcG9saWN5RW5mb3JjZXIgfSBmcm9tICdAbmV4dXMvc2hhcmVkJztcclxuXHJcbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XHJcbmNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xyXG5cclxuY29uc3QgRVZFTlRTX1RBQkxFID0gcHJvY2Vzcy5lbnYuRVZFTlRTX1RBQkxFITtcclxuY29uc3QgRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVCA9IHByb2Nlc3MuZW52LkVOQUJMRV9QT0xJQ1lfRU5GT1JDRU1FTlQgIT09ICdmYWxzZSc7XHJcblxyXG4vKipcclxuICogQ29tbWFuZCBIYW5kbGVyIHdpdGggUnVudGltZSBQb2xpY3kgRW5mb3JjZW1lbnRcclxuICogXHJcbiAqIFZhbGlkYXRlcyBvcGVyYXRpb25zIGJlZm9yZSBleGVjdXRpb246XHJcbiAqIC0gRGF0YWJhc2Ugb3BlcmF0aW9ucyAoRXZlbnRTdG9yZSBpcyBhcHBlbmQtb25seSlcclxuICogLSBFdmVudCBwdWJsaXNoaW5nIChtdXN0IGhhdmUgcmVnaXN0ZXJlZCBzY2hlbWEpXHJcbiAqIC0gU2VydmljZS10by1zZXJ2aWNlIGNhbGxzIChubyBkaXJlY3QgSFRUUCBjYWxscylcclxuICogXHJcbiAqIFJlcXVpcmVtZW50czogMTIuMSwgMTIuMiwgMTIuM1xyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcclxuICBjb25zb2xlLmxvZygnQ29tbWFuZCByZWNlaXZlZDonLCBKU09OLnN0cmluZ2lmeShldmVudCwgbnVsbCwgMikpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgY29tbWFuZCA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSB8fCAne30nKTtcclxuICAgIGNvbnN0IGNvbW1hbmRUeXBlID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNvbW1hbmRUeXBlIHx8IGNvbW1hbmQuY29tbWFuZFR5cGU7XHJcblxyXG4gICAgaWYgKCFjb21tYW5kVHlwZSkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnQ29tbWFuZCB0eXBlIGlzIHJlcXVpcmVkJyB9KSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQT0xJQ1kgRU5GT1JDRU1FTlQ6IFZhbGlkYXRlIGRhdGFiYXNlIG9wZXJhdGlvbiAoRXZlbnRTdG9yZSBpcyBhcHBlbmQtb25seSlcclxuICAgIGlmIChFTkFCTEVfUE9MSUNZX0VORk9SQ0VNRU5UKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcG9saWN5RW5mb3JjZXIudmFsaWRhdGVEYXRhYmFzZU9wZXJhdGlvbignRXZlbnRTdG9yZScsICdJTlNFUlQnKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnW1BvbGljeUVuZm9yY2VtZW50XSDinIUgRGF0YWJhc2Ugb3BlcmF0aW9uIHZhbGlkYXRlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW1BvbGljeUVuZm9yY2VtZW50XSDinYwgUG9saWN5IHZpb2xhdGlvbjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogNDAzLFxyXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonIH0sXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIGVycm9yOiAnUG9saWN5IFZpb2xhdGlvbicsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFBPTElDWSBFTkZPUkNFTUVOVDogVmFsaWRhdGUgZXZlbnQgcHVibGlzaGluZyAoY2hlY2sgaWYgc2NoZW1hIHJlZ2lzdGVyZWQpXHJcbiAgICBpZiAoRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIEluIHByb2R1Y3Rpb24sIGNoZWNrIFNjaGVtYSBSZWdpc3RyeVxyXG4gICAgICAgIC8vIEZvciBkZW1vLCBhbGxvdyBrbm93biBldmVudCB0eXBlc1xyXG4gICAgICAgIGNvbnN0IGtub3duRXZlbnRUeXBlcyA9IFsnT3JkZXJQbGFjZWQnLCAnT3JkZXJDYW5jZWxsZWQnLCAnUGF5bWVudFByb2Nlc3NlZCddO1xyXG4gICAgICAgIGNvbnN0IGhhc1NjaGVtYSA9IGtub3duRXZlbnRUeXBlcy5pbmNsdWRlcyhjb21tYW5kVHlwZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcG9saWN5RW5mb3JjZXIudmFsaWRhdGVFdmVudFB1Ymxpc2goY29tbWFuZFR5cGUsIGhhc1NjaGVtYSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFIEV2ZW50IHB1Ymxpc2ggdmFsaWRhdGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbUG9saWN5RW5mb3JjZW1lbnRdIOKdjCBQb2xpY3kgdmlvbGF0aW9uOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDMsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgZXJyb3I6ICdQb2xpY3kgVmlvbGF0aW9uJyxcclxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgZGV0YWlsczogYEV2ZW50IHR5cGUgJyR7Y29tbWFuZFR5cGV9JyBoYXMgbm8gcmVnaXN0ZXJlZCBzY2hlbWFgLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBHZW5lcmF0ZSBldmVudFxyXG4gICAgY29uc3QgZG9tYWluRXZlbnQgPSB7XHJcbiAgICAgIGV2ZW50SWQ6IHV1aWR2NCgpLFxyXG4gICAgICBldmVudFR5cGU6IGNvbW1hbmRUeXBlLFxyXG4gICAgICBhZ2dyZWdhdGVJZDogY29tbWFuZC5hZ2dyZWdhdGVJZCB8fCB1dWlkdjQoKSxcclxuICAgICAgYWdncmVnYXRlVmVyc2lvbjogMSxcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgIHBheWxvYWQ6IGNvbW1hbmQsXHJcbiAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgY29ycmVsYXRpb25JZDogdXVpZHY0KCksXHJcbiAgICAgICAgY2F1c2F0aW9uSWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgIHVzZXJJZDogJ2RlbW8tdXNlcicsXHJcbiAgICAgICAgc2NoZW1hVmVyc2lvbjogJzEuMCcsXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFN0b3JlIGV2ZW50XHJcbiAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChcclxuICAgICAgbmV3IFB1dENvbW1hbmQoe1xyXG4gICAgICAgIFRhYmxlTmFtZTogRVZFTlRTX1RBQkxFLFxyXG4gICAgICAgIEl0ZW06IHtcclxuICAgICAgICAgIGFnZ3JlZ2F0ZUlkOiBkb21haW5FdmVudC5hZ2dyZWdhdGVJZCxcclxuICAgICAgICAgIHZlcnNpb246IGRvbWFpbkV2ZW50LmFnZ3JlZ2F0ZVZlcnNpb24sXHJcbiAgICAgICAgICAuLi5kb21haW5FdmVudCxcclxuICAgICAgICB9LFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnRXZlbnQgc3RvcmVkOicsIGRvbWFpbkV2ZW50LmV2ZW50SWQpO1xyXG5cclxuICAgIC8vIExvZyBzdWNjZXNzZnVsIG9wZXJhdGlvbiBmb3IgYXVkaXQgdHJhaWxcclxuICAgIGlmIChFTkFCTEVfUE9MSUNZX0VORk9SQ0VNRU5UKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdbUG9saWN5RW5mb3JjZW1lbnRdIOKchSBDb21tYW5kIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknLCB7XHJcbiAgICAgICAgY29tbWFuZFR5cGUsXHJcbiAgICAgICAgYWdncmVnYXRlSWQ6IGRvbWFpbkV2ZW50LmFnZ3JlZ2F0ZUlkLFxyXG4gICAgICAgIGV2ZW50SWQ6IGRvbWFpbkV2ZW50LmV2ZW50SWQsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDIwMixcclxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIGFnZ3JlZ2F0ZUlkOiBkb21haW5FdmVudC5hZ2dyZWdhdGVJZCxcclxuICAgICAgICB2ZXJzaW9uOiBkb21haW5FdmVudC5hZ2dyZWdhdGVWZXJzaW9uLFxyXG4gICAgICAgIGV2ZW50SWRzOiBbZG9tYWluRXZlbnQuZXZlbnRJZF0sXHJcbiAgICAgIH0pLFxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGNvbW1hbmQ6JywgZXJyb3IpO1xyXG4gICAgXHJcbiAgICAvLyBMb2cgcG9saWN5IHZpb2xhdGlvbnMgc2VwYXJhdGVseVxyXG4gICAgaWYgKEVOQUJMRV9QT0xJQ1lfRU5GT1JDRU1FTlQpIHtcclxuICAgICAgY29uc3QgdmlvbGF0aW9ucyA9IHBvbGljeUVuZm9yY2VyLmdldFZpb2xhdGlvbnMoKTtcclxuICAgICAgaWYgKHZpb2xhdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQb2xpY3lFbmZvcmNlbWVudF0gUG9saWN5IHZpb2xhdGlvbnMgZGV0ZWN0ZWQ6JywgdmlvbGF0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSxcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG4iXX0=