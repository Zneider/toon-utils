import { ToonParser } from './src/parser';
import { ToonEncoder } from './src/encoder';
import { SchemaValidator } from './src/schema';
import { parseStream } from './src/stream-parser';
import { Readable } from 'stream';

function benchmark(name: string, fn: () => void, iterations: number = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const avg = (end - start) / iterations;
  console.log(`${name}: ${avg.toFixed(3)}ms avg (${iterations} iterations)`);
}

async function asyncBenchmark(name: string, fn: () => Promise<void>, iterations: number = 100) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const end = performance.now();
  const avg = (end - start) / iterations;
  console.log(`${name}: ${avg.toFixed(3)}ms avg (${iterations} iterations)`);
}

const testData = `name: Alice
age: 30
email: alice@example.com
city: Portland`;

const testObj = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
  city: 'Portland'
};

const schema = {
  name: { type: 'string' as const, required: true },
  age: { type: 'number' as const, required: true },
  email: { type: 'string' as const, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  city: { type: 'string' as const }
};

console.log('=== V1.1 Feature Benchmarks ===\n');

// Schema validation
const validator = new SchemaValidator();
benchmark('Schema validation', () => validator.validate(testObj, schema), 1000);

// Custom formatting
const sortedEncoder = new ToonEncoder({ sortKeys: true });
benchmark('Encoder with sorted keys', () => sortedEncoder.encode(testObj), 1000);

const crlfEncoder = new ToonEncoder({ lineEnding: '\r\n', trailingNewline: true });
benchmark('Encoder with CRLF + trailing newline', () => crlfEncoder.encode(testObj), 1000);

// Streaming (async)
console.log('\n=== Streaming Benchmarks (async) ===\n');

(async () => {
  await asyncBenchmark('Stream parsing small data', async () => {
    const stream = Readable.from([testData]);
    await parseStream(stream);
  }, 100);

  const largeData = Array.from({ length: 100 }, (_, i) => 
    `item${i}: value${i}`
  ).join('\n');

  await asyncBenchmark('Stream parsing large data (100 items)', async () => {
    const stream = Readable.from([largeData]);
    await parseStream(stream);
  }, 100);

  console.log('\n=== Comparison: Standard vs New Features ===\n');
  
  const standardParser = new ToonParser();
  const strictParser = new ToonParser({ strict: true });
  
  benchmark('Standard parser', () => standardParser.parse(testData), 1000);
  benchmark('Strict parser', () => strictParser.parse(testData), 1000);
  
  const standardEncoder = new ToonEncoder();
  const fancyEncoder = new ToonEncoder({ 
    sortKeys: true, 
    lineEnding: '\r\n', 
    trailingNewline: true,
    indentSize: 4
  });
  
  benchmark('Standard encoder', () => standardEncoder.encode(testObj), 1000);
  benchmark('Fancy encoder (sorted+CRLF+4-space)', () => fancyEncoder.encode(testObj), 1000);

  console.log('\n=== Memory-Intensive Operations ===\n');
  
  const hugeArray = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`
  }));

  benchmark('Encode 1000-item array', () => standardEncoder.encode({ users: hugeArray }), 100);
  
  const hugeToon = standardEncoder.encode({ users: hugeArray });
  benchmark('Parse 1000-item array', () => standardParser.parse(hugeToon), 100);

  console.log('\n✅ All benchmarks complete!');
})();
