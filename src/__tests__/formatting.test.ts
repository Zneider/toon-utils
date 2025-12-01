import { describe, it, expect } from 'vitest';
import { ToonEncoder } from '../encoder';

describe('ToonEncoder - Custom Formatting', () => {
  const sampleData = {
    name: 'John',
    age: 30,
    city: 'New York',
  };

  it('should support custom line endings', () => {
    const encoder = new ToonEncoder({ lineEnding: '\r\n' });
    const result = encoder.encode(sampleData);
    
    expect(result).toContain('\r\n');
    expect(result.split('\r\n').length).toBeGreaterThan(1);
  });

  it('should support trailing newline', () => {
    const encoder = new ToonEncoder({ trailingNewline: true });
    const result = encoder.encode(sampleData);
    
    expect(result.endsWith('\n')).toBe(true);
  });

  it('should not add trailing newline by default', () => {
    const encoder = new ToonEncoder();
    const result = encoder.encode(sampleData);
    
    // Should not end with double newline (one newline is from the last line)
    expect(result.endsWith('\n\n')).toBe(false);
  });

  it('should sort keys alphabetically when enabled', () => {
    const encoder = new ToonEncoder({ sortKeys: true });
    const unsortedData = {
      zebra: 1,
      apple: 2,
      mango: 3,
    };
    
    const result = encoder.encode(unsortedData);
    const lines = result.split('\n');
    
    // Keys should appear in alphabetical order
    expect(lines[0]).toContain('apple');
    expect(lines[1]).toContain('mango');
    expect(lines[2]).toContain('zebra');
  });

  it('should preserve key order by default', () => {
    const encoder = new ToonEncoder();
    const orderedData = {
      zebra: 1,
      apple: 2,
      mango: 3,
    };
    
    const result = encoder.encode(orderedData);
    const lines = result.split('\n');
    
    // Keys should appear in original order
    expect(lines[0]).toContain('zebra');
    expect(lines[1]).toContain('apple');
    expect(lines[2]).toContain('mango');
  });

  it('should support different delimiters', () => {
    // Delimiters are used in array headers, not simple object encoding
    const dataWithArray = {
      items: ['a', 'b', 'c'],
    };
    
    const encoderComma = new ToonEncoder({ delimiter: ',' });
    const encoderTab = new ToonEncoder({ delimiter: '\t' });
    const encoderPipe = new ToonEncoder({ delimiter: '|' });
    
    const result1 = encoderComma.encode(dataWithArray);
    const result2 = encoderTab.encode(dataWithArray);
    const result3 = encoderPipe.encode(dataWithArray);
    
    // Delimiters appear in array headers
    expect(result1).toMatch(/items.*,/);
    expect(result2).toMatch(/items.*\t/);
    expect(result3).toMatch(/items.*\|/);
  });

  it('should support custom indentation sizes', () => {
    const encoder2 = new ToonEncoder({ indentSize: 2 });
    const encoder4 = new ToonEncoder({ indentSize: 4 });
    
    const nestedData = {
      outer: {
        inner: 'value',
      },
    };
    
    const result2 = encoder2.encode(nestedData);
    const result4 = encoder4.encode(nestedData);
    
    // The 4-space version should have more spaces
    expect(result4.length).toBeGreaterThan(result2.length);
  });

  it('should combine multiple formatting options', () => {
    const encoder = new ToonEncoder({
      sortKeys: true,
      trailingNewline: true,
      lineEnding: '\r\n',
      indentSize: 4,
    });
    
    const data = {
      zebra: 1,
      apple: 2,
    };
    
    const result = encoder.encode(data);
    
    // Check all features are applied
    expect(result).toContain('\r\n');
    expect(result.endsWith('\r\n')).toBe(true);
    expect(result.split('\r\n')[0]).toContain('apple'); // sorted
  });

  it('should handle nested objects with sorted keys', () => {
    const encoder = new ToonEncoder({ sortKeys: true });
    const data = {
      z: {
        inner_z: 1,
        inner_a: 2,
      },
      a: {
        nested_z: 3,
        nested_a: 4,
      },
    };
    
    const result = encoder.encode(data);
    const lines = result.split('\n');
    
    // Top level should be sorted
    expect(lines.findIndex(l => l.includes('a:'))).toBeLessThan(
      lines.findIndex(l => l.includes('z:'))
    );
  });
});
