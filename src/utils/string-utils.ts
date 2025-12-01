import type { Delimiter, JsonPrimitive } from '../types';

/**
 * Cached regex patterns for performance
 */
export const LEADING_ZEROS_REGEX = /^0\d+$/;
export const NUMBER_REGEX = /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i;
export const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
export const KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_.]*$/;

/**
 * Unescape a TOON string value
 * Only \, ", \n, \r, \t are valid escape sequences
 */
export function unescapeString(str: string, strict: boolean = true): string {
  // Fast path: no escapes
  if (!str.includes('\\')) {
    return str;
  }

  const parts: string[] = [];
  let lastIdx = 0;
  let i = 0;

  while (i < str.length) {
    if (str[i] === '\\' && i + 1 < str.length) {
      // Add everything before the escape
      if (i > lastIdx) {
        parts.push(str.slice(lastIdx, i));
      }

      const next = str[i + 1];
      switch (next) {
        case '\\':
          parts.push('\\');
          break;
        case '"':
          parts.push('"');
          break;
        case 'n':
          parts.push('\n');
          break;
        case 'r':
          parts.push('\r');
          break;
        case 't':
          parts.push('\t');
          break;
        default:
          if (strict) {
            throw new Error(`Invalid escape sequence: \\${next}`);
          }
          parts.push('\\', next);
      }
      i += 2;
      lastIdx = i;
    } else {
      i++;
    }
  }

  // Add remaining part
  if (lastIdx < str.length) {
    parts.push(str.slice(lastIdx));
  }

  return parts.join('');
}

/**
 * Parse a key (handles quoted keys)
 */
export function parseKey(key: string): string {
  if (key.startsWith('"') && key.endsWith('"')) {
    return unescapeString(key.slice(1, -1));
  }
  return key;
}

/**
 * Parse a primitive value from a string
 */
export function parsePrimitive(value: string): JsonPrimitive {
  const trimmed = value.trim();

  // Quoted string
  if (trimmed.charCodeAt(0) === 34 && trimmed.charCodeAt(trimmed.length - 1) === 34) {
    return unescapeString(trimmed.slice(1, -1));
  }

  // Boolean/null - use length check first for early exit
  switch (trimmed.length) {
    case 4:
      if (trimmed === 'true') return true;
      if (trimmed === 'null') return null;
      break;
    case 5:
      if (trimmed === 'false') return false;
      break;
  }

  // Number (check for leading zeros - those are strings)
  if (LEADING_ZEROS_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Try to parse as number
  if (NUMBER_REGEX.test(trimmed)) {
    const num = Number(trimmed);
    if (isFinite(num)) {
      return num;
    }
  }

  // Otherwise it's an unquoted string
  return trimmed;
}

/**
 * Split a string by delimiter, respecting quotes
 */
export function splitDelimited(str: string, delimiter: Delimiter): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if (char === '\\' && i + 1 < str.length) {
      current += char + str[i + 1];
      i += 2;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      i++;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      result.push(current);
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  result.push(current);
  return result;
}

/**
 * Find the first unquoted colon in a string
 */
export function findUnquotedColon(str: string): number {
  let inQuotes = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ':') {
      return i;
    }
  }

  return -1;
}

/**
 * Check if a string is a valid identifier segment
 */
export function isIdentifierSegments(key: string): boolean {
  const segments = key.split('.');
  for (let i = 0; i < segments.length; i++) {
    if (!IDENTIFIER_REGEX.test(segments[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Escape a string for TOON encoding
 */
export function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Check if a string needs quoting
 */
export function needsQuoting(value: string, delimiter: Delimiter): boolean {
  if (value.length === 0 || value !== value.trim()) {
    return true;
  }

  // Check reserved keywords
  switch (value) {
    case 'true':
    case 'false':
    case 'null':
    case '-':
      return true;
  }

  // Check for number-like strings
  if (NUMBER_REGEX.test(value) || LEADING_ZEROS_REGEX.test(value)) {
    return true;
  }

  if (value.charCodeAt(0) === 45) { // starts with '-'
    return true;
  }

  // Check for special characters
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (
      code === 58 || // ':'
      code === 34 || // '"'
      code === 92 || // '\\'
      code === 91 || // '['
      code === 93 || // ']'
      code === 123 || // '{'
      code === 125 || // '}'
      code === 10 || // '\n'
      code === 13 || // '\r'
      code === 9 || // '\t'
      value[i] === delimiter
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Quote and escape a string if needed
 */
export function quoteString(value: string, delimiter: Delimiter): string {
  if (!needsQuoting(value, delimiter)) {
    return value;
  }
  return `"${escapeString(value)}"`;
}

/**
 * Encode a key (quote if needed)
 */
export function encodeKey(key: string, delimiter: Delimiter): string {
  if (KEY_REGEX.test(key)) {
    return key;
  }
  return quoteString(key, delimiter);
}

/**
 * Convert number to canonical format (no exponents, no trailing zeros)
 */
export function canonicalNumber(n: number): string {
  if (!isFinite(n)) {
    return 'null';
  }
  if (Object.is(n, -0)) {
    n = 0;
  }
  const str = n.toString();
  if (str.includes('e')) {
    // Expand exponential notation
    return n.toFixed(20).replace(/\.?0+$/, '');
  }
  // Remove trailing zeros from decimal
  return str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
