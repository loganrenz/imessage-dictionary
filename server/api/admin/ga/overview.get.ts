import { z } from 'zod'

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = useRuntimeConfig()
  const propertyId = config.gaPropertyId || ''

  if (!propertyId) {
    throw createError({ statusCode: 500, statusMessage: 'GA_PROPERTY_ID not configured' })
  }

  const query = await getValidatedQuery(event, querySchema.parse)

  const endDate = query.endDate ? String(query.endDate) : new Date().toISOString().split('T')[0]
  const start = new Date(endDate as string)
  start.setDate(start.getDate() - 30)
  const startDate = query.startDate ? String(query.startDate) : start.toISOString().split('T')[0]

  try {
    const data = await googleApiFetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      GA_SCOPES,
      {
        method: 'POST',
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
          dimensions: [{ name: 'date' }],
        }),
      },
    )

    const totals = data.totals as Array<{ metricValues?: Array<{ value: string }> }> | undefined
    const rows = data.rows as Array<Record<string, unknown>> | undefined

    return {
      totals: totals?.[0]?.metricValues || [],
      rows: rows || [],
      startDate,
      endDate,
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: `GA4 Error: ${err.statusMessage || err.message}`,
    })
  }
})
