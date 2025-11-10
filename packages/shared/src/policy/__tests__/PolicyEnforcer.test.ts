import { PolicyEnforcer } from '../PolicyEnforcer';

/**
 * Unit tests for Runtime Policy Enforcer
 * 
 * Requirements tested:
 * - 12.1: Decoupling policy enforcement
 * - 12.2: Event Store immutability policy
 * - 12.3: Schema validation policy
 * - 12.4: Rate limiting policy
 */
describe('PolicyEnforcer', () => {
  let enforcer: PolicyEnforcer;

  beforeEach(() => {
    enforcer = new PolicyEnforcer(false); // Disable logging for tests
  });

  afterEach(() => {
    enforcer.clearViolations();
  });

  describe('Service Decoupling Policy', () => {
    it('should block direct HTTP call from Command Service to Query Dashboard', () => {
      expect(() => {
        enforcer.validateServiceCall('command_service', 'query_dashboard', 'http');
      }).toThrow('Policy violation: Direct service calls are prohibited');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('Direct HTTP calls');
      expect(violations[0].input.source).toBe('command_service');
      expect(violations[0].input.target).toBe('query_dashboard');
    });

    it('should block direct HTTP call from Query Dashboard to Command Service', () => {
      expect(() => {
        enforcer.validateServiceCall('query_dashboard', 'command_service', 'http');
      }).toThrow('Policy violation: Direct service calls are prohibited');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('Direct HTTP calls');
    });

    it('should allow communication via Event Bus', () => {
      expect(() => {
        enforcer.validateServiceCall('command_service', 'event_bus', 'kinesis');
      }).not.toThrow();

      expect(() => {
        enforcer.validateServiceCall('query_dashboard', 'event_bus', 'sqs');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should allow other service communication patterns', () => {
      expect(() => {
        enforcer.validateServiceCall('api_gateway', 'command_service', 'http');
      }).not.toThrow();

      expect(() => {
        enforcer.validateServiceCall('frontend', 'api_gateway', 'http');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });
  });

  describe('Event Store Immutability Policy', () => {
    it('should block UPDATE operations on EventStore', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('EventStore', 'UPDATE');
      }).toThrow('Policy violation: Event Store is append-only');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('Event Store mutations are prohibited');
      expect(violations[0].input.operation).toBe('UPDATE');
    });

    it('should block DELETE operations on EventStore', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('EventStore', 'DELETE');
      }).toThrow('Policy violation: Event Store is append-only');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('Event Store mutations are prohibited');
      expect(violations[0].input.operation).toBe('DELETE');
    });

    it('should allow INSERT operations on EventStore', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('EventStore', 'INSERT');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should allow SELECT operations on EventStore', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('EventStore', 'SELECT');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });
  });

  describe('Snapshot Immutability Policy', () => {
    it('should block UPDATE operations on Snapshots', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('Snapshots', 'UPDATE');
      }).toThrow('Policy violation: Snapshots are append-only');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('Snapshot mutations are prohibited');
    });

    it('should allow INSERT operations on Snapshots', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('Snapshots', 'INSERT');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should allow DELETE operations on Snapshots (for cleanup)', () => {
      expect(() => {
        enforcer.validateDatabaseOperation('Snapshots', 'DELETE');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });
  });

  describe('Schema Registration Policy', () => {
    it('should block event publish without registered schema', () => {
      expect(() => {
        enforcer.validateEventPublish('UnregisteredEvent', false);
      }).toThrow('Policy violation: Event UnregisteredEvent has no registered schema');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('no registered schema');
      expect(violations[0].input.eventType).toBe('UnregisteredEvent');
    });

    it('should allow event publish with registered schema', () => {
      expect(() => {
        enforcer.validateEventPublish('OrderPlaced', true);
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should validate multiple events', () => {
      expect(() => {
        enforcer.validateEventPublish('OrderPlaced', true);
        enforcer.validateEventPublish('OrderCancelled', true);
        enforcer.validateEventPublish('PaymentProcessed', true);
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });
  });

  describe('Rate Limiting Policy', () => {
    it('should block temporal query endpoint without rate limit', () => {
      expect(() => {
        enforcer.validateApiEndpoint('/api/queries/temporal/order-123', 0);
      }).toThrow('Policy violation: Temporal queries must be rate-limited');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('rate limit of 10 requests/minute/client');
    });

    it('should block temporal query endpoint with insufficient rate limit', () => {
      expect(() => {
        enforcer.validateApiEndpoint('/api/queries/temporal/order-123', 5);
      }).toThrow('Policy violation: Temporal queries must be rate-limited');

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(1);
    });

    it('should allow temporal query endpoint with proper rate limit', () => {
      expect(() => {
        enforcer.validateApiEndpoint('/api/queries/temporal/order-123', 10);
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should allow temporal query endpoint with higher rate limit', () => {
      expect(() => {
        enforcer.validateApiEndpoint('/api/queries/temporal/order-123', 20);
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should not enforce rate limit on non-temporal endpoints', () => {
      expect(() => {
        enforcer.validateApiEndpoint('/api/queries/orders', 0);
      }).not.toThrow();

      expect(() => {
        enforcer.validateApiEndpoint('/api/commands/place-order', 0);
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });
  });

  describe('Violation Tracking', () => {
    it('should track multiple violations', () => {
      try {
        enforcer.validateServiceCall('command_service', 'query_dashboard', 'http');
      } catch (e) {
        // Expected
      }

      try {
        enforcer.validateDatabaseOperation('EventStore', 'DELETE');
      } catch (e) {
        // Expected
      }

      try {
        enforcer.validateEventPublish('UnregisteredEvent', false);
      } catch (e) {
        // Expected
      }

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(3);
      expect(violations[0].input.type).toBe('service_call');
      expect(violations[1].input.type).toBe('database_operation');
      expect(violations[2].input.type).toBe('event_publish');
    });

    it('should include timestamps in violations', () => {
      try {
        enforcer.validateServiceCall('command_service', 'query_dashboard', 'http');
      } catch (e) {
        // Expected
      }

      const violations = enforcer.getViolations();
      expect(violations[0].timestamp).toBeDefined();
      expect(new Date(violations[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should clear violations', () => {
      try {
        enforcer.validateServiceCall('command_service', 'query_dashboard', 'http');
      } catch (e) {
        // Expected
      }

      expect(enforcer.getViolations()).toHaveLength(1);

      enforcer.clearViolations();

      expect(enforcer.getViolations()).toHaveLength(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should validate complete event publishing workflow', () => {
      // Valid workflow
      expect(() => {
        // 1. Validate database operation
        enforcer.validateDatabaseOperation('EventStore', 'INSERT');

        // 2. Validate event has schema
        enforcer.validateEventPublish('OrderPlaced', true);

        // 3. Validate event bus communication
        enforcer.validateServiceCall('command_service', 'event_bus', 'kinesis');
      }).not.toThrow();

      const violations = enforcer.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should detect violations in complex workflow', () => {
      let violationCount = 0;

      // Invalid workflow
      try {
        enforcer.validateDatabaseOperation('EventStore', 'UPDATE'); // VIOLATION
      } catch (e) {
        violationCount++;
      }

      try {
        enforcer.validateEventPublish('UnregisteredEvent', false); // VIOLATION
      } catch (e) {
        violationCount++;
      }

      try {
        enforcer.validateServiceCall('command_service', 'query_dashboard', 'http'); // VIOLATION
      } catch (e) {
        violationCount++;
      }

      expect(violationCount).toBe(3);
      expect(enforcer.getViolations()).toHaveLength(3);
    });
  });
});
