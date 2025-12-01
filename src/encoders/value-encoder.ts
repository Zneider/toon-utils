import type { JsonValue, JsonObject, JsonArray, Delimiter } from '../types';
import { canonicalNumber, quoteString, encodeKey } from '../utils/string-utils';
import { indent } from '../utils/parse-utils';

/**
 * Check if a value is a primitive
 */
export function isPrimitive(value: JsonValue): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Encode a primitive value
 */
export function encodePrimitiveValue(
  value: string | number | boolean | null,
  delimiter: Delimiter,
): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') {
    if (!isFinite(value)) return 'null';
    if (Object.is(value, -0)) return '0';
    return canonicalNumber(value);
  }
  return quoteString(value, delimiter);
}

/**
 * Build array header string
 */
export function arrayHeader(
  key: string | undefined,
  length: number,
  delimiter: Delimiter,
  fields?: string[],
): string {
  const delimSymbol = delimiter === ',' ? '' : delimiter;
  const bracket = `[${length}${delimSymbol}]`;
  const fieldsStr = fields
    ? `{${fields.map((f) => encodeKey(f, delimiter)).join(delimiter)}}`
    : '';
  const keyStr = key ? `${encodeKey(key, delimiter)}` : '';
  return `${keyStr}${bracket}${fieldsStr}:`;
}

/**
 * Check if array can be encoded in tabular format
 * Returns field names if tabular, null otherwise
 */
export function checkTabular(value: JsonArray): string[] | null {
  if (value.length === 0) return null;
  if (!value.every((v) => typeof v === 'object' && v !== null && !Array.isArray(v)))
    return null;

  const objects = value as JsonObject[];
  const firstKeys = Object.keys(objects[0]).sort();

  // Check all objects have same keys and all values are primitives
  for (const obj of objects) {
    const keys = Object.keys(obj).sort();
    if (keys.length !== firstKeys.length) return null;
    if (!keys.every((k, i) => k === firstKeys[i])) return null;
    if (!Object.values(obj).every((v) => isPrimitive(v))) return null;
  }

  return Object.keys(objects[0]); // Return in encounter order
}

/**
 * Encode primitive value with indentation
 */
export function encodePrimitive(
  value: boolean | null,
  depth: number,
  indentSize: number,
  delimiter: Delimiter,
  key?: string,
): string[] {
  const indentation = indent(depth, indentSize);
  const strValue = String(value);
  if (key) {
    return [`${indentation}${encodeKey(key, delimiter)}: ${strValue}`];
  }
  return [`${indentation}${strValue}`];
}

/**
 * Encode number value with indentation
 */
export function encodeNumber(
  value: number,
  depth: number,
  indentSize: number,
  delimiter: Delimiter,
  key?: string,
): string[] {
  if (!isFinite(value)) {
    return encodePrimitive(null, depth, indentSize, delimiter, key);
  }
  if (Object.is(value, -0)) {
    value = 0;
  }
  const strValue = canonicalNumber(value);
  const indentation = indent(depth, indentSize);
  if (key) {
    return [`${indentation}${encodeKey(key, delimiter)}: ${strValue}`];
  }
  return [`${indentation}${strValue}`];
}

/**
 * Encode string value with indentation
 */
export function encodeString(
  value: string,
  depth: number,
  indentSize: number,
  delimiter: Delimiter,
  key?: string,
): string[] {
  const quoted = quoteString(value, delimiter);
  const indentation = indent(depth, indentSize);
  if (key) {
    return [`${indentation}${encodeKey(key, delimiter)}: ${quoted}`];
  }
  return [`${indentation}${quoted}`];
}
