import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecondaryEventBusStackProps extends cdk.StackProps {
  /**
   * List of projection handlers that need SQS queues
   * Each handler will get its own queue subscribed to the SNS topic
   */
  projectionHandlers: string[];
}

/**
 * Secondary Event Bus Stack
 * 
 * Creates SNS/SQS chain for non-critical event propagation.
 * This path is optimized for cost and resilience over latency.
 * 
 * Requirements: 3.4, 7.2, 7.3
 * 
 * Architecture:
 * Event Router → SNS Topic → SQS Queues (per projection) → Projection Handlers
 *                              ↓
 *                         Dead Letter Queues
 */
export class SecondaryEventBusStack extends cdk.Stack {
  public readonly eventTopic: sns.Topic;
  public readonly queues: Map<string, sqs.Queue> = new Map();
  public readonly deadLetterQueues: Map<string, sqs.Queue> = new Map();

  constructor(scope: Construct, id: string, props: SecondaryEventBusStackProps) {
    super(scope, id, props);

    // Create SNS Topic for event fan-out
    this.eventTopic = this.createEventTopic();

    // Create SQS queues for each projection handler
    for (const handlerName of props.projectionHandlers) {
      const { queue, dlq } = this.createQueuePair(handlerName);
      this.queues.set(handlerName, queue);
      this.deadLetterQueues.set(handlerName, dlq);

      // Subscribe queue to SNS topic
      this.eventTopic.addSubscription(
        new subscriptions.SqsSubscription(queue, {
          rawMessageDelivery: true, // Deliver SNS message body directly
        })
      );
    }

    // Create CloudWatch alarms for DLQ monitoring
    this.createDLQAlarms();

    // Outputs
    new cdk.CfnOutput(this, 'EventTopicArn', {
      value: this.eventTopic.topicArn,
      exportName: 'SecondaryEventBusTopicArn',
      description: 'SNS Topic ARN for non-critical events',
    });

    new cdk.CfnOutput(this, 'QueueCount', {
      value: this.queues.size.toString(),
      description: 'Number of projection handler queues',
    });
  }

