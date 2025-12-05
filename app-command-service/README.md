# Nexus Command Service

> **Skeleton Crew Application #1** - A standalone Command Service built on the Nexus Blueprint skeleton

## Overview

This is a fully independent Command Service application demonstrating the **write side** of CQRS (Command Query Responsibility Segregation). It handles all business operations that modify state:

- **Place Orders** - Create new orders with validation
- **Cancel Orders** - Cancel existing orders with event sourcing
- **Event Publishing** - Publish domain events to EventBridge

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Service                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   API GW    │───▶│   Lambda    │───▶│  DynamoDB   │     │
│  │  (Commands) │    │  (Handler)  │    │ (EventStore)│     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                │
│                            ▼                                │
│                    ┌─────────────┐                          │
│                    │ EventBridge │──────▶ (Query Service)   │
│                    │   (Events)  │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### Deploy

```bash
cd app-command-service
npm install
npx cdk deploy
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Place a new order |
| PUT | `/orders/{orderId}` | Cancel an order |

### Example: Place Order

```bash
curl -X POST https://your-api-url/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "customerName": "Alice Johnson",
    "items": [
      { "productId": "prod-1", "productName": "Widget", "quantity": 2, "price": 29.99 }
    ],
    "totalAmount": 59.98
  }'
```

### Example: Cancel Order

```bash
curl -X PUT https://your-api-url/orders/order-123 \
  -H "Content-Type: application/json" \
  -d '{ "action": "cancel" }'
```

## Skeleton Foundation

This application is built on the **Nexus Blueprint** skeleton, which provides:

- ✅ Event Sourcing patterns
- ✅ CQRS architecture
- ✅ AWS CDK infrastructure
- ✅ Lambda handlers with proper error handling
- ✅ EventBridge integration for event publishing
- ✅ DynamoDB for event storage

## Project Structure

```
app-command-service/
├── bin/
│   └── app.ts              # CDK app entry point
├── infrastructure/
│   └── CommandStack.ts     # CDK stack definition
├── lambda/
│   └── command-handler/
│       └── index.ts        # Lambda handler
├── ui/                     # Command-focused UI
│   └── src/
├── package.json
├── cdk.json
└── README.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ORDERS_TABLE` | DynamoDB table for orders |
| `EVENT_BUS_NAME` | EventBridge bus name |

## License

MIT
