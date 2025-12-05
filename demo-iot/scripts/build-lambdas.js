const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const lambdas = ['command-handler', 'query-handler', 'event-processor'];
const distDir = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

lambdas.forEach(lambda => {
  const entryPoint = path.join(__dirname, '..', 'lambda', lambda, 'index.ts');
  const outFile = path.join(distDir, `${lambda}.js`);
  
  console.log(`Building ${lambda}...`);
  
  try {
    execSync(`npx esbuild ${entryPoint} --bundle --platform=node --target=node18 --outfile=${outFile} --external:@aws-sdk/*`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log(`✓ Built ${lambda}`);
  } catch (error) {
    console.error(`✗ Failed to build ${lambda}`);
    process.exit(1);
  }
});

console.log('\n✓ All lambdas built successfully!');
