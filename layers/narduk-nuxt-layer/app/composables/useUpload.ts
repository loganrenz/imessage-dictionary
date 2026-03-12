/**
 * useUpload — Client-side composable for uploading images to R2 via the layer's
 * `/api/upload` endpoint.
 *
 * Uses session auth (no manual headers needed) and CSRF protection via $csrfFetch.
 *
 * @example
 * ```vue
 * <script setup>
 * const { uploadFile, uploadFiles, uploading, uploadError } = useUpload()
 *
 * async function onFileSelected(event: Event) {
 *   const file = (event.target as HTMLInputElement).files?.[0]
 *   if (file) {
 *     const url = await uploadFile(file)
 *     // url is e.g. '/images/uploads/abc123.jpg' or null on error
 *   }
 * }
 * </script>
 * ```
 */
export function useUpload() {
  const nuxtApp = useNuxtApp()
  const csrfFetch = (nuxtApp.$csrfFetch ?? $fetch) as typeof $fetch

  const uploading = ref(false)
  const uploadError = ref('')

  /**
   * Upload a single file. Returns the image URL or null on error.
   */
  async function uploadFile(file: File): Promise<string | null> {
    uploadError.value = ''
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await csrfFetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
      })
      return res.url
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Is R2 configured?'
      uploadError.value = message
      return null
    } finally {
      uploading.value = false
    }
  }

  /**
   * Upload multiple files. Returns an array of image URLs (empty on error).
   */
  async function uploadFiles(files: File[]): Promise<string[]> {
    uploadError.value = ''
    uploading.value = true
    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('file', file)
      }
      const res = await csrfFetch<{ url: string } | { url: string }[]>('/api/upload', {
        method: 'POST',
        body: formData,
      })
      // Normalise: single-file returns an object, multi returns an array
      const items = Array.isArray(res) ? res : [res]
      return items.map((r) => r.url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Is R2 configured?'
      uploadError.value = message
      return []
    } finally {
      uploading.value = false
    }
  }

  return { uploadFile, uploadFiles, uploading, uploadError }
}
