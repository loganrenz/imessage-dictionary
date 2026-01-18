const PAGE_SIZE = 50000

function buildXmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}

export async function onRequest(context: any) {
  const { request, env, params } = context
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const pageParam = params?.page ?? '0'
  const page = Math.max(0, Number.parseInt(pageParam, 10) || 0)
  const offset = page * PAGE_SIZE

  const result = await env.DB.prepare(
    'SELECT term FROM dictionary_entries ORDER BY term LIMIT ?1 OFFSET ?2'
  )
    .bind(PAGE_SIZE, offset)
    .all<{ term: string }>()

  const urls = (result.results || []).map(row => {
    const term = encodeURIComponent(row.term)
    return `  <url>
    <loc>${baseUrl}/w/${term}</loc>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return buildXmlResponse(xml)
}
