# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-01

### Added

#### CLI Tool
- **Command-line interface** for TOON ↔ JSON conversion
- `toon-parser` binary command installed globally with package
- Support for input/output files or stdin/stdout
- Auto-format detection from file extension
- Options: `--pretty`, `--strict`, `--format`, `--input`, `--output`
- Built-in help and version commands

#### Browser Support
- **UMD bundle** for browser usage without bundlers
- `dist/umd/toon-parser.js` - Full UMD build
- `dist/umd/toon-parser.min.js` - Minified UMD build
- Global `ToonParser` namespace for browser environments
- Rollup-based bundling with tree-shaking

#### Streaming Parser
- **ToonStreamParser** class for large file processing
- **ToonLineParser** class for NDJSON-style line-by-line parsing
- `parseStream()` helper function for stream-based parsing
- `parseFile()` helper function for file-based parsing
- Memory-efficient chunk-based processing (configurable chunk size)
- Promise-based async API

#### Schema Validation
- **SchemaValidator** class for comprehensive data validation
- Type checking: string, number, boolean, null, array, object
- String constraints: minLength, maxLength, pattern (regex)
- Number constraints: min, max
- Enum validation for allowed value sets
- Union type support (multiple allowed types)
- Nested object and array validation
- Custom validator functions
- Detailed error reporting with paths

#### Custom Formatting Options
- `lineEnding`: Choose between Unix (`\n`) or Windows (`\r\n`) style
- `sortKeys`: Alphabetically sort object keys
- `trailingNewline`: Add trailing newline to output
- `maxLineLength`: Control line wrapping threshold
- `compact`: Minimize whitespace in output
- `preserveKeyOrder`: Keep original key order (default: true)
- Multiple delimiter support: comma, tab, pipe
- Configurable indentation size

#### Build Improvements
- **Source maps** for all minified builds (`.min.js.map`)
- Better debugging experience in browsers and Node.js
- Clean build script to remove dist before building
- Improved error reporting with original source locations

### Changed
- Increased test coverage from 49 to **180 tests** (267% increase)
- Added 5 new test suites (formatting, schema, stream-parser)
- Updated documentation with v1.1 features
- Enhanced package exports with new modules
- Improved .npmignore to exclude test files and dev artifacts

### Performance
- Schema validation: **0.002ms** per validation (negligible overhead)
- Streaming parser: **0.056ms** overhead for small files
- Sorted keys encoding: **0.008ms** (6ms overhead for sorting)
- Large arrays (1000 items): **0.440ms** encoding, **0.413ms** parsing
- No performance regressions from v1.0

### Package Size
- Full bundle with all features: ~15KB minified (was 10KB)
- Tree-shakeable: Import only what you need
- Parser-only: Still 6.2KB (unchanged if you don't import new features)
- 139 files in published package (excludes tests and dev files)

### Documentation
- Added `FEATURES-V1.1.md` - Comprehensive feature documentation
- Added `PERFORMANCE-V1.1.md` - v1.1 performance benchmarks
- Updated `SHIPPING.md` with completed enhancements
- Updated `.github/copilot-instructions.md` with v1.1 info
- Added `browser-test.html` for browser testing

### Migration Notes
- **100% backward compatible** with v1.0
- No breaking changes
- All new features are opt-in
- Existing v1.0 code works identically in v1.1

## [1.0.0] - 2025-11-28

### Added
- **Full TOON v3.0 Specification Compliance**
  - Complete parser with all TOON v3.0 features
  - Complete encoder with all TOON v3.0 features
  - **Validator with detailed error reporting** (new!)
  - Strict mode validation with comprehensive error messages
  - Support for tabular arrays with `{field1,field2}` syntax
  - Support for inline arrays with comma/tab/pipe delimiters
  - Support for list arrays with `-` prefix syntax
  - Multiple delimiter support (comma, tab, pipe)
  - Path expansion for dotted keys (optional, 'safe' mode)
  - Canonical number formatting (no exponents, no trailing zeros)

- **TypeScript Support**
  - Full TypeScript definitions included
  - Strict type checking enabled
  - Type exports for all public APIs and options
  - Dual CJS/ESM builds with proper typings

- **Testing & Quality**
  - 154 comprehensive tests with 100% specification coverage
  - 27 dedicated validator tests
  - 127 parser and encoder tests (including 78 edge cases)
  - Vitest 2.0 testing framework
  - Tests for all TOON features and edge cases
  - ESLint with TypeScript support
  - Prettier code formatting

- **Performance Optimizations** (20% overall improvement)
  - **Phase 1**: Cached regex patterns (5-10% improvement)
  - **Phase 2**: CharCode-based character checks
  - **Phase 3**: String builder pattern with fast-path for unescaping
  - **Phase 4**: Array pre-allocation for tabular parsing
  - **Phase 5**: V8-optimized object creation patterns

- **Bundle Optimization**
  - **Tree-shaking support**: `"sideEffects": false` enables aggressive optimization
  - **Dual builds**: CommonJS + ES Modules for maximum compatibility
  - **Minification**: Terser with 2-pass compression (52-66% size reduction)
  - **Modular imports**: Parser-only or encoder-only saves ~40% bundle size
  - **Production builds**: Separate .min.js files available via `/min` import

- **Code Organization**
  - Refactored from 2 large files (671 + 386 lines) into 9 focused modules
  - Average module size: 142 lines
  - Organized structure: `utils/`, `parsers/`, `encoders/` directories
  - Improved maintainability without sacrificing performance

- **Documentation**
  - Comprehensive README with usage examples
  - Performance documentation (`PERFORMANCE.md`) with benchmark results
  - Refactoring documentation (`REFACTORING.md`) explaining architecture
  - API documentation for all public methods
  - TOON format syntax guide with examples

### Features
- Parse TOON format to JSON
- Encode JSON to TOON format
- Validate TOON content
- Configurable indentation (default: 2 spaces)
- Configurable delimiters (comma, tab, pipe)
- Strict validation mode (default: enabled)
- Round-trip encoding/decoding with data integrity

### Performance Benchmarks

1000 iterations average:
- Parse simple object: **0.002ms**
- Parse tabular array (100 rows): **0.040ms** (20% faster than initial)
- Encode tabular array (100 rows): **0.043ms** (10% faster than initial)
- Round-trip tabular: **0.075ms** (16% faster than initial)

### Bundle Sizes

- **Full bundle**: 10KB minified (CJS/ESM)
- **Parser only**: 6.2KB minified (38% savings)
- **Encoder only**: 6.0KB minified (40% savings)
- **Minification**: 52-66% size reduction across all modules

### Module Breakdown

| Module | Purpose | Size (minified) |
|--------|---------|-----------------|
| parser.ts | Main parser class | 1.7KB (CJS), 1.4KB (ESM) |
| encoder.ts | Main encoder class | 1.4KB (CJS), 1.1KB (ESM) |
| array-parser.ts | Array parsing logic | 3.3KB (CJS), 2.6KB (ESM) |
| value-encoder.ts | Value encoding logic | 2.1KB (CJS), 1.6KB (ESM) |
| Others | Utilities and types | ~1.5KB combined |
