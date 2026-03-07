import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type * as schema from '../database/schema'
import type { Logger } from '../utils/logger'

declare module 'h3' {
  interface H3EventContext {
    /** Per-request Drizzle D1 database instance, memoized by useDatabase() */
    _db?: DrizzleD1Database<typeof schema>
    /** Per-request correlation ID, set by requestLogger middleware */
    _requestId?: string
    /** Per-request structured logger, memoized by useLogger() */
    _logger?: Logger
  }
}
