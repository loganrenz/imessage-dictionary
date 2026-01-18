import { stat, readdir } from 'fs/promises'
import path from 'path'
import { loadIndex, getEntryByTerm, searchIndex } from '../server/dataset.js'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
const DEFS_DIR = path.join(DATA_DIR, 'defs')
const MAX_SHARD_SIZE_BYTES = 5 * 1024 * 1024

async function checkShardSizes() {
  const files = await readdir(DEFS_DIR)
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const filePath = path.join(DEFS_DIR, file)
    const { size } = await stat(filePath)
    if (size > MAX_SHARD_SIZE_BYTES) {
      throw new Error(`Shard ${file} exceeds size limit: ${size} bytes`)
    }
  }
}

async function checkSearchAndWord() {
  const index = await loadIndex()
  if (!Array.isArray(index) || index.length === 0) {
    throw new Error('Index is empty')
  }

  const searchResults = searchIndex(index, 'serendipity', 5)
  if (!searchResults.some((result) => result.term.toLowerCase() === 'serendipity')) {
    throw new Error('Search results missing serendipity')
  }

  const entry = await getEntryByTerm('serendipity')
  if (!entry || entry.term.toLowerCase() !== 'serendipity') {
    throw new Error('Word lookup failed for serendipity')
  }
}

async function main() {
  await checkShardSizes()
  await checkSearchAndWord()
  console.log('Sanity checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
