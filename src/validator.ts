import type { JsonValue, ParserOptions, ValidationError, ValidationResult } from './types';
import { ToonParser } from './parser';

/**
 * TOON Validator for detailed validation with error reporting
 */
export class ToonValidator {
  private parser: ToonParser;

  constructor(options: ParserOptions = {}) {
    this.parser = new ToonParser(options);
  }

  /**
   * Validate TOON content with detailed error reporting
   * @param content - The TOON content to validate
   * @returns Validation result with errors if any
   */
  validate(content: string): ValidationResult {
    try {
      const value = this.parser.parse(content);
      return {
        valid: true,
        errors: [],
        value,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [this.parseError(error as Error, content)],
      };
    }
  }

  /**
   * Check if content is valid (boolean result)
   * @param content - The TOON content to check
   * @returns True if valid, false otherwise
   */
  isValid(content: string): boolean {
    return this.validate(content).valid;
  }

  /**
   * Validate and throw if invalid
   * @param content - The TOON content to validate
   * @returns Parsed value
   * @throws Error with detailed validation message
   */
  validateOrThrow(content: string): JsonValue {
    const result = this.validate(content);
    if (!result.valid) {
      const error = result.errors[0];
      throw new Error(
        `Validation failed at line ${error.line}: ${error.message}`
      );
    }
    return result.value!;
  }

  /**
   * Parse error into structured validation error
   */
  private parseError(error: Error, content: string): ValidationError {
    const message = error.message;
    
    // Try to extract line number from error message
    const lineMatch = message.match(/line (\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

    // Extract error code from message patterns
    const code = this.extractErrorCode(message);

    // Get context (the line where error occurred)
    const lines = content.split('\n');
    const context = lines[line - 1] || '';

    return {
      line,
      message,
      code,
      context,
    };
  }

  /**
   * Extract error code from error message
   */
  private extractErrorCode(message: string): string {
    if (message.includes('length mismatch')) return 'ARRAY_LENGTH_MISMATCH';
    if (message.includes('multiple of')) return 'INVALID_INDENTATION';
    if (message.includes('Tabs not allowed')) return 'TAB_IN_INDENTATION';
    if (message.includes('Invalid escape')) return 'INVALID_ESCAPE';
    if (message.includes('Duplicate key')) return 'DUPLICATE_KEY';
    if (message.includes('width mismatch')) return 'TABULAR_WIDTH_MISMATCH';
    if (message.includes('Expected array')) return 'EXPECTED_ARRAY';
    if (message.includes('Invalid array')) return 'INVALID_ARRAY';
    return 'PARSE_ERROR';
  }

  /**
   * Validate multiple TOON documents
   * @param documents - Array of TOON content strings
   * @returns Array of validation results
   */
  validateBatch(documents: string[]): ValidationResult[] {
    return documents.map((doc) => this.validate(doc));
  }

  /**
   * Get a human-readable validation report
   * @param content - The TOON content to validate
   * @returns Formatted validation report
   */
  getValidationReport(content: string): string {
    const result = this.validate(content);

    if (result.valid) {
      return '✓ Valid TOON document';
    }

    const lines = ['✗ Invalid TOON document\n'];
    
    for (const error of result.errors) {
      lines.push(`Error at line ${error.line}:`);
      lines.push(`  Code: ${error.code}`);
      lines.push(`  Message: ${error.message}`);
      if (error.context) {
        lines.push(`  Context: ${error.context.trim()}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
