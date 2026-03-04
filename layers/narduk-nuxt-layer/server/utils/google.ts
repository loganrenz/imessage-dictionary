import { SignJWT, importPKCS8 } from 'jose'

export const GA_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
]

export const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
]

export const GSC_WRITE_SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
]

export const INDEXING_SCOPES = [
  'https://www.googleapis.com/auth/indexing',
]

/**
 * Structured error for Google API failures.
 * Preserves HTTP status, statusText, and response body for downstream handling.
 */
export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(message)
    this.name = 'GoogleApiError'
  }
}

// ─── Token cache ────────────────────────────────────────────
// INTENTIONAL module-scope cache: within a Worker isolate's lifetime, this avoids
// redundant JWT exchanges with Google. The cache is scoped to a single isolate and
// is NOT shared across Workers — it acts as a per-instance optimization, not global state.
let cachedToken: { token: string; expiry: number } | null = null

/**
 * Obtain a Google access token via service account JWT assertion.
 * Caches the token until 60s before expiry.
 */
async function getAccessToken(scopes: string[]): Promise<string> {
  if (cachedToken && cachedToken.expiry > Date.now() + 60_000) {
    return cachedToken.token
  }

  const config = useRuntimeConfig()
  const saKeyJson = config.googleServiceAccountKey
  if (!saKeyJson) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON not configured — set googleServiceAccountKey in runtimeConfig')
  }

  // Doppler may store the service account JSON as base64-encoded
  const decoded = saKeyJson.trim().startsWith('{')
    ? saKeyJson
    : atob(saKeyJson)
  const sa = JSON.parse(decoded) as { client_email: string; private_key: string }
  const privateKey = await importPKCS8(sa.private_key, 'RS256')

  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({
    iss: sa.client_email,
    sub: sa.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey)

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Google token exchange failed (${tokenResponse.status}): ${errorText}`)
  }

  const tokenData = await tokenResponse.json() as { access_token: string; expires_in: number }
  cachedToken = {
    token: tokenData.access_token,
    expiry: Date.now() + tokenData.expires_in * 1000,
  }

  return cachedToken.token
}

/**
 * Fetch from Google APIs using service account credentials.
 * Automatically handles JWT-based token generation and caching.
 */
export async function googleApiFetch(url: string, scopes: string[], options: RequestInit = {}) {
  const token = await getAccessToken(scopes)

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let body: unknown
    try { body = await response.json() } catch { body = await response.text().catch(() => null) }
    throw new GoogleApiError(
      `Google API error: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
      body,
    )
  }

  return response.json()
}

/**
 * Build a multipart/mixed batch request body for the Google Indexing API.
 *
 * Each part is a complete HTTP request as per Google's batch API spec:
 * https://developers.google.com/search/apis/indexing-api/v3/using-api#batching
 */
export function buildBatchBody(
  urls: string[],
  type: string,
  boundary: string,
): string {
  const parts = urls.map((url, index) => {
    const payload = JSON.stringify({ url, type })
    return [
      `--${boundary}`,
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      `Content-ID: <item${index + 1}>`,
      '',
      'POST /v3/urlNotifications:publish',
      'Content-Type: application/json',
      'accept: application/json',
      `content-length: ${new TextEncoder().encode(payload).byteLength}`,
      '',
      payload,
    ].join('\r\n')
  })

  return parts.join('\r\n') + `\r\n--${boundary}--`
}

/**
 * Parse a multipart/mixed batch response from the Google Indexing API.
 *
 * Returns individual response status codes and bodies for each part.
 */
export function parseBatchResponse(
  responseText: string,
  boundary: string,
): { index: number; status: number; body: unknown }[] {
  const results: { index: number; status: number; body: unknown }[] = []

  // Split by boundary marker
  const parts = responseText.split(`--${boundary}`)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part || part.trim() === '' || part.trim() === '--') continue

    // Find the HTTP status line (e.g. "HTTP/1.1 200 OK")
    const statusMatch = part.match(/HTTP\/[\d.]+\s+(\d+)/)
    const status = statusMatch?.[1] ? Number.parseInt(statusMatch[1], 10) : 0

    // Find the JSON body (last block after blank lines)
    const jsonMatch = part.match(/\{[\s\S]*\}/)
    let body: unknown = null
    if (jsonMatch) {
      try {
        body = JSON.parse(jsonMatch[0])
      } catch {
        body = jsonMatch[0]
      }
    }

    results.push({ index: results.length, status, body })
  }

  return results
}
