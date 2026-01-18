# OG Image Generation - Technical Documentation (On-Demand)

## Problem
The previous build-time approach pre-generated an OG image for every word and sense, which doesn’t scale to millions of entries and makes deployments heavy.

## Solution
The app now generates OG images **on-demand** via a Vercel Edge function using `@vercel/og`.

### Key Points
- **Route**: `/og/[term].png` (rewritten to `/api/og?term=[term]`)
- **Sense-specific**: `/og/[term]-N.png` for sense index `N`
- **Data source**: same shard logic as `/api/word`, fetched from the serverless API
- **Caching**: `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`

### How It Works
1. The word page (`/w/[term]`) includes OG meta tags that point to `/og/[term].png`.
2. Vercel Edge function (`api/og.js`) receives the request and fetches the word data from `/api/word`.
3. The function renders a 1200×630 PNG with the word, part of speech (if any), and a short gloss.
4. The image is cached at the edge for fast repeats.

### Relevant Files
- `api/og.js` — Vercel Edge OG image generator
- `api/word.js` — Word lookup API (loads from dataset shards)
- `api/word-page.js` — HTML wrapper that includes OG tags
- `public/data/*` — Build-time dataset used at runtime

### Testing
- Visit `/og/serendipity.png` after starting `vercel dev` or deploying.
- Confirm the response is a PNG and the caching headers are present.
