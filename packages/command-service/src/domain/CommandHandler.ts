import { Command, CommandResult, DomainEvent, EventStorePort, SnapshotStorePort } from '@nexus/shared';
import { SnapshotManager } from '../infrastructure/SnapshotManager';
import { v4 as uuidv4 } from 'uuid';

export abstract class CommandHandler<TState = any> {
  constructor(
    protected readonly eventStore: EventStorePort,
    protected readonly snapshotStore: SnapshotStorePort,
    protected readonly snapshotManager?: SnapshotManager
  ) {}

  async handle(command: Command): Promise<CommandResult> {
    try {
      // 1. Validate command
      this.validateCommand(command);

      // 2. Load snapshot if available
      const snapshot = await this.snapshotStore.getLatest(command.aggregateId);

      // 3. Replay events since snapshot
      const events = await this.eventStore.getEvents(
        command.aggregateId,
        snapshot?.version ?? 0
      );

      // 4. Rehydrate aggregate state
      const state = this.rehydrate(snapshot?.state, events);

      // 5. Validate command against current state
      this.validateAgainstState(command, state);

      // 6. Execute business logic and generate new events
      const newEvents = this.execute(command, state);

      // 7. Set aggregate version and metadata
      const currentVersion = snapshot?.version ?? events.length;
      const enrichedEvents = newEvents.map((event, index) => ({
        ...event,
        eventId: event.eventId || uuidv4(),
        aggregateId: command.aggregateId,
        aggregateVersion: currentVersion + index + 1,
        timestamp: event.timestamp || new Date().toISOString(),
        metadata: {
          ...event.metadata,
          correlationId: command.metadata.correlationId,
          causationId: command.commandId,
          userId: command.metadata.userId,
          schemaVersion: event.metadata?.schemaVersion || '1.0',
        },
      }));

      // 8. Persist events atomically
      // GOVERNANCE FIRST: Schema validation happens in EventStore.append()
      // Events are validated against registered schemas before persistence
      // Invalid events will throw an error and prevent persistence
      await this.eventStore.append(enrichedEvents);

      // 9. Evaluate snapshot trigger synchronously (meets 5-second requirement)
      if (this.snapshotManager) {
        const newVersion = currentVersion + newEvents.length;
        const aggregateSize = this.calculateAggregateSize(events, enrichedEvents);
        await this.snapshotManager.evaluateTriggerSync(
          command.aggregateId,
          newVersion,
          aggregateSize
        );
      }

      // 10. Return result with version for optimistic consistency
      return {
        success: true,
        aggregateId: command.aggregateId,
        version: currentVersion + newEvents.length,
        eventIds: enrichedEvents.map(e => e.eventId),
      };
    } catch (error: any) {
      return {
        success: false,
        aggregateId: command.aggregateId,
        version: 0,
        eventIds: [],
        error: error.message,
      };
    }
  }

  private calculateAggregateSize(existingEvents: DomainEvent[], newEvents: DomainEvent[]): number {
    const allEvents = [...existingEvents, ...newEvents];
    return allEvents.reduce((total, event) => {
      return total + JSON.stringify(event).length;
    }, 0);
  }

  protected abstract validateCommand(command: Command): void;
  protected abstract validateAgainstState(command: Command, state: TState): void;
  protected abstract execute(command: Command, state: TState): Partial<DomainEvent>[];
  
  protected rehydrate(snapshotState: any, events: DomainEvent[]): TState {
    let state = snapshotState || this.getInitialState();
    
    for (const event of events) {
      state = this.apply(state, event);
    }
    
    return state;
  }

  protected abstract getInitialState(): TState;
  protected abstract apply(state: TState, event: DomainEvent): TState;
}
