import { readFile } from 'fs/promises'
import path from 'path'

const indexCache = {
  value: null,
}

const shardCache = new Map()

const DATA_ROOT = path.join(process.cwd(), 'public', 'data')

export function normalizeTerm(term) {
  return term.trim().toLowerCase()
}

export function getShardKey(term) {
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

async function readJson(relativePath) {
  const fullPath = path.join(DATA_ROOT, relativePath)
  const contents = await readFile(fullPath, 'utf-8')
  return JSON.parse(contents)
}

export async function loadIndex() {
  if (indexCache.value) {
    return indexCache.value
  }
  const index = await readJson('index.json')
  indexCache.value = index
  return index
}

export async function loadShard(shardKey) {
  if (shardCache.has(shardKey)) {
    return shardCache.get(shardKey)
  }
  const shard = await readJson(path.join('defs', `${shardKey}.json`))
  shardCache.set(shardKey, shard)
  return shard
}

export async function getEntryByTerm(term) {
  const normalized = normalizeTerm(term)
  if (!normalized) {
    return null
  }
  const shardKey = getShardKey(normalized)
  const shard = await loadShard(shardKey)
  return shard[normalized] ?? null
}

export function searchIndex(index, query, limit = 20) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return []
  }

  const startsWithMatches = []
  const containsMatches = []

  for (const entry of index) {
    const termLower = entry.term.toLowerCase()
    if (termLower.startsWith(normalized)) {
      startsWithMatches.push(entry)
    } else if (termLower.includes(normalized)) {
      containsMatches.push(entry)
    }
  }

  return [...startsWithMatches, ...containsMatches].slice(0, limit)
}
