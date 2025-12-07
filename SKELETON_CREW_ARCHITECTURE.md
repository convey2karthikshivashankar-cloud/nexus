# 🦴 Skeleton Crew Architecture

## How Two Different Apps Share One Common Skeleton

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NEXUS BLUEPRINT MONOREPO                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         @nexus/shared               │
                    │      (THE SKELETON CODE)            │
                    │                                     │
                    │  packages/shared/                   │
                    │  ├── src/                           │
                    │  │   ├── types/                     │
                    │  │   │   ├── DomainEvent.ts    ◄────┼──── Shared Event Types
                    │  │   │   ├── Command.ts        ◄────┼──── Shared Command Types
                    │  │   │   ├── ReadModel.ts      ◄────┼──── Shared Query Types
                    │  │   │   └── Snapshot.ts       ◄────┼──── Shared Snapshot Types
                    │  │   ├── ports/                     │
                    │  │   │   ├── EventStorePort.ts ◄────┼──── Storage Interfaces
                    │  │   │   ├── EventBusPort.ts   ◄────┼──── Messaging Interfaces
                    │  │   │   └── SchemaRegistryPort◄────┼──── Schema Interfaces
                    │  │   ├── policy/                    │
                    │  │   │   └── PolicyEnforcer.ts ◄────┼──── Governance
                    │  │   └── factory/                   │
                    │  │       └── AdapterFactory.ts ◄────┼──── Multi-Cloud Support
                    │  └── package.json                   │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
         ┌──────────▼──────────┐       ┌─────────▼───────────┐
         │                     │       │                     │
         │  INVENTORY APP      │       │  TICKETING APP      │
         │  (Domain A)         │       │  (Domain B)         │
         │                     │       │                     │
         └──────────┬──────────┘       └──────────┬──────────┘
                    │                             │
                    ▼                             ▼
```

## 📁 Complete Project Structure

```
nexus-blueprint/
│
├── 📦 packages/                          # SHARED SKELETON CODE
│   │
│   └── shared/                           # @nexus/shared - THE SKELETON
│       ├── package.json                  # name: "@nexus/shared"
│       └── src/
│           ├── index.ts                  # Main exports
│           │
│           ├── types/                    # 🎯 CORE DOMAIN TYPES
│           │   ├── DomainEvent.ts        # Base event interface
│           │   ├── Command.ts            # Command & CommandResult
│           │   ├── ReadModel.ts          # Query model types
│           │   └── Snapshot.ts           # Aggregate snapshots
│           │
│           ├── ports/                    # 🔌 INFRASTRUCTURE PORTS
│           │   ├── EventStorePort.ts     # Event persistence interface
│           │   ├── EventBusPort.ts       # Event publishing interface
│           │   ├── SchemaRegistryPort.ts # Schema validation interface
│           │   └── SnapshotStorePort.ts  # Snapshot persistence
│           │
│           ├── policy/                   # 🛡️ GOVERNANCE
│           │   └── PolicyEnforcer.ts     # OPA policy enforcement
│           │
│           └── factory/                  # 🏭 MULTI-CLOUD
│               └── AdapterFactory.ts     # AWS/GCP/Azure adapters
│
├── 🏭 skeleton-app-inventory/            # APP 1: INVENTORY MANAGEMENT
│   │
│   ├── package.json                      # "@nexus/shared": "file:../packages/shared"
│   │
│   ├── lambda/
│   │   ├── command-handler/
│   │   │   └── index.ts                  # ⭐ IMPORTS FROM @nexus/shared
│   │   ├── query-handler/
│   │   │   └── index.ts                  # ⭐ IMPORTS FROM @nexus/shared
│   │   └── event-processor/
│   │       └── index.ts                  # ⭐ IMPORTS FROM @nexus/shared
│   │
│   ├── infrastructure/
│   │   └── InventoryStack.ts             # CDK: SkeletonInventoryStack
│   │
│   └── bin/
│       └── app.ts                        # CDK App entry
│
└── 🎫 skeleton-app-ticketing/            # APP 2: SUPPORT TICKETING
    │
    ├── package.json                      # "@nexus/shared": "file:../packages/shared"
    │
    ├── lambda/
    │   ├── command-handler/
    │   │   └── index.ts                  # ⭐ IMPORTS FROM @nexus/shared
    │   ├── query-handler/
    │   │   └── index.ts                  # ⭐ IMPORTS FROM @nexus/shared
    │   └── event-processor/
    │       └── index.ts                  # ⭐ IMPORTS FROM @nexus/shared
    │
    ├── infrastructure/
    │   └── TicketingStack.ts             # CDK: SkeletonTicketingStack
    │
    └── bin/
        └── app.ts                        # CDK App entry
