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

import { handler } from '../index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { policyEnforcer } from '@nexus/shared';

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
  const mockContext: Context = {
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
    policyEnforcer.clearViolations();
    
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
      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(202);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅ Database operation validated')
      );
      expect(policyEnforcer.getViolations()).toHaveLength(0);
    });

    it('should log successful command processing', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/OrderPlaced',
        pathParameters: { commandType: 'OrderPlaced' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(202);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ✅ Command processed successfully',
        expect.objectContaining({
          commandType: 'OrderPlaced',
          aggregateId: expect.any(String),
          eventId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('Event Publishing Policy', () => {
    it('should allow publishing events with registered schemas', async () => {
      const knownEventTypes = ['OrderPlaced', 'OrderCancelled', 'PaymentProcessed'];

      for (const eventType of knownEventTypes) {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: `/commands/${eventType}`,
          pathParameters: { commandType: eventType },
          body: JSON.stringify({ aggregateId: 'test-123' }),
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          isBase64Encoded: false,
          requestContext: {} as any,
          resource: '',
          stageVariables: null,
        };

        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(202);
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[PolicyEnforcement] ✅ Event publish validated')
        );
      }
    });

    it('should reject events without registered schemas', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/UnknownEvent',
        pathParameters: { commandType: 'UnknownEvent' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(403);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Policy Violation');
      expect(responseBody.message).toContain('Event UnknownEvent has no registered schema');
      expect(responseBody.details).toContain("Event type 'UnknownEvent' has no registered schema");
      expect(responseBody.timestamp).toBeDefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ❌ Policy violation:',
        expect.stringContaining('Event UnknownEvent has no registered schema')
      );
    });
  });

  describe('Environment-based Control', () => {
    it('should skip policy enforcement when disabled', async () => {
      process.env.ENABLE_POLICY_ENFORCEMENT = 'false';

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/UnknownEvent',
        pathParameters: { commandType: 'UnknownEvent' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      // Should succeed even with unregistered event type
      expect(result.statusCode).toBe(202);
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement]')
      );
    });

    it('should enable policy enforcement by default', async () => {
      delete process.env.ENABLE_POLICY_ENFORCEMENT;

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/OrderPlaced',
        pathParameters: { commandType: 'OrderPlaced' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(202);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing command type', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands',
        pathParameters: null,
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Command type is required');
    });

    it('should handle malformed JSON', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/OrderPlaced',
        pathParameters: { commandType: 'OrderPlaced' },
        body: 'invalid json{',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing command:',
        expect.any(Error)
      );
    });

    it('should log policy violations on error', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/UnknownEvent',
        pathParameters: { commandType: 'UnknownEvent' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(403);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ❌ Policy violation:',
        expect.any(String)
      );
    });
  });

  describe('Audit Trail', () => {
    it('should create complete audit trail for successful command', async () => {
      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(202);

      // Verify audit trail logs
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Command received:',
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ✅ Database operation validated'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ✅ Event publish validated'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Event stored:',
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ✅ Command processed successfully',
        expect.objectContaining({
          commandType: 'OrderPlaced',
          aggregateId: 'order-123',
        })
      );
    });

    it('should create audit trail for policy violations', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/UnknownEvent',
        pathParameters: { commandType: 'UnknownEvent' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(403);

      // Verify violation audit trail
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ❌ Policy violation:',
        expect.stringContaining('Event UnknownEvent has no registered schema')
      );

      const responseBody = JSON.parse(result.body);
      expect(responseBody.timestamp).toBeDefined();
      expect(new Date(responseBody.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful responses', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/OrderPlaced',
        pathParameters: { commandType: 'OrderPlaced' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
    });

    it('should include CORS headers in error responses', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/commands/UnknownEvent',
        pathParameters: { commandType: 'UnknownEvent' },
        body: JSON.stringify({ aggregateId: 'order-123' }),
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
    });
  });
});
