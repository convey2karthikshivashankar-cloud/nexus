# CI/CD Policy Enforcement Guide

## Overview

The Nexus Blueprint 3.0 implements **governance-first architecture** through automated policy enforcement in the CI/CD pipeline. All architectural constraints are validated before deployment, ensuring the system maintains its integrity.

## Policy Enforcement Workflow

### Trigger Events

The policy validation workflow runs on:
- **Push** to `main` or `develop` branches
- **Pull requests** targeting `main` or `develop`

### Validation Steps

#### 1. OPA Policy Tests

**Purpose**: Validate policy rules are correctly defined  
**Tool**: Open Policy Agent (OPA)  
**Command**: `opa test policies/ -v`

Tests all `.rego` policy files in the `policies/` directory.

#### 2. Service Decoupling Validation

**Purpose**: Ensure services communicate only via Event Bus  
**Policy**: No direct HTTP calls between Command Service and Query Dashboard  
**Enforcement**: Analyzes service dependency graph

**Violations Detected**:
- Direct HTTP calls between services
- Synchronous RPC calls
- Bypassing Event Bus

**Example Violation**:
```typescript
// ❌ VIOLATION: Direct service call
const result = await fetch('http://query-dashboard/api/orders');

// ✅ CORRECT: Event-driven communication
await eventBus.publish(orderPlacedEvent);
```

#### 3. Event Store Immutability

**Purpose**: Prevent destructive operations on Event Store  
**Policy**: Only INSERT operations allowed on EventStore table  
**Enforcement**: Scans codebase for UPDATE/DELETE operations

**Violations Detected**:
- `UPDATE` statements on EventStore
- `DELETE` statements on EventStore
- Mutations to existing events

**Example Violation**:
```typescript
// ❌ VIOLATION: Mutating event
await dynamodb.update({
  TableName: 'EventStore',
  Key: { aggregateId, version },
  UpdateExpression: 'SET payload = :payload'
});

// ✅ CORRECT: Append-only
await dynamodb.put({
  TableName: 'EventStore',
  Item: newEvent
});
```

#### 4. Schema Registration Validation

**Purpose**: Ensure all events have registered schemas  
**Policy**: Every event type must have a corresponding schema file  
**Enforcement**: Compares event types in code with schema files

**Violations Detected**:
- Event types without schema files
- Unregistered event types being published

**Example Violation**:
```typescript
// ❌ VIOLATION: No schema for NewEventType
const event = {
  eventType: 'NewEventType', // No schemas/NewEventType.json
  // ...
};

// ✅ CORRECT: Schema exists
const event = {
  eventType: 'OrderPlaced', // schemas/OrderPlaced.json exists
  // ...
};
```

#### 5. JSON Schema Syntax Validation

**Purpose**: Ensure schema files are valid JSON  
**Tool**: `jq`  
**Enforcement**: Validates all `.json` files in `schemas/` directory

**Violations Detected**:
- Malformed JSON
- Syntax errors
- Invalid schema structure

#### 6. Schema Compatibility Validation (Optional)

**Purpose**: Verify schema changes are backward compatible  
**Tool**: AWS Glue Schema Registry integration tests  
**Enforcement**: Runs compatibility checks against deployed registry

**Requirements**:
- AWS credentials configured
- Schema Registry deployed
- Integration tests passing

**Violations Detected**:
- Breaking schema changes
- Removed required fields
- Changed field types
- Made optional fields required

#### 7. Schema Validation Enforcement

**Purpose**: Verify schema validation is implemented in event publishing  
**Policy**: All event publication paths must validate against schema registry  
**Enforcement**: Checks for `schemaRegistry.validate()` calls

**Locations Checked**:
- `EventStore.append()` - Command Service
- `EventRouter.handler()` - Event Router

**Violations Detected**:
- Missing schema validation
- Bypassing validation
- Publishing without validation

#### 8. Temporal Query Rate Limiting

**Purpose**: Ensure temporal queries have rate limiting  
**Policy**: 10 requests/minute/client for temporal query endpoints  
**Enforcement**: Checks for rate limiting implementation

**Violations Detected**:
- Missing rate limiting
- Incorrect rate limits
- Bypassing rate limiter

## Deployment Blocking

### Critical Violations

If **any** policy validation fails, the deployment is **automatically blocked**:

```
🚫 DEPLOYMENT BLOCKED
Policy violations detected!
Lambda deployments are blocked until violations are resolved.
```

### Resolution Process

1. **Review Violations**: Check the policy-validation job logs
2. **Fix Issues**: Address all reported violations
3. **Re-run Pipeline**: Push fixes to trigger re-validation
4. **Deployment Proceeds**: Once all policies pass, deployment continues

## Local Policy Validation

### Pre-Commit Hook

Run policy validation before committing:

```bash
./scripts/pre-commit-policy-check.sh
```

This script runs:
- OPA policy tests
- Schema syntax validation
- Basic policy checks

### Manual Validation

Run the full policy validation suite locally:

