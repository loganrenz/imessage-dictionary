import { getEntryByTerm } from '../_lib/dataset.js'

export async function onRequest(context: any) {
  const { request, env } = context
  
  try {
    const url = new URL(request.url)
    const term = url.searchParams.get('term') ?? ''

    if (!term.trim()) {
      return new Response(
        JSON.stringify({ error: 'missing_term' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const entry = await getEntryByTerm(env, term)

    if (!entry) {
      return new Response(
        JSON.stringify({ error: 'not_found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return new Response(
      JSON.stringify(entry),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'word_lookup_failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
