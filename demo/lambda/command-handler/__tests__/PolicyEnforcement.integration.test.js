"use strict";
/**
 * Integration Tests for Command Handler Policy Enforcement
 *
 * Tests runtime policy enforcement in the Command Handler Lambda.
 *
 * Requirements tested:
 * - 9.1: Service decoupling enforcement
 * - 9.2: Event Store immutability
 * - 9.3: Schema validation
 * - 9.4: Audit logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const shared_1 = require("@nexus/shared");
// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn(() => ({
            send: jest.fn().mockResolvedValue({}),
        })),
    },
    PutCommand: jest.fn(),
    QueryCommand: jest.fn(),
}));
// Mock UUID
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234'),
}));
// Spy on console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
describe('Command Handler - Policy Enforcement Integration', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'command-handler',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:command-handler',
        memoryLimitInMB: '256',
        awsRequestId: 'test-request-id',
        logGroupName: '/aws/lambda/command-handler',
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
        process.env.EVENTS_TABLE = 'test-events-table';
        process.env.ENABLE_POLICY_ENFORCEMENT = 'true';
    });
    afterEach(() => {
        delete process.env.EVENTS_TABLE;
        delete process.env.ENABLE_POLICY_ENFORCEMENT;
    });
    describe('Database Operation Policy', () => {
        it('should allow INSERT operations on EventStore', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/OrderPlaced',
                pathParameters: { commandType: 'OrderPlaced' },
                body: JSON.stringify({
                    aggregateId: 'order-123',
                    customerId: 'customer-456',
                    items: [{ productId: 'prod-1', quantity: 2 }],
                }),
                headers: {},
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(202);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Database operation validated'));
            expect(shared_1.policyEnforcer.getViolations()).toHaveLength(0);
        });
        it('should log successful command processing', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/OrderPlaced',
                pathParameters: { commandType: 'OrderPlaced' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(202);
            expect(consoleLogSpy).toHaveBeenCalledWith('[PolicyEnforcement] ✅ Command processed successfully', expect.objectContaining({
                commandType: 'OrderPlaced',
                aggregateId: expect.any(String),
                eventId: expect.any(String),
                timestamp: expect.any(String),
            }));
        });
    });
    describe('Event Publishing Policy', () => {
        it('should allow publishing events with registered schemas', async () => {
            const knownEventTypes = ['OrderPlaced', 'OrderCancelled', 'PaymentProcessed'];
            for (const eventType of knownEventTypes) {
                const event = {
                    httpMethod: 'POST',
                    path: `/commands/${eventType}`,
                    pathParameters: { commandType: eventType },
                    body: JSON.stringify({ aggregateId: 'test-123' }),
                    headers: {},
                    multiValueHeaders: {},
                    queryStringParameters: null,
                    multiValueQueryStringParameters: null,
                    isBase64Encoded: false,
                    requestContext: {},
                    resource: '',
                    stageVariables: null,
                };
                const result = await (0, index_1.handler)(event, mockContext);
                expect(result.statusCode).toBe(202);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅ Event publish validated'));
            }
        });
        it('should reject events without registered schemas', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/UnknownEvent',
                pathParameters: { commandType: 'UnknownEvent' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
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
            expect(responseBody.message).toContain('Event UnknownEvent has no registered schema');
            expect(responseBody.details).toContain("Event type 'UnknownEvent' has no registered schema");
            expect(responseBody.timestamp).toBeDefined();
            expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.stringContaining('Event UnknownEvent has no registered schema'));
        });
    });
    describe('Environment-based Control', () => {
        it('should skip policy enforcement when disabled', async () => {
            process.env.ENABLE_POLICY_ENFORCEMENT = 'false';
            const event = {
                httpMethod: 'POST',
                path: '/commands/UnknownEvent',
                pathParameters: { commandType: 'UnknownEvent' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            // Should succeed even with unregistered event type
            expect(result.statusCode).toBe(202);
            expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement]'));
        });
        it('should enable policy enforcement by default', async () => {
            delete process.env.ENABLE_POLICY_ENFORCEMENT;
            const event = {
                httpMethod: 'POST',
                path: '/commands/OrderPlaced',
                pathParameters: { commandType: 'OrderPlaced' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(202);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PolicyEnforcement] ✅'));
        });
    });
    describe('Error Handling', () => {
        it('should handle missing command type', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands',
                pathParameters: null,
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
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
            expect(responseBody.error).toBe('Command type is required');
        });
        it('should handle malformed JSON', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/OrderPlaced',
                pathParameters: { commandType: 'OrderPlaced' },
                body: 'invalid json{',
                headers: {},
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
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing command:', expect.any(Error));
        });
        it('should log policy violations on error', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/UnknownEvent',
                pathParameters: { commandType: 'UnknownEvent' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
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
    describe('Audit Trail', () => {
        it('should create complete audit trail for successful command', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/OrderPlaced',
                pathParameters: { commandType: 'OrderPlaced' },
                body: JSON.stringify({
                    aggregateId: 'order-123',
                    customerId: 'customer-456',
                }),
                headers: {},
                multiValueHeaders: {},
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                isBase64Encoded: false,
                requestContext: {},
                resource: '',
                stageVariables: null,
            };
            const result = await (0, index_1.handler)(event, mockContext);
            expect(result.statusCode).toBe(202);
            // Verify audit trail logs
            expect(consoleLogSpy).toHaveBeenCalledWith('Command received:', expect.any(String));
            expect(consoleLogSpy).toHaveBeenCalledWith('[PolicyEnforcement] ✅ Database operation validated');
            expect(consoleLogSpy).toHaveBeenCalledWith('[PolicyEnforcement] ✅ Event publish validated');
            expect(consoleLogSpy).toHaveBeenCalledWith('Event stored:', expect.any(String));
            expect(consoleLogSpy).toHaveBeenCalledWith('[PolicyEnforcement] ✅ Command processed successfully', expect.objectContaining({
                commandType: 'OrderPlaced',
                aggregateId: 'order-123',
            }));
        });
        it('should create audit trail for policy violations', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/UnknownEvent',
                pathParameters: { commandType: 'UnknownEvent' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
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
            expect(consoleErrorSpy).toHaveBeenCalledWith('[PolicyEnforcement] ❌ Policy violation:', expect.stringContaining('Event UnknownEvent has no registered schema'));
            const responseBody = JSON.parse(result.body);
            expect(responseBody.timestamp).toBeDefined();
            expect(new Date(responseBody.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
        });
    });
    describe('CORS Headers', () => {
        it('should include CORS headers in successful responses', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/commands/OrderPlaced',
                pathParameters: { commandType: 'OrderPlaced' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
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
                httpMethod: 'POST',
                path: '/commands/UnknownEvent',
                pathParameters: { commandType: 'UnknownEvent' },
                body: JSON.stringify({ aggregateId: 'order-123' }),
                headers: {},
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUG9saWN5RW5mb3JjZW1lbnQuaW50ZWdyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlBvbGljeUVuZm9yY2VtZW50LmludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7O0dBVUc7O0FBRUgsb0NBQW1DO0FBRW5DLDBDQUErQztBQUUvQyxlQUFlO0FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUN4QyxzQkFBc0IsRUFBRTtRQUN0QixJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1NBQ3RDLENBQUMsQ0FBQztLQUNKO0lBQ0QsVUFBVSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7SUFDckIsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7Q0FDeEIsQ0FBQyxDQUFDLENBQUM7QUFFSixZQUFZO0FBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUN2QixFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztDQUNwQyxDQUFDLENBQUMsQ0FBQztBQUVKLHlCQUF5QjtBQUN6QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQ3RFLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFFMUUsUUFBUSxDQUFD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QkFDdEIsY0FBYyxFQUFFLEVBQVM7Z0JBQ3pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBTyxFQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVqRCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDN0IsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNuQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogSW50ZWdyYXRpb24gVGVzdHMgZm9yIENvbW1hbmQgSGFuZGxlciBQb2xpY3kgRW5mb3JjZW1lbnRcclxuICogXHJcbiAqIFRlc3RzIHJ1bnRpbWUgcG9saWN5IGVuZm9yY2VtZW50IGluIHRoZSBDb21tYW5kIEhhbmRsZXIgTGFtYmRhLlxyXG4gKiBcclxuICogUmVxdWlyZW1lbnRzIHRlc3RlZDpcclxuICogLSA5LjE6IFNlcnZpY2UgZGVjb3VwbGluZyBlbmZvcmNlbWVudFxyXG4gKiAtIDkuMjogRXZlbnQgU3RvcmUgaW1tdXRhYmlsaXR5XHJcbiAqIC0gOS4zOiBTY2hlbWEgdmFsaWRhdGlvblxyXG4gKiAtIDkuNDogQXVkaXQgbG9nZ2luZ1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IGhhbmRsZXIgfSBmcm9tICcuLi9pbmRleCc7XHJcbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBDb250ZXh0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcbmltcG9ydCB7IHBvbGljeUVuZm9yY2VyIH0gZnJvbSAnQG5leHVzL3NoYXJlZCc7XHJcblxyXG4vLyBNb2NrIEFXUyBTREtcclxuamVzdC5tb2NrKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcclxuamVzdC5tb2NrKCdAYXdzLXNkay9saWItZHluYW1vZGInLCAoKSA9PiAoe1xyXG4gIER5bmFtb0RCRG9jdW1lbnRDbGllbnQ6IHtcclxuICAgIGZyb206IGplc3QuZm4oKCkgPT4gKHtcclxuICAgICAgc2VuZDogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHt9KSxcclxuICAgIH0pKSxcclxuICB9LFxyXG4gIFB1dENvbW1hbmQ6IGplc3QuZm4oKSxcclxuICBRdWVyeUNvbW1hbmQ6IGplc3QuZm4oKSxcclxufSkpO1xyXG5cclxuLy8gTW9jayBVVUlEXHJcbmplc3QubW9jaygndXVpZCcsICgpID0+ICh7XHJcbiAgdjQ6IGplc3QuZm4oKCkgPT4gJ3Rlc3QtdXVpZC0xMjM0JyksXHJcbn0pKTtcclxuXHJcbi8vIFNweSBvbiBjb25zb2xlIG1ldGhvZHNcclxuY29uc3QgY29uc29sZUxvZ1NweSA9IGplc3Quc3B5T24oY29uc29sZSwgJ2xvZycpLm1vY2tJbXBsZW1lbnRhdGlvbigpO1xyXG5jb25zdCBjb25zb2xlRXJyb3JTcHkgPSBqZXN0LnNweU9uKGNvbnNvbGUsICdlcnJvcicpLm1vY2tJbXBsZW1lbnRhdGlvbigpO1xyXG5cclxuZGVzY3JpYmUoJ0NvbW1hbmQgSGFuZGxlciAtIFBvbGljeSBFbmZvcmNlbWVudCBJbnRlZ3JhdGlvbicsICgpID0+IHtcclxuICBjb25zdCBtb2NrQ29udGV4dDogQ29udGV4dCA9IHtcclxuICAgIGNhbGxiYWNrV2FpdHNGb3JFbXB0eUV2ZW50TG9vcDogZmFsc2UsXHJcbiAgICBmdW5jdGlvbk5hbWU6ICdjb21tYW5kLWhhbmRsZXInLFxyXG4gICAgZnVuY3Rpb25WZXJzaW9uOiAnMScsXHJcbiAgICBpbnZva2VkRnVuY3Rpb25Bcm46ICdhcm46YXdzOmxhbWJkYTp1cy1lYXN0LTE6MTIzNDU2Nzg5MDEyOmZ1bmN0aW9uOmNvbW1hbmQtaGFuZGxlcicsXHJcbiAgICBtZW1vcnlMaW1pdEluTUI6ICcyNTYnLFxyXG4gICAgYXdzUmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LWlkJyxcclxuICAgIGxvZ0dyb3VwTmFtZTogJy9hd3MvbGFtYmRhL2NvbW1hbmQtaGFuZGxlcicsXHJcbiAgICBsb2dTdHJlYW1OYW1lOiAndGVzdC1zdHJlYW0nLFxyXG4gICAgZ2V0UmVtYWluaW5nVGltZUluTWlsbGlzOiAoKSA9PiAzMDAwMCxcclxuICAgIGRvbmU6IGplc3QuZm4oKSxcclxuICAgIGZhaWw6IGplc3QuZm4oKSxcclxuICAgIHN1Y2NlZWQ6IGplc3QuZm4oKSxcclxuICB9O1xyXG5cclxuICBiZWZvcmVFYWNoKCgpID0+IHtcclxuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xyXG4gICAgY29uc29sZUxvZ1NweS5tb2NrQ2xlYXIoKTtcclxuICAgIGNvbnNvbGVFcnJvclNweS5tb2NrQ2xlYXIoKTtcclxuICAgIHBvbGljeUVuZm9yY2VyLmNsZWFyVmlvbGF0aW9ucygpO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICBwcm9jZXNzLmVudi5FVkVOVFNfVEFCTEUgPSAndGVzdC1ldmVudHMtdGFibGUnO1xyXG4gICAgcHJvY2Vzcy5lbnYuRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVCA9ICd0cnVlJztcclxuICB9KTtcclxuXHJcbiAgYWZ0ZXJFYWNoKCgpID0+IHtcclxuICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5FVkVOVFNfVEFCTEU7XHJcbiAgICBkZWxldGUgcHJvY2Vzcy5lbnYuRU5BQkxFX1BPTElDWV9FTkZPUkNFTUVOVDtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0RhdGFiYXNlIE9wZXJhdGlvbiBQb2xpY3knLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIGFsbG93IElOU0VSVCBvcGVyYXRpb25zIG9uIEV2ZW50U3RvcmUnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCA9IHtcclxuICAgICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgcGF0aDogJy9jb21tYW5kcy9PcmRlclBsYWNlZCcsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgY29tbWFuZFR5cGU6ICdPcmRlclBsYWNlZCcgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBhZ2dyZWdhdGVJZDogJ29yZGVyLTEyMycsXHJcbiAgICAgICAgICBjdXN0b21lcklkOiAnY3VzdG9tZXItNDU2JyxcclxuICAgICAgICAgIGl0ZW1zOiBbeyBwcm9kdWN0SWQ6ICdwcm9kLTEnLCBxdWFudGl0eTogMiB9XSxcclxuICAgICAgICB9KSxcclxuICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDIpO1xyXG4gICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ1tQb2xpY3lFbmZvcmNlbWVudF0g4pyFIERhdGFiYXNlIG9wZXJhdGlvbiB2YWxpZGF0ZWQnKVxyXG4gICAgICApO1xyXG4gICAgICBleHBlY3QocG9saWN5RW5mb3JjZXIuZ2V0VmlvbGF0aW9ucygpKS50b0hhdmVMZW5ndGgoMCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGxvZyBzdWNjZXNzZnVsIGNvbW1hbmQgcHJvY2Vzc2luZycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBwYXRoOiAnL2NvbW1hbmRzL09yZGVyUGxhY2VkJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogeyBjb21tYW5kVHlwZTogJ09yZGVyUGxhY2VkJyB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWdncmVnYXRlSWQ6ICdvcmRlci0xMjMnIH0pLFxyXG4gICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMik7XHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAnW1BvbGljeUVuZm9yY2VtZW50XSDinIUgQ29tbWFuZCBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XHJcbiAgICAgICAgICBjb21tYW5kVHlwZTogJ09yZGVyUGxhY2VkJyxcclxuICAgICAgICAgIGFnZ3JlZ2F0ZUlkOiBleHBlY3QuYW55KFN0cmluZyksXHJcbiAgICAgICAgICBldmVudElkOiBleHBlY3QuYW55KFN0cmluZyksXHJcbiAgICAgICAgICB0aW1lc3RhbXA6IGV4cGVjdC5hbnkoU3RyaW5nKSxcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdFdmVudCBQdWJsaXNoaW5nIFBvbGljeScsICgpID0+IHtcclxuICAgIGl0KCdzaG91bGQgYWxsb3cgcHVibGlzaGluZyBldmVudHMgd2l0aCByZWdpc3RlcmVkIHNjaGVtYXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGtub3duRXZlbnRUeXBlcyA9IFsnT3JkZXJQbGFjZWQnLCAnT3JkZXJDYW5jZWxsZWQnLCAnUGF5bWVudFByb2Nlc3NlZCddO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBldmVudFR5cGUgb2Yga25vd25FdmVudFR5cGVzKSB7XHJcbiAgICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgICAgaHR0cE1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgcGF0aDogYC9jb21tYW5kcy8ke2V2ZW50VHlwZX1gLFxyXG4gICAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgY29tbWFuZFR5cGU6IGV2ZW50VHlwZSB9LFxyXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZ2dyZWdhdGVJZDogJ3Rlc3QtMTIzJyB9KSxcclxuICAgICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoMjAyKTtcclxuICAgICAgICBleHBlY3QoY29uc29sZUxvZ1NweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnW1BvbGljeUVuZm9yY2VtZW50XSDinIUgRXZlbnQgcHVibGlzaCB2YWxpZGF0ZWQnKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcmVqZWN0IGV2ZW50cyB3aXRob3V0IHJlZ2lzdGVyZWQgc2NoZW1hcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBwYXRoOiAnL2NvbW1hbmRzL1Vua25vd25FdmVudCcsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgY29tbWFuZFR5cGU6ICdVbmtub3duRXZlbnQnIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZ2dyZWdhdGVJZDogJ29yZGVyLTEyMycgfSksXHJcbiAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNDAzKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UocmVzdWx0LmJvZHkpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2VCb2R5LmVycm9yKS50b0JlKCdQb2xpY3kgVmlvbGF0aW9uJyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkubWVzc2FnZSkudG9Db250YWluKCdFdmVudCBVbmtub3duRXZlbnQgaGFzIG5vIHJlZ2lzdGVyZWQgc2NoZW1hJyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkuZGV0YWlscykudG9Db250YWluKFwiRXZlbnQgdHlwZSAnVW5rbm93bkV2ZW50JyBoYXMgbm8gcmVnaXN0ZXJlZCBzY2hlbWFcIik7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkudGltZXN0YW1wKS50b0JlRGVmaW5lZCgpO1xyXG5cclxuICAgICAgZXhwZWN0KGNvbnNvbGVFcnJvclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgJ1tQb2xpY3lFbmZvcmNlbWVudF0g4p2MIFBvbGljeSB2aW9sYXRpb246JyxcclxuICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnRXZlbnQgVW5rbm93bkV2ZW50IGhhcyBubyByZWdpc3RlcmVkIHNjaGVtYScpXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0Vudmlyb25tZW50LWJhc2VkIENvbnRyb2wnLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIHNraXAgcG9saWN5IGVuZm9yY2VtZW50IHdoZW4gZGlzYWJsZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIHByb2Nlc3MuZW52LkVOQUJMRV9QT0xJQ1lfRU5GT1JDRU1FTlQgPSAnZmFsc2UnO1xyXG5cclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBwYXRoOiAnL2NvbW1hbmRzL1Vua25vd25FdmVudCcsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgY29tbWFuZFR5cGU6ICdVbmtub3duRXZlbnQnIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZ2dyZWdhdGVJZDogJ29yZGVyLTEyMycgfSksXHJcbiAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICAvLyBTaG91bGQgc3VjY2VlZCBldmVuIHdpdGggdW5yZWdpc3RlcmVkIGV2ZW50IHR5cGVcclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMik7XHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS5ub3QudG9IYXZlQmVlbkNhbGxlZFdpdGgoXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ1tQb2xpY3lFbmZvcmNlbWVudF0nKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBlbmFibGUgcG9saWN5IGVuZm9yY2VtZW50IGJ5IGRlZmF1bHQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5FTkFCTEVfUE9MSUNZX0VORk9SQ0VNRU5UO1xyXG5cclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBwYXRoOiAnL2NvbW1hbmRzL09yZGVyUGxhY2VkJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogeyBjb21tYW5kVHlwZTogJ09yZGVyUGxhY2VkJyB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWdncmVnYXRlSWQ6ICdvcmRlci0xMjMnIH0pLFxyXG4gICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMik7XHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnW1BvbGljeUVuZm9yY2VtZW50XSDinIUnKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdFcnJvciBIYW5kbGluZycsICgpID0+IHtcclxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG1pc3NpbmcgY29tbWFuZCB0eXBlJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgIHBhdGg6ICcvY29tbWFuZHMnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWdncmVnYXRlSWQ6ICdvcmRlci0xMjMnIH0pLFxyXG4gICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDQwMCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCByZXNwb25zZUJvZHkgPSBKU09OLnBhcnNlKHJlc3VsdC5ib2R5KTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlQm9keS5lcnJvcikudG9CZSgnQ29tbWFuZCB0eXBlIGlzIHJlcXVpcmVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBtYWxmb3JtZWQgSlNPTicsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBwYXRoOiAnL2NvbW1hbmRzL09yZGVyUGxhY2VkJyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogeyBjb21tYW5kVHlwZTogJ09yZGVyUGxhY2VkJyB9LFxyXG4gICAgICAgIGJvZHk6ICdpbnZhbGlkIGpzb257JyxcclxuICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSg1MDApO1xyXG4gICAgICBleHBlY3QoY29uc29sZUVycm9yU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAnRXJyb3IgcHJvY2Vzc2luZyBjb21tYW5kOicsXHJcbiAgICAgICAgZXhwZWN0LmFueShFcnJvcilcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgbG9nIHBvbGljeSB2aW9sYXRpb25zIG9uIGVycm9yJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgIHBhdGg6ICcvY29tbWFuZHMvVW5rbm93bkV2ZW50JyxcclxuICAgICAgICBwYXRoUGFyYW1ldGVyczogeyBjb21tYW5kVHlwZTogJ1Vua25vd25FdmVudCcgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFnZ3JlZ2F0ZUlkOiAnb3JkZXItMTIzJyB9KSxcclxuICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSg0MDMpO1xyXG4gICAgICBleHBlY3QoY29uc29sZUVycm9yU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAnW1BvbGljeUVuZm9yY2VtZW50XSDinYwgUG9saWN5IHZpb2xhdGlvbjonLFxyXG4gICAgICAgIGV4cGVjdC5hbnkoU3RyaW5nKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdBdWRpdCBUcmFpbCcsICgpID0+IHtcclxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGNvbXBsZXRlIGF1ZGl0IHRyYWlsIGZvciBzdWNjZXNzZnVsIGNvbW1hbmQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCA9IHtcclxuICAgICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgcGF0aDogJy9jb21tYW5kcy9PcmRlclBsYWNlZCcsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgY29tbWFuZFR5cGU6ICdPcmRlclBsYWNlZCcgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBhZ2dyZWdhdGVJZDogJ29yZGVyLTEyMycsXHJcbiAgICAgICAgICBjdXN0b21lcklkOiAnY3VzdG9tZXItNDU2JyxcclxuICAgICAgICB9KSxcclxuICAgICAgICBoZWFkZXJzOiB7fSxcclxuICAgICAgICBtdWx0aVZhbHVlSGVhZGVyczoge30sXHJcbiAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgaXNCYXNlNjRFbmNvZGVkOiBmYWxzZSxcclxuICAgICAgICByZXF1ZXN0Q29udGV4dDoge30gYXMgYW55LFxyXG4gICAgICAgIHJlc291cmNlOiAnJyxcclxuICAgICAgICBzdGFnZVZhcmlhYmxlczogbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQsIG1vY2tDb250ZXh0KTtcclxuXHJcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDIpO1xyXG5cclxuICAgICAgLy8gVmVyaWZ5IGF1ZGl0IHRyYWlsIGxvZ3NcclxuICAgICAgZXhwZWN0KGNvbnNvbGVMb2dTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdDb21tYW5kIHJlY2VpdmVkOicsXHJcbiAgICAgICAgZXhwZWN0LmFueShTdHJpbmcpXHJcbiAgICAgICk7XHJcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcclxuICAgICAgICAnW1BvbGljeUVuZm9yY2VtZW50XSDinIUgRGF0YWJhc2Ugb3BlcmF0aW9uIHZhbGlkYXRlZCdcclxuICAgICAgKTtcclxuICAgICAgZXhwZWN0KGNvbnNvbGVMb2dTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIOKchSBFdmVudCBwdWJsaXNoIHZhbGlkYXRlZCdcclxuICAgICAgKTtcclxuICAgICAgZXhwZWN0KGNvbnNvbGVMb2dTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdFdmVudCBzdG9yZWQ6JyxcclxuICAgICAgICBleHBlY3QuYW55KFN0cmluZylcclxuICAgICAgKTtcclxuICAgICAgZXhwZWN0KGNvbnNvbGVMb2dTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIOKchSBDb21tYW5kIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcclxuICAgICAgICAgIGNvbW1hbmRUeXBlOiAnT3JkZXJQbGFjZWQnLFxyXG4gICAgICAgICAgYWdncmVnYXRlSWQ6ICdvcmRlci0xMjMnLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhdWRpdCB0cmFpbCBmb3IgcG9saWN5IHZpb2xhdGlvbnMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCA9IHtcclxuICAgICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgcGF0aDogJy9jb21tYW5kcy9Vbmtub3duRXZlbnQnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiB7IGNvbW1hbmRUeXBlOiAnVW5rbm93bkV2ZW50JyB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWdncmVnYXRlSWQ6ICdvcmRlci0xMjMnIH0pLFxyXG4gICAgICAgIGhlYWRlcnM6IHt9LFxyXG4gICAgICAgIG11bHRpVmFsdWVIZWFkZXJzOiB7fSxcclxuICAgICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IG51bGwsXHJcbiAgICAgICAgbXVsdGlWYWx1ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBpc0Jhc2U2NEVuY29kZWQ6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVlc3RDb250ZXh0OiB7fSBhcyBhbnksXHJcbiAgICAgICAgcmVzb3VyY2U6ICcnLFxyXG4gICAgICAgIHN0YWdlVmFyaWFibGVzOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCwgbW9ja0NvbnRleHQpO1xyXG5cclxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDQwMyk7XHJcblxyXG4gICAgICAvLyBWZXJpZnkgdmlvbGF0aW9uIGF1ZGl0IHRyYWlsXHJcbiAgICAgIGV4cGVjdChjb25zb2xlRXJyb3JTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxyXG4gICAgICAgICdbUG9saWN5RW5mb3JjZW1lbnRdIOKdjCBQb2xpY3kgdmlvbGF0aW9uOicsXHJcbiAgICAgICAgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ0V2ZW50IFVua25vd25FdmVudCBoYXMgbm8gcmVnaXN0ZXJlZCBzY2hlbWEnKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2VCb2R5ID0gSlNPTi5wYXJzZShyZXN1bHQuYm9keSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZUJvZHkudGltZXN0YW1wKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QobmV3IERhdGUocmVzcG9uc2VCb2R5LnRpbWVzdGFtcCkuZ2V0VGltZSgpKS50b0JlTGVzc1RoYW5PckVxdWFsKERhdGUubm93KCkpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdDT1JTIEhlYWRlcnMnLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgQ09SUyBoZWFkZXJzIGluIHN1Y2Nlc3NmdWwgcmVzcG9uc2VzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgPSB7XHJcbiAgICAgICAgaHR0cE1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgIHBhdGg6ICcvY29tbWFuZHMvT3JkZXJQbGFjZWQnLFxyXG4gICAgICAgIHBhdGhQYXJhbWV0ZXJzOiB7IGNvbW1hbmRUeXBlOiAnT3JkZXJQbGFjZWQnIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZ2dyZWdhdGVJZDogJ29yZGVyLTEyMycgfSksXHJcbiAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LmhlYWRlcnMpLnRvRXF1YWwoe1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgQ09SUyBoZWFkZXJzIGluIGVycm9yIHJlc3BvbnNlcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50ID0ge1xyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBwYXRoOiAnL2NvbW1hbmRzL1Vua25vd25FdmVudCcsXHJcbiAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgY29tbWFuZFR5cGU6ICdVbmtub3duRXZlbnQnIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhZ2dyZWdhdGVJZDogJ29yZGVyLTEyMycgfSksXHJcbiAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICAgICAgbXVsdGlWYWx1ZUhlYWRlcnM6IHt9LFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogbnVsbCxcclxuICAgICAgICBtdWx0aVZhbHVlUXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBudWxsLFxyXG4gICAgICAgIGlzQmFzZTY0RW5jb2RlZDogZmFsc2UsXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQ6IHt9IGFzIGFueSxcclxuICAgICAgICByZXNvdXJjZTogJycsXHJcbiAgICAgICAgc3RhZ2VWYXJpYWJsZXM6IG51bGwsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBtb2NrQ29udGV4dCk7XHJcblxyXG4gICAgICBleHBlY3QocmVzdWx0LmhlYWRlcnMpLnRvRXF1YWwoe1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufSk7XHJcbiJdfQ==