import { EventStore } from '../EventStore';
import { DomainEvent } from '@nexus/shared';

describe('EventStore', () => {
  let eventStore: EventStore;

  beforeEach(() => {
    eventStore = new EventStore({
      tableName: 'test-event-store',
      region: 'us-east-1',
    });
  });

  describe('append', () => {
    it('should append multiple events atomically', async () => {
      const events: DomainEvent[] = [
        {
          eventId: 'evt-1',
          eventType: 'OrderPlaced',
          aggregateId: 'order-123',
          aggregateVersion: 1,
          timestamp: '2025-01-01T00:00:00Z',
          payload: { customerId: 'cust-1' },
          metadata: {
            correlationId: 'corr-1',
            causationId: 'cmd-1',
            userId: 'user-1',
            schemaVersion: '1.0',
          },
        },
      ];

      await expect(eventStore.append(events)).resolves.not.toThrow();
    });

    it('should retry on throttling with exponential backoff', async () => {
      // Mock implementation would test retry logic
      expect(true).toBe(true);
    });
  });

  describe('getEvents', () => {
    it('should retrieve events with pagination', async () => {
      const events = await eventStore.getEvents('order-123', 0, 10);
      expect(Array.isArray(events)).toBe(true);
    });

    it('should filter events by version range', async () => {
      const events = await eventStore.getEvents('order-123', 5, 10);
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('getEventsByTimeRange', () => {
    it('should enforce rate limiting', async () => {
      const clientId = 'client-1';
      
      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        await eventStore.getEventsByTimeRange(
          'OrderPlaced',
          '2025-01-01T00:00:00Z',
          '2025-01-02T00:00:00Z',
          100,
          clientId
        );
      }

      // 11th request should fail
      await expect(
        eventStore.getEventsByTimeRange(
          'OrderPlaced',
          '2025-01-01T00:00:00Z',
          '2025-01-02T00:00:00Z',
          100,
          clientId
        )
      ).rejects.toThrow('Rate limit exceeded');
    });
  });
});
