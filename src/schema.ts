import type { JsonValue, JsonObject } from './types';

/**
 * Schema validation types
 */
export type SchemaType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'null' 
  | 'array' 
  | 'object'
  | string[]; // Union types

export interface SchemaField {
  type: SchemaType;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: (string | number | boolean)[];
  items?: SchemaField;
  properties?: Schema;
  custom?: (value: unknown) => boolean | string;
}

export type Schema = Record<string, SchemaField>;

export interface SchemaValidationError {
  path: string;
  message: string;
  expected?: string;
  received?: unknown;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

/**
 * Schema validator for TOON data
 */
export class SchemaValidator {
  /**
   * Validate a value against a schema
   */
  validate(value: JsonValue, schema: Schema): SchemaValidationResult {
    const errors: SchemaValidationError[] = [];
    
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push({
        path: '$',
        message: 'Root value must be an object',
        expected: 'object',
        received: value,
      });
      return { valid: false, errors };
    }

    this.validateObject(value, schema, '$', errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateObject(
    obj: JsonObject,
    schema: Schema,
    path: string,
    errors: SchemaValidationError[]
  ): void {
    // Check required fields
    for (const [key, field] of Object.entries(schema)) {
      if (field.required && !(key in obj)) {
        errors.push({
          path: `${path}.${key}`,
          message: `Required field '${key}' is missing`,
          expected: String(field.type),
        });
      }
    }

    // Validate existing fields
    for (const [key, value] of Object.entries(obj)) {
      const field = schema[key];
      const fieldPath = `${path}.${key}`;

      if (!field) {
        // Unknown field - could be allowed or not depending on strict mode
        continue;
      }

      this.validateField(value, field, fieldPath, errors);
    }
  }

  private validateField(
    value: unknown,
    field: SchemaField,
    path: string,
    errors: SchemaValidationError[]
  ): void {
    // Type validation
    if (!this.validateType(value, field.type)) {
      errors.push({
        path,
        message: `Type mismatch`,
        expected: Array.isArray(field.type) ? field.type.join(' | ') : field.type,
        received: this.getType(value),
      });
      return; // Don't validate further if type is wrong
    }

    // String validations
    if (typeof value === 'string') {
      if (field.minLength !== undefined && value.length < field.minLength) {
        errors.push({
          path,
          message: `String length ${value.length} is less than minimum ${field.minLength}`,
        });
      }
      if (field.maxLength !== undefined && value.length > field.maxLength) {
        errors.push({
          path,
          message: `String length ${value.length} exceeds maximum ${field.maxLength}`,
        });
      }
      if (field.pattern && !field.pattern.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern ${field.pattern}`,
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        errors.push({
          path,
          message: `Value ${value} is less than minimum ${field.min}`,
        });
      }
      if (field.max !== undefined && value > field.max) {
        errors.push({
          path,
          message: `Value ${value} exceeds maximum ${field.max}`,
        });
      }
    }

    // Enum validation
    if (field.enum && !field.enum.includes(value as string | number | boolean)) {
      errors.push({
        path,
        message: `Value not in allowed set`,
        expected: field.enum.join(', '),
        received: value,
      });
    }

    // Array validation
    if (Array.isArray(value) && field.items) {
      value.forEach((item, index) => {
        if (field.items?.type === 'object' && field.items.properties) {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            this.validateObject(item as JsonObject, field.items.properties, `${path}[${index}]`, errors);
          }
        }
      });
    }

    // Object validation
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && field.properties) {
      this.validateObject(value as JsonObject, field.properties, path, errors);
    }

    // Custom validation
    if (field.custom) {
      const customResult = field.custom(value);
      if (typeof customResult === 'string') {
        errors.push({
          path,
          message: customResult,
        });
      } else if (customResult === false) {
        errors.push({
          path,
          message: 'Custom validation failed',
        });
      }
    }
  }

  private validateType(value: unknown, type: SchemaType): boolean {
    if (Array.isArray(type)) {
      // Union type
      return type.some(t => this.validateType(value, t as SchemaType));
    }

    const actualType = this.getType(value);
    return actualType === type;
  }

  private getType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}
