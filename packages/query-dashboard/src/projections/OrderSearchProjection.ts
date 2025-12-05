import { DomainEvent } from '@nexus/shared';
import { ProjectionHandler } from './ProjectionHandler';
import { Client } from '@opensearch-project/opensearch';

interface OrderSearchDocument {
  orderId: string;
  customerId: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
  searchableText: string;
  version: number;
}

export class OrderSearchProjection extends ProjectionHandler {
  private readonly indexName = 'orders';

  constructor(
    openSearchClient: Client,
    enableLogging: boolean = true
  ) {
    super(openSearchClient, enableLogging);
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'OrderPlaced':
        await this.handleOrderPlaced(event);
        break;
      case 'OrderCancelled':
        await this.handleOrderCancelled(event);
        break;
      case 'OrderCompleted':
        await this.handleOrderCompleted(event);
        break;
      default:
        this.log(`Ignoring event type: ${event.eventType}`);
    }
  }

  private async handleOrderPlaced(event: DomainEvent): Promise<void> {
    const document: OrderSearchDocument = {
      orderId: event.aggregateId,
      customerId: event.payload.customerId as string,
      status: 'PLACED',
      totalAmount: event.payload.totalAmount as number,
      items: event.payload.items as any[],
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      searchableText: this.buildSearchableText(event),
      version: event.aggregateVersion,
    };

    await this.upsertDocument(this.indexName, event.aggregateId, document, event.aggregateVersion);
  }

  private async handleOrderCancelled(event: DomainEvent): Promise<void> {
    await this.updateDocument(
      this.indexName,
      event.aggregateId,
      {
        status: 'CANCELLED',
        updatedAt: event.timestamp,
        version: event.aggregateVersion,
      },
      event.aggregateVersion
    );
  }

  private async handleOrderCompleted(event: DomainEvent): Promise<void> {
    await this.updateDocument(
      this.indexName,
      event.aggregateId,
      {
        status: 'COMPLETED',
        updatedAt: event.timestamp,
        version: event.aggregateVersion,
      },
      event.aggregateVersion
    );
  }

  private buildSearchableText(event: DomainEvent): string {
    const parts: string[] = [
      event.aggregateId,
      event.payload.customerId as string,
    ];

    if (event.payload.items) {
      const items = event.payload.items as any[];
      items.forEach(item => {
        parts.push(item.productId);
      });
    }

    return parts.join(' ');
  }
}
