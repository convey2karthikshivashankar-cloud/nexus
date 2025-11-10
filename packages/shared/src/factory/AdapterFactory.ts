import { EventStorePort, SnapshotStorePort, SchemaRegistryPort } from '../ports';

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'opensource';

export interface AdapterConfig {
  provider: CloudProvider;
  eventStore: any;
  snapshotStore: any;
  schemaRegistry: any;
}

/**
 * Factory for creating vendor-specific adapters
 * Defaults to AWS but supports plug-and-play of other providers
 */
export class AdapterFactory {
  static async createEventStore(config: AdapterConfig): Promise<EventStorePort> {
    switch (config.provider) {
      case 'aws': {
        const { DynamoDBEventStore } = await import('@nexus/adapters-aws');
        return new DynamoDBEventStore(config.eventStore);
      }
      
      case 'opensource': {
        const { EventStoreDBAdapter } = await import('@nexus/adapters-opensource');
        return new EventStoreDBAdapter(config.eventStore.connectionString);
      }
      
      case 'gcp':
        throw new Error('GCP adapter not yet implemented. Contributions welcome!');
      
      case 'azure':
        throw new Error('Azure adapter not yet implemented. Contributions welcome!');
      
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  static async createSnapshotStore(config: AdapterConfig): Promise<SnapshotStorePort> {
    switch (config.provider) {
      case 'aws': {
        const { DynamoDBSnapshotStore } = await import('@nexus/adapters-aws');
        return new DynamoDBSnapshotStore(config.snapshotStore);
      }
      
      case 'opensource':
        // Could use same EventStoreDB or separate PostgreSQL
        throw new Error('Open source snapshot store not yet implemented. Use AWS for now.');
      
      case 'gcp':
        throw new Error('GCP adapter not yet implemented. Contributions welcome!');
      
      case 'azure':
        throw new Error('Azure adapter not yet implemented. Contributions welcome!');
      
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  static async createSchemaRegistry(config: AdapterConfig): Promise<SchemaRegistryPort> {
    switch (config.provider) {
      case 'aws': {
        const { GlueSchemaRegistry } = await import('@nexus/adapters-aws');
        return new GlueSchemaRegistry(config.schemaRegistry);
      }
      
      case 'opensource': {
        const { ConfluentSchemaRegistry } = await import('@nexus/adapters-opensource');
        return new ConfluentSchemaRegistry(config.schemaRegistry.baseUrl);
      }
      
      case 'gcp':
        throw new Error('GCP adapter not yet implemented. Contributions welcome!');
      
      case 'azure':
        throw new Error('Azure adapter not yet implemented. Contributions welcome!');
      
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
