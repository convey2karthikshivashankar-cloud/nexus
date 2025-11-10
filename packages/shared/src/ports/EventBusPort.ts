import { DomainEvent } from '../types';

/**
 * Vendor-neutral Event Bus interface
 * Implementations: Kinesis (AWS), Pub/Sub (GCP), Kafka (Open Source)
 */
export interface EventBusPort {
  /**
   * Publish event to the bus
   */
  publish(event: DomainEvent, partitionKey: string): Promise<void>;

  /**
   * Subscribe to events
   */
  subscribe(
    eventTypes: string[],
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void>;

  /**
   * Unsubscribe from events
   */
  unsubscribe?(subscriptionId: string): Promise<void>;
}

/**
 * Queue-based event bus for non-critical events
 * Implementations: SNS/SQS (AWS), Pub/Sub (GCP), RabbitMQ (Open Source)
 */
export interface QueueEventBusPort {
  /**
   * Publish to topic with fan-out
   */
  publishToTopic(topic: string, event: DomainEvent): Promise<void>;

  /**
   * Subscribe queue to topic
   */
  subscribeQueue(
    queueName: string,
    topic: string,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void>;

  /**
   * Get dead letter queue messages
   */
  getDLQMessages(queueName: string): Promise<DomainEvent[]>;
}
