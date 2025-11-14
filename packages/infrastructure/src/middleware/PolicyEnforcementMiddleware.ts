/**
 * API Gateway Middleware for Runtime Policy Enforcement
 * 
 * Validates operations before execution to ensure compliance with
 * architectural policies defined in OPA.
 * 
 * Requirements: 12.1, 12.2, 12.3
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { policyEnforcer } from '@nexus/shared';

export interface PolicyEnforcementConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  strictMode?: boolean; // If true, block requests on policy violations
}

/**
 * Middleware for enforcing policies at API Gateway level
 */
export class PolicyEnforcementMiddleware {
  constructor(private readonly config: PolicyEnforcementConfig = {}) {}

  /**
   * Validate request before allowing it to proceed
   */
  async before(event: APIGatewayProxyEvent): Promise<void> {
    const path = event.path;
    const method = event.httpMethod;
    const source = this.extractSource(event);

    // Policy Check 1: Validate API endpoint configuration
    if (path.includes('/api/queries/temporal/')) {
      try {
        // Temporal queries must be rate-limited
        policyEnforcer.validateApiEndpoint(path, 10);
      } catch (error: any) {
        if (this.config.strictMode) {
          throw new PolicyViolationError(error.message, {
            path,
            method,
            source,
          });
        }
        this.logViolation(error.message, { path, method, source });
      }
    }

    // Policy Check 2: Validate service-to-service calls
    if (this.isServiceToServiceCall(event)) {
      const target = this.extractTarget(event);
      const protocol = 'http';

      try {
        policyEnforcer.validateServiceCall(source, target, protocol);
      } catch (error: any) {
        if (this.config.strictMode) {
          throw new PolicyViolationError(error.message, {
            source,
            target,
            protocol,
          });
        }
        this.logViolation(error.message, { source, target, protocol });
      }
    }

    // Policy Check 3: Validate database operations (from request body)
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      const body = this.parseBody(event.body);
      if (body?.table && body?.operation) {
        try {
          policyEnforcer.validateDatabaseOperation(body.table, body.operation);
        } catch (error: any) {
          if (this.config.strictMode) {
            throw new PolicyViolationError(error.message, {
              table: body.table,
              operation: body.operation,
            });
          }
          this.logViolation(error.message, { table: body.table, operation: body.operation });
        }
      }
    }

    this.log(`Policy checks passed for ${method} ${path}`);
  }

  /**
   * Log policy violations
   */
  after(event: APIGatewayProxyEvent, result: APIGatewayProxyResult): void {
    // Log successful operations for audit trail
    if (this.config.enableLogging) {
      console.log('[PolicyEnforcement] Request completed', {
        path: event.path,
        method: event.httpMethod,
        statusCode: result.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle errors and policy violations
   */
  onError(event: APIGatewayProxyEvent, error: Error): APIGatewayProxyResult {
    if (error instanceof PolicyViolationError) {
      console.error('[PolicyEnforcement] Policy violation detected', {
        message: error.message,
        context: error.context,
        path: event.path,
        method: event.httpMethod,
        timestamp: new Date().toISOString(),
      });

      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Policy Violation',
          message: error.message,
          context: error.context,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Re-throw non-policy errors
    throw error;
  }

  private extractSource(event: APIGatewayProxyEvent): string {
    // Extract source from headers or path
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || '';
    
    if (userAgent.includes('command-service')) {
      return 'command_service';
    } else if (userAgent.includes('query-dashboard')) {
      return 'query_dashboard';
    } else if (userAgent.includes('event-router')) {
      return 'event_router';
    }
    
    return 'external';
  }

  private extractTarget(event: APIGatewayProxyEvent): string {
    const path = event.path;
    
    if (path.startsWith('/api/commands')) {
      return 'command_service';
    } else if (path.startsWith('/api/queries')) {
      return 'query_dashboard';
    }
    
    return 'unknown';
  }

  private isServiceToServiceCall(event: APIGatewayProxyEvent): boolean {
    const source = this.extractSource(event);
    return source !== 'external';
  }

  private parseBody(body: string | null): any {
    if (!body) return null;
    
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  private logViolation(message: string, context: any): void {
    console.warn('[PolicyEnforcement] Policy violation (non-blocking)', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[PolicyEnforcement] ${message}`);
    }
  }
}

/**
 * Custom error for policy violations
 */
export class PolicyViolationError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, any>
  ) {
    super(message);
    this.name = 'PolicyViolationError';
  }
}

/**
 * Lambda handler wrapper with policy enforcement
 */
export function withPolicyEnforcement<TEvent = APIGatewayProxyEvent, TResult = APIGatewayProxyResult>(
  handler: (event: TEvent) => Promise<TResult>,
  config: PolicyEnforcementConfig = {}
): (event: TEvent) => Promise<TResult> {
  const middleware = new PolicyEnforcementMiddleware(config);

  return async (event: TEvent): Promise<TResult> => {
    try {
      // Run policy checks before handler
      if (isAPIGatewayEvent(event)) {
        await middleware.before(event as any);
      }

      // Execute handler
      const result = await handler(event);

      // Log after handler
      if (isAPIGatewayEvent(event) && isAPIGatewayResult(result)) {
        middleware.after(event as any, result as any);
      }

      return result;
    } catch (error: any) {
      // Handle policy violations
      if (error instanceof PolicyViolationError && isAPIGatewayEvent(event)) {
        return middleware.onError(event as any, error) as any;
      }
      throw error;
    }
  };
}

function isAPIGatewayEvent(event: any): event is APIGatewayProxyEvent {
  return event && typeof event.path === 'string' && typeof event.httpMethod === 'string';
}

function isAPIGatewayResult(result: any): result is APIGatewayProxyResult {
  return result && typeof result.statusCode === 'number';
}

/**
 * Example Usage:
 * 
 * ```typescript
 * import { withPolicyEnforcement } from './PolicyEnforcementMiddleware';
 * 
 * export const handler = withPolicyEnforcement(
 *   async (event: APIGatewayProxyEvent) => {
 *     // Your handler logic
 *     return {
 *       statusCode: 200,
 *       body: JSON.stringify({ message: 'Success' }),
 *     };
 *   },
 *   {
 *     enableLogging: true,
 *     strictMode: true, // Block requests on policy violations
 *   }
 * );
 * ```
 */
