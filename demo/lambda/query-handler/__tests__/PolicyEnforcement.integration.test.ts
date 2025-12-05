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

import { handler } from '../index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { policyEnforcer } from '@nexus/shared';

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
  const mockContext: Context = {
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
    policyEnforcer.clearViolations();
    
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
      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅ Service call validated')
      );
      expect(policyEnforcer.getViolations()).toHaveLength(0);
    });

    it('should allow queries from mobile apps', async () => {
      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅ Service call validated')
      );
    });

    it('should block direct calls from Command Service', async () => {
      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(403);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Policy Violation');
      expect(responseBody.message).toContain('Direct service calls are prohibited');
      expect(responseBody.details).toContain('Direct calls from Command Service to Query Dashboard are prohibited');
      expect(responseBody.timestamp).toBeDefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ❌ Policy violation:',
        expect.stringContaining('Direct service calls are prohibited')
      );
    });

    it('should detect command-service in various User-Agent formats', async () => {
      const commandServiceUserAgents = [
        'command-service',
        'command-service/1.0',
        'MyApp command-service Client',
        'AWS-SDK command-service',
      ];

      for (const userAgent of commandServiceUserAgents) {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/orders',
          pathParameters: null,
          body: null,
          headers: { 'User-Agent': userAgent },
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
      }
    });

    it('should handle missing User-Agent header', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: {}, // No User-Agent
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅ Service call validated')
      );
    });

    it('should handle case-insensitive User-Agent header', async () => {
      const event: APIGatewayProxyEvent = {
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

  describe('Environment-based Control', () => {
    it('should skip policy enforcement when disabled', async () => {
      process.env.ENABLE_POLICY_ENFORCEMENT = 'false';

      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      // Should succeed even with command-service User-Agent
      expect(result.statusCode).toBe(200);
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement]')
      );
    });

    it('should enable policy enforcement by default', async () => {
      delete process.env.ENABLE_POLICY_ENFORCEMENT;

      const event: APIGatewayProxyEvent = {
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
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅')
      );
    });
  });

  describe('Query Path Handling', () => {
    it('should handle /orders path', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.total).toBe(2);
    });

    it('should handle /events path', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/events',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅ Service call validated')
      );
    });

    it('should handle invalid query path', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/invalid',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0' },
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

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0' },
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
        'Error processing query:',
        expect.any(Error)
      );
    });

    it('should log policy violations on error', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'command-service' },
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

      const violations = policyEnforcer.getViolations();
      if (violations.length > 0) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[PolicyEnforcement] Policy violations detected:',
          expect.any(Array)
        );
      }
    });
  });

  describe('Audit Trail', () => {
    it('should create complete audit trail for successful query', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyApp/1.0)' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify audit trail logs
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Query received:',
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PolicyEnforcement] ✅ Service call validated'
      );
    });

    it('should create audit trail for policy violations', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'command-service' },
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
        expect.stringContaining('Direct service calls are prohibited')
      );

      const responseBody = JSON.parse(result.body);
      expect(responseBody.timestamp).toBeDefined();
      expect(new Date(responseBody.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful responses', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0' },
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
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'command-service' },
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

  describe('Integration with Existing Query Logic', () => {
    it('should not interfere with valid query processing', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/orders',
        pathParameters: null,
        body: null,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyApp/1.0)' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
      };

      const result = await handler(event, mockContext);

      // Policy enforcement should complete successfully
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PolicyEnforcement] ✅ Service call validated')
      );
      
      // Should proceed to normal query processing
      expect(result.statusCode).toBe(200);
      
      // Should have proper response structure
      const responseBody = JSON.parse(result.body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.total).toBeDefined();
      
      // Should have proper CORS headers
      expect(result.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        })
      );
    });
  });
});
