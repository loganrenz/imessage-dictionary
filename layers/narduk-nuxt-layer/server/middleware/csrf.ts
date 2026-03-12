/**
 * CSRF protection middleware.
 *
 * Blocks state-changing requests (POST, PUT, PATCH, DELETE) that don't
 * include an `X-Requested-With` header. Since browsers prevent cross-origin
 * sites from setting custom headers, this blocks form-based CSRF attacks
 * while allowing XHR/fetch calls from our own frontend (which always send
 * custom headers).
 *
 * Skipped for:
 * - Non-mutating methods (GET, HEAD, OPTIONS)
 * - Webhook/external callback routes (`/api/webhooks/`, `/api/cron/`)
 * - Health check endpoints
 */
export default defineEventHandler((event) => {
  const method = event.method.toUpperCase()

  // Only protect state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  // Skip CSRF for routes that receive external POSTs (webhooks, cron, callbacks)
  // and for internal Nuxt Content query API (SSR has no browser header)
  const path = event.path
  if (
    path.startsWith('/api/webhooks/') ||
    path.startsWith('/api/cron/') ||
    path.startsWith('/api/callbacks/') ||
    path.startsWith('/api/_auth/') ||
    path.startsWith('/__nuxt_content/')
  ) {
    return
  }

  // Skip CSRF for API key bearer auth — not browser-based, not CSRF-vulnerable
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer nk_')) return

  const xRequestedWith = getHeader(event, 'x-requested-with')

  if (!xRequestedWith) {
    const log = useLogger(event).child('Security')
    log.warn('CSRF blocked', { method, path })
    throw createError({
      statusCode: 403,
      message: 'Forbidden: missing required header',
    })
  }
})
