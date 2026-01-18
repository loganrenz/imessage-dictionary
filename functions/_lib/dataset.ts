// D1 database dataset loader
// Replaces file-based shard approach with indexed database queries

export interface DictionaryEntry {
  term: string
  pos?: string
  gloss: string
  example?: string
  source?: string
  sourceUrl?: string
  license?: string
  updatedAt?: string
  senses: Array<{
    pos?: string
    gloss: string
    example?: string
  }>
}

export function normalizeTerm(term: string): string {
  return term.trim().toLowerCase()
}

/**
 * Get dictionary entry by term (exact match)
 */
export async function getEntryByTerm(env: any, term: string): Promise<DictionaryEntry | null> {
  const normalized = normalizeTerm(term)
  if (!normalized) {
    return null
  }

  try {
    const result = await env.DB.prepare(
      'SELECT term, pos, gloss, example, source, source_url, license, updated_at, senses_json FROM dictionary_entries WHERE term = ?1'
    )
      .bind(normalized)
      .first<{
        term: string
        pos: string | null
        gloss: string
        example: string | null
        source: string | null
        source_url: string | null
        license: string | null
        updated_at: string | null
        senses_json: string
      }>()

    if (!result) {
      return null
    }

    // Parse senses from JSON
    const senses = JSON.parse(result.senses_json) as Array<{
      pos?: string
      gloss: string
      example?: string
    }>

    return {
      term: result.term,
      pos: result.pos || undefined,
      gloss: result.gloss,
      example: result.example || undefined,
      source: result.source || undefined,
      sourceUrl: result.source_url || undefined,
      license: result.license || undefined,
      updatedAt: result.updated_at || undefined,
      senses,
    }
  } catch (error: any) {
    console.error(`Error fetching term "${normalized}":`, error.message)
    return null
  }
}

/**
 * Search dictionary entries (prefix and contains match)
 * Returns results sorted by: starts-with matches first, then contains matches
 */
export async function searchEntries(
  env: any,
  query: string,
  limit: number = 20
): Promise<Array<{ term: string; pos?: string; gloss: string }>> {
  const normalized = normalizeTerm(query)
  if (!normalized) {
    return []
  }

  try {
    // Search for terms starting with query (higher priority)
    const startsWithQuery = env.DB.prepare(
      `SELECT term, pos, gloss FROM dictionary_entries 
       WHERE term LIKE ?1 || '%' 
       ORDER BY term 
       LIMIT ?2`
    ).bind(normalized, limit)

    // Search for terms containing query (lower priority)
    const containsQuery = env.DB.prepare(
      `SELECT term, pos, gloss FROM dictionary_entries 
       WHERE term LIKE '%' || ?1 || '%' 
       AND term NOT LIKE ?1 || '%'
       ORDER BY term 
       LIMIT ?2`
    ).bind(normalized, limit)

    // Execute both queries
    const [startsWithResults, containsResults] = await Promise.all([
      startsWithQuery.all<{ term: string; pos: string | null; gloss: string }>(),
      containsQuery.all<{ term: string; pos: string | null; gloss: string }>(),
    ])

    // Combine results (starts-with first, then contains)
    const startsWith = (startsWithResults.results || []).map(r => ({
      term: r.term,
      pos: r.pos || undefined,
      gloss: r.gloss,
    }))

    const contains = (containsResults.results || [])
      .map(r => ({
        term: r.term,
        pos: r.pos || undefined,
        gloss: r.gloss,
      }))
      .slice(0, Math.max(0, limit - startsWith.length))

    return [...startsWith, ...contains]
  } catch (error: any) {
    console.error(`Error searching for "${normalized}":`, error.message)
    return []
  }
}

/**
 * Load index for search (now uses D1 query instead of file)
 * Returns minimal entry data for search results
 */
export async function loadIndex(env: any, limit: number = 10000): Promise<
  Array<{
    term: string
    pos?: string
    gloss: string
  }>
> {
  try {
    const result = await env.DB.prepare(
      `SELECT term, pos, gloss FROM dictionary_entries ORDER BY term LIMIT ?1`
    )
      .bind(limit)
      .all<{ term: string; pos: string | null; gloss: string }>()

    return (result.results || []).map(r => ({
      term: r.term,
      pos: r.pos || undefined,
      gloss: r.gloss,
    }))
  } catch (error: any) {
    console.error('Error loading index:', error.message)
    return []
  }
}

/**
 * Legacy compatibility: search index using D1 (for frontend compatibility)
 */
export function searchIndex(
  index: Array<{ term: string; pos?: string; gloss: string }>,
  query: string,
  limit: number = 20
): Array<{ term: string; pos?: string; gloss: string }> {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return []
  }

  const startsWithMatches: Array<{ term: string; pos?: string; gloss: string }> = []
  const containsMatches: Array<{ term: string; pos?: string; gloss: string }> = []

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
