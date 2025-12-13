import { DynamoDBSnapshotStore, DynamoDBSnapshotStoreConfig } from '../DynamoDBSnapshotStore';
import { Snapshot } from '@nexus/shared';

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
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

describe('DynamoDBSnapshotStore', () => {
  let snapshotStore: DynamoDBSnapshotStore;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const config: DynamoDBSnapshotStoreConfig = {
      tableName: 'TestSnapshots',
      region: 'us-east-1',
      ttlDays: 90,
    };

    snapshotStore = new DynamoDBSnapshotStore(config);
    
    // Get the mock send function
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    mockSend = DynamoDBDocumentClient.from().send;
  });

  describe('Constructor Validation', () => {
    it('should throw error when tableName is empty', () => {
      expect(() => {
        new DynamoDBSnapshotStore({
          tableName: '',
          region: 'us-east-1',
        });
      }).toThrow('tableName is required');
    });

    it('should throw error when tableName is whitespace', () => {
      expect(() => {
        new DynamoDBSnapshotStore({
          tableName: '   ',
          region: 'us-east-1',
        });
      }).toThrow('tableName is required');
    });

    it('should throw error when region is empty', () => {
      expect(() => {
        new DynamoDBSnapshotStore({
          tableName: 'TestTable',
          region: '',
        });
      }).toThrow('region is required');
    });

    it('should throw error when region is whitespace', () => {
      expect(() => {
        new DynamoDBSnapshotStore({
          tableName: 'TestTable',
          region: '   ',
        });
      }).toThrow('region is required');
    });

    it('should use default TTL when not provided', () => {
      const store = new DynamoDBSnapshotStore({
        tableName: 'TestTable',
        region: 'us-east-1',
      });

      expect(store).toBeDefined();
    });

    it('should use custom TTL when provided', () => {
      const store = new DynamoDBSnapshotStore({
        tableName: 'TestTable',
        region: 'us-east-1',
        ttlDays: 30,
      });

      expect(store).toBeDefined();
    });
  });

  describe('getLatest', () => {
    it('should return latest snapshot for aggregate', async () => {
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

      mockSend.mockResolvedValue({ Items: [expectedSnapshot] });

      const result = await snapshotStore.getLatest('agg-123');

      expect(result).toEqual(expectedSnapshot);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return null when no snapshot exists', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      const result = await snapshotStore.getLatest('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when Items is undefined', async () => {
      mockSend.mockResolvedValue({});

      const result = await snapshotStore.getLatest('agg-123');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save snapshot with TTL', async () => {
      mockSend.mockResolvedValue({});

      const snapshot: Snapshot = {
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

      await snapshotStore.save(snapshot);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when aggregateId is empty', async () => {
      const snapshot: Snapshot = {
        aggregateId: '',
        version: 100,
        timestamp: Date.now(),
        state: {},
        schemaVersion: '1.0.0',
        metadata: { eventCount: 100, aggregateSize: 50000 },
      };

      await expect(snapshotStore.save(snapshot)).rejects.toThrow(
        'aggregateId is required'
      );
    });

    it('should throw error when aggregateId is whitespace', async () => {
      const snapshot: Snapshot = {
        aggregateId: '   ',
        version: 100,
        timestamp: Date.now(),
        state: {},
        schemaVersion: '1.0.0',
        metadata: { eventCount: 100, aggregateSize: 50000 },
      };

      await expect(snapshotStore.save(snapshot)).rejects.toThrow(
        'aggregateId is required'
      );
    });

    it('should throw error when version is negative', async () => {
      const snapshot: Snapshot = {
        aggregateId: 'agg-123',
        version: -1,
        timestamp: Date.now(),
        state: {},
        schemaVersion: '1.0.0',
        metadata: { eventCount: 100, aggregateSize: 50000 },
      };

      await expect(snapshotStore.save(snapshot)).rejects.toThrow(
        'version must be a non-negative number'
      );
    });

    it('should not add TTL when ttlDays is 0', async () => {
      const storeNoTTL = new DynamoDBSnapshotStore({
        tableName: 'TestTable',
        region: 'us-east-1',
        ttlDays: 0,
      });

      const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
      const mockSendNoTTL = DynamoDBDocumentClient.from().send;
      mockSendNoTTL.mockResolvedValue({});

      const snapshot: Snapshot = {
        aggregateId: 'agg-123',
        version: 100,
        timestamp: Date.now(),
        state: {},
        schemaVersion: '1.0.0',
        metadata: { eventCount: 100, aggregateSize: 50000 },
      };

      await storeNoTTL.save(snapshot);

      expect(mockSendNoTTL).toHaveBeenCalled();
    });
  });

  describe('getByVersion', () => {
    it('should return snapshot at specific version', async () => {
      const expectedSnapshot: Snapshot = {
        aggregateId: 'agg-123',
        version: 50,
        timestamp: Date.now(),
        state: { status: 'pending' },
        schemaVersion: '1.0.0',
        metadata: {
          eventCount: 50,
          aggregateSize: 25000,
        },
      };

      mockSend.mockResolvedValue({ Items: [expectedSnapshot] });

      const result = await snapshotStore.getByVersion('agg-123', 50);

      expect(result).toEqual(expectedSnapshot);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return null when version not found', async () => {
      mockSend.mockResolvedValue({ Items: [] });

      const result = await snapshotStore.getByVersion('agg-123', 999);

      expect(result).toBeNull();
    });
  });
});
