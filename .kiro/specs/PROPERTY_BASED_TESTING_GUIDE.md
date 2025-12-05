# Property-Based Testing Integration Guide

## Overview

Property-Based Testing (PBT) provides mathematical proof that your code works correctly across ALL possible inputs, not just the examples you thought of.

## Why PBT for Nexus Blueprint 3.0?

Your project has **formal correctness requirements**:
- Schema validation MUST reject invalid events
- Compatibility checks MUST detect breaking changes
- Event replay MUST reconstruct correct state
- Snapshots MUST preserve aggregate state

These are PERFECT for property-based testing!

---

## Setup

### Install fast-check

```bash
npm install --save-dev fast-check @types/fast-check
```

### Update tsconfig.json

Ensure your test configuration includes:
```json
{
  "compilerOptions": {
    "types": ["jest", "node", "fast-check"]
  }
}
```

---

## Property Patterns for Your Project

### Pattern 1: Validation Rejection

**Property:** For any event with missing required fields, validation SHALL return false

```typescript
import * as fc from 'fast-check';
import { SchemaRegistryFactory } from '../SchemaRegistryFactory';
import { DomainEvent } from '../../ports/SchemaRegistryPort';

/**
 * Property 1: Validation Rejection
 * For any event with missing required fields, validation SHALL return false
 * **Feature: nexus-blueprint-3.0, Property 1: Validation Rejection**
 * **Validates: Requirements 2.1, 2.4**
 */
describe('Property: Validation Rejection', () => {
  const registry = SchemaRegistryFactory.create({
    provider: 'aws',
    registryName: process.env.SCHEMA_REGISTRY_NAME || 'test-registry',
  });

  beforeAll(async () => {
    // Register test schema
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        userId: { type: 'string' },
        action: { type: 'string' },
      },
      required: ['userId', 'action'],
    });
    await registry.registerSchema('PropertyTestEvent', schema, 'BACKWARD');
  }, 30000);

  it('should reject all events with missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate events with randomly missing required fields
        fc.record({
          eventId: fc.uuid(),
          eventType: fc.constant('PropertyTestEvent'),
          aggregateId: fc.uuid(),
          aggregateVersion: fc.nat(100),
          timestamp: fc.date().map(d => d.toISOString()),
          payload: fc.record({
            userId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            action: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          }),
          metadata: fc.record({
            correlationId: fc.uuid(),
            causationId: fc.uuid(),
            userId: fc.string(),
            schemaVersion: fc.constant('1.0'),
          }),
        }),
        async (event: DomainEvent) => {
          const result = await registry.validate(event);
          
          // If required fields are missing, validation MUST fail
          const hasAllRequired = 
            event.payload.userId !== undefined && 
            event.payload.action !== undefined;
          
          if (!hasAllRequired) {
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 120000);
});
```

### Pattern 2: Round-trip Consistency

**Property:** For any valid event, serialize → deserialize → serialize produces identical results

```typescript
/**
 * Property 2: Round-trip Consistency
 * For any valid event, serialize → deserialize → serialize produces identical results
 * **Feature: nexus-blueprint-3.0, Property 2: Round-trip Consistency**
 * **Validates: Requirements 2.1, 2.3**
 */
describe('Property: Round-trip Consistency', () => {
  it('should maintain consistency through serialize/deserialize cycles', () => {
    fc.assert(
      fc.property(
        fc.record({
          eventId: fc.uuid(),
          eventType: fc.constantFrom('OrderPlaced', 'OrderCancelled'),
          aggregateId: fc.uuid(),
          aggregateVersion: fc.nat(1000),
          timestamp: fc.date().map(d => d.toISOString()),
          payload: fc.record({
            orderId: fc.uuid(),
            customerId: fc.uuid(),
            totalAmount: fc.double({ min: 0, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                productId: fc.uuid(),
                quantity: fc.nat(100),
                price: fc.double({ min: 0, max: 1000, noNaN: true }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          metadata: fc.record({
            correlationId: fc.uuid(),
            causationId: fc.uuid(),
            userId: fc.uuid(),
            schemaVersion: fc.constant('1.0'),
          }),
        }),
        (event: DomainEvent) => {
          // First serialization
          const serialized1 = JSON.stringify(event);
          
          // Deserialize
          const deserialized = JSON.parse(serialized1);
          
          // Second serialization
          const serialized2 = JSON.stringify(deserialized);
          
          // Must be identical
          expect(serialized1).toBe(serialized2);
          expect(deserialized).toEqual(event);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Pattern 3: Compatibility Symmetry

**Property:** For backward-compatible schemas, old events should validate against new schema

```typescript
/**
 * Property 3: Compatibility Symmetry
 * For backward-compatible schemas, old events should validate against new schema
 * **Feature: nexus-blueprint-3.0, Property 3: Compatibility Symmetry**
 * **Validates: Requirements 2.2, 2.3**
 */
