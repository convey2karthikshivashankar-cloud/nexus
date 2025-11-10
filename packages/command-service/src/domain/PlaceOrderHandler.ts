import { Command, DomainEvent, EventStorePort, SnapshotStorePort } from '@nexus/shared';
import { CommandHandler } from './CommandHandler';
import { SnapshotManager } from '../infrastructure/SnapshotManager';
import { Order, OrderItem } from './Order';

export class PlaceOrderHandler extends CommandHandler<Order> {
  constructor(
    eventStore: EventStorePort,
    snapshotStore: SnapshotStorePort,
    snapshotManager?: SnapshotManager
  ) {
    super(eventStore, snapshotStore, snapshotManager);
  }

  protected validateCommand(command: Command): void {
    if (!command.payload.customerId) {
      throw new Error('customerId is required');
    }
    if (!command.payload.items || !Array.isArray(command.payload.items)) {
      throw new Error('items array is required');
    }
    if (command.payload.items.length === 0) {
      throw new Error('Order must have at least one item');
    }
  }

  protected validateAgainstState(command: Command, state: Order): void {
    // New order - no state validation needed
  }

  protected execute(command: Command, state: Order): Partial<DomainEvent>[] {
    const items = command.payload.items as OrderItem[];
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return [{
      eventType: 'OrderPlaced',
      payload: {
        customerId: command.payload.customerId,
        items,
        totalAmount,
      },
      metadata: {
        schemaVersion: '1.0',
      },
    }];
  }

  protected getInitialState(): Order {
    return new Order();
  }

  protected apply(state: Order, event: DomainEvent): Order {
    const newOrder = new Order(state.getState());
    newOrder.apply(event);
    return newOrder;
  }
}
