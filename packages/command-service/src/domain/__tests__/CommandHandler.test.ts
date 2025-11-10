import { CommandHandler } from '../CommandHandler';
import { EventStore } from '../../infrastructure/EventStore';
import { SnapshotStore } from '../../infrastructure/SnapshotStore';
import { SnapshotManager } from '../../infrastructure/SnapshotManager';
import { Command, DomainEvent } from '@nexus/shared';

class TestCommandHandler extends CommandHandler<{ count: number }> {
  protected validateCommand(command: Command): void {
    if (!command.payload.action) {
      throw new Error('Action is required');
    }
  }

  protected validateAgainstState(command: Command, state: { count: number }): void {
    if (command.payload.action === 'decrement' && state.count <= 0) {
      throw new Error('Cannot decrement below zero');
    }
  }

  protected execute(command: Command, state: { count: number }): Partial<DomainEvent>[] {
    return [{
      eventType: 'CounterChanged',
      payload: {
        action: command.payload.action,
        previousCount: state.count,
        newCount: command.payload.action === 'increment' ? state.count + 1 : state.count - 1,
      },
      metadata: {},
    }];
  }

  protected getInitialState(): { count: number } {
    return { count: 0 };
  }

  protected apply(state: { count: number }, event: DomainEvent): { count: number } {
    if (event.eventType === 'CounterChanged') {
      return { count: event.payload.newCount as number };
    }
    return state;
  }
}

describe('CommandHandler', () => {
  let handler: TestCommandHandler;
  let mockEventStore: jest.Mocked<EventStore>;
  let mockSnapshotStore: jest.Mocked<SnapshotStore>;
  let mockSnapshotManager: jest.Mocked<SnapshotManager>;

  beforeEach(() => {
    mockEventStore = {
      append: jest.fn().mockResolvedValue(undefined),
      getEvents: jest.fn().mockResolvedValue([]),
    } as any;

    mockSnapshotStore = {
      getLatest: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockSnapshotManager = {
      evaluateTriggerSync: jest.fn().mockResolvedValue(false),
    } as any;

    handler = new TestCommandHandler(mockEventStore, mockSnapshotStore, mockSnapshotManager);
  });

  describe('Command Validation', () => {
    it('should reject invalid commands', async () => {
      const command: Command = {
        commandId: 'cmd-1',
        commandType: 'ChangeCounter',
        aggregateId: 'counter-1',
        timestamp: '2025-01-01T00:00:00Z',
        payload: {}, // Missing action
        metadata: {
          userId: 'user-1',
          correlationId: 'corr-1',
        },
      };

      const result = await handler.handle(command);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Action is required');
    });
  });

  describe('Event Generation', () => {
    it('should generate correct events from valid command', async () => {
      const command: Command = {
        commandId: 'cmd-1',
        commandType: 'ChangeCounter',
        aggregateId: 'counter-1',
        timestamp: '2025-01-01T00:00:00Z',
        payload: { action: 'increment' },
        metadata: {
          userId: 'user-1',
          correlationId: 'corr-1',
        },
      };

      const result = await handler.handle(command);
      
      expect(result.success).toBe(true);
      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'CounterChanged',
            aggregateId: 'counter-1',
          })
        ])
      );
    });
  });

  describe('Snapshot Usage', () => {
    it('should use snapshot when available', async () => {
      mockSnapshotStore.getLatest.mockResolvedValue({
        aggregateId: 'counter-1',
        version: 100,
        timestamp: Date.now(),
        state: { count: 50 },
        schemaVersion: '1.0',
        metadata: {
          eventCount: 100,
          aggregateSize: 10000,
        },
      });

      mockEventStore.getEvents.mockResolvedValue([]);

      const command: Command = {
        commandId: 'cmd-1',
        commandType: 'ChangeCounter',
        aggregateId: 'counter-1',
        timestamp: '2025-01-01T00:00:00Z',
        payload: { action: 'increment' },
        metadata: {
          userId: 'user-1',
          correlationId: 'corr-1',
        },
      };

      await handler.handle(command);

      expect(mockEventStore.getEvents).toHaveBeenCalledWith('counter-1', 100);
    });
  });

  describe('Schema Validation Integration', () => {
    it('should include schema version in event metadata', async () => {
      const command: Command = {
        commandId: 'cmd-1',
        commandType: 'ChangeCounter',
        aggregateId: 'counter-1',
        timestamp: '2025-01-01T00:00:00Z',
        payload: { action: 'increment' },
        metadata: {
          userId: 'user-1',
          correlationId: 'corr-1',
        },
      };

      await handler.handle(command);

      expect(mockEventStore.append).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              schemaVersion: '1.0',
            })
          })
        ])
      );
    });
  });

  describe('Synchronous Snapshot Trigger', () => {
    it('should evaluate snapshot trigger after event append', async () => {
      const command: Command = {
        commandId: 'cmd-1',
        commandType: 'ChangeCounter',
        aggregateId: 'counter-1',
        timestamp: '2025-01-01T00:00:00Z',
        payload: { action: 'increment' },
        metadata: {
          userId: 'user-1',
          correlationId: 'corr-1',
        },
      };

      await handler.handle(command);

      expect(mockSnapshotManager.evaluateTriggerSync).toHaveBeenCalledWith(
        'counter-1',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});
