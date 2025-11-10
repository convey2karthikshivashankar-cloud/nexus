import { DomainEvent } from '@nexus/shared';

export interface OrderState {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PLACED = 'PLACED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class Order {
  private state: OrderState;

  constructor(state?: OrderState) {
    this.state = state || this.getInitialState();
  }

  private getInitialState(): OrderState {
    return {
      orderId: '',
      customerId: '',
      items: [],
      status: OrderStatus.PENDING,
      totalAmount: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  getState(): OrderState {
    return { ...this.state };
  }

  apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderPlaced':
        this.state = {
          orderId: event.aggregateId,
          customerId: event.payload.customerId as string,
          items: event.payload.items as OrderItem[],
          status: OrderStatus.PLACED,
          totalAmount: event.payload.totalAmount as number,
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        };
        break;

      case 'OrderCancelled':
        this.state.status = OrderStatus.CANCELLED;
        this.state.updatedAt = event.timestamp;
        break;

      case 'OrderCompleted':
        this.state.status = OrderStatus.COMPLETED;
        this.state.updatedAt = event.timestamp;
        break;
    }
  }

  canBeCancelled(): boolean {
    return this.state.status === OrderStatus.PLACED;
  }

  canBeCompleted(): boolean {
    return this.state.status === OrderStatus.PLACED;
  }
}
