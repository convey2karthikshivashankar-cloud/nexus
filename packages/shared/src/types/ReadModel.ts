export interface ReadModel {
  id: string;
  aggregateId: string;
  version: number;
  lastUpdated: string; // ISO 8601
  status: string;
  searchableText: string;
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface ProjectionUpdate {
  aggregateId: string;
  version: number;
  eventId: string;
  timestamp: string;
}
