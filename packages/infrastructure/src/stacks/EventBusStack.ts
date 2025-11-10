import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class EventBusStack extends cdk.Stack {
  public readonly coreEventStream: kinesis.Stream;
  public readonly nonCriticalTopic: sns.Topic;
  public readonly projectionQueues: Map<string, sqs.Queue> = new Map();

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Kinesis Stream for core events (low latency, high throughput)
    this.coreEventStream = new kinesis.Stream(this, 'CoreEventStream', {
      streamName: 'nexus-core-events',
      streamMode: kinesis.StreamMode.ON_DEMAND, // Auto-scaling
      retentionPeriod: cdk.Duration.hours(24),
      encryption: kinesis.StreamEncryption.MANAGED,
    });

    // SNS Topic for non-critical events (resilient, queue-based)
    this.nonCriticalTopic = new sns.Topic(this, 'NonCriticalEventTopic', {
      topicName: 'nexus-non-critical-events',
      displayName: 'Nexus Non-Critical Events',
    });

    // Create projection queues (one per projection handler)
    const projectionNames = ['OrderList', 'OrderSearch', 'Analytics'];
    
    for (const projectionName of projectionNames) {
      const dlq = new sqs.Queue(this, `${projectionName}DLQ`, {
        queueName: `nexus-${projectionName.toLowerCase()}-dlq`,
        retentionPeriod: cdk.Duration.days(14),
      });

      const queue = new sqs.Queue(this, `${projectionName}Queue`, {
        queueName: `nexus-${projectionName.toLowerCase()}-projection`,
        visibilityTimeout: cdk.Duration.seconds(30),
        deadLetterQueue: {
          queue: dlq,
          maxReceiveCount: 5,
        },
      });

      // Subscribe queue to SNS topic
      this.nonCriticalTopic.addSubscription(
        new subscriptions.SqsSubscription(queue)
      );

      this.projectionQueues.set(projectionName, queue);

      // CloudWatch alarm for DLQ depth
      dlq.metricApproximateNumberOfMessagesVisible().createAlarm(this, `${projectionName}DLQAlarm`, {
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: `DLQ has messages for ${projectionName} projection`,
        alarmName: `nexus-${projectionName.toLowerCase()}-dlq-alarm`,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'CoreEventStreamName', {
      value: this.coreEventStream.streamName,
      exportName: 'CoreEventStreamName',
    });

    new cdk.CfnOutput(this, 'CoreEventStreamArn', {
      value: this.coreEventStream.streamArn,
      exportName: 'CoreEventStreamArn',
    });

    new cdk.CfnOutput(this, 'NonCriticalTopicArn', {
      value: this.nonCriticalTopic.topicArn,
      exportName: 'NonCriticalTopicArn',
    });
  }
}
