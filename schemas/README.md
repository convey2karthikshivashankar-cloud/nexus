# Event Schemas

This directory contains JSON Schema definitions for all domain events in the Nexus Blueprint system.

## Schema Registry

All schemas must be registered in AWS Glue Schema Registry before events can be published. The Schema Registry enforces BACKWARD compatibility to ensure system evolution doesn't break existing consumers.

## Registering Schemas

### Using the CLI Script

```bash
# Register all schemas
node scripts/register-schemas.js

# Register a specific schema
node scripts/register-schemas.js OrderPlaced
```

### Programmatically

```typescript
import { GlueSchemaRegistry } from '@nexus/adapters-aws';
import * as fs from 'fs';

const registry = new GlueSchemaRegistry({
  registryName: 'nexus-event-schema-registry',
  region: 'us-east-1',
  enableLogging: true,
});

const schemaDefinition = fs.readFileSync('./schemas/OrderPlaced.json', 'utf-8');

await registry.registerSchema(
  'OrderPlaced',
  schemaDefinition,
  'BACKWARD'
);
```

## Schema Files

### OrderPlaced.json

Event published when a customer places an order.

**Version**: 1.0  
**Compatibility**: BACKWARD  
**Required Fields**: orderId, customerId, totalAmount, items

### OrderCancelled.json

Event published when an order is cancelled.

**Version**: 1.0  
**Compatibility**: BACKWARD  
**Required Fields**: orderId, customerId, reason

## Schema Evolution Guidelines

### ✅ Allowed Changes (Backward Compatible)

1. **Add optional fields**
   ```json
   {
     "properties": {
       "existingField": { "type": "string" },
       "newOptionalField": { "type": "string" }
     },
     "required": ["existingField"]
   }
   ```

2. **Add new event types**
   - Create a new schema file
   - Register with BACKWARD compatibility

3. **Add enum values**
   ```json
   {
     "properties": {
       "status": {
         "type": "string",
         "enum": ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]
       }
     }
   }
   ```

### ❌ Breaking Changes (Not Allowed)

1. **Remove required fields**
   ```json
   // BAD: Removes customerId
   {
     "properties": {
       "orderId": { "type": "string" }
     },
     "required": ["orderId"]
   }
   ```

2. **Change field types**
   ```json
   // BAD: Changes totalAmount from number to string
   {
     "properties": {
       "totalAmount": { "type": "string" }
     }
   }
   ```

3. **Rename fields**
   ```json
   // BAD: Renames customerId to clientId
   {
     "properties": {
       "clientId": { "type": "string" }
     }
   }
   ```

4. **Make optional fields required**
   ```json
   // BAD: Makes orderDate required when it was optional
   {
     "required": ["orderId", "customerId", "orderDate"]
   }
   ```

## Schema Validation

All events are validated against their registered schemas before publication. Validation failures will prevent event publication and return detailed error messages.

### Example Validation

```typescript
const event: DomainEvent = {
  eventId: 'evt-123',
  eventType: 'OrderPlaced',
  aggregateId: 'order-123',
  aggregateVersion: 1,
  timestamp: '2025-01-01T00:00:00Z',
  payload: {
    orderId: 'order-123',
    customerId: 'cust-456',
    totalAmount: 99.99,
    items: [
      { productId: 'prod-1', quantity: 2, price: 49.99 }
    ]
  },
  metadata: {
    correlationId: 'corr-1',
    causationId: 'cmd-1',
    userId: 'user-1',
    schemaVersion: '1.0',
  },
};

const result = await registry.validate(event);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  // Example errors:
  // - "Missing required field: customerId"
  // - "Field 'totalAmount' has wrong type: expected number, got string"
}
```

## Testing Schemas

Run the schema validation tests:

```bash
cd packages/adapters/aws
npm test -- GlueSchemaRegistry.integration.test.ts
```

## Schema Versioning

Schemas follow semantic versioning:

- **Major version**: Breaking changes (requires explicit version increment)
- **Minor version**: Backward-compatible additions
- **Patch version**: Documentation or metadata updates

Example:
- `OrderPlaced` v1.0.0 → v1.1.0 (added optional field)
- `OrderPlaced` v1.1.0 → v2.0.0 (removed required field - breaking)

## Monitoring

Monitor schema operations in CloudWatch:

- Schema registration rate
- Validation failures
- Compatibility check failures

## References

- [JSON Schema Specification](https://json-schema.org/)
- [AWS Glue Schema Registry](https://docs.aws.amazon.com/glue/latest/dg/schema-registry.html)
- [Nexus Blueprint Requirements](../.kiro/specs/nexus-blueprint-3.0/requirements.md) - Requirement 8
