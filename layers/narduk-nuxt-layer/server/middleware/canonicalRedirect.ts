/**
 * Canonical Redirect Middleware — redirects non-canonical URLs to the canonical domain.
 *
 * Uses the `SITE_URL` from runtime config to determine the canonical origin.
 * Redirects www. prefixed requests and HTTP→HTTPS upgrades.
 *
 * Only active in production (not during development).
 */
export default defineEventHandler((event) => {
  // Skip in development
  if (import.meta.dev) return

  const config = useRuntimeConfig(event)
  const siteUrl = config.public?.siteUrl as string
  if (!siteUrl) return

  let canonicalOrigin: URL
  try {
    canonicalOrigin = new URL(siteUrl)
  } catch {
    return
  }

  const requestUrl = getRequestURL(event)

  // Check if the request host matches the canonical host
  if (requestUrl.host !== canonicalOrigin.host) {
    const log = useLogger(event).child('Redirect')
    const redirectUrl = new URL(requestUrl.pathname + requestUrl.search, canonicalOrigin)
    log.debug('Canonical redirect', { from: requestUrl.host, to: canonicalOrigin.host })
    return sendRedirect(event, redirectUrl.toString(), 301)
  }
})
