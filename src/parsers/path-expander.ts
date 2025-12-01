import type { JsonValue, JsonObject } from '../types';
import { isIdentifierSegments } from '../utils/string-utils';

/**
 * Expand dotted keys into nested objects
 */
export function expandPaths(value: JsonValue, strict: boolean): JsonValue {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => expandPaths(v, strict));
  }

  const result: JsonObject = {};

  for (const [key, val] of Object.entries(value)) {
    if (key.includes('.') && isIdentifierSegments(key)) {
      const segments = key.split('.');
      let current = result;

      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (!(segment in current)) {
          current[segment] = {};
        } else if (typeof current[segment] !== 'object' || current[segment] === null) {
          if (strict) {
            throw new Error(
              `Expansion conflict at path '${segments.slice(0, i + 1).join('.')}' (object vs ${typeof current[segment]})`,
            );
          }
          // LWW: overwrite
          current[segment] = {};
        }
        current = current[segment] as JsonObject;
      }

      const lastSegment = segments[segments.length - 1];
      const expandedValue = expandPaths(val, strict);

      if (lastSegment in current) {
        if (strict) {
          throw new Error(
            `Expansion conflict at path '${key}' (duplicate key)`,
          );
        }
        // LWW: overwrite
      }

      current[lastSegment] = expandedValue;
    } else {
      result[key] = expandPaths(val, strict);
    }
  }

  return result;
}
