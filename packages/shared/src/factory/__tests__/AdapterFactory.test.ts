import { AdapterFactory, AdapterConfig, CloudProvider } from '../AdapterFactory';

/**
 * Unit tests for AdapterFactory
 * Tests input validation and error handling
 */
describe('AdapterFactory', () => {
  describe('createEventStore', () => {
    it('should throw error when eventStore config is missing', async () => {
      const config: AdapterConfig = {
        provider: 'aws',
      };

      await expect(AdapterFactory.createEventStore(config)).rejects.toThrow(
        'eventStore config is required'
      );
    });

    it('should throw helpful error for unsupported provider', async () => {
      const config: AdapterConfig = {
        provider: 'unknown' as CloudProvider,
        eventStore: { tableName: 'test' },
      };

      await expect(AdapterFactory.createEventStore(config)).rejects.toThrow(
        'Unknown provider: unknown'
      );
    });

    it('should throw helpful error for GCP provider', async () => {
      const config: AdapterConfig = {
        provider: 'gcp',
        eventStore: { projectId: 'test' },
      };

      await expect(AdapterFactory.createEventStore(config)).rejects.toThrow(
        'GCP Firestore adapter not yet implemented'
      );
    });

    it('should throw helpful error for Azure provider', async () => {
      const config: AdapterConfig = {
        provider: 'azure',
        eventStore: { connectionString: 'test' },
      };

      await expect(AdapterFactory.createEventStore(config)).rejects.toThrow(
        'Azure CosmosDB adapter not yet implemented'
      );
    });

    it('should throw helpful error for opensource provider', async () => {
      const config: AdapterConfig = {
        provider: 'opensource',
        eventStore: { connectionString: 'test' },
      };

      await expect(AdapterFactory.createEventStore(config)).rejects.toThrow(
        'EventStoreDB adapter is not yet fully implemented'
      );
    });
  });

  describe('createSnapshotStore', () => {
    it('should throw error when snapshotStore config is missing', async () => {
      const config: AdapterConfig = {
        provider: 'aws',
      };

      await expect(AdapterFactory.createSnapshotStore(config)).rejects.toThrow(
        'snapshotStore config is required'
      );
    });

    it('should throw helpful error for unsupported provider', async () => {
      const config: AdapterConfig = {
        provider: 'unknown' as CloudProvider,
        snapshotStore: { tableName: 'test' },
      };

      await expect(AdapterFactory.createSnapshotStore(config)).rejects.toThrow(
        'Unknown provider: unknown'
      );
    });

    it('should throw helpful error for opensource provider', async () => {
      const config: AdapterConfig = {
        provider: 'opensource',
        snapshotStore: { connectionString: 'test' },
      };

      await expect(AdapterFactory.createSnapshotStore(config)).rejects.toThrow(
        'Open source snapshot store not yet implemented'
      );
    });
  });

  describe('createSchemaRegistry', () => {
    it('should throw error when schemaRegistry config is missing', async () => {
      const config: AdapterConfig = {
        provider: 'aws',
      };

      await expect(AdapterFactory.createSchemaRegistry(config)).rejects.toThrow(
        'schemaRegistry config is required'
      );
    });

    it('should throw helpful error for unsupported provider', async () => {
      const config: AdapterConfig = {
        provider: 'unknown' as CloudProvider,
        schemaRegistry: { registryName: 'test' },
      };

      await expect(AdapterFactory.createSchemaRegistry(config)).rejects.toThrow(
        'Unknown provider: unknown'
      );
    });

    it('should throw helpful error for opensource provider', async () => {
      const config: AdapterConfig = {
        provider: 'opensource',
        schemaRegistry: { baseUrl: 'http://localhost:8081' },
      };

      await expect(AdapterFactory.createSchemaRegistry(config)).rejects.toThrow(
        'Confluent Schema Registry adapter is not yet fully implemented'
      );
    });
  });

  describe('Provider validation', () => {
    const providers: CloudProvider[] = ['aws', 'gcp', 'azure', 'opensource'];

    providers.forEach((provider) => {
      it(`should recognize ${provider} as a valid provider`, async () => {
        const config: AdapterConfig = {
          provider,
          eventStore: { tableName: 'test' },
        };

        // Should not throw "Unknown provider" error
        try {
          await AdapterFactory.createEventStore(config);
        } catch (error: any) {
          expect(error.message).not.toContain('Unknown provider');
        }
      });
    });
  });
});
