#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set up test environment
process.env.IEXEC_IN = join(__dirname, '../test-input');
process.env.IEXEC_OUT = join(__dirname, '../test-output');
process.env.NODE_ENV = 'test';

// Create test directories
mkdirSync(process.env.IEXEC_IN, { recursive: true });
mkdirSync(process.env.IEXEC_OUT, { recursive: true });

// Copy test data
const testData = JSON.parse(
  readFileSync(join(__dirname, '../tests/fixtures/testData.json'), 'utf8')
);

writeFileSync(
  join(process.env.IEXEC_IN, 'input.json'),
  JSON.stringify(testData, null, 2)
);

console.log('🚀 Starting local test...');
console.log(`Input: ${process.env.IEXEC_IN}/input.json`);
console.log(`Output: ${process.env.IEXEC_OUT}`);

// Import and run the app
import('../src/app.js').then(module => {
  module.default().then(result => {
    console.log('\n✅ Test completed successfully!');
    console.log('Results:');
    console.log(JSON.stringify(result, null, 2));
    
    // Display output files
    const outputFiles = ['output.json', 'detailed-report.json', 'summary.txt'];
    outputFiles.forEach(file => {
      const path = join(process.env.IEXEC_OUT, file);
      if (require('fs').existsSync(path)) {
        console.log(`\n📄 ${file}:`);
        console.log(require('fs').readFileSync(path, 'utf8').substring(0, 500) + '...');
      }
    });
    
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
});