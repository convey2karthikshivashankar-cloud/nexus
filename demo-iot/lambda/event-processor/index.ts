import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBStreamEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SENSORS_TABLE = process.env.SENSORS_TABLE!;
const READINGS_TABLE = process.env.READINGS_TABLE!;
const ALERTS_TABLE = process.env.ALERTS_TABLE!;

/**
 * IoT Event Processor - Updates Read Models from Event Stream
 * 
 * Handles:
 * - SensorRegistered → Create sensor in read model
 * - ReadingRecorded → Store reading, update sensor last reading
 * - AlertTriggered → Create alert in read model
 * - AlertAcknowledged → Update alert status
 */
export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing IoT stream events:', event.Records.length);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      try {
        const newImage = record.dynamodb?.NewImage;
        if (!newImage) continue;

        const eventType = newImage.eventType?.S;
        const payload = newImage.payload?.M || {};
        const aggregateId = newImage.aggregateId?.S;
        const timestamp = newImage.timestamp?.S;

        console.log(`Processing IoT event: ${eventType} for ${aggregateId}`);

        switch (eventType) {
          case 'SensorRegistered':
            await handleSensorRegistered(payload, aggregateId!, timestamp!);
            break;
          case 'ReadingRecorded':
            await handleReadingRecorded(payload, timestamp!);
            break;
          case 'AlertTriggered':
            await handleAlertTriggered(payload, aggregateId!, timestamp!);
            break;
          case 'AlertAcknowledged':
            await handleAlertAcknowledged(payload, aggregateId!);
            break;
          default:
            console.log(`Unknown event type: ${eventType}`);
        }
      } catch (error) {
        console.error('Error processing IoT record:', error);
      }
    }
  }

  return { statusCode: 200, body: 'Processed' };
};

async function handleSensorRegistered(payload: any, sensorId: string, timestamp: string) {
  await docClient.send(
    new PutCommand({
      TableName: SENSORS_TABLE,
      Item: {
        sensorId,
        sensorType: payload.sensorType?.S || 'temperature',
        location: payload.location?.S || 'Unknown',
        thresholds: {
          min: Number(payload.thresholds?.M?.min?.N || 0),
          max: Number(payload.thresholds?.M?.max?.N || 100),
        },
        unit: payload.unit?.S || '°C',
        status: 'active',
        lastReading: null,
        lastReadingAt: null,
        readingCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    })
  );
  console.log(`Sensor registered: ${sensorId}`);
}

async function handleReadingRecorded(payload: any, timestamp: string) {
  const sensorId = payload.sensorId?.S;
  const value = Number(payload.value?.N || 0);
  const readingId = payload.readingId?.S;

  // Store reading with TTL (7 days)
  const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  
  await docClient.send(
    new PutCommand({
      TableName: READINGS_TABLE,
      Item: {
        sensorId,
        timestamp,
        readingId,
        value,
        unit: payload.unit?.S || '°C',
        quality: payload.quality?.S || 'good',
        ttl,
      },
    })
  );

  // Update sensor's last reading
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: SENSORS_TABLE,
        Key: { sensorId },
        UpdateExpression: 'SET lastReading = :val, lastReadingAt = :ts, readingCount = if_not_exists(readingCount, :zero) + :one, updatedAt = :ts',
        ExpressionAttributeValues: {
          ':val': value,
          ':ts': timestamp,
          ':zero': 0,
          ':one': 1,
        },
      })
    );
  } catch (e) {
    console.log('Sensor not found for reading update, may not be registered yet');
  }

  console.log(`Reading recorded: ${readingId} for sensor ${sensorId}`);
}

async function handleAlertTriggered(payload: any, alertId: string, timestamp: string) {
  await docClient.send(
    new PutCommand({
      TableName: ALERTS_TABLE,
      Item: {
        alertId,
        sensorId: payload.sensorId?.S,
        alertType: payload.alertType?.S || 'threshold_breach',
        severity: payload.severity?.S || 'warning',
        message: payload.message?.S || 'Alert triggered',
        value: Number(payload.value?.N || 0),
        threshold: Number(payload.threshold?.N || 0),
        status: 'active',
        triggeredAt: timestamp,
        acknowledgedAt: null,
        acknowledgedBy: null,
      },
    })
  );
  console.log(`Alert triggered: ${alertId}`);
}

async function handleAlertAcknowledged(payload: any, alertId: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: ALERTS_TABLE,
      Key: { alertId },
      UpdateExpression: 'SET #status = :status, acknowledgedAt = :ackAt, acknowledgedBy = :ackBy',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'acknowledged',
        ':ackAt': payload.acknowledgedAt?.S || new Date().toISOString(),
        ':ackBy': payload.acknowledgedBy?.S || 'operator',
      },
    })
  );
  console.log(`Alert acknowledged: ${alertId}`);
}
