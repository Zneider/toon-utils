import { ToonParser } from './src/parser';
import { ToonEncoder } from './src/encoder';

function benchmark(name: string, fn: () => void, iterations: number = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const avg = (end - start) / iterations;
  console.log(`${name}: ${avg.toFixed(3)}ms avg (${iterations} iterations)`);
}

// Test data
const simpleObject = `name: Alice
age: 30
city: Portland`;

const nestedObject = `user:
  name: Alice
  age: 30
  address:
    street: 123 Main St
    city: Portland
    zip: 97201`;

const tabularArray = `users[100]{id,name,email}:
${Array.from({ length: 100 }, (_, i) => `  ${i + 1},User${i + 1},user${i + 1}@example.com`).join('\n')}`;

const listArray = `items[50]:
${Array.from({ length: 50 }, (_, i) => `  - Item ${i + 1}`).join('\n')}`;

const complexMixed = `users[20]{id,name}:
${Array.from({ length: 20 }, (_, i) => `  ${i + 1},User${i + 1}`).join('\n')}
products[30]:
${Array.from({ length: 30 }, (_, i) => `  - name: Product ${i + 1}\n    price: ${(i + 1) * 10}`).join('\n')}
metadata:
  version: "1.0"
  created: "2025-11-28"`;

const parser = new ToonParser();
const encoder = new ToonEncoder();

console.log('=== Parser Benchmarks ===\n');
benchmark('Parse simple object', () => parser.parse(simpleObject));
benchmark('Parse nested object', () => parser.parse(nestedObject));
benchmark('Parse tabular array (100 rows)', () => parser.parse(tabularArray));
benchmark('Parse list array (50 items)', () => parser.parse(listArray));
benchmark('Parse complex mixed', () => parser.parse(complexMixed));

console.log('\n=== Encoder Benchmarks ===\n');
const simpleObj = parser.parse(simpleObject);
const nestedObj = parser.parse(nestedObject);
const tabularObj = parser.parse(tabularArray);
const listObj = parser.parse(listArray);
const complexObj = parser.parse(complexMixed);

benchmark('Encode simple object', () => encoder.encode(simpleObj));
benchmark('Encode nested object', () => encoder.encode(nestedObj));
benchmark('Encode tabular array (100 rows)', () => encoder.encode(tabularObj));
benchmark('Encode list array (50 items)', () => encoder.encode(listObj));
benchmark('Encode complex mixed', () => encoder.encode(complexObj));

console.log('\n=== Round-trip Benchmarks ===\n');
benchmark('Round-trip simple', () => encoder.encode(parser.parse(simpleObject)));
benchmark('Round-trip nested', () => encoder.encode(parser.parse(nestedObject)));
benchmark('Round-trip tabular', () => encoder.encode(parser.parse(tabularArray)));
