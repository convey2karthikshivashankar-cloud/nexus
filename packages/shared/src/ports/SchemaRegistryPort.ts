import { DomainEvent } from '../types';

/**
 * Vendor-neutral Schema Registry interface
 * Implementations: AWS Glue, Confluent Schema Registry, Azure Schema Registry
 */
export interface SchemaRegistryPort {
  /**
   * Register a new schema or schema version
   */
  registerSchema(
    schemaName: string,
    schemaDefinition: string,
    compatibilityMode: CompatibilityMode
  ): Promise<SchemaVersion>;

  /**
   * Validate an event against its registered schema
   */
  validate(event: DomainEvent): Promise<ValidationResult>;

  /**
   * Get schema by name and optional version
   */
  getSchema(schemaName: string, version?: number): Promise<string>;

  /**
   * Check if a new schema is compatible with existing versions
   */
  checkCompatibility(
    schemaName: string,
    newSchema: string
  ): Promise<CompatibilityResult>;
}

export type CompatibilityMode = 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';

export interface SchemaVersion {
  schemaName: string;
  version: number;
  schemaArn?: string;
  versionId: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface CompatibilityResult {
  compatible: boolean;
  violations: string[];
}
