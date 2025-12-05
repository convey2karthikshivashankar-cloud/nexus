import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class CommandServiceStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly ordersTable: dynamodb.Table;
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // Event Bus for publishing domain events
    // ========================================
    this.eventBus = new events.EventBus(this, 'CommandEventBus', {
      eventBusName: 'nexus-command-events'
    });

    // ========================================
    // DynamoDB Table for Orders (Event Store)
    // ========================================
    this.ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'nexus-command-orders',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Add GSI for customer queries
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'CustomerIndex',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // ========================================
    // Command Handler Lambda
    // ========================================
    const commandHandler = new lambda.Function(this, 'CommandHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/command-handler')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ORDERS_TABLE: this.ordersTable.tableName,
        EVENT_BUS_NAME: this.eventBus.eventBusName
      }
    });

    // Grant permissions
    this.ordersTable.grantReadWriteData(commandHandler);
    this.eventBus.grantPutEventsTo(commandHandler);

    // ========================================
    // API Gateway
    // ========================================
    this.api = new apigateway.RestApi(this, 'CommandApi', {
      restApiName: 'Nexus Command Service API',
      description: 'Skeleton Crew App #1 - Command Service for CQRS',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Orders resource
    const orders = this.api.root.addResource('orders');
    const orderById = orders.addResource('{orderId}');

    // POST /orders - Place Order
    orders.addMethod('POST', new apigateway.LambdaIntegration(commandHandler));

    // PUT /orders/{orderId} - Cancel Order
    orderById.addMethod('PUT', new apigateway.LambdaIntegration(commandHandler));

    // ========================================
    // UI Hosting (S3 + CloudFront optional)
    // ========================================
    const uiBucket = new s3.Bucket(this, 'CommandUIBucket', {
      bucketName: `nexus-command-ui-${this.account}`,
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
      description: 'Command Service API URL'
    });

    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: this.ordersTable.tableName,
      description: 'DynamoDB Orders Table'
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge Bus Name'
    });

    new cdk.CfnOutput(this, 'UIBucketUrl', {
      value: uiBucket.bucketWebsiteUrl,
      description: 'Command UI URL'
    });
  }
}
