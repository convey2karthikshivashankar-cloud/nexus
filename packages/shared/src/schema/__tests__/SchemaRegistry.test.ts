import { SchemaRegistry, SchemaValidationError, SchemaCompatibilityError } from '../SchemaRegistry';
import { DomainEvent } from '../../types';
import { SchemaRegistryPort, ValidationResult, CompatibilityResult, SchemaVersion } from '../../ports/SchemaRegistryPort';

// Mock adapter for testing
class MockSchemaRegistryAdapter implements SchemaRegistryPort {
  private schemas: Map<string, string> = new Map();

  async registerSchema(
    schemaName: string,
    schemaDefinition: string,
    compatibilityMode: 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE'
  ): Promise<SchemaVersion> {
    this.schemas.set(schemaName, schemaDefinition);
    return {
      schemaName,
      version: 1,
      versionId: 'v1',
    };
  }

  async validate(event: DomainEvent): Promise<ValidationResult> {
    const schema = this.schemas.get(event.eventType);
    if (!schema) {
      return { valid: false, errors: ['Schema not found'] };
    }

    const schemaDef = JSON.parse(schema);
    const errors: string[] = [];

    // Check required fields
    if (schemaDef.required) {
      for (const field of schemaDef.required) {
        if (!(field in event.payload)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  async getSchema(schemaName: string, version?: number): Promise<string> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error('Schema not found');
    }
    return schema;
  }

  async checkCompatibility(schemaName: string, newSchema: string): Promise<CompatibilityResult> {
    const currentSchema = this.schemas.get(schemaName);
    if (!currentSchema) {
      return { compatible: true, violations: [] };
    }

    const current = JSON.parse(currentSchema);
    const proposed = JSON.parse(newSchema);
    const violations: string[] = [];

    // Check for removed fields
    for (const field of Object.keys(current.properties || {})) {
      if (!proposed.properties || !proposed.properties[field]) {
        violations.push(`Field '${field}' was removed`);
      }
    }

    // Check for type changes
    for (const field of Object.keys(current.properties || {})) {
      if (proposed.properties && proposed.properties[field]) {
        const currentType = current.properties[field].type;
        const proposedType = proposed.properties[field].type;
        if (currentType !== proposedType) {
          violations.push(`Field '${field}' type changed from ${currentType} to ${proposedType}`);
        }
      }
    }

    return { compatible: violations.length === 0, violations };
  }
}

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;
  let mockAdapter: MockSchemaRegistryAdapter;

  beforeEach(() => {
    mockAdapter = new MockSchemaRegistryAdapter();
    registry = new SchemaRegistry(mockAdapter);
  });

  describe('registerSchema', () => {
    it('should register a new schema', async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      const result = await registry.registerSchema('OrderPlaced', schema, 'BACKWARD');
      expect(result.schemaName).toBe('OrderPlaced');
      expect(result.version).toBeGreaterThan(0);
    });
  });

  describe('checkCompatibility', () => {
    it('should detect removed fields as breaking change', async () => {
      const result = await registry.checkCompatibility('OrderPlaced', JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          // customerId removed
        },
      }));

      expect(result.compatible).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('customerId'));
    });

    it('should allow additive changes', async () => {
      const result = await registry.checkCompatibility('OrderPlaced', JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          newField: { type: 'string' }, // Added field
        },
      }));

      expect(result.compatible).toBe(true);
    });

    it('should detect type changes as breaking', async () => {
      const result = await registry.checkCompatibility('OrderPlaced', JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'number' }, // Changed from string
          customerId: { type: 'string' },
        },
      }));

      expect(result.compatible).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('type changed'));
    });
  });

  describe('validate', () => {
    it('should validate event against schema', async () => {
      const event: DomainEvent = {
        eventId: 'evt-1',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          orderId: 'order-123',
          customerId: 'cust-456',
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
    });
  });
});

  describe('validateOrThrow', () => {
    it('should not throw for valid event', async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      await registry.registerSchema('OrderPlaced', schema, 'BACKWARD');

      const event: DomainEvent = {
        eventId: 'evt-1',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          orderId: 'order-123',
          customerId: 'cust-456',
        },
        metadata: {
          correlationId: 'corr-1',
          causationId: 'cmd-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      await expect(registry.validateOrThrow(event)).resolves.not.toThrow();
    });

    it('should throw SchemaValidationError for invalid event', async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      await registry.registerSchema('OrderPlaced', schema, 'BACKWARD');

      const event: DomainEvent = {
        eventId: 'evt-1',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          orderId: 'order-123',
          // customerId missing
        },
        metadata: {
          correlationId: 'corr-1',
          causationId: 'cmd-1',
          userId: 'user-1',
          schemaVersion: '1.0',
        },
      };

      await expect(registry.validateOrThrow(event)).rejects.toThrow(SchemaValidationError);
    });
  });

  describe('checkCompatibilityOrThrow', () => {
    it('should not throw for compatible schema', async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      await registry.registerSchema('OrderPlaced', schema, 'BACKWARD');

      const newSchema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          newField: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      await expect(
        registry.checkCompatibilityOrThrow('OrderPlaced', newSchema)
      ).resolves.not.toThrow();
    });

    it('should throw SchemaCompatibilityError for incompatible schema', async () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
        },
        required: ['orderId', 'customerId'],
      });

      await registry.registerSchema('OrderPlaced', schema, 'BACKWARD');

      const newSchema = JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          // customerId removed
        },
        required: ['orderId'],
      });

      await expect(
        registry.checkCompatibilityOrThrow('OrderPlaced', newSchema)
      ).rejects.toThrow(SchemaCompatibilityError);
    });
  });
});
