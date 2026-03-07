/**
 * Upload validation utilities — shared between the upload endpoint and unit tests.
 *
 * Centralises MIME-type allowlisting, file-size limits, and extension normalisation
 * so the rules are defined exactly once.
 */

export const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
])

/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/** A minimal file-part shape matching what `readMultipartFormData` returns. */
export interface FilePart {
  data: Buffer
  type?: string
  filename?: string
}

/**
 * Validate an array of file parts.
 * Throws an H3 error on the first invalid file.
 */
export function validateUploadFiles(files: FilePart[]): void {
  for (const file of files) {
    if (!file.type || !ALLOWED_TYPES.has(file.type)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported file type: ${file.type ?? 'unknown'}`,
      })
    }
    if (file.data.byteLength > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      })
    }
  }
}

/**
 * Normalise a MIME type into a file extension.
 *
 * - `image/jpeg` → `jpg`
 * - `image/svg+xml` → `svg`
 * - everything else → second part of the MIME (e.g. `png`, `webp`)
 */
export function normalizeExtension(mimeType: string): string {
  const sub = mimeType.split('/')[1] ?? 'bin'
  return sub.replace('jpeg', 'jpg').replace('svg+xml', 'svg')
}
