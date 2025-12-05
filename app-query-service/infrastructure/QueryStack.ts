import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

export class QueryServiceStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly ordersTable: dynamodb.Table;
  public readonly eventsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables for Read Models
    // ========================================
    
    // Orders projection table (read-optimized)
    this.ordersTable = new dynamodb.Table(this, 'OrdersProjection', {
      tableName: 'nexus-query-orders',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Add GSI for customer queries
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'CustomerIndex',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Add GSI for status queries
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Events log table
    this.eventsTable = new dynamodb.Table(this, 'EventsLog', {
      tableName: 'nexus-query-events',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // ========================================
    // Event Processor Lambda (Projector)
    // ========================================
    const eventProcessor = new lambda.Function(this, 'EventProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/event-processor')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ORDERS_TABLE: this.ordersTable.tableName,
        EVENTS_TABLE: this.eventsTable.tableName
      }
    });

    // Grant permissions
    this.ordersTable.grantReadWriteData(eventProcessor);
    this.eventsTable.grantReadWriteData(eventProcessor);

    // ========================================
    // Subscribe to Command Service Events
    // ========================================
    
    // Import the command service event bus (cross-stack reference)
    const commandEventBus = events.EventBus.fromEventBusName(
      this, 'CommandEventBus', 'nexus-command-events'
    );

    // Rule for OrderPlaced events
    new events.Rule(this, 'OrderPlacedRule', {
      eventBus: commandEventBus,
      eventPattern: {
        source: ['nexus.command-service'],
        detailType: ['OrderPlaced']
      },
      targets: [new targets.LambdaFunction(eventProcessor)]
    });

    // Rule for OrderCancelled events
    new events.Rule(this, 'OrderCancelledRule', {
      eventBus: commandEventBus,
      eventPattern: {
        source: ['nexus.command-service'],
        detailType: ['OrderCancelled']
      },
      targets: [new targets.LambdaFunction(eventProcessor)]
    });

    // ========================================
    // Query Handler Lambda
    // ========================================
    const queryHandler = new lambda.Function(this, 'QueryHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/query-handler')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ORDERS_TABLE: this.ordersTable.tableName,
        EVENTS_TABLE: this.eventsTable.tableName
      }
    });

    // Grant read permissions
    this.ordersTable.grantReadData(queryHandler);
    this.eventsTable.grantReadData(queryHandler);

    // ========================================
    // API Gateway
    // ========================================
    this.api = new apigateway.RestApi(this, 'QueryApi', {
      restApiName: 'Nexus Query Service API',
      description: 'Skeleton Crew App #2 - Query Service for CQRS',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Orders resource
    const orders = this.api.root.addResource('orders');
    orders.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // Events resource
    const eventsResource = this.api.root.addResource('events');
    eventsResource.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // ========================================
    // UI Hosting
    // ========================================
    const uiBucket = new s3.Bucket(this, 'QueryUIBucket', {
      bucketName: `nexus-query-ui-${this.account}`,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'Query Service API URL'
    });

    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: this.ordersTable.tableName,
      description: 'DynamoDB Orders Projection Table'
    });

    new cdk.CfnOutput(this, 'EventsTableName', {
      value: this.eventsTable.tableName,
      description: 'DynamoDB Events Log Table'
    });

    new cdk.CfnOutput(this, 'UIBucketUrl', {
      value: uiBucket.bucketWebsiteUrl,
      description: 'Query UI URL'
    });
  }
}
