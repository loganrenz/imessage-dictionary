import { searchEntries } from '../_lib/dataset.js'

export async function onRequest(context: any) {
  const { request, env } = context
  
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') ?? ''
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20

    const results = await searchEntries(env, query, Number.isFinite(limit) ? limit : 20)

    return new Response(
      JSON.stringify({ query, results }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'search_failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
