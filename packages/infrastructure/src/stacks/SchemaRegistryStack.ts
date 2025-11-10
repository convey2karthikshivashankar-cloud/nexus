import * as cdk from 'aws-cdk-lib';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SchemaRegistryStack extends cdk.Stack {
  public readonly registryName: string;
  public readonly registryArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Schema Registry with BACKWARD compatibility mode
    const registry = new glue.CfnRegistry(this, 'NexusSchemaRegistry', {
      name: 'nexus-event-schema-registry',
      description: 'Schema registry for Nexus Blueprint event and command schemas with BACKWARD compatibility enforcement',
      tags: [
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'nexus-blueprint' },
        { key: 'ManagedBy', value: 'cdk' },
      ],
    });

    this.registryName = registry.name!;
    this.registryArn = registry.attrArn;

    // Add metadata for governance tracking
    registry.addMetadata('CompatibilityMode', 'BACKWARD');
    registry.addMetadata('Purpose', 'Event sourcing schema governance');

    // Create IAM role for schema operations
    const schemaRole = new iam.Role(this, 'SchemaRegistryRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions to access Schema Registry',
    });

    schemaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'glue:GetRegistry',
          'glue:GetSchema',
          'glue:GetSchemaVersion',
          'glue:RegisterSchemaVersion',
          'glue:CheckSchemaVersionValidity',
          'glue:GetSchemaByDefinition',
          'glue:ListSchemaVersions',
          'glue:CreateSchema',
          'glue:UpdateSchema',
        ],
        resources: [
          registry.attrArn,
          `${registry.attrArn}/*`,
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'SchemaRegistryName', {
      value: this.registryName,
      exportName: 'SchemaRegistryName',
    });

    new cdk.CfnOutput(this, 'SchemaRegistryArn', {
      value: this.registryArn,
      exportName: 'SchemaRegistryArn',
    });

    new cdk.CfnOutput(this, 'SchemaRoleArn', {
      value: schemaRole.roleArn,
      exportName: 'SchemaRoleArn',
    });
  }
}
