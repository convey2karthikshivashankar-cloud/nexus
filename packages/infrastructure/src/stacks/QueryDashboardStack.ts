import * as cdk from 'aws-cdk-lib';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class QueryDashboardStack extends cdk.Stack {
  public readonly domain: opensearch.Domain;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create OpenSearch domain
    this.domain = new opensearch.Domain(this, 'QueryDashboard', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      domainName: 'nexus-query-dashboard',
      capacity: {
        dataNodes: 3,
        dataNodeInstanceType: 't3.small.search',
      },
      ebs: {
        volumeSize: 20,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: 3,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      accessPolicies: [
        new iam.PolicyStatement({
          actions: ['es:*'],
          principals: [new iam.AnyPrincipal()],
          resources: ['*'],
        }),
      ],
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
      value: this.domain.domainEndpoint,
      exportName: 'OpenSearchDomainEndpoint',
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainArn', {
      value: this.domain.domainArn,
      exportName: 'OpenSearchDomainArn',
    });
  }
}
