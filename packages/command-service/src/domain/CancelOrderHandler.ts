import { Command, DomainEvent, EventStorePort, SnapshotStorePort } from '@nexus/shared';
import { CommandHandler } from './CommandHandler';
import { SnapshotManager } from '../infrastructure/SnapshotManager';
import { Order } from './Order';

export class CancelOrderHandler extends CommandHandler<Order> {
  constructor(
    eventStore: EventStorePort,
    snapshotStore: SnapshotStorePort,
    snapshotManager?: SnapshotManager
  ) {
    super(eventStore, snapshotStore, snapshotManager);
  }

  protected validateCommand(command: Command): void {
    if (!command.aggregateId) {
      throw new Error('orderId (aggregateId) is required');
    }
  }

  protected validateAgainstState(command: Command, state: Order): void {
    if (!state.canBeCancelled()) {
      throw new Error(`Order cannot be cancelled in status: ${state.getState().status}`);
    }
  }

  protected execute(command: Command, state: Order): Partial<DomainEvent>[] {
    return [{
      eventType: 'OrderCancelled',
      payload: {
        reason: command.payload.reason || 'Customer requested cancellation',
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
