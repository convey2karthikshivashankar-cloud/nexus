import { SchemaRegistryPort } from '../ports/SchemaRegistryPort';

/**
 * Factory for creating SchemaRegistry instances based on environment
 * Supports AWS Glue, Confluent, and other implementations
 */
export class SchemaRegistryFactory {
  static create(config?: SchemaRegistryConfig): SchemaRegistryPort {
    const provider = config?.provider || process.env.SCHEMA_REGISTRY_PROVIDER || 'aws';
    
    switch (provider.toLowerCase()) {
      case 'aws':
      case 'glue':
        return SchemaRegistryFactory.createAWSGlue(config);
      
      case 'confluent':
        return SchemaRegistryFactory.createConfluent(config);
      
      default:
        throw new Error(`Unsupported schema registry provider: ${provider}`);
    }
  }
  
  private static createAWSGlue(config?: SchemaRegistryConfig): SchemaRegistryPort {
    // Dynamic import to avoid bundling unused adapters
    const { GlueSchemaRegistry } = require('@nexus/adapters-aws');
    
    return new GlueSchemaRegistry({
      registryName: config?.registryName || process.env.SCHEMA_REGISTRY_NAME || 'nexus-event-schema-registry',
      region: config?.region || process.env.AWS_REGION || 'us-east-1',
      enableLogging: config?.enableLogging ?? false,
    });
  }
  
  private static createConfluent(config?: SchemaRegistryConfig): SchemaRegistryPort {
    // Dynamic import to avoid bundling unused adapters
    const { ConfluentSchemaRegistry } = require('@nexus/adapters-opensource');
    
    return new ConfluentSchemaRegistry({
      url: config?.url || process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081',
      enableLogging: config?.enableLogging ?? false,
    });
  }
}

export interface SchemaRegistryConfig {
  provider?: 'aws' | 'glue' | 'confluent';
  registryName?: string;
  region?: string;
  url?: string;
  enableLogging?: boolean;
}
