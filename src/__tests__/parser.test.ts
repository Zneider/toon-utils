import { describe, it, expect, beforeEach } from 'vitest';
import { ToonParser } from '../parser';
import { ToonEncoder } from '../encoder';

describe('ToonParser', () => {
  let parser: ToonParser;

  beforeEach(() => {
    parser = new ToonParser();
  });

  describe('primitives', () => {
    it('should parse string primitive', () => {
      const result = parser.parse('hello');
      expect(result).toBe('hello');
    });

    it('should parse number primitive', () => {
      const result = parser.parse('42');
      expect(result).toBe(42);
    });

    it('should parse boolean primitives', () => {
      expect(parser.parse('true')).toBe(true);
      expect(parser.parse('false')).toBe(false);
    });

    it('should parse null', () => {
      expect(parser.parse('null')).toBe(null);
    });

    it('should parse quoted strings', () => {
      const result = parser.parse('"hello world"');
      expect(result).toBe('hello world');
    });

    it('should parse numbers with decimals', () => {
      const result = parser.parse('3.14');
      expect(result).toBe(3.14);
    });

    it('should parse negative numbers', () => {
      const result = parser.parse('-42');
      expect(result).toBe(-42);
    });

    it('should treat leading-zero numbers as strings', () => {
      const result = parser.parse('007');
      expect(result).toBe('007');
    });
  });

  describe('objects', () => {
    it('should parse simple object', () => {
      const toon = 'name: Alice\nage: 30';
      const result = parser.parse(toon);
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should parse nested object', () => {
      const toon = 'user:\n  name: Alice\n  age: 30';
      const result = parser.parse(toon);
      expect(result).toEqual({
        user: { name: 'Alice', age: 30 },
      });
    });

    it('should parse empty object', () => {
      const toon = '';
      const result = parser.parse(toon);
      expect(result).toEqual({});
    });

    it('should parse object with quoted keys', () => {
      const toon = '"my-key": value';
      const result = parser.parse(toon);
      expect(result).toEqual({ 'my-key': 'value' });
    });

    it('should parse deeply nested objects', () => {
      const toon = 'a:\n  b:\n    c: value';
      const result = parser.parse(toon);
      expect(result).toEqual({ a: { b: { c: 'value' } } });
    });
  });

  describe('inline arrays', () => {
    it('should parse inline primitive array', () => {
      const toon = 'tags[3]: a,b,c';
      const result = parser.parse(toon);
      expect(result).toEqual({ tags: ['a', 'b', 'c'] });
    });

    it('should parse empty array', () => {
      const toon = 'items[0]:';
      const result = parser.parse(toon);
      expect(result).toEqual({ items: [] });
    });

    it('should parse array with numbers', () => {
      const toon = 'nums[3]: 1,2,3';
      const result = parser.parse(toon);
      expect(result).toEqual({ nums: [1, 2, 3] });
    });

    it('should parse array with mixed types', () => {
      const toon = 'mixed[4]: true,42,null,text';
      const result = parser.parse(toon);
      expect(result).toEqual({ mixed: [true, 42, null, 'text'] });
    });

    it('should parse array with quoted strings', () => {
      const toon = 'items[2]: "hello world","foo bar"';
      const result = parser.parse(toon);
      expect(result).toEqual({ items: ['hello world', 'foo bar'] });
    });
  });

  describe('tabular arrays', () => {
    it('should parse tabular array', () => {
      const toon = 'users[2]{id,name}:\n  1,Alice\n  2,Bob';
      const result = parser.parse(toon);
      expect(result).toEqual({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });
    });

    it('should parse tabular with different types', () => {
      const toon = 'items[2]{id,name,active}:\n  1,Widget,true\n  2,Gadget,false';
      const result = parser.parse(toon);
      expect(result).toEqual({
        items: [
          { id: 1, name: 'Widget', active: true },
          { id: 2, name: 'Gadget', active: false },
        ],
      });
    });
  });

  describe('list arrays', () => {
    it('should parse list array of primitives', () => {
      const toon = 'items[3]:\n  - a\n  - b\n  - c';
      const result = parser.parse(toon);
      expect(result).toEqual({ items: ['a', 'b', 'c'] });
    });

    it('should parse list array of objects', () => {
      const toon = 'users[2]:\n  - name: Alice\n    age: 30\n  - name: Bob\n    age: 25';
      const result = parser.parse(toon);
      expect(result).toEqual({
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      });
    });
  });

  describe('escaping', () => {
    it('should unescape backslash', () => {
      const result = parser.parse('"a\\\\b"');
      expect(result).toBe('a\\b');
    });

    it('should unescape quotes', () => {
      const result = parser.parse('"a\\"b"');
      expect(result).toBe('a"b');
    });

    it('should unescape newline', () => {
      const result = parser.parse('"a\\nb"');
      expect(result).toBe('a\nb');
    });

    it('should unescape carriage return', () => {
      const result = parser.parse('"a\\rb"');
      expect(result).toBe('a\rb');
    });

    it('should unescape tab', () => {
      const result = parser.parse('"a\\tb"');
      expect(result).toBe('a\tb');
    });

    it('should reject invalid escape in strict mode', () => {
      expect(() => parser.parse('"a\\xb"')).toThrow();
    });
  });

  describe('strict mode', () => {
    it('should enforce array length', () => {
      const toon = 'items[3]: a,b';
      expect(() => parser.parse(toon)).toThrow(/length mismatch/);
    });

    it('should enforce indentation multiples', () => {
      const toon = 'user:\n   name: Alice';
      expect(() => parser.parse(toon)).toThrow(/multiple of/);
    });

    it('should reject tabs in indentation', () => {
      const toon = '\tname: value';
      expect(() => parser.parse(toon)).toThrow(/Tabs not allowed/);
    });
  });

  describe('validate', () => {
    it('should return true for valid TOON', () => {
      expect(parser.validate('name: Alice')).toBe(true);
    });

    it('should return false for invalid TOON', () => {
      expect(parser.validate('items[3]: a,b')).toBe(false);
    });
  });

  describe('edge cases', () => {
    describe('numbers', () => {
      it('should parse zero', () => {
        expect(parser.parse('0')).toBe(0);
      });

      it('should parse negative zero', () => {
        expect(parser.parse('-0')).toBe(-0);
      });

      it('should parse very large numbers', () => {
        expect(parser.parse('999999999999')).toBe(999999999999);
      });

      it('should parse very small decimals', () => {
        expect(parser.parse('0.000001')).toBe(0.000001);
      });

      it('should parse negative decimals', () => {
        expect(parser.parse('-3.14')).toBe(-3.14);
      });

      it('should treat numbers with leading zeros as strings', () => {
        expect(parser.parse('00123')).toBe('00123');
        expect(parser.parse('0.00')).toBe(0); // trailing zeros removed
      });

      it('should parse numbers with exponents', () => {
        expect(parser.parse('1e5')).toBe(100000); // scientific notation parsed
      });
    });

    describe('strings', () => {
      it('should parse strings with only whitespace', () => {
        expect(parser.parse('"   "')).toBe('   ');
      });

      it('should parse strings with special characters', () => {
        expect(parser.parse('"!@#$%^&*()"')).toBe('!@#$%^&*()');
      });

      it('should parse strings with unicode', () => {
        expect(parser.parse('"hello 世界 🌍"')).toBe('hello 世界 🌍');
      });

      it('should parse empty quoted string', () => {
        expect(parser.parse('""')).toBe('');
      });

      it('should handle consecutive escapes', () => {
        expect(parser.parse('"\\\\\\\\n"')).toBe('\\\\n');
      });

      it('should handle mixed escapes', () => {
        expect(parser.parse('"\\n\\t\\r\\\\"')).toBe('\n\t\r\\');
      });
    });

    describe('arrays', () => {
      it('should parse array with single element', () => {
        const toon = 'items[1]: solo';
        expect(parser.parse(toon)).toEqual({ items: ['solo'] });
      });

      it('should parse array with whitespace in values', () => {
        const toon = 'items[2]: "  spaces  ","  more  "';
        expect(parser.parse(toon)).toEqual({ items: ['  spaces  ', '  more  '] });
      });

      it('should parse tabular array with quoted values', () => {
        const toon = 'users[1]{name,bio}:\n  Alice,"Hello, world!"';
        expect(parser.parse(toon)).toEqual({
          users: [{ name: 'Alice', bio: 'Hello, world!' }],
        });
      });

      it('should parse empty tabular array', () => {
        const toon = 'users[0]{id,name}:';
        expect(parser.parse(toon)).toEqual({ users: [] });
      });

      it('should parse list array with single item', () => {
        const toon = 'items[1]:\n  - solo';
        expect(parser.parse(toon)).toEqual({ items: ['solo'] });
      });

      it('should parse nested arrays', () => {
        const toon = 'data:\n  items[2]: a,b';
        expect(parser.parse(toon)).toEqual({ data: { items: ['a', 'b'] } });
      });

      it('should parse array with all null values', () => {
        const toon = 'items[3]: null,null,null';
        expect(parser.parse(toon)).toEqual({ items: [null, null, null] });
      });

      it('should parse array with boolean values', () => {
        const toon = 'flags[3]: true,false,true';
        expect(parser.parse(toon)).toEqual({ flags: [true, false, true] });
      });
    });

    describe('objects', () => {
      it('should parse object with numeric keys', () => {
        const toon = '123: value';
        expect(parser.parse(toon)).toEqual({ '123': 'value' });
      });

      it('should parse object with special character keys', () => {
        const toon = '"my-key": value\n"another.key": value2';
        expect(parser.parse(toon)).toEqual({ 'my-key': 'value', 'another.key': 'value2' });
      });

      it('should parse deeply nested structures', () => {
        const toon = 'a:\n  b:\n    c:\n      d:\n        e: deep';
        expect(parser.parse(toon)).toEqual({ a: { b: { c: { d: { e: 'deep' } } } } });
      });

      it('should parse object with mixed value types', () => {
        const toon = 'str: text\nnum: 42\nbool: true\nnull: null';
        expect(parser.parse(toon)).toEqual({ str: 'text', num: 42, bool: true, null: null });
      });

      it('should parse object with array and object children', () => {
        const toon = 'arr[2]: a,b\nobj:\n  key: value';
        expect(parser.parse(toon)).toEqual({
          arr: ['a', 'b'],
          obj: { key: 'value' },
        });
      });
    });

    describe('whitespace handling', () => {
      it('should trim trailing whitespace from values', () => {
        const toon = 'key: value   ';
        expect(parser.parse(toon)).toEqual({ key: 'value' });
      });

      it('should handle multiple blank lines', () => {
        const toon = 'a: 1\n\n\nb: 2';
        expect(parser.parse(toon)).toEqual({ a: 1, b: 2 });
      });

      it('should handle windows line endings', () => {
        const toon = 'a: 1\r\nb: 2';
        expect(parser.parse(toon)).toEqual({ a: 1, b: 2 });
      });

      it('should preserve quoted whitespace', () => {
        const toon = 'key: "  value  "';
        expect(parser.parse(toon)).toEqual({ key: '  value  ' });
      });
    });

    describe('delimiters', () => {


      it('should handle delimiters in quoted strings', () => {
        const toon = 'items[2]: "a,b,c","d,e,f"';
        expect(parser.parse(toon)).toEqual({ items: ['a,b,c', 'd,e,f'] });
      });
    });

    describe('error cases', () => {
      it('should throw on mismatched array length', () => {
        expect(() => parser.parse('items[5]: a,b,c')).toThrow(/length mismatch/);
      });

      it('should throw on invalid indentation', () => {
        expect(() => parser.parse('obj:\n   key: value')).toThrow(/multiple of/);
      });



      it('should throw on invalid escape sequences', () => {
        expect(() => parser.parse('"\\x"')).toThrow(/Invalid escape/);
      });



      it('should throw on tabular header mismatch', () => {
        const toon = 'users[2]{id,name}:\n  1,Alice,extra';
        expect(() => parser.parse(toon)).toThrow(/row width mismatch/);
      });

      it('should throw on list array length mismatch', () => {
        const toon = 'items[3]:\n  - a\n  - b';
        expect(() => parser.parse(toon)).toThrow(/length mismatch/);
      });
    });

    describe('complex structures', () => {
      it('should parse mixed tabular and list arrays', () => {
        const toon = 'data[2]{id}:\n  1\n  2\nitems[2]:\n  - a\n  - b';
        expect(parser.parse(toon)).toEqual({
          data: [{ id: 1 }, { id: 2 }],
          items: ['a', 'b'],
        });
      });

      it('should parse object containing multiple array types', () => {
        const toon = `config:
  inline[2]: a,b
  tabular[1]{x,y}:
    1,2
  list[2]:
    - first
    - second`;
        expect(parser.parse(toon)).toEqual({
          config: {
            inline: ['a', 'b'],
            tabular: [{ x: 1, y: 2 }],
            list: ['first', 'second'],
          },
        });
      });

      it('should parse tabular array with nested objects in list', () => {
        const toon = `items[2]:
  - id: 1
    name: First
  - id: 2
    name: Second`;
        expect(parser.parse(toon)).toEqual({
          items: [
            { id: 1, name: 'First' },
            { id: 2, name: 'Second' },
          ],
        });
      });
    });
  });
});

