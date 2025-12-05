/**
 * Nexus Command Service - Lambda Handler
 * Skeleton Crew App #1 - Handles all write operations (Commands)
 * 
 * Commands:
 * - PlaceOrder: Creates a new order
 * - CancelOrder: Cancels an existing order
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const eventbridge = new AWS.EventBridge();

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface PlaceOrderCommand {
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
}

interface Order {
  orderId: string;
  customerId: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PLACED' | 'CANCELLED';
  createdAt: string;
  cancelledAt?: string;
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    console.log('Command Service - Received:', JSON.stringify(event, null, 2));
    
    const { httpMethod, body, pathParameters } = event;
    
    // Handle OPTIONS for CORS
    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders, body: '' };
    }
    
    // ========================================
    // POST /orders - Place Order Command
    // ========================================
    if (httpMethod === 'POST') {
      const orderData: PlaceOrderCommand = JSON.parse(body);
      
      // Generate unique order ID
      const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order aggregate
      const order: Order = {
        orderId,
        customerId: orderData.customerId || `customer-${Date.now()}`,
        customerName: orderData.customerName,
        items: orderData.items || [{ productId: 'default', productName: 'Default Product', quantity: 1, price: 99.99 }],
        totalAmount: orderData.totalAmount || 99.99,
        status: 'PLACED',
        createdAt: new Date().toISOString()
      };
      
      console.log('Executing PlaceOrder command:', order);
      
      // Persist to event store (DynamoDB)
      await dynamodb.put({
        TableName: process.env.ORDERS_TABLE,
        Item: order
      }).promise();
      
      // Publish OrderPlaced event
      await eventbridge.putEvents({
        Entries: [{
          Source: 'nexus.command-service',
          DetailType: 'OrderPlaced',
          Detail: JSON.stringify({
            eventType: 'OrderPlaced',
            orderId: order.orderId,
            customerId: order.customerId,
            customerName: order.customerName,
            totalAmount: order.totalAmount,
            items: order.items,
            timestamp: order.createdAt,
            payload: order
          }),
          EventBusName: process.env.EVENT_BUS_NAME
        }]
      }).promise();
      
      const latency = Date.now() - startTime;
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          command: 'PlaceOrder',
          orderId: order.orderId,
          latency,
          message: 'Order placed successfully'
        })
      };
    }
    
    // ========================================
    // PUT /orders/{orderId} - Cancel Order Command
    // ========================================
    if (httpMethod === 'PUT' && pathParameters?.orderId) {
      const orderId = pathParameters.orderId;
      
      console.log('Executing CancelOrder command:', orderId);
      
      // Get existing order
      const getResult = await dynamodb.get({
        TableName: process.env.ORDERS_TABLE,
        Key: { orderId }
      }).promise();
      
      if (!getResult.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Order not found'
          })
        };
      }
      
      const existingOrder = getResult.Item as Order;
      
      if (existingOrder.status === 'CANCELLED') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Order already cancelled'
          })
        };
      }
      
      // Update order status
      const cancelledOrder: Order = {
        ...existingOrder,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString()
      };
      
      await dynamodb.put({
        TableName: process.env.ORDERS_TABLE,
        Item: cancelledOrder
      }).promise();
      
      // Publish OrderCancelled event
      await eventbridge.putEvents({
        Entries: [{
          Source: 'nexus.command-service',
          DetailType: 'OrderCancelled',
          Detail: JSON.stringify({
            eventType: 'OrderCancelled',
            orderId: cancelledOrder.orderId,
            customerId: cancelledOrder.customerId,
            totalAmount: cancelledOrder.totalAmount,
            timestamp: cancelledOrder.cancelledAt,
            payload: cancelledOrder
          }),
          EventBusName: process.env.EVENT_BUS_NAME
        }]
      }).promise();
      
      const latency = Date.now() - startTime;
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          command: 'CancelOrder',
          orderId: orderId,
          latency,
          message: 'Order cancelled successfully'
        })
      };
    }
    
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error: any) {
    console.error('Command Service Error:', error);
    
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
