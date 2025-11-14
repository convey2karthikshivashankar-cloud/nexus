# Nexus Blueprint 3.0 Demo - Quick Start Guide

## 🎉 Your Demo is Live!

**API URL**: https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod

## 🚀 Test the API (PowerShell)

### 1. Place an Order

```powershell
$body = '{"commandType":"OrderPlaced","customerId":"cust-123","items":[{"productId":"prod-1","quantity":2}],"totalAmount":99.99}'
$response = Invoke-RestMethod -Uri "https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod/commands" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json
```

**Expected Response**:
```json
{
  "success": true,
  "aggregateId": "abc-123",
  "version": 1,
  "eventIds": ["evt-456"]
}
```

### 2. Query All Orders

```powershell
$orders = Invoke-RestMethod -Uri "https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod/queries"
$orders | ConvertTo-Json
```

### 3. View Event Timeline

```powershell
$events = Invoke-RestMethod -Uri "https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod/events"
$events | ConvertTo-Json -Depth 5
```

### 4. Cancel an Order

```powershell
$orderId = "abc-123"  # Use an actual order ID from step 2
$body = "{`"commandType`":`"OrderCancelled`",`"aggregateId`":`"$orderId`"}"
Invoke-RestMethod -Uri "https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod/commands" -Method Post -Body $body -ContentType "application/json"
```

## 🧪 Run Automated Tests

```powershell
cd demo
.\test-api.ps1
```

## 🔍 View AWS Resources

### DynamoDB Tables
```powershell
# View events
aws dynamodb scan --table-name nexus-demo-event-store --max-items 10

# View orders
aws dynamodb scan --table-name nexus-demo-read-model --max-items 10
```

### Lambda Logs
```powershell
# Command handler logs
aws logs tail /aws/lambda/nexus-demo-command-handler --follow

# Query handler logs
aws logs tail /aws/lambda/nexus-demo-query-handler --follow

# Event processor logs
aws logs tail /aws/lambda/nexus-demo-event-processor --follow
```

## 📊 What's Happening

1. **Command** → You send a command to `/commands`
2. **Event Store** → Lambda stores event in DynamoDB
3. **DynamoDB Stream** → Triggers event processor
4. **Projection** → Event processor updates read model
5. **Query** → You query the read model from `/queries`

## 🎯 Key Features Demonstrated

✅ **Event Sourcing** - All state changes stored as events  
✅ **CQRS** - Separate write (commands) and read (queries) models  
✅ **Event-Driven** - DynamoDB Streams trigger projections  
✅ **Serverless** - Lambda functions, no servers to manage  
✅ **AWS Free Tier** - Optimized to stay within free tier limits  

## 🌐 Access UI (Coming Soon)

The React UI can be built and deployed:

```powershell
cd ui
npm install
npm run build

# Then uncomment UI deployment in DemoStack.ts and redeploy
cd ..
npx cdk deploy
```

## 🧹 Cleanup

When you're done testing:

```powershell
cd demo
npx cdk destroy
```

## 📚 Learn More

- **Event Sourcing**: Every state change is an immutable event
- **CQRS**: Commands change state, queries read state
- **Projections**: Transform events into optimized read models
- **Temporal Queries**: Query historical state at any point in time

## 🎓 Next Steps

1. ✅ Test the API endpoints
2. ✅ View data in DynamoDB
3. ✅ Check Lambda logs
4. 📱 Build and deploy the React UI
5. 🔧 Add WebSocket for real-time updates
6. 🚀 Customize for your use case

---

**Congratulations!** You've successfully deployed a production-ready event-sourced microservice architecture! 🎉
