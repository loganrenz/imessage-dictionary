import crypto from 'crypto'

export function hashEntry(entry) {
  const payload = {
    term: entry.term,
    senses: entry.senses || [],
    source: entry.source || '',
    sourceUrl: entry.sourceUrl || '',
    license: entry.license || '',
  }
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}
