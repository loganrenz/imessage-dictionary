// This script extracts dictionary data from the TypeScript source and exports it as JSON

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dictionaryPath = join(__dirname, '..', 'src', 'lib', 'dictionary.ts');
const outputPath = join(__dirname, 'dictionary-data.json');

const content = readFileSync(dictionaryPath, 'utf8');

// Extract only the SEED_DATA array, ignoring functions
const seedDataMatch = content.match(/const SEED_DATA[\s\S]*?= (\[[\s\S]*?\n\])\s*(?:export function|$)/);

if (!seedDataMatch) {
  console.error('Could not extract SEED_DATA array');
  process.exit(1);
}

let arrayContent = seedDataMatch[1];

// Clean up for JavaScript execution
arrayContent = arrayContent
  // Replace new Date().toISOString() with a static date
  .replace(/new Date\(\)\.toISOString\(\)/g, '"2024-01-01T00:00:00.000Z"');

// Create code to execute
const code = `const SEED_DATA = ${arrayContent}; SEED_DATA;`;

try {
  const data = vm.runInNewContext(code, { Date });
  
  if (!data || !Array.isArray(data)) {
    throw new Error('SEED_DATA is not an array');
  }
  
  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Exported ${data.length} dictionary entries to ${outputPath}`);
} catch (err) {
  console.error('Failed to extract dictionary data:', err.message);
  process.exit(1);
}
