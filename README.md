# Free Dictionary - iMessage-Optimized Link Previews

A Next.js dictionary web app that generates beautiful Open Graph images for iMessage sharing. When you share a word link, the preview shows a large, readable definition card directly in the message thread—no tap required.

## Features

- 📖 **Instant Definitions** - Server-rendered word pages with full definitions
- 📱 **iMessage-Optimized** - Rich Open Graph images (1200×630px) with high-contrast typography
- 🚀 **Edge-Optimized** - OG images generated at the edge for fast global delivery
- 💾 **Smart Caching** - Definitions cached for 30 days using Vercel KV
- 🎨 **Beautiful Design** - Scholarly aesthetic with Crimson Pro serif and Inter sans-serif fonts

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home page with word list |
| `/w/[term]` | Word definition page with OG meta tags |
| `/api/og?term=...` | Dynamic OG image generation (1200×630) |
| `/api/define?term=...` | JSON API for definitions |
| `/attribution` | Licensing information |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js + Edge (for OG images)
- **Cache**: Vercel KV (Upstash Redis)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

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

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

For full functionality with caching, set up Vercel KV:

```env
# Vercel KV (Upstash Redis) - Optional for local dev
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-token
```

**Note**: The app works without KV configured—it will use the seed data directly without caching.

## Deployment on Vercel

### Quick Deploy

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Vercel will auto-detect Next.js and configure the build

### Setting up Vercel KV

1. In your Vercel project dashboard, go to **Storage**
2. Click **Create Database** → **KV**
3. Follow the prompts to create a new KV store
4. Vercel automatically injects the environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`

### Manual Environment Variables

If using an external Upstash Redis instance:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - `KV_REST_API_URL`: Your Upstash REST URL
   - `KV_REST_API_TOKEN`: Your Upstash REST token

## API Reference

### GET /api/define

Get a word definition.

**Query Parameters:**
- `term` (required): The word to look up (max 64 characters)

**Response:**
```json
{
  "term": "serendipity",
  "senses": [
    {
      "pos": "noun",
      "gloss": "The occurrence of events by chance in a happy or beneficial way.",
      "example": "A fortunate stroke of serendipity brought the two old friends together."
    }
  ],
  "source": "Demo Dataset",
  "license": "CC BY-SA 4.0",
  "createdAt": "2025-01-18T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Missing or invalid term parameter
- `404`: Term not found

**Cache Headers:**
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

### OG Image Route

`/api/og?term=[term]` generates a 1200×630px PNG image suitable for Open Graph sharing.

**Query Parameters:**
- `term` (required): The word to render

**Cache Headers:**
```
Cache-Control: public, s-maxage=2592000, stale-while-revalidate=86400
```

## Caching Strategy

| Resource | Cache Duration | Strategy |
|----------|---------------|----------|
| Definitions in KV | 30 days | TTL-based expiration |
| API responses | 1 hour (s-maxage) | CDN + stale-while-revalidate |
| OG images | 30 days (s-maxage) | CDN + stale-while-revalidate |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
├─────────────────────────────────────────────────────────────┤
│  /api/og?term=...  →  Route Handler  →  ImageResponse        │
│                            │                                 │
│  /api/define?term=... ─────┼───────→  JSON Response          │
│                            │                                 │
│                            ↓                                 │
│                      define(term)                            │
│                            │                                 │
│              ┌─────────────┴─────────────┐                   │
│              ↓                           ↓                   │
│         Vercel KV                   Seed Data                │
│         (cached)                    (fallback)               │
└─────────────────────────────────────────────────────────────┘
```

## License

- **Application code**: See LICENSE file
- **Dictionary content**: CC BY-SA 4.0 (see /attribution page)
