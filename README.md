# Free Dictionary - iMessage-Optimized Link Previews

A production-ready dictionary web app that generates beautiful Open Graph images for iMessage sharing. When you share a word link, the preview shows a large, readable definition card directly in the message thread—no tap required.

## Features

- 🔍 **Fast Search** - Prefix and substring matching across 200+ word entries
- 📱 **iMessage-Optimized** - Rich Open Graph images (1200×630px) with high-contrast typography
- 🎨 **Beautiful Design** - Scholarly aesthetic with Crimson Pro serif and Inter sans-serif fonts
- 📖 **Word Pages** - Clean, readable definitions with part of speech, examples, and attribution
- 🎲 **Random Discovery** - Explore words serendipitously
- 👨‍💼 **Admin Interface** - Add/update entries without code deploys
- 💾 **Persistent Storage** - Custom entries saved using Spark KV storage
- 📋 **One-Tap Sharing** - Copy link or use Web Share API on iOS

## Live Demo

Visit the app and try sharing a word:
- Home: `/#/`
- Example word: `/#/w/serendipity`
- OG Image preview: `/#/og/serendipity.png`
- Attribution: `/#/attribution`
- Admin: `/#/admin`

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Components**: shadcn/ui v4 (Radix UI primitives)
- **Styling**: Tailwind CSS v4
- **Fonts**: Crimson Pro (serif), Inter (sans-serif), JetBrains Mono (mono)
- **Icons**: Phosphor Icons
- **Notifications**: Sonner
- **Storage**: Spark KV (key-value persistence)
- **Deployment**: Vercel-ready (or any static host)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spark-template
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
Create a `.env` file in the root:
```env
VITE_ADMIN_TOKEN=your-secure-admin-password
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn components (40+ pre-installed)
│   ├── HomePage.tsx     # Search and word discovery
│   ├── WordPage.tsx     # Word definition display
│   ├── OGImagePage.tsx  # Open Graph image generator
│   ├── AttributionPage.tsx # Licensing information
│   └── AdminPage.tsx    # Content management interface
├── lib/
│   ├── dictionary.ts    # Dictionary data and search logic
│   ├── types.ts         # TypeScript interfaces
│   └── utils.ts         # Utility functions
├── App.tsx              # Main app with routing
├── index.css            # Theme configuration
└── main.tsx             # App entry point
```

## How It Works

### Routing

The app uses hash-based routing for compatibility with static hosting:

- `/` - Home page with search
- `/w/[term]` - Word definition page
- `/og/[term].png` - Open Graph image preview
- `/attribution` - Licensing information
- `/admin` - Admin interface (password protected)

### Open Graph Images

When a word page loads (e.g., `/w/serendipity`), the app:

1. Sets Open Graph meta tags in the `<head>`
2. Points `og:image` to `/og/serendipity.png`
3. The OG image route renders a 1200×630px canvas with:
   - Large, bold word title (Crimson Pro Bold 96px)
   - Part of speech label (Inter Medium 24px)
   - Definition text (Crimson Pro Regular 32px, max 3 lines)
   - Attribution footer (Inter Regular 16px)

**Important for iMessage**: Social platforms cache OG images aggressively. When testing:
- Share the full URL (not just `localhost`)
- Use a unique word each time during development
- Or clear iMessage cache by restarting the app

### Data Model

Each dictionary entry follows this schema:

```typescript
interface DictionaryEntry {
  term: string                    // Normalized lowercase
  senses: Array<{
    pos?: string                  // Part of speech (noun, verb, etc.)
    gloss: string                 // Definition text
    example?: string              // Example sentence
  }>
  source: string                  // Data source name
  sourceUrl?: string              // Optional URL
  license: string                 // License identifier
  updatedAt: string               // ISO timestamp
}
```

### Storage

- **Seed Data**: 200+ words in `src/lib/dictionary.ts` (static, fast)
- **Custom Entries**: Stored in Spark KV under key `custom-entries`
- **Session**: Admin authentication uses `sessionStorage`

The app merges seed data with custom entries for search and display.

## Admin Interface

### Accessing Admin

1. Navigate to `/#/admin`
2. Enter the admin token (default: `demo-admin-token`)
3. Add or update entries

### Setting Admin Token

**Development**:
Set `VITE_ADMIN_TOKEN` in `.env`:
```env
VITE_ADMIN_TOKEN=your-secure-password
```

**Production (Vercel)**:
Add environment variable in project settings:
- Key: `VITE_ADMIN_TOKEN`
- Value: Your secure password

### Managing Entries

The admin interface allows you to:
- Add new dictionary entries
- Update existing entries (by term)
- View all custom entries
- Set source and license for each entry

