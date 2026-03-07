import { requireAuth, generateApiKey } from '#layer/server/utils/auth'
import { apiKeys } from '#layer/server/database/schema'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
})

/**
 * POST /api/auth/api-keys
 * Create a new API key. Returns the raw key ONCE — caller must save it.
 */
export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  await enforceRateLimit(event, 'auth-api-keys', 30, 60_000)

  const user = await requireAuth(event)
  const { name } = await readValidatedBody(event, bodySchema.parse)

  const db = useDatabase(event)
  const { rawKey, keyHash, keyPrefix } = await generateApiKey()
  const id = crypto.randomUUID()

  await db.insert(apiKeys).values({
    id,
    userId: user.id,
    name,
    keyHash,
    keyPrefix,
  })

  log.info('API key created', { keyPrefix, userId: user.id })

  return {
    id,
    name,
    keyPrefix,
    rawKey, // Only time the raw key is ever returned
    createdAt: new Date().toISOString(),
  }
})
