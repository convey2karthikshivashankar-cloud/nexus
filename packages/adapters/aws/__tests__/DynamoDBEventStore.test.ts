import { DynamoDBEventStore, DynamoDBEventStoreConfig } from '../DynamoDBEventStore';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn(),
    }),
  },
  BatchWriteCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

// Mock policyEnforcer
jest.mock('@nexus/shared', () => ({
  policyEnforcer: {
    validateDatabaseOperation: jest.fn(),
    validateEventPublish: jest.fn(),
  },
}));

describe('DynamoDBEventStore', () => {
  let eventStore: DynamoDBEventStore;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const config: DynamoDBEventStoreConfig = {
      tableName: 'TestEventStore',
      region: 'us-east-1',
      enableSchemaValidation: false,
      rateLimit: 10,
      rateWindowMs: 60000,
      maxRateLimitClients: 100,
    };

    eventStore = new DynamoDBEventStore(config);
    
    // Get the mock send function
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    mockSend = DynamoDBDocumentClient.from().send;
  });

  afterEach(() => {
    eventStore.destroy();
  });

  describe('Constructor Validation', () => {
    it('should throw error when tableName is empty', () => {
      expect(() => {
        new DynamoDBEventStore({
          tableName: '',
          region: 'us-east-1',
        });
      }).toThrow('tableName is required');
    });

    it('should throw error when tableName is whitespace', () => {
      expect(() => {
        new DynamoDBEventStore({
          tableName: '   ',
          region: 'us-east-1',
        });
      }).toThrow('tableName is required');
    });

    it('should throw error when region is empty', () => {
      expect(() => {
        new DynamoDBEventStore({
          tableName: 'TestTable',
          region: '',
        });
      }).toThrow('region is required');
    });

    it('should throw error when region is whitespace', () => {
      expect(() => {
        new DynamoDBEventStore({
          tableName: 'TestTable',
          region: '   ',
        });
      }).toThrow('region is required');
    });

    it('should use default rate limit values when not provided', () => {
      const store = new DynamoDBEventStore({
        tableName: 'TestTable',
        region: 'us-east-1',
      });

      // Store should be created without error
      expect(store).toBeDefined();
      store.destroy();
    });

    it('should use custom rate limit values when provided', () => {
      const store = new DynamoDBEventStore({
        tableName: 'TestTable',
        region: 'us-east-1',
        rateLimit: 20,
        rateWindowMs: 120000,
        maxRateLimitClients: 5000,
      });

      expect(store).toBeDefined();
      store.destroy();
    });
  });

  describe('append', () => {
    it('should call policy enforcer for database operation', async () => {
      const { policyEnforcer } = require('@nexus/shared');
      mockSend.mockResolvedValue({});

      const events = [
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

      await eventStore.append(events);

      expect(policyEnforcer.validateDatabaseOperation).toHaveBeenCalledWith(
        'EventStore',
        'INSERT'
      );
    });

    it('should batch write events to DynamoDB', async () => {
      mockSend.mockResolvedValue({});

      const events = [
        {
          eventId: 'evt-001',
          eventType: 'TestEvent',
          aggregateId: 'agg-123',
          aggregateVersion: 1,
          timestamp: new Date().toISOString(),
          payload: { data: 'test' },
          metadata: {
            correlationId: 'corr-123',
            causationId: 'cmd-456',
            userId: 'user-789',
            schemaVersion: '1.0.0',
          },
        },
      ];

      await eventStore.append(events);

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should query events by aggregateId', async () => {
      const expectedEvents = [
        {
          eventId: 'evt-001',
          eventType: 'TestEvent',
          aggregateId: 'agg-123',
          aggregateVersion: 1,
          timestamp: new Date().toISOString(),
          payload: {},
          metadata: {},
        },
      ];

      mockSend.mockResolvedValue({ Items: expectedEvents });

      const result = await eventStore.getEvents('agg-123');

      expect(result).toEqual(expectedEvents);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return empty array when no events found', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      const result = await eventStore.getEvents('non-existent');

      expect(result).toEqual([]);
    });

    it('should handle undefined Items in response', async () => {
      mockSend.mockResolvedValue({});

      const result = await eventStore.getEvents('agg-123');

      expect(result).toEqual([]);
    });
  });

  describe('getEventsByTimeRange', () => {
    it('should enforce rate limiting', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      // Make 10 requests (at the limit)
      for (let i = 0; i < 10; i++) {
        await eventStore.getEventsByTimeRange(
          'TestEvent',
          '2025-01-01T00:00:00Z',
          '2025-01-02T00:00:00Z',
          100,
          'client-123'
        );
      }

      // 11th request should fail
      await expect(
        eventStore.getEventsByTimeRange(
          'TestEvent',
          '2025-01-01T00:00:00Z',
          '2025-01-02T00:00:00Z',
          100,
          'client-123'
        )
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should allow requests from different clients', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      // Make requests from different clients
      await eventStore.getEventsByTimeRange(
        'TestEvent',
        '2025-01-01T00:00:00Z',
        '2025-01-02T00:00:00Z',
        100,
        'client-1'
      );

      await eventStore.getEventsByTimeRange(
        'TestEvent',
        '2025-01-01T00:00:00Z',
        '2025-01-02T00:00:00Z',
        100,
        'client-2'
      );

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const store = new DynamoDBEventStore({
        tableName: 'TestTable',
        region: 'us-east-1',
      });

      // Should not throw
      expect(() => store.destroy()).not.toThrow();
    });
  });
});
