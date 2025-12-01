- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - TypeScript library for TOON parser
- [x] Scaffold the Project - Created TypeScript project structure
- [x] Customize the Project - Added TOON parser implementation
- [x] Install Required Extensions - No extensions required
- [x] Compile the Project - Successfully built and tested
- [x] Create and Run Task - Library project, no task needed
- [x] Launch the Project - Library project, no launch needed
- [x] Ensure Documentation is Complete - README.md created

## Project Information

This is a TypeScript library (v1.1) for parsing, encoding, validating, and streaming TOON format files.

### Project Structure
- `src/` - Source code
  - `index.ts` - Main entry point
  - `parser.ts` - ToonParser class implementation
  - `encoder.ts` - ToonEncoder class implementation
  - `validator.ts` - ToonValidator class implementation
  - `schema.ts` - SchemaValidator for data validation
  - `stream-parser.ts` - Streaming parsers for large files
  - `cli.ts` - Command-line interface
  - `types.ts` - TypeScript type definitions
  - `parsers/` - Parser utilities (array-parser, path-expander)
  - `encoders/` - Encoder utilities (value-encoder)
  - `utils/` - Shared utilities (parse-utils, string-utils)
  - `__tests__/` - Test files (180 tests, 100% passing)
- `dist/` - Compiled JavaScript output
  - `cjs/` - CommonJS build with source maps
  - `esm/` - ES Module build with source maps
  - `umd/` - Browser UMD bundle with source maps
- `scripts/` - Build scripts (minify.js, fix-esm.js)
- Configuration files for TypeScript, Vitest, ESLint, Prettier, and Rollup

### Available Commands
- `npm run build` - Full build (CJS + ESM + UMD + minification)
- `npm run build:cjs` - Build CommonJS version
- `npm run build:esm` - Build ES Module version
- `npm run build:umd` - Build UMD browser bundle
- `npm run minify` - Minify all builds with source maps
- `npm test` - Run all tests with Vitest (180 tests)
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `npx tsx benchmark.ts` - Run core performance benchmarks
- `npx tsx benchmark-v1.1.ts` - Run v1.1 feature benchmarks
- `toon-parser --help` - Use CLI tool (after build)

### Features (v1.1)

#### Core Features
- **ToonParser**: Parse TOON format to JSON with strict/non-strict modes
- **ToonEncoder**: Encode JSON to TOON with custom formatting options
- **ToonValidator**: Validate TOON content with detailed error reporting

#### New in v1.1
- **CLI Tool**: `toon-parser` command for TOON ↔ JSON conversion
- **Browser UMD Bundle**: Pre-built bundle for browser usage
- **Streaming Parser**: Memory-efficient parsing for large files
  - `ToonStreamParser` - For single large documents
  - `ToonLineParser` - For NDJSON-style files
  - `parseStream()` and `parseFile()` helpers
- **Schema Validation**: Type and constraint validation
  - Type checking, string/number constraints
  - Enum, pattern, custom validators
  - Nested object and array validation
- **Custom Formatting**: Extensive encoder options
  - Line endings (LF/CRLF), sorted keys
  - Trailing newlines, custom indentation
  - Multiple delimiters (comma, tab, pipe)
- **Source Maps**: All minified builds include source maps

### Test Coverage
- **180 tests** across 5 test suites
- **100% passing**
- Test files:
  - `parser.test.ts` - 127 tests
  - `validator.test.ts` - 27 tests
  - `schema.test.ts` - 11 tests
  - `stream-parser.test.ts` - 6 tests
  - `formatting.test.ts` - 9 tests

### Performance
- Simple objects: ~0.002ms
- Complex objects: ~0.018ms
- Large arrays (100 rows): ~0.040ms
- Schema validation: ~0.002ms
- 1000-item arrays: ~0.440ms
- See PERFORMANCE-V1.1.md for details

### Development Guidelines
- This is a library project that exports multiple modules
- Full TOON v3.0 specification compliance
- Tree-shakeable exports (import only what you need)
- TypeScript-first with complete type definitions
- Zero runtime dependencies
- All code must pass lint and tests before commit
- Use Vitest for testing (not Jest)
- Minified builds auto-generate source maps
