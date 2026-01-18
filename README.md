# Free Dictionary - iMessage-Optimized Link Previews

A production-ready dictionary web app that generates beautiful Open Graph images for iMessage sharing. When you share a word link, the preview shows a large, readable definition card directly in the message thread—no tap required.

## Features

- 🔍 **Fast Search** - Prefix and substring matching across a prebuilt index
- 📱 **iMessage-Optimized** - Server-rendered OG meta tags + on-demand OG images
- 🎨 **Beautiful Design** - Scholarly aesthetic with Crimson Pro serif and Inter sans-serif fonts
- 📖 **Word Pages** - Clean, readable definitions with part of speech, examples, and attribution
- 🎲 **Random Discovery** - Explore words serendipitously
- 👨‍💼 **Admin Interface** - Add/update entries without code deploys (local-only for now)
- 📦 **Build-Time Dataset** - Search index + sharded definitions in `public/data/`
- ⚡ **Vercel-Ready** - Serverless APIs, edge OG images, and SPA rewrites

## Live Demo Routes

- Home: `/`
- Example word: `/w/serendipity`
- OG Image preview: `/og/serendipity.png`
- Search API: `/api/search?q=serendipity`
- Word API: `/api/word?term=serendipity`
- Attribution: `/attribution`
- Admin: `/admin`

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Components**: shadcn/ui v4 (Radix UI primitives)
- **Styling**: Tailwind CSS v4
- **Fonts**: Crimson Pro (serif), Inter (sans-serif), JetBrains Mono (mono)
- **Icons**: Phosphor Icons
- **Notifications**: Sonner
- **Storage**: Spark KV (key-value persistence for admin entries)
- **Deployment**: Vercel-ready (serverless + edge)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd imessage-dictionary
```

2. Install dependencies:
```bash
npm install
```

3. Generate the dataset (fast path using the seed adapter):
```bash
npm run generate
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> For full-stack routing + serverless APIs locally, use `vercel dev` if you have the Vercel CLI installed.

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Sanity Checks

```bash
npm run sanity
```

This validates shard sizes, index integrity, and the sample API behavior.

## Project Structure

```
api/                 # Vercel serverless + edge functions
public/data/         # Generated dataset (index + shards)
scripts/             # Dataset generation & sanity checks
server/              # Shared dataset helpers (Node runtime)
src/                 # React app
```

## How It Works

### Routing (Unfurl-Friendly)

- The SPA uses **path-based routing** (`/w/[term]`), not hash routes.
- `vercel.json` rewrites `/w/*` to a serverless HTML wrapper that injects **OG meta tags**.
- The HTML wrapper also loads the SPA so the in-browser experience remains seamless.

### Dataset Pipeline (Fast Path)

- `scripts/generate-dataset.js` builds:
  - `public/data/index.json` — compact search index
  - `public/data/defs/*.json` — sharded definitions payloads
  - `public/data/meta.json` — version and source metadata
- For now, the seed adapter uses `scripts/dictionary-data.json` (the in-repo demo data).
- The output is deterministic and shard sizes are validated to stay under ~5MB.

### API Routes

- **`/api/search?q=`**: Searches the prebuilt index (prefix boosted over substring).
- **`/api/word?term=`**: Loads a single entry from the relevant shard.

These endpoints cache results in-memory for speed.

### Open Graph Images

- **`/og/[term].png`** (or `/og/[term]-N.png` for sense N) is generated **on-demand**.
- Implemented with `@vercel/og` and cached aggressively at the edge.
- Falls back gracefully if the word is missing.

### Data Model

Each dictionary entry follows this schema:

```typescript
interface DictionaryEntry {
  term: string                    // Word to display
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

## Dataset Generation (GitHub Actions)

A workflow generates the dataset on demand and weekly:
- **Manual**: `workflow_dispatch`
- **Scheduled**: Weekly cron

The workflow runs `npm run generate` and commits updates back to the repo.

## Optional: Cloudflare R2 (Future Extension)

If the dataset grows too large for the repo, you can move shards and OG images to R2.

**Planned storage abstraction:**
- Local (default): `public/data`
- R2 (optional): `R2_BUCKET`

**Suggested environment variables:**
```env
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=imessage-dictionary
R2_PUBLIC_BASE_URL=https://<custom-domain>
```

Future work would add a storage adapter to read from R2 instead of the local filesystem.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables:
   - `VITE_ADMIN_TOKEN` (admin password)
4. Deploy

### Environment Variables

- `VITE_ADMIN_TOKEN` - Admin interface password (optional for development)

## Troubleshooting

### OG Images Not Showing in iMessage

- **Check URL**: Must be publicly accessible (not `localhost`)
- **Clear Cache**: iMessage caches aggressively; try a different word
- **Validate Tags**: Use [Open Graph Debugger](https://www.opengraph.xyz/)

### Search Not Finding Words

- **Case Sensitivity**: Search is case-insensitive
- **Typos**: No fuzzy matching yet, must match substring

## License

Application code: See LICENSE file
Dictionary content: Varies by source (see Attribution page)

---

**Built with GitHub Spark** - Production-ready micro-apps in minutes.
