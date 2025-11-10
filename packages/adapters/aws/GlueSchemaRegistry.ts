import { 
  GlueClient, 
  GetSchemaCommand, 
  RegisterSchemaVersionCommand, 
  CreateSchemaCommand,
  GetSchemaVersionCommand,
  ListSchemaVersionsCommand
} from '@aws-sdk/client-glue';
import { DomainEvent, SchemaRegistryPort, SchemaVersion, ValidationResult, CompatibilityResult, CompatibilityMode } from '@nexus/shared';

export interface GlueSchemaRegistryConfig {
  registryName: string;
  region: string;
  enableLogging?: boolean;
}

/**
 * AWS Glue implementation of SchemaRegistryPort
 * Provides schema governance with BACKWARD compatibility enforcement
 */
export class GlueSchemaRegistry implements SchemaRegistryPort {
  private readonly client: GlueClient;
  private readonly registryName: string;
  private readonly enableLogging: boolean;
  private readonly schemaCache: Map<string, { schema: string; timestamp: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(config: GlueSchemaRegistryConfig) {
    this.client = new GlueClient({ region: config.region });
    this.registryName = config.registryName;
    this.enableLogging = config.enableLogging ?? false;
    this.schemaCache = new Map();
    
    if (this.enableLogging) {
      console.log(`[GlueSchemaRegistry] Initialized with registry: ${this.registryName}`);
    }
  }

  private log(message: string, data?: any): void {
    if (this.enableLogging) {
      console.log(`[GlueSchemaRegistry] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  private logError(message: string, error: any): void {
    console.error(`[GlueSchemaRegistry] ERROR: ${message}`, error);
  }

  async registerSchema(
    schemaName: string,
    schemaDefinition: string,
    compatibilityMode: CompatibilityMode = 'BACKWARD'
  ): Promise<SchemaVersion> {
    this.log(`Registering schema: ${schemaName}`, { compatibilityMode });
    
    try {
      // Validate JSON schema format
      JSON.parse(schemaDefinition);
      
      // Try to create new schema
      const createResponse = await this.client.send(
        new CreateSchemaCommand({
          RegistryId: { RegistryName: this.registryName },
          SchemaName: schemaName,
          DataFormat: 'JSON',
          Compatibility: compatibilityMode,
          SchemaDefinition: schemaDefinition,
          Description: `Event schema for ${schemaName}`,
        })
      );

      this.log(`Schema created successfully: ${schemaName}`, {
        version: 1,
        schemaArn: createResponse.SchemaArn,
      });

      // Invalidate cache
      this.schemaCache.delete(schemaName);

      return {
        schemaName,
        version: 1,
        schemaArn: createResponse.SchemaArn!,
        versionId: createResponse.SchemaVersionId!,
      };
    } catch (error: any) {
      if (error.name === 'AlreadyExistsException') {
        this.log(`Schema exists, registering new version: ${schemaName}`);
        
        // Check compatibility before registering
        const compatibilityCheck = await this.checkCompatibility(schemaName, schemaDefinition);
        if (!compatibilityCheck.compatible) {
          this.logError(`Compatibility check failed for ${schemaName}`, compatibilityCheck.violations);
          throw new Error(
            `Schema ${schemaName} is not compatible: ${compatibilityCheck.violations.join(', ')}`
          );
        }

        // Register new version
        const registerResponse = await this.client.send(
          new RegisterSchemaVersionCommand({
            SchemaId: {
              RegistryName: this.registryName,
              SchemaName: schemaName,
            },
            SchemaDefinition: schemaDefinition,
          })
        );

        this.log(`New schema version registered: ${schemaName}`, {
          version: registerResponse.VersionNumber,
          versionId: registerResponse.SchemaVersionId,
        });

        // Invalidate cache
        this.schemaCache.delete(schemaName);

        return {
          schemaName,
          version: registerResponse.VersionNumber!,
          schemaArn: registerResponse.SchemaArn!,
          versionId: registerResponse.SchemaVersionId!,
        };
      }
      
      this.logError(`Failed to register schema: ${schemaName}`, error);
      throw new Error(`Schema registration failed: ${error.message}`);
    }
  }

  async validate(event: DomainEvent): Promise<ValidationResult> {
    const schemaName = event.eventType;
    this.log(`Validating event: ${schemaName}`);
    
    try {
      // Get the registered schema
      const schemaDefinition = await this.getSchema(schemaName);
      const schema = JSON.parse(schemaDefinition);
      
      // Validate event payload against schema
      const errors: string[] = [];
      
      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in event.payload)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }
      
      // Check field types
      if (schema.properties) {
        for (const [field, value] of Object.entries(event.payload)) {
          if (schema.properties[field]) {
            const expectedType = schema.properties[field].type;
            const actualType = typeof value;
            
            // Map JS types to JSON schema types
            const typeMap: Record<string, string> = {
              'string': 'string',
              'number': 'number',
              'boolean': 'boolean',
              'object': 'object',
            };
            
            if (expectedType && typeMap[actualType] !== expectedType) {
              errors.push(`Field '${field}' has wrong type: expected ${expectedType}, got ${actualType}`);
            }
          }
        }
      }
      
      const valid = errors.length === 0;
      
      if (!valid) {
        this.logError(`Validation failed for ${schemaName}`, errors);
      } else {
        this.log(`Validation successful for ${schemaName}`);
      }
      
      return {
        valid,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      this.logError(`Validation error for ${schemaName}`, error);
      return {
        valid: false,
        errors: [`Schema validation failed: ${error.message}`],
      };
    }
  }

  async getSchema(schemaName: string, version?: number): Promise<string> {
    // Check cache first
    const cacheKey = version ? `${schemaName}:${version}` : schemaName;
    const cached = this.schemaCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.log(`Cache hit for schema: ${cacheKey}`);
      return cached.schema;
    }

    this.log(`Fetching schema: ${schemaName}`, { version });
    
    try {
      if (version) {
        // Get specific version
        const response = await this.client.send(
          new GetSchemaVersionCommand({
            SchemaId: {
              RegistryName: this.registryName,
              SchemaName: schemaName,
            },
            SchemaVersionNumber: {
              VersionNumber: version,
            },
          })
        );
        
        const schemaDefinition = response.SchemaDefinition!;
        this.schemaCache.set(cacheKey, { schema: schemaDefinition, timestamp: Date.now() });
        return schemaDefinition;
      } else {
        // Get latest version
        const response = await this.client.send(
          new GetSchemaCommand({
            SchemaId: {
              RegistryName: this.registryName,
              SchemaName: schemaName,
            },
          })
        );
        
        const schemaDefinition = response.SchemaDefinition!;
        this.schemaCache.set(cacheKey, { schema: schemaDefinition, timestamp: Date.now() });
        return schemaDefinition;
      }
    } catch (error: any) {
      this.logError(`Failed to get schema: ${schemaName}`, error);
      throw new Error(`Schema retrieval failed: ${error.message}`);
    }
  }

  async checkCompatibility(
    schemaName: string,
    newSchema: string
  ): Promise<CompatibilityResult> {
    this.log(`Checking compatibility for schema: ${schemaName}`);
    
    try {
      const currentSchema = await this.getSchema(schemaName);
      const current = JSON.parse(currentSchema);
      const proposed = JSON.parse(newSchema);

      const violations: string[] = [];

      // BACKWARD compatibility checks:
      // 1. Cannot remove fields
      for (const field of Object.keys(current.properties || {})) {
        if (!proposed.properties || !proposed.properties[field]) {
          violations.push(`BREAKING: Field '${field}' was removed`);
        }
      }

      // 2. Cannot change field types
      for (const field of Object.keys(current.properties || {})) {
        if (proposed.properties && proposed.properties[field]) {
          const currentType = current.properties[field].type;
          const proposedType = proposed.properties[field].type;
          if (currentType !== proposedType) {
            violations.push(
              `BREAKING: Field '${field}' type changed from ${currentType} to ${proposedType}`
            );
          }
        }
      }

      // 3. Cannot make existing optional fields required
      const currentRequired = current.required || [];
      const proposedRequired = proposed.required || [];
      for (const field of proposedRequired) {
        if (!currentRequired.includes(field) && current.properties && current.properties[field]) {
          violations.push(`BREAKING: Existing field '${field}' made required`);
        }
      }

      // 4. Cannot rename fields (detected as remove + add)
      const currentFields = new Set(Object.keys(current.properties || {}));
      const proposedFields = new Set(Object.keys(proposed.properties || {}));
      const removedFields = [...currentFields].filter(f => !proposedFields.has(f));
      const addedFields = [...proposedFields].filter(f => !currentFields.has(f));
      
      if (removedFields.length > 0 && addedFields.length > 0) {
        violations.push(
          `POTENTIAL BREAKING: Fields removed [${removedFields.join(', ')}] and added [${addedFields.join(', ')}]. This may indicate a rename.`
        );
      }

      const compatible = violations.length === 0;
      
      if (!compatible) {
        this.logError(`Compatibility check failed for ${schemaName}`, violations);
      } else {
        this.log(`Compatibility check passed for ${schemaName}`);
      }

      return {
        compatible,
        violations,
      };
    } catch (error: any) {
      if (error.message.includes('Schema retrieval failed')) {
        // Schema doesn't exist yet, so it's compatible (first version)
        this.log(`Schema ${schemaName} doesn't exist yet, allowing registration`);
        return {
          compatible: true,
          violations: [],
        };
      }
      
      this.logError(`Compatibility check error for ${schemaName}`, error);
      return {
        compatible: false,
        violations: [`Compatibility check failed: ${error.message}`],
      };
    }
  }

  /**
   * List all versions of a schema
   */
  async listSchemaVersions(schemaName: string): Promise<SchemaVersion[]> {
    this.log(`Listing versions for schema: ${schemaName}`);
    
    try {
      const response = await this.client.send(
        new ListSchemaVersionsCommand({
          SchemaId: {
            RegistryName: this.registryName,
            SchemaName: schemaName,
          },
        })
      );

      return (response.Schemas || []).map((s: any) => ({
        schemaName,
        version: s.VersionNumber!,
        schemaArn: s.SchemaArn,
        versionId: s.SchemaVersionId!,
      }));
    } catch (error: any) {
      this.logError(`Failed to list schema versions: ${schemaName}`, error);
      throw new Error(`Schema version listing failed: ${error.message}`);
    }
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.log('Clearing schema cache');
    this.schemaCache.clear();
  }
}