Custom entries are stored persistently and merged with seed data.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables:
   - `VITE_ADMIN_TOKEN` (your admin password)
4. Deploy

The build configuration is already set up in `vite.config.ts`.

### Other Static Hosts

The app works with any static hosting service:
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

Just run `npm run build` and deploy the `dist/` directory.

### Environment Variables

- `VITE_ADMIN_TOKEN` - Admin interface password (required for production)

## Customizing the Theme

### Colors

Edit `src/index.css` to change the color palette:

```css
:root {
  --background: oklch(0.96 0.015 85);      /* Warm cream */
  --foreground: oklch(0.28 0.05 250);      /* Deep navy */
  --primary: oklch(0.28 0.05 250);         /* Deep navy */
  --accent: oklch(0.72 0.15 75);           /* Amber */
  /* ... more colors */
}
```

### Fonts

Change fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet">
```

Then update the CSS in `src/index.css`:

```css
@theme {
  --font-serif: 'Your Font', serif;
}
```

### OG Image Design

Modify the canvas rendering in `src/components/OGImagePage.tsx`:
- Dimensions: 1200×630 (optimal for social sharing)
- Adjust font sizes, colors, and layout
- Test at thumbnail size for mobile readability

## Data Sources & Licensing

### Current Dataset

The app ships with 200+ demo definitions for demonstration purposes.
- **Source**: Demo Dataset
- **License**: CC BY-SA 4.0

### Adding Real Dictionary Data

To integrate real dictionary data:

1. **Wiktionary** - Parse Wiktextuary XML dumps
2. **WordNet** - Use Princeton WordNet database
3. **Custom API** - Modify `src/lib/dictionary.ts` to fetch from your API

Make sure to:
- Respect source licenses
- Display attribution on word pages
- Include source info in OG images
- Update `/attribution` page

## Performance Optimization

### Caching Strategy

For production, add these headers to your hosting config:

**Word pages** (`/w/*`):
```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

**OG images** (`/og/*`):
```
Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```

**Static assets**:
```
Cache-Control: public, max-age=31536000, immutable
```

### Search Performance

- Seed data search is synchronous and fast (<5ms)
- Custom entries are loaded once and cached in memory
- Search results limited to 10 for instant display

### Image Generation

OG images render on-demand using Canvas API:
- Font loading may cause initial delay
- Images are cacheable by CDN/browser
- Consider pre-generating popular words

## API Reference

### Dictionary Functions

```typescript
// Synchronous (seed data only)
getAllEntries(): DictionaryEntry[]
getEntryByTerm(term: string): DictionaryEntry | undefined
searchEntries(query: string): DictionaryEntry[]
getRandomEntry(): DictionaryEntry

// Asynchronous (includes custom entries)
getAllEntriesAsync(): Promise<DictionaryEntry[]>
getEntryByTermAsync(term: string): Promise<DictionaryEntry | undefined>
searchEntriesAsync(query: string): Promise<DictionaryEntry[]>
```

### Spark KV

```typescript
// Store custom entries
await spark.kv.set('custom-entries', entries)

// Retrieve custom entries
const entries = await spark.kv.get<DictionaryEntry[]>('custom-entries')

// List all keys
const keys = await spark.kv.keys()

// Delete entries
await spark.kv.delete('custom-entries')
```

## Troubleshooting

### OG Images Not Showing in iMessage

- **Check URL**: Must be publicly accessible (not `localhost`)
- **Clear Cache**: iMessage caches aggressively; try a different word
- **Validate Tags**: Use [Open Graph Debugger](https://www.opengraph.xyz/)
- **Image Size**: Ensure canvas renders at exactly 1200×630px

### Admin Login Not Working

- **Check Token**: Verify `VITE_ADMIN_TOKEN` environment variable
- **Rebuild**: Vite env vars are compile-time, run `npm run build`
- **Browser Storage**: Clear `sessionStorage` if stuck

### Fonts Not Loading

- **Check Google Fonts**: Verify font names in `index.html`
- **CORS Issues**: Ensure fonts are served with proper headers
- **Fallbacks**: System fonts will be used if custom fonts fail

### Search Not Finding Words

- **Case Sensitivity**: Search is case-insensitive
- **Custom Entries**: May need async search for custom entries
- **Typos**: No fuzzy matching yet, must match substring

## Contributing

To add more seed data:

1. Edit `src/lib/dictionary.ts`
2. Add entries to `SEED_DATA` array
3. Follow the `DictionaryEntry` interface
4. Set proper source and license
5. Test search and OG image generation

## License

Application code: See LICENSE file
Dictionary content: Varies by source (see Attribution page)

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the PRD.md for design decisions

---

**Built with GitHub Spark** - Production-ready micro-apps in minutes.
