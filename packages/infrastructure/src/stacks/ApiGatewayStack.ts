import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ApiGatewayStackProps extends cdk.StackProps {
  eventStoreTableName: string;
  snapshotsTableName: string;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'NexusApi', {
      restApiName: 'Nexus Blueprint API',
      description: 'Event-sourced microservice API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
    });

    // Command Service Lambda
    const commandServiceLambda = new lambda.Function(this, 'CommandServiceFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('packages/command-service/dist'),
      environment: {
        EVENT_STORE_TABLE: props.eventStoreTableName,
        SNAPSHOTS_TABLE: props.snapshotsTableName,
        AWS_REGION: this.region,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Grant DynamoDB permissions
    commandServiceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:BatchWriteItem',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.eventStoreTableName}`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.snapshotsTableName}`,
        ],
      })
    );

    // Commands resource
    const commands = this.api.root.addResource('api').addResource('commands');
    const commandType = commands.addResource('{commandType}');

    commandType.addMethod('POST', new apigateway.LambdaIntegration(commandServiceLambda), {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator: new apigateway.RequestValidator(this, 'CommandRequestValidator', {
        restApi: this.api,
        validateRequestBody: true,
        validateRequestParameters: true,
      }),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: 'NexusApiUrl',
    });
  }
}
