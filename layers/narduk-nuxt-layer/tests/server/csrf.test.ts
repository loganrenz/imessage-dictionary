import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for the CSRF middleware.
 *
 * Tests the core logic by simulating H3 events with different methods,
 * paths, and headers.
 */

interface MockEvent {
  method: string
  path: string
  _headers: Record<string, string>
}

// Must mock globals BEFORE importing the module under test
const mockGetHeader = vi.fn()
const mockCreateError = vi.fn((opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

vi.stubGlobal('defineEventHandler', (fn: (event: MockEvent) => void) => fn)
vi.stubGlobal('getHeader', mockGetHeader)
vi.stubGlobal('createError', mockCreateError)

// Mock useLogger — CSRF middleware logs on block
const noopLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: () => noopLogger,
}
vi.stubGlobal('useLogger', () => noopLogger)

// Now safe to import
const { default: handler } = await import('../../server/middleware/csrf')

function createMockEvent(
  method: string,
  path: string,
  headers: Record<string, string> = {},
): MockEvent {
  return {
    method,
    path,
    _headers: headers,
  }
}

beforeEach(() => {
  mockGetHeader.mockImplementation((event: MockEvent, name: string) => {
    return event._headers?.[name.toLowerCase()]
  })
})

describe('CSRF middleware', () => {
  it('allows GET requests without X-Requested-With', () => {
    const event = createMockEvent('GET', '/api/users')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('allows HEAD requests', () => {
    const event = createMockEvent('HEAD', '/api/health')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('allows OPTIONS requests', () => {
    const event = createMockEvent('OPTIONS', '/api/users')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('blocks POST without X-Requested-With', () => {
    const event = createMockEvent('POST', '/api/users')
    expect(() => handler(event as never)).toThrow('Forbidden: missing required header')
  })

  it('allows POST with X-Requested-With', () => {
    const event = createMockEvent('POST', '/api/users', { 'x-requested-with': 'XMLHttpRequest' })
    expect(() => handler(event as never)).not.toThrow()
  })

  it('blocks PUT without X-Requested-With', () => {
    const event = createMockEvent('PUT', '/api/users/1')
    expect(() => handler(event as never)).toThrow()
  })

  it('blocks DELETE without X-Requested-With', () => {
    const event = createMockEvent('DELETE', '/api/users/1')
    expect(() => handler(event as never)).toThrow()
  })

  it('skips /api/webhooks/ paths', () => {
    const event = createMockEvent('POST', '/api/webhooks/stripe')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('skips /api/cron/ paths', () => {
    const event = createMockEvent('POST', '/api/cron/daily')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('skips /api/callbacks/ paths', () => {
    const event = createMockEvent('POST', '/api/callbacks/oauth')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('skips /api/_auth/ paths', () => {
    const event = createMockEvent('POST', '/api/_auth/session')
    expect(() => handler(event as never)).not.toThrow()
  })

  it('skips /__nuxt_content/ paths', () => {
    const event = createMockEvent('POST', '/__nuxt_content/query')
    expect(() => handler(event as never)).not.toThrow()
  })
})
