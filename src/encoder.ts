import type { JsonValue, JsonObject, JsonArray, EncoderOptions } from './types';
import { indent } from './utils/parse-utils';
import {
  isPrimitive,
  encodePrimitiveValue,
  arrayHeader,
  checkTabular,
  encodePrimitive,
  encodeNumber,
  encodeString,
} from './encoders/value-encoder';
import { encodeKey } from './utils/string-utils';

/**
 * ToonEncoder class for encoding JSON data to TOON format
 */
export class ToonEncoder {
  private options: Required<EncoderOptions>;

  constructor(options: EncoderOptions = {}) {
    this.options = {
      indentSize: 2,
      delimiter: ',',
      keyFolding: 'off',
      flattenDepth: Infinity,
      lineEnding: '\n',
      sortKeys: false,
      trailingNewline: false,
      maxLineLength: Infinity,
      compact: false,
      preserveKeyOrder: true,
      ...options,
    };
  }

  /**
   * Encode a JSON value to TOON format
   */
  encode(value: JsonValue): string {
    const lines = this.encodeValue(value, 0, undefined);
    let output = lines.join(this.options.lineEnding);
    
    if (this.options.trailingNewline && !output.endsWith(this.options.lineEnding)) {
      output += this.options.lineEnding;
    }
    
    return output;
  }

  private encodeValue(
    value: JsonValue,
    depth: number,
    key?: string,
  ): string[] {
    if (value === null || typeof value === 'boolean') {
      return encodePrimitive(value, depth, this.options.indentSize, this.options.delimiter, key);
    }
    if (typeof value === 'number') {
      return encodeNumber(value, depth, this.options.indentSize, this.options.delimiter, key);
    }
    if (typeof value === 'string') {
      return encodeString(value, depth, this.options.indentSize, this.options.delimiter, key);
    }
    if (Array.isArray(value)) {
      return this.encodeArray(value, depth, key);
    }
    return this.encodeObject(value, depth, key);
  }

  private encodeArray(
    value: JsonArray,
    depth: number,
    key?: string,
  ): string[] {
    if (value.length === 0) {
      const header = arrayHeader(key, 0, this.options.delimiter);
      return [`${indent(depth, this.options.indentSize)}${header}`];
    }

    // Check if all elements are primitives
    const allPrimitives = value.every((v: JsonValue) => isPrimitive(v));
    if (allPrimitives) {
      return this.encodeInlineArray(
        value as (string | number | boolean | null)[],
        depth,
        key,
      );
    }

    // Check for tabular format
    const tabular = checkTabular(value);
    if (tabular) {
      return this.encodeTabular(value as JsonObject[], depth, key, tabular);
    }

    // Mixed/non-uniform array
    return this.encodeListArray(value, depth, key);
  }

  private encodeInlineArray(
    value: (string | number | boolean | null)[],
    depth: number,
    key?: string,
  ): string[] {
    const values = value.map((v) => encodePrimitiveValue(v, this.options.delimiter));
    const header = arrayHeader(key, value.length, this.options.delimiter);
    const valuesStr = values.join(this.options.delimiter);
    return [`${indent(depth, this.options.indentSize)}${header} ${valuesStr}`];
  }

  private encodeTabular(
    value: JsonObject[],
    depth: number,
    key: string | undefined,
    fields: string[],
  ): string[] {
    const lines: string[] = [];
    const header = arrayHeader(
      key,
      value.length,
      this.options.delimiter,
      fields,
    );
    lines.push(`${indent(depth, this.options.indentSize)}${header}`);

    for (const obj of value) {
      const row = fields
        .map((f) =>
          encodePrimitiveValue(
            obj[f] as string | number | boolean | null,
            this.options.delimiter,
          ),
        )
        .join(this.options.delimiter);
      lines.push(`${indent(depth + 1, this.options.indentSize)}${row}`);
    }

    return lines;
  }

  private encodeListArray(
    value: JsonArray,
    depth: number,
    key?: string,
  ): string[] {
    const lines: string[] = [];
    const header = arrayHeader(key, value.length, this.options.delimiter);
    lines.push(`${indent(depth, this.options.indentSize)}${header}`);

    for (const item of value) {
      if (isPrimitive(item)) {
        lines.push(
          `${indent(depth + 1, this.options.indentSize)}- ${encodePrimitiveValue(item as string | number | boolean | null, this.options.delimiter)}`,
        );
      } else if (Array.isArray(item)) {
        const itemLines = this.encodeValue(item, depth + 1);
        itemLines[0] = `${indent(depth + 1, this.options.indentSize)}- ${itemLines[0].trim()}`;
        lines.push(...itemLines);
      } else {
        // Object as list item
        lines.push(...this.encodeObjectAsListItem(item as JsonObject, depth + 1));
      }
    }

    return lines;
  }

  private encodeObject(
    value: JsonObject,
    depth: number,
    key?: string,
  ): string[] {
    const lines: string[] = [];
    let entries = Object.entries(value);

    // Sort keys if enabled
    if (this.options.sortKeys) {
      entries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    if (entries.length === 0) {
      if (key) {
        lines.push(`${indent(depth, this.options.indentSize)}${encodeKey(key, this.options.delimiter)}:`);
      }
      return lines;
    }

    if (key) {
      lines.push(`${indent(depth, this.options.indentSize)}${encodeKey(key, this.options.delimiter)}:`);
      for (const [k, v] of entries) {
        lines.push(...this.encodeValue(v, depth + 1, k));
      }
    } else {
      // Root object
      for (const [k, v] of entries) {
        lines.push(...this.encodeValue(v, depth, k));
      }
    }

    return lines;
  }

  private encodeObjectAsListItem(
    value: JsonObject,
    depth: number,
  ): string[] {
    const lines: string[] = [];
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return [`${indent(depth, this.options.indentSize)}-`];
    }

    const [firstKey, firstValue] = entries[0];
    const firstLine = this.encodeValue(firstValue, depth, firstKey)[0];
    lines.push(`${indent(depth, this.options.indentSize)}- ${firstLine.trim()}`);

    for (let i = 1; i < entries.length; i++) {
      const [k, v] = entries[i];
      lines.push(...this.encodeValue(v, depth + 1, k));
    }

    return lines;
  }
}
