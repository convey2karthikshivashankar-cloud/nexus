import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Nexus Blueprint 3.0 Demo Stack
 * 
 * Optimized for AWS Free Tier:
 * - Lambda: 128MB memory (minimum)
 * - DynamoDB: On-demand (pay per request)
 * - API Gateway: REST API
 * - S3: Static website hosting
 * 
 * Estimated cost: $0/month (within free tier limits)
 */
export class DemoStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly websocketUrl: string;
  public readonly uiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables (Free Tier: 25GB)
    // ========================================

    // Event Store Table
    const eventStoreTable = new dynamodb.Table(this, 'DemoEventStore', {
      tableName: 'nexus-demo-events',
      partitionKey: { name: 'aggregateId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Free tier friendly
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Demo only
    });

    // Read Model Table
    const readModelTable = new dynamodb.Table(this, 'DemoReadModel', {
      tableName: 'nexus-demo-orders',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // WebSocket Connections Table
    const connectionsTable = new dynamodb.Table(this, 'DemoConnections', {
      tableName: 'nexus-demo-connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // ========================================
    // Lambda Functions (Free Tier: 1M requests/month)
    // ========================================

    // Command Handler Lambda
    const commandHandler = new lambda.Function(this, 'CommandHandler', {
      functionName: 'nexus-demo-command-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/command-handler')),
      memorySize: 128, // Minimum for free tier
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENT_STORE_TABLE: eventStoreTable.tableName,
        READ_MODEL_TABLE: readModelTable.tableName,
      },
    });

    eventStoreTable.grantReadWriteData(commandHandler);
    readModelTable.grantReadWriteData(commandHandler);

    // Query Handler Lambda
    const queryHandler = new lambda.Function(this, 'QueryHandler', {
      functionName: 'nexus-demo-query-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/query-handler')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        READ_MODEL_TABLE: readModelTable.tableName,
        EVENT_STORE_TABLE: eventStoreTable.tableName,
      },
    });

    readModelTable.grantReadData(queryHandler);
    eventStoreTable.grantReadData(queryHandler);

    // Event Processor Lambda (DynamoDB Streams)
    const eventProcessor = new lambda.Function(this, 'EventProcessor', {
      functionName: 'nexus-demo-event-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/event-processor')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        READ_MODEL_TABLE: readModelTable.tableName,
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
    });

    readModelTable.grantReadWriteData(eventProcessor);
    connectionsTable.grantReadData(eventProcessor);
    eventStoreTable.grantStreamRead(eventProcessor);

    // Add DynamoDB Stream trigger
    eventProcessor.addEventSource(
      new cdk.aws_lambda_event_sources.DynamoEventSource(eventStoreTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        retryAttempts: 2,
      })
    );

    // WebSocket Handler Lambda
    const websocketHandler = new lambda.Function(this, 'WebSocketHandler', {
      functionName: 'nexus-demo-websocket-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/websocket-handler')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
    });

    connectionsTable.grantReadWriteData(websocketHandler);

    // ========================================
    // REST API Gateway (Free Tier: 1M requests/month)
    // ========================================

    const api = new apigateway.RestApi(this, 'DemoApi', {
      restApiName: 'nexus-demo-api',
      description: 'Nexus Blueprint 3.0 Demo API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 10, // Free tier friendly
        throttlingBurstLimit: 20,
      },
    });

    this.apiUrl = api.url;

    // Commands endpoint
    const commands = api.root.addResource('commands');
    commands.addMethod('POST', new apigateway.LambdaIntegration(commandHandler));

    // Queries endpoint
    const queries = api.root.addResource('queries');
    queries.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    const queryById = queries.addResource('{orderId}');
    queryById.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // Events endpoint (for timeline)
    const events = api.root.addResource('events');
    events.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    const eventsByAggregate = events.addResource('{aggregateId}');
    eventsByAggregate.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // Temporal query endpoint
    const temporal = api.root.addResource('temporal');
    const temporalById = temporal.addResource('{aggregateId}');
    temporalById.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // ========================================
    // WebSocket API Gateway
    // ========================================

    const webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: 'nexus-demo-websocket',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    const integration = new apigatewayv2.CfnIntegration(this, 'WebSocketIntegration', {
      apiId: webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${websocketHandler.functionArn}/invocations`,
    });

    // Routes
    ['$connect', '$disconnect', '$default'].forEach((routeKey) => {
      new apigatewayv2.CfnRoute(this, `Route-${routeKey}`, {
        apiId: webSocketApi.ref,
        routeKey,
        target: `integrations/${integration.ref}`,
      });
    });

    const deployment = new apigatewayv2.CfnDeployment(this, 'WebSocketDeployment', {
      apiId: webSocketApi.ref,
    });

    const stage = new apigatewayv2.CfnStage(this, 'WebSocketStage', {
      apiId: webSocketApi.ref,
      stageName: 'prod',
      deploymentId: deployment.ref,
    });

    this.websocketUrl = `wss://${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/${stage.stageName}`;

    // Grant WebSocket API permission to invoke Lambda
    websocketHandler.addPermission('WebSocketInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`,
    });

    // Grant event processor permission to send WebSocket messages
    eventProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`],
      })
    );

    eventProcessor.addEnvironment('WEBSOCKET_API_ENDPOINT', `${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/prod`);

    // ========================================
    // S3 Bucket for UI (Free Tier: 5GB)
    // ========================================

    const uiBucket = new s3.Bucket(this, 'DemoUI', {
      bucketName: `nexus-demo-ui-${this.account}`,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deploy UI
    new s3deploy.BucketDeployment(this, 'DeployUI', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../ui/build'))],
      destinationBucket: uiBucket,
    });

    this.uiUrl = uiBucket.bucketWebsiteUrl;

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'REST API URL',
      exportName: 'NexusDemoApiUrl',
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: this.websocketUrl,
      description: 'WebSocket API URL',
      exportName: 'NexusDemoWebSocketUrl',
    });

    new cdk.CfnOutput(this, 'UIUrl', {
      value: this.uiUrl,
      description: 'Demo UI URL',
      exportName: 'NexusDemoUIUrl',
    });

    new cdk.CfnOutput(this, 'DemoInstructions', {
      value: `Open ${this.uiUrl} to start the demo!`,
      description: 'Demo Instructions',
    });
  }
}
