import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { defineSync } from '@/lib/define'

// Cache-Control header for 30-day caching
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400'
}

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get('term') || ''
  const definition = defineSync(term)
  
  if (!definition) {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3f0' }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 'bold', color: '#1e2f50', marginBottom: 24 }}>Word Not Found</div>
          <div style={{ display: 'flex', fontSize: 32, color: '#72757e' }}>{term || 'No term'}</div>
        </div>
      ),
      { width: 1200, height: 630, headers: CACHE_HEADERS }
    )
  }
  
  // Get first sense for display
  const firstSense = definition.senses[0]
  const pos = firstSense.pos?.toUpperCase() || ''
  const gloss = firstSense.gloss.length > 180 ? firstSense.gloss.slice(0, 177) + '...' : firstSense.gloss
  
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f3f0', padding: 60, alignItems: 'center' }}>
        <div style={{ display: 'flex', fontSize: 96, fontWeight: 'bold', color: '#1e2f50', marginBottom: 16 }}>{definition.term}</div>
        <div style={{ display: 'flex', fontSize: 24, color: '#c5914a', marginBottom: 32 }}>{pos}</div>
        <div style={{ display: 'flex', fontSize: 32, color: '#1e2f50', textAlign: 'center', maxWidth: 1000, lineHeight: 1.5 }}>{gloss}</div>
        <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 16, color: '#72757e' }}>Free Dictionary - {definition.source} - {definition.license}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: CACHE_HEADERS }
  )
}
