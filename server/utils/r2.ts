/**
 * R2 Bucket Utilities — Cloudflare R2 Object Storage helpers.
 *
 * Requires an R2 bucket binding in wrangler.json:
 * ```json
 * {
 *   "r2_buckets": [
 *     { "binding": "BUCKET", "bucket_name": "my-bucket" }
 *   ]
 * }
 * ```
 *
 * @example
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const r2 = useR2(event)
 *
 *   // Upload
 *   const file = await readMultipartFormData(event)
 *   await r2.put('uploads/photo.jpg', file[0].data, { httpMetadata: { contentType: 'image/jpeg' } })
 *
 *   // Get
 *   const object = await r2.get('uploads/photo.jpg')
 *
 *   // List
 *   const list = await r2.list({ prefix: 'uploads/' })
 *
 *   // Delete
 *   await r2.delete('uploads/photo.jpg')
 * })
 * ```
 */

interface R2Bucket {
  put: (key: string, value: ReadableStream | ArrayBuffer | string, options?: any) => Promise<any>
  get: (key: string) => Promise<any>
  delete: (key: string | string[]) => Promise<void>
  list: (options?: { prefix?: string; limit?: number; cursor?: string }) => Promise<any>
  head: (key: string) => Promise<any>
}

/**
 * Get the R2 bucket binding from the Cloudflare event context.
 * @param event - The H3 event
 * @param bindingName - R2 binding name from wrangler.json (default: 'BUCKET')
 */
export function useR2(event: any, bindingName = 'BUCKET'): R2Bucket {
  const env = event.context.cloudflare?.env
  if (!env?.[bindingName]) {
    throw createError({
      statusCode: 500,
      message: `R2 binding "${bindingName}" not found. Add it to wrangler.json.`,
    })
  }
  return env[bindingName] as R2Bucket
}

/**
 * Upload a file to R2 and return its key.
 */
export async function uploadToR2(
  event: any,
  key: string,
  data: ArrayBuffer | ReadableStream | string,
  contentType?: string,
  bindingName = 'BUCKET',
): Promise<string> {
  const r2 = useR2(event, bindingName)
  await r2.put(key, data, contentType ? { httpMetadata: { contentType } } : undefined)
  return key
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(
  event: any,
  key: string | string[],
  bindingName = 'BUCKET',
): Promise<void> {
  const r2 = useR2(event, bindingName)
  await r2.delete(key)
}