```bash
# Install OPA
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa
sudo mv opa /usr/local/bin/

# Run policy tests
opa test policies/ -v

# Generate dependency graph
node scripts/generate-dependency-graph.js > dependency-graph.json

# Validate policies
opa eval --data policies/nexus_architecture.rego \
         --input dependency-graph.json \
         --format pretty \
         'data.nexus.architecture.deny'
```

## Policy Files

### Location

All policy files are in the `policies/` directory:

```
policies/
├── nexus_architecture.rego    # Main architectural policies
├── nexus_architecture_test.rego  # Policy tests
└── README.md                   # Policy documentation
```

### Policy Rules

#### Service Decoupling

```rego
deny[msg] {
  input.type == "service_call"
  input.source == "command_service"
  input.target == "query_dashboard"
  input.protocol == "http"
  
  msg := "Direct HTTP calls between Command Service and Query Dashboard are prohibited. Use Event Bus."
}
```

#### Event Store Immutability

```rego
deny[msg] {
  input.type == "database_operation"
  input.table == "EventStore"
  input.operation in ["UPDATE", "DELETE"]
  
  msg := "Event Store mutations are prohibited. Only INSERT operations allowed."
}
```

#### Schema Registration

```rego
deny[msg] {
  input.type == "event_publish"
  not schema_exists(input.eventType)
  
  msg := sprintf("Event type '%s' has no registered schema in Schema Registry", [input.eventType])
}
```

#### Temporal Query Rate Limiting

```rego
deny[msg] {
  input.type == "api_endpoint"
  input.path == "/api/queries/temporal/*"
  not has_rate_limit(input, 10)
  
  msg := "Temporal query endpoints must have rate limit of 10 requests/minute/client"
}
```

## Adding New Policies

### 1. Define Policy Rule

Create or update `.rego` file in `policies/`:

```rego
package nexus.architecture

deny[msg] {
  # Your policy condition
  input.type == "new_violation_type"
  
  msg := "Your policy violation message"
}
```

### 2. Add Policy Tests

Create tests in `policies/nexus_architecture_test.rego`:

```rego
test_new_policy {
  deny["Your policy violation message"] with input as {
    "type": "new_violation_type"
  }
}
```

### 3. Update CI/CD Workflow

Add validation step in `.github/workflows/policy-validation.yml`:

```yaml
- name: Validate new policy
  run: |
    echo "Validating new policy..."
    # Your validation logic
```

### 4. Document Policy

Update `policies/README.md` with:
- Policy description
- Rationale
- Examples of violations
- How to fix violations

## Monitoring Policy Compliance

### GitHub Actions

View policy validation results:
1. Go to repository **Actions** tab
2. Select **Policy Validation** workflow
3. Review job logs for violations

### Metrics

Track policy compliance metrics:
- Policy validation success rate
- Common violations
- Time to fix violations
- Deployment blocking frequency

### Alerts

Configure alerts for:
- Repeated policy violations
- Deployment blocks
- Policy test failures

## Troubleshooting

### OPA Installation Fails

```bash
# Manual installation
wget https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa_linux_amd64
sudo mv opa_linux_amd64 /usr/local/bin/opa
```

### Dependency Graph Generation Fails

```bash
# Check Node.js version
node --version  # Should be 18+

# Install dependencies
npm install

# Run manually
node scripts/generate-dependency-graph.js
```

### Schema Validation Fails

```bash
# Validate JSON syntax
jq empty schemas/YourSchema.json

# Check schema registration
ls -la schemas/

# Verify schema format
cat schemas/YourSchema.json | jq .
```

### False Positives

If a policy check produces false positives:

1. Review the policy rule
2. Update the rule to be more specific
3. Add exceptions if necessary
4. Document the exception

## Best Practices

### 1. Run Policies Locally

Always run policy validation before pushing:

```bash
./scripts/pre-commit-policy-check.sh
```

### 2. Keep Policies Simple

- One policy per rule
- Clear violation messages
- Easy to understand conditions

### 3. Test Policy Changes

Always add tests when modifying policies:

```bash
opa test policies/ -v
```

### 4. Document Exceptions

If you need to bypass a policy:
- Document the reason
- Get approval
- Add a time-bound exception

### 5. Monitor Compliance

Regularly review:
- Policy violation trends
- Common issues
- Policy effectiveness

## Integration with Deployment Pipeline

### Deployment Flow

```
Code Push
    ↓
Policy Validation (BLOCKS if fails)
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
Build
    ↓
Deploy to Staging
    ↓
E2E Tests
    ↓
Deploy to Production
```

### Rollback on Policy Violation

If a policy violation is detected post-deployment:

1. **Immediate Rollback**: Revert to previous version
2. **Root Cause Analysis**: Identify how violation passed CI/CD
3. **Fix Policy**: Update policy to catch the violation
4. **Re-deploy**: Deploy fix with updated policies

## References

- [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/latest/)
- [Nexus Blueprint Requirements](../.kiro/specs/nexus-blueprint-3.0/requirements.md) - Requirement 9
- [Policy Files](../policies/README.md)
- [GitHub Actions Workflow](../.github/workflows/policy-validation.yml)

## Support

For policy-related questions:
1. Review this documentation
2. Check `policies/README.md`
3. Review policy test files
4. Consult the architecture team
