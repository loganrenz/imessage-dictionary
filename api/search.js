import { loadIndex, searchIndex } from '../server/dataset.js'

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const query = url.searchParams.get('q') ?? ''
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20

    const index = await loadIndex()
    const results = searchIndex(index, query, Number.isFinite(limit) ? limit : 20)

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.statusCode = 200
    res.end(JSON.stringify({ query, results }))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'search_failed' }))
  }
}
