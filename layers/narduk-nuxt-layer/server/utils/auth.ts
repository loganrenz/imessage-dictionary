import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, getRequestHeader } from 'h3'
import { eq, and, gt } from 'drizzle-orm'
import type { User } from '../database/schema'
import { sessions, users, apiKeys } from '../database/schema'

/**
 * Session & authentication utilities.
 *
 * Primary session: nuxt-auth-utils (sealed cookie). requireAuth / requireAdmin
 * check that first, then fall back to API key.
 *
 * Optional D1 session helpers (createSession, getSessionUser, destroySession) are
 * for apps that want server-side session listing/revocation in addition to sealed cookies.
 *
 * API key auth (Authorization: Bearer nk_...) remains D1-backed for CLI/machine use.
 */

const DEFAULT_SESSION_COOKIE = 'app_session'
const SESSION_DAYS = 30
const API_KEY_PREFIX = 'nk_'

function getSessionCookieName(event: H3Event): string {
  try {
    const config = useRuntimeConfig(event)
    return (
      ((config as Record<string, unknown>).sessionCookieName as string) || DEFAULT_SESSION_COOKIE
    )
  } catch (err) {
    useLogger(event)
      .child('Auth')
      .warn('Failed to read sessionCookieName from runtimeConfig', { error: String(err) })
    return DEFAULT_SESSION_COOKIE
  }
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Hash a raw API key using SHA-256 (Web Crypto, edge-compatible).
 */
async function hashApiKey(rawKey: string): Promise<string> {
  const data = new TextEncoder().encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a D1-backed session for a user and set the session cookie.
 * @optional Use when you need server-side session listing/revocation alongside nuxt-auth-utils.
 */
export async function createSession(event: H3Event, userId: string): Promise<string> {
  const db = useDatabase(event)
  const id = crypto.randomUUID()
  const expiresAt = nowSec() + SESSION_DAYS * 86400

  await db.insert(sessions).values({
    id,
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  const host = getRequestHeader(event, 'host') ?? ''
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  const cookieName = getSessionCookieName(event)

  setCookie(event, cookieName, id, {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 86400,
    path: '/',
  })

  return id
}

/**
 * Get the current user from the D1 session cookie (app_session).
 * Returns null if the cookie is missing, session is expired, or the user doesn't exist.
 * @optional Use when you need server-side session resolution alongside nuxt-auth-utils.
 */
export async function getSessionUser(event: H3Event): Promise<User | null> {
  const cookieName = getSessionCookieName(event)
  const token = getCookie(event, cookieName)
  if (!token) return null

  const db = useDatabase(event)
  const now = nowSec()

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      appleId: users.appleId,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, now)))
    .limit(1)

  return (rows[0] as User) ?? null
}

/**
 * Authenticate via API key (Authorization: Bearer nk_...).
 * Returns the user associated with the key, or null if invalid/expired.
 * Updates last_used_at on successful authentication.
 */
export async function authenticateApiKey(event: H3Event): Promise<User | null> {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey.startsWith(API_KEY_PREFIX)) return null

  const db = useDatabase(event)
  const keyHash = await hashApiKey(rawKey)

  const rows = await db
    .select({
      keyId: apiKeys.id,
      keyExpiresAt: apiKeys.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      appleId: users.appleId,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  // Check expiration
  if (row.keyExpiresAt && row.keyExpiresAt < nowSec()) return null

  // Update last_used_at (fire-and-forget, don't block the response)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, row.keyId))
    .run()
    .catch((err) =>
      useLogger(event)
        .child('Auth')
        .warn('Failed to update API key last_used_at', { error: String(err) }),
    )

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    appleId: row.appleId,
    isAdmin: row.isAdmin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as User
}

/**
 * Destroy the current D1 session and clear the app_session cookie.
 * @optional Use when you need server-side session revocation alongside nuxt-auth-utils.
 */
export async function destroySession(event: H3Event): Promise<void> {
  const cookieName = getSessionCookieName(event)
  const token = getCookie(event, cookieName)

  if (token) {
    const db = useDatabase(event)
    await db.delete(sessions).where(eq(sessions.id, token))
  }

  deleteCookie(event, cookieName, { path: '/' })
}

/** User shape returned by requireAuth (session or API key). */
export type AuthUser = { id: string; email: string; name: string | null; isAdmin: boolean | null }

/**
 * Get the current user from nuxt-auth-utils session or API key. Throws 401 if not authenticated.
 * Fallback chain: sealed session (nuxt-auth-utils) → API key → 401.
 */
export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const session = await getUserSession(event)
  if (session?.user) return session.user as unknown as AuthUser

  const apiKeyUser = await authenticateApiKey(event)
  if (apiKeyUser) {
    return {
      id: apiKeyUser.id,
      email: apiKeyUser.email,
      name: apiKeyUser.name,
      isAdmin: apiKeyUser.isAdmin,
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Unauthorized',
  })
}

/**
 * Require admin authentication. Throws 401 if not authenticated, 403 if not admin.
 */
export async function requireAdmin(event: H3Event): Promise<AuthUser> {
  const user = await requireAuth(event)
  if (!user.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden — admin access required',
    })
  }
  return user
}

/**
 * Generate a new API key. Returns the raw key (show once) and the metadata to store.
 */
export async function generateApiKey(): Promise<{
  rawKey: string
  keyHash: string
  keyPrefix: string
}> {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const rawKey = `${API_KEY_PREFIX}${hex}`
  const keyHash = await hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 11) // "nk_" + 8 chars

  return { rawKey, keyHash, keyPrefix }
}
