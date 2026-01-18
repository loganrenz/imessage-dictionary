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

/**
 * Generate an OG image for a specific sense (definition) of a word entry
 * @param {Object} entry - The dictionary entry
 * @param {Object} sense - The specific sense to render
 * @param {number} senseIndex - Index of the sense (0-based)
 * @param {string} outputPath - Path to write the image
 * @returns {boolean} - Whether the image was generated successfully
 */
function generateOGImage(entry, sense, senseIndex, outputPath) {
  // Validate sense has required data
  if (!sense || !sense.gloss) {
    console.warn(`Skipping ${entry.term} sense ${senseIndex}: missing required sense data`);
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
  ctx.fillText(entry.term, 600, 100);

  // Part of speech
  if (sense.pos) {
    ctx.fillStyle = '#c5914a';
    ctx.font = '600 28px sans-serif';
    ctx.fillText(sense.pos.toUpperCase(), 600, 220);
  }

  // Definition - Make it significantly more readable with larger, bold text
  const gloss = sense.gloss;
  ctx.fillStyle = '#1e2f50';
  ctx.font = 'bold 52px sans-serif';  // Increased from 32px to 52px and made bold
  ctx.textAlign = 'center';
  
  const maxWidth = 1050;
  const lineHeight = 68;  // Increased line height for larger text
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
    
    if (lines.length >= 2) break;  // Reduced to 2 lines to fit larger text
  }
  
  if (currentLine && lines.length < 2) {
    lines.push(currentLine);
  }
  
  // If we had to truncate, add ellipsis properly at word boundary
  if (lines.length === 2) {
    const fullText = lines.join(' ');
    if (!gloss.startsWith(fullText)) {
      // Text was truncated, ensure ellipsis looks good
      lines[1] = lines[1].trim() + '...';
    }
  }

  const startY = sense.pos ? 280 : 240;
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

  console.log('Generating OG images for all definitions...');
  console.log(`Output directory: ${ogDir}`);
  
  // Generate images for all entries and all senses
  let imageCount = 0;
  let skipped = 0;
  let termsProcessed = 0;
  
  for (const entry of SEED_DATA) {
    if (!entry.senses || entry.senses.length === 0) {
      console.warn(`Skipping ${entry.term}: no senses defined`);
      skipped++;
      continue;
    }
    
    termsProcessed++;
    
    // Generate an OG image for each sense (definition)
    for (let senseIndex = 0; senseIndex < entry.senses.length; senseIndex++) {
      const sense = entry.senses[senseIndex];
      
      // For the first sense (index 0), use the original filename: term.png
      // For additional senses, use: term-1.png, term-2.png, etc. (1-indexed for user-friendliness)
      let filename;
      if (senseIndex === 0) {
        filename = `${entry.term}.png`;
      } else {
        filename = `${entry.term}-${senseIndex}.png`;
      }
      
      const outputPath = join(ogDir, filename);
      try {
        const success = generateOGImage(entry, sense, senseIndex, outputPath);
        if (success) {
          console.log(`Generated: ${outputPath}`);
          imageCount++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error generating image for ${entry.term} sense ${senseIndex}:`, error.message);
        skipped++;
      }
    }
  }
  
  console.log(`\nSuccessfully generated ${imageCount} OG images for ${termsProcessed} terms`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} senses due to errors or missing data`);
  }
}

main();
