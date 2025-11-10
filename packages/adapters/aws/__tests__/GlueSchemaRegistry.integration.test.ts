import { GlueSchemaRegistry } from '../GlueSchemaRegistry';
import { DomainEvent } from '@nexus/shared';

/**
 * Integration tests for AWS Glue Schema Registry
 * These tests validate schema registration, compatibility checks, and validation
 * 
 * Requirements tested:
 * - 2.1: Schema registration with compatibility mode
 * - 2.2: Compatibility validation (BACKWARD mode)
 * - 2.3: Schema evolution support
 */
describe('GlueSchemaRegistry Integration Tests', () => {
  let registry: GlueSchemaRegistry;
  const testSchemaName = `TestSchema_${Date.now()}`;

  beforeAll(() => {
    registry = new GlueSchemaRegistry({
      registryName: process.env.SCHEMA_REGISTRY_NAME || 'nexus-event-schema-registry',
      region: process.env.AWS_REGION || 'us-east-1',
      enableLogging: true,
    });
  });

  afterEach(() => {
    registry.clearCache();
  });

  describe('Schema Registration', () => {
    it('should register a new schema with BACKWARD compatibility', async () => {
      const schemaDefinition = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Unique order identifier' },
          customerId: { type: 'string', description: 'Customer identifier' },
          totalAmount: { type: 'number', description: 'Order total' },
        },
        required: ['orderId', 'customerId', 'totalAmount'],
        additionalProperties: false,
      });

      const result = await registry.registerSchema(
        testSchemaName,
        schemaDefinition,
        'BACKWARD'
      );

      expect(result.schemaName).toBe(testSchemaName);
      expect(result.version).toBe(1);
      expect(result.schemaArn).toBeDefined();
      expect(result.versionId).toBeDefined();
    }, 30000);

    it('should register a new version of existing schema', async () => {
      const schemaV1 = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      // Register v1
      await registry.registerSchema(`${testSchemaName}_v2`, schemaV1, 'BACKWARD');

      // Register v2 with additional field (compatible)
      const schemaV2 = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          orderDate: { type: 'string' }, // New optional field
        },
        required: ['orderId', 'customerId'],
      });

      const result = await registry.registerSchema(`${testSchemaName}_v2`, schemaV2, 'BACKWARD');

      expect(result.version).toBe(2);
    }, 30000);

    it('should reject incompatible schema version', async () => {
      const schemaV1 = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['orderId', 'customerId'],
      });

      // Register v1
      await registry.registerSchema(`${testSchemaName}_incompatible`, schemaV1, 'BACKWARD');

      // Try to register v2 with removed field (incompatible)
      const schemaV2 = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          // customerId removed - BREAKING CHANGE
        },
        required: ['orderId'],
      });

      await expect(
        registry.registerSchema(`${testSchemaName}_incompatible`, schemaV2, 'BACKWARD')
      ).rejects.toThrow(/not compatible/);
    }, 30000);
  });

  describe('Compatibility Checks', () => {
    beforeAll(async () => {
      const baseSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' },
              },
            },
          },
        },
        required: ['orderId', 'customerId'],
      });

      await registry.registerSchema(`${testSchemaName}_compat`, baseSchema, 'BACKWARD');
    }, 30000);

    it('should detect removed fields as breaking change', async () => {
      const newSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          // customerId removed
        },
        required: ['orderId'],
      });

      const result = await registry.checkCompatibility(`${testSchemaName}_compat`, newSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('customerId'));
      expect(result.violations).toContain(expect.stringContaining('removed'));
    });

    it('should detect type changes as breaking', async () => {
      const newSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'number' }, // Changed from string
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      const result = await registry.checkCompatibility(`${testSchemaName}_compat`, newSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('type changed'));
    });

    it('should detect making optional field required as breaking', async () => {
      const newSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          items: { type: 'array' },
        },
        required: ['orderId', 'customerId', 'items'], // items now required
      });

      const result = await registry.checkCompatibility(`${testSchemaName}_compat`, newSchema);

      expect(result.compatible).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('made required'));
    });

    it('should allow adding optional fields', async () => {
      const newSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          items: { type: 'array' },
          orderDate: { type: 'string' }, // New optional field
          shippingAddress: { type: 'object' }, // New optional field
        },
        required: ['orderId', 'customerId'],
      });

      const result = await registry.checkCompatibility(`${testSchemaName}_compat`, newSchema);

      expect(result.compatible).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Event Validation', () => {
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

      await registry.registerSchema('OrderPlaced', orderSchema, 'BACKWARD');
    }, 30000);

    it('should validate a valid event', async () => {
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          orderId: 'order-123',
          customerId: 'cust-456',
          totalAmount: 99.99,
          items: [
            { productId: 'prod-1', quantity: 2, price: 49.99 },
          ],
        },
        metadata: {
          correlationId: 'corr-1',
          causationId: 'cmd-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject event with missing required field', async () => {
      const event: DomainEvent = {
        eventId: 'evt-124',
        eventType: 'OrderPlaced',
        aggregateId: 'order-124',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          orderId: 'order-124',
          // customerId missing
          totalAmount: 99.99,
        },
        metadata: {
          correlationId: 'corr-2',
          causationId: 'cmd-2',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain(expect.stringContaining('customerId'));
    });

    it('should reject event with wrong field type', async () => {
      const event: DomainEvent = {
        eventId: 'evt-125',
        eventType: 'OrderPlaced',
        aggregateId: 'order-125',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          orderId: 'order-125',
          customerId: 'cust-456',
          totalAmount: '99.99', // Should be number, not string
        },
        metadata: {
          correlationId: 'corr-3',
          causationId: 'cmd-3',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      const result = await registry.validate(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain(expect.stringContaining('totalAmount'));
      expect(result.errors).toContain(expect.stringContaining('wrong type'));
    });
  });

  describe('Schema Retrieval and Caching', () => {
    it('should retrieve schema by name', async () => {
      const schemaDefinition = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          testField: { type: 'string' },
        },
      });

      await registry.registerSchema(`${testSchemaName}_retrieve`, schemaDefinition, 'BACKWARD');

      const retrieved = await registry.getSchema(`${testSchemaName}_retrieve`);
      const parsed = JSON.parse(retrieved);

      expect(parsed.properties.testField).toBeDefined();
      expect(parsed.properties.testField.type).toBe('string');
    }, 30000);

    it('should cache schema for performance', async () => {
      const schemaName = `${testSchemaName}_cache`;
      const schemaDefinition = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          cachedField: { type: 'string' },
        },
      });

      await registry.registerSchema(schemaName, schemaDefinition, 'BACKWARD');

      // First call - should hit AWS
      const start1 = Date.now();
      await registry.getSchema(schemaName);
      const duration1 = Date.now() - start1;

      // Second call - should hit cache
      const start2 = Date.now();
      await registry.getSchema(schemaName);
      const duration2 = Date.now() - start2;

      // Cache should be significantly faster
      expect(duration2).toBeLessThan(duration1);
    }, 30000);

    it('should list all schema versions', async () => {
      const schemaName = `${testSchemaName}_versions`;
      
      // Register v1
      await registry.registerSchema(schemaName, JSON.stringify({
        type: 'object',
        properties: { field1: { type: 'string' } },
      }), 'BACKWARD');

      // Register v2
      await registry.registerSchema(schemaName, JSON.stringify({
        type: 'object',
        properties: { 
          field1: { type: 'string' },
          field2: { type: 'string' },
        },
      }), 'BACKWARD');

      const versions = await registry.listSchemaVersions(schemaName);

      expect(versions.length).toBeGreaterThanOrEqual(2);
      expect(versions[0].schemaName).toBe(schemaName);
      expect(versions.every(v => v.versionId)).toBe(true);
    }, 30000);
  });

  describe('Breaking Change Detection', () => {
    it('should detect field rename as potential breaking change', async () => {
      const schemaName = `${testSchemaName}_rename`;
      
      const schemaV1 = JSON.stringify({
        type: 'object',
        properties: {
          oldFieldName: { type: 'string' },
          otherField: { type: 'number' },
        },
        required: ['oldFieldName'],
      });

      await registry.registerSchema(schemaName, schemaV1, 'BACKWARD');

      const schemaV2 = JSON.stringify({
        type: 'object',
        properties: {
          newFieldName: { type: 'string' }, // Renamed from oldFieldName
          otherField: { type: 'number' },
        },
        required: ['newFieldName'],
      });

      const result = await registry.checkCompatibility(schemaName, schemaV2);

      expect(result.compatible).toBe(false);
      expect(result.violations.some(v => v.includes('POTENTIAL BREAKING'))).toBe(true);
    }, 30000);
  });
});
