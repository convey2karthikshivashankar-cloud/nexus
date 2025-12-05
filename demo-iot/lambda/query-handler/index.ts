import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SENSORS_TABLE = process.env.SENSORS_TABLE!;
const READINGS_TABLE = process.env.READINGS_TABLE!;
const ALERTS_TABLE = process.env.ALERTS_TABLE!;
const EVENTS_TABLE = process.env.EVENT_STORE_TABLE!;

/**
 * IoT Query Handler - CQRS Read Side
 * 
 * Supported Queries:
 * - GET /sensors - List all sensors
 * - GET /sensors/{sensorId} - Get sensor details
 * - GET /readings - Get recent readings
 * - GET /alerts - Get active alerts
 * - GET /events - Get event stream
 * - GET /queries - Get dashboard summary
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('IoT Query received:', JSON.stringify(event, null, 2));

  try {
    const path = event.path;
    const sensorId = event.pathParameters?.sensorId;

    console.log('[IoT Demo] Processing query:', path);

    // GET /sensors or /sensors/{sensorId}
    if (path.includes('/sensors')) {
      if (sensorId) {
        return await getSensorById(sensorId);
      }
      return await getAllSensors();
    }

    // GET /readings
    if (path.includes('/readings')) {
      return await getReadings(event.queryStringParameters?.sensorId);
    }

    // GET /alerts
    if (path.includes('/alerts')) {
      return await getAlerts();
    }

    // GET /events
    if (path.includes('/events')) {
      return await getEvents();
    }

    // GET /queries - Dashboard summary
    if (path.includes('/queries')) {
      return await getDashboardSummary();
    }

    return errorResponse(400, 'Invalid query path');
  } catch (error: any) {
    console.error('Error processing IoT query:', error);
    return errorResponse(500, error.message);
  }
};

async function getAllSensors(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new ScanCommand({ TableName: SENSORS_TABLE })
  );

  return successResponse({
    items: result.Items || [],
    total: result.Count || 0,
  });
}

async function getSensorById(sensorId: string): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new GetCommand({
      TableName: SENSORS_TABLE,
      Key: { sensorId },
    })
  );

  if (!result.Item) {
    return errorResponse(404, 'Sensor not found');
  }

  return successResponse(result.Item);
}

async function getReadings(sensorId?: string): Promise<APIGatewayProxyResult> {
  let result;
  
  if (sensorId) {
    result = await docClient.send(
      new QueryCommand({
        TableName: READINGS_TABLE,
        KeyConditionExpression: 'sensorId = :sid',
        ExpressionAttributeValues: { ':sid': sensorId },
        ScanIndexForward: false,
        Limit: 100,
      })
    );
  } else {
    result = await docClient.send(
      new ScanCommand({
        TableName: READINGS_TABLE,
        Limit: 100,
      })
    );
  }

  return successResponse({
    items: result.Items || [],
    total: result.Count || 0,
  });
}

async function getAlerts(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: ALERTS_TABLE,
      Limit: 50,
    })
  );

  return successResponse({
    items: result.Items || [],
    total: result.Count || 0,
  });
}

async function getEvents(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: EVENTS_TABLE,
      Limit: 100,
    })
  );

  // Sort by timestamp descending
  const items = (result.Items || []).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return successResponse({
    items,
    total: result.Count || 0,
  });
}

async function getDashboardSummary(): Promise<APIGatewayProxyResult> {
  const [sensors, readings, alerts, events] = await Promise.all([
    docClient.send(new ScanCommand({ TableName: SENSORS_TABLE })),
    docClient.send(new ScanCommand({ TableName: READINGS_TABLE, Limit: 100 })),
    docClient.send(new ScanCommand({ TableName: ALERTS_TABLE })),
    docClient.send(new ScanCommand({ TableName: EVENTS_TABLE, Limit: 100 })),
  ]);

  // Calculate stats
  const activeAlerts = (alerts.Items || []).filter(a => a.status !== 'acknowledged').length;
  const readingValues = (readings.Items || []).map(r => r.value).filter(v => typeof v === 'number');
  const avgReading = readingValues.length > 0 
    ? readingValues.reduce((a, b) => a + b, 0) / readingValues.length 
    : 0;

  return successResponse({
    items: sensors.Items || [],
    total: sensors.Count || 0,
    stats: {
      totalSensors: sensors.Count || 0,
      totalReadings: readings.Count || 0,
      totalEvents: events.Count || 0,
      activeAlerts,
      avgReading: Math.round(avgReading * 10) / 10,
    },
  });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function successResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(data),
  };
}

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}
