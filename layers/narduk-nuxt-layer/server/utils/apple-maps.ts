/**
 * Apple Maps Server API utilities.
 *
 * Handles developer token generation (ES256 JWT via Apple signing credentials)
 * and access token exchange for authenticated API calls.
 *
 * Pattern extracted from hoods/server/api/neighborhoods.get.ts.
 */

export interface AppleMapsCreds {
  mapkitServerApiKey: string
  appleTeamId: string
  appleKeyId: string
  appleSecretKey: string
}

let cachedDeveloperToken = ''
let cachedDeveloperTokenExpiresAt = 0

const DEVELOPER_TOKEN_REFRESH_WINDOW_MS = 60_000

function normalizePrivateKey(secretKey: string) {
  return secretKey.includes('\\n') ? secretKey.replaceAll('\\n', '\n') : secretKey
}

function decodeJwtPayload(token: string) {
  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment) return null

    let normalized = payloadSegment.replaceAll('-', '+').replaceAll('_', '/')
    while (normalized.length % 4 !== 0) {
      normalized += '='
    }

    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as Record<string, unknown>
  } catch (err) {
    console.warn('[AppleMaps] Failed to decode JWT payload', err)
    return null
  }
}

function tokenExpiresAt(token: string) {
  const payload = decodeJwtPayload(token)
  const exp = Number(payload?.exp)
  return Number.isFinite(exp) ? exp * 1000 : 0
}

function isTokenFresh(token: string, refreshWindowMs: number) {
  const expiresAt = tokenExpiresAt(token)
  return expiresAt > Date.now() + refreshWindowMs
}

function hasSigningCredentials(config: AppleMapsCreds) {
  return Boolean(config.appleTeamId && config.appleKeyId && config.appleSecretKey)
}

export async function getDeveloperToken(config: AppleMapsCreds) {
  const configuredToken = config.mapkitServerApiKey.trim()
  if (configuredToken && isTokenFresh(configuredToken, DEVELOPER_TOKEN_REFRESH_WINDOW_MS)) {
    return configuredToken
  }

  const now = Date.now()
  if (
    cachedDeveloperToken &&
    cachedDeveloperTokenExpiresAt > now + DEVELOPER_TOKEN_REFRESH_WINDOW_MS
  ) {
    return cachedDeveloperToken
  }

  if (!hasSigningCredentials(config)) {
    if (configuredToken) {
      return configuredToken
    }
    throw new Error('Missing Apple Maps developer credentials')
  }

  const { SignJWT, importPKCS8 } = await import('jose')
  const privateKey = await importPKCS8(normalizePrivateKey(config.appleSecretKey), 'ES256')
  const nowSeconds = Math.floor(now / 1000)
  const expiresInSeconds = 60 * 30
  const expiresAtSeconds = nowSeconds + expiresInSeconds

  const token = await new SignJWT({ appid: 'food-trucks' })
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: config.appleKeyId })
    .setIssuer(config.appleTeamId)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expiresAtSeconds)
    .sign(privateKey)

  cachedDeveloperToken = token
  cachedDeveloperTokenExpiresAt = expiresAtSeconds * 1000

  return token
}

// --- Search API ---

export interface AppleMapsSearchResult {
  name?: string
  displayName?: string
  formattedAddressLines?: string[]
  coordinate?: {
    latitude?: number | string
    longitude?: number | string
  }
  structuredAddress?: {
    administrativeArea?: string
    administrativeAreaCode?: string
    locality?: string
    subLocality?: string
    postCode?: string
    thoroughfare?: string
    subThoroughfare?: string
    fullThoroughfare?: string
    areasOfInterest?: string[]
    dependentLocalities?: string[]
  }
  poiCategory?: string
  country?: string
  countryCode?: string
}

interface AppleMapsSearchResponse {
  results?: AppleMapsSearchResult[]
  displayMapRegion?: {
    northLatitude?: number
    southLatitude?: number
    eastLongitude?: number
    westLongitude?: number
  }
}

export interface SearchOptions {
  query: string
  searchLocation?: { lat: number; lng: number }
  searchRegion?: { north: number; east: number; south: number; west: number }
  includePoiCategories?: string
  limit?: number
}

export async function searchPlaces(
  accessToken: string,
  options: SearchOptions,
): Promise<AppleMapsSearchResult[]> {
  const url = new URL('https://maps-api.apple.com/v1/search')
  url.searchParams.set('q', options.query)
  url.searchParams.set('resultTypeFilter', 'Poi')
  url.searchParams.set('limitToCountries', 'US')
  url.searchParams.set('lang', 'en-US')

  if (options.limit) {
    url.searchParams.set('limit', String(options.limit))
  }

  if (options.searchLocation) {
    url.searchParams.set(
      'searchLocation',
      `${options.searchLocation.lat},${options.searchLocation.lng}`,
    )
  }

  if (options.searchRegion) {
    const { north, east, south, west } = options.searchRegion
    url.searchParams.set('searchRegion', `${north},${east},${south},${west}`)
  }

  if (options.includePoiCategories) {
    url.searchParams.set('includePoiCategories', options.includePoiCategories)
  }

  const response = await $fetch<AppleMapsSearchResponse>(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.results ?? []
}
