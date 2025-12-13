import { EventStorePort } from '../EventStorePort';
import { EventBusPort, QueueEventBusPort } from '../EventBusPort';
import { SchemaRegistryPort, CompatibilityMode, ValidationResult, CompatibilityResult, SchemaVersion } from '../SchemaRegistryPort';
import { SnapshotStorePort, SnapshotStoreConfig } from '../SnapshotStorePort';
import { DomainEvent, Snapshot } from '../../types';

/**
 * Unit tests for Port interfaces
 * These tests verify that mock implementations satisfy the interface contracts
 */
describe('Port Interfaces', () => {
  describe('EventStorePort', () => {
    it('should define required methods', () => {
      const mockEventStore: EventStorePort = {
        append: jest.fn(),
        getEvents: jest.fn(),
        getEventsByTimeRange: jest.fn(),
      };

      expect(mockEventStore.append).toBeDefined();
      expect(mockEventStore.getEvents).toBeDefined();
      expect(mockEventStore.getEventsByTimeRange).toBeDefined();
    });

    it('should allow optional subscribeToStream method', () => {
      const mockEventStoreWithSubscribe: EventStorePort = {
        append: jest.fn(),
        getEvents: jest.fn(),
        getEventsByTimeRange: jest.fn(),
        subscribeToStream: jest.fn(),
      };

      expect(mockEventStoreWithSubscribe.subscribeToStream).toBeDefined();
    });

    it('should accept DomainEvent array in append', async () => {
      const events: DomainEvent[] = [
        {
          eventId: 'evt-001',
          eventType: 'TestEvent',
          aggregateId: 'agg-123',
          aggregateVersion: 1,
          timestamp: new Date().toISOString(),
          payload: {},
          metadata: {
            correlationId: 'corr-123',
            causationId: 'cmd-456',
            userId: 'user-789',
            schemaVersion: '1.0.0',
          },
        },
      ];

      const mockEventStore: EventStorePort = {
        append: jest.fn().mockResolvedValue(undefined),
        getEvents: jest.fn(),
        getEventsByTimeRange: jest.fn(),
      };

      await mockEventStore.append(events);
      expect(mockEventStore.append).toHaveBeenCalledWith(events);
    });

    it('should return DomainEvent array from getEvents', async () => {
      const expectedEvents: DomainEvent[] = [
        {
          eventId: 'evt-001',
          eventType: 'TestEvent',
          aggregateId: 'agg-123',
          aggregateVersion: 1,
          timestamp: new Date().toISOString(),
          payload: {},
          metadata: {
            correlationId: 'corr-123',
            causationId: 'cmd-456',
            userId: 'user-789',
            schemaVersion: '1.0.0',
          },
        },
      ];

      const mockEventStore: EventStorePort = {
        append: jest.fn(),
        getEvents: jest.fn().mockResolvedValue(expectedEvents),
        getEventsByTimeRange: jest.fn(),
      };

      const result = await mockEventStore.getEvents('agg-123');
      expect(result).toEqual(expectedEvents);
    });
  });

  describe('EventBusPort', () => {
    it('should define required methods', () => {
      const mockEventBus: EventBusPort = {
        publish: jest.fn(),
        subscribe: jest.fn(),
      };

      expect(mockEventBus.publish).toBeDefined();
      expect(mockEventBus.subscribe).toBeDefined();
    });

    it('should allow optional unsubscribe method', () => {
      const mockEventBusWithUnsubscribe: EventBusPort = {
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      };

      expect(mockEventBusWithUnsubscribe.unsubscribe).toBeDefined();
    });
  });

  describe('QueueEventBusPort', () => {
    it('should define required methods', () => {
      const mockQueueBus: QueueEventBusPort = {
        publishToTopic: jest.fn(),
        subscribeQueue: jest.fn(),
        getDLQMessages: jest.fn(),
      };

      expect(mockQueueBus.publishToTopic).toBeDefined();
      expect(mockQueueBus.subscribeQueue).toBeDefined();
      expect(mockQueueBus.getDLQMessages).toBeDefined();
    });
  });

  describe('SchemaRegistryPort', () => {
    it('should define required methods', () => {
      const mockRegistry: SchemaRegistryPort = {
        registerSchema: jest.fn(),
        validate: jest.fn(),
        getSchema: jest.fn(),
        checkCompatibility: jest.fn(),
      };

      expect(mockRegistry.registerSchema).toBeDefined();
      expect(mockRegistry.validate).toBeDefined();
      expect(mockRegistry.getSchema).toBeDefined();
      expect(mockRegistry.checkCompatibility).toBeDefined();
    });

    it('should return SchemaVersion from registerSchema', async () => {
      const expectedVersion: SchemaVersion = {
        schemaName: 'TestEvent',
        version: 1,
        versionId: 'v1',
      };

      const mockRegistry: SchemaRegistryPort = {
        registerSchema: jest.fn().mockResolvedValue(expectedVersion),
        validate: jest.fn(),
        getSchema: jest.fn(),
        checkCompatibility: jest.fn(),
      };

      const result = await mockRegistry.registerSchema('TestEvent', '{}', 'BACKWARD');
      expect(result).toEqual(expectedVersion);
    });

    it('should return ValidationResult from validate', async () => {
      const expectedResult: ValidationResult = {
        valid: true,
      };

      const mockRegistry: SchemaRegistryPort = {
        registerSchema: jest.fn(),
        validate: jest.fn().mockResolvedValue(expectedResult),
        getSchema: jest.fn(),
        checkCompatibility: jest.fn(),
      };

      const event: DomainEvent = {
        eventId: 'evt-001',
        eventType: 'TestEvent',
        aggregateId: 'agg-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-456',
          userId: 'user-789',
          schemaVersion: '1.0.0',
        },
      };

      const result = await mockRegistry.validate(event);
      expect(result.valid).toBe(true);
    });

    it('should return CompatibilityResult from checkCompatibility', async () => {
      const expectedResult: CompatibilityResult = {
        compatible: true,
        violations: [],
      };

      const mockRegistry: SchemaRegistryPort = {
        registerSchema: jest.fn(),
        validate: jest.fn(),
        getSchema: jest.fn(),
        checkCompatibility: jest.fn().mockResolvedValue(expectedResult),
      };

      const result = await mockRegistry.checkCompatibility('TestEvent', '{}');
      expect(result.compatible).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('SnapshotStorePort', () => {
    it('should define required methods', () => {
      const mockSnapshotStore: SnapshotStorePort = {
        getLatest: jest.fn(),
        save: jest.fn(),
        getByVersion: jest.fn(),
      };

      expect(mockSnapshotStore.getLatest).toBeDefined();
      expect(mockSnapshotStore.save).toBeDefined();
      expect(mockSnapshotStore.getByVersion).toBeDefined();
    });

    it('should return Snapshot or null from getLatest', async () => {
      const expectedSnapshot: Snapshot = {
        aggregateId: 'agg-123',
        version: 100,
        timestamp: Date.now(),
        state: { status: 'active' },
        schemaVersion: '1.0.0',
        metadata: {
          eventCount: 100,
          aggregateSize: 50000,
        },
      };

      const mockSnapshotStore: SnapshotStorePort = {
        getLatest: jest.fn().mockResolvedValue(expectedSnapshot),
        save: jest.fn(),
        getByVersion: jest.fn(),
      };

      const result = await mockSnapshotStore.getLatest('agg-123');
      expect(result).toEqual(expectedSnapshot);
    });

    it('should return null when no snapshot exists', async () => {
      const mockSnapshotStore: SnapshotStorePort = {
        getLatest: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
        getByVersion: jest.fn(),
      };

      const result = await mockSnapshotStore.getLatest('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('SnapshotStoreConfig', () => {
    it('should allow AWS-specific configuration', () => {
      const config: SnapshotStoreConfig = {
        region: 'us-east-1',
        tableName: 'Snapshots',
        ttlSeconds: 7776000, // 90 days
      };

      expect(config.region).toBe('us-east-1');
      expect(config.tableName).toBe('Snapshots');
    });

    it('should allow GCP-specific configuration', () => {
      const config: SnapshotStoreConfig = {
        region: 'us-central1',
        projectId: 'my-project',
        collectionName: 'snapshots',
      };

      expect(config.projectId).toBe('my-project');
      expect(config.collectionName).toBe('snapshots');
    });

    it('should allow PostgreSQL-specific configuration', () => {
      const config: SnapshotStoreConfig = {
        connectionString: 'postgresql://localhost:5432/nexus',
        schemaName: 'event_sourcing',
      };

      expect(config.connectionString).toContain('postgresql');
      expect(config.schemaName).toBe('event_sourcing');
    });
  });

  describe('CompatibilityMode', () => {
    it('should support all compatibility modes', () => {
      const modes: CompatibilityMode[] = ['BACKWARD', 'FORWARD', 'FULL', 'NONE'];

      modes.forEach((mode) => {
        expect(['BACKWARD', 'FORWARD', 'FULL', 'NONE']).toContain(mode);
      });
    });
  });
});
