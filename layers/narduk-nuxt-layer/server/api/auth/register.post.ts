import { z } from 'zod'
import { users } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { hashUserPassword } from '../../utils/password'
import { createSession } from '../../utils/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)
  const db = useDatabase(event)
  const normalizedEmail = body.email.toLowerCase()

  const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()
  if (existingUser) {
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

  await createSession(event, newUserId)

  return {
    user: {
      id: newUserId,
      name: body.name,
      email: normalizedEmail,
    },
  }
})
