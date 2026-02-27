import type { H3Event } from 'h3'

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Designed for Cloudflare Workers where each isolate has its own memory —
 * this provides per-isolate protection against brute-force/credential-stuffing.
 * For stricter global limits, use Cloudflare Rate Limiting rules.
 *
 * Usage:
 *   await enforceRateLimit(event, 'auth', 10, 60_000)
 */

interface RateLimitEntry {
  timestamps: number[]
}

const buckets = new Map<string, Map<string, RateLimitEntry>>()

function getClientIp(event: H3Event): string {
  return (
    getHeader(event, 'cf-connecting-ip') ||
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  )
}

/**
 * Enforce a rate limit for the given namespace.
 *
 * @param event - H3 event
 * @param namespace - e.g. 'auth', 'api'
 * @param maxRequests - max requests allowed in the window
 * @param windowMs - sliding window duration in milliseconds
 * @throws 429 Too Many Requests if the limit is exceeded
 */
export async function enforceRateLimit(
  event: H3Event,
  namespace: string,
  maxRequests: number,
  windowMs: number,
): Promise<void> {
  const ip = getClientIp(event)
  const key = `${namespace}:${ip}`

  if (!buckets.has(namespace)) {
    buckets.set(namespace, new Map())
  }

  const bucket = buckets.get(namespace)!
  const now = Date.now()
  const cutoff = now - windowMs

  let entry = bucket.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    bucket.set(key, entry)
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= maxRequests) {
    const retryAfter = Math.ceil((entry.timestamps[0]! + windowMs - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    })
  }

  entry.timestamps.push(now)

  // Periodic cleanup: remove entries with no recent activity (every 100th request)
  if (Math.random() < 0.01) {
    for (const [k, v] of bucket) {
      if (v.timestamps.every((t) => t <= cutoff)) {
        bucket.delete(k)
      }
    }
  }
}
