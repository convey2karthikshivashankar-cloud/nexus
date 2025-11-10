import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class EventStoreStack extends cdk.Stack {
  public readonly eventStoreTable: dynamodb.Table;
  public readonly snapshotsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Event Store Table
    this.eventStoreTable = new dynamodb.Table(this, 'EventStore', {
      tableName: 'nexus-event-store',
      partitionKey: {
        name: 'aggregateId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'version',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Global Secondary Index for temporal queries
    this.eventStoreTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: {
        name: 'eventType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Snapshots Table
    this.snapshotsTable = new dynamodb.Table(this, 'Snapshots', {
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
      timeToLiveAttribute: 'ttl',
    });

    // Outputs
    new cdk.CfnOutput(this, 'EventStoreTableName', {
      value: this.eventStoreTable.tableName,
      exportName: 'EventStoreTableName',
    });

    new cdk.CfnOutput(this, 'EventStoreStreamArn', {
      value: this.eventStoreTable.tableStreamArn!,
      exportName: 'EventStoreStreamArn',
    });

    new cdk.CfnOutput(this, 'SnapshotsTableName', {
      value: this.snapshotsTable.tableName,
      exportName: 'SnapshotsTableName',
    });
  }
}
