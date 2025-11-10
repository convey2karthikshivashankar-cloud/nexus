import { SnapshotManager } from '../SnapshotManager';
import { SnapshotStorePort, EventStorePort, DomainEvent, Snapshot } from '@nexus/shared';

/**
 * Unit tests for SnapshotManager
 * 
 * Requirements tested:
 * - 11.2: Snapshot creation within 5 seconds of threshold detection
 * - 11.3: Snapshot storage with write durability
 * - 11.4: Snapshot versioning with backward compatibility
 * - 11.5: Snapshot metrics exposure
 */
describe('SnapshotManager', () => {
  let snapshotManager: SnapshotManager;
  let mockSnapshotStore: jest.Mocked<SnapshotStorePort>;
  let mockEventStore: jest.Mocked<EventStorePort>;

  beforeEach(() => {
    // Create mock stores
    mockSnapshotStore = {
      save: jest.fn(),
      getLatest: jest.fn(),
      getByVersion: jest.fn(),
      list: jest.fn(),
    } as any;

    mockEventStore = {
      append: jest.fn(),
      getEvents: jest.fn(),
      getEventsByTimeRange: jest.fn(),
    } as any;

    snapshotManager = new SnapshotManager(
      mockSnapshotStore,
      mockEventStore,
      {
        eventCountThreshold: 100,
        aggregateSizeThreshold: 10000,
        timeElapsedThreshold: 86400000, // 24 hours
      },
      false // Disable logging for tests
    );
  });

  describe('Synchronous Trigger Evaluation', () => {
    it('should trigger snapshot when event count threshold exceeded', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue({
        aggregateId: 'order-123',
        version: 50,
        state: {},
        timestamp: Date.now(),
        schemaVersion: '1.0',
        metadata: {},
      });

      mockEventStore.getEvents.mockResolvedValue(
        Array.from({ length: 150 }, (_, i) => createMockEvent('order-123', i + 1))
      );

      const triggered = await snapshotManager.evaluateTriggerSync('order-123', 150, 5000);

      expect(triggered).toBe(true);
      // Snapshot creation is async, so we can't directly verify save was called
    });

    it('should trigger snapshot when aggregate size threshold exceeded', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue(null);

      const triggered = await snapshotManager.evaluateTriggerSync('order-123', 50, 15000);

      expect(triggered).toBe(true);
    });

    it('should not trigger snapshot when thresholds not exceeded', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue({
        aggregateId: 'order-123',
        version: 50,
        state: {},
        timestamp: Date.now(),
        schemaVersion: '1.0',
        metadata: {},
      });

      const triggered = await snapshotManager.evaluateTriggerSync('order-123', 60, 5000);

      expect(triggered).toBe(false);
    });

    it('should complete evaluation within 5 seconds', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue(null);

      const startTime = Date.now();
      await snapshotManager.evaluateTriggerSync('order-123', 50, 5000);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should handle errors gracefully', async () => {
      mockSnapshotStore.getLatest.mockRejectedValue(new Error('Database error'));

      const triggered = await snapshotManager.evaluateTriggerSync('order-123', 150, 5000);

      expect(triggered).toBe(false);
    });
  });

  describe('Time-Elapsed Threshold Evaluation', () => {
    it('should trigger snapshot when time threshold exceeded', async () => {
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

      mockSnapshotStore.getLatest.mockResolvedValue({
        aggregateId: 'order-123',
        version: 50,
        state: {},
        timestamp: oldTimestamp,
        schemaVersion: '1.0',
        metadata: {},
      });

      mockEventStore.getEvents.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => createMockEvent('order-123', i + 1))
      );

      const triggered = await snapshotManager.evaluateTimeElapsedThreshold('order-123');

      expect(triggered).toBe(true);
    });

    it('should not trigger snapshot when time threshold not exceeded', async () => {
      const recentTimestamp = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago

      mockSnapshotStore.getLatest.mockResolvedValue({
        aggregateId: 'order-123',
        version: 50,
        state: {},
        timestamp: recentTimestamp,
        schemaVersion: '1.0',
        metadata: {},
      });

      const triggered = await snapshotManager.evaluateTimeElapsedThreshold('order-123');

      expect(triggered).toBe(false);
    });

    it('should return false when no snapshot exists', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue(null);

      const triggered = await snapshotManager.evaluateTimeElapsedThreshold('order-123');

      expect(triggered).toBe(false);
    });
  });

  describe('Snapshot Creation', () => {
    it('should create snapshot with correct structure', async () => {
      const events = Array.from({ length: 10 }, (_, i) => 
        createMockEvent('order-123', i + 1)
      );

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');

      expect(mockSnapshotStore.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: 'order-123',
          version: 10,
          schemaVersion: '1.0',
          metadata: expect.objectContaining({
            eventCount: 10,
            triggerReason: 'event_count',
          }),
        })
      );
    });

    it('should calculate aggregate size correctly', async () => {
      const events = Array.from({ length: 5 }, (_, i) => 
        createMockEvent('order-123', i + 1)
      );

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');

      const savedSnapshot = mockSnapshotStore.save.mock.calls[0][0];
      expect(savedSnapshot.metadata.aggregateSize).toBeGreaterThan(0);
    });

    it('should update metrics after successful creation', async () => {
      const events = [createMockEvent('order-123', 1)];

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');

      const metrics = snapshotManager.getMetrics();
      expect(metrics.creationCount).toBe(1);
      expect(metrics.lastCreationTime).toBeGreaterThan(0);
    });

    it('should track failures in metrics', async () => {
      mockEventStore.getEvents.mockRejectedValue(new Error('Database error'));

      await expect(snapshotManager.createSnapshot('order-123')).rejects.toThrow();

      const metrics = snapshotManager.getMetrics();
      expect(metrics.creationFailures).toBe(1);
    });

    it('should handle empty event stream', async () => {
      mockEventStore.getEvents.mockResolvedValue([]);
      mockSnapshotStore.getLatest.mockResolvedValue(null);

      await snapshotManager.createSnapshot('order-123');

      // Should not save snapshot for empty event stream
      expect(mockSnapshotStore.save).not.toHaveBeenCalled();
    });
  });

  describe('Snapshot Versioning', () => {
    it('should create snapshots with incrementing versions', async () => {
      const events1 = Array.from({ length: 5 }, (_, i) => 
        createMockEvent('order-123', i + 1)
      );
      const events2 = Array.from({ length: 10 }, (_, i) => 
        createMockEvent('order-123', i + 1)
      );

      mockEventStore.getEvents
        .mockResolvedValueOnce(events1)
        .mockResolvedValueOnce(events2);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');
      await snapshotManager.createSnapshot('order-123');

      expect(mockSnapshotStore.save).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ version: 5 })
      );
      expect(mockSnapshotStore.save).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ version: 10 })
      );
    });

    it('should include schema version for backward compatibility', async () => {
      const events = [createMockEvent('order-123', 1)];

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');

      expect(mockSnapshotStore.save).toHaveBeenCalledWith(
        expect.objectContaining({
          schemaVersion: '1.0',
        })
      );
    });
  });

  describe('Metrics', () => {
    it('should track average creation time', async () => {
      const events = [createMockEvent('order-123', 1)];

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');
      await snapshotManager.createSnapshot('order-456');

      const metrics = snapshotManager.getMetrics();
      expect(metrics.creationCount).toBe(2);
      expect(metrics.avgCreationTime).toBeGreaterThan(0);
    });

    it('should reset metrics', async () => {
      const events = [createMockEvent('order-123', 1)];

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      await snapshotManager.createSnapshot('order-123');

      snapshotManager.resetMetrics();

      const metrics = snapshotManager.getMetrics();
      expect(metrics.creationCount).toBe(0);
      expect(metrics.creationFailures).toBe(0);
      expect(metrics.avgCreationTime).toBe(0);
    });

    it('should expose metrics for monitoring', async () => {
      const metrics = snapshotManager.getMetrics();

      expect(metrics).toHaveProperty('creationCount');
      expect(metrics).toHaveProperty('creationFailures');
      expect(metrics).toHaveProperty('avgCreationTime');
      expect(metrics).toHaveProperty('lastCreationTime');
    });
  });

  describe('Performance', () => {
    it('should handle large event streams efficiently', async () => {
      const events = Array.from({ length: 10000 }, (_, i) => 
        createMockEvent('order-123', i + 1)
      );

      mockEventStore.getEvents.mockResolvedValue(events);
      mockSnapshotStore.save.mockResolvedValue(undefined);

      const startTime = Date.now();
      await snapshotManager.createSnapshot('order-123');
      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it('should not block on async snapshot creation', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue(null);
      mockEventStore.getEvents.mockResolvedValue([]);

      const startTime = Date.now();
      await snapshotManager.evaluateTriggerSync('order-123', 150, 15000);
      const duration = Date.now() - startTime;

      // Should return immediately (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});

// Helper function to create mock events
function createMockEvent(aggregateId: string, version: number): DomainEvent {
  return {
    eventId: `evt-${version}`,
    eventType: 'OrderPlaced',
    aggregateId,
    aggregateVersion: version,
    timestamp: new Date().toISOString(),
    payload: {
      orderId: aggregateId,
      customerId: 'cust-123',
      totalAmount: 99.99,
    },
    metadata: {
      correlationId: 'corr-1',
      causationId: 'cmd-1',
      userId: 'user-1',
      schemaVersion: '1.0',
    },
  };
}
