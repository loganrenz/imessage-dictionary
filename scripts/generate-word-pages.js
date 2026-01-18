// This script generates static HTML pages for each dictionary word with proper OG meta tags
// These pages allow social media crawlers (iMessage, Facebook, Twitter) to see correct previews
// while redirecting users to the SPA
//
// For words with multiple definitions:
// - /w/[term]/ -> shows first definition (sense 0)
// - /w/[term]/1/ -> shows second definition (sense 1)
// - etc.

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

/**
 * Generate a word page for a specific sense (definition)
 * @param {Object} entry - The dictionary entry
 * @param {Object} sense - The specific sense to render
 * @param {number} senseIndex - Index of the sense (0-based)
 * @returns {string|null} - The HTML content or null if invalid
 */
function generateWordPage(entry, sense, senseIndex) {
  // Validate sense has required data
  if (!sense || !sense.gloss) {
    console.warn(`Skipping ${entry.term} sense ${senseIndex}: missing required sense data`);
    return null;
  }

  const term = escapeHtml(entry.term);
  const description = escapeHtml(sense.gloss);
  
  // Include part of speech in title if available
  const posLabel = sense.pos ? ` (${sense.pos})` : '';
  const title = `${term}${posLabel} — definition`;
  
  // URL encode the term, then HTML escape for safe use in HTML attributes and JavaScript
  const encodedTerm = escapeHtml(encodeURIComponent(entry.term));
  
  // Determine the OG image filename
  // For sense 0: term.png, for sense 1+: term-1.png, term-2.png, etc.
  let ogImageFilename;
  if (senseIndex === 0) {
    ogImageFilename = `${encodedTerm}.png`;
  } else {
    ogImageFilename = `${encodedTerm}-${senseIndex}.png`;
  }
  
  // Determine the SPA hash route
  // For sense 0: /#/w/term, for sense 1+: /#/w/term/1, /#/w/term/2, etc.
  let hashRoute;
  if (senseIndex === 0) {
    hashRoute = `/#/w/${encodedTerm}`;
  } else {
    hashRoute = `/#/w/${encodedTerm}/${senseIndex}`;
  }

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
    <meta property="og:image" content="/og/${ogImageFilename}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="/og/${ogImageFilename}" />
    
    <!-- Redirect to SPA after meta tags are read by crawlers -->
    <script>
      // Redirect to the SPA with the correct hash route
      window.location.replace('${hashRoute}');
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0;url=${hashRoute}" />
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

  console.log('Generating word pages with OG meta tags for all definitions...');
  console.log(`Output directory: ${wordsDir}`);
  
  // Generate HTML pages for all entries and all senses
  let pageCount = 0;
  let skipped = 0;
  let termsProcessed = 0;
  
  for (const entry of SEED_DATA) {
    if (!entry.senses || entry.senses.length === 0) {
      console.warn(`Skipping ${entry.term}: no senses defined`);
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
    
    termsProcessed++;
    
    // Create a directory for the word
    const wordDir = join(wordsDir, safeTerm);
    if (!existsSync(wordDir)) {
      mkdirSync(wordDir, { recursive: true });
    }
    
    // Generate a page for each sense (definition)
    for (let senseIndex = 0; senseIndex < entry.senses.length; senseIndex++) {
      const sense = entry.senses[senseIndex];
      const html = generateWordPage(entry, sense, senseIndex);
      
      if (!html) {
        skipped++;
        continue;
      }
      
      // For the first sense (index 0), use /w/term/index.html
      // For additional senses, use /w/term/1/index.html, /w/term/2/index.html, etc.
      let outputPath;
      if (senseIndex === 0) {
        outputPath = join(wordDir, 'index.html');
      } else {
        // Create subdirectory for additional senses
        const senseDir = join(wordDir, String(senseIndex));
        if (!existsSync(senseDir)) {
          mkdirSync(senseDir, { recursive: true });
        }
        outputPath = join(senseDir, 'index.html');
      }
      
      try {
        writeFileSync(outputPath, html);
        console.log(`Generated: ${outputPath}`);
        pageCount++;
      } catch (error) {
        console.error(`Error generating page for ${entry.term} sense ${senseIndex}:`, error.message);
        skipped++;
      }
    }
  }
  
  console.log(`\nSuccessfully generated ${pageCount} word pages for ${termsProcessed} terms`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} senses due to errors or missing data`);
  }
}

main();
