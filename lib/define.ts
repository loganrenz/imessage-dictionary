export interface DictionarySense {
  pos?: string
  gloss: string
  example?: string
}

export interface Definition {
  term: string
  senses: DictionarySense[]
  source: string
  license: string
  sourceUrl?: string
  createdAt: string
}

// TTL for cache: 30 days in seconds
const CACHE_TTL = 2592000

/**
 * Normalize a term for consistent lookup:
 * - Decode URI components safely
 * - Trim whitespace
 * - Convert to lowercase
 * - Collapse multiple spaces
 * - Max 64 characters
 */
function normalizeTerm(term: string): string {
  try {
    term = decodeURIComponent(term)
  } catch {
    // If decoding fails, use the original term
  }
  
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 64)
}

/**
 * Generate a KV key for a term
 */
function getKvKey(term: string): string {
  return `def:${term}`
}

/**
 * Check if Vercel KV is configured
 */
function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

/**
 * Get a definition from the seed data
 */
function getFromSeedData(normalizedTerm: string): Definition | null {
  const entry = SEED_DATA.find(e => e.term.toLowerCase() === normalizedTerm)
  if (!entry) return null
  
  return {
    term: entry.term,
    senses: entry.senses,
    source: entry.source,
    license: entry.license,
    sourceUrl: entry.sourceUrl,
    createdAt: entry.createdAt
  }
}

/**
 * Main define function - looks up a definition from KV cache or seed data.
 * If not in cache, creates from seed data and caches with 30-day TTL.
 * Returns null if the term is not found.
 */
export async function define(term: string): Promise<Definition | null> {
  const normalizedTerm = normalizeTerm(term)
  
  if (!normalizedTerm) {
    return null
  }
  
  const kvKey = getKvKey(normalizedTerm)
  
  // Try to get from KV cache if configured
  if (isKvConfigured()) {
    try {
      const { kv } = await import('@vercel/kv')
      const cached = await kv.get<Definition>(kvKey)
      if (cached) {
        return cached
      }
    } catch (error) {
      console.error('KV get error:', error)
      // Fall through to seed data
    }
  }
  
  // Get from seed data
  const definition = getFromSeedData(normalizedTerm)
  
  if (definition) {
    // Cache the definition in KV if configured
    if (isKvConfigured()) {
      try {
        const { kv } = await import('@vercel/kv')
        await kv.set(kvKey, definition, { ex: CACHE_TTL })
      } catch (error) {
        console.error('KV set error:', error)
        // Definition still returned even if caching fails
      }
    }
    return definition
  }
  
  return null
}

