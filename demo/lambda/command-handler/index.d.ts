import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
