# OG Image Generation - Technical Documentation

## Problem
The application was generating Open Graph (OG) images client-side using HTML Canvas in React components at hash routes (e.g., `/#/og/serendipity.png`). Social media crawlers, including iMessage, don't execute JavaScript, so they couldn't see these dynamically generated images. This prevented beautiful dictionary definition previews from appearing when links were shared in iMessage and other platforms.

## Solution
Implemented a build-time pre-generation system that creates:
1. Static PNG files for **every definition** (sense) in all dictionary entries
2. Static HTML pages with proper OG meta tags for each word and each definition

### Deployment Environment
**Primary:** Vercel Serverless - This app is designed for and optimized for Vercel's serverless deployment. The pre-generated static assets work well with Vercel's edge network and caching.

### Architecture

#### 1. Data Export Script (`scripts/export-dictionary-data.js`)
- Extracts SEED_DATA from TypeScript source file
- Uses Node.js VM module for safe code execution
- Removes TypeScript annotations and converts to JSON
- Outputs to `scripts/dictionary-data.json`

#### 2. Image Generation Script (`scripts/generate-og-images.js`)
- Loads dictionary data from exported JSON
- Uses `node-canvas` to render images server-side
- Generates 1200×630px PNG files for **each sense (definition)** of each entry
- Naming convention:
  - First sense: `term.png` (e.g., `articulate.png`)
  - Additional senses: `term-N.png` (e.g., `articulate-1.png` for second sense)
- Outputs to `public/og/` directory
- Includes error handling and data validation

#### 3. Word Page Generation Script (`scripts/generate-word-pages.js`)
- Generates static HTML pages for each dictionary word and each sense
- Includes proper OG meta tags that crawlers can read
- Redirects users to the SPA via JavaScript
- URL structure:
  - First sense: `/w/[term]/index.html` → redirects to `/#/w/[term]`
  - Additional senses: `/w/[term]/N/index.html` → redirects to `/#/w/[term]/N`

#### 4. Build Integration
- `prebuild` script runs all three generation steps
- Vite automatically copies `public/` to `dist/`
- Generated files excluded from git via `.gitignore`

#### 5. Client Updates (`src/components/WordPage.tsx`)
- Meta tags now point to static paths: `/og/[term].png` or `/og/[term]-N.png`
- Supports sense-specific URLs: `/#/w/[term]` and `/#/w/[term]/N`
- Crawlers can now fetch actual PNG files for the specific definition being shared

### File Structure
```
project/
├── scripts/
│   ├── export-dictionary-data.js    # Extract TS data to JSON
│   ├── generate-og-images.js        # Generate PNG files for all senses
│   ├── generate-word-pages.js       # Generate HTML pages for all senses
│   └── dictionary-data.json         # Temporary JSON (gitignored)
├── public/
│   ├── og/                          # Generated images (gitignored)
│   │   ├── serendipity.png          # First sense
│   │   ├── articulate.png           # First sense (adjective)
│   │   ├── articulate-1.png         # Second sense (verb)
│   │   └── ... (207+ images)
│   └── w/                           # Generated word pages (gitignored)
│       ├── serendipity/index.html   # First sense page
│       ├── articulate/
│       │   ├── index.html           # First sense (adjective)
│       │   └── 1/index.html         # Second sense (verb)
│       └── ... (207+ pages)
└── dist/
    ├── og/                          # Images copied here on build
    └── w/                           # Word pages copied here on build
```

### How iMessage Link Previews Work

When a user shares a link like `https://example.com/w/serendipity`, iMessage:
1. Fetches the URL `/w/serendipity/` (served by `index.html`)
2. Reads the OG meta tags from the static HTML
3. Fetches the OG image from `/og/serendipity.png`
4. Displays a rich preview with the word, definition, and image

For words with multiple definitions, sharing a specific definition like `https://example.com/w/articulate/1`:
1. Fetches the URL `/w/articulate/1/` (served by `1/index.html`)
2. Reads the sense-specific OG meta tags (verb definition)
3. Fetches the OG image from `/og/articulate-1.png`
4. Displays a rich preview with that specific definition

The JavaScript redirect in the page then loads the full SPA for interactive use.

