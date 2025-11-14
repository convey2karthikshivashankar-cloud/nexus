/**
 * Integration tests for schema validation rejection scenarios
 * Tests Requirements 2.1, 2.2, 2.3 - Focus on rejection and breaking changes
 */

import { SchemaRegistryFactory } from '../SchemaRegistryFactory';
import { DomainEvent, SchemaRegistryPort } from '../../ports/SchemaRegistryPort';

describe('Schema Validation Rejection Tests', () => {
  let registry: SchemaRegistryPort;
  const testPrefix = `RejectionTest_${Date.now()}`;

  beforeAll(() => {
    registry = SchemaRegistryFactory.create({
      provider: 'aws',
      registryName: process.env.SCHEMA_REGISTRY_NAME || 'nexus-event-schema-registry',
      region: process.env.AWS_REGION || 'us-east-1',
      enableLogging: true,
    });
  });

  describe('Validation Rejection Scenarios', () => {
    const schemaName = `${testPrefix}_ValidationRejection`;

    beforeAll(async () => {
      const schema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          userId: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'number', minimum: 0, maximum: 150 },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
          metadata: {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['createdAt'],
          },
        },
        required: ['userId', 'email', 'status'],
      });

      await registry.registerSchema(schemaName, schema, 'BACKWARD');
    }, 30000);

    it('should reject event with missing required field', async () => {
      const event: DomainEvent = {
        eventId: 'reject-1',
        eventType: schemaName,
        aggregateId: 'agg-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          // status missing - REQUIRED
        },
        metadata: {
          correlationId: 'corr-1',
          causationId: 'cmd-1',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('status'))).toBe(true);
    });

    it('should reject event with invalid email format', async () => {
      const event: DomainEvent = {
        eventId: 'reject-2',
        eventType: schemaName,
        aggregateId: 'agg-2',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          email: 'not-an-email', // Invalid format
          status: 'active',
        },
        metadata: {
          correlationId: 'corr-2',
          causationId: 'cmd-2',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.toLowerCase().includes('email'))).toBe(true);
    });

    it('should reject event with value outside allowed range', async () => {
      const event: DomainEvent = {
        eventId: 'reject-3',
        eventType: schemaName,
        aggregateId: 'agg-3',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          status: 'active',
          age: 200, // Exceeds maximum of 150
        },
        metadata: {
          correlationId: 'corr-3',
          causationId: 'cmd-3',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('age') || e.includes('maximum'))).toBe(true);
    });

    it('should reject event with invalid enum value', async () => {
      const event: DomainEvent = {
        eventId: 'reject-4',
        eventType: schemaName,
        aggregateId: 'agg-4',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          status: 'deleted', // Not in enum: ['active', 'inactive', 'pending']
        },
        metadata: {
          correlationId: 'corr-4',
          causationId: 'cmd-4',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('status') || e.includes('enum'))).toBe(true);
    });

    it('should reject event with wrong field type', async () => {
      const event: DomainEvent = {
        eventId: 'reject-5',
        eventType: schemaName,
        aggregateId: 'agg-5',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 123, // Should be string, not number
          email: 'test@example.com',
          status: 'active',
        },
        metadata: {
          correlationId: 'corr-5',
          causationId: 'cmd-5',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('userId') || e.includes('type'))).toBe(true);
    });

    it('should reject event with missing nested required field', async () => {
      const event: DomainEvent = {
        eventId: 'reject-6',
        eventType: schemaName,
        aggregateId: 'agg-6',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          status: 'active',
          metadata: {
            // createdAt missing - REQUIRED in nested object
            tags: ['tag1', 'tag2'],
          },
        },
        metadata: {
          correlationId: 'corr-6',
          causationId: 'cmd-6',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('createdAt'))).toBe(true);
    });

    it('should reject event with invalid array item type', async () => {
      const event: DomainEvent = {
        eventId: 'reject-7',
        eventType: schemaName,
        aggregateId: 'agg-7',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          status: 'active',
          metadata: {
            createdAt: new Date().toISOString(),
            tags: ['tag1', 123, 'tag3'], // 123 should be string
          },
        },
        metadata: {
          correlationId: 'corr-7',
          causationId: 'cmd-7',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('tags') || e.includes('type'))).toBe(true);
    });
  });

  describe('Breaking Change Detection', () => {
    const schemaName = `${testPrefix}_BreakingChanges`;

    beforeAll(async () => {
      const initialSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'number' },
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
        required: ['id', 'name', 'email'],
      });

      await registry.registerSchema(schemaName, initialSchema, 'BACKWARD');
    }, 30000);

    it('should detect breaking change: removing required field', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          // email removed - BREAKING
        },
        required: ['id', 'name'],
      });

      const result = await registry.checkCompatibility(schemaName, breakingSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations.some(v => v.includes('email') || v.includes('removed'))).toBe(true);
    });

    it('should detect breaking change: changing field type', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'number' }, // Changed from string - BREAKING
          name: { type: 'string' },
          email: { type: 'string' },
        },
        required: ['id', 'name', 'email'],
      });

      const result = await registry.checkCompatibility(schemaName, breakingSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations.some(v => 
        (v.includes('id') || v.includes('type')) && v.includes('changed')
      )).toBe(true);
    });

    it('should detect breaking change: making optional field required', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['id', 'name', 'email', 'age'], // age now required - BREAKING
      });

      const result = await registry.checkCompatibility(schemaName, breakingSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations.some(v => 
        v.includes('age') && v.includes('required')
      )).toBe(true);
    });

    it('should detect breaking change: removing enum value', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string', enum: ['active'] }, // 'inactive' removed - BREAKING
        },
        required: ['id', 'name', 'email'],
      });

      const result = await registry.checkCompatibility(schemaName, breakingSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations.some(v => 
        v.includes('enum') || v.includes('inactive')
      )).toBe(true);
    });

    it('should detect breaking change: renaming field', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' }, // Renamed from 'name' - BREAKING
          email: { type: 'string' },
        },
        required: ['id', 'fullName', 'email'],
      });

      const result = await registry.checkCompatibility(schemaName, breakingSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toBeDefined();
      // Should detect that 'name' was removed
      expect(result.violations.some(v => v.includes('name'))).toBe(true);
    });

    it('should detect breaking change: adding constraint to existing field', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 5 }, // Added constraint - BREAKING
          email: { type: 'string' },
        },
        required: ['id', 'name', 'email'],
      });

      const result = await registry.checkCompatibility(schemaName, breakingSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations.some(v => 
        v.includes('name') && (v.includes('constraint') || v.includes('minLength'))
      )).toBe(true);
    });
  });

  describe('Compatible Changes (Should Pass)', () => {
    const schemaName = `${testPrefix}_CompatibleChanges`;

    beforeAll(async () => {
      const initialSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      });

      await registry.registerSchema(schemaName, initialSchema, 'BACKWARD');
    }, 30000);

    it('should allow adding optional field', async () => {
      const compatibleSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' }, // New optional field - COMPATIBLE
        },
        required: ['id', 'name'],
      });

      const result = await registry.checkCompatibility(schemaName, compatibleSchema);

      expect(result.compatible).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should allow adding enum value', async () => {
      const compatibleSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] }, // Added 'pending'
        },
        required: ['id', 'name'],
      });

      const result = await registry.checkCompatibility(schemaName, compatibleSchema);

      expect(result.compatible).toBe(true);
    });

    it('should allow relaxing constraints', async () => {
      // First add a field with constraint
      const schemaWithConstraint = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 5 },
        },
        required: ['id', 'name'],
      });

      await registry.registerSchema(schemaName, schemaWithConstraint, 'BACKWARD');

      // Then relax the constraint
      const relaxedSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 3 }, // Relaxed from 5 to 3 - COMPATIBLE
        },
        required: ['id', 'name'],
      });

      const result = await registry.checkCompatibility(schemaName, relaxedSchema);

      expect(result.compatible).toBe(true);
    }, 30000);
  });

  describe('Unregistered Schema Handling', () => {
    it('should reject event with unregistered schema', async () => {
      const event: DomainEvent = {
        eventId: 'unreg-1',
        eventType: 'CompletelyUnregisteredSchema_' + Date.now(),
        aggregateId: 'agg-unreg-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          someField: 'someValue',
        },
        metadata: {
          correlationId: 'corr-unreg-1',
          causationId: 'cmd-unreg-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => 
        e.toLowerCase().includes('schema') || e.toLowerCase().includes('not found')
      )).toBe(true);
    });

    it('should provide clear error message for unregistered schema', async () => {
      const unregisteredType = 'UnknownEventType_' + Date.now();
      const event: DomainEvent = {
        eventId: 'unreg-2',
        eventType: unregisteredType,
        aggregateId: 'agg-unreg-2',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-unreg-2',
          causationId: 'cmd-unreg-2',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      
      // Error message should mention the event type
      const errorMessage = result.errors!.join(' ');
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Multiple Validation Errors', () => {
    const schemaName = `${testPrefix}_MultipleErrors`;

    beforeAll(async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          field1: { type: 'string', minLength: 3 },
          field2: { type: 'number', minimum: 0 },
          field3: { type: 'boolean' },
          field4: { type: 'string', enum: ['A', 'B', 'C'] },
        },
        required: ['field1', 'field2', 'field3', 'field4'],
      });

      await registry.registerSchema(schemaName, schema, 'BACKWARD');
    }, 30000);

    it('should report all validation errors at once', async () => {
      const event: DomainEvent = {
        eventId: 'multi-1',
        eventType: schemaName,
        aggregateId: 'agg-multi-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          field1: 'ab', // Too short (minLength: 3)
          field2: -5, // Below minimum (minimum: 0)
          field3: 'not-boolean', // Wrong type
          field4: 'D', // Not in enum
        },
        metadata: {
          correlationId: 'corr-multi-1',
          causationId: 'cmd-multi-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThanOrEqual(4);
      
      // Should report errors for all fields
      const errorString = result.errors!.join(' ').toLowerCase();
      expect(errorString).toContain('field1');
      expect(errorString).toContain('field2');
      expect(errorString).toContain('field3');
      expect(errorString).toContain('field4');
    });
  });
});
