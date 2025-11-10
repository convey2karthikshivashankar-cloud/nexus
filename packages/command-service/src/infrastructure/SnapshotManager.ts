import { SnapshotTrigger, DomainEvent, SnapshotStorePort, EventStorePort, Snapshot } from '@nexus/shared';

export interface SnapshotMetrics {
  creationCount: number;
  creationFailures: number;
  avgCreationTime: number;
  lastCreationTime: number;
}

export class SnapshotManager {
  private readonly snapshotStore: SnapshotStorePort;
  private readonly eventStore: EventStorePort;
  private readonly trigger: SnapshotTrigger;
  private readonly metrics: SnapshotMetrics;
  private readonly enableLogging: boolean;

  constructor(
    snapshotStore: SnapshotStorePort,
    eventStore: EventStorePort,
    trigger: SnapshotTrigger = {
      eventCountThreshold: 1000,
      aggregateSizeThreshold: 1048576, // 1MB
      timeElapsedThreshold: 86400000, // 24 hours
    },
    enableLogging: boolean = true
  ) {
    this.snapshotStore = snapshotStore;
    this.eventStore = eventStore;
    this.trigger = trigger;
    this.enableLogging = enableLogging;
    this.metrics = {
      creationCount: 0,
      creationFailures: 0,
      avgCreationTime: 0,
      lastCreationTime: 0,
    };
  }

