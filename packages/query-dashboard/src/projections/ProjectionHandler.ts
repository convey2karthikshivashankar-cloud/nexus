import { DomainEvent } from '@nexus/shared';
import { Client } from '@opensearch-project/opensearch';

export interface ProjectionHandlerConfig {
  opensearchEndpoint: string;
  indexName: string;
  enableLogging?: boolean;
}

export interface ReadModel {
  id: string;
  aggregateId: string;
  version: number;
  lastUpdated: string;
  [key: string]: any;
}

/**
 * Base class for projection handlers
 * Implements the projection pattern for CQRS read models
 */
export abstract class ProjectionHandler<T extends ReadModel = ReadModel> {
  protected readonly client: Client;
  protected readonly indexName: string;
  protected readonly enableLogging: boolean;

  constructor(config: ProjectionHandlerConfig) {
    this.client = new Client({
      node: config.opensearchEndpoint,
    });
    this.indexName = config.indexName;
    this.enableLogging = config.enableLogging ?? false;
  }

  /**
   * Handle incoming event and update read model
   */
  async handleEvent(event: DomainEvent): Promise<void> {
    const startTime = Date.now();

    try {
      this.log(`Handling event: ${event.eventType} (${event.eventId})`);

      // Apply upcasting if needed
      const upcastedEvent = await this.upcast(event);

      // Transform event to read model
      const readModel = await this.transform(upcastedEvent);

      // Upsert to OpenSearch with optimistic concurrency
      await this.upsert(readModel, event.aggregateVersion);

      // Emit projection lag metric
      const lag = Date.now() - new Date(event.timestamp).getTime();
      await this.emitMetric('ProjectionLag', lag);

      const processingTime = Date.now() - startTime;
      this.log(`Event processed successfully in ${processingTime}ms`, {
        eventType: event.eventType,
        eventId: event.eventId,
        lag,
      });
    } catch (error: any) {
      this.logError(`Projection failed for event ${event.eventId}`, error);
      throw error; // Triggers retry
    }
  }

  /**
   * Upsert read model to OpenSearch
   */
  protected async upsert(readModel: T, expectedVersion: number): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: readModel.id,
        body: readModel,
        refresh: true,
        version: expectedVersion,
        version_type: 'external',
      });
    } catch (error: any) {
      if (error.meta?.body?.error?.type === 'version_conflict_engine_exception') {
        this.log(`Version conflict for ${readModel.id}, skipping (already processed)`);
        return;
      }
      throw error;
    }
  }

  /**
   * Query read models
   */
  protected async query(query: any): Promise<T[]> {
    const response = await this.client.search({
      index: this.indexName,
      body: query,
    });

    return response.body.hits.hits.map((hit: any) => ({
      ...hit._source,
      id: hit._id,
    }));
  }

  /**
   * Get read model by ID
   */
  protected async get(id: string): Promise<T | null> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id,
      });

      return {
        ...response.body._source,
        id: response.body._id,
      };
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete read model
   */
  protected async delete(id: string): Promise<void> {
    await this.client.delete({
      index: this.indexName,
      id,
      refresh: true,
    });
  }

  /**
   * Transform event to read model (must be implemented by subclass)
   */
  protected abstract transform(event: DomainEvent): Promise<T>;

  /**
   * Upcast event to latest schema version (optional)
   */
  protected async upcast(event: DomainEvent): Promise<DomainEvent> {
    // Default: no upcasting
    return event;
  }

  /**
   * Emit CloudWatch metric
   */
  protected async emitMetric(metricName: string, value: number): Promise<void> {
    // Implementation would use CloudWatch SDK
    // Placeholder for now
    if (this.enableLogging) {
      this.log(`Metric: ${metricName} = ${value}`);
    }
  }

  protected log(message: string, data?: any): void {
    if (this.enableLogging) {
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.constructor.name}] ERROR: ${message}`, error);
  }
}
