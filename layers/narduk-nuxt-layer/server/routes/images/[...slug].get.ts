/**
 * R2 Image Serving Route — streams images from R2 with proper Content-Type headers.
 *
 * Accessible at /images/<key> — matches the key returned by the upload endpoint.
 *
 * Requires an R2 bucket binding in wrangler.json:
 * ```json
 * { "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "my-bucket" }] }
 * ```
 */
import { useR2 } from '../../utils/r2'

export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Images')
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing image path' })
  }

  const r2 = useR2(event)
  const object = await r2.get(slug)

  if (!object) {
    log.warn('Image not found', { slug })
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream'

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: object.httpEtag,
  })

  log.debug('Image served', { slug, contentType })
  return object.body
})
