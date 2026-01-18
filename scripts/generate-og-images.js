import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load dictionary data from the source file
const dictionaryPath = join(__dirname, '..', 'src', 'lib', 'dictionary.ts');
const dictionaryContent = readFileSync(dictionaryPath, 'utf8');

// Extract SEED_DATA array using a simple regex
// This is a workaround since we can't import TypeScript directly in Node.js
const seedDataMatch = dictionaryContent.match(/export const SEED_DATA: DictionaryEntry\[\] = (\[[\s\S]*?\n\])/);
if (!seedDataMatch) {
  console.error('Failed to extract SEED_DATA from dictionary.ts');
  process.exit(1);
}

// Convert TypeScript to JavaScript by removing type annotations and evaluating
let seedDataStr = seedDataMatch[1];
// Remove updatedAt lines since they use `new Date().toISOString()` which won't work in JSON
seedDataStr = seedDataStr.replace(/updatedAt: new Date\(\)\.toISOString\(\)/g, 'updatedAt: "2024-01-01T00:00:00.000Z"');

const SEED_DATA = eval(seedDataStr);

function generateOGImage(entry, outputPath) {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f5f3f0';
  ctx.fillRect(0, 0, 1200, 630);

  // Word title
  ctx.fillStyle = '#1e2f50';
  ctx.font = 'bold 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(entry.term, 600, 120);

  // Part of speech
  if (entry.senses[0].pos) {
    ctx.fillStyle = '#c5914a';
    ctx.font = '500 24px sans-serif';
    ctx.fillText(entry.senses[0].pos.toUpperCase(), 600, 240);
  }

  // Definition
  const gloss = entry.senses[0].gloss;
  ctx.fillStyle = '#1e2f50';
  ctx.font = '400 32px sans-serif';
  ctx.textAlign = 'center';
  
  const maxWidth = 1000;
  const lineHeight = 48;
  const words = gloss.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
    
    if (lines.length >= 3) break;
  }
  
  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }
  
  if (lines.length === 3 && !gloss.endsWith(lines[2])) {
    lines[2] = lines[2].substring(0, lines[2].length - 3) + '...';
  }

  const startY = entry.senses[0].pos ? 300 : 260;
  lines.forEach((line, index) => {
    ctx.fillText(line, 600, startY + index * lineHeight);
  });

  // Attribution footer
  ctx.fillStyle = '#72757e';
  ctx.font = '400 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Source: ${entry.source} • ${entry.license}`, 600, 580);

  // Write to file
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath}`);
}

function main() {
  // Create output directory
  const publicDir = join(__dirname, '..', 'public');
  const ogDir = join(publicDir, 'og');
  
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  if (!existsSync(ogDir)) {
    mkdirSync(ogDir, { recursive: true });
  }

  console.log('Generating OG images...');
  console.log(`Output directory: ${ogDir}`);
  
  // Generate images for all entries
  let count = 0;
  for (const entry of SEED_DATA) {
    const filename = `${entry.term}.png`;
    const outputPath = join(ogDir, filename);
    try {
      generateOGImage(entry, outputPath);
      count++;
    } catch (error) {
      console.error(`Error generating image for ${entry.term}:`, error);
    }
  }
  
  console.log(`\nSuccessfully generated ${count} OG images`);
}

main();
