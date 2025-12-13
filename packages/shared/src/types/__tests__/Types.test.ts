import { DomainEvent, EventMetadata, StoredEvent } from '../DomainEvent';
import { Command, CommandMetadata, CommandResult } from '../Command';
import { ReadModel, ProjectionUpdate } from '../ReadModel';
import { Snapshot, SnapshotMetadata, SnapshotTrigger } from '../Snapshot';

/**
 * Unit tests for core type definitions
 * These tests verify type contracts and ensure type safety
 */
describe('Core Types', () => {
  describe('DomainEvent', () => {
    it('should create a valid DomainEvent', () => {
      const metadata: EventMetadata = {
        correlationId: 'corr-123',
        causationId: 'cmd-456',
        userId: 'user-789',
        schemaVersion: '1.0.0',
      };

      const event: DomainEvent = {
        eventId: 'evt-001',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
        payload: { orderId: 'order-123', amount: 99.99 },
        metadata,
      };

      expect(event.eventId).toBe('evt-001');
      expect(event.eventType).toBe('OrderPlaced');
      expect(event.aggregateId).toBe('order-123');
      expect(event.aggregateVersion).toBe(1);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(event.payload).toHaveProperty('orderId');
      expect(event.metadata.correlationId).toBe('corr-123');
    });

    it('should create a valid StoredEvent with version', () => {
      const storedEvent: StoredEvent = {
        eventId: 'evt-001',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-456',
          userId: 'user-789',
          schemaVersion: '1.0.0',
        },
        version: 1, // DynamoDB sort key
      };

      expect(storedEvent.version).toBe(1);
      expect(storedEvent.aggregateVersion).toBe(1);
    });

    it('should allow unknown payload properties', () => {
      const event: DomainEvent = {
        eventId: 'evt-001',
        eventType: 'CustomEvent',
        aggregateId: 'agg-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          customField: 'value',
          nestedObject: { deep: { nested: true } },
          arrayField: [1, 2, 3],
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-456',
          userId: 'user-789',
          schemaVersion: '1.0.0',
        },
      };

      expect(event.payload.customField).toBe('value');
      expect(event.payload.nestedObject).toEqual({ deep: { nested: true } });
    });
  });

  describe('Command', () => {
    it('should create a valid Command', () => {
      const metadata: CommandMetadata = {
        userId: 'user-123',
        correlationId: 'corr-456',
      };

      const command: Command = {
        commandId: 'cmd-001',
        commandType: 'PlaceOrder',
        aggregateId: 'order-123',
        timestamp: '2025-01-01T00:00:00.000Z',
        payload: { items: [{ sku: 'SKU-001', quantity: 2 }] },
        metadata,
      };

      expect(command.commandId).toBe('cmd-001');
      expect(command.commandType).toBe('PlaceOrder');
      expect(command.aggregateId).toBe('order-123');
      expect(command.metadata.userId).toBe('user-123');
    });

    it('should allow optional causationId in metadata', () => {
      const metadataWithCausation: CommandMetadata = {
        userId: 'user-123',
        correlationId: 'corr-456',
        causationId: 'parent-cmd-001',
      };

      const metadataWithoutCausation: CommandMetadata = {
        userId: 'user-123',
        correlationId: 'corr-456',
      };

      expect(metadataWithCausation.causationId).toBe('parent-cmd-001');
      expect(metadataWithoutCausation.causationId).toBeUndefined();
    });

    it('should create a valid CommandResult for success', () => {
      const result: CommandResult = {
        success: true,
        aggregateId: 'order-123',
        version: 5,
        eventIds: ['evt-001', 'evt-002'],
      };

      expect(result.success).toBe(true);
      expect(result.version).toBe(5);
      expect(result.eventIds).toHaveLength(2);
      expect(result.error).toBeUndefined();
    });

    it('should create a valid CommandResult for failure', () => {
      const result: CommandResult = {
        success: false,
        aggregateId: 'order-123',
        version: 0,
        eventIds: [],
        error: 'Validation failed: insufficient inventory',
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(result.eventIds).toHaveLength(0);
    });
  });

  describe('ReadModel', () => {
    it('should create a valid ReadModel', () => {
      const readModel: ReadModel = {
        id: 'rm-001',
        aggregateId: 'order-123',
        version: 5,
        lastUpdated: '2025-01-01T00:00:00.000Z',
        status: 'active',
        searchableText: 'order customer john doe',
        metadata: { customField: 'value' },
        tags: ['priority', 'vip'],
      };

      expect(readModel.id).toBe('rm-001');
      expect(readModel.status).toBe('active');
      expect(readModel.tags).toContain('priority');
      expect(readModel.searchableText).toContain('john');
    });

    it('should create a valid ProjectionUpdate', () => {
      const update: ProjectionUpdate = {
        aggregateId: 'order-123',
        version: 6,
        eventId: 'evt-003',
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      expect(update.aggregateId).toBe('order-123');
      expect(update.version).toBe(6);
      expect(update.eventId).toBe('evt-003');
    });
  });

  describe('Snapshot', () => {
    it('should create a valid Snapshot', () => {
      const metadata: SnapshotMetadata = {
        eventCount: 100,
        aggregateSize: 50000,
      };

      const snapshot: Snapshot = {
        aggregateId: 'order-123',
        version: 100,
        timestamp: Date.now(),
        state: { status: 'completed', items: [] },
        schemaVersion: '1.0.0',
        metadata,
      };

      expect(snapshot.aggregateId).toBe('order-123');
      expect(snapshot.version).toBe(100);
      expect(snapshot.schemaVersion).toBe('1.0.0');
      expect(snapshot.metadata.eventCount).toBe(100);
    });

    it('should create valid SnapshotTrigger thresholds', () => {
      const trigger: SnapshotTrigger = {
        eventCountThreshold: 1000,
        aggregateSizeThreshold: 1048576, // 1MB
        timeElapsedThreshold: 86400000, // 24 hours
      };

      expect(trigger.eventCountThreshold).toBe(1000);
      expect(trigger.aggregateSizeThreshold).toBe(1048576);
      expect(trigger.timeElapsedThreshold).toBe(86400000);
    });
  });
});

describe('Type Compatibility', () => {
  it('should allow DomainEvent to be serialized to JSON', () => {
    const event: DomainEvent = {
      eventId: 'evt-001',
      eventType: 'TestEvent',
      aggregateId: 'agg-123',
      aggregateVersion: 1,
      timestamp: '2025-01-01T00:00:00.000Z',
      payload: { data: 'test' },
      metadata: {
        correlationId: 'corr-123',
        causationId: 'cmd-456',
        userId: 'user-789',
        schemaVersion: '1.0.0',
      },
    };

    const json = JSON.stringify(event);
    const parsed = JSON.parse(json);

    expect(parsed.eventId).toBe(event.eventId);
    expect(parsed.payload.data).toBe('test');
  });

  it('should allow Command to be serialized to JSON', () => {
    const command: Command = {
      commandId: 'cmd-001',
      commandType: 'TestCommand',
      aggregateId: 'agg-123',
      timestamp: '2025-01-01T00:00:00.000Z',
      payload: { action: 'test' },
      metadata: {
        userId: 'user-123',
        correlationId: 'corr-456',
      },
    };

    const json = JSON.stringify(command);
    const parsed = JSON.parse(json);

    expect(parsed.commandId).toBe(command.commandId);
    expect(parsed.payload.action).toBe('test');
  });
});
