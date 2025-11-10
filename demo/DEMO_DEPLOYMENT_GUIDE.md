# Nexus Blueprint 3.0 - Demo Deployment Guide

## 🎯 Quick Deploy (5 Minutes)

### Prerequisites

```bash
# Check prerequisites
node --version  # Should be 18+
aws --version   # Should be configured
cdk --version   # Should be installed
```

### Step 1: Install Dependencies

```bash
cd demo
npm install
```

### Step 2: Build Lambda Functions

```bash
npm run build:lambdas
```

### Step 3: Build UI

```bash
cd ui
npm install
npm run build
cd ..
```

### Step 4: Deploy to AWS

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy demo stack
cdk deploy NexusDemoStack

# Note the outputs:
# - ApiUrl: https://xxx.execute-api.us-east-1.amazonaws.com/prod
# - WebSocketUrl: wss://xxx.execute-api.us-east-1.amazonaws.com/prod
# - UIUrl: http://nexus-demo-ui-xxx.s3-website-us-east-1.amazonaws.com
```

### Step 5: Configure UI

```bash
# Update UI with API endpoints
echo "REACT_APP_API_URL=<ApiUrl>" > ui/.env
echo "REACT_APP_WS_URL=<WebSocketUrl>" >> ui/.env

# Rebuild and redeploy UI
cd ui
npm run build
cd ..
cdk deploy NexusDemoStack
```

### Step 6: Open Demo

```bash
# Open in browser
open <UIUrl>
```

## 🎬 Demo Walkthrough

### Scenario 1: Place an Order (2 minutes)

1. **Click "Place Order"**
   - Fill in order details
   - Click "Place Order"
   - Watch the latency metric (should be < 200ms)

2. **Observe Real-Time Update**
   - Order appears in list instantly
   - WebSocket notification received
   - Status shows "PLACED"

3. **View Event Timeline**
   - Click "Event Timeline" tab
   - See "OrderPlaced" event
   - View event details (payload, metadata)

**Key Takeaway**: Event sourcing provides complete audit trail

### Scenario 2: Cancel an Order (1 minute)

1. **Select an Order**
   - Click on any "PLACED" order
   - Click "Cancel" button

2. **Watch the Update**
   - Order status changes to "CANCELLED"
   - New event appears in timeline
   - Real-time UI update

**Key Takeaway**: All state changes captured as events

### Scenario 3: Time Travel (2 minutes)

1. **Go to Time Travel Tab**
   - See the time slider
   - Current time is at the right

2. **Move Slider Back**
   - Drag slider to the left
   - See historical state
   - Compare with current state

3. **Observe Changes**
   - Orders that didn't exist yet are hidden
   - Cancelled orders show as "PLACED"
   - Complete state reconstruction

**Key Takeaway**: Temporal queries enable compliance and debugging

### Scenario 4: Performance Test (2 minutes)

1. **Click "Simulate Load"**
   - Processes 100 orders
   - Watch progress

2. **View Performance Tab**
   - See command latency
   - Check success rate
   - View total events

3. **Verify Results**
   - All 100 orders processed
   - Latency < 200ms
   - 100% success rate

**Key Takeaway**: System handles high load with consistent performance

### Scenario 5: Architecture View (1 minute)

1. **Go to Architecture Tab**
   - See system diagram
   - View component status
   - Read key benefits

2. **Understand the Flow**
   - Command → Event Store
   - Event → Projection
   - Projection → Query Model
   - WebSocket → UI Update

**Key Takeaway**: Clean separation of concerns with CQRS

## 📊 Expected Results

### Performance Metrics

| Metric | Expected | Typical |
|--------|----------|---------|
| Command Latency | < 200ms | ~150ms |
| Event Propagation | < 500ms | ~300ms |
| Query Response | < 100ms | ~50ms |
| UI Update | < 1s | ~500ms |
| WebSocket Latency | < 100ms | ~50ms |

### Free Tier Usage

| Service | Free Tier | Demo Usage | % Used |
|---------|-----------|------------|--------|
| Lambda Requests | 1M/month | ~1k | 0.1% |
| Lambda Duration | 400k GB-sec | ~10 GB-sec | 0.0025% |
| DynamoDB Storage | 25 GB | ~10 MB | 0.04% |
| DynamoDB Reads | 25 RCU | ~5 RCU | 20% |
| DynamoDB Writes | 25 WCU | ~5 WCU | 20% |
| API Gateway | 1M requests | ~1k | 0.1% |
| S3 Storage | 5 GB | ~5 MB | 0.1% |

**Total Cost**: $0/month (well within free tier)

## 🎓 Learning Objectives

After completing the demo, you should understand:

### 1. Event Sourcing Benefits
- ✅ Complete audit trail of all changes
- ✅ Temporal queries for compliance
- ✅ Event replay for debugging
- ✅ No data loss

### 2. CQRS Benefits
- ✅ Optimized read models
- ✅ Independent scaling
- ✅ Performance gains
- ✅ Flexibility

### 3. Real-Time Architecture
- ✅ WebSocket for instant updates
- ✅ Event-driven design
- ✅ Reactive UI
- ✅ Better UX

### 4. Governance
- ✅ Schema validation
- ✅ Policy enforcement
- ✅ Automated compliance
- ✅ Quality assurance

### 5. Performance
- ✅ Sub-second latency
- ✅ High throughput
- ✅ Consistent performance
- ✅ Scalability

## 🔧 Customization

### Add Your Own Events

```typescript
// 1. Define event schema
// schemas/ProductCreated.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "productId": { "type": "string" },
    "name": { "type": "string" },
    "price": { "type": "number" }
  },
  "required": ["productId", "name", "price"]
}

