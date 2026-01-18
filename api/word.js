import { getEntryByTerm } from '../server/dataset.js'

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const term = url.searchParams.get('term') ?? ''

    if (!term.trim()) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'missing_term' }))
      return
    }

    const entry = await getEntryByTerm(term)

    if (!entry) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'not_found' }))
      return
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    res.statusCode = 200
    res.end(JSON.stringify(entry))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'word_lookup_failed' }))
  }
}
