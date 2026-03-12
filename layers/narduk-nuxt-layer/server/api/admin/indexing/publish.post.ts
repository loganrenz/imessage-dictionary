import { z } from 'zod'

const bodySchema = z.object({
  url: z.string().url(),
  type: z.enum(['URL_UPDATED', 'URL_DELETED']).optional().default('URL_UPDATED'),
})

/**
 * Google Indexing API — publish a single URL notification.
 *
 * POST /api/admin/indexing/publish
 * Body: { url: string, type?: "URL_UPDATED" | "URL_DELETED" }
 *
 * Notifies Google that a URL has been updated or should be removed.
 * Requires GSC_SERVICE_ACCOUNT_JSON with the Indexing API enabled.
 *
 * Note: Google officially limits the Indexing API to pages with JobPosting
 * or BroadcastEvent structured data, but may process other page types.
 *
 * Usage:
 *   curl -X POST https://your-site.com/api/admin/indexing/publish \
 *     -H "Content-Type: application/json" \
 *     -d '{"url": "https://your-site.com/jobs/42", "type": "URL_UPDATED"}'
 */
export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Indexing')
  await requireAdmin(event)
  await enforceRateLimit(event, 'google-indexing-publish', 50, 60_000)

  const body = await readBody<unknown>(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Validation error: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    })
  }

  const { url, type } = parsed.data

  try {
    const data = await googleApiFetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      INDEXING_SCOPES,
      {
        method: 'POST',
        body: JSON.stringify({ url, type }),
      },
    )

    log.info('URL published to indexing', { url, type })

    return {
      success: true,
      url,
      type,
      metadata: data,
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    log.error('URL publish failed', { url, error: err.statusMessage || err.message })
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: `Google Indexing API error: ${err.statusMessage || err.message}`,
    })
  }
})
