import { ImageResponse } from 'workers-og'

function parseTermAndSense(rawTerm: string, rawSense: string | null): { term: string; senseIndex: number } {
  let decoded = ''
  try {
    decoded = decodeURIComponent(rawTerm || '')
  } catch (e) {
    decoded = ''
  }
  if (!decoded) {
    return { term: '', senseIndex: 0 }
  }

  if (rawSense) {
    const senseIndex = Number.parseInt(rawSense, 10)
    return {
      term: decoded,
      senseIndex: Number.isFinite(senseIndex) ? senseIndex : 0,
    }
  }

  // Check if term ends with -N pattern (e.g., "serendipity-1")
  const senseMatch = decoded.match(/^(.*)-(\d+)$/)
  if (senseMatch) {
    return {
      term: senseMatch[1],
      senseIndex: Number.parseInt(senseMatch[2], 10),
    }
  }

  return { term: decoded, senseIndex: 0 }
}

function clampSenseIndex(entry: any, senseIndex: number): number {
  if (!entry?.senses?.length) return 0
  const maxIndex = entry.senses.length - 1
  return Math.max(0, Math.min(maxIndex, senseIndex))
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncateGloss(gloss: string, maxLength: number = 200): string {
  if (gloss.length <= maxLength) return gloss
  // Try to truncate at word boundary
  const truncated = gloss.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...'
  }
  return truncated + '...'
}

// OG Image dimensions - taller for better readability
const OG_WIDTH = 1200
const OG_HEIGHT = 540

function generateOGImageHTML(displayTerm: string, pos: string | undefined, gloss: string): string {
  // Adaptive truncation - shorter limit since we have larger text
  const isLongDefinition = gloss.length > 100
  const truncatedGloss = truncateGloss(gloss, isLongDefinition ? 180 : 150)
  
  // Larger, more readable font sizes
  const termFontSize = displayTerm.length > 12 ? 56 : 68
  const glossFontSize = isLongDefinition ? 38 : 44

  // POS badge inline with term
  const posElement = pos
    ? `<div style="display: flex; font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; color: #c5914a; font-weight: 600; background-color: rgba(197, 145, 74, 0.12); padding: 8px 14px; border-radius: 6px; margin-left: 20px; align-self: center;">${escapeHtml(pos)}</div>`
    : ''

  return `<div style="display: flex; flex-direction: column; justify-content: space-between; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; padding: 44px 52px; background-color: #f5f3f0; color: #1e2f50; font-family: Georgia, serif;">
  <div style="display: flex; flex-direction: column; flex: 1;">
    <div style="display: flex; align-items: baseline; margin-bottom: 24px;">
      <div style="display: flex; font-size: ${termFontSize}px; font-weight: 700;">${escapeHtml(displayTerm)}</div>
      ${posElement}
    </div>
    <div style="display: flex; font-size: ${glossFontSize}px; font-weight: 500; line-height: 1.35; color: #2a3f5f; flex: 1;">${escapeHtml(truncatedGloss)}</div>
  </div>
  <div style="display: flex; font-size: 16px; color: #8a8d93; font-family: sans-serif; padding-top: 14px; border-top: 1px solid #e0ddd8;">dict.nard.uk</div>
</div>`
}

export async function onRequest(context: any) {
  const { request, params } = context
  const url = new URL(request.url)
  
  // Get slug from params (e.g., "serendipity.png" or "serendipity-1.png")
  const slug = params?.slug || ''
  
  // Remove .png extension if present
  const slugWithoutExt = slug.replace(/\.png$/, '')
  
  // Parse term and sense from slug or query params
  const rawTerm = url.searchParams.get('term') || slugWithoutExt || ''
  const rawSense = url.searchParams.get('sense')
  const { term, senseIndex } = parseTermAndSense(rawTerm, rawSense)

  let entry: any = null
  if (term) {
    // Fetch word data from our API
    const wordUrl = new URL('/api/word', url.origin)
    wordUrl.searchParams.set('term', term)
    const wordResponse = await fetch(wordUrl.toString())
    if (wordResponse.ok) {
      entry = await wordResponse.json()
    }
  }

  const validSenseIndex = clampSenseIndex(entry, senseIndex)
  const sense = entry?.senses?.[validSenseIndex]
  const displayTerm = entry?.term ?? (term || 'Dictionary')
  const gloss = sense?.gloss ?? 'Definition not found.'
  const pos = sense?.pos

  // Generate HTML for OG image
  const html = generateOGImageHTML(displayTerm, pos, gloss)

  // Use workers-og to generate PNG image (iMessage compatible)
  const response = new ImageResponse(html, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
  })
  
  // Clone the response to add custom cache headers
  const body = await response.arrayBuffer()
  
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
