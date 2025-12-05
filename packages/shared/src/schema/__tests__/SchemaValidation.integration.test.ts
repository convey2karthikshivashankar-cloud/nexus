/**
 * Integration tests for schema validation across the system
 * Tests Requirements 2.1, 2.2, 2.3, 2.4
 */

import { SchemaRegistryFactory } from '../SchemaRegistryFactory';
import { DomainEvent, SchemaRegistryPort } from '../../ports/SchemaRegistryPort';

describe('Schema Validation Integration Tests', () => {
  let registry: SchemaRegistryPort;
  const testSchemaName = `IntegrationTest_${Date.now()}`;

  beforeAll(() => {
    registry = SchemaRegistryFactory.create({
      provider: 'aws',
      registryName: process.env.SCHEMA_REGISTRY_NAME || 'nexus-event-schema-registry',
      region: process.env.AWS_REGION || 'us-east-1',
      enableLogging: true,
    });
  });

  describe('End-to-End Schema Validation Flow', () => {
    it('should register schema, validate event, and enforce compatibility', async () => {
      // Step 1: Register initial schema
      const schemaV1 = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          userId: { type: 'string' },
          action: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['userId', 'action'],
      });

      const version1 = await registry.registerSchema(
        testSchemaName,
        schemaV1,
        'BACKWARD'
      );

      expect(version1.version).toBe(1);

      // Step 2: Validate a valid event
      const validEvent: DomainEvent = {
        eventId: 'evt-1',
        eventType: testSchemaName,
        aggregateId: 'agg-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          userId: 'user-123',
          action: 'LOGIN',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          correlationId: 'corr-1',
          causationId: 'cmd-1',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const validation1 = await registry.validate(validEvent);
      expect(validation1.valid).toBe(true);

      // Step 3: Validate an invalid event (missing required field)
      const invalidEvent: DomainEvent = {
        ...validEvent,
        eventId: 'evt-2',
        payload: {
          userId: 'user-123',
          // action missing
        },
      };

      const validation2 = await registry.validate(invalidEvent);
      expect(validation2.valid).toBe(false);
      expect(validation2.errors).toContain(expect.stringContaining('action'));

      // Step 4: Check compatibility for a compatible change (add optional field)
      const schemaV2 = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          userId: { type: 'string' },
          action: { type: 'string' },
          timestamp: { type: 'string' },
          ipAddress: { type: 'string' }, // New optional field
        },
        required: ['userId', 'action'],
      });

      const compat1 = await registry.checkCompatibility(testSchemaName, schemaV2);
      expect(compat1.compatible).toBe(true);

      // Step 5: Register the compatible version
      const version2 = await registry.registerSchema(
        testSchemaName,
        schemaV2,
        'BACKWARD'
      );

      expect(version2.version).toBe(2);

      // Step 6: Check compatibility for an incompatible change (remove required field)
      const schemaV3Breaking = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          userId: { type: 'string' },
          // action removed - BREAKING
        },
        required: ['userId'],
      });

      const compat2 = await registry.checkCompatibility(testSchemaName, schemaV3Breaking);
      expect(compat2.compatible).toBe(false);
      expect(compat2.violations).toContain(expect.stringContaining('action'));

      // Step 7: Attempt to register incompatible version (should fail)
      await expect(
        registry.registerSchema(testSchemaName, schemaV3Breaking, 'BACKWARD')
      ).rejects.toThrow(/not compatible/);
    }, 60000);
  });

  describe('Event Publishing with Schema Validation', () => {
    beforeAll(async () => {
      const orderSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          totalAmount: { type: 'number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
              },
              required: ['productId', 'quantity', 'price'],
            },
          },
        },
        required: ['orderId', 'customerId', 'totalAmount'],
      });

      await registry.registerSchema('OrderPlacedValidation', orderSchema, 'BACKWARD');
    }, 30000);

    it('should validate event before allowing publication', async () => {
      const validEvent: DomainEvent = {
        eventId: 'evt-order-1',
        eventType: 'OrderPlacedValidation',
        aggregateId: 'order-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: 'order-1',
          customerId: 'cust-1',
          totalAmount: 100.0,
          items: [
            { productId: 'prod-1', quantity: 2, price: 50.0 },
          ],
        },
        metadata: {
          correlationId: 'corr-1',
          causationId: 'cmd-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(validEvent);
      expect(result.valid).toBe(true);
    });

    it('should reject event with missing required field', async () => {
      const invalidEvent: DomainEvent = {
        eventId: 'evt-order-2',
        eventType: 'OrderPlacedValidation',
        aggregateId: 'order-2',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: 'order-2',
          // customerId missing
          totalAmount: 100.0,
        },
        metadata: {
          correlationId: 'corr-2',
          causationId: 'cmd-2',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(invalidEvent);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain(expect.stringContaining('customerId'));
    });

    it('should reject event with wrong field type', async () => {
      const invalidEvent: DomainEvent = {
        eventId: 'evt-order-3',
        eventType: 'OrderPlacedValidation',
        aggregateId: 'order-3',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: 'order-3',
          customerId: 'cust-3',
          totalAmount: '100.00', // Should be number, not string
        },
        metadata: {
          correlationId: 'corr-3',
          causationId: 'cmd-3',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(invalidEvent);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain(expect.stringContaining('totalAmount'));
    });
  });

  describe('Schema Evolution Scenarios', () => {
    const evolutionSchemaName = `Evolution_${Date.now()}`;

    it('should support adding optional fields (backward compatible)', async () => {
      // Register v1
      const v1 = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      });

      await registry.registerSchema(evolutionSchemaName, v1, 'BACKWARD');

      // Add optional field (compatible)
      const v2 = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' }, // New optional field
        },
        required: ['id', 'name'],
      });

      const compat = await registry.checkCompatibility(evolutionSchemaName, v2);
      expect(compat.compatible).toBe(true);

      const version = await registry.registerSchema(evolutionSchemaName, v2, 'BACKWARD');
      expect(version.version).toBe(2);
    }, 30000);

    it('should reject removing required fields (breaking change)', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          // name removed
        },
        required: ['id'],
      });

      const compat = await registry.checkCompatibility(evolutionSchemaName, breakingSchema);
      expect(compat.compatible).toBe(false);
      expect(compat.violations.some(v => v.includes('name'))).toBe(true);
    });

    it('should reject changing field types (breaking change)', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'number' }, // Changed from string
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      });

      const compat = await registry.checkCompatibility(evolutionSchemaName, breakingSchema);
      expect(compat.compatible).toBe(false);
      expect(compat.violations.some(v => v.includes('type changed'))).toBe(true);
    });

    it('should reject making optional fields required (breaking change)', async () => {
      const breakingSchema = JSON.stringify({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['id', 'name', 'description'], // description now required
      });

      const compat = await registry.checkCompatibility(evolutionSchemaName, breakingSchema);
      expect(compat.compatible).toBe(false);
      expect(compat.violations.some(v => v.includes('made required'))).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    beforeAll(async () => {
      const perfSchema = JSON.stringify({
        type: 'object',
        properties: {
          testField: { type: 'string' },
        },
        required: ['testField'],
      });

      await registry.registerSchema('PerformanceTest', perfSchema, 'BACKWARD');
    }, 30000);

    it('should validate events within 200ms (Requirement 8.2)', async () => {
      const event: DomainEvent = {
        eventId: 'perf-1',
        eventType: 'PerformanceTest',
        aggregateId: 'agg-perf-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          testField: 'test-value',
        },
        metadata: {
          correlationId: 'corr-perf-1',
          causationId: 'cmd-perf-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const start = Date.now();
      await registry.validate(event);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should retrieve schemas within 100ms (Requirement 8.5)', async () => {
      const start = Date.now();
      await registry.getSchema('PerformanceTest');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should check compatibility within 200ms (Requirement 8.2)', async () => {
      const newSchema = JSON.stringify({
        type: 'object',
        properties: {
          testField: { type: 'string' },
          newField: { type: 'string' },
        },
        required: ['testField'],
      });

      const start = Date.now();
      await registry.checkCompatibility('PerformanceTest', newSchema);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error messages for validation failures', async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'number' },
          field3: { type: 'boolean' },
        },
        required: ['field1', 'field2', 'field3'],
      });

      await registry.registerSchema('ErrorHandlingTest', schema, 'BACKWARD');

      const invalidEvent: DomainEvent = {
        eventId: 'err-1',
        eventType: 'ErrorHandlingTest',
        aggregateId: 'agg-err-1',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          field1: 'valid',
          // field2 missing
          field3: 'not-a-boolean', // wrong type
        },
        metadata: {
          correlationId: 'corr-err-1',
          causationId: 'cmd-err-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(invalidEvent);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      
      // Should report both missing field and wrong type
      const errorString = result.errors!.join(' ');
      expect(errorString).toContain('field2');
      expect(errorString).toContain('field3');
    }, 30000);

    it('should handle non-existent schema gracefully', async () => {
      const event: DomainEvent = {
        eventId: 'err-2',
        eventType: 'NonExistentSchema',
        aggregateId: 'agg-err-2',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-err-2',
          causationId: 'cmd-err-2',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Schema');
    });
  });
});
