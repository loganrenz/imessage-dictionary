import { readFile } from 'fs/promises'
import path from 'path'
import { getEntryByTerm } from '../server/dataset.js'

const templateCache = {
  value: null,
}

async function loadTemplate() {
  if (templateCache.value) {
    return templateCache.value
  }
  const distPath = path.join(process.cwd(), 'dist', 'index.html')
  const devPath = path.join(process.cwd(), 'index.html')

  try {
    templateCache.value = await readFile(distPath, 'utf-8')
    return templateCache.value
  } catch (error) {
    templateCache.value = await readFile(devPath, 'utf-8')
    return templateCache.value
  }
}

function clampSenseIndex(entry, senseIndex) {
  if (!entry || !entry.senses?.length) {
    return 0
  }
  const maxIndex = entry.senses.length - 1
  if (!Number.isFinite(senseIndex)) {
    return 0
  }
  return Math.max(0, Math.min(maxIndex, senseIndex))
}

function buildOgImagePath(term, senseIndex) {
  if (!term) {
    return '/og/dictionary.png'
  }
  if (senseIndex > 0) {
    return `/og/${encodeURIComponent(term)}-${senseIndex}.png`
  }
  return `/og/${encodeURIComponent(term)}.png`
}

function injectMeta(template, meta) {
  let html = template
  if (meta.title) {
    html = html.replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
  }
  const metaTags = `
    <meta name="description" content="${meta.description}">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${meta.url}">
    <meta property="og:image" content="${meta.ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description}">
    <meta name="twitter:image" content="${meta.ogImage}">
    <link rel="canonical" href="${meta.url}">
  `
  html = html.replace('</head>', `${metaTags}\n</head>`)
  return html
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const term = url.searchParams.get('term') ?? ''
  const senseParam = url.searchParams.get('sense')
  const senseIndex = senseParam ? Number.parseInt(senseParam, 10) : 0
  const proto = req.headers['x-forwarded-proto'] ?? 'http'
  const host = req.headers.host
  const baseUrl = `${proto}://${host}`

  const entry = term ? await getEntryByTerm(term) : null
  const validSenseIndex = clampSenseIndex(entry, Number.isNaN(senseIndex) ? 0 : senseIndex)
  const sense = entry?.senses?.[validSenseIndex]

  const displayTerm = entry?.term ?? term || 'Dictionary'
  const posLabel = sense?.pos ? ` (${sense.pos})` : ''
  const title = sense
    ? `${displayTerm}${posLabel} — definition`
    : `${displayTerm} — Free Dictionary`
  const description =
    sense?.gloss ??
    'Look up definitions and share beautiful iMessage-friendly previews.'

  const canonicalPath = term
    ? `/w/${encodeURIComponent(displayTerm)}${validSenseIndex > 0 ? `/${validSenseIndex}` : ''}`
    : '/'

  const meta = {
    title,
    description,
    url: `${baseUrl}${canonicalPath}`,
    ogImage: `${baseUrl}${buildOgImagePath(displayTerm, validSenseIndex)}`,
  }

  const template = await loadTemplate()
  const html = injectMeta(template, meta)

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.end(html)
}
