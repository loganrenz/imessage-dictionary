/**
 * IndexNow key verification endpoint.
 *
 * IndexNow requires the API key to be accessible at `/{key}.txt`.
 * This route dynamically serves it from the INDEXNOW_KEY env var,
 * so you don't need a static file in public/.
 *
 * GET /{key}.txt → returns the key as plain text
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const key = (config.public.indexNowKey as string) || ''

  if (!key) return // Continue pipeline if no key config

  // Only intercept requests for the key
  if (event.path === `/${key}.txt`) {
    setResponseHeader(event, 'content-type', 'text/plain')
    return key
  }
})
