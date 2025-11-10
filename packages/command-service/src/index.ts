import { CommandController } from './api/CommandController';
import { AdapterFactory, CloudProvider } from '@nexus/shared';

// Configuration: Select cloud provider (defaults to AWS)
const provider: CloudProvider = (process.env.CLOUD_PROVIDER as CloudProvider) || 'aws';

// Create adapters using factory pattern
const schemaRegistry = AdapterFactory.createSchemaRegistry({
  provider,
  schemaRegistry: {
    region: process.env.AWS_REGION || 'us-east-1',
    registryName: process.env.SCHEMA_REGISTRY_NAME || 'nexus-event-schema-registry',
  },
});

const eventStore = AdapterFactory.createEventStore(
  {
    provider,
    eventStore: {
      region: process.env.AWS_REGION || 'us-east-1',
      tableName: process.env.EVENT_STORE_TABLE || 'nexus-event-store',
    },
  },
  schemaRegistry
);

const snapshotStore = AdapterFactory.createSnapshotStore({
  provider,
  snapshotStore: {
    region: process.env.AWS_REGION || 'us-east-1',
    tableName: process.env.SNAPSHOTS_TABLE || 'nexus-snapshots',
  },
});

const controller = new CommandController();

// Register command handlers here
// controller.registerHandler('PlaceOrder', new PlaceOrderHandler(eventStore, snapshotStore));

export const handler = async (event: any) => {
  return await controller.handleRequest(event);
};

export { CommandController };
export * from './domain/CommandHandler';
