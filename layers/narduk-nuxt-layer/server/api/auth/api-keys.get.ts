import { requireAuth } from '#layer/server/utils/auth'
import { apiKeys } from '#layer/server/database/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/auth/api-keys
 * List the current user's API keys (never returns the full key).
 */
export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  const user = await requireAuth(event)
  const db = useDatabase(event)

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .all()

  log.debug('API keys listed', { count: keys.length, userId: user.id })
  return keys.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})
