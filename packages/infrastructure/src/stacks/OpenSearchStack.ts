import * as cdk from 'aws-cdk-lib';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface OpenSearchStackProps extends cdk.StackProps {
  vpc?: ec2.IVpc;
  domainName?: string;
}

export class OpenSearchStack extends cdk.Stack {
  public readonly domain: opensearch.Domain;
  public readonly domainEndpoint: string;

  constructor(scope: Construct, id: string, props?: OpenSearchStackProps) {
    super(scope, id, props);

    const domainName = props?.domainName || 'nexus-query-dashboard';

    this.domain = new opensearch.Domain(this, 'QueryDashboardDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      domainName,
      
      // Capacity configuration - 3 data nodes for HA
      capacity: {
        dataNodes: 3,
        dataNodeInstanceType: 't3.medium.search',
        masterNodes: 0, // No dedicated master for cost optimization
      },

      // EBS storage configuration
      ebs: {
        volumeSize: 100, // 100 GB per node
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },

      // Zone awareness for HA
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: 3,
      },

      // Encryption
      encryptionAtRest: {
        enabled: true,
      },
      nodeToNodeEncryption: true,
      enforceHttps: true,

      // Access policies
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['es:*'],
          resources: [`arn:aws:es:${this.region}:${this.account}:domain/${domainName}/*`],
          conditions: {
            IpAddress: {
              'aws:SourceIp': ['0.0.0.0/0'], // Restrict in production
            },
          },
        }),
      ],

      // Fine-grained access control
      fineGrainedAccessControl: {
        masterUserName: 'admin',
      },

      // Logging
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },

      // Advanced options
      advancedOptions: {
        'rest.action.multi.allow_explicit_index': 'true',
        'indices.fielddata.cache.size': '40',
        'indices.query.bool.max_clause_count': '1024',
      },

      // Automated snapshots
      automatedSnapshotStartHour: 2, // 2 AM UTC
    });

    this.domainEndpoint = this.domain.domainEndpoint;

    // Outputs
    new cdk.CfnOutput(this, 'DomainEndpoint', {
      value: this.domainEndpoint,
      exportName: 'OpenSearchDomainEndpoint',
    });

    new cdk.CfnOutput(this, 'DomainArn', {
      value: this.domain.domainArn,
      exportName: 'OpenSearchDomainArn',
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: this.domain.domainName,
      exportName: 'OpenSearchDomainName',
    });
  }

  /**
   * Grant read/write access to a Lambda function
   */
  grantReadWrite(grantee: iam.IGrantable): void {
    this.domain.grantReadWrite(grantee);
  }

  /**
   * Grant read-only access to a Lambda function
   */
  grantRead(grantee: iam.IGrantable): void {
    this.domain.grantRead(grantee);
  }
}
