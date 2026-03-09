/// <reference types="@cloudflare/workers-types" />
/**
 * Health check endpoint for uptime monitoring and deployment verification.
 *
 * Returns app version, build timestamp, and D1 database connectivity status.
 * Used by monitoring services (e.g. UptimeRobot, Cloudflare Health Checks).
 *
 * GET /api/health
 */
export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Health')
  let dbStatus: 'ok' | 'not_available' | 'error' = 'not_available'

  try {
    const d1 = (event.context.cloudflare?.env as { DB?: D1Database })?.DB
    if (d1) {
      await d1.prepare('SELECT 1').first()
      dbStatus = 'ok'
    }
  } catch {
    log.error('Health check DB probe failed')
    dbStatus = 'error'
  }

  return {
    success: true as const,
    data: {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  }
})
