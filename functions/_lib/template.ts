// Worker-safe template loader using env.ASSETS.fetch

const templateCache: { value: string | null } = { value: null }

export async function loadTemplate(request: Request, env: any): Promise<string> {
  if (templateCache.value) {
    return templateCache.value
  }
  
  const assetUrl = new URL('/index.html', request.url)
  const response = await env.ASSETS.fetch(assetUrl)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch index.html: ${response.status}`)
  }
  
  const html = await response.text()
  templateCache.value = html
  return html
}