// 2. Add command handler
// lambda/command-handler/index.ts
case 'CreateProduct':
  // Your logic here
  break;

// 3. Add projection
// lambda/event-processor/index.ts
case 'ProductCreated':
  // Update read model
  break;

// 4. Redeploy
cdk deploy
```

### Modify UI Theme

```typescript
// ui/src/theme.ts
export const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
  },
});
```

### Add Custom Metrics

```typescript
// lambda/command-handler/index.ts
await cloudwatch.putMetricData({
  Namespace: 'NexusDemo',
  MetricData: [{
    MetricName: 'CustomMetric',
    Value: 123,
    Unit: 'Count',
  }],
});
```

## 🧹 Cleanup

### Remove All Resources

```bash
# Destroy the stack
cdk destroy NexusDemoStack

# Confirm deletion
# Type 'y' when prompted
```

### Verify Cleanup

```bash
# Check CloudFormation
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE

# Check S3 buckets
aws s3 ls | grep nexus-demo

# Check DynamoDB tables
aws dynamodb list-tables | grep nexus-demo

# Check Lambda functions
aws lambda list-functions | grep nexus-demo
```

**Cost after cleanup**: $0

## 🐛 Troubleshooting

### Issue: CDK Deploy Fails

**Solution**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Bootstrap CDK
cdk bootstrap

# Try again
cdk deploy
```

### Issue: UI Not Loading

**Solution**:
```bash
# Check S3 bucket
aws s3 ls s3://nexus-demo-ui-<account-id>

# Rebuild UI
cd ui
npm run build
cd ..
cdk deploy
```

### Issue: WebSocket Not Connecting

**Solution**:
```bash
# Check WebSocket API
aws apigatewayv2 get-apis

# Verify URL in UI
cat ui/.env

# Update if needed
echo "REACT_APP_WS_URL=<correct-url>" > ui/.env
```

### Issue: Orders Not Appearing

**Solution**:
```bash
# Check Lambda logs
aws logs tail /aws/lambda/nexus-demo-command-handler --follow

# Check DynamoDB
aws dynamodb scan --table-name nexus-demo-events --max-items 10

# Check event processor
aws logs tail /aws/lambda/nexus-demo-event-processor --follow
```

## 📈 Monitoring

### View Logs

```bash
# Command handler logs
aws logs tail /aws/lambda/nexus-demo-command-handler --follow

# Event processor logs
aws logs tail /aws/lambda/nexus-demo-event-processor --follow

# Query handler logs
aws logs tail /aws/lambda/nexus-demo-query-handler --follow
```

### View Metrics

```bash
# Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=nexus-demo-command-handler \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### View DynamoDB Data

```bash
# View events
aws dynamodb scan --table-name nexus-demo-events --max-items 10

# View orders
aws dynamodb scan --table-name nexus-demo-orders --max-items 10
```

## 🎯 Success Criteria

The demo is successful when:

✅ UI loads without errors  
✅ Orders can be placed  
✅ Real-time updates work  
✅ Event timeline shows all events  
✅ Time travel works  
✅ Performance metrics show < 200ms latency  
✅ Load test completes successfully  
✅ All within AWS Free Tier  

## 📚 Next Steps

After the demo:

1. **Explore the Code**
   - Review Lambda functions
   - Study event schemas
   - Understand projections

2. **Customize**
   - Add your own events
   - Modify UI
   - Add features

3. **Deploy to Production**
   - Review security
   - Add monitoring
   - Scale resources

4. **Learn More**
   - Read full documentation
   - Study architecture
   - Join community

## 🌟 Key Takeaways

1. **Event Sourcing** provides complete audit trail and temporal queries
2. **CQRS** enables optimized read models and independent scaling
3. **Real-time** updates via WebSocket for instant UI feedback
4. **Governance** ensures schema validation and policy enforcement
5. **Performance** meets all SLAs with sub-second latency
6. **Free Tier** deployment possible for demos and development

---

**Ready to deploy?** Run `npm run deploy` and start exploring! 🚀
