import { DomainEvent } from '@nexus/shared';
import { ProjectionHandler, ReadModel } from './ProjectionHandler';

export interface OrderReadModel extends ReadModel {
  orderId: string;
  customerId: string;
  status: 'PLACED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  placedAt: string;
  cancelledAt?: string;
  completedAt?: string;
}

/**
 * Order List Projection Handler
 * Maintains a denormalized view of orders for list queries
 */
export class OrderListProjection extends ProjectionHandler<OrderReadModel> {
  protected async transform(event: DomainEvent): Promise<OrderReadModel> {
    switch (event.eventType) {
      case 'OrderPlaced':
        return this.handleOrderPlaced(event);
      
      case 'OrderCancelled':
        return this.handleOrderCancelled(event);
      
      case 'OrderCompleted':
        return this.handleOrderCompleted(event);
      
      default:
        throw new Error(`Unsupported event type: ${event.eventType}`);
    }
  }

  private async handleOrderPlaced(event: DomainEvent): Promise<OrderReadModel> {
    return {
      id: event.aggregateId,
      aggregateId: event.aggregateId,
      version: event.aggregateVersion,
      lastUpdated: event.timestamp,
      orderId: event.payload.orderId,
      customerId: event.payload.customerId,
      status: 'PLACED',
      totalAmount: event.payload.totalAmount,
      items: event.payload.items || [],
      placedAt: event.timestamp,
    };
  }

  private async handleOrderCancelled(event: DomainEvent): Promise<OrderReadModel> {
    const existing = await this.get(event.aggregateId);
    
    if (!existing) {
      throw new Error(`Order not found: ${event.aggregateId}`);
    }

    return {
      ...existing,
      version: event.aggregateVersion,
      lastUpdated: event.timestamp,
      status: 'CANCELLED',
      cancelledAt: event.timestamp,
    };
  }

  private async handleOrderCompleted(event: DomainEvent): Promise<OrderReadModel> {
    const existing = await this.get(event.aggregateId);
    
    if (!existing) {
      throw new Error(`Order not found: ${event.aggregateId}`);
    }

    return {
      ...existing,
      version: event.aggregateVersion,
      lastUpdated: event.timestamp,
      status: 'COMPLETED',
      completedAt: event.timestamp,
    };
  }
}
