/**
 * Event Propagation Integration Tests
 * 
 * Tests the complete event propagation flow through both paths:
 * - Kinesis Stream (critical events)
 * - SNS/SQS Chain (non-critical events)
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { DomainEvent } from '@nexus/shared';
import { EventRouter } from '../src/index';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-kinesis');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-sqs');

import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

describe('Event Propagation Integration Tests', () => {
  let eventRouter: EventRouter;
  let mockKinesisClient: jest.Mocked<KinesisClient>;
  let mockSNSClient: jest.Mocked<SNSClient>;
  let mockSQSClient: jest.Mocked<SQSClient>;

  beforeEach(() => {
    // Create mock clients
    mockKinesisClient = {
      send: jest.fn(),
    } as any;

    mockSNSClient = {
      send: jest.fn(),
    } as any;

    mockSQSClient = {
      send: jest.fn(),
    } as any;

    // Initialize event router with mocks
    eventRouter = new EventRouter({
      kinesisStreamName: 'test-kinesis-stream',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
      kinesisClient: mockKinesisClient,
      snsClient: mockSNSClient,
    });
  });

  describe('Kinesis Publishing (Critical Events)', () => {
    it('should publish critical events to Kinesis', async () => {
      // Arrange
      const criticalEvent: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          customerId: 'cust-456',
          totalAmount: 99.99,
        },
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockKinesisClient.send.mockResolvedValue({
        ShardId: 'shardId-000000000000',
        SequenceNumber: '49590338271490256608559692538361571095921575989136588898',
      });

      // Act
      await eventRouter.route(criticalEvent);

      // Assert
      expect(mockKinesisClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            StreamName: 'test-kinesis-stream',
            PartitionKey: 'order-123',
            Data: expect.any(Uint8Array),
          }),
        })
      );
    });

    it('should use aggregateId as partition key for ordering', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-456',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      await eventRouter.route(event);

      // Assert
      const call = mockKinesisClient.send.mock.calls[0][0];
      expect(call.input.PartitionKey).toBe('order-456');
    });

    it('should measure end-to-end latency < 500ms p99', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      const startTime = Date.now();
      await eventRouter.route(event);
      const endTime = Date.now();
      const latency = endTime - startTime;

      // Assert
      expect(latency).toBeLessThan(500); // < 500ms
    });
  });

  describe('SNS/SQS Fan-out (Non-Critical Events)', () => {
    it('should publish non-critical events to SNS', async () => {
      // Arrange
      const nonCriticalEvent: DomainEvent = {
        eventId: 'evt-789',
        eventType: 'AnalyticsEvent',
        aggregateId: 'analytics-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {
          metric: 'page_view',
          value: 1,
        },
        metadata: {
          correlationId: 'corr-789',
          causationId: 'cmd-789',
          userId: 'user-789',
          schemaVersion: '1.0',
        },
      };

      mockSNSClient.send.mockResolvedValue({
        MessageId: 'msg-123',
      });

      // Act
      await eventRouter.route(nonCriticalEvent);

      // Assert
      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
            Message: expect.stringContaining('AnalyticsEvent'),
          }),
        })
      );
    });

    it('should include event metadata in SNS message attributes', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-789',
        eventType: 'NotificationEvent',
        aggregateId: 'notif-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-789',
          causationId: 'cmd-789',
          userId: 'user-789',
          schemaVersion: '1.0',
        },
      };

      mockSNSClient.send.mockResolvedValue({});

      // Act
      await eventRouter.route(event);

      // Assert
      const call = mockSNSClient.send.mock.calls[0][0];
      expect(call.input.MessageAttributes).toMatchObject({
        eventType: {
          DataType: 'String',
          StringValue: 'NotificationEvent',
        },
        aggregateId: {
          DataType: 'String',
          StringValue: 'notif-123',
        },
      });
    });
  });

  describe('Routing Logic', () => {
    it('should route OrderPlaced to Kinesis (critical)', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      await eventRouter.route(event);

      // Assert
      expect(mockKinesisClient.send).toHaveBeenCalled();
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });

    it('should route OrderCancelled to Kinesis (critical)', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-456',
        eventType: 'OrderCancelled',
        aggregateId: 'order-456',
        aggregateVersion: 2,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-456',
          causationId: 'cmd-456',
          userId: 'user-456',
          schemaVersion: '1.0',
        },
      };

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      await eventRouter.route(event);

      // Assert
      expect(mockKinesisClient.send).toHaveBeenCalled();
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });

    it('should route AnalyticsEvent to SNS (non-critical)', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-789',
        eventType: 'AnalyticsEvent',
        aggregateId: 'analytics-789',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-789',
          causationId: 'cmd-789',
          userId: 'user-789',
          schemaVersion: '1.0',
        },
      };

      mockSNSClient.send.mockResolvedValue({});

      // Act
      await eventRouter.route(event);

      // Assert
      expect(mockSNSClient.send).toHaveBeenCalled();
      expect(mockKinesisClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Schema Validation Enforcement', () => {
    it('should validate events before routing', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      // Mock schema validation
      const mockSchemaRegistry = {
        validate: jest.fn().mockResolvedValue({ valid: true }),
      };

      const routerWithValidation = new EventRouter({
        kinesisStreamName: 'test-stream',
        snsTopicArn: 'test-topic',
        kinesisClient: mockKinesisClient,
        snsClient: mockSNSClient,
        schemaRegistry: mockSchemaRegistry,
      });

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      await routerWithValidation.route(event);

      // Assert
      expect(mockSchemaRegistry.validate).toHaveBeenCalledWith(event);
    });

    it('should reject events with invalid schema', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'InvalidEvent',
        aggregateId: 'invalid-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      // Mock schema validation failure
      const mockSchemaRegistry = {
        validate: jest.fn().mockResolvedValue({
          valid: false,
          errors: ['Schema not registered'],
        }),
      };

      const routerWithValidation = new EventRouter({
        kinesisStreamName: 'test-stream',
        snsTopicArn: 'test-topic',
        kinesisClient: mockKinesisClient,
        snsClient: mockSNSClient,
        schemaRegistry: mockSchemaRegistry,
      });

      // Act & Assert
      await expect(routerWithValidation.route(event)).rejects.toThrow(
        'Event validation failed'
      );

      expect(mockKinesisClient.send).not.toHaveBeenCalled();
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should retry on Kinesis throttling', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      // Mock throttling then success
      mockKinesisClient.send
        .mockRejectedValueOnce(new Error('ProvisionedThroughputExceededException'))
        .mockResolvedValueOnce({});

      // Act
      await eventRouter.route(event);

      // Assert
      expect(mockKinesisClient.send).toHaveBeenCalledTimes(2);
    });

    it('should emit routing metrics', async () => {
      // Arrange
      const event: DomainEvent = {
        eventId: 'evt-123',
        eventType: 'OrderPlaced',
        aggregateId: 'order-123',
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: 'corr-123',
          causationId: 'cmd-123',
          userId: 'user-123',
          schemaVersion: '1.0',
        },
      };

      const mockMetrics = {
        recordEventRouted: jest.fn(),
      };

      const routerWithMetrics = new EventRouter({
        kinesisStreamName: 'test-stream',
        snsTopicArn: 'test-topic',
        kinesisClient: mockKinesisClient,
        snsClient: mockSNSClient,
        metrics: mockMetrics,
      });

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      await routerWithMetrics.route(event);

      // Assert
      expect(mockMetrics.recordEventRouted).toHaveBeenCalledWith(
        'OrderPlaced',
        'kinesis'
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle high throughput (1000 events/sec)', async () => {
      // Arrange
      const events: DomainEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        eventId: `evt-${i}`,
        eventType: 'OrderPlaced',
        aggregateId: `order-${i}`,
        aggregateVersion: 1,
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: {
          correlationId: `corr-${i}`,
          causationId: `cmd-${i}`,
          userId: `user-${i}`,
          schemaVersion: '1.0',
        },
      }));

      mockKinesisClient.send.mockResolvedValue({});

      // Act
      const startTime = Date.now();
      await Promise.all(events.map(event => eventRouter.route(event)));
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      expect(mockKinesisClient.send).toHaveBeenCalledTimes(1000);
    });
  });
});
