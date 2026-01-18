// Wiktionary JSONL adapter
// Transforms Wiktextract JSONL format to DictionaryEntry format

import { createReadStream, createWriteStream } from 'fs'
import { createInterface } from 'readline'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

/**
 * Parse a single Wiktionary entry (Wiktextract format) and convert to our format
 */
export function transformWiktionaryEntry(jsonLine) {
  try {
    const entry = JSON.parse(jsonLine)
    
    // Skip entries without word
    if (!entry.word) {
      return null
    }
    
    // Filter for English entries only (some entries are for other languages)
    // lang can be "English" (string) or "en" (code)
    if (entry.lang && entry.lang !== 'en' && entry.lang !== 'English') {
      return null
    }
    
    // Build senses from wiktionary entry
    // Senses can be at the top level (for single POS) or within meanings
    const senses = []
    
    // Check if entry has senses directly (top-level)
    if (entry.senses && Array.isArray(entry.senses)) {
      for (const sense of entry.senses) {
        if (!sense.glosses || sense.glosses.length === 0) {
          continue
        }
        
        // Use first gloss as primary definition
        const gloss = Array.isArray(sense.glosses) ? sense.glosses[0] : sense.glosses
        
        // Extract example text - can be a string or object with text property
        let example = undefined
        if (sense.examples && sense.examples.length > 0) {
          const ex = sense.examples[0]
          example = typeof ex === 'string' ? ex : (ex.text || ex.example)
        } else if (sense.example) {
          const ex = sense.example
          example = typeof ex === 'string' ? ex : (ex.text || ex.example)
        }
        
        senses.push({
          pos: sense.pos || entry.pos,
          gloss: typeof gloss === 'string' ? gloss : (gloss.text || gloss.toString() || ''),
          example: example,
        })
      }
    }
    
    // If no senses found, skip this entry
    if (senses.length === 0) {
      return null
    }
    
    // Get source URL
    let sourceUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`
    if (entry.urls?.wiktionary) {
      sourceUrl = entry.urls.wiktionary
    } else if (entry.url) {
      sourceUrl = entry.url
    }
    
    return {
      term: entry.word,
      senses: senses,
      source: 'Wiktionary',
      sourceUrl: sourceUrl,
      license: 'CC BY-SA 3.0',
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    // Skip invalid JSON lines
    return null
  }
}

/**
 * Process Wiktionary JSONL file stream
 * Returns an async generator that yields DictionaryEntry objects
 */
export async function* processWiktionaryJSONL(filePath) {
  const fileStream = createReadStream(filePath)
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })
  
  let lineCount = 0
  let entryCount = 0
  
  for await (const line of rl) {
    lineCount++
    if (lineCount % 10000 === 0) {
      process.stderr.write(`\rProcessed ${lineCount} lines, extracted ${entryCount} entries...`)
    }
    
    const entry = transformWiktionaryEntry(line)
    if (entry) {
      entryCount++
      yield entry
    }
  }
  
  process.stderr.write(`\rProcessed ${lineCount} lines, extracted ${entryCount} entries\n`)
}

/**
 * Download Wiktionary JSONL from kaikki.org
 * Returns the local file path
 */
export async function downloadWiktionaryJSONL(outputPath) {
  const url = 'https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl'
  
  console.log(`Downloading Wiktionary dataset from ${url}...`)
  console.log('This may take a while (file is ~2.8GB)...')
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`)
  }
  
  const totalSize = parseInt(response.headers.get('content-length') || '0', 10)
  let downloaded = 0
  
  const fileStream = createWriteStream(outputPath)
  
  // Create a readable stream from the response body
  const reader = response.body.getReader()
  const readable = new Readable({
    async read() {
      const { done, value } = await reader.read()
      if (done) {
        this.push(null)
      } else {
        downloaded += value.length
        if (totalSize > 0 && downloaded % (10 * 1024 * 1024) < value.length) {
          const percent = ((downloaded / totalSize) * 100).toFixed(1)
          process.stderr.write(`\rDownloaded: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`)
        }
        this.push(value)
      }
    },
  })
  
  await pipeline(readable, fileStream)
  console.log(`\nDownload complete: ${outputPath}`)
  
  return outputPath
}
