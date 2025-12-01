import { Readable, Transform } from 'stream';
import type { JsonValue } from './types';
import { ToonParser } from './parser';

/**
 * Options for streaming parser
 */
export interface StreamParserOptions {
  /**
   * Size of chunks to process at a time (in bytes)
   * Default: 64KB
   */
  chunkSize?: number;
  
  /**
   * Whether to use strict parsing mode
   * Default: true
   */
  strict?: boolean;
  
  /**
   * Path expansion mode
   * Default: 'off'
   */
  expandPaths?: 'off' | 'safe';
}

/**
 * ToonStreamParser - Parse TOON format from streams for large files
 * 
 * This parser processes TOON content in chunks to avoid loading
 * entire large files into memory at once.
 */
export class ToonStreamParser extends Transform {
  private buffer: string = '';
  private parser: ToonParser;
  private options: Required<StreamParserOptions>;
  
  constructor(options: StreamParserOptions = {}) {
    super({ objectMode: true });
    
    this.options = {
      chunkSize: 64 * 1024, // 64KB default
      strict: true,
      expandPaths: 'off',
      ...options,
    };
    
    this.parser = new ToonParser({
      strict: this.options.strict,
      expandPaths: this.options.expandPaths,
    });
  }
  
  _transform(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    try {
      // Add chunk to buffer
      this.buffer += chunk.toString('utf-8');
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  _flush(callback: (error?: Error | null) => void): void {
    try {
      // Process the entire buffer at the end
      if (this.buffer.trim()) {
        const result = this.parser.parse(this.buffer);
        this.push(result);
      }
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Parse a TOON stream and return a promise with the result
 * 
 * @param stream - Readable stream containing TOON content
 * @param options - Parser options
 * @returns Promise resolving to parsed JSON value
 */
export function parseStream(
  stream: Readable,
  options: StreamParserOptions = {}
): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    const streamParser = new ToonStreamParser(options);
    const chunks: JsonValue[] = [];
    
    streamParser.on('data', (data: JsonValue) => {
      chunks.push(data);
    });
    
    streamParser.on('end', () => {
      // If we got multiple chunks, return array, otherwise single value
      resolve(chunks.length === 1 ? chunks[0] : chunks);
    });
    
    streamParser.on('error', reject);
    
    stream.pipe(streamParser);
  });
}

/**
 * Parse a file in streaming mode
 * 
 * @param filePath - Path to the TOON file
 * @param options - Parser options
 * @returns Promise resolving to parsed JSON value
 */
export async function parseFile(
  filePath: string,
  options: StreamParserOptions = {}
): Promise<JsonValue> {
  const fs = await import('fs');
  const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  return parseStream(stream, options);
}

/**
 * Line-by-line streaming parser for processing TOON objects one at a time
 * Useful for NDJSON-like TOON files where each top-level object is on separate lines
 */
export class ToonLineParser extends Transform {
  private buffer: string = '';
  private parser: ToonParser;
  
  constructor(options: StreamParserOptions = {}) {
    super({ objectMode: true });
    
    this.parser = new ToonParser({
      strict: options.strict ?? true,
      expandPaths: options.expandPaths ?? 'off',
    });
  }
  
  _transform(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    try {
      this.buffer += chunk.toString('utf-8');
      
      // Process complete objects (separated by double newlines or end of chunks)
      const objects = this.buffer.split('\n\n');
      
      // Keep the last incomplete object in buffer
      this.buffer = objects.pop() || '';
      
      // Parse and emit complete objects
      for (const obj of objects) {
        if (obj.trim()) {
          const parsed = this.parser.parse(obj);
          this.push(parsed);
        }
      }
      
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  _flush(callback: (error?: Error | null) => void): void {
    try {
      // Process remaining buffer
      if (this.buffer.trim()) {
        const parsed = this.parser.parse(this.buffer);
        this.push(parsed);
      }
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
