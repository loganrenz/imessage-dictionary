import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'
import { verifyUserPassword, hashUserPassword } from '../../utils/password'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  await enforceRateLimit(event, 'auth-change-password', 20, 60_000)

  const user = await requireAuth(event)
  const body = await readValidatedBody(event, changePasswordSchema.parse)

  const db = useDatabase(event)
  const dbUser = await db.select().from(users).where(eq(users.id, user.id)).get()

  if (!dbUser || !dbUser.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized — invalid user state',
    })
  }

  const isValid = await verifyUserPassword(body.currentPassword, dbUser.passwordHash)
  if (!isValid) {
    log.warn('Password change failed — invalid current password', { userId: user.id })
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid current password',
    })
  }

  const hashedNewPassword = await hashUserPassword(body.newPassword)

  await db
    .update(users)
    .set({
      passwordHash: hashedNewPassword,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id))
    .run()

  log.info('Password changed', { userId: user.id })
  return { success: true }
})
