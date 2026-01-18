import type { DictionaryEntry, SearchResult } from './types'

interface IndexEntry {
  term: string
  gloss: string
  pos?: string
}

let indexCache: IndexEntry[] | null = null
const shardCache = new Map<string, Record<string, DictionaryEntry>>()

function normalizeTerm(term: string) {
  return term.trim().toLowerCase()
}

function getShardKey(term: string) {
  const normalized = normalizeTerm(term)
  const firstChar = normalized.charAt(0)
  if (firstChar >= 'a' && firstChar <= 'z') {
    return firstChar
  }
  if (firstChar >= '0' && firstChar <= '9') {
    return '0-9'
  }
  return 'misc'
}

async function loadIndex(): Promise<IndexEntry[]> {
  if (indexCache) {
    return indexCache
  }
  const response = await fetch('/data/index.json')
  if (!response.ok) {
    throw new Error('Failed to load search index')
  }
  const data = (await response.json()) as IndexEntry[]
  indexCache = data
  return data
}

async function loadShard(shardKey: string): Promise<Record<string, DictionaryEntry>> {
  if (shardCache.has(shardKey)) {
    return shardCache.get(shardKey) ?? {}
  }
  const response = await fetch(`/data/defs/${shardKey}.json`)
  if (!response.ok) {
    throw new Error('Failed to load shard')
  }
  const data = (await response.json()) as Record<string, DictionaryEntry>
  shardCache.set(shardKey, data)
  return data
}

async function loadCustomEntries(): Promise<DictionaryEntry[]> {
  if (typeof window === 'undefined' || !window.spark?.kv) {
    return []
  }
  try {
    const customEntries = await window.spark.kv.get<DictionaryEntry[]>('custom-entries')
    if (customEntries && Array.isArray(customEntries)) {
      return customEntries
    }
  } catch (error) {
    console.error('Failed to load custom entries:', error)
  }
  return []
}

function searchCustomEntries(query: string, entries: DictionaryEntry[]): SearchResult[] {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return []

  const startsWithMatches: SearchResult[] = []
  const containsMatches: SearchResult[] = []

  for (const entry of entries) {
    const termLower = entry.term.toLowerCase()
    const result: SearchResult = {
      term: entry.term,
      gloss: entry.senses[0]?.gloss ?? '',
      pos: entry.senses[0]?.pos,
    }

    if (termLower.startsWith(normalized)) {
      startsWithMatches.push(result)
    } else if (termLower.includes(normalized)) {
      containsMatches.push(result)
    }
  }

  return [...startsWithMatches, ...containsMatches]
}

function searchIndexEntries(index: IndexEntry[], query: string, limit = 20): SearchResult[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  const startsWithMatches: SearchResult[] = []
  const containsMatches: SearchResult[] = []

  for (const entry of index) {
    const termLower = entry.term.toLowerCase()
    const result: SearchResult = {
      term: entry.term,
      gloss: entry.gloss,
      pos: entry.pos,
    }
    if (termLower.startsWith(normalized)) {
      startsWithMatches.push(result)
    } else if (termLower.includes(normalized)) {
      containsMatches.push(result)
    }
  }

  return [...startsWithMatches, ...containsMatches].slice(0, limit)
}

export async function searchEntries(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  let apiResults: SearchResult[] = []
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    if (response.ok) {
      const data = (await response.json()) as { results: SearchResult[] }
      apiResults = data.results
    } else {
      const index = await loadIndex()
      apiResults = searchIndexEntries(index, query)
    }
  } catch (error) {
    const index = await loadIndex()
    apiResults = searchIndexEntries(index, query)
  }

  const customEntries = await loadCustomEntries()
  const customResults = searchCustomEntries(query, customEntries)

  const merged = [...customResults, ...apiResults]
  const seen = new Set<string>()
  const deduped: SearchResult[] = []
  for (const result of merged) {
    const key = result.term.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(result)
    }
  }

  return deduped.slice(0, 20)
}

export async function getEntryByTerm(term: string): Promise<DictionaryEntry | null> {
  const trimmed = term.trim()
  if (!trimmed) return null

  try {
    const response = await fetch(`/api/word?term=${encodeURIComponent(trimmed)}`)
    if (response.ok) {
      return (await response.json()) as DictionaryEntry
    }
  } catch (error) {
    // Fall back to local data below.
  }

  try {
    const shard = await loadShard(getShardKey(trimmed))
    const normalized = normalizeTerm(trimmed)
    const entry = shard[normalized]
    if (entry) {
      return entry
    }
  } catch (error) {
    // Ignore and fall back to custom entries.
  }

  const customEntries = await loadCustomEntries()
  const normalized = trimmed.toLowerCase()
  return customEntries.find((entry) => entry.term.toLowerCase() === normalized) ?? null
}

export async function getRandomEntry(): Promise<SearchResult | null> {
  const index = await loadIndex()
  if (!index.length) return null
  const randomEntry = index[Math.floor(Math.random() * index.length)]
  return {
    term: randomEntry.term,
    gloss: randomEntry.gloss,
    pos: randomEntry.pos,
  }
}

export async function getIndexEntries(): Promise<SearchResult[]> {
  const index = await loadIndex()
  return index.map((entry) => ({
    term: entry.term,
    gloss: entry.gloss,
    pos: entry.pos,
  }))
}
