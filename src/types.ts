/**
 * Type definitions for TOON parser
 * TOON (Token-Oriented Object Notation) encodes the JSON data model
 */

// JSON-compatible value types
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Parser options
export interface ParserOptions {
  /**
   * Indentation size in spaces (default: 2)
   */
  indentSize?: number;

  /**
   * Enable strict mode validation (default: true)
   * - Enforces array length counts
   * - Validates indentation multiples
   * - Rejects invalid escapes
   * - Checks delimiter consistency
   */
  strict?: boolean;

  /**
   * Path expansion mode (default: "off")
   * - "off": Treat dotted keys as literals
   * - "safe": Expand eligible dotted keys into nested objects
   */
  expandPaths?: 'off' | 'safe';
}

// Encoder options
export interface EncoderOptions {
  /**
   * Indentation size in spaces (default: 2)
   */
  indentSize?: number;

  /**
   * Document delimiter for object field values (default: comma)
   */
  delimiter?: ',' | '\t' | '|';

  /**
   * Key folding mode (default: "off")
   * - "off": No folding, standard nesting
   * - "safe": Fold eligible single-key object chains
   */
  keyFolding?: 'off' | 'safe';

  /**
   * Maximum folding depth when keyFolding is "safe" (default: Infinity)
   */
  flattenDepth?: number;

  /**
   * Line ending style (default: "\n")
   * - "\n": Unix/Mac style (LF)
   * - "\r\n": Windows style (CRLF)
   */
  lineEnding?: '\n' | '\r\n';

  /**
   * Sort object keys alphabetically (default: false)
   */
  sortKeys?: boolean;

  /**
   * Add trailing newline to output (default: false)
   */
  trailingNewline?: boolean;

  /**
   * Maximum line length before wrapping (default: Infinity)
   * When exceeded, arrays and objects will be formatted on multiple lines
   */
  maxLineLength?: number;

  /**
   * Compact mode - minimize whitespace (default: false)
   */
  compact?: boolean;

  /**
   * Preserve key order from input (default: true)
   */
  preserveKeyOrder?: boolean;
}

// Internal types for parsing
export type Delimiter = ',' | '\t' | '|';

export interface ArrayHeader {
  key?: string;
  length: number;
  delimiter: Delimiter;
  fields?: string[];
}

// Validation types
export interface ValidationError {
  /** Line number where the error occurred (1-indexed) */
  line: number;
  /** Column number where the error occurred (1-indexed) */
  column?: number;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Context around the error */
  context?: string;
}

export interface ValidationResult {
  /** Whether the content is valid */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
  /** Parsed value if valid */
  value?: JsonValue;
}
