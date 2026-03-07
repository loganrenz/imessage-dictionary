import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withD1Cache, cleanExpiredCache } from '../../server/utils/d1Cache'

// Mock createError auto-import
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

// Mock useRuntimeConfig auto-import (required by useLogger → resolveLogLevel)
vi.stubGlobal('useRuntimeConfig', () => ({ logLevel: 'silent' }))

// Stub useLogger auto-import — returns a silent no-op logger with child() support
function createNoopLogger(): {
  debug: () => void
  info: () => void
  warn: () => void
  error: () => void
  child: () => ReturnType<typeof createNoopLogger>
} {
  return { debug() {}, info() {}, warn() {}, error() {}, child: () => createNoopLogger() }
}
vi.stubGlobal('useLogger', () => createNoopLogger())

describe('withD1Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls fetcher and returns result when D1 is not available', async () => {
    const event = { context: {} } as never
    const fetcher = vi.fn().mockResolvedValue({ data: 'fresh' })

    const result = await withD1Cache(event, 'test-key', 300, fetcher)

    expect(fetcher).toHaveBeenCalledOnce()
    expect(result).toEqual({ data: 'fresh' })
  })

  it('calls fetcher and returns result when cloudflare env has no DB', async () => {
    const event = { context: { cloudflare: { env: {} } } } as never
    const fetcher = vi.fn().mockResolvedValue({ value: 42 })

    const result = await withD1Cache(event, 'test-key', 300, fetcher)

    expect(fetcher).toHaveBeenCalledOnce()
    expect(result).toEqual({ value: 42 })
  })

  it('calls fetcher when force is true even if D1 is available', async () => {
    const mockPrepare = vi.fn()
    const event = {
      context: {
        cloudflare: {
          env: { DB: { prepare: mockPrepare } },
        },
      },
    } as never
    const fetcher = vi.fn().mockResolvedValue('forced')

    const result = await withD1Cache(event, 'test-key', 300, fetcher, true)

    expect(fetcher).toHaveBeenCalledOnce()
    expect(result).toBe('forced')
    // Prepare should be called for the SET operation, not for GET
    expect(mockPrepare).toHaveBeenCalled()
  })

  it('wraps result with meta when returnMeta is true', async () => {
    const event = { context: {} } as never
    const fetcher = vi.fn().mockResolvedValue({ value: 'test' })

    const result = await withD1Cache(event, 'key', 300, fetcher, false, { returnMeta: true })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('_meta')
    expect((result as { data: unknown; _meta: { stale: boolean } })._meta.stale).toBe(false)
    expect((result as { data: unknown }).data).toEqual({ value: 'test' })
  })
})

describe('cleanExpiredCache', () => {
  it('returns 0 when D1 is not available', async () => {
    const event = { context: {} } as never
    const result = await cleanExpiredCache(event)
    expect(result).toBe(0)
  })
})
