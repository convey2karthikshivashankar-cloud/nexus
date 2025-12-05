import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Nexus Blueprint 3.0 - IoT Sensor Demo Stack
 * 
 * Demonstrates CQRS + Event Sourcing for IoT sensor data:
 * - Commands: RegisterSensor, RecordReading, TriggerAlert, AcknowledgeAlert
 * - Events: SensorRegistered, ReadingRecorded, AlertTriggered, AlertAcknowledged
 * - Queries: GetSensors, GetReadings, GetAlerts, GetSensorHistory
 * 
 * Optimized for AWS Free Tier
 */
export class IoTDemoStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly uiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables
    // ========================================

    // Event Store Table (immutable event log)
    const eventStoreTable = new dynamodb.Table(this, 'IoTEventStore', {
      tableName: 'nexus-iot-events',
      partitionKey: { name: 'aggregateId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Read Model: Sensors Table
    const sensorsTable = new dynamodb.Table(this, 'IoTSensors', {
      tableName: 'nexus-iot-sensors',
      partitionKey: { name: 'sensorId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Read Model: Readings Table (for recent readings)
    const readingsTable = new dynamodb.Table(this, 'IoTReadings', {
      tableName: 'nexus-iot-readings',
      partitionKey: { name: 'sensorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Read Model: Alerts Table
    const alertsTable = new dynamodb.Table(this, 'IoTAlerts', {
      tableName: 'nexus-iot-alerts',
      partitionKey: { name: 'alertId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // Lambda Functions
    // ========================================

    // Command Handler Lambda
    const commandHandler = new lambda.Function(this, 'IoTCommandHandler', {
      functionName: 'nexus-iot-command-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'command-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENT_STORE_TABLE: eventStoreTable.tableName,
        SENSORS_TABLE: sensorsTable.tableName,
        READINGS_TABLE: readingsTable.tableName,
        ALERTS_TABLE: alertsTable.tableName,
      },
    });

    eventStoreTable.grantReadWriteData(commandHandler);
    sensorsTable.grantReadWriteData(commandHandler);

    // Query Handler Lambda
    const queryHandler = new lambda.Function(this, 'IoTQueryHandler', {
      functionName: 'nexus-iot-query-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'query-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENT_STORE_TABLE: eventStoreTable.tableName,
        SENSORS_TABLE: sensorsTable.tableName,
        READINGS_TABLE: readingsTable.tableName,
        ALERTS_TABLE: alertsTable.tableName,
      },
    });

    sensorsTable.grantReadData(queryHandler);
    readingsTable.grantReadData(queryHandler);
    alertsTable.grantReadData(queryHandler);
    eventStoreTable.grantReadData(queryHandler);

    // Event Processor Lambda (DynamoDB Streams)
    const eventProcessor = new lambda.Function(this, 'IoTEventProcessor', {
      functionName: 'nexus-iot-event-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'event-processor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        SENSORS_TABLE: sensorsTable.tableName,
        READINGS_TABLE: readingsTable.tableName,
        ALERTS_TABLE: alertsTable.tableName,
      },
    });

    sensorsTable.grantReadWriteData(eventProcessor);
    readingsTable.grantReadWriteData(eventProcessor);
    alertsTable.grantReadWriteData(eventProcessor);
    eventStoreTable.grantStreamRead(eventProcessor);

    // Add DynamoDB Stream trigger
    eventProcessor.addEventSource(
      new cdk.aws_lambda_event_sources.DynamoEventSource(eventStoreTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        retryAttempts: 2,
      })
    );

    // ========================================
    // REST API Gateway
    // ========================================

    const api = new apigateway.RestApi(this, 'IoTDemoApi', {
      restApiName: 'nexus-iot-demo-api',
      description: 'Nexus Blueprint 3.0 IoT Sensor Demo API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 10,
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

    // Sensors endpoint
    const sensors = api.root.addResource('sensors');
    sensors.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));
    const sensorById = sensors.addResource('{sensorId}');
    sensorById.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // Readings endpoint
    const readings = api.root.addResource('readings');
    readings.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // Alerts endpoint
    const alerts = api.root.addResource('alerts');
    alerts.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // Events endpoint (for timeline)
    const events = api.root.addResource('events');
    events.addMethod('GET', new apigateway.LambdaIntegration(queryHandler));

    // ========================================
    // S3 Bucket for UI
    // ========================================

    const uiBucket = new s3.Bucket(this, 'IoTDemoUI', {
      bucketName: `nexus-iot-demo-ui-${this.account}`,
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

    this.uiUrl = uiBucket.bucketWebsiteUrl;

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'IoT Demo REST API URL',
      exportName: 'NexusIoTDemoApiUrl',
    });

    new cdk.CfnOutput(this, 'UIUrl', {
      value: this.uiUrl,
      description: 'IoT Demo UI URL',
      exportName: 'NexusIoTDemoUIUrl',
    });

    new cdk.CfnOutput(this, 'DemoInstructions', {
      value: `Open ${this.uiUrl} to start the IoT demo!`,
      description: 'Demo Instructions',
    });
  }
}
