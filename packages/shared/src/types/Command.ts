export interface Command {
  commandId: string;
  commandType: string;
  aggregateId: string;
  timestamp: string; // ISO 8601 UTC
  payload: Record<string, unknown>;
  metadata: CommandMetadata;
}

export interface CommandMetadata {
  userId: string;
  correlationId: string;
  causationId?: string;
}

export interface CommandResult {
  success: boolean;
  aggregateId: string;
  version: number;
  eventIds: string[];
  error?: string;
}
