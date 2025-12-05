# Nexus Query Service

> **Skeleton Crew Application #2** - A standalone Query Service built on the Nexus Blueprint skeleton

## Overview

This is a fully independent Query Service application demonstrating the **read side** of CQRS (Command Query Responsibility Segregation). It handles all read operations with optimized projections:

- **Get Orders** - Query orders with filtering
- **Get Events** - View event stream history
- **Real-time Updates** - Subscribe to event changes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Query Service                           │
├─────────────────────────────────────────────────────────────┤
│                    ┌─────────────┐                          │
│  (Command Service)─▶│ EventBridge │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   API GW    │◀───│   Lambda    │◀───│  DynamoDB   │     │
│  │  (Queries)  │    │ (Projector) │    │(Read Model) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### Deploy

```bash
cd app-query-service
npm install
npx cdk deploy
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get all orders |
| GET | `/orders?customerId=xxx` | Get orders by customer |
| GET | `/events` | Get event stream |

### Example: Get All Orders

```bash
curl https://your-api-url/orders
```

### Example: Get Orders by Customer

```bash
curl "https://your-api-url/orders?customerId=customer-123"
```

### Example: Get Event Stream

```bash
curl https://your-api-url/events
```

## Skeleton Foundation

This application is built on the **Nexus Blueprint** skeleton, which provides:

- ✅ Read-optimized projections
- ✅ CQRS query patterns
- ✅ AWS CDK infrastructure
- ✅ Lambda handlers with caching
- ✅ EventBridge integration for event consumption
- ✅ DynamoDB for read models

## Project Structure

```
app-query-service/
├── bin/
│   └── app.ts              # CDK app entry point
├── infrastructure/
│   └── QueryStack.ts       # CDK stack definition
├── lambda/
│   ├── query-handler/
│   │   └── index.ts        # Query Lambda handler
│   └── event-processor/
│       └── index.ts        # Event projection handler
├── ui/                     # Query-focused UI
│   └── src/
├── package.json
├── cdk.json
└── README.md
```

## Event Processing

The Query Service subscribes to events from the Command Service:

| Event | Action |
|-------|--------|
| `OrderPlaced` | Add order to read model |
| `OrderCancelled` | Update order status in read model |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ORDERS_TABLE` | DynamoDB table for order projections |
| `EVENTS_TABLE` | DynamoDB table for event log |
| `COMMAND_EVENT_BUS` | EventBridge bus to subscribe to |

## License

MIT
