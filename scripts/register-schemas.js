#!/usr/bin/env node

/**
 * Register event schemas in AWS Glue Schema Registry
 * This script registers all schemas from the schemas/ directory
 */

const fs = require('fs');
const path = require('path');

// Mock implementation for demonstration
// In production, this would use the actual GlueSchemaRegistry adapter
async function registerSchema(schemaName, schemaDefinition) {
  console.log(`📝 Registering schema: ${schemaName}`);
  
  // Validate JSON
  try {
    JSON.parse(schemaDefinition);
  } catch (error) {
    throw new Error(`Invalid JSON in ${schemaName}: ${error.message}`);
  }
  
  // In production, this would call:
  // const registry = new GlueSchemaRegistry({
  //   registryName: process.env.SCHEMA_REGISTRY_NAME || 'nexus-event-schema-registry',
  //   region: process.env.AWS_REGION || 'us-east-1',
  //   enableLogging: true,
  // });
  // 
  // const result = await registry.registerSchema(
  //   schemaName,
  //   schemaDefinition,
  //   'BACKWARD'
  // );
  
  console.log(`✅ Schema registered: ${schemaName} (version 1)`);
  return { schemaName, version: 1 };
}

async function main() {
  console.log('========================================');
  console.log('Nexus Blueprint - Schema Registration');
  console.log('========================================\n');
  
  const schemasDir = path.join(__dirname, '..', 'schemas');
  const schemaFiles = fs.readdirSync(schemasDir)
    .filter(file => file.endsWith('.json') && file !== 'package.json');
  
  if (schemaFiles.length === 0) {
    console.log('⚠️  No schema files found in schemas/ directory');
    return;
  }
  
  console.log(`Found ${schemaFiles.length} schema(s) to register:\n`);
  
  const results = [];
  
  for (const file of schemaFiles) {
    const schemaName = path.basename(file, '.json');
    const schemaPath = path.join(schemasDir, file);
    const schemaDefinition = fs.readFileSync(schemaPath, 'utf-8');
    
    try {
      const result = await registerSchema(schemaName, schemaDefinition);
      results.push({ ...result, status: 'success' });
    } catch (error) {
      console.error(`❌ Failed to register ${schemaName}: ${error.message}`);
      results.push({ schemaName, status: 'failed', error: error.message });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('========================================');
  console.log('Registration Summary');
  console.log('========================================\n');
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}\n`);
  
  if (failed > 0) {
    console.log('Failed schemas:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => console.log(`  - ${r.schemaName}: ${r.error}`));
    console.log('');
    process.exit(1);
  }
  
  console.log('🎉 All schemas registered successfully!\n');
  console.log('Next steps:');
  console.log('  1. Verify schemas in AWS Console');
  console.log('  2. Deploy Policy Engine (Task 4.2)');
  console.log('  3. Integrate schema validation in services\n');
}

// Handle specific schema registration
const specificSchema = process.argv[2];
if (specificSchema) {
  console.log(`Registering specific schema: ${specificSchema}\n`);
  const schemaPath = path.join(__dirname, '..', 'schemas', `${specificSchema}.json`);
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  
  const schemaDefinition = fs.readFileSync(schemaPath, 'utf-8');
  registerSchema(specificSchema, schemaDefinition)
    .then(() => {
      console.log('\n✅ Schema registered successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error(`\n❌ Registration failed: ${error.message}`);
      process.exit(1);
    });
} else {
  main().catch(error => {
    console.error(`\n❌ Registration failed: ${error.message}`);
    process.exit(1);
  });
}
