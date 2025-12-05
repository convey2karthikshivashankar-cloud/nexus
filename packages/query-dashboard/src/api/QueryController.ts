import { Client } from '@opensearch-project/opensearch';
import { EventStorePort } from '@nexus/shared';

export interface QueryRequest {
  resourceType: string;
  filters?: Record<string, any>;
  pagination?: {
    limit: number;
    offset: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface SearchRequest {
  resourceType: string;
  query: string;
  filters?: Record<string, any>;
  facets?: string[];
}

export interface TemporalQueryRequest {
  aggregateId: string;
  asOf: string; // ISO 8601 timestamp
}

export class QueryController {
  private readonly openSearchClient: Client;
  private readonly eventStore: EventStorePort;
  private readonly rateLimiter: Map<string, number[]> = new Map();

  constructor(openSearchClient: Client, eventStore: EventStorePort) {
    this.openSearchClient = openSearchClient;
    this.eventStore = eventStore;
  }

  /**
   * GET /api/queries/{resourceType}
   * Query with filters and pagination
   */
  async query(request: QueryRequest): Promise<any> {
    const { resourceType, filters = {}, pagination = { limit: 20, offset: 0 }, sort } = request;

    const query: any = {
      bool: {
        must: [],
      },
    };

    // Add filters
    Object.entries(filters).forEach(([field, value]) => {
      query.bool.must.push({ term: { [field]: value } });
    });

    const searchParams: any = {
      index: resourceType.toLowerCase(),
      body: {
        query: query.bool.must.length > 0 ? query : { match_all: {} },
        from: pagination.offset,
        size: pagination.limit,
      },
    };

    // Add sorting
    if (sort) {
      searchParams.body.sort = [{ [sort.field]: { order: sort.order } }];
    }

    const response = await this.openSearchClient.search(searchParams);

    return {
      items: response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      })),
      total: response.body.hits.total.value,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: response.body.hits.total.value > pagination.offset + pagination.limit,
      },
    };
  }

  /**
   * GET /api/queries/{resourceType}/search
   * Full-text search with facets
   */
  async search(request: SearchRequest): Promise<any> {
    const { resourceType, query, filters = {}, facets = [] } = request;

    const searchQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['searchableText', 'orderId', 'customerId'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
      },
    };

    // Add filters
    Object.entries(filters).forEach(([field, value]) => {
      searchQuery.bool.must.push({ term: { [field]: value } });
    });

    const searchParams: any = {
      index: resourceType.toLowerCase(),
      body: {
        query: searchQuery,
        size: 20,
      },
    };

    // Add aggregations for facets
    if (facets.length > 0) {
      searchParams.body.aggs = {};
      facets.forEach(facet => {
        searchParams.body.aggs[facet] = {
          terms: { field: facet, size: 10 },
        };
      });
    }

    const response = await this.openSearchClient.search(searchParams);

    return {
      results: response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      })),
      total: response.body.hits.total.value,
      took: response.body.took,
      facets: response.body.aggregations || {},
    };
  }

  /**
   * GET /api/queries/temporal/{aggregateId}
   * Temporal query with rate limiting
   */
  async temporalQuery(request: TemporalQueryRequest, clientId: string): Promise<any> {
    // Rate limiting: 10 requests per minute per client
    if (!this.checkRateLimit(clientId)) {
      throw new Error('Rate limit exceeded: 10 requests per minute per client');
    }

    const { aggregateId, asOf } = request;
    const asOfDate = new Date(asOf);
    const now = new Date();

    // Validate time range (90 days max)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (asOfDate < ninetyDaysAgo) {
      throw new Error('Temporal queries limited to 90 days');
    }

    // Get events up to the specified timestamp
    const events = await this.eventStore.getEvents(aggregateId);
    const historicalEvents = events.filter(e => new Date(e.timestamp) <= asOfDate);

    if (historicalEvents.length === 0) {
      return {
        aggregateId,
        asOf,
        state: null,
        message: 'No events found for the specified time',
      };
    }

    // Rehydrate state at historical point
    const state = this.rehydrateState(historicalEvents);

    return {
      aggregateId,
      asOf,
      state,
      eventCount: historicalEvents.length,
      lastEventTimestamp: historicalEvents[historicalEvents.length - 1].timestamp,
    };
  }

  private rehydrateState(events: any[]): any {
    // Simple rehydration - override for specific aggregates
    return events.reduce((state, event) => {
      return { ...state, ...event.payload };
    }, {});
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(clientId) || [];
    
    // Remove requests outside 1-minute window
    const validRequests = requests.filter(time => now - time < 60000);
    
    if (validRequests.length >= 10) {
      return false;
    }
    
    validRequests.push(now);
    this.rateLimiter.set(clientId, validRequests);
    return true;
  }
}
