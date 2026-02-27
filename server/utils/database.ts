import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

let _db: DrizzleD1Database<typeof schema> | null = null

/**
 * Initialise the Drizzle ORM instance from a Cloudflare D1 binding.
 * Safe to call multiple times – only the first call creates the instance.
 */
export function initDatabase(d1: any) {
  if (!_db) {
    _db = drizzle(d1, { schema })
  }
  return _db
}

/**
 * Return the current Drizzle ORM instance.
 * Throws if called before `initDatabase()`.
 */
export function useDatabase() {
  if (!_db) {
    throw new Error(
      'Database not initialised. Make sure the D1 middleware has run.',
    )
  }
  return _db
}
