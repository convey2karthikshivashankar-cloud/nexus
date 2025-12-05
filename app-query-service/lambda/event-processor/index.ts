/**
 * Nexus Query Service - Event Processor (Projector)
 * Skeleton Crew App #2 - Processes events from Command Service
 * 
 * Handles:
 * - OrderPlaced: Creates order projection
 * - OrderCancelled: Updates order status in projection
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
  console.log('Event Processor - Received:', JSON.stringify(event, null, 2));
  
  try {
    // Handle EventBridge event
    const detail = event.detail;
    const eventType = event['detail-type'] || detail?.eventType;
    
    if (!detail) {
      console.log('No event detail found');
      return { statusCode: 200, body: 'No detail' };
    }
    
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = detail.timestamp || new Date().toISOString();
    
    // ========================================
    // Log event to events table
    // ========================================
    await dynamodb.put({
      TableName: process.env.EVENTS_TABLE,
      Item: {
        eventId,
        eventType,
        timestamp,
        orderId: detail.orderId,
        customerId: detail.customerId,
        totalAmount: detail.totalAmount,
        payload: detail.payload || detail,
        source: event.source || 'nexus.command-service'
      }
    }).promise();
    
    console.log('Event logged:', eventId, eventType);
    
    // ========================================
    // Process OrderPlaced event
    // ========================================
    if (eventType === 'OrderPlaced') {
      const order = detail.payload || detail;
      
      await dynamodb.put({
        TableName: process.env.ORDERS_TABLE,
        Item: {
          orderId: order.orderId,
          customerId: order.customerId,
          customerName: order.customerName,
          items: order.items,
          totalAmount: order.totalAmount,
          status: 'PLACED',
          createdAt: order.createdAt || timestamp,
          projectedAt: new Date().toISOString()
        }
      }).promise();
      
      console.log('Order projection created:', order.orderId);
    }
    
    // ========================================
    // Process OrderCancelled event
    // ========================================
    if (eventType === 'OrderCancelled') {
      const order = detail.payload || detail;
      
      // Get existing projection
      const existing = await dynamodb.get({
        TableName: process.env.ORDERS_TABLE,
        Key: { orderId: order.orderId }
      }).promise();
      
      if (existing.Item) {
        await dynamodb.put({
          TableName: process.env.ORDERS_TABLE,
          Item: {
            ...existing.Item,
            status: 'CANCELLED',
            cancelledAt: order.cancelledAt || timestamp,
            projectedAt: new Date().toISOString()
          }
        }).promise();
        
        console.log('Order projection updated (cancelled):', order.orderId);
      } else {
        // Create cancelled projection if doesn't exist
        await dynamodb.put({
          TableName: process.env.ORDERS_TABLE,
          Item: {
            orderId: order.orderId,
            customerId: order.customerId,
            totalAmount: order.totalAmount,
            status: 'CANCELLED',
            cancelledAt: order.cancelledAt || timestamp,
            projectedAt: new Date().toISOString()
          }
        }).promise();
        
        console.log('Order projection created (cancelled):', order.orderId);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        eventId,
        eventType,
        message: 'Event processed successfully'
      })
    };
    
  } catch (error: any) {
    console.error('Event Processor Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
