
/**
 * Server middleware to init D1 database on every request.
 */
export default defineEventHandler((event) => {
  const { DB } = (event.context.cloudflare?.env || {}) as { DB?: any }
  if (DB) {
    initDatabase(DB)
  }
})
