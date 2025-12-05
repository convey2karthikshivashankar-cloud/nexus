"use strict";
/**
 * Integration Tests for Query Handler Policy Enforcement
 *
 * Tests runtime policy enforcement in the Query Handler Lambda.
 *
 * Requirements tested:
 * - 9.1: Service decoupling enforcement
 * - 9.2: No direct calls from Command Service
 * - 9.3: Audit logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const shared_1 = require("@nexus/shared");
// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn(() => ({
            send: jest.fn().mockResolvedValue({
                Items: [
                    { orderId: 'order-1', status: 'placed' },
                    { orderId: 'order-2', status: 'cancelled' },
                ],
                Count: 2,
            }),
        })),
    },
    ScanCommand: jest.fn(),
    GetCommand: jest.fn(),
}));
// Spy on console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
describe('Query Handler - Policy Enforcement Integration', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'query-handler',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:query-handler',
        memoryLimitInMB: '256',
        awsRequestId: 'test-request-id',
        logGroupName: '/aws/lambda/query-handler',
        logStreamName: 'test-stream',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy.mockClear();
        consoleErrorSpy.mockClear();
        shared_1.policyEnforcer.clearViolations();
        // Set environment variables
        process.env.ORDERS_TABLE = 'test-orders-table';
        process.env.EVENTS_TABLE = 'test-events-table';
        process.env.ENABLE_POLICY_ENFORCEMENT = 'true';
    });
    afterEach(() => {
        delete process.env.ORDERS_TABLE;
        delete process.env.EVENTS_TABLE;
        delete process.env.ENABLE_POLICY_ENFORCEMENT;
    });
    describe('Service Decoupling Policy', () => {
        it('should allow queries from external sources (browsers)', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Service call validated'));
            expect(shared_1.policyEnforcer.getViolations()).toHaveLength(0);
        });
        it('should allow queries from mobile apps', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {
                    'User-Agent': 'MyApp/1.0 (iOS 15.0)',
                },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Service call validated'));
        });
        it('should block direct calls from Command Service', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {
                    'User-Agent': 'command-service/1.0',
                },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(403);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.error).toBe('Policy Violation');
            expect(responseBody.message).toContain('Direct service calls are prohibited');
            expect(responseBody.details).toContain('Direct calls from Command Service to Query Dashboard are prohibited');
            expect(responseBody.timestamp).toBeDefined();
            expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.stringContaining('Direct service calls are prohibited'));
        });
        it('should detect command-service in various User-Agent formats', async () => {
            const commandServiceUserAgents = [
                'command-service',
                'command-service/1.0',
                'MyApp command-service Client',
                'AWS-SDK command-service',
            ];
            for (const userAgent of commandServiceUserAgents) {
                const event = {
                    httpMethod: 'GET',
                    path: '/orders',
                    pathParameters: null,
                    body: null,
                    headers: { 'User-Agent': userAgent },
                    multiValueHeaders: {},
                    queryStringParameters: null,
                    multiValueQueryStringParameters: null,
                    isBase64Encoded: false,
                    requestContext: {},
                    resource: '',
                    stageVariables: null,
                };
                const result = await (0, index_1.handler)(event, mockContext);
                expect(result.statusCode).toBe(403);
                expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.any(String));
            }
        });
        it('should handle missing User-Agent header', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {}, // No User-Agent
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Service call validated'));
        });
        it('should handle case-insensitive User-Agent header', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {
                    'user-agent': 'command-service', // lowercase
                },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(403);
            expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.any(String));
        });
    });
    describe('Environment-based Control', () => {
        it('should skip policy enforcement when disabled', async () => {
            process.env.ENABLE_POLICY_ENFORCEMENT = 'false';
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {
                    'User-Agent': 'command-service',
                },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            // Should succeed even with command-service User-Agent
            expect(result.statusCode).toBe(200);
            expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement]'));
        });
        it('should enable policy enforcement by default', async () => {
            delete process.env.ENABLE_POLICY_ENFORCEMENT;
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅'));
        });
    });
    describe('Query Path Handling', () => {
        it('should handle /orders path', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.items).toBeDefined();
            expect(responseBody.total).toBe(2);
        });
        it('should handle /events path', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/events',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Service call validated'));
        });
        it('should handle invalid query path', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/invalid',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(400);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.error).toBe('Invalid query');
        });
    });
    describe('Error Handling', () => {
        it('should handle general errors gracefully', async () => {
            // Mock DynamoDB error
            const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
            DynamoDBDocumentClient.from = jest.fn(() => ({
                send: jest.fn().mockRejectedValue(new Error('DynamoDB connection failed')),
            }));
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing query:', expect.any(Error));
        });
        it('should log policy violations on error', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'command-service' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(403);
            expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.any(String));
            const violations = shared_1.policyEnforcer.getViolations();
            if (violations.length > 0) {
                expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] Policy violations detected:', expect.any(Array));
            }
        });
    });
    describe('Audit Trail', () => {
        it('should create complete audit trail for successful query', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyApp/1.0)' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            // Verify audit trail logs
            expect(consoleLogSpy).toHaveBeenCalledWith('Query received:', expect.any(String));
            expect(consoleLogSpy).toHaveBeenCalledWith('[PolicyEnforcement] ✅ Service call validated');
        });
        it('should create audit trail for policy violations', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'command-service' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(403);
            // Verify violation audit trail
            expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.stringContaining('Direct service calls are prohibited'));
            const responseBody = JSON.parse(result.body);
            expect(responseBody.timestamp).toBeDefined();
            expect(new Date(responseBody.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
        });
    });
    describe('CORS Headers', () => {
        it('should include CORS headers in successful responses', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.headers).toEqual({
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
        });
        it('should include CORS headers in error responses', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'command-service' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.headers).toEqual({
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
        });
    });
    describe('Integration with Existing Query Logic', () => {
        it('should not interfere with valid query processing', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/orders',
                pathParameters: null,
                body: null,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyApp/1.0)' },
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            // Policy enforcement should complete successfully
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Service call validated'));
            // Should proceed to normal query processing
            expect(result.statusCode).toBe(200);
            // Should have proper response structure
            const responseBody = JSON.parse(result.body);
            expect(responseBody.items).toBeDefined();
            expect(responseBody.total).toBeDefined();
            // Should have proper CORS headers
            expect(result.headers).toEqual(expect.objectContaining({
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUG9saWN5RW5mb3JjZW1lbnQuaW50ZWdyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlBvbGljeUVuZm9yY2VtZW50LmludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7QUFFSCxvQ0FBbUM7QUFFbkMsMENBQStDO0FBRS9DLGVBQWU7QUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLHNCQUFzQixFQUFFO1FBQ3RCLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkIsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDaEMsS0FBSyxFQUFFO29CQUNMLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFO29CQUN4QyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtpQkFDNUM7Z0JBQ0QsS0FBSyxFQUFFLENBQUM7YUFDVCxDQUFDO1NBQ0gsQ0FBQyxDQUFDO0tBQ0o7SUFDRCxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtJQUN0QixVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtDQUN0QixDQUFDLENBQUMsQ0FBQztBQUVKLHlCQUF5QjtBQUN6QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQ3RFLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFFMUUsUUFBUSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtJQUM5RCxNQUFNLFdBQVcsR0FBWTtRQUMzQiw4QkFBOEIsRUFBRSxLQUFLO1FBQ3JDLFlBQVksRUFBRSxlQUFlO1FBQzdCLGVBQWUsRUFBRSxHQUFHO1FBQ3BCLGtCQUFrQixFQUFFLDhEQUE4RDtRQUNsRixlQUFlLEVBQUUsS0FBSztRQUN0QixZQUFZLEVBQUUsaUJBQWlCO1FBQy9CLFlBQVksRUFBRSwyQkFBMkI7UUFDekMsYUFBYSxFQUFFLGFBQWE7UUFDNUIsd0JBQXdCLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSztRQUNyQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNmLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7S0FDbkIsQ0FBQztJQUVGLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckIsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFCLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM1Qix1QkFBYyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRWpDLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixHQUFHLE1BQU0sQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO1FBQ2hDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7UUFDaEMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDO0lBQy9DLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUN6QyxFQUFFLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckUsTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRTtvQkFDUCxZQUFZLEVBQUUsOERBQThEO2lCQUM3RTtnQkFDRCxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLENBQ3hDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUN4RSxDQUFDO1lBQ0YsTUFBTSxDQUFDLHVCQUFjLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckQsTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRTtvQkFDUCxZQUFZLEVBQUUsc0JBQXNCO2lCQUNyQztnQkFDRCxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLENBQ3hDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUN4RSxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUQsTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRTtvQkFDUCxZQUFZLEVBQUUscUJBQXFCO2lCQUNwQztnQkFDRCxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVwQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7WUFDOUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMscUVBQXFFLENBQUMsQ0FBQztZQUM5RyxNQUFNLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRTdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxvQkFBb0IsQ0FDMUMseUNBQXlDLEVBQ3pDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUMvRCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkRBQTZELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0UsTUFBTSx3QkFBd0IsR0FBRztnQkFDL0IsaUJBQWlCO2dCQUNqQixxQkFBcUI7Z0JBQ3JCLDhCQUE4QjtnQkFDOUIseUJBQXlCO2FBQzFCLENBQUM7WUFFRixLQUFLLE1BQU0sU0FBUyxJQUFJLHdCQUF3QixFQUFFLENBQUM7Z0JBQ2pELE1BQU0sS0FBSyxHQUF5QjtvQkFDbEMsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLElBQUksRUFBRSxTQUFTO29CQUNmLGNBQWMsRUFBRSxJQUFJO29CQUNwQixJQUFJLEVBQUUsSUFBSTtvQkFDVixPQUFPLEVBQUUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFO29CQUNwQyxpQkFBaUIsRUFBRSxFQUFFO29CQUNyQixxQkFBcUIsRUFBRSxJQUFJO29CQUMzQiwrQkFBK0IsRUFBRSxJQUFJO29CQUNyQyxlQUFlLEVBQUUsS0FBSztvQkFDdEIsY0FBYyxFQUFFLEVBQVM7b0JBQ3pCLFFBQVEsRUFBRSxFQUFFO29CQUNaLGNBQWMsRUFBRSxJQUFJO2lCQUNyQixDQUFDO2dCQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLG9CQUFvQixDQUMxQyx5Q0FBeUMsRUFDekMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FDbkIsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RCxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsU0FBUztnQkFDZixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFLEVBQUUsRUFBRSxnQkFBZ0I7Z0JBQzdCLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixjQUFjLEVBQUUsRUFBUztnQkFDekIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FDeEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLDhDQUE4QyxDQUFDLENBQ3hFLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsU0FBUztnQkFDZixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFO29CQUNQLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxZQUFZO2lCQUM5QztnQkFDRCxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsb0JBQW9CLENBQzFDLHlDQUF5QyxFQUN6QyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUNuQixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFDekMsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEdBQUcsT0FBTyxDQUFDO1lBRWhELE1BQU0sS0FBSyxHQUF5QjtnQkFDbEMsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLElBQUksRUFBRSxTQUFTO2dCQUNmLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixJQUFJLEVBQUUsSUFBSTtnQkFDVixPQUFPLEVBQUU7b0JBQ1AsWUFBWSxFQUFFLGlCQUFpQjtpQkFDaEM7Z0JBQ0QsaUJBQWlCLEVBQUUsRUFBRTtnQkFDckIscUJBQXFCLEVBQUUsSUFBSTtnQkFDM0IsK0JBQStCLEVBQUUsSUFBSTtnQkFDckMsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLGNBQWMsRUFBRSxFQUFTO2dCQUN6QixRQUFRLEVBQUUsRUFBRTtnQkFDWixjQUFjLEVBQUUsSUFBSTthQUNyQixDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGVBQU8sRUFBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFakQsc0RBQXNEO1lBQ3RELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQzVDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUMvQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDO1lBRTdDLE1BQU0sS0FBSyxHQUF5QjtnQkFDbEMsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLElBQUksRUFBRSxTQUFTO2dCQUNmLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixJQUFJLEVBQUUsSUFBSTtnQkFDVixPQUFPLEVBQUU7b0JBQ1AsWUFBWSxFQUFFLGFBQWE7aUJBQzVCO2dCQUNELGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixjQUFjLEVBQUUsRUFBUztnQkFDekIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FDeEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLENBQ2pELENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyxFQUFFLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUU7Z0JBQ3hDLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixjQUFjLEVBQUUsRUFBUztnQkFDekIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXBDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDekMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUU7Z0JBQ3hDLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixjQUFjLEVBQUUsRUFBUztnQkFDekIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FDeEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLDhDQUE4QyxDQUFDLENBQ3hFLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUU7Z0JBQ3hDLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixjQUFjLEVBQUUsRUFBUztnQkFDekIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXBDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RCxzQkFBc0I7WUFDdEIsTUFBTSxFQUFFLHNCQUFzQixFQUFFLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDcEUsc0JBQXNCLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2FBQzNFLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUU7Z0JBQ3hDLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixjQUFjLEVBQUUsRUFBUztnQkFDekIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxvQkFBb0IsQ0FDMUMseUJBQXlCLEVBQ3pCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQ2xCLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRCxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsU0FBUztnQkFDZixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFO2dCQUM1QyxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsb0JBQW9CLENBQzFDLHlDQUF5QyxFQUN6QyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUNuQixDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQUcsdUJBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNsRCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxvQkFBb0IsQ0FDMUMsaURBQWlELEVBQ2pELE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQ2xCLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQzNCLEVBQUUsQ0FBQyx5REFBeUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RSxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsU0FBUztnQkFDZixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFLEVBQUUsWUFBWSxFQUFFLHFDQUFxQyxFQUFFO2dCQUNoRSxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVwQywwQkFBMEI7WUFDMUIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLG9CQUFvQixDQUN4QyxpQkFBaUIsRUFDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FDbkIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FDeEMsOENBQThDLENBQy9DLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRCxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsU0FBUztnQkFDZixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFO2dCQUM1QyxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVwQywrQkFBK0I7WUFDL0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLG9CQUFvQixDQUMxQyx5Q0FBeUMsRUFDekMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLHFDQUFxQyxDQUFDLENBQy9ELENBQUM7WUFFRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDNUIsRUFBRSxDQUFDLHFEQUFxRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25FLE1BQU0sS0FBSyxHQUF5QjtnQkFDbEMsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLElBQUksRUFBRSxTQUFTO2dCQUNmLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixJQUFJLEVBQUUsSUFBSTtnQkFDVixPQUFPLEVBQUUsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFO2dCQUN4QyxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDN0IsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNuQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5RCxNQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixJQUFJLEVBQUUsU0FBUztnQkFDZixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsT0FBTyxFQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFO2dCQUM1QyxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQiwrQkFBK0IsRUFBRSxJQUFJO2dCQUNyQyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDN0IsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNuQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtRQUNyRCxFQUFFLENBQUMsa0RBQWtELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEUsTUFBTSxLQUFLLEdBQXlCO2dCQUNsQyxVQUFVLEVBQUUsS0FBSztnQkFDakIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxxQ0FBcUMsRUFBRTtnQkFDaEUsaUJBQWlCLEVBQUUsRUFBRTtnQkFDckIscUJBQXFCLEVBQUUsSUFBSTtnQkFDM0IsK0JBQStCLEVBQUUsSUFBSTtnQkFDckMsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLGNBQWMsRUFBRSxFQUFTO2dCQUN6QixRQUFRLEVBQUUsRUFBRTtnQkFDWixjQUFjLEVBQUUsSUFBSTthQUNyQixDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGVBQU8sRUFBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFakQsa0RBQWtEO1lBQ2xELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FDeEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLDhDQUE4QyxDQUFDLENBQ3hFLENBQUM7WUFFRiw0Q0FBNEM7WUFDNUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFcEMsd0NBQXdDO1lBQ3hDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDekMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUV6QyxrQ0FBa0M7WUFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQzVCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDdEIsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNuQyxDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBJbnRlZ3JhdGlvbiBUZXN0cyBmb3IgUXVlcnkgSGFuZGxlciBQb2xpY3kgRW5mb3JjZW1lbnRcclxuICogXHJcbiAqIFRlc3RzIHJ1bnRpbWUgcG9saWN5IGVuZm9yY2VtZW50IGluIHRoZSBRdWVyeSBIYW5kbGVyIExhbWJkYS5cclxuICogXHJcbiAqIFJlcXVpcmVtZW50cyB0ZXN0ZWQ6XHJcbiAqIC0gOS4xOiBTZXJ2aWNlIGRlY291cGxpbmcgZW5mb3JjZW1lbnRcclxuICogLSA5LjI6IE5vIGRpcmVjdCBjYWxscyBmcm9tIENvbW1hbmQgU2VydmljZVxyXG4gKiAtIDkuMzogQXVkaXQgbG9nZ2luZ1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IGhhbmRsZXIgfSBmcm9tICcuLi9pbmRleCc7XHJcbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBDb250ZXh0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcbmltcG9ydCB7IHBvbGljeUVuZm9yY2VyIH0gZnJvbSAnQG5leHVzL3NoYXJlZCc7XHJcblxyXG4vLyBNb2NrIEFXUyBTREtcclxuamVzdC5tb2NrKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcclxuamVzdC5tb2NrKCdAYXdzLXNkay9saWItZHluYW1vZGInLCAoKSA9PiAoe1xyXG4gIER5bmFtb0RCRG9jdW1lbnRDbGllbnQ6IHtcclxuICAgIGZyb206IGplc3QuZm4oKCkgPT4gKHtcclxuICAgICAgc2VuZDogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcclxuICAgICAgICBJdGVtczogW1xyXG4gICAgICAgICAgeyBvcmRlcklkOiAnb3JkZXItMScsIHN0YXR1czogJ3BsYWNlZCcgfSxcclxuICAgICAgICAgIHsgb3JkZXJJZDogJ29yZGVyLTInLCBzdGF0dXM6ICdjYW5jZWxsZWQnIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBDb3VudDogMixcclxuICAgICAgfSksXHJcbiAgICB9KSksXHJcbiAgfSxcclxuICBTY2FuQ29tbWFuZDogamVzdC5mbigpLFxyXG4gIEdldENvbW1hbmQ6IGplc3QuZm4oKSxcclxufSkpO1xyXG5cclxuLy8gU3B5IG9uIGNvbnNvbGUgbWV0aG9kc1xyXG5jb25zdCBjb25zb2xlTG9nU3B5ID0gamVzdC5zcHlPbihjb25zb2xlLCAnbG9nJykubW9ja0ltcGxlbWVudGF0aW9uKCk7XHJcbmNvbnN0IGNvbnNvbGVFcnJvclNweSA9IGplc3Quc3B5T24oY29uc29sZSwgJ2Vycm9yJykubW9ja0ltcGxlbWVudGF0aW9uKCk7XHJcblxyXG5kZXNjcmliZSgnUXVlcnkgSGFuZGxlciAtIFBvbGljeSBFbmZvcmNlbWVudCBJbnRlZ3JhdGlvbicsICgpID0+IHtcclxuICBjb25zdCBtb2NrQ29udGV4dDogQ29udGV4dCA9IHtcclxuICAgIGNhbGxiYWNrV2FpdHNGb3JFbXB0eUV2ZW50TG9vcDogZmFsc2UsXHJcbiAgICBmdW5jdGlvbk5hbWU6ICdxdWVyeS1oYW5kbGVyJyxcclxuICAgIGZ1bmN0aW9uVmVyc2lvbjogJzEnLFxyXG4gICAgaW52b2tlZEZ1bmN0aW9uQXJuOiAnYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjpxdWVyeS1oYW5kbGVyJyxcclxuICAgIG1lbW9yeUxpbWl0SW5NQjogJzI1NicsXHJcbiAgICBhd3NSZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtaWQnLFxyXG4gICAgbG9nR3JvdXBOYW1lOiAnL2F3cy9sYW1iZGEvcXVlcnktaGFuZGxlcicsXHJcbiAgICBsb2dTdHJlYW1OYW1lOiAndGVzdC1zdHJlYW0nLFxyXG4gICAgZ2V0UmVtYWluaW5nVGltZUluTWlsbGlzOiAoKSA9PiAzMDAwMCxcclxuICAgIGRvbmU6IGplc3QuZm4oKSxcclxuICAgIGZhaWw6IGplc3QuZm4oKSxcclxuICAgIHN1Y2NlZWQ6IGplc3QuZm4oKSxcclxuICB9O1xyXG5cclxuICBiZWZvcmVFYWNoKCgpID0+IHtcclxuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xyXG4gICAgY29uc29sZUxvZ1NweS5tb2NrQ2xlYXIoKTtcclxuICAgIGNvbnNvbGVFcnJvclNweS5tb2NrQ2xlYXIoKTtcclxuICAgIHBvbGljeUVuZm9yY2VyLmNsZWFyVmlvbGF0aW9ucygpO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICBwcm9jZXNzLmVudi5PUkRFUlNfVEFCTEUgPSAndGVzdC1vcmRlcnMtdGFibGUnO1xyXG4gICAgcHJvY2Vzcy5lbnYuRVZFTlRTX1RBQkxFID0gJ3Rlc3QtZXZlbnRzLXRhYmxlJztcclxuICAgIHByb2Nlc3MuZW52LkVOQUJMRV9QT0xJQ1lfRU5GT1JDRU1FTlQgPSAndHJ1ZSc7XHJcbiAgfSk7XHJcblxyXG4gIGFmdGVyRWFjaCgoKSA9PiB7XHJcbiAgICBkZWxldGUgcHJvY2Vzcy5lbnYuT1JERVJTX1RBQkxFO1xyXG4gICAgZGVsZXRlIHByb2Nlc3MuZW52LkVWRU5UU19UQUJMRTtcclxuICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5FTkFCTEVfUE9MSUNZX0VORk9SQ0VNRU5UO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnU2VydmljZSBEZWNvdXBsaW5nIFBvbGljeScsICgpID0+IHtcclxuICAgIGl0KCdzaG91bGQgYWxsb3cgcXVlcmllcyBmcm9tIGV4dGVybmFsIHNvdXJjZXMgKGJyb3dzZXJzKScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIHBhdGg6ICcvb3JkZXJzJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdVc2VyLUFnZW50JzogJ01vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNicsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFIFNlcnZpY2UgY2FsbCB2YWxpZGF0ZWQnKVxyXG4gICAgICApO1xyXG4gICAgICBleHBlY3QocG9saWN5RW5mb3JjZXIuZ2V0VmlvbGF0aW9ucygpKS50b0hhdmVMZW5ndGgoMCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGFsbG93IHF1ZXJpZXMgZnJvbSBtb2JpbGUgYXBwcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIHBhdGg6ICcvb3JkZXJzJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdVc2VyLUFnZW50JzogJ015QXBwLzEuMCAoaU9TIDE1LjApJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnW1BvbGljeUVuZm9yY2VtZW50XSDinIUgU2VydmljZSBjYWxsIHZhbGlkYXRlZCcpXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGJsb2NrIGRpcmVjdCBjYWxscyBmcm9tIENvbW1hbmQgU2VydmljZScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIHBhdGg6ICcvb3JkZXJzJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdVc2VyLUFnZW50JzogJ2NvbW1hbmQtc2VydmljZS8xLjAnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAzKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UocmVzdWx0LmJvZHkpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5LmVycm9yKS50b0JlKCdQb2xpY3kgVmlvbGF0aW9uJyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkubWVzc2FnZSkudG9Db250YWluKCdEaXJlY3Qgc2VydmljZSBjYWxscyBhcmUgcHJvaGliaXRlZCcpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5LmRldGFpbHMpLnRvQ29udGFpbignRGlyZWN0IGNhbGxzIGZyb20gQ29tbWFuZCBTZXJ2aWNlIHRvIFF1ZXJ5IERhc2hib2FyZCBhcmUgcHJvaGliaXRlZCcpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5LnRpbWVzdGFtcCkudG9CZURlZmluZWQoKTtcclxuXHJcbiAgICAgIGV4cGVjdChjb25zb2xlRXJyb3JTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIOKdjCBQb2xpY3kgdmlvbGF0aW9uOicsXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ0RpcmVjdCBzZXJ2aWNlIGNhbGxzIGFyZSBwcm9oaWJpdGVkJylcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZGV0ZWN0IGNvbW1hbmQtc2VydmljZSBpbiB2YXJpb3VzIFVzZXItQWdlbnQgZm9ybWF0cycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgY29tbWFuZFNlcnZpY2VVc2VyQWdlbnRzID0gW1xyXG4gICAgICAgICdjb21tYW5kLXNlcnZpY2UnLFxyXG4gICAgICAgICdjb21tYW5kLXNlcnZpY2UvMS4wJyxcclxuICAgICAgICAnTXlBcHAgY29tbWFuZC1zZXJ2aWNlIENsaWVudCcsXHJcbiAgICAgICAgJ0FXUy1TREsgY29tbWFuZC1zZXJ2aWNlJyxcclxuICAgICAgXTtcclxuXHJcbiAgICAgIGZvciAoY29uc3QgdXNlckFnZW50IG9mIGNvbW1hbmRTZXJ2aWNlVXNlckFnZW50cykge1xyXG4gICAgICAgIGNvbnN0IGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCA9IHtcclxuICAgICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgICAgcGF0aFBhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6IHVzZXJBZ2VudCB9LFxyXG4gICAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAzKTtcclxuICAgICAgICBleHBlY3QoY29uc29sZUVycm9yU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIOKdjCBQb2xpY3kgdmlvbGF0aW9uOicsXHJcbiAgICAgICAgICBleHBlY3QuYW55KFN0cmluZylcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBtaXNzaW5nIFVzZXItQWdlbnQgaGVhZGVyJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczoge30sIC8vIE5vIFVzZXItQWdlbnRcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFIFNlcnZpY2UgY2FsbCB2YWxpZGF0ZWQnKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY2FzZS1pbnNlbnNpdGl2ZSBVc2VyLUFnZW50IGhlYWRlcicsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIHBhdGg6ICcvb3JkZXJzJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICd1c2VyLWFnZW50JzogJ2NvbW1hbmQtc2VydmljZScsIC8vIGxvd2VyY2FzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAzKTtcclxuICAgICAgZXhwZWN0KGNvbnNvbGVFcnJvclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgJ1tQb2xpY3lFbmZvcmNlbWVudF0g4p2MIFBvbGljeSB2aW9sYXRpb246JyxcclxuICAgICAgICBleHBlY3QuYW55KFN0cmluZylcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnRW52aXJvbm1lbnQtYmFzZWQgQ29udHJvbCcsICgpID0+IHtcclxuICAgIGl0KCdzaG91bGQgc2tpcCBwb2xpY3kgZW5mb3JjZW1lbnQgd2hlbiBkaXNhYmxlZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgcHJvY2Vzcy5lbnYuRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVCA9ICdmYWxzZSc7XHJcblxyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ1VzZXItQWdlbnQnOiAnY29tbWFuZC1zZXJ2aWNlJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgLy8gU2hvdWxkIHN1Y2NlZWQgZXZlbiB3aXRoIGNvbW1hbmQtc2VydmljZSBVc2VyLUFnZW50XHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkubm90LnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgIGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCdbUG9saWN5RW5mb3JjZW1lbnRdJylcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZW5hYmxlIHBvbGljeSBlbmZvcmNlbWVudCBieSBkZWZhdWx0JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBkZWxldGUgcHJvY2Vzcy5lbnYuRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVDtcclxuXHJcbiAgICAgIGNvbnN0IGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCA9IHtcclxuICAgICAgICBodHRwTWV0aG9kOiAnR0VUJyxcclxuICAgICAgICBwYXRoOiAnL29yZGVycycsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgYm9keTogbnVsbCxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCcsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFJylcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnUXVlcnkgUGF0aCBIYW5kbGluZycsICgpID0+IHtcclxuICAgIGl0KCdzaG91bGQgaGFuZGxlIC9vcmRlcnMgcGF0aCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIHBhdGg6ICcvb3JkZXJzJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAnIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoMjAwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UocmVzdWx0LmJvZHkpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5Lml0ZW1zKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5LnRvdGFsKS50b0JlKDIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgL2V2ZW50cyBwYXRoJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9ldmVudHMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCcgfSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFIFNlcnZpY2UgY2FsbCB2YWxpZGF0ZWQnKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52YWxpZCBxdWVyeSBwYXRoJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9pbnZhbGlkJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAnIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UocmVzdWx0LmJvZHkpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5LmVycm9yKS50b0JlKCdJbnZhbGlkIHF1ZXJ5Jyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0Vycm9yIEhhbmRsaW5nJywgKCkgPT4ge1xyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZ2VuZXJhbCBlcnJvcnMgZ3JhY2VmdWxseScsIGFzeW5jICgpID0+IHtcclxuICAgICAgLy8gTW9jayBEeW5hbW9EQiBlcnJvclxyXG4gICAgICBjb25zdCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYicpO1xyXG4gICAgICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20gPSBqZXN0LmZuKCgpID0+ICh7XHJcbiAgICAgICAgc2VuZDogamVzdC5mbigpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignRHluYW1vREIgY29ubmVjdGlvbiBmYWlsZWQnKSksXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIGNvbnN0IGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCA9IHtcclxuICAgICAgICBodHRwTWV0aG9kOiAnR0VUJyxcclxuICAgICAgICBwYXRoOiAnL29yZGVycycsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgYm9keTogbnVsbCxcclxuICAgICAgICBoZWFkZXJzOiB7ICdVc2VyLUFnZW50JzogJ01vemlsbGEvNS4wJyB9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDUwMCk7XHJcbiAgICAgIGV4cGVjdChjb25zb2xlRXJyb3JTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdFcnJvciBwcm9jZXNzaW5nIHF1ZXJ5OicsXHJcbiAgICAgICAgZXhwZWN0LmFueShFcnJvcilcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgbG9nIHBvbGljeSB2aW9sYXRpb25zIG9uIGVycm9yJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdjb21tYW5kLXNlcnZpY2UnIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAzKTtcclxuICAgICAgZXhwZWN0KGNvbnNvbGVFcnJvclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgJ1tQb2xpY3lFbmZvcmNlbWVudF0g4p2MIFBvbGljeSB2aW9sYXRpb246JyxcclxuICAgICAgICBleHBlY3QuYW55KFN0cmluZylcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IHZpb2xhdGlvbnMgPSBwb2xpY3lFbmZvcmNlci5nZXRWaW9sYXRpb25zKCk7XHJcbiAgICAgIGlmICh2aW9sYXRpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBleHBlY3QoY29uc29sZUVycm9yU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIFBvbGljeSB2aW9sYXRpb25zIGRldGVjdGVkOicsXHJcbiAgICAgICAgICBleHBlY3QuYW55KEFycmF5KVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnQXVkaXQgVHJhaWwnLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBjb21wbGV0ZSBhdWRpdCB0cmFpbCBmb3Igc3VjY2Vzc2Z1bCBxdWVyeScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIHBhdGg6ICcvb3JkZXJzJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBib2R5OiBudWxsLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKGNvbXBhdGlibGU7IE15QXBwLzEuMCknIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoMjAwKTtcclxuXHJcbiAgICAgIC8vIFZlcmlmeSBhdWRpdCB0cmFpbCBsb2dzXHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAnUXVlcnkgcmVjZWl2ZWQ6JyxcclxuICAgICAgICBleHBlY3QuYW55KFN0cmluZylcclxuICAgICAgKTtcclxuICAgICAgZXhwZWN0KGNvbnNvbGVMb2dTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIOKchSBTZXJ2aWNlIGNhbGwgdmFsaWRhdGVkJ1xyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYXVkaXQgdHJhaWwgZm9yIHBvbGljeSB2aW9sYXRpb25zJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdjb21tYW5kLXNlcnZpY2UnIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAzKTtcclxuXHJcbiAgICAgIC8vIFZlcmlmeSB2aW9sYXRpb24gYXVkaXQgdHJhaWxcclxuICAgICAgZXhwZWN0KGNvbnNvbGVFcnJvclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgJ1tQb2xpY3lFbmZvcmNlbWVudF0g4p2MIFBvbGljeSB2aW9sYXRpb246JyxcclxuICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnRGlyZWN0IHNlcnZpY2UgY2FsbHMgYXJlIHByb2hpYml0ZWQnKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2VCb2R5ID0gSlNPTi5wYXJzZShyZXN1bHQuYm9keSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkudGltZXN0YW1wKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QobmV3IERhdGUocmVzcG9uc2VCb2R5LnRpbWVzdGFtcCkuZ2V0VGltZSgpKS50b0JlTGVzc1RoYW5PckVxdWFsKERhdGUubm93KCkpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdDT1JTIEhlYWRlcnMnLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgQ09SUyBoZWFkZXJzIGluIHN1Y2Nlc3NmdWwgcmVzcG9uc2VzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCcgfSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuaGVhZGVycykudG9FcXVhbCh7XHJcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBDT1JTIGhlYWRlcnMgaW4gZXJyb3IgcmVzcG9uc2VzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdjb21tYW5kLXNlcnZpY2UnIH0sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LmhlYWRlcnMpLnRvRXF1YWwoe1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0ludGVncmF0aW9uIHdpdGggRXhpc3RpbmcgUXVlcnkgTG9naWMnLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIG5vdCBpbnRlcmZlcmUgd2l0aCB2YWxpZCBxdWVyeSBwcm9jZXNzaW5nJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgcGF0aDogJy9vcmRlcnMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IG51bGwsXHJcbiAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoY29tcGF0aWJsZTsgTXlBcHAvMS4wKScgfSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIC8vIFBvbGljeSBlbmZvcmNlbWVudCBzaG91bGQgY29tcGxldGUgc3VjY2Vzc2Z1bGx5XHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnW1BvbGljeUVuZm9yY2VtZW50XSDinIUgU2VydmljZSBjYWxsIHZhbGlkYXRlZCcpXHJcbiAgICAgICk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBTaG91bGQgcHJvY2VlZCB0byBub3JtYWwgcXVlcnkgcHJvY2Vzc2luZ1xyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoMjAwKTtcclxuICAgICAgXHJcbiAgICAgIC8vIFNob3VsZCBoYXZlIHByb3BlciByZXNwb25zZSBzdHJ1Y3R1cmVcclxuICAgICAgY29uc3QgcmVzcG9uc2VCb2R5ID0gSlNPTi5wYXJzZShyZXN1bHQuYm9keSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkuaXRlbXMpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkudG90YWwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBTaG91bGQgaGF2ZSBwcm9wZXIgQ09SUyBoZWFkZXJzXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuaGVhZGVycykudG9FcXVhbChcclxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pO1xyXG4iXX0=