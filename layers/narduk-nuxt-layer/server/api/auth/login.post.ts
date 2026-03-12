import { z } from 'zod'
import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { verifyUserPassword } from '../../utils/password'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  await enforceRateLimit(event, 'auth-login', 30, 60_000)

  const body = await readValidatedBody(event, loginSchema.parse)
  const db = useDatabase(event)
  const normalizedEmail = body.email.toLowerCase()

  const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (!user || !user.passwordHash) {
    log.warn('Login failed — invalid credentials', { email: normalizedEmail })
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const isValid = await verifyUserPassword(body.password, user.passwordHash)
  if (!isValid) {
    log.warn('Login failed — invalid credentials', { email: normalizedEmail })
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const { passwordHash: _passwordHash, ...rest } = user
  const cleanUser = {
    id: rest.id,
    email: rest.email,
    name: rest.name,
    isAdmin: rest.isAdmin,
  }

  await setUserSession(event, { user: cleanUser })
  log.info('Login successful', { email: normalizedEmail, userId: cleanUser.id })

  return { user: cleanUser }
})
