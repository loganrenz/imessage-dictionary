/**
 * Generic R2 image upload endpoint.
 *
 * Requires auth (requireAuth). Accepts multipart form data with one or more files.
 * Stores each file in R2 under `uploads/<uuid>.<ext>` and returns the key(s).
 *
 * - Rate-limited: 20 requests per 60 seconds per IP.
 * - Max file size: 10 MB per file.
 * - Allowed types: JPEG, PNG, WebP, GIF, SVG, AVIF.
 *
 * Returns `{ key, url }` for single-file uploads, or `{ key, url }[]` for multi-file.
 *
 * Requires an R2 bucket binding in wrangler.json:
 * ```json
 * { "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "my-bucket" }] }
 * ```
 */

import { validateUploadFiles, normalizeExtension } from '../utils/upload'

export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Upload')
  await enforceRateLimit(event, 'upload', 20, 60_000)
  await requireAuth(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  // Filter to only file parts (skip non-file fields like text inputs)
  const files = formData.filter((part) => part.data && part.type)

  if (files.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid files in upload' })
  }

  // Validate all files before uploading any
  validateUploadFiles(files)

  const results: { key: string; url: string }[] = []

  for (const file of files) {
    const ext = normalizeExtension(file.type!)
    const key = `uploads/${crypto.randomUUID()}.${ext}`

    await uploadToR2(event, key, file.data.buffer as ArrayBuffer, file.type!)

    results.push({ key, url: `/images/${key}` })
  }

  // Backwards compat: single-file returns object, multi returns array
  log.info('File(s) uploaded', { count: results.length, keys: results.map((r) => r.key) })
  if (results.length === 1) {
    return results[0]
  }
  return results
})
