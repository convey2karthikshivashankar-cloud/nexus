#!/usr/bin/env node

/**
 * Service Dependency Graph Generator
 * 
 * Analyzes the codebase to detect service-to-service communication patterns
 * and generates a dependency graph for policy validation.
 * 
 * This script detects:
 * - HTTP/gRPC calls between services
 * - Database operations (INSERT, UPDATE, DELETE)
 * - Event publishing patterns
 * - API endpoint definitions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

/**
 * Analyze service calls in the codebase
 */
function analyzeServiceCalls() {
  const serviceCalls = [];
  
  try {
    // Search for HTTP client usage
    const httpCalls = execSync(
      `grep -r "axios\\|fetch\\|http.get\\|http.post" ${PACKAGES_DIR} --include="*.ts" --include="*.js" -n`,
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    for (const call of httpCalls) {
      const [file, lineNum, content] = call.split(':');
      const source = extractServiceName(file);
      const target = extractTargetService(content);
      
      if (source && target) {
        serviceCalls.push({
          type: 'service_call',
          source,
          target,
          protocol: 'http',
          file: path.relative(process.cwd(), file),
          line: parseInt(lineNum),
        });
      }
    }
  } catch (error) {
    // No HTTP calls found
  }

  return serviceCalls;
}

/**
 * Analyze database operations
 */
function analyzeDatabaseOperations() {
  const dbOperations = [];
  
  try {
    // Search for DynamoDB operations
    const operations = execSync(
      `grep -r "UpdateCommand\\|DeleteCommand\\|PutCommand" ${PACKAGES_DIR} --include="*.ts" -B 5 -n`,
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    for (const op of operations) {
      if (op.includes('TableName')) {
        const tableName = extractTableName(op);
        const operation = extractOperation(op);
        
        if (tableName && operation) {
          dbOperations.push({
            type: 'database_operation',
            table: tableName,
            operation,
          });
        }
      }
    }
  } catch (error) {
    // No database operations found
  }

  return dbOperations;
}

/**
 * Analyze event publishing
 */
function analyzeEventPublishing() {
  const eventPublishes = [];
  const registeredSchemas = {};
  
  try {
    // Find all event types
    const events = execSync(
      `grep -r "eventType:" ${PACKAGES_DIR} --include="*.ts" -A 2`,
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    for (const event of events) {
      const eventType = extractEventType(event);
      if (eventType) {
        eventPublishes.push({
          type: 'event_publish',
          eventType,
          registeredSchemas,
        });
      }
    }

    // Check for registered schemas
    const schemasDir = path.join(__dirname, '..', 'schemas');
    if (fs.existsSync(schemasDir)) {
      const schemaFiles = fs.readdirSync(schemasDir);
      for (const file of schemaFiles) {
        if (file.endsWith('.json')) {
          const eventType = file.replace('.json', '');
          registeredSchemas[eventType] = true;
        }
      }
    }
  } catch (error) {
    // No events found
  }

  return eventPublishes.map(e => ({
    ...e,
    registeredSchemas,
  }));
}

/**
 * Analyze API endpoints
 */
function analyzeApiEndpoints() {
  const endpoints = [];
  
  try {
    // Search for API route definitions
    const routes = execSync(
      `grep -r "app.get\\|app.post\\|router.get\\|router.post" ${PACKAGES_DIR} --include="*.ts" -A 10`,
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    for (const route of routes) {
      const path = extractRoutePath(route);
      const rateLimit = extractRateLimit(route);
      
      if (path) {
        endpoints.push({
          type: 'api_endpoint',
          path,
          rateLimit: rateLimit || 0,
        });
      }
    }
  } catch (error) {
    // No API endpoints found
  }

  return endpoints;
}

/**
 * Helper functions
 */
function extractServiceName(filePath) {
  if (filePath.includes('command-service')) return 'command_service';
  if (filePath.includes('query-dashboard')) return 'query_dashboard';
  if (filePath.includes('event-router')) return 'event_bus';
  return null;
}

function extractTargetService(content) {
  if (content.includes('query-dashboard') || content.includes('query_dashboard')) {
    return 'query_dashboard';
  }
  if (content.includes('command-service') || content.includes('command_service')) {
    return 'command_service';
  }
  if (content.includes('event-bus') || content.includes('kinesis')) {
    return 'event_bus';
  }
  return null;
}

function extractTableName(content) {
  const match = content.match(/TableName:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

function extractOperation(content) {
  if (content.includes('UpdateCommand')) return 'UPDATE';
  if (content.includes('DeleteCommand')) return 'DELETE';
  if (content.includes('PutCommand')) return 'INSERT';
  return null;
}

function extractEventType(content) {
  const match = content.match(/eventType:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

function extractRoutePath(content) {
  const match = content.match(/['"]([^'"]*\/api\/[^'"]+)['"]/);
  return match ? match[1] : null;
}

function extractRateLimit(content) {
  const match = content.match(/rateLimit[:\s]*(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Main execution
 */
function main() {
  console.error('Generating service dependency graph...');
  
  const graph = {
    serviceCalls: analyzeServiceCalls(),
    databaseOperations: analyzeDatabaseOperations(),
    eventPublishes: analyzeEventPublishing(),
    apiEndpoints: analyzeApiEndpoints(),
    timestamp: new Date().toISOString(),
  };

  console.error(`Found ${graph.serviceCalls.length} service calls`);
  console.error(`Found ${graph.databaseOperations.length} database operations`);
  console.error(`Found ${graph.eventPublishes.length} event publishes`);
  console.error(`Found ${graph.apiEndpoints.length} API endpoints`);

  // Output JSON to stdout
  console.log(JSON.stringify(graph, null, 2));
}

main();
