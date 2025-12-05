import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SnapshotSchedulerStackProps extends cdk.StackProps {
  eventStoreTableName: string;
  snapshotsTableName: string;
}

/**
 * Snapshot Scheduler Stack
 * 
 * Sets up EventBridge rules for time-elapsed threshold evaluation.
 * Runs daily to check if active aggregates need snapshots based on time.
 * 
 * Requirements: 11.2, 11.5
 */
export class SnapshotSchedulerStack extends cdk.Stack {
  public readonly schedulerLambda: lambda.Function;
  public readonly dailyRule: events.Rule;

  constructor(scope: Construct, id: string, props: SnapshotSchedulerStackProps) {
    super(scope, id, props);

    // Create Lambda function for snapshot evaluation
    this.schedulerLambda = this.createSchedulerLambda(props);

    // Create EventBridge rule for daily evaluation
    this.dailyRule = this.createDailyRule();

    // Add Lambda as target
    this.dailyRule.addTarget(new targets.LambdaFunction(this.schedulerLambda));

    // Outputs
    new cdk.CfnOutput(this, 'SchedulerLambdaArn', {
      value: this.schedulerLambda.functionArn,
      exportName: 'SnapshotSchedulerLambdaArn',
    });

    new cdk.CfnOutput(this, 'DailyRuleArn', {
      value: this.dailyRule.ruleArn,
      exportName: 'SnapshotDailyRuleArn',
    });
  }

  /**
   * Create Lambda function for snapshot scheduler
   */
  private createSchedulerLambda(props: SnapshotSchedulerStackProps): lambda.Function {
    const schedulerLambda = new lambda.Function(this, 'SnapshotSchedulerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('packages/snapshot-scheduler/dist'),
      environment: {
        EVENT_STORE_TABLE: props.eventStoreTableName,
        SNAPSHOTS_TABLE: props.snapshotsTableName,
        AWS_REGION: this.region,
        TIME_ELAPSED_THRESHOLD: '86400000', // 24 hours in milliseconds
      },
      timeout: cdk.Duration.minutes(15), // Allow time for processing multiple aggregates
      memorySize: 512,
      description: 'Evaluates time-elapsed threshold for snapshot creation',
    });

    // Grant DynamoDB permissions
    schedulerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:BatchWriteItem',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.eventStoreTableName}`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.eventStoreTableName}/index/*`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.snapshotsTableName}`,
        ],
      })
    );

    return schedulerLambda;
  }

  /**
   * Create EventBridge rule for daily evaluation
   * Runs at 2 AM UTC every day
   */
  private createDailyRule(): events.Rule {
    return new events.Rule(this, 'DailySnapshotEvaluationRule', {
      ruleName: 'nexus-snapshot-daily-evaluation',
      description: 'Daily evaluation of time-elapsed threshold for snapshots',
      
      // Run at 2 AM UTC every day
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
        day: '*',
        month: '*',
        year: '*',
      }),
      
      enabled: true,
    });
  }

  /**
   * Create EventBridge rule for hourly evaluation (optional, for more frequent checks)
   */
  createHourlyRule(): events.Rule {
    const hourlyRule = new events.Rule(this, 'HourlySnapshotEvaluationRule', {
      ruleName: 'nexus-snapshot-hourly-evaluation',
      description: 'Hourly evaluation of time-elapsed threshold for snapshots',
      
      // Run every hour
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      
      enabled: false, // Disabled by default, enable if needed
    });

    hourlyRule.addTarget(new targets.LambdaFunction(this.schedulerLambda));

    return hourlyRule;
  }
}

/**
 * Example Lambda Handler for Snapshot Scheduler
 * 
 * This should be implemented in packages/snapshot-scheduler/src/index.ts
 */
export const exampleHandler = `
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SnapshotManager } from '@nexus/command-service';
import { EventStore, SnapshotStore } from '@nexus/adapters/aws';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const eventStore = new EventStore({
  tableName: process.env.EVENT_STORE_TABLE!,
  region: process.env.AWS_REGION!,
});

const snapshotStore = new SnapshotStore({
  tableName: process.env.SNAPSHOTS_TABLE!,
  region: process.env.AWS_REGION!,
});

const snapshotManager = new SnapshotManager(
  snapshotStore,
  eventStore,
  {
    eventCountThreshold: 1000,
    aggregateSizeThreshold: 1048576,
    timeElapsedThreshold: parseInt(process.env.TIME_ELAPSED_THRESHOLD || '86400000'),
  }
);

export async function handler(event: any): Promise<void> {
  console.log('[SnapshotScheduler] Starting time-elapsed threshold evaluation');
  
  try {
    // Get all active aggregates (aggregates with recent activity)
    const activeAggregates = await getActiveAggregates();
    
    console.log(\`[SnapshotScheduler] Found \${activeAggregates.length} active aggregates\`);
    
    let evaluatedCount = 0;
    let snapshotsCreated = 0;
    
    // Evaluate each aggregate
    for (const aggregateId of activeAggregates) {
      try {
        const created = await snapshotManager.evaluateTimeElapsedThreshold(aggregateId);
        evaluatedCount++;
        if (created) {
          snapshotsCreated++;
        }
      } catch (error: any) {
        console.error(\`[SnapshotScheduler] Error evaluating aggregate \${aggregateId}:\`, error);
      }
    }
    
    console.log(\`[SnapshotScheduler] Evaluation complete: \${evaluatedCount} evaluated, \${snapshotsCreated} snapshots created\`);
    
  } catch (error: any) {
    console.error('[SnapshotScheduler] Error:', error);
    throw error;
  }
}

/**
 * Get list of active aggregates (aggregates with events in last 30 days)
 */
async function getActiveAggregates(): Promise<string[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Scan EventStore for recent aggregates
  // In production, consider maintaining an index of active aggregates
  const result = await docClient.send(
    new ScanCommand({
      TableName: process.env.EVENT_STORE_TABLE!,
      FilterExpression: '#ts > :thirtyDaysAgo',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':thirtyDaysAgo': thirtyDaysAgo,
      },
      ProjectionExpression: 'aggregateId',
    })
  );
  
  // Deduplicate aggregate IDs
  const aggregateIds = new Set<string>();
  for (const item of result.Items || []) {
    aggregateIds.add(item.aggregateId);
  }
  
  return Array.from(aggregateIds);
}
`;
