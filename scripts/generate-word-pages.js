// This script generates static HTML pages for each dictionary word with proper OG meta tags
// These pages allow social media crawlers (iMessage, Facebook, Twitter) to see correct previews
// while redirecting users to the SPA

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
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

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitize term for use as a directory/file name to prevent path traversal
function sanitizeFileName(term) {
  // Remove or replace dangerous characters
  return term
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/[\/\\]/g, '-') // Replace path separators
    .replace(/[<>:"|?*]/g, '-') // Replace invalid filename characters
    .trim();
}

function generateWordPage(entry) {
  // Validate entry has required data
  if (!entry.senses || entry.senses.length === 0 || !entry.senses[0].gloss) {
    console.warn(`Skipping ${entry.term}: missing required sense data`);
    return null;
  }

  const term = escapeHtml(entry.term);
  const description = escapeHtml(entry.senses[0].gloss);
  const title = `${term} — definition`;
  // URL encode the term, then HTML escape for safe use in HTML attributes and JavaScript
  const encodedTerm = escapeHtml(encodeURIComponent(entry.term));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    
    <!-- Open Graph meta tags for social sharing (iMessage, Facebook, Twitter, etc.) -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/og/${encodedTerm}.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="/og/${encodedTerm}.png" />
    
    <!-- Redirect to SPA after meta tags are read by crawlers -->
    <script>
      // Redirect to the SPA with the correct hash route
      window.location.replace('/#/w/${encodedTerm}');
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0;url=/#/w/${encodedTerm}" />
    </noscript>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background: #f5f3f0;
        color: #1e2f50;
      }
      .loading {
        text-align: center;
      }
      h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
      p {
        color: #72757e;
      }
    </style>
</head>
<body>
    <div class="loading">
        <h1>${term}</h1>
        <p>Loading definition...</p>
    </div>
</body>
</html>`;
}

function main() {
  // Create output directory
  const publicDir = join(__dirname, '..', 'public');
  const wordsDir = join(publicDir, 'w');
  
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  if (!existsSync(wordsDir)) {
    mkdirSync(wordsDir, { recursive: true });
  }

  console.log('Generating word pages with OG meta tags...');
  console.log(`Output directory: ${wordsDir}`);
  
  // Generate HTML pages for all entries
  let count = 0;
  let skipped = 0;
  
  for (const entry of SEED_DATA) {
    const html = generateWordPage(entry);
    if (!html) {
      skipped++;
      continue;
    }
    
    // Sanitize the term for use as a directory name
    const safeTerm = sanitizeFileName(entry.term);
    
    // Skip if sanitization resulted in empty string
    if (!safeTerm) {
      console.warn(`Skipping ${entry.term}: invalid characters in term`);
      skipped++;
      continue;
    }
    
    // Create a directory for each word with an index.html
    // This allows /w/serendipity to serve /w/serendipity/index.html
    const wordDir = join(wordsDir, safeTerm);
    if (!existsSync(wordDir)) {
      mkdirSync(wordDir, { recursive: true });
    }
    
    const outputPath = join(wordDir, 'index.html');
    try {
      writeFileSync(outputPath, html);
      console.log(`Generated: ${outputPath}`);
      count++;
    } catch (error) {
      console.error(`Error generating page for ${entry.term}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`\nSuccessfully generated ${count} word pages`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} entries due to errors or missing data`);
  }
}

main();