describe('ToonEncoder', () => {
  let encoder: ToonEncoder;

  beforeEach(() => {
    encoder = new ToonEncoder();
  });

  describe('primitives', () => {
    it('should encode string', () => {
      expect(encoder.encode('hello')).toBe('hello');
    });

    it('should encode number', () => {
      expect(encoder.encode(42)).toBe('42');
    });

    it('should encode boolean', () => {
      expect(encoder.encode(true)).toBe('true');
      expect(encoder.encode(false)).toBe('false');
    });

    it('should encode null', () => {
      expect(encoder.encode(null)).toBe('null');
    });

    it('should quote strings with special chars', () => {
      expect(encoder.encode('hello:world')).toBe('"hello:world"');
      expect(encoder.encode('hello,world')).toBe('"hello,world"');
    });

    it('should quote empty strings', () => {
      expect(encoder.encode('')).toBe('""');
    });
  });

  describe('objects', () => {
    it('should encode simple object', () => {
      const result = encoder.encode({ name: 'Alice', age: 30 });
      expect(result).toBe('name: Alice\nage: 30');
    });

    it('should encode nested object', () => {
      const result = encoder.encode({ user: { name: 'Alice' } });
      expect(result).toBe('user:\n  name: Alice');
    });

    it('should encode empty object', () => {
      const result = encoder.encode({});
      expect(result).toBe('');
    });
  });

  describe('arrays', () => {
    it('should encode inline array', () => {
      const result = encoder.encode({ tags: ['a', 'b', 'c'] });
      expect(result).toBe('tags[3]: a,b,c');
    });

    it('should encode empty array', () => {
      const result = encoder.encode({ items: [] });
      expect(result).toBe('items[0]:');
    });

    it('should encode tabular array', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };
      const result = encoder.encode(data);
      expect(result).toBe('users[2]{id,name}:\n  1,Alice\n  2,Bob');
    });
  });

  describe('round-trip', () => {
    const parser = new ToonParser();

    it('should round-trip simple object', () => {
      const data = { name: 'Alice', age: 30 };
      const toon = encoder.encode(data);
      const parsed = parser.parse(toon);
      expect(parsed).toEqual(data);
    });

    it('should round-trip nested object', () => {
      const data = { user: { name: 'Alice', age: 30 } };
      const toon = encoder.encode(data);
      const parsed = parser.parse(toon);
      expect(parsed).toEqual(data);
    });

    it('should round-trip inline array', () => {
      const data = { tags: ['a', 'b', 'c'] };
      const toon = encoder.encode(data);
      const parsed = parser.parse(toon);
      expect(parsed).toEqual(data);
    });

    it('should round-trip tabular array', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };
      const toon = encoder.encode(data);
      const parsed = parser.parse(toon);
      expect(parsed).toEqual(data);
    });
  });

  describe('edge cases', () => {
    describe('numbers', () => {
      it('should encode zero', () => {
        expect(encoder.encode(0)).toBe('0');
      });

      it('should encode negative numbers', () => {
        expect(encoder.encode(-42)).toBe('-42');
        expect(encoder.encode(-3.14)).toBe('-3.14');
      });

      it('should encode decimals without trailing zeros', () => {
        expect(encoder.encode(3.14)).toBe('3.14');
        expect(encoder.encode(1.0)).toBe('1');
      });

      it('should encode very small decimals', () => {
        expect(encoder.encode(0.000001)).toBe('0.000001');
      });

      it('should encode large numbers', () => {
        expect(encoder.encode(999999999999)).toBe('999999999999');
      });
    });

    describe('strings', () => {
      it('should quote strings with colons', () => {
        expect(encoder.encode('hello:world')).toBe('"hello:world"');
      });

      it('should quote strings with commas', () => {
        expect(encoder.encode('hello,world')).toBe('"hello,world"');
      });

      it('should quote strings with brackets', () => {
        expect(encoder.encode('hello[world]')).toBe('"hello[world]"');
      });

      it('should quote strings with quotes', () => {
        expect(encoder.encode('say "hi"')).toBe('"say \\"hi\\""');
      });

      it('should escape backslashes', () => {
        expect(encoder.encode('C:\\path')).toBe('"C:\\\\path"');
      });

      it('should escape newlines', () => {
        expect(encoder.encode('line1\nline2')).toBe('"line1\\nline2"');
      });

      it('should escape tabs', () => {
        expect(encoder.encode('col1\tcol2')).toBe('"col1\\tcol2"');
      });

      it('should quote keywords', () => {
        expect(encoder.encode('true')).toBe('"true"');
        expect(encoder.encode('false')).toBe('"false"');
        expect(encoder.encode('null')).toBe('"null"');
      });

      it('should quote strings that look like numbers', () => {
        expect(encoder.encode('123')).toBe('"123"');
        expect(encoder.encode('3.14')).toBe('"3.14"');
      });

      it('should handle unicode characters', () => {
        expect(encoder.encode('hello 世界')).toBe('hello 世界');
      });

      it('should handle emoji', () => {
        expect(encoder.encode('🌍')).toBe('🌍');
      });

      it('should quote whitespace-only strings', () => {
        expect(encoder.encode('   ')).toBe('"   "');
      });

      it('should quote strings with leading/trailing whitespace', () => {
        expect(encoder.encode('  hello  ')).toBe('"  hello  "');
      });
    });

    describe('arrays', () => {
      it('should encode array with single element', () => {
        expect(encoder.encode({ items: ['solo'] })).toBe('items[1]: solo');
      });

      it('should encode array with null values', () => {
        expect(encoder.encode({ items: [null, null] })).toBe('items[2]: null,null');
      });

      it('should encode array with boolean values', () => {
        expect(encoder.encode({ flags: [true, false, true] })).toBe('flags[3]: true,false,true');
      });

      it('should encode array with mixed types', () => {
        const result = encoder.encode({ mix: ['text', 42, true, null] });
        expect(result).toBe('mix[4]: text,42,true,null');
      });

      it('should encode array with quoted elements', () => {
        const result = encoder.encode({ items: ['a,b', 'c:d'] });
        expect(result).toBe('items[2]: "a,b","c:d"');
      });

      it('should encode nested arrays as tabular when uniform objects', () => {
        const data = {
          matrix: [
            [1, 2],
            [3, 4],
          ],
        };
        const result = encoder.encode(data);
        expect(result).toContain('matrix[2]');
      });
    });

    describe('objects', () => {
      it('should encode object with numeric keys', () => {
        const result = encoder.encode({ '123': 'value' });
        expect(result).toBe('"123": value'); // numeric keys are quoted
      });

      it('should encode object with special character keys', () => {
        const result = encoder.encode({ 'my-key': 'value' });
        expect(result).toBe('my-key: value'); // hyphens are valid
      });

      it('should encode deeply nested objects', () => {
        const data = { a: { b: { c: { d: 'deep' } } } };
        const result = encoder.encode(data);
        expect(result).toBe('a:\n  b:\n    c:\n      d: deep');
      });

      it('should encode object with mixed value types', () => {
        const data = { str: 'text', num: 42, bool: true, null: null };
        const result = encoder.encode(data);
        expect(result).toContain('str: text');
        expect(result).toContain('num: 42');
        expect(result).toContain('bool: true');
        expect(result).toContain('null: null');
      });

      it('should encode object with array properties', () => {
        const data = {
          tags: ['a', 'b'],
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        };
        const result = encoder.encode(data);
        expect(result).toContain('tags[2]: a,b');
        expect(result).toContain('users[2]{id,name}:');
      });
    });

    describe('tabular arrays', () => {
      it('should encode empty tabular array', () => {
        const data = { users: [] };
        const result = encoder.encode(data);
        expect(result).toBe('users[0]:');
      });

      it('should encode tabular array with single row', () => {
        const data = { users: [{ id: 1, name: 'Alice' }] };
        const result = encoder.encode(data);
        expect(result).toBe('users[1]{id,name}:\n  1,Alice');
      });

      it('should encode tabular array with quoted values', () => {
        const data = { users: [{ name: 'Alice', bio: 'Hello, world!' }] };
        const result = encoder.encode(data);
        expect(result).toContain('"Hello, world!"');
      });

      it('should encode tabular array with null values', () => {
        const data = { items: [{ id: 1, value: null }] };
        const result = encoder.encode(data);
        expect(result).toBe('items[1]{id,value}:\n  1,null');
      });

      it('should encode tabular array with boolean values', () => {
        const data = { items: [{ id: 1, active: true }] };
        const result = encoder.encode(data);
        expect(result).toBe('items[1]{id,active}:\n  1,true');
      });
    });

    describe('custom options', () => {
      it('should respect custom indent size', () => {
        const customEncoder = new ToonEncoder({ indentSize: 4 });
        const data = { user: { name: 'Alice' } };
        const result = customEncoder.encode(data);
        expect(result).toBe('user:\n    name: Alice');
      });


    });

    describe('complex round-trips', () => {
      const parser = new ToonParser();

      it('should round-trip with special characters', () => {
        const data = {
          message: 'Hello, "world"!\nNew line here.',
          path: 'C:\\Users\\Alice',
        };
        const toon = encoder.encode(data);
        const parsed = parser.parse(toon);
        expect(parsed).toEqual(data);
      });

      it('should round-trip with unicode', () => {
        const data = { greeting: 'こんにちは', emoji: '🎉' };
        const toon = encoder.encode(data);
        const parsed = parser.parse(toon);
        expect(parsed).toEqual(data);
      });

      it('should round-trip with mixed types', () => {
        const data = {
          string: 'text',
          number: 42,
          decimal: 3.14,
          bool: true,
          null: null,
          array: [1, 2, 3],
          object: { nested: 'value' },
        };
        const toon = encoder.encode(data);
        const parsed = parser.parse(toon);
        expect(parsed).toEqual(data);
      });

      it('should round-trip nested objects with arrays', () => {
        const data = {
          config: {
            enabled: true,
            timeout: 30,
            endpoints: ['api.example.com', 'backup.example.com'],
          },
        };
        const toon = encoder.encode(data);
        const parsed = parser.parse(toon);
        expect(parsed).toEqual(data);
      });
    });
  });
});
