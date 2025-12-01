const fs = require('fs');
const path = require('path');

// Add package.json with "type": "module" to ESM directory
const esmDir = path.join(__dirname, '..', 'dist', 'esm');
const packageJson = {
  type: 'module'
};

fs.writeFileSync(
  path.join(esmDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Fix imports to add .js extensions
function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules') {
      fixImports(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix relative imports
      content = content.replace(
        /from ['"](\.[^'"]+)['"]/g,
        (match, p1) => {
          if (p1.endsWith('.js')) return match;
          return `from '${p1}.js'`;
        }
      );
      
      content = content.replace(
        /import\(['"](\.[^'"]+)['"]\)/g,
        (match, p1) => {
          if (p1.endsWith('.js')) return match;
          return `import('${p1}.js')`;
        }
      );
      
      fs.writeFileSync(filePath, content);
    }
  }
}

fixImports(esmDir);

console.log('✓ Added package.json to ESM output');
console.log('✓ Fixed ESM imports to include .js extensions');
