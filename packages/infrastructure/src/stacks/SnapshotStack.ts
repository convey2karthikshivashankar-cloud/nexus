import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Snapshot Stack
 * 
 * Manages snapshot storage and automated snapshot creation based on time-elapsed threshold.
 * Snapshots are created when:
 * 1. Event count threshold exceeded (handled by Command Service)
 * 2. Aggregate size threshold exceeded (handled by Command Service)
 * 3. Time elapsed threshold exceeded (handled by EventBridge - this stack)
 */
export class SnapshotStack extends cdk.Stack {
  public readonly snapshotTableName: string;
  public readonly snapshotTableArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Snapshots table
    const snapshotTable = new dynamodb.Table(this, 'SnapshotsTable', {
      tableName: 'nexus-snapshots',
      partitionKey: {
        name: 'aggregateId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'version',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl', // Optional: auto-delete old snapshots
    });

    // Add GSI for querying latest snapshot
    snapshotTable.addGlobalSecondaryIndex({
      indexName: 'LatestSnapshotIndex',
      partitionKey: {
        name: 'aggregateId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.snapshotTableName = snapshotTable.tableName;
    this.snapshotTableArn = snapshotTable.tableArn;

    // Create Lambda function for time-elapsed snapshot evaluation
    const snapshotEvaluatorLambda = new lambda.Function(this, 'SnapshotEvaluator', {
      functionName: 'nexus-snapshot-evaluator',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        // This is a placeholder - actual implementation in packages/snapshot-evaluator
        exports.handler = async (event) => {
          console.log('Evaluating time-elapsed snapshot threshold', event);
          // Implementation will call SnapshotManager.evaluateTimeElapsedThreshold()
          return { statusCode: 200 };
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        SNAPSHOT_TABLE_NAME: snapshotTable.tableName,
        EVENT_STORE_TABLE_NAME: 'nexus-event-store',
        TIME_ELAPSED_THRESHOLD: '86400000', // 24 hours in milliseconds
      },
    });

    // Grant permissions to Lambda
    snapshotTable.grantReadWriteData(snapshotEvaluatorLambda);

    // Grant access to Event Store
    snapshotEvaluatorLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:Query',
          'dynamodb:GetItem',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/nexus-event-store`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/nexus-event-store/index/*`,
        ],
      })
    );

    // Create EventBridge rule to trigger daily evaluation
    const dailyRule = new events.Rule(this, 'DailySnapshotEvaluation', {
      ruleName: 'nexus-daily-snapshot-evaluation',
      description: 'Evaluates time-elapsed threshold for snapshots daily',
      schedule: events.Schedule.rate(cdk.Duration.hours(24)),
    });

    dailyRule.addTarget(new targets.LambdaFunction(snapshotEvaluatorLambda));

    // Create EventBridge rule for active aggregates (more frequent)
    const hourlyRule = new events.Rule(this, 'HourlySnapshotEvaluation', {
      ruleName: 'nexus-hourly-snapshot-evaluation',
      description: 'Evaluates time-elapsed threshold for active aggregates hourly',
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
    });

    hourlyRule.addTarget(new targets.LambdaFunction(snapshotEvaluatorLambda));

    // Create IAM role for manual snapshot creation
    const snapshotCreatorRole = new iam.Role(this, 'SnapshotCreatorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions to create snapshots',
    });

    snapshotTable.grantReadWriteData(snapshotCreatorRole);

    // Outputs
    new cdk.CfnOutput(this, 'SnapshotTableName', {
      value: this.snapshotTableName,
      exportName: 'SnapshotTableName',
    });

    new cdk.CfnOutput(this, 'SnapshotTableArn', {
      value: this.snapshotTableArn,
      exportName: 'SnapshotTableArn',
    });

    new cdk.CfnOutput(this, 'SnapshotEvaluatorLambdaArn', {
      value: snapshotEvaluatorLambda.functionArn,
      exportName: 'SnapshotEvaluatorLambdaArn',
    });

    new cdk.CfnOutput(this, 'SnapshotCreatorRoleArn', {
      value: snapshotCreatorRole.roleArn,
      exportName: 'SnapshotCreatorRoleArn',
    });

    // CloudWatch Alarms
    const snapshotCreationFailures = snapshotEvaluatorLambda.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    new cdk.aws_cloudwatch.Alarm(this, 'SnapshotCreationFailureAlarm', {
      metric: snapshotCreationFailures,
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when snapshot creation failures exceed threshold',
      alarmName: 'nexus-snapshot-creation-failures',
    });
  }
}
