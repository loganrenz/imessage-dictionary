export interface DictionarySense {
  pos?: string
  gloss: string
  example?: string
}

export interface DictionaryEntry {
  term: string
  senses: DictionarySense[]
  source: string
  sourceUrl?: string
  license: string
  updatedAt: string
}

export interface SearchResult {
  term: string
  preview: string
}