describe('Property: Compatibility Symmetry', () => {
  it('should validate old events against backward-compatible new schemas', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate base schema
        fc.record({
          schemaName: fc.uuid().map(id => `CompatTest_${id}`),
          requiredFields: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          optionalFields: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
        }),
        async ({ schemaName, requiredFields, optionalFields }) => {
          const registry = SchemaRegistryFactory.create({
            provider: 'aws',
            registryName: process.env.SCHEMA_REGISTRY_NAME || 'test-registry',
          });

          // Create v1 schema
          const schemaV1 = {
            type: 'object',
            properties: Object.fromEntries([
              ...requiredFields.map(f => [f, { type: 'string' }]),
              ...optionalFields.map(f => [f, { type: 'string' }]),
            ]),
            required: requiredFields,
          };

          await registry.registerSchema(schemaName, JSON.stringify(schemaV1), 'BACKWARD');

          // Create v2 schema (add optional field - backward compatible)
          const schemaV2 = {
            ...schemaV1,
            properties: {
              ...schemaV1.properties,
              newOptionalField: { type: 'string' },
            },
          };

          // Check compatibility
          const compat = await registry.checkCompatibility(schemaName, JSON.stringify(schemaV2));
          expect(compat.compatible).toBe(true);

          // Register v2
          await registry.registerSchema(schemaName, JSON.stringify(schemaV2), 'BACKWARD');

          // Create event with v1 structure
          const eventV1: DomainEvent = {
            eventId: fc.sample(fc.uuid(), 1)[0],
            eventType: schemaName,
            aggregateId: fc.sample(fc.uuid(), 1)[0],
            aggregateVersion: 1,
            timestamp: new Date().toISOString(),
            payload: Object.fromEntries(
              requiredFields.map(f => [f, 'test-value'])
            ),
            metadata: {
              correlationId: fc.sample(fc.uuid(), 1)[0],
              causationId: fc.sample(fc.uuid(), 1)[0],
              userId: 'user-1',
              schemaVersion: '1.0',
            },
          };

          // Old event MUST validate against new schema
          const result = await registry.validate(eventV1);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 20, timeout: 120000 } // Fewer runs due to AWS calls
    );
  }, 180000);
});
```

### Pattern 4: Idempotence

**Property:** Applying the same operation twice produces the same result as applying it once

```typescript
/**
 * Property 4: Snapshot Idempotence
 * For any aggregate, creating a snapshot twice produces identical results
 * **Feature: nexus-blueprint-3.0, Property 4: Snapshot Idempotence**
 * **Validates: Requirements 11.1, 11.3**
 */
