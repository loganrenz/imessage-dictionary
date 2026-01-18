// Free Dictionary API adapter
// Transforms API responses to DictionaryEntry format

export async function fetchWordDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null // Word not found
      }
      if (response.status === 429) {
        // Rate limited - wait and retry once
        await new Promise(resolve => setTimeout(resolve, 2000))
        const retryResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        if (!retryResponse.ok) {
          if (retryResponse.status === 404) {
            return null
          }
          throw new Error(`API error: ${retryResponse.status}`)
        }
        const retryData = await retryResponse.json()
        return transformApiEntry(Array.isArray(retryData) ? retryData[0] : retryData)
      }
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // API returns an array, take first entry
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }
    
    const entry = data[0]
    return transformApiEntry(entry)
  } catch (error) {
    console.error(`Error fetching ${word}:`, error.message)
    return null
  }
}

function transformApiEntry(apiEntry) {
  const senses = []
  
  // Convert meanings to senses
  for (const meaning of apiEntry.meanings || []) {
    const pos = meaning.partOfSpeech
    
    for (const def of meaning.definitions || []) {
      senses.push({
        pos: pos,
        gloss: def.definition,
        example: def.example || undefined,
      })
    }
  }
  
  if (senses.length === 0) {
    return null
  }
  
  return {
    term: apiEntry.word,
    senses: senses,
    source: 'Free Dictionary API',
    sourceUrl: apiEntry.sourceUrls?.[0] || 'https://dictionaryapi.dev/',
    license: apiEntry.license?.name || 'CC BY-SA 3.0',
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchWordDefinitionsBatch(words, { delayMs = 500, batchSize = 5 } = {}) {
  const entries = []
  const errors = []
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, words.length)}/${words.length})...`)
    
    const batchPromises = batch.map(async (word) => {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return await fetchWordDefinition(word)
    })
    
    const batchResults = await Promise.all(batchPromises)
    
    for (let j = 0; j < batchResults.length; j++) {
      const entry = batchResults[j]
      if (entry) {
        entries.push(entry)
      } else if (entry === null) {
        errors.push({ word: batch[j], error: 'not_found' })
      }
    }
    
    // Small delay between batches
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs * 2))
    }
  }
  
  return { entries, errors }
}
