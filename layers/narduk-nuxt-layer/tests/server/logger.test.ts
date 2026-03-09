import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLogger, resolveLogLevel, ensureRequestId } from '../../server/utils/logger'

/**
 * Unit tests for the structured logger.
 *
 * Tests level gating, structured output, memoization, and silent mode.
 */

// Track the configured log level for tests
let mockLogLevel: string | undefined = 'info'

// Mock Nitro auto-imports
vi.stubGlobal('useRuntimeConfig', () => ({
  logLevel: mockLogLevel,
}))

interface MockEvent {
  method: string
  path: string
  context: Record<string, unknown>
}

function createMockEvent(overrides?: Partial<MockEvent>): MockEvent {
  return {
    method: 'GET',
    path: '/api/test',
    context: {},
    ...overrides,
  }
}

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockLogLevel = 'info'
  })

  describe('resolveLogLevel', () => {
    it('returns the configured level from runtimeConfig', () => {
      mockLogLevel = 'error'
      const event = createMockEvent()
      expect(resolveLogLevel(event as never)).toBe('error')
    })

    it('returns the configured level when set to debug', () => {
      mockLogLevel = 'debug'
      const event = createMockEvent()
      expect(resolveLogLevel(event as never)).toBe('debug')
    })

    it('falls back to warn when runtimeConfig has invalid level', () => {
      mockLogLevel = 'invalid-level'
      const event = createMockEvent()
      // In non-dev, falls back to 'warn'
      expect(resolveLogLevel(event as never)).toBe('warn')
    })

    it('falls back to warn when runtimeConfig is missing logLevel', () => {
      mockLogLevel = undefined
      const event = createMockEvent()
      expect(resolveLogLevel(event as never)).toBe('warn')
    })
  })

  describe('useLogger', () => {
    it('creates a logger with debug, info, warn, error methods', () => {
      const event = createMockEvent()
      const log = useLogger(event as never)

      expect(typeof log.debug).toBe('function')
      expect(typeof log.info).toBe('function')
      expect(typeof log.warn).toBe('function')
      expect(typeof log.error).toBe('function')
    })

    it('memoizes the logger on event.context', () => {
      const event = createMockEvent()
      const log1 = useLogger(event as never)
      const log2 = useLogger(event as never)
      expect(log1).toBe(log2)
    })

    it('creates different loggers for different events', () => {
      const event1 = createMockEvent()
      const event2 = createMockEvent()
      const log1 = useLogger(event1 as never)
      const log2 = useLogger(event2 as never)
      expect(log1).not.toBe(log2)
    })
  })

  describe('level gating', () => {
    it('logs info and above when level is info', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      log.debug('hidden')
      log.info('shown')
      log.warn('shown')
      log.error('shown')

      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(errorSpy).toHaveBeenCalledOnce()
    })

    it('logs warn and above when level is warn', () => {
      mockLogLevel = 'warn'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      log.debug('hidden')
      log.info('hidden')
      log.warn('shown')
      log.error('shown')

      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(errorSpy).toHaveBeenCalledOnce()
    })

    it('logs everything when level is debug', () => {
      mockLogLevel = 'debug'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      log.debug('shown')
      log.info('shown')
      log.warn('shown')
      log.error('shown')

      expect(debugSpy).toHaveBeenCalledOnce()
      expect(infoSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(errorSpy).toHaveBeenCalledOnce()
    })

    it('suppresses all logs when level is silent', () => {
      mockLogLevel = 'silent'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      log.debug('hidden')
      log.info('hidden')
      log.warn('hidden')
      log.error('hidden')

      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('only logs errors when level is error', () => {
      mockLogLevel = 'error'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      log.debug('hidden')
      log.info('hidden')
      log.warn('hidden')
      log.error('shown')

      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledOnce()
    })
  })

  describe('structured output', () => {
    it('emits structured JSON with required fields', () => {
      mockLogLevel = 'info'
      const event = createMockEvent({ method: 'POST', path: '/api/auth/login' })
      const log = useLogger(event as never)

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      log.info('User logged in', { email: 'test@example.com' })

      expect(infoSpy).toHaveBeenCalledOnce()
      const output = JSON.parse(infoSpy.mock.calls[0]![0] as string)

      expect(output).toMatchObject({
        level: 'info',
        method: 'POST',
        path: '/api/auth/login',
        message: 'User logged in',
        data: { email: 'test@example.com' },
      })
      expect(output.timestamp).toBeDefined()
    })

    it('omits data field when no data is provided', () => {
      mockLogLevel = 'warn'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      log.warn('Something went wrong')

      const output = JSON.parse(warnSpy.mock.calls[0]![0] as string)
      expect(output.data).toBeUndefined()
      expect(output.message).toBe('Something went wrong')
    })
  })

  describe('requestId', () => {
    it('includes requestId in structured output', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      log.info('test message')

      const output = JSON.parse(infoSpy.mock.calls[0]![0] as string)
      expect(output.requestId).toBeDefined()
      expect(typeof output.requestId).toBe('string')
      expect(output.requestId.length).toBe(8) // 4 bytes = 8 hex chars
    })

    it('ensureRequestId generates and caches an id', () => {
      const event = createMockEvent()
      const id = ensureRequestId(event as never)
      expect(typeof id).toBe('string')
      expect(id.length).toBe(8)
      // Should return same id on second call
      expect(ensureRequestId(event as never)).toBe(id)
    })

    it('shares requestId across multiple log calls', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const log = useLogger(event as never)

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      log.info('first')
      log.info('second')

      const output1 = JSON.parse(infoSpy.mock.calls[0]![0] as string)
      const output2 = JSON.parse(infoSpy.mock.calls[1]![0] as string)
      expect(output1.requestId).toBe(output2.requestId)
    })
  })

  describe('child()', () => {
    it('prefixes messages with [scope]', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const log = useLogger(event as never)
      const childLog = log.child('D1Cache')

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      childLog.info('Cache HIT')

      const output = JSON.parse(infoSpy.mock.calls[0]![0] as string)
      expect(output.message).toBe('[D1Cache] Cache HIT')
    })

    it('inherits level gating from parent', () => {
      mockLogLevel = 'warn'
      const event = createMockEvent()
      const childLog = useLogger(event as never).child('Test')

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      childLog.debug('hidden')
      childLog.info('hidden')
      childLog.warn('shown')

      expect(debugSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledOnce()
    })

    it('supports nested child().child() stacking scopes', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const nestedLog = useLogger(event as never)
        .child('Module')
        .child('Sub')

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      nestedLog.info('deep log')

      const output = JSON.parse(infoSpy.mock.calls[0]![0] as string)
      expect(output.message).toBe('[Module][Sub] deep log')
    })

    it('includes requestId in child logger output', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const childLog = useLogger(event as never).child('KV')

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      childLog.info('test')

      const output = JSON.parse(infoSpy.mock.calls[0]![0] as string)
      expect(output.requestId).toBeDefined()
      expect(output.requestId.length).toBe(8)
    })

    it('child logger has its own child method', () => {
      mockLogLevel = 'info'
      const event = createMockEvent()
      const childLog = useLogger(event as never).child('A')

      expect(typeof childLog.child).toBe('function')
    })
  })
})
