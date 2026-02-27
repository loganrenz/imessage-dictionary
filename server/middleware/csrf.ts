/**
 * CSRF protection middleware.
 *
 * Blocks state-changing requests (POST, PUT, PATCH, DELETE) that don't
 * include an `X-Requested-With` header. Since browsers prevent cross-origin
 * sites from setting custom headers, this blocks form-based CSRF attacks
 * while allowing XHR/fetch calls from our own frontend (which always send
 * custom headers).
 *
 * Skipped for non-mutating methods and preflight (OPTIONS) requests.
 */
export default defineEventHandler((event) => {
  const method = event.method.toUpperCase()

  // Only protect state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  const xRequestedWith = getHeader(event, 'x-requested-with')

  if (!xRequestedWith) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: missing required header',
    })
  }
})
