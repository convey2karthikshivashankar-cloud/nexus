# Skeleton App: Inventory Management

## 🦴 Skeleton Crew Demo - App #1

This application demonstrates the **Skeleton Crew** hackathon theme by building a complete Inventory Management system that **imports from `@nexus/shared`**.

## Key Differentiator: True Skeleton Import

```typescript
// In lambda/command-handler/index.ts
import type { DomainEvent, Command, CommandResult, EventMetadata } from '@nexus/shared';
```

This is NOT copy-paste code. The app **actually imports** the skeleton's types as a dependency.

## Domain: Inventory Management

| Aspect | Details |
|--------|---------|
| **Commands** | AddProduct, UpdateStock, RemoveProduct, ReserveStock |
| **Events** | ProductAdded, StockUpdated, ProductRemoved, StockReserved |
| **Entities** | Products, Stock Levels, Reservations |
| **Use Case** | Warehouse inventory tracking |

## Stack Resources (UNIQUE names)

- `skeleton-inventory-events-{accountId}` - Event Store
- `skeleton-inventory-readmodel-{accountId}` - Read Model
- `skeleton-inventory-bus-{accountId}` - Event Bus
- `skeleton-inventory-ui-{accountId}` - UI Bucket

## Deploy

```powershell
.\deploy.ps1
```

## Architecture

```
@nexus/shared (SKELETON)
       │
       ▼
┌──────────────────────┐
│  Inventory App       │
│  ├── Commands        │
│  ├── Events          │
│  └── Projections     │
└──────────────────────┘
```
