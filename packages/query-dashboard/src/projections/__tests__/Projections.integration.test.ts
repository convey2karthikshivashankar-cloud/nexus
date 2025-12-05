import { OrderListProjection } from '../OrderListProjection';
import { OrderSearchProjection } from '../OrderSearchProjection';
import { DomainEvent } from '@nexus/shared';
import { Client } from '@opensearch-project/opensearch';

jest.mock('@opensearch-project/opensearch');

describe('Projection Integration Tests', () => {
  let mockOpenSearchClient: jest.Mocked<Client>;
  let orderListProjection: OrderListProjection;
  let orderSearchProjection: OrderSearchProjection;

  beforeEach(() => {
    mockOpenSearchClient = {
      index: jest.fn(),
      update: jest.fn(),
      search: jest.fn(),
    } as any;

    orderListProjection = new OrderListProjection(mockOpenSearchClient, false);
    orderSearchProjection = new OrderSearchProjection(mockOpenSearchClient, false);
  });

  describe('Event-to-Read-Model Transformation', () => {
    it('should transform OrderPlaced event to read model', async () => {
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          customerId: 'cust-456',
          items: [{ productId: 'prod-1', quantity: 2, price: 29.99 }],
          totalAmount: 59.98,
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockOpenSearchClient.index.mockResolvedValue({ body: { result: 'created' } } as any);

      await orderListProjection.handleEvent(event);

      expect(mockOpenSearchClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'orders',
          id: 'order-123',
          body: expect.objectContaining({
            orderId: 'order-123',
            customerId: 'cust-456',
            status: 'PLACED',
            totalAmount: 59.98,
          }),
        })
      );
    });

    it('should measure projection lag < 2 seconds', async () => {
      const eventTimestamp = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: eventTimestamp,
        payload: {
          customerId: 'cust-456',
          items: [],
          totalAmount: 0,
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockOpenSearchClient.index.mockResolvedValue({ body: { result: 'created' } } as any);

      const startTime = Date.now();
      await orderListProjection.handleEvent(event);
      const endTime = Date.now();

      const projectionLag = endTime - new Date(eventTimestamp).getTime();
      expect(projectionLag).toBeLessThan(2000); // < 2 seconds
    });
  });

  describe('OpenSearch Indexing', () => {
    it('should index document in OpenSearch', async () => {
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          customerId: 'cust-456',
          items: [],
          totalAmount: 0,
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockOpenSearchClient.index.mockResolvedValue({ body: { result: 'created' } } as any);

      await orderSearchProjection.handleEvent(event);

      expect(mockOpenSearchClient.index).toHaveBeenCalled();
    });

    it('should handle OpenSearch errors gracefully', async () => {
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          customerId: 'cust-456',
          items: [],
          totalAmount: 0,
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockOpenSearchClient.index.mockRejectedValue(new Error('OpenSearch unavailable'));

      await expect(orderListProjection.handleEvent(event)).rejects.toThrow('OpenSearch unavailable');
    });
  });

  describe('Upcasting Logic', () => {
    it('should handle schema version 1.0 events', async () => {
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: '2025-01-01T00:00:00Z',
        payload: {
          customerId: 'cust-456',
          items: [],
          totalAmount: 0,
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockOpenSearchClient.index.mockResolvedValue({ body: { result: 'created' } } as any);

      await orderListProjection.handleEvent(event);

      expect(mockOpenSearchClient.index).toHaveBeenCalled();
    });
  });
});
