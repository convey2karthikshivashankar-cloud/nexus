---
inclusion: fileMatch
fileMatchPattern: '**/__tests__/**/*.ts'
---

# Testing Patterns for Nexus Blueprint 3.0

## Test Structure

All tests should follow this structure:

```typescript
describe('ComponentName', () => {
  let component: ComponentType;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    mockDependency = createMock();
    component = new ComponentType(mockDependency);
  });

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = createTestInput();
      mockDependency.method.mockResolvedValue(expectedValue);

      // Act
      const result = await component.method(input);

      // Assert
      expect(result).toEqual(expectedValue);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });
  });
});
```

## Test Categories

### Unit Tests
- Test individual functions/classes
- Mock all dependencies
- Focus on business logic
- Fast execution (< 1s per test)

### Integration Tests
- Test component interactions
- Use real AWS services (LocalStack) or mocks
- Test data flow
- Slower execution (< 10s per test)

### Property-Based Tests
- Test universal properties
- Generate random inputs
- Run 100+ iterations
- Tag with: `**Feature: {name}, Property {n}: {description}**`

## Mocking AWS Services

### DynamoDB
```typescript
const mockDocClient = {
  send: jest.fn(),
};

// Mock successful response
mockDocClient.send.mockResolvedValue({
  Items: [{ id: '123', data: 'test' }],
  Count: 1,
});

// Mock error
mockDocClient.send.mockRejectedValue(
  new Error('ProvisionedThroughputExceededException')
);
```

### Lambda
```typescript
const mockLambda = {
  invoke: jest.fn().mockResolvedValue({
    StatusCode: 200,
    Payload: JSON.stringify({ success: true }),
  }),
};
```

## Test Data Generators

Create reusable test data generators:

```typescript
function createTestEvent(overrides = {}): DomainEvent {
  return {
    eventId: 'evt-test-123',
    eventType: 'TestEvent',
    aggregateId: 'agg-test-123',
    aggregateVersion: 1,
    timestamp: new Date().toISOString(),
    payload: {},
    metadata: {
      correlationId: 'corr-123',
      causationId: 'cmd-123',
      userId: 'user-123',
      schemaVersion: '1.0',
    },
    ...overrides,
  };
}
```

## Assertions

### Common Patterns
```typescript
// Exact match
expect(result).toEqual(expected);

// Partial match
expect(result).toMatchObject({ field: 'value' });

// Array contains
expect(array).toContain(item);
expect(array).toContainEqual(expect.objectContaining({ field: 'value' }));

// Function called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(expectedArg);
expect(mockFn).toHaveBeenCalledTimes(2);

// Async errors
await expect(asyncFn()).rejects.toThrow('Error message');

// Type checks
expect(typeof result).toBe('string');
expect(Array.isArray(result)).toBe(true);
```

## Test Coverage Requirements

- **Unit Tests**: > 80% coverage for business logic
- **Integration Tests**: All critical paths
- **Property Tests**: All correctness properties from design.md
- **Error Cases**: All error conditions

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- CommandHandler.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode (for development)
npm test -- --watch
```

## Test Naming

Use descriptive names that explain what is being tested:

```typescript
// ❌ Bad
it('test 1', () => { ... });

// ✅ Good
it('should reject command with missing required fields', () => { ... });
it('should create snapshot when event count exceeds threshold', () => { ... });
it('should retry failed projection with exponential backoff', () => { ... });
```

## Property-Based Test Template

```typescript
/**
 * Property 1: Round trip consistency
 * For any valid event, serializing then deserializing should produce equivalent value
 * **Feature: nexus-blueprint-3.0, Property 1: Round trip consistency**
 * **Validates: Requirements 2.1**
 */
describe('Property: Round trip consistency', () => {
  it('should maintain consistency through serialize/deserialize cycle', () => {
    fc.assert(
      fc.property(
        fc.record({
          eventId: fc.uuid(),
          eventType: fc.constantFrom('OrderPlaced', 'OrderCancelled'),
          aggregateId: fc.uuid(),
          // ... more fields
        }),
        (event) => {
          const serialized = JSON.stringify(event);
          const deserialized = JSON.parse(serialized);
          expect(deserialized).toEqual(event);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Debugging Tests

### View test output
```bash
npm test -- --verbose
```

### Debug specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand CommandHandler.test.ts
```

### Check test coverage
```bash
npm test -- --coverage --coverageReporters=html
# Open coverage/index.html
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: Explain what is being tested
4. **Mock external dependencies**: Keep tests fast and reliable
5. **Test error cases**: Don't just test happy path
6. **Use beforeEach**: Set up clean state for each test
7. **Avoid test interdependence**: Each test should run independently
