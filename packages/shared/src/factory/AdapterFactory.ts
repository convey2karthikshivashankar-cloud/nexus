import { EventStorePort, SnapshotStorePort, SchemaRegistryPort } from '../ports';

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'opensource';

export interface AdapterConfig {
  provider: CloudProvider;
  eventStore?: Record<string, unknown>;
  snapshotStore?: Record<string, unknown>;
  schemaRegistry?: Record<string, unknown>;
}

/**
 * Factory for creating vendor-specific adapters
 * Defaults to AWS but supports plug-and-play of other providers
 * 
 * @example
 * ```typescript
 * const eventStore = await AdapterFactory.createEventStore({
 *   provider: 'aws',
 *   eventStore: { tableName: 'Events', region: 'us-east-1' }
 * });
 * ```
 */
export class AdapterFactory {
  /**
   * Create an EventStore adapter for the specified provider
   * @throws Error if the adapter package is not installed
   */
  static async createEventStore(config: AdapterConfig): Promise<EventStorePort> {
    if (!config.eventStore) {
      throw new Error('AdapterFactory.createEventStore: eventStore config is required');
    }

    switch (config.provider) {
      case 'aws': {
        try {
          const { DynamoDBEventStore } = await import('@nexus/adapters-aws');
          return new DynamoDBEventStore(config.eventStore as any);
        } catch (error: any) {
          if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
            throw new Error(
              'AWS adapter not installed. Run: npm install @nexus/adapters-aws\n' +
              'Or add "@nexus/adapters-aws": "^1.0.0" to your package.json dependencies.'
            );
          }
          throw error;
        }
      }
      
      case 'opensource':
        throw new Error(
          'EventStoreDB adapter is not yet fully implemented.\n' +
          'For production use, please use the AWS adapter or contribute an implementation.\n' +
          'See: https://github.com/nexus-blueprint/nexus/blob/main/CONTRIBUTING.md'
        );
      
      case 'gcp':
        throw new Error(
          'GCP Firestore adapter not yet implemented.\n' +
          'Contributions welcome! See: https://github.com/nexus-blueprint/nexus/issues'
        );
      
      case 'azure':
        throw new Error(
          'Azure CosmosDB adapter not yet implemented.\n' +
          'Contributions welcome! See: https://github.com/nexus-blueprint/nexus/issues'
        );
      
      default:
        throw new Error(`Unknown provider: ${config.provider}. Supported: aws, gcp, azure, opensource`);
    }
  }

  /**
   * Create a SnapshotStore adapter for the specified provider
   * @throws Error if the adapter package is not installed
   */
  static async createSnapshotStore(config: AdapterConfig): Promise<SnapshotStorePort> {
    if (!config.snapshotStore) {
      throw new Error('AdapterFactory.createSnapshotStore: snapshotStore config is required');
    }

    switch (config.provider) {
      case 'aws': {
        try {
          const { DynamoDBSnapshotStore } = await import('@nexus/adapters-aws');
          return new DynamoDBSnapshotStore(config.snapshotStore as any);
        } catch (error: any) {
          if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
            throw new Error(
              'AWS adapter not installed. Run: npm install @nexus/adapters-aws\n' +
              'Or add "@nexus/adapters-aws": "^1.0.0" to your package.json dependencies.'
            );
          }
          throw error;
        }
      }
      
      case 'opensource':
        throw new Error(
          'Open source snapshot store not yet implemented.\n' +
          'For production use, please use the AWS adapter.'
        );
      
      case 'gcp':
        throw new Error(
          'GCP Firestore snapshot adapter not yet implemented.\n' +
          'Contributions welcome! See: https://github.com/nexus-blueprint/nexus/issues'
        );
      
      case 'azure':
        throw new Error(
          'Azure CosmosDB snapshot adapter not yet implemented.\n' +
          'Contributions welcome! See: https://github.com/nexus-blueprint/nexus/issues'
        );
      
      default:
        throw new Error(`Unknown provider: ${config.provider}. Supported: aws, gcp, azure, opensource`);
    }
  }

  /**
   * Create a SchemaRegistry adapter for the specified provider
   * @throws Error if the adapter package is not installed
   */
  static async createSchemaRegistry(config: AdapterConfig): Promise<SchemaRegistryPort> {
    if (!config.schemaRegistry) {
      throw new Error('AdapterFactory.createSchemaRegistry: schemaRegistry config is required');
    }

    switch (config.provider) {
      case 'aws': {
        try {
          const { GlueSchemaRegistry } = await import('@nexus/adapters-aws');
          return new GlueSchemaRegistry(config.schemaRegistry as any);
        } catch (error: any) {
          if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
            throw new Error(
              'AWS adapter not installed. Run: npm install @nexus/adapters-aws\n' +
              'Or add "@nexus/adapters-aws": "^1.0.0" to your package.json dependencies.'
            );
          }
          throw error;
        }
      }
      
      case 'opensource':
        throw new Error(
          'Confluent Schema Registry adapter is not yet fully implemented.\n' +
          'For production use, please use the AWS Glue adapter or contribute an implementation.\n' +
          'See: https://github.com/nexus-blueprint/nexus/blob/main/CONTRIBUTING.md'
        );
      
      case 'gcp':
        throw new Error(
          'GCP schema registry adapter not yet implemented.\n' +
          'Contributions welcome! See: https://github.com/nexus-blueprint/nexus/issues'
        );
      
      case 'azure':
        throw new Error(
          'Azure schema registry adapter not yet implemented.\n' +
          'Contributions welcome! See: https://github.com/nexus-blueprint/nexus/issues'
        );
      
      default:
        throw new Error(`Unknown provider: ${config.provider}. Supported: aws, gcp, azure, opensource`);
    }
  }
}
