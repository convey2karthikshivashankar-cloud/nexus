import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

export class TicketingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const accountId = cdk.Stack.of(this).account;

    // EVENT STORE
    const eventStore = new dynamodb.Table(this, 'EventStore', {
      tableName: `skeleton-ticketing-events-${accountId}`,
      partitionKey: { name: 'aggregateId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // READ MODEL
    const readModel = new dynamodb.Table(this, 'ReadModel', {
      tableName: `skeleton-ticketing-readmodel-${accountId}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EVENT BUS
    const eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `skeleton-ticketing-bus-${accountId}`,
    });

    // COMMAND HANDLER
    const commandHandler = new lambda.Function(this, 'CommandHandler', {
      functionName: `skeleton-ticketing-cmd-${accountId}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/command-handler')),
      environment: {
        EVENT_STORE_TABLE: eventStore.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    eventStore.grantReadWriteData(commandHandler);
    eventBus.grantPutEventsTo(commandHandler);

    // QUERY HANDLER
    const queryHandler = new lambda.Function(this, 'QueryHandler', {
      functionName: `skeleton-ticketing-query-${accountId}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/query-handler')),
      environment: {
        EVENT_STORE_TABLE: eventStore.tableName,
        READ_MODEL_TABLE: readModel.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    eventStore.grantReadData(queryHandler);
    readModel.grantReadData(queryHandler);

    // EVENT PROCESSOR
    const eventProcessor = new lambda.Function(this, 'EventProcessor', {
      functionName: `skeleton-ticketing-proc-${accountId}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/event-processor')),
      environment: { READ_MODEL_TABLE: readModel.tableName },
      timeout: cdk.Duration.seconds(30),
    });
    readModel.grantReadWriteData(eventProcessor);
    eventProcessor.addEventSource(new eventsources.DynamoEventSource(eventStore, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 10,
    }));

    // API GATEWAY
    const api = new apigateway.RestApi(this, 'TicketingApi', {
      restApiName: `skeleton-ticketing-api-${accountId}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    const commandIntegration = new apigateway.LambdaIntegration(commandHandler);
    const queryIntegration = new apigateway.LambdaIntegration(queryHandler);
    api.root.addResource('command').addMethod('POST', commandIntegration);
    api.root.addResource('query').addMethod('GET', queryIntegration);
    api.root.addResource('events').addMethod('GET', queryIntegration);

    // UI BUCKET - UNIQUE NAME
    const uiBucket = new s3.Bucket(this, 'UIBucket', {
      bucketName: `skeleton-ticketing-ui-${accountId}`,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // OUTPUTS
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'UIBucketUrl', { value: uiBucket.bucketWebsiteUrl });
  }
}
