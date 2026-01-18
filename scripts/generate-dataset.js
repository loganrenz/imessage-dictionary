import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import { fetchWordDefinitionsBatch } from './adapters/free-dictionary-api.js'
import { processWiktionaryJSONL, downloadWiktionaryJSONL } from './adapters/wiktionary.js'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const DEFS_DIR = path.join(OUTPUT_DIR, 'defs')
const SEED_PATH = path.join(process.cwd(), 'scripts', 'dictionary-data.json')
const COMMON_WORDS_PATH = path.join(process.cwd(), 'scripts', 'common-words.json')
const WIKTIONARY_CACHE_PATH = path.join(process.cwd(), 'scripts', 'wiktionary-cache.jsonl')
const MAX_SHARD_SIZE_BYTES = 5 * 1024 * 1024

function normalizeTerm(term) {
  return term.trim().toLowerCase()
}

function getShardKey(term) {
  const normalized = normalizeTerm(term)
  const firstChar = normalized.charAt(0)
  
  // Use first two characters for more granular sharding (handles large datasets)
  if (firstChar >= 'a' && firstChar <= 'z') {
    const secondChar = normalized.charAt(1)
    if (secondChar && secondChar >= 'a' && secondChar <= 'z') {
      return `${firstChar}${secondChar}`
    }
    // Fallback to single char if no second char
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
  try {
    const raw = await readFile(SEED_PATH, 'utf-8')
    const entries = JSON.parse(raw)
    if (!Array.isArray(entries)) {
      throw new Error('Seed dataset is not an array')
    }
    entries.forEach(validateEntry)
    return entries
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function loadCommonWords() {
  try {
    const raw = await readFile(COMMON_WORDS_PATH, 'utf-8')
    const words = JSON.parse(raw)
    if (!Array.isArray(words)) {
      throw new Error('Common words list is not an array')
    }
    return words.filter(w => w && typeof w === 'string').map(w => w.trim().toLowerCase()).filter(Boolean)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

function mergeEntries(seedEntries, apiEntries) {
  // Create a map from seed entries (these take priority)
  const entryMap = new Map()
  
  // Add seed entries first (they take priority)
  for (const entry of seedEntries) {
    const normalized = normalizeTerm(entry.term)
    entryMap.set(normalized, entry)
  }
  
  // Add API entries, but skip if already exists from seed
  for (const entry of apiEntries) {
    const normalized = normalizeTerm(entry.term)
    if (!entryMap.has(normalized)) {
      entryMap.set(normalized, entry)
    }
  }
  
  return Array.from(entryMap.values())
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

function estimateShardSize(shardEntries) {
  // Use same format as writeJson: JSON.stringify(data, null, 2)
  const ordered = toSortedObject(shardEntries)
  const json = JSON.stringify(ordered, null, 2)
  return Buffer.byteLength(json, 'utf-8')
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
  
  // Check sizes and recursively split large shards
  const finalShards = new Map()
  const queue = Array.from(shards.entries())
  
  while (queue.length > 0) {
    const [shardKey, shardEntries] = queue.shift()
    const size = estimateShardSize(shardEntries)
    
    if (size > MAX_SHARD_SIZE_BYTES) {
      // Split large shard using first N characters with dash separator
      const splitShards = new Map()
      const baseLen = shardKey.length
      for (const [term, entry] of Object.entries(shardEntries)) {
        // Use more characters for split (baseLen + 2-4 chars)
        const prefix = term.substring(0, Math.min(baseLen + 4, term.length))
        // Ensure new key uses dash separator and is valid
        const suffix = prefix.substring(baseLen)
        const newKey = suffix ? `${shardKey}-${suffix}` : `${shardKey}-${term.substring(0, Math.min(4, term.length))}`
        // Sanitize key to ensure valid filename (no slashes, etc.)
        const safeKey = newKey.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        if (!splitShards.has(safeKey)) {
          splitShards.set(safeKey, {})
        }
        splitShards.get(safeKey)[term] = entry
      }
      // Add split shards back to queue for size check
      for (const [newKey, newEntries] of splitShards.entries()) {
        queue.push([newKey, newEntries])
      }
    } else {
      finalShards.set(shardKey, shardEntries)
    }
  }
  
  return finalShards
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

async function loadWiktionaryEntries(forceDownload = false) {
  const entries = []
  
  // Check if cached file exists
  let filePath = WIKTIONARY_CACHE_PATH
  try {
    await access(filePath, constants.F_OK)
    console.log(`Using cached Wiktionary file: ${filePath}`)
  } catch (error) {
    if (error.code === 'ENOENT' || forceDownload) {
      console.log('Wiktionary cache not found, downloading...')
      filePath = await downloadWiktionaryJSONL(WIKTIONARY_CACHE_PATH)
    } else {
      throw error
    }
  }
  
  // Stream process the JSONL file
  console.log('Processing Wiktionary JSONL file (this may take a while)...')
  let count = 0
  for await (const entry of processWiktionaryJSONL(filePath)) {
    entries.push(entry)
    count++
    if (count % 1000 === 0) {
      process.stderr.write(`\rProcessed ${count} entries...`)
    }
  }
  process.stderr.write(`\rProcessed ${count} entries\n`)
  
  return entries
}

async function main() {
  const useApi = process.argv.includes('--api')
  const useWiktionary = process.argv.includes('--wiktionary')
  const forceDownload = process.argv.includes('--download')
  
  // Load seed entries
  const seedEntries = await loadSeedEntries()
  console.log(`Loaded ${seedEntries.length} seed entries`)
  
  let additionalEntries = []
  
  if (useWiktionary) {
    // Load from Wiktionary JSONL
    const wiktionaryEntries = await loadWiktionaryEntries(forceDownload)
    console.log(`Loaded ${wiktionaryEntries.length} entries from Wiktionary`)
    additionalEntries = wiktionaryEntries
  } else if (useApi) {
    // Load word list and fetch from API
    const words = await loadCommonWords()
    console.log(`Loading ${words.length} words from API...`)
    
    if (words.length > 0) {
      const { entries, errors } = await fetchWordDefinitionsBatch(words, {
        delayMs: 500,
        batchSize: 5,
      })
      
      additionalEntries = entries
      console.log(`Fetched ${entries.length} entries from API`)
      if (errors.length > 0) {
        console.log(`Failed to fetch ${errors.length} words:`, errors.slice(0, 10).map(e => e.word).join(', '))
      }
    }
  }
  
  // Merge entries (seed takes priority)
  const allEntries = mergeEntries(seedEntries, additionalEntries)
  const sortedEntries = stableSort(allEntries)
  const index = stableSort(buildIndex(sortedEntries))
  const shards = buildShards(sortedEntries)

  await mkdir(DEFS_DIR, { recursive: true })

  await writeJson(path.join(OUTPUT_DIR, 'index.json'), index)

  for (const [shardKey, shardEntries] of shards.entries()) {
    const ordered = toSortedObject(shardEntries)
    const size = await writeJson(path.join(DEFS_DIR, `${shardKey}.json`), ordered)
    if (size > MAX_SHARD_SIZE_BYTES) {
      throw new Error(`Shard ${shardKey} exceeds size limit: ${size} bytes`)
    }
  }

  const sources = []
  sources.push('seed')
  if (useWiktionary && additionalEntries.length > 0) {
    sources.push('wiktionary')
  } else if (useApi && additionalEntries.length > 0) {
    sources.push('free-dictionary-api')
  }

  const meta = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: sources.join('+'),
    entries: sortedEntries.length,
    shardStrategy: 'first-character',
  }

  await writeJson(path.join(OUTPUT_DIR, 'meta.json'), meta)
  console.log(`Generated dataset with ${sortedEntries.length} entries in ${shards.size} shards.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
