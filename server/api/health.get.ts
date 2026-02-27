/**
 * Health check endpoint for uptime monitoring and deployment verification.
 *
 * Returns app version, build timestamp, and D1 database connectivity status.
 * Used by monitoring services (e.g. UptimeRobot, Cloudflare Health Checks).
 *
 * GET /api/health
 */
export default defineEventHandler(async (event) => {
  let dbStatus = 'not_available'

  try {
    const d1 = (event.context.cloudflare?.env as { DB?: any })?.DB
    if (d1) {
      await d1.prepare('SELECT 1').first()
      dbStatus = 'ok'
    }
  } catch {
    dbStatus = 'error'
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  }
})
