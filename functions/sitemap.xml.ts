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
  const { request, env } = context
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const countResult = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM dictionary_entries'
  ).first<{ count: number }>()

  const total = countResult?.count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const items = Array.from({ length: pages }, (_, index) => {
    return `  <sitemap>
    <loc>${baseUrl}/sitemap-${index}.xml</loc>
  </sitemap>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`

  return buildXmlResponse(xml)
}
