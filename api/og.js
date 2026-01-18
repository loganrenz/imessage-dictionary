import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

function parseTermAndSense(rawTerm, rawSense) {
  let decoded = ''
  try {
    decoded = decodeURIComponent(rawTerm || '')
  } catch (e) {
    // Invalid URI encoding - treat as empty string
    decoded = ''
  }
  if (!decoded) {
    return { term: '', senseIndex: 0 }
  }

  if (rawSense) {
    const senseIndex = Number.parseInt(rawSense, 10)
    return {
      term: decoded,
      senseIndex: Number.isFinite(senseIndex) ? senseIndex : 0,
    }
  }

  const senseMatch = decoded.match(/^(.*)-(\d+)$/)
  if (senseMatch) {
    return {
      term: senseMatch[1],
      senseIndex: Number.parseInt(senseMatch[2], 10),
    }
  }

  return { term: decoded, senseIndex: 0 }
}

function clampSenseIndex(entry, senseIndex) {
  if (!entry?.senses?.length) return 0
  const maxIndex = entry.senses.length - 1
  return Math.max(0, Math.min(maxIndex, senseIndex))
}

export default async function handler(req) {
  const url = new URL(req.url)
  const rawTerm = url.searchParams.get('term') ?? ''
  const rawSense = url.searchParams.get('sense')
  const { term, senseIndex } = parseTermAndSense(rawTerm, rawSense)

  let entry = null
  if (term) {
    const wordResponse = await fetch(
      `${url.origin}/api/word?term=${encodeURIComponent(term)}`
    )
    if (wordResponse.ok) {
      entry = await wordResponse.json()
    }
  }

  const validSenseIndex = clampSenseIndex(entry, senseIndex)
  const sense = entry?.senses?.[validSenseIndex]
  const displayTerm = entry?.term ?? term || 'Dictionary'
  const gloss = sense?.gloss ?? 'Definition not found.'
  const pos = sense?.pos

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: '#f5f3f0',
          color: '#1e2f50',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '80px',
              fontWeight: 700,
              marginBottom: '16px',
              fontFamily: 'Crimson Pro, Georgia, serif',
            }}
          >
            {displayTerm}
          </div>
          {pos && (
            <div
              style={{
                fontSize: '24px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#c5914a',
                fontWeight: 600,
                marginBottom: '24px',
              }}
            >
              {pos}
            </div>
          )}
          <div
            style={{
              fontSize: '36px',
              fontWeight: 600,
              lineHeight: 1.3,
              fontFamily: 'Crimson Pro, Georgia, serif',
            }}
          >
            {gloss}
          </div>
        </div>
        <div style={{ fontSize: '18px', color: '#72757e' }}>
          Free Dictionary • iMessage-friendly previews
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
