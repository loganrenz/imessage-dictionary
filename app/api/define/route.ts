import { NextRequest, NextResponse } from 'next/server'
import { define } from '@/lib/define'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('term')
  
  if (!term || typeof term !== 'string' || term.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing or invalid term parameter' },
      { status: 400 }
    )
  }
  
  if (term.length > 64) {
    return NextResponse.json(
      { error: 'Term exceeds maximum length of 64 characters' },
      { status: 400 }
    )
  }
  
  const definition = await define(term)
  
  if (!definition) {
    return NextResponse.json(
      { error: 'Term not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(definition, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