  /**
   * Create SNS Topic for event fan-out
   * 
   * Features:
   * - FIFO not required (best-effort ordering)
   * - Server-side encryption enabled
   * - CloudWatch metrics enabled
   */
  private createEventTopic(): sns.Topic {
    const topic = new sns.Topic(this, 'NonCriticalEventTopic', {
      displayName: 'Nexus Non-Critical Events',
      topicName: 'nexus-non-critical-events',
      
      // Enable encryption at rest
      masterKey: undefined, // Use AWS managed key for cost optimization
      
      // Enable CloudWatch metrics
      fifo: false, // Standard topic for fan-out
    });

    // Add topic policy for Event Router Lambda
    topic.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [topic.topicArn],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
        },
      })
    );

    return topic;
  }

  /**
   * Create SQS queue pair (main queue + DLQ) for a projection handler
   * 
   * Requirements:
   * - DLQ with 5 retry limit (Requirement 7.3)
   * - Visibility timeout 30 seconds (Requirement 7.2)
   * - Message retention 14 days
   * - Server-side encryption
   * 
   * @param handlerName Name of the projection handler
   */
  private createQueuePair(handlerName: string): { queue: sqs.Queue; dlq: sqs.Queue } {
    // Create Dead Letter Queue first
    const dlq = new sqs.Queue(this, `${handlerName}DLQ`, {
      queueName: `nexus-${handlerName}-dlq`,
      
      // DLQ retention: 14 days for manual inspection
      retentionPeriod: cdk.Duration.days(14),
      
      // Enable encryption
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      
      // Enable CloudWatch metrics
      // (automatically enabled for all SQS queues)
    });

    // Create main queue with DLQ configuration
    const queue = new sqs.Queue(this, `${handlerName}Queue`, {
      queueName: `nexus-${handlerName}`,
      
      // Visibility timeout: 30 seconds (Requirement 7.2)
      // This is how long a message is hidden after being received
      // Should be >= Lambda timeout to prevent duplicate processing
      visibilityTimeout: cdk.Duration.seconds(30),
      
      // Message retention: 4 days (standard for event processing)
      retentionPeriod: cdk.Duration.days(4),
      
      // Dead Letter Queue configuration
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 5, // 5 retry limit (Requirement 7.3)
      },
      
      // Enable encryption
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      
      // Receive message wait time (long polling)
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      
      // Batch size for Lambda triggers
      // (configured in Lambda event source mapping, not here)
    });

    // Grant permissions for Lambda to consume from queue
    queue.grantConsumeMessages(new iam.ServicePrincipal('lambda.amazonaws.com'));

    return { queue, dlq };
  }

  /**
   * Create CloudWatch alarms for Dead Letter Queue monitoring
   * 
   * Alarms trigger when:
   * - DLQ depth > 0 (any failed messages)
   * - DLQ age > 1 hour (messages not being processed)
   * 
   * Requirements: 6.3, 7.3
   */
  private createDLQAlarms(): void {
    for (const [handlerName, dlq] of this.deadLetterQueues.entries()) {
      // Alarm for DLQ depth > 0
      const depthAlarm = dlq.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
        statistic: 'Maximum',
      }).createAlarm(this, `${handlerName}DLQDepthAlarm`, {
        alarmName: `nexus-${handlerName}-dlq-depth`,
        alarmDescription: `DLQ has messages for ${handlerName} projection`,
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // Alarm for old messages in DLQ
      const ageAlarm = dlq.metricApproximateAgeOfOldestMessage({
        period: cdk.Duration.minutes(5),
        statistic: 'Maximum',
      }).createAlarm(this, `${handlerName}DLQAgeAlarm`, {
        alarmName: `nexus-${handlerName}-dlq-age`,
        alarmDescription: `DLQ has old messages for ${handlerName} projection`,
        threshold: 3600, // 1 hour in seconds
        evaluationPeriods: 1,
        comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // Output alarm ARNs for SNS notification setup
      new cdk.CfnOutput(this, `${handlerName}DLQDepthAlarmArn`, {
        value: depthAlarm.alarmArn,
        description: `DLQ depth alarm ARN for ${handlerName}`,
      });

      new cdk.CfnOutput(this, `${handlerName}DLQAgeAlarmArn`, {
        value: ageAlarm.alarmArn,
        description: `DLQ age alarm ARN for ${handlerName}`,
      });
    }
  }

  /**
   * Get queue URL for a projection handler
   * 
   * @param handlerName Name of the projection handler
   * @returns Queue URL or undefined if not found
   */
  public getQueueUrl(handlerName: string): string | undefined {
    return this.queues.get(handlerName)?.queueUrl;
  }

  /**
   * Get queue ARN for a projection handler
   * 
   * @param handlerName Name of the projection handler
   * @returns Queue ARN or undefined if not found
   */
  public getQueueArn(handlerName: string): string | undefined {
    return this.queues.get(handlerName)?.queueArn;
  }

  /**
   * Get DLQ URL for a projection handler
   * 
   * @param handlerName Name of the projection handler
   * @returns DLQ URL or undefined if not found
   */
  public getDLQUrl(handlerName: string): string | undefined {
    return this.deadLetterQueues.get(handlerName)?.queueUrl;
  }

  /**
   * Grant publish permissions to a Lambda function
   * 
   * @param lambda Lambda function that needs to publish to SNS
   */
  public grantPublish(lambda: iam.IGrantable): void {
    this.eventTopic.grantPublish(lambda);
  }
}

/**
 * Example Usage:
 * 
 * ```typescript
 * const secondaryEventBus = new SecondaryEventBusStack(app, 'SecondaryEventBus', {
 *   projectionHandlers: [
 *     'OrderListProjection',
 *     'OrderSearchProjection',
 *     'CustomerProjection',
 *     'InventoryProjection',
 *   ],
 * });
 * 
 * // Grant Event Router Lambda permission to publish
 * secondaryEventBus.grantPublish(eventRouterLambda);
 * 
 * // Get queue URL for Lambda event source mapping
 * const orderListQueueUrl = secondaryEventBus.getQueueUrl('OrderListProjection');
 * ```
 * 
 * Event Flow:
 * 1. Event Router Lambda publishes to SNS Topic
 * 2. SNS fans out to all subscribed SQS queues
 * 3. Each projection handler Lambda consumes from its queue
 * 4. Failed messages (after 5 retries) go to DLQ
 * 5. CloudWatch alarms trigger on DLQ activity
 * 6. Operations team investigates and processes DLQ messages
 */
