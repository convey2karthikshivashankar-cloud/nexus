const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const lambdas = ['command-handler', 'query-handler', 'event-processor'];

// Ensure dist directories exist
lambdas.forEach(name => {
  const distDir = path.join(__dirname, '..', 'dist', 'lambda', name);
  fs.mkdirSync(distDir, { recursive: true });
});

// Build each lambda with esbuild
lambdas.forEach(name => {
  const entry = path.join(__dirname, '..', 'lambda', name, 'index.ts');
  const outfile = path.join(__dirname, '..', 'dist', 'lambda', name, 'index.js');
  
  console.log(`Building ${name}...`);
  execSync(`npx esbuild ${entry} --bundle --platform=node --target=node18 --outfile=${outfile} --external:@aws-sdk/*`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
});

console.log('All lambdas built successfully!');
