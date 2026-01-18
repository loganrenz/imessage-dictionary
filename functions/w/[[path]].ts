import { getEntryByTerm } from '../_lib/dataset.js'
import { loadTemplate } from '../_lib/template.js'

function clampSenseIndex(entry: any, senseIndex: number): number {
  if (!entry || !entry.senses?.length) {
    return 0
  }
  const maxIndex = entry.senses.length - 1
  if (!Number.isFinite(senseIndex)) {
    return 0
  }
  return Math.max(0, Math.min(maxIndex, senseIndex))
}

function buildOgImagePath(term: string, senseIndex: number): string {
  if (!term) {
    return '/og/dictionary.png'
  }
  if (senseIndex > 0) {
    return `/og/${encodeURIComponent(term)}-${senseIndex}.png`
  }
  return `/og/${encodeURIComponent(term)}.png`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function injectMeta(template: string, meta: {
  title: string
  description: string
  url: string
  ogImage: string
  jsonLd?: string
}): string {
  let html = template
  
  // Remove old title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(meta.title)}</title>`)
  
  // Remove old meta tags (description, og:*), keeping only charset and viewport
  html = html.replace(/<meta\s+(?:name|property)="(?:description|og:|twitter:)[^"]*"[^>]*>\s*/gi, '')
  
  // Remove old canonical link if exists
  html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
  
  // Build meta tags
  const metaTags = `
    <meta name="description" content="${escapeHtml(meta.description)}">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="${escapeHtml(meta.title)}">
    <meta property="og:description" content="${escapeHtml(meta.description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(meta.url)}">
    <meta property="og:site_name" content="Free Dictionary">
    <meta property="og:image" content="${escapeHtml(meta.ogImage)}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="540">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(meta.title)}">
    <meta name="twitter:description" content="${escapeHtml(meta.description)}">
    <meta name="twitter:image" content="${escapeHtml(meta.ogImage)}">
    <link rel="canonical" href="${escapeHtml(meta.url)}">
  `
  const jsonLdTag = meta.jsonLd
    ? `\n    <script type="application/ld+json">${meta.jsonLd}</script>`
    : ''
  
  // Inject meta tags right after <title>, before any script tags
  // This ensures they're early in <head> for iMessage/crawlers
  html = html.replace(
    /(<title>.*?<\/title>\s*)/s,
    `$1${metaTags}${jsonLdTag}`
  )
  
  return html
}

export async function onRequest(context: any) {
  const { request, env, params } = context
  const url = new URL(request.url)
  
  // Extract term and sense from path
  // path can be undefined, a string like "serendipity", or an array like ["serendipity", "1"]
  const path = params?.path
  let term = ''
  let senseIndex = 0
  
  if (Array.isArray(path)) {
    term = path[0] || ''
    if (path[1]) {
      const parsed = Number.parseInt(path[1], 10)
      senseIndex = Number.isFinite(parsed) ? parsed : 0
    }
  } else if (path) {
    term = path
  }
  
  // Also check query params as fallback
  if (!term && url.searchParams.has('term')) {
    term = url.searchParams.get('term') || ''
  }
  if (url.searchParams.has('sense')) {
    const parsed = Number.parseInt(url.searchParams.get('sense') || '0', 10)
    senseIndex = Number.isFinite(parsed) ? parsed : 0
  }

  // Get protocol and host
  const proto = url.protocol.replace(':', '')
  const host = url.host
  const baseUrl = `${proto}://${host}`

  const entry = term ? await getEntryByTerm(env, term) : null
  const validSenseIndex = clampSenseIndex(entry, senseIndex)
  const sense = entry?.senses?.[validSenseIndex]

  const displayTerm = entry?.term ?? (term || 'Dictionary')
  const posLabel = sense?.pos ? ` (${sense.pos})` : ''
  
  // Include definition snippet in title for better link previews
  const truncateForTitle = (text: string, max: number) => {
    if (text.length <= max) return text
    const truncated = text.substring(0, max - 3)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > max * 0.6 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }
  
  const title = sense
    ? `${displayTerm}${posLabel}: ${truncateForTitle(sense.gloss, 60)}`
    : `${displayTerm} — Free Dictionary`
  const baseDescription =
    sense?.gloss ??
    'Look up definitions and share beautiful iMessage-friendly previews.'
  const description = baseDescription.includes('iMessage')
    ? baseDescription
    : `${baseDescription} View definitions in iMessage without leaving the app.`

  const canonicalPath = term
    ? `/w/${encodeURIComponent(displayTerm)}${validSenseIndex > 0 ? `/${validSenseIndex}` : ''}`
    : '/'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: displayTerm,
      description,
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: 'Free Dictionary',
        url: `${baseUrl}/`,
      },
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      url: `${baseUrl}${canonicalPath}`,
      description,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Free Dictionary',
        url: `${baseUrl}/`,
      },
    },
  ]

  const meta = {
    title,
    description,
    url: `${baseUrl}${canonicalPath}`,
    ogImage: `${baseUrl}${buildOgImagePath(displayTerm, validSenseIndex)}`,
    jsonLd: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }

  const template = await loadTemplate(request, env)
  const html = injectMeta(template, meta)

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