### Image Specifications
- **Dimensions**: 1200×630px (optimal for social sharing)
- **Format**: PNG with RGBA
- **Layout**:
  - Background: Warm cream (#f5f3f0)
  - Word title: Deep navy (#1e2f50), bold 96px
  - Part of speech: Amber (#c5914a), 28px semibold uppercase
  - Definition: Deep navy (#1e2f50), **bold 52px**, max 2 lines with ellipsis
  - Attribution: Gray footer with source and license

**Design Philosophy**: The definition text is designed to be as readable as the word title itself, ensuring that iMessage users can easily read the definition directly in the preview thumbnail without needing to open the link.

### Build Process
1. **Pre-build**: Export data → Generate images for all senses
2. **Build**: TypeScript compilation → Vite bundling
3. **Output**: Static site with pre-generated OG images for every definition

### Usage
```bash
# Development (manual generation)
npm run prebuild

# Production build (automatic)
npm run build

# Images accessible at
/og/serendipity.png
/og/eloquent.png
# etc...
```

### Error Handling
- Validates entry has senses with required data
- Skips entries with missing information
- Logs warnings for skipped entries
- Continues generation even if individual images fail
- Reports total generated and skipped counts

### Security
- Uses VM module instead of eval for safe code execution
- No arbitrary code execution from external sources
- All data from controlled TypeScript source
- CodeQL scan: 0 vulnerabilities

### Performance
- Generates 207+ images in ~5 seconds (includes multi-definition words)
- Total image size: ~9MB for all images
- Average image size: ~42KB per image
- No runtime performance impact (pre-generated)

### Maintenance
- Images regenerated on every build
- No manual updates required
- Add new words → automatically get OG images for all definitions
- Update styles → edit generation script once

### Testing Checklist
- [x] All images generated successfully (including multi-sense words)
- [x] All word pages generated successfully (including sense-specific pages)
- [x] Images have correct dimensions (1200×630)
- [x] Build process completes without errors
- [x] Images accessible via HTTP at `/og/[term].png` and `/og/[term]-N.png`
- [x] Word pages accessible via HTTP at `/w/[term]/` and `/w/[term]/N/`
- [x] Word pages contain correct OG meta tags for each sense
- [x] Word pages redirect to SPA for interactive use
- [x] Meta tags point to correct sense-specific image paths
- [x] Visual quality verified
- [x] No security vulnerabilities
- [ ] Manual test with iMessage (requires deployment)

### Future Enhancements
1. **Custom Fonts**: Load actual web fonts in node-canvas
2. **Dynamic Generation**: API endpoint for user-added words
3. **Image Optimization**: Compress PNGs for smaller file size
4. **CDN Integration**: Serve from CDN with long cache times
5. **Variations**: Generate different sizes for different platforms

### Deployment Notes

#### Vercel Serverless (Primary/Recommended)
This application is optimized for Vercel's serverless deployment environment:
- Static assets are automatically served from Vercel's edge network
- Zero-config deployment - just connect your GitHub repo
- Automatic builds run prebuild script which generates all OG images
- Environment variables can be configured in Vercel dashboard

**Vercel Configuration:**
```json
// vercel.json (optional - defaults work well)
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**Cache Headers (Vercel):**
Vercel automatically sets good cache headers. For custom control, use `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/og/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }
      ]
    }
  ]
}
```

#### Other Static Hosts
Also works with Netlify, Cloudflare Pages, AWS S3 + CloudFront, etc.
- Ensure prebuild runs in CI/CD pipeline
- Images must be included in deployment artifact
- Set appropriate cache headers for `/og/*.png`:
  ```
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  ```

### Troubleshooting

**Issue**: Images not generated
- Check `scripts/dictionary-data.json` exists
- Verify node-canvas dependencies installed
- Check console for extraction errors

**Issue**: Images not showing in deployment
- Verify `dist/og/` directory exists
- Check static file serving configuration
- Ensure prebuild ran in CI/CD

**Issue**: Meta tags not working
- Inspect page source in browser
- Verify image URLs are absolute paths
- Use Open Graph debugger tools

## References
- Open Graph Protocol: https://ogp.me/
- node-canvas: https://github.com/Automattic/node-canvas
- Social Media Image Sizes: https://sproutsocial.com/insights/social-media-image-sizes-guide/
