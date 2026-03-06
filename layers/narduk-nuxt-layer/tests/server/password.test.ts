import { describe, it, expect } from 'vitest'
import { hashUserPassword, verifyUserPassword } from '../../server/utils/password'

describe('password', () => {
  it('hashUserPassword returns salt:hash format', async () => {
    const hash = await hashUserPassword('test-password')
    expect(hash).toContain(':')
    const [salt, derived] = hash.split(':')
    expect(salt).toHaveLength(32) // 16 bytes = 32 hex chars
    expect(derived).toHaveLength(64) // 256 bits = 32 bytes = 64 hex chars
  })

  it('hashUserPassword produces different hashes for the same password (random salt)', async () => {
    const hash1 = await hashUserPassword('same-password')
    const hash2 = await hashUserPassword('same-password')
    expect(hash1).not.toBe(hash2)
  })

  it('verifyUserPassword returns true for correct password', async () => {
    const hash = await hashUserPassword('correct-password')
    const result = await verifyUserPassword('correct-password', hash)
    expect(result).toBe(true)
  })

  it('verifyUserPassword returns false for incorrect password', async () => {
    const hash = await hashUserPassword('correct-password')
    const result = await verifyUserPassword('wrong-password', hash)
    expect(result).toBe(false)
  })

  it('verifyUserPassword returns false for malformed stored hash', async () => {
    expect(await verifyUserPassword('test', '')).toBe(false)
    expect(await verifyUserPassword('test', 'no-colon')).toBe(false)
    expect(await verifyUserPassword('test', ':')).toBe(false)
  })
})
