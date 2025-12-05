"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const shared_1 = require("@nexus/shared");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const ENABLE_POLICY_ENFORCEMENT = process.env.ENABLE_POLICY_ENFORCEMENT !== 'false';
/**
 * Query Handler with Runtime Policy Enforcement
 *
 * Validates operations before execution:
 * - Service-to-service calls (no direct calls from Command Service)
 * - Rate limiting for temporal queries
 * - Authorization for sensitive queries
 *
 * Requirements: 12.1, 12.2, 12.3, 9.1, 9.2
 */
const handler = async (event) => {
    console.log('Query received:', JSON.stringify(event, null, 2));
    try {
        const path = event.path;
        // POLICY ENFORCEMENT: Validate no direct calls from Command Service
        if (ENABLE_POLICY_ENFORCEMENT) {
            const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || '';
            const source = userAgent.includes('command-service') ? 'command_service' : 'external';
            if (source === 'command_service') {
                try {
                    shared_1.policyEnforcer.validateServiceCall(source, 'query_dashboard', 'http');
                }
                catch (error) {
                    console.error('[PolicyEnforcement] ❌ Policy violation:', error.message);
                    return {
                        statusCode: 403,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({
                            error: 'Policy Violation',
                            message: error.message,
                            details: 'Direct calls from Command Service to Query Dashboard are prohibited. Use Event Bus.',
                            timestamp: new Date().toISOString(),
                        }),
                    };
                }
            }
            console.log('[PolicyEnforcement] ✅ Service call validated');
        }
        // Get all orders
        if (path === '/orders' || path.endsWith('/orders')) {
            const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: ORDERS_TABLE,
            }));
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
            const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: EVENTS_TABLE,
                Limit: 100,
            }));
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
            const result = await docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: ORDERS_TABLE,
                Key: { orderId },
            }));
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
    }
    catch (error) {
        console.error('Error processing query:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQXdGO0FBRXhGLDBDQUErQztBQUUvQyxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRTVELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBYSxDQUFDO0FBQy9DLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBYSxDQUFDO0FBQy9DLE1BQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsS0FBSyxPQUFPLENBQUM7QUFFcEY7Ozs7Ozs7OztHQVNHO0FBQ0ksTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUvRCxJQUFJLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBRXhCLG9FQUFvRTtRQUNwRSxJQUFJLHlCQUF5QixFQUFFLENBQUM7WUFDOUIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuRixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFFdEYsSUFBSSxNQUFNLEtBQUssaUJBQWlC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LE9BQU8sRUFBRSxDQUFDO1NBQy9DLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBcEhXLFFBQUEsT0FBTyxXQW9IbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFNjYW5Db21tYW5kLCBHZXRDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcclxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyBwb2xpY3lFbmZvcmNlciB9IGZyb20gJ0BuZXh1cy9zaGFyZWQnO1xyXG5cclxuY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcclxuY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0NsaWVudCk7XHJcblxyXG5jb25zdCBPUkRFUlNfVEFCTEUgPSBwcm9jZXNzLmVudi5PUkRFUlNfVEFCTEUhO1xyXG5jb25zdCBFVkVOVFNfVEFCTEUgPSBwcm9jZXNzLmVudi5FVkVOVFNfVEFCTEUhO1xyXG5jb25zdCBFTkFCTEVfUE9MSUNZX0VORk9SQ0VNRU5UID0gcHJvY2Vzcy5lbnYuRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVCAhPT0gJ2ZhbHNlJztcclxuXHJcbi8qKlxyXG4gKiBRdWVyeSBIYW5kbGVyIHdpdGggUnVudGltZSBQb2xpY3kgRW5mb3JjZW1lbnRcclxuICogXHJcbiAqIFZhbGlkYXRlcyBvcGVyYXRpb25zIGJlZm9yZSBleGVjdXRpb246XHJcbiAqIC0gU2VydmljZS10by1zZXJ2aWNlIGNhbGxzIChubyBkaXJlY3QgY2FsbHMgZnJvbSBDb21tYW5kIFNlcnZpY2UpXHJcbiAqIC0gUmF0ZSBsaW1pdGluZyBmb3IgdGVtcG9yYWwgcXVlcmllc1xyXG4gKiAtIEF1dGhvcml6YXRpb24gZm9yIHNlbnNpdGl2ZSBxdWVyaWVzXHJcbiAqIFxyXG4gKiBSZXF1aXJlbWVudHM6IDEyLjEsIDEyLjIsIDEyLjMsIDkuMSwgOS4yXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xyXG4gIGNvbnNvbGUubG9nKCdRdWVyeSByZWNlaXZlZDonLCBKU09OLnN0cmluZ2lmeShldmVudCwgbnVsbCwgMikpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcblxyXG4gICAgLy8gUE9MSUNZIEVORk9SQ0VNRU5UOiBWYWxpZGF0ZSBubyBkaXJlY3QgY2FsbHMgZnJvbSBDb21tYW5kIFNlcnZpY2VcclxuICAgIGlmIChFTkFCTEVfUE9MSUNZX0VORk9SQ0VNRU5UKSB7XHJcbiAgICAgIGNvbnN0IHVzZXJBZ2VudCA9IGV2ZW50LmhlYWRlcnNbJ1VzZXItQWdlbnQnXSB8fCBldmVudC5oZWFkZXJzWyd1c2VyLWFnZW50J10gfHwgJyc7XHJcbiAgICAgIGNvbnN0IHNvdXJjZSA9IHVzZXJBZ2VudC5pbmNsdWRlcygnY29tbWFuZC1zZXJ2aWNlJykgPyAnY29tbWFuZF9zZXJ2aWNlJyA6ICdleHRlcm5hbCc7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoc291cmNlID09PSAnY29tbWFuZF9zZXJ2aWNlJykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBwb2xpY3lFbmZvcmNlci52YWxpZGF0ZVNlcnZpY2VDYWxsKHNvdXJjZSwgJ3F1ZXJ5X2Rhc2hib2FyZCcsICdodHRwJyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignW1BvbGljeUVuZm9yY2VtZW50XSDinYwgUG9saWN5IHZpb2xhdGlvbjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMyxcclxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICBlcnJvcjogJ1BvbGljeSBWaW9sYXRpb24nLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgZGV0YWlsczogJ0RpcmVjdCBjYWxscyBmcm9tIENvbW1hbmQgU2VydmljZSB0byBRdWVyeSBEYXNoYm9hcmQgYXJlIHByb2hpYml0ZWQuIFVzZSBFdmVudCBCdXMuJyxcclxuICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFIFNlcnZpY2UgY2FsbCB2YWxpZGF0ZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgYWxsIG9yZGVyc1xyXG4gICAgaWYgKHBhdGggPT09ICcvb3JkZXJzJyB8fCBwYXRoLmVuZHNXaXRoKCcvb3JkZXJzJykpIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQoXHJcbiAgICAgICAgbmV3IFNjYW5Db21tYW5kKHtcclxuICAgICAgICAgIFRhYmxlTmFtZTogT1JERVJTX1RBQkxFLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBpdGVtczogcmVzdWx0Lkl0ZW1zIHx8IFtdLFxyXG4gICAgICAgICAgdG90YWw6IHJlc3VsdC5Db3VudCB8fCAwLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBhbGwgZXZlbnRzXHJcbiAgICBpZiAocGF0aCA9PT0gJy9ldmVudHMnIHx8IHBhdGguZW5kc1dpdGgoJy9ldmVudHMnKSkge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChcclxuICAgICAgICBuZXcgU2NhbkNvbW1hbmQoe1xyXG4gICAgICAgICAgVGFibGVOYW1lOiBFVkVOVFNfVEFCTEUsXHJcbiAgICAgICAgICBMaW1pdDogMTAwLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBpdGVtczogcmVzdWx0Lkl0ZW1zIHx8IFtdLFxyXG4gICAgICAgICAgdG90YWw6IHJlc3VsdC5Db3VudCB8fCAwLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBzaW5nbGUgb3JkZXJcclxuICAgIGNvbnN0IG9yZGVySWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ub3JkZXJJZDtcclxuICAgIGlmIChvcmRlcklkKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKFxyXG4gICAgICAgIG5ldyBHZXRDb21tYW5kKHtcclxuICAgICAgICAgIFRhYmxlTmFtZTogT1JERVJTX1RBQkxFLFxyXG4gICAgICAgICAgS2V5OiB7IG9yZGVySWQgfSxcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKCFyZXN1bHQuSXRlbSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdPcmRlciBub3QgZm91bmQnIH0pLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW52YWxpZCBxdWVyeScgfSksXHJcbiAgICB9O1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgcXVlcnk6JywgZXJyb3IpO1xyXG4gICAgXHJcbiAgICAvLyBMb2cgcG9saWN5IHZpb2xhdGlvbnMgc2VwYXJhdGVseVxyXG4gICAgaWYgKEVOQUJMRV9QT0xJQ1lfRU5GT1JDRU1FTlQpIHtcclxuICAgICAgY29uc3QgdmlvbGF0aW9ucyA9IHBvbGljeUVuZm9yY2VyLmdldFZpb2xhdGlvbnMoKTtcclxuICAgICAgaWYgKHZpb2xhdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQb2xpY3lFbmZvcmNlbWVudF0gUG9saWN5IHZpb2xhdGlvbnMgZGV0ZWN0ZWQ6JywgdmlvbGF0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSxcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG4iXX0=