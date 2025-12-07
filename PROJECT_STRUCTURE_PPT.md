# Nexus Blueprint - Skeleton Crew Architecture

```
kiroween/
│
├── 🦴 packages/                          ← SHARED CQRS SKELETON (Generic Framework)
│   │
│   ├── shared/                           ← Core Interfaces & Types
│   │   └── src/
│   │       ├── ports/                    ← Generic Port Interfaces
│   │       │   ├── EventStorePort.ts     ← Event Store abstraction
│   │       │   ├── EventBusPort.ts       ← Event Bus abstraction
│   │       │   └── SchemaRegistryPort.ts ← Schema Registry abstraction
│   │       ├── factory/
│   │       │   └── AdapterFactory.ts     ← Pluggable adapter factory
│   │       ├── policy/
│   │       │   └── PolicyEnforcer.ts     ← OPA policy enforcement
│   │       └── schema/
│   │           └── SchemaRegistryFactory.ts
│   │
│   ├── adapters/                         ← Pluggable Implementations
│   │   ├── aws/                          ← AWS Adapters
│   │   │   ├── DynamoDBEventStore.ts
│   │   │   ├── DynamoDBSnapshotStore.ts
│   │   │   └── GlueSchemaRegistry.ts
│   │   └── opensource/                   ← Open Source Adapters
│   │       ├── EventStoreDBAdapter.ts
│   │       └── ConfluentSchemaRegistry.ts
│   │
│   ├── infrastructure/                   ← Reusable CDK Constructs
│   │   └── src/stacks/
│   │       ├── EventStoreStack.ts
│   │       ├── EventBusStack.ts
│   │       ├── EventRouterStack.ts
│   │       └── SchemaRegistryStack.ts
│   │
│   ├── command-service/                  ← Generic Command Handling
│   │   └── src/
│   │       ├── domain/
│   │       │   └── CommandHandler.ts
│   │       └── infrastructure/
│   │           ├── EventStore.ts
│   │           └── SnapshotManager.ts
│   │
│   └── event-router/                     ← Dual-Path Event Routing
│       └── src/
│           └── index.ts                  ← Kinesis vs SNS/SQS routing
│
│
├── 📦 demo/                              ← APP #1: E-COMMERCE ORDERS
│   │                                       (Uses shared skeleton)
│   ├── infrastructure/
│   │   └── DemoStack.ts                  ← Order-specific CDK stack
│   ├── lambda/
│   │   ├── command-handler/
│   │   │   └── index.ts                  ← PlaceOrder, CancelOrder
│   │   ├── query-handler/
│   │   │   └── index.ts                  ← GetOrders, GetEvents
│   │   └── event-processor/
│   │       └── index.ts                  ← Order projections
│   └── ui/                               ← React Dashboard (Blue theme)
│       └── src/
│           ├── App.tsx
│           └── components/
│               ├── OrderDashboard.tsx
│               ├── CQRSDemo.tsx
│               ├── EventTimeline.tsx
│               └── LoadTester.tsx
│
│
├── 🌡️ demo-iot/                          ← APP #2: IoT SENSOR DATA
│   │                                       (Uses same shared skeleton)
│   ├── infrastructure/
│   │   └── IoTDemoStack.ts               ← Sensor-specific CDK stack
│   ├── lambda/
│   │   ├── command-handler/
│   │   │   └── index.ts                  ← RegisterSensor, RecordReading
│   │   ├── query-handler/
│   │   │   └── index.ts                  ← GetSensors, GetReadings
│   │   └── event-processor/
│   │       └── index.ts                  ← Sensor projections
│   └── ui/                               ← React Dashboard (Cyan theme)
│       └── src/
│           ├── App.tsx
│           └── components/
│               ├── SensorDashboard.tsx
│               ├── CQRSDemo.tsx
│               ├── EventTimeline.tsx
│               └── LoadTester.tsx
│
│
├── schemas/                              ← JSON Schema Definitions
│   ├── OrderPlaced.json
│   └── OrderCancelled.json
│
├── policies/                             ← OPA Governance Policies
│   └── README.md
│
└── docs/                                 ← Documentation
    └── CI_CD_POLICY_ENFORCEMENT.md
```

## Key Architecture Points

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          NEXUS BLUEPRINT SKELETON                               │
│                     (packages/ - Generic CQRS Framework)                        │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  EventStorePort  │  EventBusPort  │  SchemaRegistryPort  │  PolicyEnforcer│   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                    ┌───────────────┴───────────────┐                            │
│                    ▼                               ▼                            │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │     📦 APP #1: ORDERS DEMO        │  │     🌡️ APP #2: IoT DEMO           │  │
│  │         demo/                     │  │         demo-iot/                 │  │
│  │                                   │  │                                   │  │
│  │  Commands:                        │  │  Commands:                        │  │
│  │  • PlaceOrder                     │  │  • RegisterSensor                 │  │
│  │  • CancelOrder                    │  │  • RecordReading                  │  │
│  │                                   │  │  • TriggerAlert                   │  │
│  │  Events:                          │  │                                   │  │
│  │  • OrderPlaced                    │  │  Events:                          │  │
│  │  • OrderCancelled                 │  │  • SensorRegistered               │  │
│  │                                   │  │  • ReadingRecorded                │  │
│  │  Domain: E-commerce               │  │  • AlertTriggered                 │  │
│  │  UI Theme: Blue/Purple            │  │                                   │  │
│  │                                   │  │  Domain: Industrial IoT           │  │
│  │                                   │  │  UI Theme: Cyan/Green             │  │
│  └───────────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                                 │
│                    Same Skeleton → Different Domains                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Skeleton Crew Theme Compliance

| Component | Location | Purpose |
|-----------|----------|---------|
| **Generic Skeleton** | `packages/` | Zero domain-specific code |
| **App #1** | `demo/` | E-commerce order management |
| **App #2** | `demo-iot/` | IoT sensor monitoring |
| **Shared Patterns** | Both apps | CQRS, Event Sourcing, Lambda, DynamoDB |
