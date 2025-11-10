# Nexus Blueprint Policy Engine

This directory contains Open Policy Agent (OPA) policies that enforce architectural constraints for the Nexus Blueprint 3.0 system.

## Overview

The Policy Engine implements **governance-first architecture** by validating code changes against architectural rules before deployment. This ensures the system maintains its design principles throughout development.

## Policies

### 1. Service Decoupling (`nexus_architecture.rego`)

**Rule**: Services must communicate via Event Bus only

- ❌ **Prohibited**: Direct HTTP/gRPC calls between Command Service and Query Dashboard
- ✅ **Allowed**: Communication through Kinesis/SNS/SQS Event Bus

**Rationale**: Maintains loose coupling and enables independent scaling

### 2. Event Store Immutability

**Rule**: Event Store is append-only

- ❌ **Prohibited**: UPDATE or DELETE operations on EventStore table
- ✅ **Allowed**: INSERT operations only

**Rationale**: Ensures complete audit trail and temporal query capability

### 3. Schema Registration

**Rule**: All events must have registered schemas

- ❌ **Prohibited**: Publishing events without registered schemas
- ✅ **Allowed**: Events with schemas in Schema Registry

**Rationale**: Enables schema evolution and compatibility validation

### 4. Temporal Query Rate Limiting

**Rule**: Temporal queries must be rate-limited

- ❌ **Prohibited**: Temporal query endpoints without rate limiting
- ✅ **Allowed**: Endpoints with 10 requests/minute/client limit

**Rationale**: Prevents resource exhaustion from expensive historical queries

### 5. Snapshot Immutability

**Rule**: Snapshots are append-only

- ❌ **Prohibited**: UPDATE operations on Snapshots table
- ✅ **Allowed**: Creating new snapshot versions

**Rationale**: Maintains snapshot versioning integrity

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/policy-validation.yml` workflow runs on every push and pull request:

1. **OPA Policy Tests**: Validates policy logic
2. **Dependency Graph Generation**: Analyzes service communication patterns
3. **Service Decoupling Validation**: Detects direct service calls
4. **Event Store Immutability Check**: Scans for mutation operations
5. **Schema Registration Validation**: Ensures all events have schemas
6. **Rate Limiting Verification**: Checks temporal query endpoints

**Critical**: Deployment is **blocked** if any policy violations are detected.

### Pre-commit Hook

Install the pre-commit hook to catch violations before committing:

```bash
chmod +x scripts/pre-commit-policy-check.sh
ln -s ../../scripts/pre-commit-policy-check.sh .git/hooks/pre-commit
```

The hook runs the same checks as CI/CD locally.

## Running Policy Tests

### Run all policy tests

```bash
opa test policies/ -v
```

### Run specific test

```bash
opa test policies/nexus_architecture_test.rego -v
```

### Evaluate policy against input

```bash
opa eval --data policies/nexus_architecture.rego \
         --input test-input.json \
         --format pretty \
         'data.nexus.architecture.deny'
```

## Adding New Policies

### 1. Define the policy rule

Edit `policies/nexus_architecture.rego`:

```rego
# Rule: New architectural constraint
deny[msg] {
  input.type == "new_constraint_type"
  # ... conditions ...
  
  msg := "Violation message"
}
```

### 2. Add test cases

Edit `policies/nexus_architecture_test.rego`:

```rego
test_new_constraint {
  deny["Violation message"] with input as {
    "type": "new_constraint_type",
    # ... test data ...
  }
}
```

### 3. Update CI/CD workflow

Add validation step in `.github/workflows/policy-validation.yml`:

```yaml
- name: Validate new constraint
  run: |
    echo "Validating new constraint..."
    # ... validation logic ...
```

### 4. Update pre-commit hook

Add check in `scripts/pre-commit-policy-check.sh`:

```bash
echo "🔍 Checking new constraint..."
# ... check logic ...
```

## Policy Violation Examples

### ❌ Direct Service Call

```typescript
// VIOLATION: Direct HTTP call
const response = await axios.get('http://query-dashboard/api/orders');
```

**Fix**: Use Event Bus

```typescript
// CORRECT: Publish event
await eventBus.publish({
  eventType: 'OrderQueryRequested',
  payload: { orderId: '123' }
});
```

### ❌ Event Store Mutation

```typescript
// VIOLATION: Updating event
await dynamodb.send(new UpdateCommand({
  TableName: 'EventStore',
  Key: { aggregateId: 'order-123' },
  UpdateExpression: 'SET payload = :payload'
}));
```

**Fix**: Events are immutable

```typescript
// CORRECT: Append new event
await eventStore.append([{
  eventType: 'OrderCorrected',
  payload: { /* corrected data */ }
}]);
```

### ❌ Unregistered Schema

```typescript
// VIOLATION: No schema registered
await eventBus.publish({
  eventType: 'NewEventType',
  payload: { /* data */ }
});
```

**Fix**: Register schema first

```typescript
// CORRECT: Register schema
await schemaRegistry.registerSchema(
  'NewEventType',
  schemaDefinition,
  'BACKWARD'
);

// Then publish event
await eventBus.publish({
  eventType: 'NewEventType',
  payload: { /* data */ }
});
```

### ❌ Missing Rate Limit

```typescript
// VIOLATION: No rate limiting
app.get('/api/queries/temporal/:id', async (req, res) => {
  const events = await eventStore.getEventsByTimeRange(/*...*/);
  res.json(events);
});
```

**Fix**: Add rate limiting

```typescript
// CORRECT: With rate limiting
app.get('/api/queries/temporal/:id', 
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (req, res) => {
    const events = await eventStore.getEventsByTimeRange(/*...*/);
    res.json(events);
  }
);
```

## Troubleshooting

### Policy test failures

```bash
# Run tests with verbose output
opa test policies/ -v

# Check specific policy
opa eval --data policies/nexus_architecture.rego \
         'data.nexus.architecture.deny'
```

### CI/CD workflow failures

1. Check workflow logs in GitHub Actions
2. Run dependency graph generator locally:
   ```bash
   node scripts/generate-dependency-graph.js > dependency-graph.json
   ```
3. Validate against policies:
   ```bash
   opa eval --data policies/nexus_architecture.rego \
            --input dependency-graph.json \
            'data.nexus.architecture.deny'
   ```

### Pre-commit hook issues

```bash
# Make hook executable
chmod +x scripts/pre-commit-policy-check.sh

# Test hook manually
./scripts/pre-commit-policy-check.sh

# Bypass hook (not recommended)
git commit --no-verify
```

## References

- [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/latest/)
- [Rego Language Reference](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [OPA Testing](https://www.openpolicyagent.org/docs/latest/policy-testing/)
- [Nexus Blueprint Design Document](../.kiro/specs/nexus-blueprint-3.0/design.md)

## Support

For policy-related questions or issues:

1. Review this README
2. Check policy test output: `opa test policies/ -v`
3. Review CI/CD workflow logs
4. Consult the Nexus Blueprint design document
