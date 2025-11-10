import { DynamoDBStreamEvent } from 'aws-lambda';
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { DomainEvent, SchemaRegistryPort, AdapterFactory, policyEnforcer } from '@nexus/shared';

const kinesisClient = new KinesisClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

const CORE_EVENT_STREAM = process.env.CORE_EVENT_STREAM_NAME!;
const NON_CRITICAL_TOPIC = process.env.NON_CRITICAL_TOPIC_ARN!;

// Core events that need low latency (< 500ms p99)
const CORE_EVENT_TYPES = new Set([
  'OrderPlaced',
  'OrderCancelled',
  'PaymentProcessed',
  'PaymentCompleted',
  'PaymentFailed',
  'InventoryReserved',
  'InventoryReleased',
  'ShipmentScheduled',
]);

// Non-critical events for queue-based propagation
const NON_CRITICAL_EVENT_TYPES = new Set([
  'CartAbandoned',
  'EmailSent',
  'NotificationDelivered',
  'AnalyticsTracked',
  'AuditLogCreated',
]);

let schemaRegistry: SchemaRegistryPort;

interface RoutingMetrics {
  totalEvents: number;
  coreEvents: number;
  nonCriticalEvents: number;
  validationFailures: number;
  routingErrors: number;
  startTime: number;
}

async function initializeSchemaRegistry() {
  if (!schemaRegistry) {
    schemaRegistry = await AdapterFactory.createSchemaRegistry({
      provider: 'aws',
      schemaRegistry: {
        registryName: process.env.SCHEMA_REGISTRY_NAME!,
        region: process.env.AWS_REGION!,
      },
      eventStore: {},
      snapshotStore: {},
    });
  }
}

export const handler = async (event: DynamoDBStreamEvent) => {
  const metrics: RoutingMetrics = {
    totalEvents: 0,
    coreEvents: 0,
    nonCriticalEvents: 0,
    validationFailures: 0,
    routingErrors: 0,
    startTime: Date.now(),
  };

  await initializeSchemaRegistry();

  console.log(`[EventRouter] Processing ${event.Records.length} DynamoDB stream records`);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      metrics.totalEvents++;

      try {
        const newImage = record.dynamodb?.NewImage;
        if (!newImage) {
          console.warn('[EventRouter] Record missing NewImage', { record });
          continue;
        }

        // Convert DynamoDB record to DomainEvent
        const domainEvent: DomainEvent = {
          eventId: newImage.eventId.S!,
          eventType: newImage.eventType.S!,
          aggregateId: newImage.aggregateId.S!,
          aggregateVersion: parseInt(newImage.version.N!),
          timestamp: newImage.timestamp.S!,
          payload: JSON.parse(newImage.payload.S || '{}'),
          metadata: JSON.parse(newImage.metadata.S || '{}'),
        };

        console.log(`[EventRouter] Processing event: ${domainEvent.eventType} (${domainEvent.eventId})`);

        // GOVERNANCE: Validate against schema registry before routing
        const validation = await schemaRegistry.validate(domainEvent);
        if (!validation.valid) {
          metrics.validationFailures++;
          console.error('[EventRouter] Schema validation failed', {
            eventType: domainEvent.eventType,
            eventId: domainEvent.eventId,
            errors: validation.errors,
          });
          
          // Policy enforcement: Track validation failure
          try {
            policyEnforcer.validateEventPublish(domainEvent.eventType, false);
          } catch (e) {
            // Already logged by policy enforcer
          }
          
          continue; // Skip invalid events
        }

        // Route based on event criticality
        const routingStart = Date.now();
        
        if (isCoreEvent(domainEvent.eventType)) {
          await publishToKinesis(domainEvent);
          metrics.coreEvents++;
          
          const latency = Date.now() - routingStart;
          console.log(`[EventRouter] Routed to Kinesis: ${domainEvent.eventType} (${latency}ms)`);
          
          // Emit latency metric
          await emitLatencyMetric('kinesis', latency);
        } else {
          await publishToSNS(domainEvent);
          metrics.nonCriticalEvents++;
          
          const latency = Date.now() - routingStart;
          console.log(`[EventRouter] Routed to SNS: ${domainEvent.eventType} (${latency}ms)`);
          
          // Emit latency metric
          await emitLatencyMetric('sns', latency);
        }

      } catch (error: any) {
        metrics.routingErrors++;
        console.error('[EventRouter] Error routing event', {
          error: error.message,
          stack: error.stack,
          record,
        });
      }
    }
  }

  // Emit summary metrics
  const totalDuration = Date.now() - metrics.startTime;
  console.log('[EventRouter] Batch processing complete', {
    ...metrics,
    duration: totalDuration,
    avgLatency: totalDuration / metrics.totalEvents,
  });

  await emitBatchMetrics(metrics);
};

function isCoreEvent(eventType: string): boolean {
  return CORE_EVENT_TYPES.has(eventType);
}

async function publishToKinesis(event: DomainEvent): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await kinesisClient.send(
        new PutRecordCommand({
          StreamName: CORE_EVENT_STREAM,
          PartitionKey: event.aggregateId, // Ensures ordering per aggregate
          Data: Buffer.from(JSON.stringify(event)),
        })
      );
      return;
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error('[EventRouter] Failed to publish to Kinesis after retries', {
          eventType: event.eventType,
          eventId: event.eventId,
          attempts: attempt,
          error: error.message,
        });
        throw error;
      }
      
      // Exponential backoff
      const backoffMs = Math.pow(2, attempt) * 100;
      console.warn(`[EventRouter] Kinesis publish failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(backoffMs);
    }
  }
}

async function publishToSNS(event: DomainEvent): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: NON_CRITICAL_TOPIC,
          Message: JSON.stringify(event),
          MessageAttributes: {
            eventType: {
              DataType: 'String',
              StringValue: event.eventType,
            },
            aggregateId: {
              DataType: 'String',
              StringValue: event.aggregateId,
            },
            correlationId: {
              DataType: 'String',
              StringValue: event.metadata.correlationId || '',
            },
          },
        })
      );
      return;
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error('[EventRouter] Failed to publish to SNS after retries', {
          eventType: event.eventType,
          eventId: event.eventId,
          attempts: attempt,
          error: error.message,
        });
        throw error;
      }
      
      // Exponential backoff
      const backoffMs = Math.pow(2, attempt) * 100;
      console.warn(`[EventRouter] SNS publish failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(backoffMs);
    }
  }
}

async function emitLatencyMetric(path: 'kinesis' | 'sns', latencyMs: number): Promise<void> {
  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'Nexus/EventRouter',
        MetricData: [
          {
            MetricName: 'RoutingLatency',
            Value: latencyMs,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'Path',
                Value: path,
              },
            ],
          },
        ],
      })
    );
  } catch (error) {
    // Don't fail routing if metrics fail
    console.warn('[EventRouter] Failed to emit latency metric', { error });
  }
}

async function emitBatchMetrics(metrics: RoutingMetrics): Promise<void> {
  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'Nexus/EventRouter',
        MetricData: [
          {
            MetricName: 'TotalEvents',
            Value: metrics.totalEvents,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'CoreEvents',
            Value: metrics.coreEvents,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'NonCriticalEvents',
            Value: metrics.nonCriticalEvents,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ValidationFailures',
            Value: metrics.validationFailures,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'RoutingErrors',
            Value: metrics.routingErrors,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'BatchProcessingDuration',
            Value: Date.now() - metrics.startTime,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
          },
        ],
      })
    );
  } catch (error) {
    console.warn('[EventRouter] Failed to emit batch metrics', { error });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
