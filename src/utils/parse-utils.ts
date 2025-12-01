import type { ArrayHeader, Delimiter } from '../types';
import { parseKey, splitDelimited } from './string-utils';

/**
 * Check if a line is an array header
 */
export function isArrayHeader(content: string): boolean {
  return content.includes('[') && content.includes(']');
}

/**
 * Check if a line is a key-value pair
 */
export function isKeyValue(content: string): boolean {
  return content.includes(':');
}

/**
 * Parse array header like "key[N]" or "key[N,]" or "key[N]{fields}"
 */
export function parseArrayHeader(content: string): ArrayHeader {
  const bracketStart = content.indexOf('[');
  const bracketEnd = content.indexOf(']');

  if (bracketStart === -1 || bracketEnd === -1) {
    return { key: undefined, length: 0, delimiter: ',' };
  }

  const key = bracketStart > 0 ? content.slice(0, bracketStart).trim() : undefined;
  const bracketContent = content.slice(bracketStart + 1, bracketEnd);

  // Determine delimiter and length
  let delimiter: Delimiter = ',';
  let lengthStr = bracketContent;

  if (bracketContent.endsWith('\t')) {
    delimiter = '\t';
    lengthStr = bracketContent.slice(0, -1);
  } else if (bracketContent.endsWith('|')) {
    delimiter = '|';
    lengthStr = bracketContent.slice(0, -1);
  } else if (bracketContent.endsWith(',')) {
    delimiter = ',';
    lengthStr = bracketContent.slice(0, -1);
  }

  const length = parseInt(lengthStr, 10) || 0;

  // Check for fields
  let fields: string[] | undefined;
  const afterBracket = content.slice(bracketEnd + 1).replace(/:$/, '');
  if (afterBracket.includes('{')) {
    const fieldsMatch = afterBracket.match(/\{([^}]+)\}/);
    if (fieldsMatch) {
      fields = splitDelimited(fieldsMatch[1], delimiter).map((f) =>
        parseKey(f.trim()),
      );
    }
  }

  return { key, length, delimiter, fields };
}

/**
 * Calculate indentation depth
 */
export function getDepth(line: string, lineNum: number, indentSize: number, strict: boolean): number {
  let spaces = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ' ') {
      spaces++;
    } else if (line[i] === '\t') {
      if (strict) {
        throw new Error(
          `Tabs not allowed in indentation at line ${lineNum + 1}`,
        );
      }
      spaces += indentSize;
    } else {
      break;
    }
  }

  const depth = Math.floor(spaces / indentSize);

  if (strict && spaces % indentSize !== 0) {
    throw new Error(
      `Indentation must be a multiple of ${indentSize} at line ${lineNum + 1}`,
    );
  }

  return depth;
}

/**
 * Create indentation string
 */
export function indent(depth: number, indentSize: number): string {
  return ' '.repeat(depth * indentSize);
}
