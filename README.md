# TOON Utils

TypeScript utilities for parsing, encoding, and validating TOON (Token-Oriented Object Notation) format.

[![Bundle Size](https://img.shields.io/badge/bundle%20size-~10KB-brightgreen)](https://bundlephobia.com)
[![Tree Shakeable](https://img.shields.io/badge/tree%20shakeable-yes-brightgreen)](#tree-shaking)
[![Performance](https://img.shields.io/badge/performance-<0.1ms-brightgreen)](#performance)

TOON is a compact, human-readable encoding of the JSON data model designed for LLM prompts. It provides lossless serialization with minimal tokens and clear structure.

**Specification:** [TOON Format Specification v3.0](https://github.com/toon-format/spec)

## Installation

```bash
npm install toon-utils
```

## Features

- ✅ Full TOON v3.0 specification compliance
- ✅ Parser (TOON → JSON)
- ✅ Encoder (JSON → TOON)
- ✅ Validator with detailed error reporting
- ✅ Strict mode validation
- ✅ Tabular arrays for uniform object data
- ✅ Multiple delimiters (comma, tab, pipe)
- ✅ Path expansion (optional)
- ✅ TypeScript support with full type definitions

## Usage

### Parsing TOON

```typescript
import { ToonParser } from 'toon-utils';

const parser = new ToonParser();

// Parse simple object
const result = parser.parse('name: Alice\nage: 30');
// → { name: 'Alice', age: 30 }

// Parse array
const arr = parser.parse('tags[3]: javascript,typescript,node');
// → { tags: ['javascript', 'typescript', 'node'] }

// Parse tabular array
const tabular = parser.parse(`users[2]{id,name}:
  1,Alice
  2,Bob`);
// → { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }
```

### Validating TOON

```typescript
import { ToonValidator } from 'toon-utils';

const validator = new ToonValidator();

// Simple validation (boolean)
const isValid = validator.isValid('name: Alice');
// → true

// Detailed validation with errors
const result = validator.validate('items[3]: a,b');
// → {
//   valid: false,
//   errors: [{
//     line: 1,
//     code: 'ARRAY_LENGTH_MISMATCH',
//     message: 'Inline array length mismatch: expected 3, got 2',
//     context: 'items[3]: a,b'
//   }]
// }

// Validate and throw on error
try {
  const value = validator.validateOrThrow('items[3]: a,b');
} catch (error) {
  console.error(error.message);
  // → "Validation failed at line 1: Inline array length mismatch..."
}

// Get formatted validation report
const report = validator.getValidationReport('items[3]: a,b');
console.log(report);
// → ✗ Invalid TOON document
//   Error at line 1:
//     Code: ARRAY_LENGTH_MISMATCH
//     Message: Inline array length mismatch: expected 3, got 2
//     Context: items[3]: a,b

// Validate multiple documents
const results = validator.validateBatch([
  'name: Alice',
  'items[3]: a,b',
  'valid: true'
]);
// → [{ valid: true, ... }, { valid: false, ... }, { valid: true, ... }]
```

### Encoding to TOON

```typescript
import { ToonEncoder } from 'toon-utils';

const encoder = new ToonEncoder();

// Encode simple object
const toon = encoder.encode({ name: 'Alice', age: 30 });
// → "name: Alice\nage: 30"

// Encode array
const arr = encoder.encode({ tags: ['a', 'b', 'c'] });
// → "tags[3]: a,b,c"

// Encode tabular data
const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
};
const tabular = encoder.encode(data);
// → "users[2]{id,name}:\n  1,Alice\n  2,Bob"
```

### Options

#### Parser Options

```typescript
const parser = new ToonParser({
  indentSize: 2,        // Spaces per indentation level (default: 2)
  strict: true,         // Enable strict validation (default: true)
  expandPaths: 'safe',  // Path expansion: 'off' | 'safe' (default: 'off')
});
```

#### Validator Options

```typescript
const validator = new ToonValidator({
  indentSize: 2,        // Same as parser options
  strict: true,
  expandPaths: 'safe',
});
```

#### Encoder Options

```typescript
const encoder = new ToonEncoder({
  indentSize: 2,           // Spaces per level (default: 2)
  delimiter: ',',          // Document delimiter: ',' | '\t' | '|' (default: ',')
  keyFolding: 'safe',      // Key folding: 'off' | 'safe' (default: 'off')
  flattenDepth: Infinity,  // Max folding depth (default: Infinity)
});
```

## TOON Format Overview

### Objects

```
name: Alice
age: 30
```

### Nested Objects

```
user:
  name: Alice
  age: 30
```

### Arrays

```
tags[3]: javascript,typescript,node
```

### Tabular Arrays

```
users[2]{id,name,active}:
  1,Alice,true
  2,Bob,false
```

### List Arrays

```
items[3]:
  - first
  - second
  - third
```

### Escaping

Only five escape sequences are valid: `\\`, `\"`, `\n`, `\r`, `\t`

```
message: "Hello\nWorld"
path: "C:\\Program Files"
```

## API

### `ToonParser`

#### `parse(content: string): JsonValue`

Parse TOON content and return the corresponding JSON value.

**Throws:** Error if content is invalid and `strict` mode is enabled.

#### `validate(content: string): boolean`

Validate TOON content without parsing.

**Returns:** `true` if valid, `false` otherwise.

### `ToonEncoder`

#### `encode(value: JsonValue): string`

Encode a JSON value to TOON format.

**Returns:** TOON-formatted string.

### `ToonValidator`

#### `validate(content: string): ValidationResult`

Validate TOON content with detailed error reporting.

**Returns:** `ValidationResult` object with:
- `valid: boolean` - Whether the content is valid
- `errors: ValidationError[]` - List of validation errors
- `value?: JsonValue` - Parsed value if valid

#### `isValid(content: string): boolean`

Simple validation check.

**Returns:** `true` if valid, `false` otherwise.

#### `validateOrThrow(content: string): JsonValue`

Validate and throw if invalid.

**Returns:** Parsed value
**Throws:** Error with detailed validation message if invalid

#### `validateBatch(documents: string[]): ValidationResult[]`

Validate multiple TOON documents.

**Returns:** Array of `ValidationResult` objects.

#### `getValidationReport(content: string): string`

Get a human-readable validation report.

**Returns:** Formatted validation report string.

### Error Codes

The validator provides specific error codes:
- `ARRAY_LENGTH_MISMATCH` - Array length doesn't match declared length
- `INVALID_INDENTATION` - Indentation is not a multiple of indentSize
- `TAB_IN_INDENTATION` - Tab character found in indentation
- `INVALID_ESCAPE` - Invalid escape sequence in string
- `TABULAR_WIDTH_MISMATCH` - Tabular row doesn't match header width
- `PARSE_ERROR` - General parsing error

## Development

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Test in watch mode

```bash
npm run test:watch
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Tree Shaking

This library is fully tree-shakeable! Import only what you need:

```typescript
// Only import the parser (saves ~40% bundle size)
import { ToonParser } from 'toon-utils';

// Only import the encoder
import { ToonEncoder } from 'toon-utils';

// Import types without runtime overhead
import type { ToonParserOptions, JsonValue } from 'toon-utils';
```

Bundle sizes:
- **Full bundle**: ~10KB minified
- **Parser only**: ~6KB minified
- **Encoder only**: ~6KB minified

## Performance

The library is optimized for performance:

- **Simple object parsing**: ~0.002ms
- **100-row tabular array**: ~0.040ms
- **Round-trip (parse + encode)**: ~0.075ms

Optimizations:
- Cached regex patterns
- String builder pattern for escaping
- Pre-allocated arrays for tabular parsing
- CharCode-based character checks
- V8-optimized object creation

Run benchmarks:
```bash
npx tsx benchmark.ts
```

## Production Builds

For production use, you can import minified builds:

```typescript
// Use minified version (52-66% smaller)
import { ToonParser } from 'toon-utils/min';
```

## Specification

This library implements [TOON Format Specification v3.0](https://github.com/toon-format/spec).

Key features from the specification:
- Line-oriented, indentation-based syntax
- Explicit array lengths with `[N]` notation
- Tabular format for uniform object arrays with `{field1,field2}` syntax
- Delimiter scoping (comma, tab, pipe)
- Canonical number formatting (no exponents, no trailing zeros)
- Strict validation mode
- Path expansion for dotted keys (optional)

## License

MIT
