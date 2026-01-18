// Migration script to populate D1 database from shard files
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const DEFS_DIR = path.join(process.cwd(), 'public', 'data', 'defs')
const BATCH_SIZE = 1000 // Insert in batches

async function getAllShardFiles() {
  const files = await readdir(DEFS_DIR)
  return files.filter(f => f.endsWith('.json')).map(f => path.join(DEFS_DIR, f))
}

async function loadShardFile(filePath) {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function insertBatch(db, entries) {
  if (entries.length === 0) return

  // Prepare batch insert
  const placeholders = entries.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
  const values = entries.flatMap(entry => {
    const normalizedTerm = entry.term.toLowerCase().trim()
    const firstSense = entry.senses[0] || {}
    
    return [
      normalizedTerm,
      firstSense.pos || null,
      firstSense.gloss || '',
      firstSense.example || null,
      entry.source || null,
      entry.sourceUrl || null,
      entry.license || null,
      entry.updatedAt || null,
      JSON.stringify(entry.senses) // Store all senses as JSON
    ]
  })

  const sql = `
    INSERT OR REPLACE INTO dictionary_entries 
    (term, pos, gloss, example, source, source_url, license, updated_at, senses_json)
    VALUES ${placeholders}
  `

  // Execute via wrangler d1 execute (for local/dev) or direct SQL binding (for production)
  // For now, we'll prepare a SQL file that can be executed
  return { sql, values: entries.map(e => e.term) }
}

async function generateMigrationSQL(limitShards = null, limitEntries = null) {
  console.log('Loading shard files...')
  let shardFiles = await getAllShardFiles()
  const totalShards = shardFiles.length
  
  // Limit for testing
  if (limitShards) {
    shardFiles = shardFiles.slice(0, limitShards)
    console.log(`Limited to first ${shardFiles.length} shards (of ${totalShards} total)`)
  } else {
    console.log(`Found ${shardFiles.length} shard files`)
  }

  const allEntries = []
  let processed = 0

  for (const filePath of shardFiles) {
    try {
      const shardData = await loadShardFile(filePath)
      
      // Convert shard object to array of entries
      for (const [term, entry] of Object.entries(shardData)) {
        allEntries.push(entry)
        
        // Limit entries for testing
        if (limitEntries && allEntries.length >= limitEntries) {
          break
        }
      }
      
      processed++
      if (processed % 100 === 0) {
        process.stderr.write(`\rProcessed ${processed}/${shardFiles.length} shards, ${allEntries.length} entries...`)
      }
      
      // Stop if we've reached the entry limit
      if (limitEntries && allEntries.length >= limitEntries) {
        break
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message)
    }
  }
  
  process.stderr.write(`\rProcessed ${processed}/${shardFiles.length} shards, ${allEntries.length} entries\n`)
  console.log(`Total entries: ${allEntries.length}`)

  // Generate SQL batches
  console.log('Generating SQL insert statements...')
  const batches = []
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE)
    const { sql } = await insertBatch(null, batch)
    
    // Convert to actual SQL with values
    const sqlWithValues = batch.map(entry => {
      const normalizedTerm = entry.term.toLowerCase().trim()
      const firstSense = entry.senses[0] || {}
      
      const term = normalizedTerm.replace(/'/g, "''")
      const pos = (firstSense.pos || 'NULL').replace(/'/g, "''")
      const gloss = (firstSense.gloss || '').replace(/'/g, "''")
      const example = (firstSense.example || null)?.replace(/'/g, "''") || 'NULL'
      const source = (entry.source || 'NULL').replace(/'/g, "''")
      const sourceUrl = (entry.sourceUrl || null)?.replace(/'/g, "''") || 'NULL'
      const license = (entry.license || 'NULL').replace(/'/g, "''")
      const updatedAt = (entry.updatedAt || null)?.replace(/'/g, "''") || 'NULL'
      const sensesJson = JSON.stringify(entry.senses).replace(/'/g, "''")
      
      return `INSERT OR REPLACE INTO dictionary_entries (term, pos, gloss, example, source, source_url, license, updated_at, senses_json) VALUES ('${term}', '${pos}', '${gloss}', ${example === 'NULL' ? 'NULL' : `'${example}'`}, '${source}', ${sourceUrl === 'NULL' ? 'NULL' : `'${sourceUrl}'`}, '${license}', ${updatedAt === 'NULL' ? 'NULL' : `'${updatedAt}'`}, '${sensesJson}');`
    }).join('\n')
    
    batches.push(sqlWithValues)
  }

  return batches
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
      console.log('Starting D1 migration (TEST MODE)...')
      if (limitShards) console.log(`  - Limiting to ${limitShards} shards`)
      if (limitEntries) console.log(`  - Limiting to ${limitEntries} entries`)
    } else {
      console.log('Starting D1 migration...')
    }
    
    const batches = await generateMigrationSQL(limitShards, limitEntries)
    
    const outputFile = path.join(process.cwd(), 'migrations', '0003_populate_data.sql')
    
    // Write SQL file
    const fs = await import('fs/promises')
    const sql = batches.join('\n\n')
    await fs.writeFile(outputFile, sql, 'utf-8')
    
    console.log(`\nGenerated migration file: ${outputFile}`)
    console.log(`Total SQL statements: ${batches.reduce((sum, b) => sum + (b.match(/INSERT/g) || []).length, 0)}`)
    console.log('\nTo apply migration:')
    console.log('  wrangler d1 migrations apply dict-nard-uk-db')
    console.log('\nNote: This generates a large SQL file. Consider using direct API calls for production.')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
