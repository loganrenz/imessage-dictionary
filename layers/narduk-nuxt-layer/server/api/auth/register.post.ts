import { z } from 'zod'
import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { hashUserPassword } from '../../utils/password'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  await enforceRateLimit(event, 'auth-register', 20, 60_000)

  const body = await readValidatedBody(event, registerSchema.parse)
  const db = useDatabase(event)
  const normalizedEmail = body.email.toLowerCase()

  const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()
  if (existingUser) {
    log.warn('Registration rejected — email exists', { email: normalizedEmail })
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already in use',
    })
  }

  const hashedPassword = await hashUserPassword(body.password)
  const newUserId = crypto.randomUUID()

  await db.insert(users).values({
    id: newUserId,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    name: body.name,
  })

  const user = {
    id: newUserId,
    name: body.name,
    email: normalizedEmail,
    isAdmin: false,
  }
  await setUserSession(event, { user })
  log.info('User registered', { email: normalizedEmail, userId: newUserId })

  return { user }
})
