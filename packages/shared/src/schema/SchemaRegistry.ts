import { 
  SchemaRegistryPort, 
  CompatibilityMode, 
  SchemaVersion, 
  ValidationResult, 
  CompatibilityResult 
} from '../ports/SchemaRegistryPort';
import { DomainEvent } from '../types';

/**
 * SchemaRegistry client class
 * Provides a simplified facade over the SchemaRegistryPort adapter
 * Delegates to the configured adapter (AWS Glue, Confluent, etc.)
 */
export class SchemaRegistry implements SchemaRegistryPort {
  private readonly adapter: SchemaRegistryPort;

  constructor(adapter: SchemaRegistryPort) {
    this.adapter = adapter;
  }

  /**
   * Register a new schema or schema version
   * Validates compatibility before registration
   */
  async registerSchema(
    schemaName: string,
    schemaDefinition: string,
    compatibilityMode: CompatibilityMode = 'BACKWARD'
  ): Promise<SchemaVersion> {
    return this.adapter.registerSchema(schemaName, schemaDefinition, compatibilityMode);
  }

  /**
   * Validate an event against its registered schema
   * Returns detailed validation errors if invalid
   */
  async validate(event: DomainEvent): Promise<ValidationResult> {
    return this.adapter.validate(event);
  }

  /**
   * Get schema by name and optional version
   * Returns the schema definition as a JSON string
   */
  async getSchema(schemaName: string, version?: number): Promise<string> {
    return this.adapter.getSchema(schemaName, version);
  }

  /**
   * Check if a new schema is compatible with existing versions
   * Returns compatibility result with detailed violations
   */
  async checkCompatibility(
    schemaName: string,
    newSchema: string
  ): Promise<CompatibilityResult> {
    return this.adapter.checkCompatibility(schemaName, newSchema);
  }

  /**
   * Validate event and throw error if invalid
   * Convenience method for fail-fast validation
   */
  async validateOrThrow(event: DomainEvent): Promise<void> {
    const result = await this.validate(event);
    if (!result.valid) {
      throw new SchemaValidationError(
        `Event validation failed for ${event.eventType}`,
        result.errors || []
      );
    }
  }

  /**
   * Check compatibility and throw error if incompatible
   * Convenience method for fail-fast compatibility checks
   */
  async checkCompatibilityOrThrow(
    schemaName: string,
    newSchema: string
  ): Promise<void> {
    const result = await this.checkCompatibility(schemaName, newSchema);
    if (!result.compatible) {
      throw new SchemaCompatibilityError(
        `Schema ${schemaName} is not compatible`,
        result.violations
      );
    }
  }
}

/**
 * Schema validation error
 */
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Schema compatibility error
 */
export class SchemaCompatibilityError extends Error {
  constructor(
    message: string,
    public readonly violations: string[]
  ) {
    super(message);
    this.name = 'SchemaCompatibilityError';
  }
}
