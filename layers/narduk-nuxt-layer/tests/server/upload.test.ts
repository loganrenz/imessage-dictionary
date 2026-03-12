import { describe, it, expect, vi } from 'vitest'
import {
  validateUploadFiles,
  normalizeExtension,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
} from '../../server/utils/upload'

/**
 * Unit tests for upload validation utilities.
 *
 * Tests MIME-type allowlisting, file-size limits, multi-file validation,
 * and extension normalisation.
 */

// Mock Nitro auto-imports
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

function makeFile(type: string, sizeBytes = 1024): { data: Buffer; type: string } {
  return { data: Buffer.alloc(sizeBytes), type }
}

describe('validateUploadFiles', () => {
  it('accepts valid image types', () => {
    for (const type of ALLOWED_TYPES) {
      expect(() => validateUploadFiles([makeFile(type)])).not.toThrow()
    }
  })

  it('rejects unsupported MIME types', () => {
    expect(() => validateUploadFiles([makeFile('application/pdf')])).toThrow(
      'Unsupported file type: application/pdf',
    )
  })

  it('rejects files with missing type', () => {
    const file = { data: Buffer.alloc(100), type: undefined }
    expect(() => validateUploadFiles([file as never])).toThrow('Unsupported file type: unknown')
  })

  it('rejects files exceeding the size limit', () => {
    const oversized = makeFile('image/png', MAX_FILE_SIZE + 1)
    expect(() => validateUploadFiles([oversized])).toThrow('File exceeds 10MB limit')
  })

  it('accepts files at exactly the size limit', () => {
    const atLimit = makeFile('image/png', MAX_FILE_SIZE)
    expect(() => validateUploadFiles([atLimit])).not.toThrow()
  })

  it('validates each file independently in multi-file uploads', () => {
    const good = makeFile('image/png')
    const bad = makeFile('application/zip')
    expect(() => validateUploadFiles([good, bad])).toThrow('Unsupported file type')
  })

  it('passes when all files in a multi-file upload are valid', () => {
    const files = [makeFile('image/jpeg'), makeFile('image/webp'), makeFile('image/gif')]
    expect(() => validateUploadFiles(files)).not.toThrow()
  })
})

describe('normalizeExtension', () => {
  it('normalises image/jpeg to jpg', () => {
    expect(normalizeExtension('image/jpeg')).toBe('jpg')
  })

  it('normalises image/svg+xml to svg', () => {
    expect(normalizeExtension('image/svg+xml')).toBe('svg')
  })

  it('passes through simple subtypes', () => {
    expect(normalizeExtension('image/png')).toBe('png')
    expect(normalizeExtension('image/webp')).toBe('webp')
    expect(normalizeExtension('image/gif')).toBe('gif')
    expect(normalizeExtension('image/avif')).toBe('avif')
  })

  it('falls back to bin for unknown types', () => {
    expect(normalizeExtension('application')).toBe('bin')
  })
})
