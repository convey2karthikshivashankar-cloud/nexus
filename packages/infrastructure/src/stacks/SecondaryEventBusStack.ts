import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Secondary Event Bus Stack - SNS/SQS Chain
 * 
 * Implements the secondary event propagation path for non-critical events
 * using SNS for fan-out and SQS for reliable queue-based delivery.
 * 
 * Use cases:
 * - External integrations
 * - Notification workflows
 * - Retry-heavy operations
 * - At-least-once delivery semantics
 */
export class SecondaryEventBusStack extends cdk.Stack {
  public readonly topicArn: string;
  public readonly dlqArn: string;
  public readonly projectionQueues: Map<string, string> = new Map();

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS Topic for event fan-out
    const eventTopic = new sns.Topic(this, 'SecondaryEventTopic', {
      displayName: 'Nexus Secondary Event Bus',
      topicName: 'nexus-secondary-events',
    });

    this.topicArn = eventTopic.topicArn;

    // Create Dead Letter Queue for failed messages
    const dlq = new sqs.Queue(this, 'EventDLQ', {
      queueName: 'nexus-event-dlq',
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    this.dlqArn = dlq.queueArn;

    // Create projection-specific queues
    const projections = [
      'order-analytics',
      'cart-abandonment',
      'notification-handler',
      'external-integration',
    ];

    for (const projectionName of projections) {
      const queue = new sqs.Queue(this, `${projectionName}Queue`, {
        queueName: `nexus-${projectionName}-queue`,
        visibilityTimeout: cdk.Duration.seconds(30),
        receiveMessageWaitTime: cdk.Duration.seconds(20), // Long polling
        deadLetterQueue: {
          queue: dlq,
          maxReceiveCount: 5, // Retry 5 times before DLQ
        },
      });

      // Subscribe queue to SNS topic
      eventTopic.addSubscription(
        new subscriptions.SqsSubscription(queue, {
          rawMessageDelivery: false,
        })
      );

      this.projectionQueues.set(projectionName, queue.queueArn);

      // Output queue ARN
      new cdk.CfnOutput(this, `${projectionName}QueueArn`, {
        value: queue.queueArn,
        exportName: `${projectionName}QueueArn`,
      });

      // Output queue URL
      new cdk.CfnOutput(this, `${projectionName}QueueUrl`, {
        value: queue.queueUrl,
        exportName: `${projectionName}QueueUrl`,
      });
    }

    // Create IAM role for Lambda functions to publish to SNS
    const publisherRole = new iam.Role(this, 'EventPublisherRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions to publish to secondary event bus',
    });

    publisherRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: [eventTopic.topicArn],
      })
    );

    // Create IAM role for Lambda functions to consume from SQS
    const consumerRole = new iam.Role(this, 'EventConsumerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions to consume from projection queues',
    });

    consumerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes',
          'sqs:ChangeMessageVisibility',
        ],
        resources: Array.from(this.projectionQueues.values()).concat(dlq.queueArn),
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'SecondaryEventTopicArn', {
      value: this.topicArn,
      exportName: 'SecondaryEventTopicArn',
    });

    new cdk.CfnOutput(this, 'EventDLQArn', {
      value: this.dlqArn,
      exportName: 'EventDLQArn',
    });

    new cdk.CfnOutput(this, 'EventDLQUrl', {
      value: dlq.queueUrl,
      exportName: 'EventDLQUrl',
    });

    new cdk.CfnOutput(this, 'PublisherRoleArn', {
      value: publisherRole.roleArn,
      exportName: 'SecondaryEventPublisherRoleArn',
    });

    new cdk.CfnOutput(this, 'ConsumerRoleArn', {
      value: consumerRole.roleArn,
      exportName: 'SecondaryEventConsumerRoleArn',
    });
  }
}
