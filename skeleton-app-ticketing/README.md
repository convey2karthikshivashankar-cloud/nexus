# Skeleton App: Support Ticketing

## 🦴 Skeleton Crew Demo - App #2

This application demonstrates the **Skeleton Crew** hackathon theme by building a complete Support Ticketing system that **imports from `@nexus/shared`**.

## Key Differentiator: True Skeleton Import

```typescript
// In lambda/command-handler/index.ts
import type { DomainEvent, Command, CommandResult, EventMetadata } from '@nexus/shared';
```

Same skeleton, completely different domain!

## Domain: Support Ticketing

| Aspect | Details |
|--------|---------|
| **Commands** | CreateTicket, AssignTicket, ResolveTicket, CloseTicket, AddComment |
| **Events** | TicketCreated, TicketAssigned, TicketResolved, TicketClosed, CommentAdded |
| **Entities** | Tickets, Assignments, Comments, Resolutions |
| **Use Case** | Customer support workflow |

## Stack Resources (UNIQUE names)

- `skeleton-ticketing-events-{accountId}` - Event Store
- `skeleton-ticketing-readmodel-{accountId}` - Read Model
- `skeleton-ticketing-bus-{accountId}` - Event Bus
- `skeleton-ticketing-ui-{accountId}` - UI Bucket

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
│  Ticketing App       │
│  ├── Commands        │
│  ├── Events          │
│  └── Projections     │
└──────────────────────┘
```
