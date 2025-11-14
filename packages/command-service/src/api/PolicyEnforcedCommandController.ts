/**
 * Command Controller with Runtime Policy Enforcement
 * 
 * Demonstrates integration of policy enforcement in command processing.
 * Requirements: 12.1, 12.2, 12.3
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { policyEnforcer } from '@nexus/shared';
import { withPolicyEnforcement } from '../../../infrastructure/src/middleware/PolicyEnforcementMiddleware';

/**
 * Command Controller with policy checks before execution
 */
export class PolicyEnforcedCommandController {
  /**
   * Handle command with policy enforcement
   */
  async handleCommand(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const command = JSON.parse(event.body || '{}');
      const commandType = event.pathParameters?.commandType;

      if (!commandType) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Command type is required' }),
        };
      }

      // Policy Check: Validate event publishing (if command generates events)
      if (command.eventType) {
        try {
          // In real implementation, check if schema is registered
          const hasSchema = await this.checkSchemaRegistered(command.eventType);
          policyEnforcer.validateEventPublish(command.eventType, hasSchema);
        } catch (error: any) {
          console.error('[CommandController] Policy violation:', error.message);
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: 'Policy Violation',
              message: error.message,
            }),
          };
        }
      }

      // Policy Check: Validate database operations
      try {
        // Commands write to EventStore (append-only)
        policyEnforcer.validateDatabaseOperation('EventStore', 'INSERT');
      } catch (error: any) {
        console.error('[CommandController] Policy violation:', error.message);
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Policy Violation',
            message: error.message,
          }),
        };
      }

      // Execute command (implementation details omitted)
      const result = await this.executeCommand(commandType, command);

      return {
        statusCode: 202,
        body: JSON.stringify(result),
      };
    } catch (error: any) {
      console.error('[CommandController] Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  private async checkSchemaRegistered(eventType: string): Promise<boolean> {
    // In real implementation, query Schema Registry
    // For now, return true for known event types
    const knownEventTypes = ['OrderPlaced', 'OrderCancelled', 'PaymentProcessed'];
    return knownEventTypes.includes(eventType);
  }

  private async executeCommand(commandType: string, command: any): Promise<any> {
    // Implementation details omitted
    return {
      success: true,
      aggregateId: command.aggregateId || 'agg-123',
      version: 1,
      eventIds: ['evt-123'],
    };
  }
}

/**
 * Lambda handler with policy enforcement middleware
 */
const controller = new PolicyEnforcedCommandController();

export const handler = withPolicyEnforcement(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return controller.handleCommand(event);
  },
  {
    enableLogging: true,
    strictMode: true, // Block requests on policy violations
  }
);

/**
 * Example: Policy enforcement in action
 * 
 * Valid Request:
 * POST /api/commands/PlaceOrder
 * {
 *   "aggregateId": "order-123",
 *   "eventType": "OrderPlaced",
 *   "customerId": "cust-456"
 * }
 * 
 * Response: 202 Accepted
 * 
 * Invalid Request (unregistered schema):
 * POST /api/commands/PlaceOrder
 * {
 *   "aggregateId": "order-123",
 *   "eventType": "UnknownEvent",
 *   "customerId": "cust-456"
 * }
 * 
 * Response: 403 Forbidden
 * {
 *   "error": "Policy Violation",
 *   "message": "Event UnknownEvent has no registered schema"
 * }
 * 
 * Invalid Request (direct service call):
 * POST /api/commands/PlaceOrder
 * Headers: { "User-Agent": "query-dashboard" }
 * 
 * Response: 403 Forbidden
 * {
 *   "error": "Policy Violation",
 *   "message": "Direct service calls are prohibited"
 * }
 */
