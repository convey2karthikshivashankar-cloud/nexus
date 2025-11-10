import { Command, CommandResult } from '@nexus/shared';
import { CommandHandler } from '../domain/CommandHandler';
import { v4 as uuidv4 } from 'uuid';

export interface APIGatewayEvent {
  body: string;
  pathParameters: { commandType: string };
  requestContext: {
    requestId: string;
    authorizer?: {
      claims: {
        sub: string;
      };
    };
  };
  headers: {
    'x-correlation-id'?: string;
  };
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export class CommandController {
  private handlers: Map<string, CommandHandler> = new Map();

  registerHandler(commandType: string, handler: CommandHandler): void {
    this.handlers.set(commandType, handler);
  }

  async handleRequest(event: APIGatewayEvent): Promise<APIGatewayResponse> {
    try {
      const commandType = event.pathParameters.commandType;
      const handler = this.handlers.get(commandType);

      if (!handler) {
        return this.errorResponse(404, `Command type '${commandType}' not found`);
      }

      // Parse and validate request body
      const payload = JSON.parse(event.body);
      
      if (!payload.aggregateId) {
        return this.errorResponse(400, 'aggregateId is required');
      }

      // Extract user ID from authorizer
      const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';

      // Build command
      const command: Command = {
        commandId: uuidv4(),
        commandType,
        aggregateId: payload.aggregateId,
        timestamp: new Date().toISOString(),
        payload,
        metadata: {
          userId,
          correlationId: event.headers['x-correlation-id'] || event.requestContext.requestId,
          causationId: event.requestContext.requestId,
        },
      };

      // Execute command
      const result = await handler.handle(command);

      if (!result.success) {
        return this.errorResponse(400, result.error || 'Command execution failed');
      }

      // Return 202 Accepted with result
      return {
        statusCode: 202,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': command.metadata.correlationId,
        },
        body: JSON.stringify({
          aggregateId: result.aggregateId,
          version: result.version,
          eventIds: result.eventIds,
        }),
      };
    } catch (error: any) {
      console.error('Command execution error:', error);
      return this.errorResponse(500, 'Internal server error');
    }
  }

  private errorResponse(statusCode: number, message: string): APIGatewayResponse {
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
}
