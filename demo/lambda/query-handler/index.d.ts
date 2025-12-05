import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
