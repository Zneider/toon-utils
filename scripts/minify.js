/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function minifyFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const result = await minify(code, {
    module: filePath.includes('/esm/'),
    compress: {
      passes: 2,
      pure_getters: true,
      unsafe: true,
      unsafe_math: true,
      unsafe_methods: true,
    },
    mangle: {
      properties: false,
    },
    format: {
      comments: false,
    },
    sourceMap: {
      filename: path.basename(filePath),
      url: path.basename(filePath).replace('.js', '.min.js.map'),
    },
  });

  if (result.code) {
    const minPath = filePath.replace('.js', '.min.js');
    const mapPath = minPath + '.map';
    
    fs.writeFileSync(minPath, result.code);
    
    if (result.map) {
      fs.writeFileSync(mapPath, result.map);
    }
    
    const original = fs.statSync(filePath).size;
    const minified = fs.statSync(minPath).size;
    const savings = ((1 - minified / original) * 100).toFixed(1);
    console.log(`✓ ${path.basename(minPath)}: ${original} → ${minified} bytes (${savings}% smaller)`);
  }
}

async function minifyDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '__tests__') {
      await minifyDirectory(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.min.js') && file !== 'package.json') {
      await minifyFile(filePath);
    }
  }
}

async function main() {
  console.log('Minifying CJS build...');
  await minifyDirectory(path.join(__dirname, '..', 'dist', 'cjs'));
  
  console.log('\nMinifying ESM build...');
  await minifyDirectory(path.join(__dirname, '..', 'dist', 'esm'));
  
  console.log('\n✓ Minification complete!');
}

main().catch(console.error);
