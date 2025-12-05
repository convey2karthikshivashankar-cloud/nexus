import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
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
export declare class DemoStack extends cdk.Stack {
    readonly apiUrl: string;
    readonly websocketUrl: string;
    readonly uiUrl: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
