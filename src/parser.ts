import type {
  JsonValue,
  JsonArray,
  ParserOptions,
} from './types';
import { parsePrimitive, findUnquotedColon } from './utils/string-utils';
import { isArrayHeader, parseArrayHeader, getDepth } from './utils/parse-utils';
import { parseObject, parseArrayContent, type ParsedLine } from './parsers/array-parser';
import { expandPaths as expandPathsUtil } from './parsers/path-expander';

/**
 * ToonParser class for parsing TOON format files
 * Implements TOON Specification v3.0
 */
export class ToonParser {
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      indentSize: 2,
      strict: true,
      expandPaths: 'off',
      ...options,
    };
  }

  /**
   * Parse TOON content from a string
   * @param content - The TOON content to parse
   * @returns Parsed JSON value
   */
  parse(content: string): JsonValue {
    if (!content || content.trim() === '') {
      return {}; // Empty document -> empty object per spec
    }

    const lines = content.split('\n');
    const parsed = this.parseLines(lines);

    if (this.options.expandPaths === 'safe') {
      return expandPathsUtil(parsed, this.options.strict);
    }

    return parsed;
  }

  private parseLines(lines: string[]): JsonValue {
    // Filter and process lines
    const processedLines: ParsedLine[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip completely blank lines (outside arrays)
      if (line.trim() === '') {
        continue;
      }

      const depth = getDepth(line, i, this.options.indentSize, this.options.strict);
      const content = line.slice(depth * this.options.indentSize);

      processedLines.push({ content, depth, raw: line });
    }

    if (processedLines.length === 0) {
      return {}; // Empty document -> empty object
    }

    // Determine root form
    return this.determineRootForm(processedLines);
  }

  private determineRootForm(lines: ParsedLine[]): JsonValue {
    if (lines.length === 0) {
      return {};
    }

    const firstLine = lines[0];

    // Check for root array header
    if (firstLine.depth === 0 && isArrayHeader(firstLine.content)) {
      const header = parseArrayHeader(firstLine.content);
      if (header.key) {
        // Array with key -> parse as object
        return parseObject(lines, 0, 0, this.options.strict).value;
      } else {
        // Root array without key
        return this.parseArray(lines, 0, 0).value;
      }
    }

    // Check for single primitive
    if (
      lines.length === 1 &&
      firstLine.depth === 0 &&
      !this.isKeyValue(firstLine.content) &&
      !isArrayHeader(firstLine.content)
    ) {
      return parsePrimitive(firstLine.content);
    }

    // Otherwise, parse as object
    return parseObject(lines, 0, 0, this.options.strict).value;
  }

  private parseArray(
    lines: ParsedLine[],
    startIdx: number,
    currentDepth: number,
  ): { value: JsonArray; nextIdx: number } {
    const line = lines[startIdx];
    const header = parseArrayHeader(line.content);
    const colonIdx = line.content.indexOf(':');
    const valuePart = colonIdx !== -1 ? line.content.slice(colonIdx + 1).trim() : '';

    return parseArrayContent(
      lines,
      startIdx,
      currentDepth,
      header,
      valuePart,
      this.options.strict,
    );
  }

  private isKeyValue(content: string): boolean {
    return findUnquotedColon(content) !== -1;
  }

  /**
   * Validate TOON content
   * @param content - The TOON content to validate
   * @returns True if valid, false otherwise
   */
  validate(content: string): boolean {
    try {
      this.parse(content);
      return true;
    } catch {
      return false;
    }
  }
}
