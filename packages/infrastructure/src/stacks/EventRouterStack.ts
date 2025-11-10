import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

export interface EventRouterStackProps extends cdk.StackProps {
  eventStoreTable: dynamodb.ITable;
  coreEventStream: kinesis.IStream;
  nonCriticalTopic: sns.ITopic;
  schemaRegistryName: string;
}

/**
 * Event Router Stack
 * 
 * Deploys the Lambda function that routes events from DynamoDB Streams
 * to either Kinesis (core events) or SNS (non-critical events) based on
 * event criticality.
 * 
 * Implements:
 * - Schema validation before routing
 * - Dual-path event propagation
 * - Retry logic with exponential backoff
 * - CloudWatch metrics emission
 */
export class EventRouterStack extends cdk.Stack {
  public readonly routerFunction: lambda.IFunction;

  constructor(scope: Construct, id: string, props: EventRouterStackProps) {
    super(scope, id, props);

    // Create Lambda function for event routing
    this.routerFunction = new lambdaNodejs.NodejsFunction(this, 'EventRouterFunction', {
      functionName: 'nexus-event-router',
      entry: path.join(__dirname, '../../../event-router/src/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        CORE_EVENT_STREAM_NAME: props.coreEventStream.streamName,
        NON_CRITICAL_TOPIC_ARN: props.nonCriticalTopic.topicArn,
        SCHEMA_REGISTRY_NAME: props.schemaRegistryName,
        AWS_REGION: this.region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk'],
      },
    });

    // Grant permissions to read from DynamoDB Stream
    props.eventStoreTable.grantStreamRead(this.routerFunction);

    // Grant permissions to write to Kinesis
    props.coreEventStream.grantWrite(this.routerFunction);

    // Grant permissions to publish to SNS
    props.nonCriticalTopic.grantPublish(this.routerFunction);

    // Grant permissions to access Schema Registry
    this.routerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'glue:GetRegistry',
          'glue:GetSchema',
          'glue:GetSchemaVersion',
        ],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:registry/${props.schemaRegistryName}`,
          `arn:aws:glue:${this.region}:${this.account}:schema/${props.schemaRegistryName}/*`,
        ],
      })
    );

    // Grant permissions to emit CloudWatch metrics
    this.routerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'Nexus/EventRouter',
          },
        },
      })
    );

    // Add DynamoDB Stream as event source
    this.routerFunction.addEventSource(
      new eventsources.DynamoEventSource(props.eventStoreTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
        bisectBatchOnError: true, // Split batch on error for better error isolation
        reportBatchItemFailures: true,
        parallelizationFactor: 10, // Process up to 10 batches in parallel
      })
    );

    // CloudWatch Alarms
    const errorMetric = this.routerFunction.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    errorMetric.createAlarm(this, 'EventRouterErrorAlarm', {
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Event Router has high error rate',
      alarmName: 'nexus-event-router-errors',
    });

    const throttleMetric = this.routerFunction.metricThrottles({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    throttleMetric.createAlarm(this, 'EventRouterThrottleAlarm', {
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Event Router is being throttled',
      alarmName: 'nexus-event-router-throttles',
    });

    // Outputs
    new cdk.CfnOutput(this, 'EventRouterFunctionName', {
      value: this.routerFunction.functionName,
      exportName: 'EventRouterFunctionName',
    });

    new cdk.CfnOutput(this, 'EventRouterFunctionArn', {
      value: this.routerFunction.functionArn,
      exportName: 'EventRouterFunctionArn',
    });
  }
}
