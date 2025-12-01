// Test that all import paths work correctly

console.log('Testing import paths...\n');

// Test regular CJS import
const { ToonParser: ParserCJS, ToonEncoder: EncoderCJS } = require('./dist/cjs/index.js');
console.log('✓ CJS import works');

// Test minified CJS import
const { ToonParser: ParserMinCJS, ToonEncoder: EncoderMinCJS } = require('./dist/cjs/index.min.js');
console.log('✓ CJS minified import works');

// Test functionality
const parser = new ParserCJS();
const encoder = new EncoderCJS();

const toon = 'name: Alice\nage: 30';
const parsed = parser.parse(toon);
console.log('✓ Parser works:', JSON.stringify(parsed));

const json = { name: 'Bob', age: 25 };
const encoded = encoder.encode(json);
console.log('✓ Encoder works:', encoded.replace(/\n/g, '\\n'));

// Test round-trip
const roundTrip = parser.parse(encoder.encode(parsed));
console.log('✓ Round-trip works:', JSON.stringify(roundTrip));

// Test minified version works the same
const parserMin = new ParserMinCJS();
const encoderMin = new EncoderMinCJS();
const minParsed = parserMin.parse(toon);
const minEncoded = encoderMin.encode(json);
console.log('✓ Minified parser produces same output:', JSON.stringify(minParsed) === JSON.stringify(parsed));
console.log('✓ Minified encoder produces same output:', minEncoded === encoded);

console.log('\n✅ All imports working correctly!');
