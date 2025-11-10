/**
 * Example usage of Schema Registry for event validation
 * This demonstrates how to use the SchemaRegistryFactory in your services
 */

import { SchemaRegistryFactory } from '../SchemaRegistryFactory';
import { DomainEvent } from '../../types';

async function exampleUsage() {
  // Create schema registry instance
  const registry = SchemaRegistryFactory.create({
    provider: 'aws',
    registryName: 'nexus-event-schema-registry',
    region: 'us-east-1',
    enableLogging: true,
  });

  // Example 1: Register a new schema
  const orderPlacedSchema = JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'Unique order identifier' },
      customerId: { type: 'string', description: 'Customer identifier' },
      totalAmount: { type: 'number', description: 'Order total amount' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'number' },
            price: { type: 'number' },
          },
          required: ['productId', 'quantity', 'price'],
        },
      },
    },
    required: ['orderId', 'customerId', 'totalAmount'],
  });

  const schemaVersion = await registry.registerSchema(
    'OrderPlaced',
    orderPlacedSchema,
    'BACKWARD'
  );

  console.log(`Schema registered: ${schemaVersion.schemaName} v${schemaVersion.version}`);

  // Example 2: Validate an event before publishing
  const event: DomainEvent = {
    eventId: 'evt-123',
    eventType: 'OrderPlaced',
    aggregateId: 'order-123',
    aggregateVersion: 1,
    timestamp: new Date().toISOString(),
    payload: {
      orderId: 'order-123',
      customerId: 'cust-456',
      totalAmount: 99.99,
      items: [
        { productId: 'prod-1', quantity: 2, price: 49.99 },
      ],
    },
    metadata: {
      correlationId: 'corr-1',
      causationId: 'cmd-1',
      userId: 'user-1',
      schemaVersion: '1.0',
    },
  };

  const validationResult = await registry.validate(event);

  if (validationResult.valid) {
    console.log('✅ Event is valid, safe to publish');
    // Proceed with event publication
  } else {
    console.error('❌ Event validation failed:', validationResult.errors);
    // Reject the command or throw an error
    throw new Error(`Invalid event: ${validationResult.errors?.join(', ')}`);
  }

  // Example 3: Check compatibility before deploying new schema version
  const newSchema = JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      orderId: { type: 'string' },
      customerId: { type: 'string' },
      totalAmount: { type: 'number' },
      items: { type: 'array' },
      orderDate: { type: 'string' }, // New optional field
      shippingAddress: { type: 'object' }, // New optional field
    },
    required: ['orderId', 'customerId', 'totalAmount'],
  });

  const compatibilityResult = await registry.checkCompatibility('OrderPlaced', newSchema);

  if (compatibilityResult.compatible) {
    console.log('✅ New schema is backward compatible');
    // Safe to register new version
    await registry.registerSchema('OrderPlaced', newSchema, 'BACKWARD');
  } else {
    console.error('❌ Schema is not compatible:', compatibilityResult.violations);
    // Reject the schema change
  }

  // Example 4: Retrieve schema for documentation or tooling
  const schema = await registry.getSchema('OrderPlaced');
  console.log('Current schema:', JSON.parse(schema));

  // Example 5: List all versions of a schema
  const versions = await registry.listSchemaVersions('OrderPlaced');
  console.log('Available versions:', versions.map(v => `v${v.version}`).join(', '));
}

// Export for use in other modules
export { exampleUsage };
