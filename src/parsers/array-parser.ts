import type { JsonArray, JsonObject, JsonValue, ArrayHeader } from '../types';
import { parsePrimitive, splitDelimited, findUnquotedColon, parseKey } from '../utils/string-utils';
import { parseArrayHeader } from '../utils/parse-utils';

interface ParsedLine {
  content: string;
  depth: number;
  raw: string;
}

/**
 * Parse an object from lines
 */
export function parseObject(
  lines: ParsedLine[],
  startIdx: number,
  currentDepth: number,
  strict: boolean,
): { value: JsonObject; nextIdx: number } {
  const obj: JsonObject = {};
  let idx = startIdx;

  while (idx < lines.length) {
    const line = lines[idx];

    if (line.depth < currentDepth) {
      break;
    }

    if (line.depth > currentDepth) {
      idx++;
      continue;
    }

    // Parse key-value or nested structure
    const colonIdx = findUnquotedColon(line.content);
    if (colonIdx === -1) {
      if (strict) {
        throw new Error(`Missing colon after key at line ${idx + 1}`);
      }
      idx++;
      continue;
    }

    const keyPart = line.content.slice(0, colonIdx).trim();
    const valuePart = line.content.slice(colonIdx + 1).trim();

    // Check for array header
    if (keyPart.includes('[') && keyPart.includes(']')) {
      const header = parseArrayHeader(keyPart);
      const result = parseArrayContent(
        lines,
        idx,
        currentDepth,
        header,
        valuePart,
        strict,
      );
      obj[header.key || ''] = result.value;
      idx = result.nextIdx;
      continue;
    }

    const key = parseKey(keyPart);

    if (valuePart === '') {
      // Nested object or empty value
      const nextIdx = idx + 1;
      if (nextIdx < lines.length && lines[nextIdx].depth > currentDepth) {
        const result = parseObject(lines, nextIdx, currentDepth + 1, strict);
        obj[key] = result.value;
        idx = result.nextIdx;
      } else {
        obj[key] = {};
        idx++;
      }
    } else {
      // Inline value
      obj[key] = parsePrimitive(valuePart);
      idx++;
    }
  }

  return { value: obj, nextIdx: idx };
}

/**
 * Dispatch array parsing based on header and content
 */
export function parseArrayContent(
  lines: ParsedLine[],
  startIdx: number,
  currentDepth: number,
  header: ArrayHeader,
  valuePart: string,
  strict: boolean,
): { value: JsonArray; nextIdx: number } {
  // Inline array
  if (valuePart !== '') {
    const values = splitDelimited(valuePart, header.delimiter);
    const result = values.map((v) => parsePrimitive(v.trim()));

    if (strict && result.length !== header.length) {
      throw new Error(
        `Inline array length mismatch: expected ${header.length}, got ${result.length}`,
      );
    }

    return { value: result, nextIdx: startIdx + 1 };
  }

  // Check if tabular (has fields)
  if (header.fields && header.fields.length > 0) {
    return parseTabularArray(lines, startIdx, currentDepth, header, strict);
  }

  // Otherwise list array
  return parseListArray(lines, startIdx, currentDepth, header, strict);
}

/**
 * Parse tabular array with field headers
 */
export function parseTabularArray(
  lines: ParsedLine[],
  startIdx: number,
  currentDepth: number,
  header: ArrayHeader,
  strict: boolean,
): { value: JsonArray; nextIdx: number } {
  // Pre-allocate array with known size for better performance
  const result: JsonObject[] = new Array(header.length);
  let resultIdx = 0;
  let idx = startIdx + 1;

  while (idx < lines.length) {
    const line = lines[idx];

    if (line.depth < currentDepth + 1) {
      break;
    }

    if (line.depth === currentDepth + 1) {
      const values = splitDelimited(line.content, header.delimiter);
      
      if (strict && values.length !== header.fields!.length) {
        throw new Error(
          `Tabular row width mismatch: expected ${header.fields!.length} values, got ${values.length}`,
        );
      }

      // Create object with known keys for better V8 optimization (hidden class)
      const obj: JsonObject = {};
      for (let i = 0; i < header.fields!.length; i++) {
        obj[header.fields![i]] = parsePrimitive(values[i]?.trim() || '');
      }

      result[resultIdx++] = obj;
    }

    idx++;
  }

  if (strict && resultIdx !== header.length) {
    throw new Error(
      `Tabular array length mismatch: expected ${header.length}, got ${resultIdx}`,
    );
  }

  // Trim array if we didn't fill it completely (non-strict mode)
  if (resultIdx < header.length) {
    result.length = resultIdx;
  }

  return { value: result, nextIdx: idx };
}

/**
 * Parse list array (mixed content with "- " markers)
 */
export function parseListArray(
  lines: ParsedLine[],
  startIdx: number,
  currentDepth: number,
  header: ArrayHeader,
  strict: boolean,
): { value: JsonArray; nextIdx: number } {
  const result: JsonValue[] = [];
  let idx = startIdx + 1;

  while (idx < lines.length) {
    const line = lines[idx];

    if (line.depth < currentDepth + 1) {
      break;
    }

    if (line.depth === currentDepth + 1 && line.content.startsWith('- ')) {
      const itemContent = line.content.slice(2);

      // Check for inline array
      if (itemContent.includes('[') && itemContent.includes(']')) {
        const itemHeader = parseArrayHeader(itemContent);
        const colonIdx = itemContent.indexOf(':');
        const valuePart = colonIdx !== -1 ? itemContent.slice(colonIdx + 1).trim() : '';
        const values = splitDelimited(valuePart, itemHeader.delimiter);
        result.push(values.map((v) => parsePrimitive(v.trim())));
        idx++;
        continue;
      }

      // Check for object (has colon)
      const colonIdx = findUnquotedColon(itemContent);
      if (colonIdx !== -1) {
        // Object as list item
        const keyPart = itemContent.slice(0, colonIdx).trim();
        const valuePart = itemContent.slice(colonIdx + 1).trim();
        const key = parseKey(keyPart);
        const obj: JsonObject = {};

        if (valuePart === '') {
          // Nested
          const nextIdx = idx + 1;
          if (nextIdx < lines.length && lines[nextIdx].depth > currentDepth + 1) {
            const objResult = parseObject(lines, nextIdx, currentDepth + 2, strict);
            obj[key] = objResult.value;
            idx = objResult.nextIdx;
          } else {
            obj[key] = {};
            idx++;
          }
        } else {
          obj[key] = parsePrimitive(valuePart);
          idx++;
        }

        // Check for additional fields
        while (idx < lines.length && lines[idx].depth === currentDepth + 2) {
          const fieldLine = lines[idx];
          const fieldColonIdx = findUnquotedColon(fieldLine.content);
          if (fieldColonIdx !== -1) {
            const fKey = parseKey(
              fieldLine.content.slice(0, fieldColonIdx).trim(),
            );
            const fValue = fieldLine.content.slice(fieldColonIdx + 1).trim();
            obj[fKey] = parsePrimitive(fValue);
          }
          idx++;
        }

        result.push(obj);
      } else {
        // Primitive
        result.push(parsePrimitive(itemContent));
        idx++;
      }
    } else {
      idx++;
    }
  }

  if (strict && result.length !== header.length) {
    throw new Error(
      `List array length mismatch: expected ${header.length}, got ${result.length}`,
    );
  }

  return { value: result, nextIdx: idx };
}

export type { ParsedLine };
