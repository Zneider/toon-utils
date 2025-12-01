import { describe, it, expect } from 'vitest';
import { Readable } from 'stream';
import { ToonLineParser, parseStream, parseFile } from '../stream-parser';
import type { JsonValue } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ToonStreamParser', () => {
  it('should parse TOON content from a stream', async () => {
    const toonContent = 'name: John Doe\nage: 30\ncity: New York';
    const stream = Readable.from([toonContent]);
    
    const result = await parseStream(stream);
    
    expect(result).toEqual({
      name: 'John Doe',
      age: 30,
      city: 'New York',
    });
  });

  it('should handle large content in chunks', async () => {
    const toonContent = Array(1000)
      .fill(null)
      .map((_, i) => `item${i}: value${i}`)
      .join('\n');
    
    const stream = Readable.from([toonContent]);
    const result = await parseStream(stream);
    
    expect(result).toHaveProperty('item0', 'value0');
    expect(result).toHaveProperty('item999', 'value999');
  });

  it('should respect strict mode', async () => {
    // Test with invalid indentation in strict mode
    const toonContent = 'name: value\n   bad_indent: value';
    const stream = Readable.from([toonContent]);
    
    await expect(parseStream(stream, { strict: true })).rejects.toThrow();
  });

  it('should parse from file', async () => {
    const tempFile = path.join(tmpdir(), 'test-stream.toon');
    const content = 'name: Test\nvalue: 123';
    
    fs.writeFileSync(tempFile, content);
    
    try {
      const result = await parseFile(tempFile);
      expect(result).toEqual({
        name: 'Test',
        value: 123,
      });
    } finally {
      fs.unlinkSync(tempFile);
    }
  });
});

describe('ToonLineParser', () => {
  it('should parse multiple TOON objects separated by double newlines', () => {
    return new Promise<void>((resolve) => {
      const content = 'name: Alice\nage: 25\n\nname: Bob\nage: 30\n\nname: Charlie\nage: 35';
      const stream = Readable.from([content]);
      const parser = new ToonLineParser();
      
      const results: JsonValue[] = [];
      
      parser.on('data', (data) => {
        results.push(data);
      });
      
      parser.on('end', () => {
        expect(results).toHaveLength(3);
        expect(results[0]).toEqual({ name: 'Alice', age: 25 });
        expect(results[1]).toEqual({ name: 'Bob', age: 30 });
        expect(results[2]).toEqual({ name: 'Charlie', age: 35 });
        resolve();
      });
      
      stream.pipe(parser);
    });
  });

  it('should handle streaming chunks', () => {
    return new Promise<void>((resolve) => {
      const parser = new ToonLineParser();
      const results: JsonValue[] = [];
      
      parser.on('data', (data) => {
        results.push(data);
      });
      
      parser.on('end', () => {
        expect(results).toHaveLength(2);
        expect(results[0]).toEqual({ name: 'First', value: 1 });
        expect(results[1]).toEqual({ name: 'Second', value: 2 });
        resolve();
      });
      
      // Simulate chunked streaming
      parser.write('name: First\n');
      parser.write('value: 1\n\n');
      parser.write('name: Second\n');
      parser.write('value: 2');
      parser.end();
    });
  });
});
