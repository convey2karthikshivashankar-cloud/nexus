/**
 * Query Controller with Runtime Policy Enforcement
 * 
 * Demonstrates integration of policy enforcement in query processing,
 * especially for temporal queries with rate limiting.
 * 
 * Requirements: 12.1, 12.2, 12.3, 9.1, 9.2
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { policyEnforcer } from '@nexus/shared';
import { withPolicyEnforcement } from '../../../infrastructure/src/middleware/PolicyEnforcementMiddleware';

/**
 * Query Controller with policy checks before execution
 */
export class PolicyEnforcedQueryController {
  private rateLimiter: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT = 10; // requests per minute
  private readonly RATE_WINDOW = 60000; // 1 minute in ms

  /**
   * Handle temporal query with policy enforcement
   */
  async handleTemporalQuery(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const aggregateId = event.pathParameters?.aggregateId;
      const asOf = event.queryStringParameters?.asOf;
      const clientId = this.extractClientId(event);

      if (!aggregateId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Aggregate ID is required' }),
        };
      }

      // Policy Check 1: Validate API endpoint has rate limiting
      try {
        policyEnforcer.validateApiEndpoint(event.path, this.RATE_LIMIT);
      } catch (error: any) {
        console.error('[QueryController] Policy violation:', error.message);
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Policy Violation',
            message: error.message,
          }),
        };
      }

      // Policy Check 2: Enforce rate limiting
      if (!this.checkRateLimit(clientId)) {
        console.warn('[QueryController] Rate limit exceeded', {
          clientId,
          path: event.path,
          timestamp: new Date().toISOString(),
        });

        return {
          statusCode: 429,
          headers: {
            'Retry-After': '60',
          },
          body: JSON.stringify({
            error: 'Rate Limit Exceeded',
            message: 'Temporal queries are limited to 10 requests per minute per client',
            retryAfter: 60,
          }),
        };
      }

      // Policy Check 3: Validate time range (90-day limit)
      if (asOf) {
        const asOfDate = new Date(asOf);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        if (asOfDate < ninetyDaysAgo) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Invalid Time Range',
              message: 'Temporal queries are limited to 90 days',
            }),
          };
        }
      }

      // Policy Check 4: Validate authentication and authorization
      const isAuthorized = await this.checkAuthorization(event, 'temporal_query');
      if (!isAuthorized) {
        console.warn('[QueryController] Unauthorized temporal query attempt', {
          clientId,
          aggregateId,
          timestamp: new Date().toISOString(),
        });

        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Forbidden',
            message: 'Insufficient permissions for temporal queries',
          }),
        };
      }

      // Log temporal query request for audit
      this.logTemporalQuery(clientId, aggregateId, asOf);

      // Execute temporal query (implementation details omitted)
      const result = await this.executeTemporalQuery(aggregateId, asOf);

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (error: any) {
      console.error('[QueryController] Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  /**
   * Handle regular query with policy enforcement
   */
  async handleQuery(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const resourceType = event.pathParameters?.resourceType;

      if (!resourceType) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Resource type is required' }),
        };
      }

      // Policy Check: Validate no direct calls from Command Service
      const source = this.extractSource(event);
      if (source === 'command_service') {
        try {
          policyEnforcer.validateServiceCall(source, 'query_dashboard', 'http');
        } catch (error: any) {
          console.error('[QueryController] Policy violation:', error.message);
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: 'Policy Violation',
              message: error.message,
            }),
          };
        }
      }

      // Execute query (implementation details omitted)
      const result = await this.executeQuery(resourceType, event.queryStringParameters || {});

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (error: any) {
      console.error('[QueryController] Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(clientId) || [];

    // Remove requests outside the time window
    const validRequests = requests.filter(time => now - time < this.RATE_WINDOW);

    if (validRequests.length >= this.RATE_LIMIT) {
      return false;
    }

    validRequests.push(now);
    this.rateLimiter.set(clientId, validRequests);
    return true;
  }

  private extractClientId(event: APIGatewayProxyEvent): string {
    // Extract from authorization header or source IP
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    if (authHeader) {
      // Parse JWT or API key to get client ID
      return authHeader.split(' ')[1] || 'unknown';
    }

    return event.requestContext.identity.sourceIp || 'unknown';
  }

  private extractSource(event: APIGatewayProxyEvent): string {
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || '';

    if (userAgent.includes('command-service')) {
      return 'command_service';
    } else if (userAgent.includes('query-dashboard')) {
      return 'query_dashboard';
    }

    return 'external';
  }

  private async checkAuthorization(event: APIGatewayProxyEvent, permission: string): Promise<boolean> {
    // In real implementation, check JWT claims or API key permissions
    // For now, return true if authorization header is present
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    return !!authHeader;
  }

  private logTemporalQuery(clientId: string, aggregateId: string, asOf?: string): void {
    console.log('[QueryController] Temporal query executed', {
      clientId,
      aggregateId,
      asOf: asOf || 'latest',
      timestamp: new Date().toISOString(),
    });
  }

  private async executeTemporalQuery(aggregateId: string, asOf?: string): Promise<any> {
    // Implementation details omitted
    return {
      aggregateId,
      asOf: asOf || new Date().toISOString(),
      state: {
        // Historical state
      },
    };
  }

  private async executeQuery(resourceType: string, params: Record<string, any>): Promise<any> {
    // Implementation details omitted
    return {
      items: [],
      total: 0,
    };
  }
}

/**
 * Lambda handlers with policy enforcement middleware
 */
const controller = new PolicyEnforcedQueryController();

export const temporalQueryHandler = withPolicyEnforcement(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return controller.handleTemporalQuery(event);
  },
  {
    enableLogging: true,
    strictMode: true,
  }
);

export const queryHandler = withPolicyEnforcement(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return controller.handleQuery(event);
  },
  {
    enableLogging: true,
    strictMode: true,
  }
);

/**
 * Example: Policy enforcement in action
 * 
 * Valid Temporal Query:
 * GET /api/queries/temporal/order-123?asOf=2025-01-01T00:00:00Z
 * Headers: { "Authorization": "Bearer <token>" }
 * 
 * Response: 200 OK
 * {
 *   "aggregateId": "order-123",
 *   "asOf": "2025-01-01T00:00:00Z",
 *   "state": { ... }
 * }
 * 
 * Rate Limited:
 * GET /api/queries/temporal/order-123 (11th request in 1 minute)
 * 
 * Response: 429 Too Many Requests
 * {
 *   "error": "Rate Limit Exceeded",
 *   "message": "Temporal queries are limited to 10 requests per minute per client",
 *   "retryAfter": 60
 * }
 * 
 * Unauthorized:
 * GET /api/queries/temporal/order-123 (no auth header)
 * 
 * Response: 403 Forbidden
 * {
 *   "error": "Forbidden",
 *   "message": "Insufficient permissions for temporal queries"
 * }
 * 
 * Invalid Time Range:
 * GET /api/queries/temporal/order-123?asOf=2024-01-01T00:00:00Z (> 90 days ago)
 * 
 * Response: 400 Bad Request
 * {
 *   "error": "Invalid Time Range",
 *   "message": "Temporal queries are limited to 90 days"
 * }
 */
