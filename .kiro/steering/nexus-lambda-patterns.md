---
inclusion: fileMatch
fileMatchPattern: 'demo/lambda/**/*.js'
---

# Lambda Function Patterns for Nexus Demo

## Standard Lambda Structure

All Lambda functions in the demo should follow this pattern:

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;

// UUID generator
function uuidv4() {
  return crypto.randomUUID();
}

exports.handler = async (event) => {
  console.log('Request received:', JSON.stringify(event, null, 2));

  try {
    // Your logic here
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## Required Elements

1. **CORS Headers**: Always include `Access-Control-Allow-Origin: *`
2. **Error Handling**: Wrap in try/catch, return 500 on error
3. **Logging**: Log request and errors for CloudWatch
4. **UUID**: Use `crypto.randomUUID()` not uuid package
5. **Environment Variables**: Use process.env for configuration

## DynamoDB Operations

### Read
```javascript
const result = await docClient.send(
  new GetCommand({
    TableName: TABLE_NAME,
    Key: { id: 'value' },
  })
);
```

### Write
```javascript
await docClient.send(
  new PutCommand({
    TableName: TABLE_NAME,
    Item: { id: 'value', data: 'data' },
  })
);
```

### Query
```javascript
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': 'value' },
  })
);
```

## Response Format

### Success
```javascript
{
  statusCode: 200,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ success: true, data: result })
}
```

### Error
```javascript
{
  statusCode: 500,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ error: error.message })
}
```

### Validation Error
```javascript
{
  statusCode: 400,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ error: 'Validation failed', details: errors })
}
```

## Testing

When implementing Lambda functions, always:
1. Test locally with sample events
2. Check CloudWatch logs after deployment
3. Verify DynamoDB operations
4. Test error cases

## Common Issues

### Issue: Module not found
**Solution**: Use only built-in modules or AWS SDK (no external packages)

### Issue: Table name undefined
**Solution**: Check environment variables in DemoStack.ts

### Issue: CORS errors
**Solution**: Always include CORS headers in response

## Environment Variables

Standard environment variables used in demo:
- `EVENT_STORE_TABLE` - Event store DynamoDB table
- `READ_MODEL_TABLE` - Read model DynamoDB table
- `CONNECTIONS_TABLE` - WebSocket connections table
- `WEBSOCKET_API_ENDPOINT` - WebSocket API endpoint (if enabled)
