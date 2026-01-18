# OG Image Generation - Technical Documentation

## Problem
The application was generating Open Graph (OG) images client-side using HTML Canvas in React components at hash routes (e.g., `/#/og/serendipity.png`). Social media crawlers, including iMessage, don't execute JavaScript, so they couldn't see these dynamically generated images. This prevented beautiful dictionary definition previews from appearing when links were shared in iMessage and other platforms.

## Solution
Implemented a build-time pre-generation system that creates static PNG files for all dictionary entries.

### Architecture

#### 1. Data Export Script (`scripts/export-dictionary-data.js`)
- Extracts SEED_DATA from TypeScript source file
- Uses Node.js VM module for safe code execution
- Removes TypeScript annotations and converts to JSON
- Outputs to `scripts/dictionary-data.json`

#### 2. Image Generation Script (`scripts/generate-og-images.js`)
- Loads dictionary data from exported JSON
- Uses `node-canvas` to render images server-side
- Generates 1200×630px PNG files for each entry
- Outputs to `public/og/` directory
- Includes error handling and data validation

#### 3. Build Integration
- `prebuild` script runs both export and generation
- Vite automatically copies `public/` to `dist/`
- Generated files excluded from git via `.gitignore`

#### 4. Client Updates (`src/components/WordPage.tsx`)
- Meta tags now point to static paths: `/og/[term].png`
- Removed hash-based routing for OG images
- Crawlers can now fetch actual PNG files

### File Structure
```
project/
├── scripts/
│   ├── export-dictionary-data.js    # Extract TS data to JSON
│   ├── generate-og-images.js        # Generate PNG files
│   └── dictionary-data.json         # Temporary JSON (gitignored)
├── public/
│   └── og/                          # Generated images (gitignored)
│       ├── serendipity.png
│       ├── eloquent.png
│       └── ... (200 images)
└── dist/
    └── og/                          # Images copied here on build
        └── ...
```

### Image Specifications
- **Dimensions**: 1200×630px (optimal for social sharing)
- **Format**: PNG with RGBA
- **Layout**:
  - Background: Warm cream (#f5f3f0)
  - Word title: Deep navy (#1e2f50), bold 96px
  - Part of speech: Amber (#c5914a), 24px uppercase
  - Definition: Deep navy, 32px, max 3 lines with ellipsis
  - Attribution: Gray footer with source and license

### Build Process
1. **Pre-build**: Export data → Generate images
2. **Build**: TypeScript compilation → Vite bundling
3. **Output**: Static site with pre-generated OG images

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
- Generates 200 images in ~5 seconds
- Total image size: ~8.5MB for 200 images
- Average image size: ~42KB per image
- No runtime performance impact (pre-generated)

### Maintenance
- Images regenerated on every build
- No manual updates required
- Add new words → automatically get OG images
- Update styles → edit generation script once

### Testing Checklist
- [x] All 200 images generated successfully
- [x] Images have correct dimensions (1200×630)
- [x] Build process completes without errors
- [x] Images accessible via HTTP
- [x] Meta tags point to correct paths
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
- Works with any static hosting (Vercel, Netlify, etc.)
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
