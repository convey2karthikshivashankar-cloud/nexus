/**
 * Runtime Policy Enforcer
 * 
 * Validates operations against OPA policies at runtime.
 * This provides defense-in-depth beyond CI/CD checks.
 */

export interface PolicyInput {
  type: 'service_call' | 'database_operation' | 'event_publish' | 'api_endpoint';
  [key: string]: any;
}

export interface PolicyViolation {
  message: string;
  input: PolicyInput;
  timestamp: string;
}

export class PolicyEnforcer {
  private violations: PolicyViolation[] = [];
  private readonly enableLogging: boolean;

  constructor(enableLogging: boolean = true) {
    this.enableLogging = enableLogging;
  }

  /**
   * Validate service-to-service communication
   */
  validateServiceCall(source: string, target: string, protocol: string): void {
    const input: PolicyInput = {
      type: 'service_call',
      source,
      target,
      protocol,
    };

    // Rule: No direct HTTP calls between Command Service and Query Dashboard
    if (
      source === 'command_service' &&
      target === 'query_dashboard' &&
      protocol === 'http'
    ) {
      this.recordViolation(
        'Direct HTTP calls between Command Service and Query Dashboard are prohibited. Use Event Bus.',
        input
      );
      throw new Error('Policy violation: Direct service calls are prohibited');
    }

    if (
      source === 'query_dashboard' &&
      target === 'command_service' &&
      protocol === 'http'
    ) {
      this.recordViolation(
        'Direct HTTP calls between Query Dashboard and Command Service are prohibited. Use Event Bus.',
        input
      );
      throw new Error('Policy violation: Direct service calls are prohibited');
    }

    this.log(`✅ Service call validated: ${source} -> ${target} via ${protocol}`);
  }

  /**
   * Validate database operations
   */
  validateDatabaseOperation(table: string, operation: string): void {
    const input: PolicyInput = {
      type: 'database_operation',
      table,
      operation,
    };

    // Rule: Event Store is append-only
    if (table === 'EventStore' && (operation === 'UPDATE' || operation === 'DELETE')) {
      this.recordViolation(
        'Event Store mutations are prohibited. Only INSERT operations allowed.',
        input
      );
      throw new Error('Policy violation: Event Store is append-only');
    }

    // Rule: Snapshots are append-only (no updates)
    if (table === 'Snapshots' && operation === 'UPDATE') {
      this.recordViolation(
        'Snapshot mutations are prohibited. Create new snapshot versions instead.',
        input
      );
      throw new Error('Policy violation: Snapshots are append-only');
    }

    this.log(`✅ Database operation validated: ${operation} on ${table}`);
  }

  /**
   * Validate event publishing
   */
  validateEventPublish(eventType: string, hasRegisteredSchema: boolean): void {
    const input: PolicyInput = {
      type: 'event_publish',
      eventType,
      registeredSchemas: { [eventType]: hasRegisteredSchema },
    };

    // Rule: All events must have registered schemas
    if (!hasRegisteredSchema) {
      this.recordViolation(
        `Event type '${eventType}' has no registered schema in Schema Registry`,
        input
      );
      throw new Error(`Policy violation: Event ${eventType} has no registered schema`);
    }

    this.log(`✅ Event publish validated: ${eventType}`);
  }

  /**
   * Validate API endpoint configuration
   */
  validateApiEndpoint(path: string, rateLimit: number): void {
    const input: PolicyInput = {
      type: 'api_endpoint',
      path,
      rateLimit,
    };

    // Rule: Temporal queries must be rate-limited
    if (path.includes('/api/queries/temporal/') && rateLimit < 10) {
      this.recordViolation(
        'Temporal query endpoints must have rate limit of 10 requests/minute/client',
        input
      );
      throw new Error('Policy violation: Temporal queries must be rate-limited');
    }

    this.log(`✅ API endpoint validated: ${path}`);
  }

  /**
   * Record a policy violation
   */
  private recordViolation(message: string, input: PolicyInput): void {
    const violation: PolicyViolation = {
      message,
      input,
      timestamp: new Date().toISOString(),
    };

    this.violations.push(violation);
    
    console.error('[PolicyEnforcer] VIOLATION:', message);
    console.error('[PolicyEnforcer] Input:', JSON.stringify(input, null, 2));
  }

  /**
   * Get all recorded violations
   */
  getViolations(): PolicyViolation[] {
    return [...this.violations];
  }

  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Log policy enforcement activity
   */
  private log(message: string): void {
    if (this.enableLogging) {
      console.log(`[PolicyEnforcer] ${message}`);
    }
  }
}

/**
 * Create a PolicyEnforcer instance with configuration from environment
 * @deprecated Use `new PolicyEnforcer(config)` instead for better testability
 */
export function createPolicyEnforcer(enableLogging?: boolean): PolicyEnforcer {
  const logging = enableLogging ?? process.env.ENABLE_POLICY_LOGGING === 'true';
  return new PolicyEnforcer(logging);
}

/**
 * Default policy enforcer instance
 * @deprecated Import PolicyEnforcer class and instantiate directly for better testability
 * 
 * @example
 * ```typescript
 * // Preferred: Create your own instance
 * const enforcer = new PolicyEnforcer(false);
 * 
 * // Legacy: Use default instance (not recommended for testing)
 * import { policyEnforcer } from '@nexus/shared';
 * ```
 */
export const policyEnforcer = new PolicyEnforcer(
  typeof process !== 'undefined' && process.env?.ENABLE_POLICY_LOGGING === 'true'
);
