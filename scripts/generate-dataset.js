import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const DEFS_DIR = path.join(OUTPUT_DIR, 'defs')
const SEED_PATH = path.join(process.cwd(), 'scripts', 'dictionary-data.json')
const MAX_SHARD_SIZE_BYTES = 5 * 1024 * 1024

function normalizeTerm(term) {
  return term.trim().toLowerCase()
}

function getShardKey(term) {
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

function validateEntry(entry) {
  if (!entry.term || !entry.term.trim()) {
    throw new Error('Entry missing term')
  }
  if (!Array.isArray(entry.senses) || entry.senses.length === 0) {
    throw new Error(`Entry ${entry.term} missing senses`)
  }
  if (!entry.senses[0].gloss) {
    throw new Error(`Entry ${entry.term} missing gloss`)
  }
}

async function loadSeedEntries() {
  const raw = await readFile(SEED_PATH, 'utf-8')
  const entries = JSON.parse(raw)
  if (!Array.isArray(entries)) {
    throw new Error('Seed dataset is not an array')
  }
  entries.forEach(validateEntry)
  return entries
}

function stableSort(entries) {
  return [...entries].sort((a, b) => a.term.localeCompare(b.term, 'en'))
}

function buildIndex(entries) {
  return entries.map((entry) => ({
    term: entry.term,
    gloss: entry.senses[0].gloss,
    pos: entry.senses[0].pos,
  }))
}

function buildShards(entries) {
  const shards = new Map()
  for (const entry of entries) {
    const shardKey = getShardKey(entry.term)
    if (!shards.has(shardKey)) {
      shards.set(shardKey, {})
    }
    const normalized = normalizeTerm(entry.term)
    shards.get(shardKey)[normalized] = entry
  }
  return shards
}

function toSortedObject(obj) {
  const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b, 'en'))
  const sorted = {}
  for (const key of sortedKeys) {
    sorted[key] = obj[key]
  }
  return sorted
}

async function writeJson(filePath, data) {
  const json = JSON.stringify(data, null, 2)
  await writeFile(filePath, `${json}\n`)
  return Buffer.byteLength(json, 'utf-8')
}

async function main() {
  const entries = stableSort(await loadSeedEntries())
  const index = stableSort(buildIndex(entries))
  const shards = buildShards(entries)

  await mkdir(DEFS_DIR, { recursive: true })

  await writeJson(path.join(OUTPUT_DIR, 'index.json'), index)

  for (const [shardKey, shardEntries] of shards.entries()) {
    const ordered = toSortedObject(shardEntries)
    const size = await writeJson(path.join(DEFS_DIR, `${shardKey}.json`), ordered)
    if (size > MAX_SHARD_SIZE_BYTES) {
      throw new Error(`Shard ${shardKey} exceeds size limit: ${size} bytes`)
    }
  }

  const meta = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'seed',
    entries: entries.length,
    shardStrategy: 'first-character',
  }

  await writeJson(path.join(OUTPUT_DIR, 'meta.json'), meta)
  console.log(`Generated dataset with ${entries.length} entries in ${shards.size} shards.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
