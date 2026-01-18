// Direct D1 API population script
// Uses wrangler d1 execute for bulk inserts
import { readFile, readdir } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

const DEFS_DIR = path.join(process.cwd(), 'public', 'data', 'defs')
const BATCH_SIZE = 50 // Insert 50 entries at a time (SQLite has statement size limits)
const CONCURRENT_BATCHES = 1 // Process one batch at a time to avoid overwhelming API

async function getAllShardFiles() {
  const files = await readdir(DEFS_DIR)
  return files.filter(f => f.endsWith('.json')).map(f => path.join(DEFS_DIR, f))
}

async function loadShardFile(filePath) {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

function escapeSqlString(str) {
  if (!str) return 'NULL'
  return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`
}

function buildInsertStatement(entries) {
  if (entries.length === 0) return null
  
  const values = entries.map(entry => {
    const normalizedTerm = entry.term.toLowerCase().trim()
    const firstSense = entry.senses[0] || {}
    
    const term = escapeSqlString(normalizedTerm)
    const pos = escapeSqlString(firstSense.pos)
    const gloss = escapeSqlString(firstSense.gloss || '')
    const example = firstSense.example ? escapeSqlString(firstSense.example) : 'NULL'
    const source = escapeSqlString(entry.source)
    const sourceUrl = entry.sourceUrl ? escapeSqlString(entry.sourceUrl) : 'NULL'
    const license = escapeSqlString(entry.license)
    const updatedAt = entry.updatedAt ? escapeSqlString(entry.updatedAt) : 'NULL'
    const sensesJson = escapeSqlString(JSON.stringify(entry.senses))
    
    return `(${term}, ${pos}, ${gloss}, ${example}, ${source}, ${sourceUrl}, ${license}, ${updatedAt}, ${sensesJson})`
  }).join(',\n    ')
  
  return `INSERT OR REPLACE INTO dictionary_entries (term, pos, gloss, example, source, source_url, license, updated_at, senses_json)\nVALUES\n    ${values};`
}

async function executeSQL(sql, isRemote = true) {
  try {
    const remoteFlag = isRemote ? '--remote' : ''
    const cmd = `wrangler d1 execute dict-nard-uk-db ${remoteFlag} --command="${sql.replace(/"/g, '\\"')}"`
    
    const { stdout, stderr } = await execAsync(cmd, {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    })
    
    return { success: true, stdout, stderr }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function populateDatabase(limitShards = null, limitEntries = null) {
  console.log('Loading shard files...')
  let shardFiles = await getAllShardFiles()
  const totalShards = shardFiles.length
  
  if (limitShards) {
    shardFiles = shardFiles.slice(0, limitShards)
    console.log(`Limited to first ${shardFiles.length} shards (of ${totalShards} total)`)
  } else {
    console.log(`Found ${shardFiles.length} shard files`)
  }

  const allEntries = []
  let processed = 0

  // Load all entries
  for (const filePath of shardFiles) {
    try {
      const shardData = await loadShardFile(filePath)
      
      for (const [term, entry] of Object.entries(shardData)) {
        allEntries.push(entry)
        
        if (limitEntries && allEntries.length >= limitEntries) {
          break
        }
      }
      
      processed++
      if (processed % 100 === 0) {
        process.stderr.write(`\rLoaded ${processed}/${shardFiles.length} shards, ${allEntries.length} entries...`)
      }
      
      if (limitEntries && allEntries.length >= limitEntries) {
        break
      }
    } catch (error) {
      console.error(`\nError loading ${filePath}:`, error.message)
    }
  }
  
  process.stderr.write(`\rLoaded ${processed}/${shardFiles.length} shards, ${allEntries.length} entries\n`)
  console.log(`Total entries to insert: ${allEntries.length}`)

  // Insert in batches
  console.log(`Inserting entries in batches of ${BATCH_SIZE}...`)
  let inserted = 0
  let failed = 0
  
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE)
    const sql = buildInsertStatement(batch)
    
    if (!sql) continue
    
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allEntries.length / BATCH_SIZE)
    
    process.stderr.write(`\rInserting batch ${batchNum}/${totalBatches} (${inserted + batch.length}/${allEntries.length} entries)...`)
    
    const result = await executeSQL(sql, true)
    
    if (result.success) {
      inserted += batch.length
    } else {
      failed += batch.length
      console.error(`\nError in batch ${batchNum}:`, result.error)
      // Continue with next batch
    }
    
    // Small delay to avoid rate limiting
    if (i + BATCH_SIZE < allEntries.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  process.stderr.write(`\rInserted ${inserted}/${allEntries.length} entries`)
  if (failed > 0) {
    console.log(`\nFailed: ${failed} entries`)
  }
  console.log(`\n✅ Population complete!`)
  console.log(`   Inserted: ${inserted} entries`)
  if (failed > 0) {
    console.log(`   Failed: ${failed} entries`)
  }
}

async function main() {
  try {
    const args = process.argv.slice(2)
    const limitShards = args.includes('--limit-shards') 
      ? parseInt(args[args.indexOf('--limit-shards') + 1]) || null 
      : null
    const limitEntries = args.includes('--limit-entries')
      ? parseInt(args[args.indexOf('--limit-entries') + 1]) || null
      : null
    
    if (limitShards || limitEntries) {
      console.log('⚠️  TEST MODE - Limited population')
      if (limitShards) console.log(`   Limiting to ${limitShards} shards`)
      if (limitEntries) console.log(`   Limiting to ${limitEntries} entries`)
      console.log('')
    } else {
      console.log('🚀 Starting full database population...')
      console.log(`   This will insert ~1.3M entries and may take 30-60 minutes`)
      console.log('')
    }
    
    await populateDatabase(limitShards, limitEntries)
    
  } catch (error) {
    console.error('Population failed:', error)
    process.exit(1)
  }
}

main()
