/**
 * Nexus Query Service - Lambda Handler
 * Skeleton Crew App #2 - Handles all read operations (Queries)
 * 
 * Queries:
 * - GetOrders: Retrieve orders with optional filtering
 * - GetEvents: Retrieve event stream history
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

exports.handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    console.log('Query Service - Received:', JSON.stringify(event, null, 2));
    
    const { httpMethod, path, queryStringParameters } = event;
    
    // Handle OPTIONS for CORS
    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders, body: '' };
    }
    
    // ========================================
    // GET /orders - Query Orders
    // ========================================
    if (httpMethod === 'GET' && path === '/orders') {
      const customerId = queryStringParameters?.customerId;
      const status = queryStringParameters?.status;
      
      let result;
      
      if (customerId) {
        // Query by customer
        console.log('Querying orders by customer:', customerId);
        result = await dynamodb.query({
          TableName: process.env.ORDERS_TABLE,
          IndexName: 'CustomerIndex',
          KeyConditionExpression: 'customerId = :customerId',
          ExpressionAttributeValues: { ':customerId': customerId },
          ScanIndexForward: false
        }).promise();
      } else if (status) {
        // Query by status
        console.log('Querying orders by status:', status);
        result = await dynamodb.query({
          TableName: process.env.ORDERS_TABLE,
          IndexName: 'StatusIndex',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': status },
          ScanIndexForward: false
        }).promise();
      } else {
        // Scan all orders
        console.log('Scanning all orders');
        result = await dynamodb.scan({
          TableName: process.env.ORDERS_TABLE
        }).promise();
      }
      
      const orders = result.Items || [];
      const latency = Date.now() - startTime;
      
      // Sort by createdAt descending
      orders.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          query: 'GetOrders',
          count: orders.length,
          latency,
          data: orders
        })
      };
    }
    
    // ========================================
    // GET /events - Query Event Stream
    // ========================================
    if (httpMethod === 'GET' && path === '/events') {
      const limit = parseInt(queryStringParameters?.limit || '50');
      
      console.log('Querying event stream, limit:', limit);
      
      const result = await dynamodb.scan({
        TableName: process.env.EVENTS_TABLE,
        Limit: limit
      }).promise();
      
      const events = result.Items || [];
      const latency = Date.now() - startTime;
      
      // Sort by timestamp descending
      events.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          query: 'GetEvents',
          count: events.length,
          latency,
          data: events
        })
      };
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error: any) {
    console.error('Query Service Error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        latency: Date.now() - startTime,
        error: error.message
      })
    };
  }
};
