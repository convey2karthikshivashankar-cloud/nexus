"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const path = __importStar(require("path"));
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
class DemoStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        eventProcessor.addEventSource(new cdk.aws_lambda_event_sources.DynamoEventSource(eventStoreTable, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 10,
            retryAttempts: 2,
        }));
        // WebSocket Handler Lambda (commented out for initial deployment)
        // const websocketHandler = new lambda.Function(this, 'WebSocketHandler', {
        //   functionName: 'nexus-demo-websocket-handler',
        //   runtime: lambda.Runtime.NODEJS_18_X,
        //   handler: 'index.handler',
        //   code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/websocket-handler')),
        //   memorySize: 128,
        //   timeout: cdk.Duration.seconds(10),
        //   environment: {
        //     CONNECTIONS_TABLE: connectionsTable.tableName,
        //   },
        // });
        // connectionsTable.grantReadWriteData(websocketHandler);
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
        // WebSocket API Gateway (Simplified for deployment)
        // ========================================
        // Temporarily set a placeholder WebSocket URL
        // WebSocket can be added in a future deployment after core infrastructure is stable
        this.websocketUrl = 'wss://placeholder-websocket-url';
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
        // Deploy UI (commented out for initial deployment - build UI first)
        // new s3deploy.BucketDeployment(this, 'DeployUI', {
        //   sources: [s3deploy.Source.asset(path.join(__dirname, '../ui/build'))],
        //   destinationBucket: uiBucket,
        // });
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
exports.DemoStack = DemoStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVtb1N0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRGVtb1N0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsbUVBQXFEO0FBQ3JELHVFQUF5RDtBQUV6RCx1REFBeUM7QUFJekMsMkNBQTZCO0FBRTdCOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFhLFNBQVUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUt0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDJDQUEyQztRQUMzQyxvQ0FBb0M7UUFDcEMsMkNBQTJDO1FBRTNDLG9CQUFvQjtRQUNwQixNQUFNLGVBQWUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ2pFLFNBQVMsRUFBRSxtQkFBbUI7WUFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDMUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLHFCQUFxQjtZQUN4RSxNQUFNLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTO1lBQ3pDLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxZQUFZO1NBQ3ZELENBQUMsQ0FBQztRQUVILG1CQUFtQjtRQUNuQixNQUFNLGNBQWMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFB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cEQsMkVBQTJFO1FBQzNFLGlDQUFpQztRQUNqQyxNQUFNO1FBRU4sSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7UUFFdkMsMkNBQTJDO1FBQzNDLFVBQVU7UUFDViwyQ0FBMkM7UUFFM0MsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDaEMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ2xCLFdBQVcsRUFBRSxjQUFjO1lBQzNCLFVBQVUsRUFBRSxpQkFBaUI7U0FDOUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdEMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQ3hCLFdBQVcsRUFBRSxtQkFBbUI7WUFDaEMsVUFBVSxFQUFFLHVCQUF1QjtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsV0FBVyxFQUFFLGFBQWE7WUFDMUIsVUFBVSxFQUFFLGdCQUFnQjtTQUM3QixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxRQUFRLElBQUksQ0FBQyxLQUFLLHFCQUFxQjtZQUM5QyxXQUFXLEVBQUUsbUJBQW1CO1NBQ2pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhPRCw4QkFnT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XHJcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5djIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXl2Mic7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbi8qKlxyXG4gKiBOZXh1cyBCbHVlcHJpbnQgMy4wIERlbW8gU3RhY2tcclxuICogXHJcbiAqIE9wdGltaXplZCBmb3IgQVdTIEZyZWUgVGllcjpcclxuICogLSBMYW1iZGE6IDEyOE1CIG1lbW9yeSAobWluaW11bSlcclxuICogLSBEeW5hbW9EQjogT24tZGVtYW5kIChwYXkgcGVyIHJlcXVlc3QpXHJcbiAqIC0gQVBJIEdhdGV3YXk6IFJFU1QgQVBJXHJcbiAqIC0gUzM6IFN0YXRpYyB3ZWJzaXRlIGhvc3RpbmdcclxuICogXHJcbiAqIEVzdGltYXRlZCBjb3N0OiAkMC9tb250aCAod2l0aGluIGZyZWUgdGllciBsaW1pdHMpXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVtb1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgYXBpVXJsOiBzdHJpbmc7XHJcbiAgcHVibGljIHJlYWRvbmx5IHdlYnNvY2tldFVybDogc3RyaW5nO1xyXG4gIHB1YmxpYyByZWFkb25seSB1aVVybDogc3RyaW5nO1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBEeW5hbW9EQiBUYWJsZXMgKEZyZWUgVGllcjogMjVHQilcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyBFdmVudCBTdG9yZSBUYWJsZVxyXG4gICAgY29uc3QgZXZlbnRTdG9yZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdEZW1vRXZlbnRTdG9yZScsIHtcclxuICAgICAgdGFibGVOYW1lOiAnbmV4dXMtZGVtby1ldmVudHMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FnZ3JlZ2F0ZUlkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAndmVyc2lvbicsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsIC8vIEZyZWUgdGllciBmcmllbmRseVxyXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19JTUFHRSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRGVtbyBvbmx5XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZWFkIE1vZGVsIFRhYmxlXHJcbiAgICBjb25zdCByZWFkTW9kZWxUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnRGVtb1JlYWRNb2RlbCcsIHtcclxuICAgICAgdGFibGVOYW1lOiAnbmV4dXMtZGVtby1vcmRlcnMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ29yZGVySWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gV2ViU29ja2V0IENvbm5lY3Rpb25zIFRhYmxlXHJcbiAgICBjb25zdCBjb25uZWN0aW9uc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdEZW1vQ29ubmVjdGlvbnMnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogJ25leHVzLWRlbW8tY29ubmVjdGlvbnMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2Nvbm5lY3Rpb25JZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9ucyAoRnJlZSBUaWVyOiAxTSByZXF1ZXN0cy9tb250aClcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyBDb21tYW5kIEhhbmRsZXIgTGFtYmRhXHJcbiAgICBjb25zdCBjb21tYW5kSGFuZGxlciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NvbW1hbmRIYW5kbGVyJywge1xyXG4gICAgICBmdW5jdGlvbk5hbWU6ICduZXh1cy1kZW1vLWNvbW1hbmQtaGFuZGxlcicsXHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxyXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhL2NvbW1hbmQtaGFuZGxlcicpKSxcclxuICAgICAgbWVtb3J5U2l6ZTogMTI4LCAvLyBNaW5pbXVtIGZvciBmcmVlIHRpZXJcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIEVWRU5UX1NUT1JFX1RBQkxFOiBldmVudFN0b3JlVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgIFJFQURfTU9ERUxfVEFCTEU6IHJlYWRNb2RlbFRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGV2ZW50U3RvcmVUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY29tbWFuZEhhbmRsZXIpO1xyXG4gICAgcmVhZE1vZGVsVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNvbW1hbmRIYW5kbGVyKTtcclxuXHJcbiAgICAvLyBRdWVyeSBIYW5kbGVyIExhbWJkYVxyXG4gICAgY29uc3QgcXVlcnlIYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnUXVlcnlIYW5kbGVyJywge1xyXG4gICAgICBmdW5jdGlvbk5hbWU6ICduZXh1cy1kZW1vLXF1ZXJ5LWhhbmRsZXInLFxyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcclxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2xhbWJkYS9xdWVyeS1oYW5kbGVyJykpLFxyXG4gICAgICBtZW1vcnlTaXplOiAxMjgsXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBSRUFEX01PREVMX1RBQkxFOiByZWFkTW9kZWxUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgRVZFTlRfU1RPUkVfVEFCTEU6IGV2ZW50U3RvcmVUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZWFkTW9kZWxUYWJsZS5ncmFudFJlYWREYXRhKHF1ZXJ5SGFuZGxlcik7XHJcbiAgICBldmVudFN0b3JlVGFibGUuZ3JhbnRSZWFkRGF0YShxdWVyeUhhbmRsZXIpO1xyXG5cclxuICAgIC8vIEV2ZW50IFByb2Nlc3NvciBMYW1iZGEgKER5bmFtb0RCIFN0cmVhbXMpXHJcbiAgICBjb25zdCBldmVudFByb2Nlc3NvciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0V2ZW50UHJvY2Vzc29yJywge1xyXG4gICAgICBmdW5jdGlvbk5hbWU6ICduZXh1cy1kZW1vLWV2ZW50LXByb2Nlc3NvcicsXHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxyXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhL2V2ZW50LXByb2Nlc3NvcicpKSxcclxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgUkVBRF9NT0RFTF9UQUJMRTogcmVhZE1vZGVsVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgIENPTk5FQ1RJT05TX1RBQkxFOiBjb25uZWN0aW9uc1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJlYWRNb2RlbFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShldmVudFByb2Nlc3Nvcik7XHJcbiAgICBjb25uZWN0aW9uc1RhYmxlLmdyYW50UmVhZERhdGEoZXZlbnRQcm9jZXNzb3IpO1xyXG4gICAgZXZlbnRTdG9yZVRhYmxlLmdyYW50U3RyZWFtUmVhZChldmVudFByb2Nlc3Nvcik7XHJcblxyXG4gICAgLy8gQWRkIER5bmFtb0RCIFN0cmVhbSB0cmlnZ2VyXHJcbiAgICBldmVudFByb2Nlc3Nvci5hZGRFdmVudFNvdXJjZShcclxuICAgICAgbmV3IGNkay5hd3NfbGFtYmRhX2V2ZW50X3NvdXJjZXMuRHluYW1vRXZlbnRTb3VyY2UoZXZlbnRTdG9yZVRhYmxlLCB7XHJcbiAgICAgICAgc3RhcnRpbmdQb3NpdGlvbjogbGFtYmRhLlN0YXJ0aW5nUG9zaXRpb24uTEFURVNULFxyXG4gICAgICAgIGJhdGNoU2l6ZTogMTAsXHJcbiAgICAgICAgcmV0cnlBdHRlbXB0czogMixcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gV2ViU29ja2V0IEhhbmRsZXIgTGFtYmRhIChjb21tZW50ZWQgb3V0IGZvciBpbml0aWFsIGRlcGxveW1lbnQpXHJcbiAgICAvLyBjb25zdCB3ZWJzb2NrZXRIYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnV2ViU29ja2V0SGFuZGxlcicsIHtcclxuICAgIC8vICAgZnVuY3Rpb25OYW1lOiAnbmV4dXMtZGVtby13ZWJzb2NrZXQtaGFuZGxlcicsXHJcbiAgICAvLyAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxyXG4gICAgLy8gICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXHJcbiAgICAvLyAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhL3dlYnNvY2tldC1oYW5kbGVyJykpLFxyXG4gICAgLy8gICBtZW1vcnlTaXplOiAxMjgsXHJcbiAgICAvLyAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcclxuICAgIC8vICAgZW52aXJvbm1lbnQ6IHtcclxuICAgIC8vICAgICBDT05ORUNUSU9OU19UQUJMRTogY29ubmVjdGlvbnNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAvLyAgIH0sXHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyBjb25uZWN0aW9uc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh3ZWJzb2NrZXRIYW5kbGVyKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBSRVNUIEFQSSBHYXRld2F5IChGcmVlIFRpZXI6IDFNIHJlcXVlc3RzL21vbnRoKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0RlbW9BcGknLCB7XHJcbiAgICAgIHJlc3RBcGlOYW1lOiAnbmV4dXMtZGVtby1hcGknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ05leHVzIEJsdWVwcmludCAzLjAgRGVtbyBBUEknLFxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nXSxcclxuICAgICAgfSxcclxuICAgICAgZGVwbG95T3B0aW9uczoge1xyXG4gICAgICAgIHN0YWdlTmFtZTogJ3Byb2QnLFxyXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDEwLCAvLyBGcmVlIHRpZXIgZnJpZW5kbHlcclxuICAgICAgICB0aHJvdHRsaW5nQnVyc3RMaW1pdDogMjAsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmFwaVVybCA9IGFwaS51cmw7XHJcblxyXG4gICAgLy8gQ29tbWFuZHMgZW5kcG9pbnRcclxuICAgIGNvbnN0IGNvbW1hbmRzID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2NvbW1hbmRzJyk7XHJcbiAgICBjb21tYW5kcy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjb21tYW5kSGFuZGxlcikpO1xyXG5cclxuICAgIC8vIFF1ZXJpZXMgZW5kcG9pbnRcclxuICAgIGNvbnN0IHF1ZXJpZXMgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgncXVlcmllcycpO1xyXG4gICAgcXVlcmllcy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHF1ZXJ5SGFuZGxlcikpO1xyXG5cclxuICAgIGNvbnN0IHF1ZXJ5QnlJZCA9IHF1ZXJpZXMuYWRkUmVzb3VyY2UoJ3tvcmRlcklkfScpO1xyXG4gICAgcXVlcnlCeUlkLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocXVlcnlIYW5kbGVyKSk7XHJcblxyXG4gICAgLy8gRXZlbnRzIGVuZHBvaW50IChmb3IgdGltZWxpbmUpXHJcbiAgICBjb25zdCBldmVudHMgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnZXZlbnRzJyk7XHJcbiAgICBldmVudHMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihxdWVyeUhhbmRsZXIpKTtcclxuXHJcbiAgICBjb25zdCBldmVudHNCeUFnZ3JlZ2F0ZSA9IGV2ZW50cy5hZGRSZXNvdXJjZSgne2FnZ3JlZ2F0ZUlkfScpO1xyXG4gICAgZXZlbnRzQnlBZ2dyZWdhdGUuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihxdWVyeUhhbmRsZXIpKTtcclxuXHJcbiAgICAvLyBUZW1wb3JhbCBxdWVyeSBlbmRwb2ludFxyXG4gICAgY29uc3QgdGVtcG9yYWwgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndGVtcG9yYWwnKTtcclxuICAgIGNvbnN0IHRlbXBvcmFsQnlJZCA9IHRlbXBvcmFsLmFkZFJlc291cmNlKCd7YWdncmVnYXRlSWR9Jyk7XHJcbiAgICB0ZW1wb3JhbEJ5SWQuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihxdWVyeUhhbmRsZXIpKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBXZWJTb2NrZXQgQVBJIEdhdGV3YXkgKFNpbXBsaWZpZWQgZm9yIGRlcGxveW1lbnQpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBcclxuICAgIC8vIFRlbXBvcmFyaWx5IHNldCBhIHBsYWNlaG9sZGVyIFdlYlNvY2tldCBVUkxcclxuICAgIC8vIFdlYlNvY2tldCBjYW4gYmUgYWRkZWQgaW4gYSBmdXR1cmUgZGVwbG95bWVudCBhZnRlciBjb3JlIGluZnJhc3RydWN0dXJlIGlzIHN0YWJsZVxyXG4gICAgdGhpcy53ZWJzb2NrZXRVcmwgPSAnd3NzOi8vcGxhY2Vob2xkZXItd2Vic29ja2V0LXVybCc7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gUzMgQnVja2V0IGZvciBVSSAoRnJlZSBUaWVyOiA1R0IpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgY29uc3QgdWlCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdEZW1vVUknLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6IGBuZXh1cy1kZW1vLXVpLSR7dGhpcy5hY2NvdW50fWAsXHJcbiAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXHJcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWUsXHJcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiB7XHJcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiBmYWxzZSxcclxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogZmFsc2UsXHJcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogZmFsc2UsXHJcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcclxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEZXBsb3kgVUkgKGNvbW1lbnRlZCBvdXQgZm9yIGluaXRpYWwgZGVwbG95bWVudCAtIGJ1aWxkIFVJIGZpcnN0KVxyXG4gICAgLy8gbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveVVJJywge1xyXG4gICAgLy8gICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi91aS9idWlsZCcpKV0sXHJcbiAgICAvLyAgIGRlc3RpbmF0aW9uQnVja2V0OiB1aUJ1Y2tldCxcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIHRoaXMudWlVcmwgPSB1aUJ1Y2tldC5idWNrZXRXZWJzaXRlVXJsO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIE91dHB1dHNcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5hcGlVcmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUkVTVCBBUEkgVVJMJyxcclxuICAgICAgZXhwb3J0TmFtZTogJ05leHVzRGVtb0FwaVVybCcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2ViU29ja2V0VXJsJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy53ZWJzb2NrZXRVcmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnV2ViU29ja2V0IEFQSSBVUkwnLFxyXG4gICAgICBleHBvcnROYW1lOiAnTmV4dXNEZW1vV2ViU29ja2V0VXJsJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVSVVybCcsIHtcclxuICAgICAgdmFsdWU6IHRoaXMudWlVcmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGVtbyBVSSBVUkwnLFxyXG4gICAgICBleHBvcnROYW1lOiAnTmV4dXNEZW1vVUlVcmwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RlbW9JbnN0cnVjdGlvbnMnLCB7XHJcbiAgICAgIHZhbHVlOiBgT3BlbiAke3RoaXMudWlVcmx9IHRvIHN0YXJ0IHRoZSBkZW1vIWAsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGVtbyBJbnN0cnVjdGlvbnMnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==