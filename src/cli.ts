#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { ToonParser } from './parser';
import { ToonEncoder } from './encoder';

interface CliOptions {
  input?: string;
  output?: string;
  format: 'toon' | 'json';
  pretty?: boolean;
  strict?: boolean;
  help?: boolean;
  version?: boolean;
}

const VERSION = '1.1.0';

function showHelp(): void {
  console.log(`
TOON Parser CLI v${VERSION}

Usage:
  toon-parser [options]

Options:
  -i, --input <file>     Input file path (stdin if not provided)
  -o, --output <file>    Output file path (stdout if not provided)
  -f, --format <format>  Output format: 'toon' or 'json' (default: auto-detect)
  -p, --pretty           Pretty print JSON output
  -s, --strict           Use strict mode for TOON parsing
  -h, --help             Show this help message
  -v, --version          Show version number

Examples:
  # Convert TOON to JSON
  toon-parser -i input.toon -o output.json

  # Convert JSON to TOON
  toon-parser -i input.json -o output.toon

  # Use stdin/stdout
  cat input.toon | toon-parser -f json

  # Pretty print JSON
  toon-parser -i input.toon -f json -p

  # Strict parsing
  toon-parser -i input.toon -f json -s
`);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    format: 'json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-f':
      case '--format': {
        const format = args[++i];
        if (format !== 'toon' && format !== 'json') {
          throw new Error(`Invalid format: ${format}. Must be 'toon' or 'json'`);
        }
        options.format = format;
        break;
      }
      case '-p':
      case '--pretty':
        options.pretty = true;
        break;
      case '-s':
      case '--strict':
        options.strict = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function detectFormat(filePath: string): 'toon' | 'json' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.toon') return 'toon';
  if (ext === '.json') return 'json';
  
  // Try to read first few bytes to detect
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json';
  }
  return 'toon';
}

function readInput(inputPath?: string): string {
  if (inputPath) {
    return fs.readFileSync(inputPath, 'utf-8');
  }
  
  // Read from stdin
  const buffer = fs.readFileSync(0); // stdin
  return buffer.toString('utf-8');
}

function writeOutput(output: string, outputPath?: string): void {
  if (outputPath) {
    fs.writeFileSync(outputPath, output, 'utf-8');
  } else {
    process.stdout.write(output);
    if (!output.endsWith('\n')) {
      process.stdout.write('\n');
    }
  }
}

function convertToonToJson(toonContent: string, options: CliOptions): string {
  const parser = new ToonParser({ strict: options.strict });
  const result = parser.parse(toonContent);
  
  if (options.pretty) {
    return JSON.stringify(result, null, 2);
  }
  return JSON.stringify(result);
}

function convertJsonToToon(jsonContent: string): string {
  const data = JSON.parse(jsonContent);
  const encoder = new ToonEncoder();
  return encoder.encode(data);
}

function main(): void {
  try {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    if (options.help) {
      showHelp();
      process.exit(0);
    }

    if (options.version) {
      console.log(`v${VERSION}`);
      process.exit(0);
    }

    // Auto-detect format if input is provided and format not specified
    let inputFormat: 'toon' | 'json' = 'toon';
    if (options.input) {
      inputFormat = detectFormat(options.input);
    }

    // Determine output format (opposite of input if not specified)
    const outputFormat = options.format || (inputFormat === 'toon' ? 'json' : 'toon');

    // Read input
    const input = readInput(options.input);

    // Convert
    let output: string;
    if (inputFormat === 'toon' && outputFormat === 'json') {
      output = convertToonToJson(input, options);
    } else if (inputFormat === 'json' && outputFormat === 'toon') {
      output = convertJsonToToon(input);
    } else if (inputFormat === outputFormat) {
      // Same format, just validate and reformat
      if (inputFormat === 'toon') {
        const parser = new ToonParser({ strict: options.strict });
        const data = parser.parse(input);
        const encoder = new ToonEncoder();
        output = encoder.encode(data);
      } else {
        const data = JSON.parse(input);
        output = options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      }
    } else {
      throw new Error(`Cannot convert from ${inputFormat} to ${outputFormat}`);
    }

    // Write output
    writeOutput(output, options.output);

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred');
    }
    process.exit(1);
  }
}

main();
