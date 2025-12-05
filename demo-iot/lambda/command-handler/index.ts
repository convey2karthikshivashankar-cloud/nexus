import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENT_STORE_TABLE!;

/**
 * IoT Command Handler - CQRS Write Side
 * 
 * Supported Commands:
 * - RegisterSensor: Register a new IoT sensor
 * - RecordReading: Record a sensor reading (temperature, humidity, etc.)
 * - TriggerAlert: Trigger an alert when threshold is breached
 * - AcknowledgeAlert: Acknowledge and resolve an alert
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('IoT Command received:', JSON.stringify(event, null, 2));

  try {
    const command = JSON.parse(event.body || '{}');
    const commandType = command.commandType;

    if (!commandType) {
      return errorResponse(400, 'Command type is required');
    }

    console.log('[IoT Demo] Processing command:', commandType);

    let domainEvent: any;

    switch (commandType) {
      case 'RegisterSensor':
        domainEvent = createSensorRegisteredEvent(command);
        break;
      case 'RecordReading':
        domainEvent = createReadingRecordedEvent(command);
        break;
      case 'TriggerAlert':
        domainEvent = createAlertTriggeredEvent(command);
        break;
      case 'AcknowledgeAlert':
        domainEvent = createAlertAcknowledgedEvent(command);
        break;
      default:
        return errorResponse(400, `Unknown command type: ${commandType}`);
    }

    // Get current version for aggregate
    const version = await getNextVersion(domainEvent.aggregateId);
    domainEvent.aggregateVersion = version;

    // Store event in Event Store (append-only)
    await docClient.send(
      new PutCommand({
        TableName: EVENTS_TABLE,
        Item: {
          aggregateId: domainEvent.aggregateId,
          version: domainEvent.aggregateVersion,
          ...domainEvent,
        },
        ConditionExpression: 'attribute_not_exists(aggregateId) AND attribute_not_exists(version)',
      })
    );

    console.log('[IoT Demo] Event stored:', domainEvent.eventId);

    return {
      statusCode: 202,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: true,
        aggregateId: domainEvent.aggregateId,
        version: domainEvent.aggregateVersion,
        eventId: domainEvent.eventId,
        eventType: domainEvent.eventType,
      }),
    };
  } catch (error: any) {
    console.error('Error processing IoT command:', error);
    return errorResponse(500, error.message);
  }
};

function createSensorRegisteredEvent(command: any) {
  const sensorId = command.sensorId || `sensor-${randomUUID().substring(0, 8)}`;
  return {
    eventId: randomUUID(),
    eventType: 'SensorRegistered',
    aggregateId: sensorId,
    timestamp: new Date().toISOString(),
    payload: {
      sensorId,
      sensorType: command.sensorType || 'temperature',
      location: command.location || 'Unknown',
      thresholds: command.thresholds || { min: 0, max: 100 },
      unit: command.unit || '°C',
      metadata: command.metadata || {},
    },
    metadata: {
      correlationId: randomUUID(),
      causationId: randomUUID(),
      userId: command.userId || 'iot-system',
      schemaVersion: '1.0',
    },
  };
}

function createReadingRecordedEvent(command: any) {
  const readingId = randomUUID();
  return {
    eventId: randomUUID(),
    eventType: 'ReadingRecorded',
    aggregateId: command.sensorId || `sensor-${randomUUID().substring(0, 8)}`,
    timestamp: new Date().toISOString(),
    payload: {
      readingId,
      sensorId: command.sensorId,
      value: command.value ?? Math.random() * 100,
      unit: command.unit || '°C',
      quality: command.quality || 'good',
      recordedAt: command.recordedAt || new Date().toISOString(),
    },
    metadata: {
      correlationId: randomUUID(),
      causationId: randomUUID(),
      source: 'iot-gateway',
      schemaVersion: '1.0',
    },
  };
}

function createAlertTriggeredEvent(command: any) {
  const alertId = `alert-${randomUUID().substring(0, 8)}`;
  return {
    eventId: randomUUID(),
    eventType: 'AlertTriggered',
    aggregateId: alertId,
    timestamp: new Date().toISOString(),
    payload: {
      alertId,
      sensorId: command.sensorId,
      alertType: command.alertType || 'threshold_breach',
      severity: command.severity || 'warning',
      message: command.message || 'Threshold exceeded',
      value: command.value,
      threshold: command.threshold,
      triggeredAt: new Date().toISOString(),
    },
    metadata: {
      correlationId: randomUUID(),
      causationId: randomUUID(),
      source: 'alert-engine',
      schemaVersion: '1.0',
    },
  };
}

function createAlertAcknowledgedEvent(command: any) {
  return {
    eventId: randomUUID(),
    eventType: 'AlertAcknowledged',
    aggregateId: command.alertId,
    timestamp: new Date().toISOString(),
    payload: {
      alertId: command.alertId,
      acknowledgedBy: command.acknowledgedBy || 'operator',
      notes: command.notes || '',
      acknowledgedAt: new Date().toISOString(),
    },
    metadata: {
      correlationId: randomUUID(),
      causationId: randomUUID(),
      userId: command.acknowledgedBy || 'operator',
      schemaVersion: '1.0',
    },
  };
}

async function getNextVersion(aggregateId: string): Promise<number> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        KeyConditionExpression: 'aggregateId = :aid',
        ExpressionAttributeValues: { ':aid': aggregateId },
        ScanIndexForward: false,
        Limit: 1,
      })
    );
    return (result.Items?.[0]?.version || 0) + 1;
  } catch {
    return 1;
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}