// Seed data - dictionary entries for the MVP
const SEED_DATA: Definition[] = [
  {
    term: "serendipity",
    senses: [
      {
        pos: "noun",
        gloss: "The occurrence of events by chance in a happy or beneficial way.",
        example: "A fortunate stroke of serendipity brought the two old friends together."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "ephemeral",
    senses: [
      {
        pos: "adjective",
        gloss: "Lasting for a very short time; transitory.",
        example: "The ephemeral beauty of cherry blossoms captivates visitors each spring."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "eloquent",
    senses: [
      {
        pos: "adjective",
        gloss: "Fluent or persuasive in speaking or writing.",
        example: "She delivered an eloquent speech that moved the entire audience."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "paradigm",
    senses: [
      {
        pos: "noun",
        gloss: "A typical example or pattern of something; a model.",
        example: "The discovery represented a paradigm shift in scientific thinking."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "ubiquitous",
    senses: [
      {
        pos: "adjective",
        gloss: "Present, appearing, or found everywhere.",
        example: "Smartphones have become ubiquitous in modern society."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "ambiguous",
    senses: [
      {
        pos: "adjective",
        gloss: "Open to more than one interpretation; not having one obvious meaning.",
        example: "The ending of the film was deliberately ambiguous."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "cognitive",
    senses: [
      {
        pos: "adjective",
        gloss: "Related to the mental action or process of acquiring knowledge.",
        example: "Reading regularly can improve cognitive function."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "pragmatic",
    senses: [
      {
        pos: "adjective",
        gloss: "Dealing with things sensibly and realistically based on practical considerations.",
        example: "She took a pragmatic approach to solving the problem."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "resilient",
    senses: [
      {
        pos: "adjective",
        gloss: "Able to withstand or recover quickly from difficult conditions.",
        example: "The community proved resilient in the face of adversity."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "articulate",
    senses: [
      {
        pos: "adjective",
        gloss: "Having or showing the ability to speak fluently and coherently.",
        example: "He was an articulate advocate for social justice."
      },
      {
        pos: "verb",
        gloss: "To express an idea or feeling fluently and coherently.",
        example: "She articulated her concerns clearly to the committee."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "inevitable",
    senses: [
      {
        pos: "adjective",
        gloss: "Certain to happen; unavoidable.",
        example: "Change is inevitable in any growing organization."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "euphoria",
    senses: [
      {
        pos: "noun",
        gloss: "A feeling or state of intense excitement and happiness.",
        example: "The team was in a state of euphoria after winning the championship."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "nostalgia",
    senses: [
      {
        pos: "noun",
        gloss: "A sentimental longing or wistful affection for the past.",
        example: "The old photographs filled her with nostalgia."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "meticulous",
    senses: [
      {
        pos: "adjective",
        gloss: "Showing great attention to detail; very careful and precise.",
        example: "The scientist kept meticulous records of every experiment."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "empathy",
    senses: [
      {
        pos: "noun",
        gloss: "The ability to understand and share the feelings of another.",
        example: "Good teachers show empathy towards struggling students."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "integrity",
    senses: [
      {
        pos: "noun",
        gloss: "The quality of being honest and having strong moral principles.",
        example: "She was known for her integrity and fairness."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "innovative",
    senses: [
      {
        pos: "adjective",
        gloss: "Featuring new methods; advanced and original.",
        example: "The company developed an innovative solution to reduce waste."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "abstract",
    senses: [
      {
        pos: "adjective",
        gloss: "Existing in thought or as an idea but not having a physical existence.",
        example: "Truth and beauty are abstract concepts."
      },
      {
        pos: "verb",
        gloss: "To consider something theoretically or separately from something else.",
        example: "We can abstract the key principles from these examples."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "benevolent",
    senses: [
      {
        pos: "adjective",
        gloss: "Well meaning and kindly.",
        example: "A benevolent smile spread across her face."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "catalyst",
    senses: [
      {
        pos: "noun",
        gloss: "A person or thing that precipitates an event or change.",
        example: "The invention was a catalyst for industrial revolution."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "diligent",
    senses: [
      {
        pos: "adjective",
        gloss: "Having or showing care and conscientiousness in one's work or duties.",
        example: "She was a diligent student who never missed an assignment."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "eccentric",
    senses: [
      {
        pos: "adjective",
        gloss: "Unconventional and slightly strange.",
        example: "His eccentric behavior made him memorable at parties."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "facetious",
    senses: [
      {
        pos: "adjective",
        gloss: "Treating serious issues with deliberately inappropriate humor.",
        example: "His facetious remarks during the meeting were not appreciated."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "gregarious",
    senses: [
      {
        pos: "adjective",
        gloss: "Fond of company; sociable.",
        example: "She's a gregarious person who loves meeting new people."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "hypothesis",
    senses: [
      {
        pos: "noun",
        gloss: "A supposition made on the basis of limited evidence as a starting point for investigation.",
        example: "Scientists test their hypothesis through careful experimentation."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "intrinsic",
    senses: [
      {
        pos: "adjective",
        gloss: "Belonging naturally; essential.",
        example: "The intrinsic value of education goes beyond career prospects."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "juxtapose",
    senses: [
      {
        pos: "verb",
        gloss: "To place or deal with close together for contrasting effect.",
        example: "The exhibit juxtaposes ancient and modern art."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "kinetic",
    senses: [
      {
        pos: "adjective",
        gloss: "Relating to or resulting from motion.",
        example: "Kinetic energy increases as an object speeds up."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "luminous",
    senses: [
      {
        pos: "adjective",
        gloss: "Full of or shedding light; bright or shining.",
        example: "The luminous moon illuminated the night sky."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "magnanimous",
    senses: [
      {
        pos: "adjective",
        gloss: "Generous or forgiving, especially toward a rival or less powerful person.",
        example: "In a magnanimous gesture, she forgave her opponent."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "nuance",
    senses: [
      {
        pos: "noun",
        gloss: "A subtle difference in or shade of meaning, expression, or sound.",
        example: "The poem is full of nuance and deeper meaning."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "obsolete",
    senses: [
      {
        pos: "adjective",
        gloss: "No longer produced or used; out of date.",
        example: "Floppy disks are now obsolete technology."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "perpetual",
    senses: [
      {
        pos: "adjective",
        gloss: "Never ending or changing; occurring repeatedly.",
        example: "The machine promised perpetual motion, which physics says is impossible."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "quintessential",
    senses: [
      {
        pos: "adjective",
        gloss: "Representing the most perfect or typical example of a quality or class.",
        example: "She is the quintessential professional, always prepared and courteous."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "reciprocate",
    senses: [
      {
        pos: "verb",
        gloss: "To respond to a gesture or action by making a corresponding one.",
        example: "She smiled at him, and he reciprocated warmly."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "substantial",
    senses: [
      {
        pos: "adjective",
        gloss: "Of considerable importance, size, or worth.",
        example: "The company made a substantial profit this quarter."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "tangible",
    senses: [
      {
        pos: "adjective",
        gloss: "Perceptible by touch; clear and definite; real.",
        example: "There are tangible benefits to regular exercise."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "verbose",
    senses: [
      {
        pos: "adjective",
        gloss: "Using or expressed in more words than are needed.",
        example: "His verbose writing style made the report difficult to read."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "whimsical",
    senses: [
      {
        pos: "adjective",
        gloss: "Playfully quaint or fanciful, especially in an appealing way.",
        example: "The artist's whimsical sculptures delighted children and adults alike."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "zealous",
    senses: [
      {
        pos: "adjective",
        gloss: "Having or showing zeal; fervent or enthusiastic.",
        example: "The zealous volunteers worked late into the night."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "aesthetic",
    senses: [
      {
        pos: "adjective",
        gloss: "Concerned with beauty or the appreciation of beauty.",
        example: "The building has great aesthetic appeal."
      },
      {
        pos: "noun",
        gloss: "A set of principles underlying the work of a particular artist.",
        example: "The minimalist aesthetic emphasizes simplicity and functionality."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "brevity",
    senses: [
      {
        pos: "noun",
        gloss: "Concise and exact use of words in writing or speech.",
        example: "The brevity of his speech was appreciated by the tired audience."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "enigma",
    senses: [
      {
        pos: "noun",
        gloss: "A person or thing that is mysterious, puzzling, or difficult to understand.",
        example: "She remained an enigma to her colleagues."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "gratitude",
    senses: [
      {
        pos: "noun",
        gloss: "The quality of being thankful; readiness to show appreciation.",
        example: "She expressed her gratitude for their support."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  },
  {
    term: "wisdom",
    senses: [
      {
        pos: "noun",
        gloss: "The quality of having experience, knowledge, and good judgment.",
        example: "She shared her wisdom with younger colleagues."
      }
    ],
    source: "Demo Dataset",
    license: "CC BY-SA 4.0",
    createdAt: new Date().toISOString()
  }
]

// Export for search functionality
export function getAllTerms(): string[] {
  return SEED_DATA.map(d => d.term)
}

export function searchTerms(query: string): string[] {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return []
  
  return SEED_DATA
    .filter(d => d.term.includes(normalized))
    .map(d => d.term)
    .slice(0, 10)
}
