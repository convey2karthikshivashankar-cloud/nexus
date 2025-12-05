import { DynamoDBStreamEvent } from 'aws-lambda';
export declare const handler: (event: DynamoDBStreamEvent) => Promise<{
    statusCode: number;
    body: string;
}>;
