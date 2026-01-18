import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

const DEFINITIONS: Record<string, { term: string; pos: string; gloss: string }> = {
  serendipity: { term: 'serendipity', pos: 'NOUN', gloss: 'The occurrence of events by chance in a happy or beneficial way.' },
  ephemeral: { term: 'ephemeral', pos: 'ADJECTIVE', gloss: 'Lasting for a very short time; transitory.' },
  eloquent: { term: 'eloquent', pos: 'ADJECTIVE', gloss: 'Fluent or persuasive in speaking or writing.' },
  paradigm: { term: 'paradigm', pos: 'NOUN', gloss: 'A typical example or pattern of something; a model.' },
  ubiquitous: { term: 'ubiquitous', pos: 'ADJECTIVE', gloss: 'Present, appearing, or found everywhere.' },
  ambiguous: { term: 'ambiguous', pos: 'ADJECTIVE', gloss: 'Open to more than one interpretation.' },
  cognitive: { term: 'cognitive', pos: 'ADJECTIVE', gloss: 'Related to the mental action of acquiring knowledge.' },
  pragmatic: { term: 'pragmatic', pos: 'ADJECTIVE', gloss: 'Dealing with things sensibly based on practical considerations.' },
  resilient: { term: 'resilient', pos: 'ADJECTIVE', gloss: 'Able to recover quickly from difficult conditions.' },
  articulate: { term: 'articulate', pos: 'ADJECTIVE', gloss: 'Having the ability to speak fluently and coherently.' },
  inevitable: { term: 'inevitable', pos: 'ADJECTIVE', gloss: 'Certain to happen; unavoidable.' },
  euphoria: { term: 'euphoria', pos: 'NOUN', gloss: 'A feeling of intense excitement and happiness.' },
  nostalgia: { term: 'nostalgia', pos: 'NOUN', gloss: 'A sentimental longing for the past.' },
  meticulous: { term: 'meticulous', pos: 'ADJECTIVE', gloss: 'Showing great attention to detail.' },
  empathy: { term: 'empathy', pos: 'NOUN', gloss: 'The ability to understand and share feelings of another.' },
  integrity: { term: 'integrity', pos: 'NOUN', gloss: 'The quality of being honest and having strong moral principles.' },
  innovative: { term: 'innovative', pos: 'ADJECTIVE', gloss: 'Featuring new methods; advanced and original.' },
  abstract: { term: 'abstract', pos: 'ADJECTIVE', gloss: 'Existing in thought but not having physical existence.' },
  benevolent: { term: 'benevolent', pos: 'ADJECTIVE', gloss: 'Well meaning and kindly.' },
  catalyst: { term: 'catalyst', pos: 'NOUN', gloss: 'A person or thing that precipitates an event or change.' },
  wisdom: { term: 'wisdom', pos: 'NOUN', gloss: 'The quality of having experience, knowledge, and good judgment.' },
  gratitude: { term: 'gratitude', pos: 'NOUN', gloss: 'The quality of being thankful.' },
  enigma: { term: 'enigma', pos: 'NOUN', gloss: 'A person or thing that is mysterious or puzzling.' },
}

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get('term') || ''
  const key = term.trim().toLowerCase()
  const def = DEFINITIONS[key]
  
  if (!def) {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3f0' }}>
          <div style={{ fontSize: 72, fontWeight: 'bold', color: '#1e2f50', marginBottom: 24 }}>Word Not Found</div>
          <div style={{ fontSize: 32, color: '#72757e' }}>{term || 'No term'}</div>
        </div>
      ),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400' } }
    )
  }
  
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f3f0', padding: 60, alignItems: 'center' }}>
        <div style={{ fontSize: 96, fontWeight: 'bold', color: '#1e2f50', marginBottom: 16 }}>{def.term}</div>
        <div style={{ fontSize: 24, color: '#c5914a', marginBottom: 32 }}>{def.pos}</div>
        <div style={{ fontSize: 32, color: '#1e2f50', textAlign: 'center', maxWidth: 1000, lineHeight: 1.5 }}>{def.gloss}</div>
        <div style={{ position: 'absolute', bottom: 40, fontSize: 16, color: '#72757e' }}>Free Dictionary - Demo Dataset - CC BY-SA 4.0</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400' } }
  )
}