  private log(message: string, data?: any): void {
    if (this.enableLogging) {
      console.log(`[SnapshotManager] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  private logError(message: string, error: any): void {
    console.error(`[SnapshotManager] ERROR: ${message}`, error);
  }

  /**
   * Synchronous evaluation called by Command Service after event append
   * Meets 5-second latency requirement by evaluating immediately
   */
  async evaluateTriggerSync(
    aggregateId: string,
    currentVersion: number,
    aggregateSize: number
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const lastSnapshot = await this.snapshotStore.getLatest(aggregateId);
      
      const eventsSinceSnapshot = currentVersion - (lastSnapshot?.version ?? 0);
      const timeSinceSnapshot = lastSnapshot 
        ? Date.now() - lastSnapshot.timestamp 
        : Infinity;
      
      this.log('Evaluating snapshot trigger', {
        aggregateId,
        currentVersion,
        aggregateSize,
        eventsSinceSnapshot,
        timeSinceSnapshot,
        thresholds: this.trigger,
      });
      
      // Check event count threshold
      if (eventsSinceSnapshot >= this.trigger.eventCountThreshold) {
        this.log(`Event count threshold exceeded: ${eventsSinceSnapshot} >= ${this.trigger.eventCountThreshold}`);
        this.createSnapshotAsync(aggregateId, 'event_count').catch(err => 
          this.logError('Snapshot creation failed (event_count)', { aggregateId, error: err.message })
        );
        return true;
      }
      
      // Check aggregate size threshold
      if (aggregateSize >= this.trigger.aggregateSizeThreshold) {
        this.log(`Aggregate size threshold exceeded: ${aggregateSize} >= ${this.trigger.aggregateSizeThreshold}`);
        this.createSnapshotAsync(aggregateId, 'aggregate_size').catch(err => 
          this.logError('Snapshot creation failed (aggregate_size)', { aggregateId, error: err.message })
        );
        return true;
      }
      
      const evaluationTime = Date.now() - startTime;
      if (evaluationTime > 5000) {
        this.logError('Snapshot trigger evaluation exceeded 5 seconds', {
          aggregateId,
          evaluationTime,
        });
      }
      
      return false;
    } catch (error: any) {
      this.logError('Snapshot trigger evaluation failed', {
        aggregateId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Asynchronous snapshot creation (fire-and-forget)
   * Does not block command processing
   */
  private async createSnapshotAsync(
    aggregateId: string,
    triggerReason: 'event_count' | 'aggregate_size' | 'time_elapsed' = 'event_count'
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.log(`Creating snapshot for aggregate: ${aggregateId}`, { triggerReason });
      
      // Fetch all events for the aggregate
      const events = await this.eventStore.getEvents(aggregateId);
      
      if (events.length === 0) {
        this.log(`No events found for aggregate: ${aggregateId}`);
        return;
      }
      
      // Rehydrate aggregate state
      const state = this.rehydrate(events);
      
      // Calculate metrics
      const aggregateSize = this.calculateSize(events);
      const creationTime = Date.now() - startTime;
      
      // Create snapshot with versioning support
      const snapshot: Snapshot = {
        aggregateId,
        version: events.length,
        state,
        timestamp: Date.now(),
        schemaVersion: '1.0',
        metadata: {
          eventCount: events.length,
          aggregateSize,
          triggerReason,
          creationTime,
          createdAt: new Date().toISOString(),
        },
      };
      
      // Save snapshot
      await this.snapshotStore.save(snapshot);
      
      // Update metrics
      this.metrics.creationCount++;
      this.metrics.lastCreationTime = creationTime;
      this.metrics.avgCreationTime = 
        (this.metrics.avgCreationTime * (this.metrics.creationCount - 1) + creationTime) / 
        this.metrics.creationCount;
      
      this.log(`Snapshot created successfully`, {
        aggregateId,
        version: snapshot.version,
        eventCount: events.length,
        aggregateSize,
        creationTime,
        triggerReason,
      });
      
    } catch (error: any) {
      this.metrics.creationFailures++;
      this.logError(`Snapshot creation failed for ${aggregateId}`, {
        error: error.message,
        stack: error.stack,
        triggerReason,
      });
      throw error;
    }
  }

  /**
   * Rehydrate aggregate state from events
   * Override this method for specific aggregate types
   */
  protected rehydrate(events: DomainEvent[]): Record<string, unknown> {
    // Default implementation - should be overridden
    return events.reduce((state, event) => {
      return { ...state, ...event.payload };
    }, {});
  }

  /**
   * Calculate total size of events in bytes
   */
  private calculateSize(events: DomainEvent[]): number {
    return events.reduce((total, event) => {
      return total + JSON.stringify(event).length;
    }, 0);
  }

  /**
   * Evaluate time-elapsed threshold (called by EventBridge)
   */
  async evaluateTimeElapsedThreshold(aggregateId: string): Promise<boolean> {
    try {
      const lastSnapshot = await this.snapshotStore.getLatest(aggregateId);
      
      if (!lastSnapshot) {
        this.log(`No snapshot found for aggregate: ${aggregateId}`);
        return false;
      }
      
      const timeSinceSnapshot = Date.now() - lastSnapshot.timestamp;
      
      this.log('Evaluating time-elapsed threshold', {
        aggregateId,
        timeSinceSnapshot,
        threshold: this.trigger.timeElapsedThreshold,
      });
      
      if (timeSinceSnapshot >= this.trigger.timeElapsedThreshold) {
        this.log(`Time-elapsed threshold exceeded: ${timeSinceSnapshot} >= ${this.trigger.timeElapsedThreshold}`);
        await this.createSnapshotAsync(aggregateId, 'time_elapsed');
        return true;
      }
      
      return false;
    } catch (error: any) {
      this.logError('Time-elapsed threshold evaluation failed', {
        aggregateId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get snapshot creation metrics
   */
  getMetrics(): SnapshotMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics.creationCount = 0;
    this.metrics.creationFailures = 0;
    this.metrics.avgCreationTime = 0;
    this.metrics.lastCreationTime = 0;
  }

  /**
   * Manually trigger snapshot creation (for testing or admin operations)
   */
  async createSnapshot(aggregateId: string): Promise<Snapshot> {
    await this.createSnapshotAsync(aggregateId, 'event_count');
    const snapshot = await this.snapshotStore.getLatest(aggregateId);
    if (!snapshot) {
      throw new Error(`Snapshot creation failed for aggregate: ${aggregateId}`);
    }
    return snapshot;
  }
}