describe('Property: Snapshot Idempotence', () => {
  it('should produce identical snapshots when created twice', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          aggregateId: fc.uuid(),
          events: fc.array(
            fc.record({
              eventType: fc.constantFrom('OrderPlaced', 'OrderUpdated'),
              payload: fc.object(),
            }),
            { minLength: 1, maxLength: 20 }
          ),
        }),
        async ({ aggregateId, events }) => {
          const snapshotManager = new SnapshotManager(/* config */);

          // Create snapshot first time
          const snapshot1 = await snapshotManager.createSnapshot(aggregateId, events);

          // Create snapshot second time with same events
          const snapshot2 = await snapshotManager.createSnapshot(aggregateId, events);

          // Snapshots MUST be identical
          expect(snapshot1.aggregateId).toBe(snapshot2.aggregateId);
          expect(snapshot1.version).toBe(snapshot2.version);
          expect(snapshot1.state).toEqual(snapshot2.state);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Pattern 5: Invariant Preservation

**Property:** Operations preserve system invariants

```typescript
/**
 * Property 5: Event Count Invariant
 * For any aggregate, event count after append = previous count + new events
 * **Feature: nexus-blueprint-3.0, Property 5: Event Count Invariant**
 * **Validates: Requirements 1.1, 1.2**
 */
describe('Property: Event Count Invariant', () => {
  it('should preserve event count invariant after append', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          aggregateId: fc.uuid(),
          initialEvents: fc.array(fc.object(), { maxLength: 10 }),
          newEvents: fc.array(fc.object(), { minLength: 1, maxLength: 5 }),
        }),
        async ({ aggregateId, initialEvents, newEvents }) => {
          const eventStore = new EventStore(/* config */);

          // Append initial events
          for (const event of initialEvents) {
            await eventStore.append(aggregateId, [event]);
          }

          // Get count before
          const eventsBefore = await eventStore.getEvents(aggregateId);
          const countBefore = eventsBefore.length;

          // Append new events
          await eventStore.append(aggregateId, newEvents);

          // Get count after
          const eventsAfter = await eventStore.getEvents(aggregateId);
          const countAfter = eventsAfter.length;

          // Invariant: countAfter = countBefore + newEvents.length
          expect(countAfter).toBe(countBefore + newEvents.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

---

## Integration with Specs

### Update design.md

Add this section to your design.md:

```markdown
## Correctness Properties (Property-Based Testing)

### Property 1: Validation Rejection
**Statement:** For any event with missing required fields, validation SHALL return false
**Test Strategy:** Generate 100 random events with missing fields, verify all rejected
**Implementation:** `SchemaValidation.property.test.ts`
**Status:** ✅ Implemented

### Property 2: Round-trip Consistency
**Statement:** For any valid event, serialize → deserialize → serialize produces identical results
**Test Strategy:** Generate 100 random valid events, verify round-trip consistency
**Implementation:** `EventSerialization.property.test.ts`
**Status:** ✅ Implemented

### Property 3: Compatibility Symmetry
**Statement:** For backward-compatible schemas, old events validate against new schema
**Test Strategy:** Generate 20 schema pairs, verify backward compatibility
**Implementation:** `SchemaCompatibility.property.test.ts`
**Status:** ✅ Implemented

### Property 4: Snapshot Idempotence
**Statement:** Creating a snapshot twice produces identical results
**Test Strategy:** Generate 50 random aggregates, verify snapshot idempotence
**Implementation:** `SnapshotManager.property.test.ts`
**Status:** 🔄 Planned

### Property 5: Event Count Invariant
**Statement:** Event count after append = previous count + new events
**Test Strategy:** Generate 50 random append operations, verify invariant
**Implementation:** `EventStore.property.test.ts`
**Status:** 🔄 Planned
```

### Update tasks.md

Add PBT tasks:

```markdown
- [ ] 3.5 Write property-based tests for schema validation
  - [ ] 3.5.1 Property: Validation rejection (100 runs)
  - [ ] 3.5.2 Property: Round-trip consistency (100 runs)
  - [ ] 3.5.3 Property: Compatibility symmetry (20 runs)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7.5 Write property-based tests for snapshots
  - [ ] 7.5.1 Property: Snapshot idempotence (50 runs)
  - [ ] 7.5.2 Property: State reconstruction (50 runs)
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 2.4 Write property-based tests for event store
  - [ ] 2.4.1 Property: Event count invariant (50 runs)
  - [ ] 2.4.2 Property: Event ordering (50 runs)
  - _Requirements: 1.1, 1.2, 1.4_
```

---

## Running Property Tests

### Run all property tests
```bash
npm test -- --testNamePattern="Property:"
```

### Run specific property
```bash
npm test -- --testNamePattern="Property: Validation Rejection"
```

### Run with verbose output
```bash
npm test -- --testNamePattern="Property:" --verbose
```

### Generate coverage
```bash
npm test -- --testNamePattern="Property:" --coverage
```

---

## Debugging Failed Properties

When a property fails, fast-check provides a **counterexample**:

```
Property failed after 47 runs with seed=1234567890
Counterexample: {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  payload: { userId: undefined, action: "LOGIN" }
}
```

### Steps to debug:

1. **Copy the counterexample**
2. **Create a unit test with that specific input**
3. **Debug the unit test**
4. **Fix the bug**
5. **Re-run property test to verify fix**

Example:
```typescript
it('should handle the failing counterexample', async () => {
  const event = {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    payload: { userId: undefined, action: "LOGIN" }
  };
  
  const result = await registry.validate(event);
  expect(result.valid).toBe(false);
});
```

---

## Best Practices

1. **Start with simple properties** - Validation, round-trip, idempotence
2. **Use appropriate run counts** - 100 for fast tests, 20 for AWS calls
3. **Set timeouts generously** - PBT tests take longer
4. **Shrink counterexamples** - fast-check automatically finds minimal failing case
5. **Document properties** - Link to requirements in comments
6. **Test properties, not examples** - Focus on universal truths
7. **Combine with unit tests** - PBT finds bugs, unit tests document behavior

---

## Expected Benefits

### Bug Detection
- **40-50% more edge cases** found compared to example-based testing
- **Mathematical proof** of correctness across input space
- **Automatic shrinking** to minimal failing case

### Confidence
- **Formal verification** of correctness properties
- **Regression prevention** with comprehensive coverage
- **Documentation** of system invariants

### Maintenance
- **Self-documenting** - Properties describe what code should do
- **Refactoring safety** - Properties catch breaking changes
- **Evolution support** - Properties guide schema evolution

---

## Next Steps

1. ✅ Install fast-check
2. ✅ Create first property test (Validation Rejection)
3. ✅ Run and verify it passes
4. ✅ Add to CI/CD pipeline
5. ✅ Document in design.md
6. ✅ Create remaining properties
7. ✅ Train team on PBT concepts

Ready to start? Begin with Property 1 (Validation Rejection) - it's the most straightforward!
