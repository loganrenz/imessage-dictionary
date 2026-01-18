#!/usr/bin/env node
// Fast D1 population script using HTTP API with parallel batches
import { readFile, readdir } from 'fs/promises'
import path from 'path'

const DEFS_DIR = path.join(process.cwd(), 'public', 'data', 'defs.bak')
const BATCH_SIZE = 200 // Entries per SQL statement
const CONCURRENT_REQUESTS = 8 // Parallel HTTP requests
const DB_NAME = 'dict-nard-uk-db'
const DB_ID = '9470aa0e-ecb7-476a-92a1-5576b7f92ce4'

// Cloudflare account (not sensitive)
const ACCOUNT_ID = 'd715f0aeb6b2e7b10f54e9e72fba8fdd'
// API token from environment (set by doppler)
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

if (!API_TOKEN) {
  console.error('Missing CLOUDFLARE_API_TOKEN')
  console.error('Run with: doppler run --project=dict-nard-uk --config=prd -- node scripts/populate-d1-fast.js')
  process.exit(1)
}

const API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL'
  return `'${String(str).replace(/'/g, "''")}'`
}

function buildInsertStatement(entries) {
  if (entries.length === 0) return null
  
  const values = entries.map(entry => {
    const normalizedTerm = entry.term.toLowerCase().trim()
    const firstSense = entry.senses[0] || {}
    
    return `(${escapeSqlString(normalizedTerm)}, ${escapeSqlString(firstSense.pos)}, ${escapeSqlString(firstSense.gloss || '')}, ${firstSense.example ? escapeSqlString(firstSense.example) : 'NULL'}, ${escapeSqlString(entry.source)}, ${entry.sourceUrl ? escapeSqlString(entry.sourceUrl) : 'NULL'}, ${escapeSqlString(entry.license)}, ${entry.updatedAt ? escapeSqlString(entry.updatedAt) : 'NULL'}, ${escapeSqlString(JSON.stringify(entry.senses))})`
  }).join(',\n')
  
  return `INSERT OR IGNORE INTO dictionary_entries (term, pos, gloss, example, source, source_url, license, updated_at, senses_json) VALUES ${values};`
}

async function executeSQL(sql) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  })
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.errors?.[0]?.message || 'Unknown error')
  }
  return result
}

async function getExistingTerms() {
  console.log('Getting existing terms from database...')
  const result = await executeSQL('SELECT term FROM dictionary_entries')
  const terms = new Set(result.result?.[0]?.results?.map(r => r.term) || [])
  console.log(`Found ${terms.size} existing terms`)
  return terms
}

async function getAllShardFiles() {
  const files = await readdir(DEFS_DIR)
  return files.filter(f => f.endsWith('.json')).sort()
}

async function loadShardFile(filePath) {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function processBatch(entries, batchNum, totalBatches) {
  const sql = buildInsertStatement(entries)
  if (!sql) return { inserted: 0, failed: 0 }
  
  try {
    await executeSQL(sql)
    return { inserted: entries.length, failed: 0 }
  } catch (error) {
    console.error(`\nBatch ${batchNum} failed: ${error.message}`)
    return { inserted: 0, failed: entries.length }
  }
}

async function main() {
  console.log('🚀 Fast D1 Population Script')
  console.log(`   Batch size: ${BATCH_SIZE}`)
  console.log(`   Concurrent requests: ${CONCURRENT_REQUESTS}`)
  console.log('')
  
  // Get existing terms to skip duplicates
  const existingTerms = await getExistingTerms()
  
  // Load all shard files
  console.log('Loading shard files...')
  const shardFiles = await getAllShardFiles()
  console.log(`Found ${shardFiles.length} shard files`)
  
  // Collect all new entries
  const allEntries = []
  let skipped = 0
  
  for (let i = 0; i < shardFiles.length; i++) {
    const filePath = path.join(DEFS_DIR, shardFiles[i])
    try {
      const shardData = await loadShardFile(filePath)
      
      for (const [key, entry] of Object.entries(shardData)) {
        const normalizedTerm = entry.term.toLowerCase().trim()
        if (existingTerms.has(normalizedTerm)) {
          skipped++
          continue
        }
        allEntries.push(entry)
        existingTerms.add(normalizedTerm) // Track to avoid duplicates within this run
      }
      
      if ((i + 1) % 1000 === 0 || i === shardFiles.length - 1) {
        process.stderr.write(`\rLoaded ${i + 1}/${shardFiles.length} files, ${allEntries.length} new entries (${skipped} skipped)`)
      }
    } catch (error) {
      console.error(`\nError loading ${shardFiles[i]}:`, error.message)
    }
  }
  
  console.log(`\n\nTotal new entries to insert: ${allEntries.length}`)
  console.log(`Skipped (already exist): ${skipped}`)
  
  if (allEntries.length === 0) {
    console.log('\n✅ Database already up to date!')
    return
  }
  
  // Create batches
  const batches = []
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    batches.push(allEntries.slice(i, i + BATCH_SIZE))
  }
  
  console.log(`\nProcessing ${batches.length} batches with ${CONCURRENT_REQUESTS} concurrent requests...`)
  
  let inserted = 0
  let failed = 0
  let completed = 0
  const startTime = Date.now()
  
  // Process batches in parallel chunks
  for (let i = 0; i < batches.length; i += CONCURRENT_REQUESTS) {
    const chunk = batches.slice(i, i + CONCURRENT_REQUESTS)
    
    const results = await Promise.all(
      chunk.map((batch, idx) => processBatch(batch, i + idx + 1, batches.length))
    )
    
    for (const result of results) {
      inserted += result.inserted
      failed += result.failed
      completed++
    }
    
    const elapsed = (Date.now() - startTime) / 1000
    const rate = inserted / elapsed
    const remaining = (allEntries.length - inserted - failed) / rate
    
    process.stderr.write(`\r[${completed}/${batches.length}] Inserted: ${inserted}, Failed: ${failed}, Rate: ${Math.round(rate)}/s, ETA: ${Math.round(remaining)}s   `)
  }
  
  const totalTime = (Date.now() - startTime) / 1000
  console.log(`\n\n✅ Population complete!`)
  console.log(`   Inserted: ${inserted} entries`)
  console.log(`   Failed: ${failed} entries`)
  console.log(`   Time: ${Math.round(totalTime)}s`)
  console.log(`   Rate: ${Math.round(inserted / totalTime)} entries/second`)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
