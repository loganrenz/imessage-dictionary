import { z } from 'zod'
import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { verifyUserPassword } from '../../utils/password'
import { createSession } from '../../utils/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const db = useDatabase(event)
  const normalizedEmail = body.email.toLowerCase()

  const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const isValid = await verifyUserPassword(body.password, user.passwordHash)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const { passwordHash: _passwordHash, ...cleanUser } = user

  await createSession(event, user.id)

  return { user: cleanUser }
})
