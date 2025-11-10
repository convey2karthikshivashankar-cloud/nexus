import { DomainEvent, EventStorePort } from '@nexus/shared';

/**
 * EventStoreDB implementation of EventStorePort
 * 
 * EventStoreDB is a purpose-built database for Event Sourcing
 * https://www.eventstore.com/
 * 
 * Installation: npm install @eventstore/db-client
 */
export class EventStoreDBAdapter implements EventStorePort {
  // private readonly client: EventStoreDBClient;
  private readonly connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    // this.client = EventStoreDBClient.connectionString(connectionString);
  }

  async append(events: DomainEvent[]): Promise<void> {
    // Implementation example:
    // const eventData = events.map(event => 
    //   jsonEvent({
    //     type: event.eventType,
    //     data: {
    //       ...event.payload,
    //       metadata: event.metadata
    //     }
    //   })
    // );
    // 
    // await this.client.appendToStream(
    //   events[0].aggregateId,
    //   eventData
    // );
    
    throw new Error('EventStoreDB adapter not yet implemented. Install @eventstore/db-client to use.');
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]> {
    // Implementation example:
    // const stream = this.client.readStream(aggregateId, {
    //   fromRevision: fromVersion ? BigInt(fromVersion) : START,
    //   maxCount: toVersion ? toVersion - (fromVersion || 0) : undefined
    // });
    // 
    // const events: DomainEvent[] = [];
    // for await (const resolvedEvent of stream) {
    //   events.push(this.toDomainEvent(resolvedEvent));
    // }
    // return events;
    
    throw new Error('EventStoreDB adapter not yet implemented. Install @eventstore/db-client to use.');
  }

  async getEventsByTimeRange(
    eventType: string,
    startTime: string,
    endTime: string,
    limit: number,
    clientId: string
  ): Promise<DomainEvent[]> {
    // Implementation would use EventStoreDB's $by_event_type projection
    throw new Error('EventStoreDB adapter not yet implemented. Install @eventstore/db-client to use.');
  }

  // private toDomainEvent(resolvedEvent: ResolvedEvent): DomainEvent {
  //   const event = resolvedEvent.event;
  //   return {
  //     eventId: event.id,
  //     eventType: event.type,
  //     aggregateId: event.streamId,
  //     aggregateVersion: Number(event.revision),
  //     timestamp: event.created.toISOString(),
  //     payload: event.data,
  //     metadata: event.metadata
  //   };
  // }
}
