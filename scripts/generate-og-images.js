import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load dictionary data from exported JSON
const dataPath = join(__dirname, 'dictionary-data.json');
let SEED_DATA;

try {
  const dataContent = readFileSync(dataPath, 'utf8');
  SEED_DATA = JSON.parse(dataContent);
  console.log(`Loaded ${SEED_DATA.length} dictionary entries`);
} catch (err) {
  console.error('Failed to load dictionary data:', err.message);
  console.error('Run: node scripts/export-dictionary-data.js first');
  process.exit(1);
}

function generateOGImage(entry, outputPath) {
  // Validate entry has required data
  if (!entry.senses || entry.senses.length === 0 || !entry.senses[0].gloss) {
    console.warn(`Skipping ${entry.term}: missing required sense data`);
    return false;
  }

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
  
  // If we had to truncate, add ellipsis properly at word boundary
  if (lines.length === 3) {
    const fullText = lines.join(' ');
    if (!gloss.startsWith(fullText)) {
      // Text was truncated, ensure ellipsis looks good
      lines[2] = lines[2].trim() + '...';
    }
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
  return true;
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
  let skipped = 0;
  for (const entry of SEED_DATA) {
    const filename = `${entry.term}.png`;
    const outputPath = join(ogDir, filename);
    try {
      const success = generateOGImage(entry, outputPath);
      if (success) {
        console.log(`Generated: ${outputPath}`);
        count++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error generating image for ${entry.term}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`\nSuccessfully generated ${count} OG images`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} entries due to errors or missing data`);
  }
}

main();
