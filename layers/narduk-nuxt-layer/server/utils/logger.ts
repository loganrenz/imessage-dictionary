import type { H3Event } from 'h3'

/**
 * Structured, level-gated logger for server routes.
 *
 * Creates a per-request logger that respects the `logLevel` runtime config.
 * Logs are emitted as structured JSON via `console.*`, which surfaces in:
 *   - `wrangler tail` (live)
 *   - Cloudflare Dashboard → Workers → Logs
 *   - Logpush (if configured)
 *
 * Every log entry includes a `requestId` for correlating logs from the same
 * request across `wrangler tail` and Logpush.
 *
 * Usage:
 *   const log = useLogger(event)
 *   log.info('User registered', { email })
 *   log.debug('Cache miss', { key })
 *
 *   // Scoped sub-logger for a specific module:
 *   const cacheLog = log.child('D1Cache')
 *   cacheLog.debug('Cache HIT')  // message: "[D1Cache] Cache HIT"
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, data?: Record<string, unknown>) => void
  /** Create a scoped sub-logger that prefixes messages with `[scope]`. */
  child: (scope: string) => Logger
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

const VALID_LEVELS = new Set<string>(Object.keys(LEVEL_PRIORITY))

/**
 * Resolve the effective log level from runtime config.
 * Falls back to 'warn' in production, 'debug' in dev.
 */
export function resolveLogLevel(event: H3Event): LogLevel {
  try {
    const config = useRuntimeConfig(event)
    const level = (config as Record<string, unknown>).logLevel as string | undefined
    if (level && VALID_LEVELS.has(level)) return level as LogLevel
  } catch {
    // Runtime config unavailable (e.g. in tests) — fall through to default
  }
  return import.meta.dev ? 'debug' : 'warn'
}

function shouldLog(configured: LogLevel, target: LogLevel): boolean {
  return LEVEL_PRIORITY[target] >= LEVEL_PRIORITY[configured]
}

function generateRequestId(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function ensureRequestId(event: H3Event): string {
  if (!event.context._requestId) {
    event.context._requestId = generateRequestId()
  }
  return event.context._requestId
}

function createLogEntry(
  event: H3Event,
  level: string,
  message: string,
  data?: Record<string, unknown>,
) {
  return {
    timestamp: new Date().toISOString(),
    level,
    requestId: event.context._requestId,
    method: event.method,
    path: event.path,
    message,
    ...(data ? { data } : {}),
  }
}

/**
 * Get or create a memoized Logger for the current request.
 *
 * Follows the same per-request memoization pattern as `useDatabase(event)`.
 * The logger is cached on `event.context._logger`.
 */
function createScopedLogger(event: H3Event, level: LogLevel, prefix: string): Logger {
  const fmt = (message: string) => (prefix ? `${prefix} ${message}` : message)

  return {
    debug(message, data) {
      if (shouldLog(level, 'debug')) {
        console.debug(JSON.stringify(createLogEntry(event, 'debug', fmt(message), data)))
      }
    },
    info(message, data) {
      if (shouldLog(level, 'info')) {
        console.info(JSON.stringify(createLogEntry(event, 'info', fmt(message), data)))
      }
    },
    warn(message, data) {
      if (shouldLog(level, 'warn')) {
        console.warn(JSON.stringify(createLogEntry(event, 'warn', fmt(message), data)))
      }
    },
    error(message, data) {
      if (shouldLog(level, 'error')) {
        console.error(JSON.stringify(createLogEntry(event, 'error', fmt(message), data)))
      }
    },
    child(scope: string) {
      return createScopedLogger(event, level, `${prefix}[${scope}]`.trim())
    },
  }
}

/**
 * Get or create a memoized Logger for the current request.
 *
 * Follows the same per-request memoization pattern as `useDatabase(event)`.
 * The logger is cached on `event.context._logger`.
 */
export function useLogger(event: H3Event): Logger {
  if (event.context._logger) return event.context._logger

  ensureRequestId(event)
  const level = resolveLogLevel(event)
  const logger = createScopedLogger(event, level, '')

  event.context._logger = logger
  return logger
}
