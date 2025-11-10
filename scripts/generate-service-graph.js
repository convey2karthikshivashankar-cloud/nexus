#!/usr/bin/env node

/**
 * Generate service dependency graph for policy validation
 * Analyzes code to detect service-to-service calls
 */

const fs = require('fs');
const path = require('path');

const serviceGraph = {
  services: ['command_service', 'query_dashboard', 'event_bus'],
  calls: [],
  databaseOperations: [],
  apiEndpoints: [],
  eventPublications: [],
  registeredSchemas: {}
};

// Scan command-service for HTTP calls
function scanCommandService() {
  const commandServicePath = path.join(__dirname, '../packages/command-service/src');
  
  // Check for direct HTTP calls to query-dashboard
  // This is a simplified example - real implementation would parse AST
  const files = getAllFiles(commandServicePath);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Detect HTTP calls
    if (content.includes('http://') || content.includes('https://')) {
      if (content.includes('query-dashboard') || content.includes('query_dashboard')) {
        serviceGraph.calls.push({
          type: 'service_call',
          source: 'command_service',
          target: 'query_dashboard',
          protocol: 'http',
          file: file
        });
      }
    }
    
    // Detect database operations
    if (content.includes('UPDATE') && content.includes('EventStore')) {
      serviceGraph.databaseOperations.push({
        type: 'database_operation',
        table: 'EventStore',
        operation: 'UPDATE',
        file: file
      });
    }
    
    if (content.includes('DELETE') && content.includes('EventStore')) {
      serviceGraph.databaseOperations.push({
        type: 'database_operation',
        table: 'EventStore',
        operation: 'DELETE',
        file: file
      });
    }
  }
}

// Scan query-dashboard for HTTP calls
function scanQueryDashboard() {
  const queryDashboardPath = path.join(__dirname, '../packages/query-dashboard/src');
  
  if (!fs.existsSync(queryDashboardPath)) {
    return;
  }
  
  const files = getAllFiles(queryDashboardPath);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Detect HTTP calls
    if (content.includes('http://') || content.includes('https://')) {
      if (content.includes('command-service') || content.includes('command_service')) {
        serviceGraph.calls.push({
          type: 'service_call',
          source: 'query_dashboard',
          target: 'command_service',
          protocol: 'http',
          file: file
        });
      }
    }
    
    // Detect API endpoints
    if (content.includes('/api/queries/temporal/')) {
      const hasRateLimit = content.includes('rateLimit') || content.includes('rate_limit');
      serviceGraph.apiEndpoints.push({
        type: 'api_endpoint',
        path: '/api/queries/temporal/',
        rateLimit: hasRateLimit ? 10 : 0,
        file: file
      });
    }
  }
}

// Scan for registered schemas
function scanSchemas() {
  const schemasPath = path.join(__dirname, '../schemas');
  
  if (!fs.existsSync(schemasPath)) {
    return;
  }
  
  const files = fs.readdirSync(schemasPath);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const schemaName = file.replace('.json', '');
      serviceGraph.registeredSchemas[schemaName] = true;
    }
  }
}

function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Run scans
scanCommandService();
scanQueryDashboard();
scanSchemas();

// Output as JSON
console.log(JSON.stringify(serviceGraph, null, 2));
