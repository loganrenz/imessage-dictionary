/**
 * IndexNow URL submission API route.
 *
 * POST /api/indexnow/submit
 * Body: { urls: string[] }   (optional — defaults to sitemap URLs)
 *
 * Submits URLs to IndexNow-compatible search engines (Bing, Yandex, Seznam, Naver).
 * Requires INDEXNOW_KEY to be set.
 *
 * Usage after deploy:
 *   curl -X POST https://your-site.com/api/indexnow/submit \
 *     -H "Content-Type: application/json" \
 *     -d '{"urls": ["https://your-site.com/", "https://your-site.com/about"]}'
 */
export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('IndexNow')
  // Rate limit: max 30 submissions per minute per IP
  await enforceRateLimit(event, 'indexnow', 30, 60_000)

  const config = useRuntimeConfig(event)
  const key = String(config.public.indexNowKey ?? '')
  const siteUrl = String(config.public.appUrl ?? '')

  if (!key) {
    throw createError({ statusCode: 400, message: 'INDEXNOW_KEY not configured' })
  }
  if (!siteUrl) {
    throw createError({ statusCode: 400, message: 'SITE_URL not configured' })
  }

  const body = await readBody<{ urls?: string[] }>(event).catch(() => ({}) as { urls?: string[] })
  let urls = body?.urls ?? []

  // Default: submit the homepage + sitemap URL if no URLs provided
  if (!urls.length) {
    const base = siteUrl.replace(/\/$/, '')
    urls = [base + '/', base + '/sitemap.xml']
  }

  const host = new URL(siteUrl).host
  const keyLocation = `${siteUrl.replace(/\/$/, '')}/${key}.txt`

  // IndexNow batch API — submit to Bing (which shares with all IndexNow engines)
  const indexNowPayload = {
    host,
    key,
    keyLocation,
    urlList: urls,
  }

  const results: { engine: string; status: number; ok: boolean }[] = []

  // Bing is the primary IndexNow endpoint; it shares with Yandex, Seznam, Naver
  const engines = ['https://api.indexnow.org/indexnow']

  for (const engine of engines) {
    try {
      const response = await fetch(engine, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(indexNowPayload),
      })
      results.push({
        engine,
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
      })
    } catch (_error: unknown) {
      const message = _error instanceof Error ? _error.message : String(_error)
      log.warn(`Failed to ping ${engine}`, { error: message })
      results.push({
        engine,
        status: 0,
        ok: false,
      })
    }
  }

  log.info('IndexNow submitted', { count: urls.length, results })

  return {
    submitted: urls.length,
    urls,
    results,
  }
})