```

## 🔗 Import Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   skeleton-app-inventory/lambda/command-handler/index.ts                        │
│   ─────────────────────────────────────────────────────                         │
│                                                                                 │
│   import type { DomainEvent, Command, CommandResult, EventMetadata }            │
│                from '@nexus/shared';                                            │
│                  │                                                              │
│                  │    ┌─────────────────────────────────────────────────────┐   │
│                  └───►│  packages/shared/src/types/                         │   │
│                       │  ├── DomainEvent.ts  → eventId, eventType, payload  │   │
│                       │  └── Command.ts      → commandId, aggregateId       │   │
│                       └─────────────────────────────────────────────────────┘   │
│                                                                                 │
│   // Inventory-specific types EXTEND the skeleton                               │
│   type InventoryEventType = 'ProductAdded' | 'StockUpdated' | ...               │
│   interface InventoryEvent extends DomainEvent { ... }                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   skeleton-app-ticketing/lambda/command-handler/index.ts                        │
│   ─────────────────────────────────────────────────────                         │
│                                                                                 │
│   import type { DomainEvent, Command, CommandResult, EventMetadata }            │
│                from '@nexus/shared';                                            │
│                  │                                                              │
│                  │    ┌─────────────────────────────────────────────────────┐   │
│                  └───►│  packages/shared/src/types/                         │   │
│                       │  ├── DomainEvent.ts  → SAME skeleton types!         │   │
│                       │  └── Command.ts      → SAME skeleton types!         │   │
│                       └─────────────────────────────────────────────────────┘   │
│                                                                                 │
│   // Ticketing-specific types EXTEND the skeleton                               │
│   type TicketEventType = 'TicketCreated' | 'TicketAssigned' | ...               │
│   interface TicketEvent extends DomainEvent { ... }                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📊 Side-by-Side Comparison

```
┌────────────────────────────────────┬────────────────────────────────────┐
│     🏭 INVENTORY APP               │     🎫 TICKETING APP               │
├────────────────────────────────────┼────────────────────────────────────┤
│                                    │                                    │
│  DOMAIN EVENTS:                    │  DOMAIN EVENTS:                    │
│  • ProductAdded                    │  • TicketCreated                   │
│  • StockUpdated                    │  • TicketAssigned                  │
│  • ProductRemoved                  │  • TicketResolved                  │
│  • StockReserved                   │  • TicketClosed                    │
│                                    │  • CommentAdded                    │
│                                    │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│                                    │                                    │
│  COMMANDS:                         │  COMMANDS:                         │
│  • AddProduct                      │  • CreateTicket                    │
│  • UpdateStock                     │  • AssignTicket                    │
│  • RemoveProduct                   │  • ResolveTicket                   │
│  • ReserveStock                    │  • CloseTicket                     │
│                                    │  • AddComment                      │
│                                    │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│                                    │                                    │
│  STACK NAME:                       │  STACK NAME:                       │
│  SkeletonInventoryStack            │  SkeletonTicketingStack            │
│                                    │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│                                    │                                    │
│  EVENT SOURCE:                     │  EVENT SOURCE:                     │
│  skeleton.inventory                │  skeleton.ticketing                │
│                                    │                                    │
├────────────────────────────────────┴────────────────────────────────────┤
│                                                                         │
│                    SHARED FROM @nexus/shared:                           │
│                                                                         │
│    ✅ DomainEvent interface      ✅ Command interface                   │
│    ✅ CommandResult interface    ✅ EventMetadata interface             │
│    ✅ Event sourcing patterns    ✅ CQRS architecture                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Code Snippets

### The Shared Skeleton Types (packages/shared/src/types/)

```typescript
// DomainEvent.ts - Base event all apps extend
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateVersion: number;
  timestamp: string;
  payload: Record<string, any>;
  metadata: EventMetadata;
}

// Command.ts - Base command structure
export interface Command {
  commandId: string;
  commandType: string;
  aggregateId: string;
  timestamp: string;
  payload: Record<string, any>;
  metadata: { userId: string; correlationId: string };
}

export interface CommandResult {
  success: boolean;
  aggregateId: string;
  version: number;
  eventIds: string[];
  error?: string;
}
```

### Inventory App Usage

```typescript
// skeleton-app-inventory/lambda/command-handler/index.ts
import type { DomainEvent, Command, CommandResult, EventMetadata } from '@nexus/shared';

// Extend skeleton for inventory domain
type InventoryEventType = 'ProductAdded' | 'StockUpdated' | 'ProductRemoved' | 'StockReserved';

interface InventoryEvent extends DomainEvent {
  eventType: InventoryEventType;
}
```

### Ticketing App Usage

```typescript
// skeleton-app-ticketing/lambda/command-handler/index.ts
import type { DomainEvent, Command, CommandResult, EventMetadata } from '@nexus/shared';

// Extend skeleton for ticketing domain
type TicketEventType = 'TicketCreated' | 'TicketAssigned' | 'TicketResolved' | 'TicketClosed';

interface TicketEvent extends DomainEvent {
  eventType: TicketEventType;
}
```

## 🚀 Deployment Independence

```
                    ┌─────────────────────────────────────┐
                    │         AWS ACCOUNT                 │
                    └─────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       │                       ▼
┌───────────────────────┐           │           ┌───────────────────────┐
│ SkeletonInventoryStack│           │           │SkeletonTicketingStack │
├───────────────────────┤           │           ├───────────────────────┤
│                       │           │           │                       │
│ • InventoryEventStore │           │           │ • TicketingEventStore │
│ • InventoryEventBus   │           │           │ • TicketingEventBus   │
│ • InventoryReadStore  │           │           │ • TicketingReadStore  │
│ • InventoryCommandAPI │           │           │ • TicketingCommandAPI │
│ • InventoryQueryAPI   │           │           │ • TicketingQueryAPI   │
│                       │           │           │                       │
└───────────────────────┘           │           └───────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    │   COMPLETELY INDEPENDENT      │
                    │   DEPLOYMENTS - NO CONFLICTS  │
                    │                               │
                    └───────────────────────────────┘
```

## 📈 Benefits of Skeleton Approach

| Benefit | Description |
|---------|-------------|
| **Code Reuse** | Core types defined once, used everywhere |
| **Consistency** | All apps follow same event sourcing patterns |
| **Type Safety** | TypeScript interfaces ensure correctness |
| **Independence** | Apps deploy separately with unique resources |
| **Extensibility** | Domain-specific types extend base skeleton |
| **Maintainability** | Update skeleton once, all apps benefit |

---

*This architecture demonstrates how a single skeleton codebase can power multiple distinct business domains while maintaining consistency and enabling independent deployment.*
