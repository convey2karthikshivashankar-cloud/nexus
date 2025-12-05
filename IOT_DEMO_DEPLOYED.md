# 🚀 Nexus Demo Applications - Deployed

## Two CQRS Demo Applications

### 1. 🛒 Nexus Orders Demo (E-Commerce)
**UI**: http://nexus-demo-ui-557810226161.s3-website.us-east-2.amazonaws.com
**API**: https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod/

Features:
- Place orders with customer/product data
- Cancel orders (updates status to CANCELLED)
- Real-time metrics: Active Orders, Total Value ($), Event Stream, Avg Latency
- Query button shows activity log with visual feedback

### 2. 🌡️ Nexus IoT Demo (Sensor Monitoring)
**UI**: http://nexus-iot-demo-ui-557810226161.s3-website.us-east-2.amazonaws.com
**API**: https://uvxdbghsvi.execute-api.us-east-2.amazonaws.com/prod/

Features:
- Register sensors with location/thresholds
- Record temperature readings
- Trigger and acknowledge alerts
- Query button shows activity log with visual feedback

## Updates Made (Dec 6, 2025)

1. **Renamed Order Demo** to "Nexus Orders Demo" with e-commerce branding
2. **Fixed Query Button Feedback** - Both demos now show:
   - Query Activity Log with timestamps and latency
   - Visual flash effect when data updates
   - "✓ Updated!" indicator
3. **Improved Order Metrics**:
   - Active Orders (excludes cancelled)
   - Total Value in $ (sum of placed orders)
   - Cancelled orders tracked separately
4. **Fixed Event Processor** - Better payload parsing for DynamoDB streams

## Skeleton Crew Theme ✅

Both demos showcase the same CQRS + Event Sourcing skeleton with different business domains:
- **Orders**: E-commerce order management
- **IoT**: Sensor data monitoring

---
Last Updated: December 6, 2025
