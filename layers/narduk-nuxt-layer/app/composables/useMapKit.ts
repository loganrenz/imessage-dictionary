/**
 * useMapKit — lazy-load Apple MapKit JS and initialize with a JWT token.
 *
 * Token source (in order):
 * 1. runtimeConfig.public.mapkitToken (MAPKIT_TOKEN) if set
 * 2. Else GET /api/mapkit-token — server signs a JWT for this origin (localhost or production)
 *
 * For local dev without a 7-day portal token: set APPLE_SECRET_KEY, APPLE_TEAM_ID, APPLE_KEY_ID
 * (same as Server API). Create a Maps identifier and key with MapKit JS in Apple Developer.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mapkit is a CDN global with no published TypeScript types
declare const mapkit: any

const MAPKIT_SRC = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js'

/** Shared singleton so multiple components don't double-load */
let initPromise: Promise<typeof mapkit> | null = null

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!import.meta.client) {
      resolve()
      return
    }
    if (import.meta.client) {
      if (document.querySelector(`script[src="${MAPKIT_SRC}"]`)) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = MAPKIT_SRC
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load MapKit JS'))
      document.head.appendChild(script)
    } else {
      resolve()
    }
  })
}

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!))
    return typeof payload.exp === 'number' && payload.exp < Date.now() / 1000
  } catch {
    return true
  }
}

function fetchDynamicToken(): Promise<string> {
  return $fetch<{ token: string }>('/api/mapkit-token').then(({ token }) => token)
}

export function useMapKit() {
  const ready = ref(false)
  const error = ref<string | null>(null)
  const runtimeConfig = useRuntimeConfig()
  const staticToken = (runtimeConfig.public.mapkitToken as string) || ''

  const mapkitReady = readonly(ready)
  const mapkitError = readonly(error)

  if (import.meta.server) {
    return { mapkitReady, mapkitError }
  }

  if (!initPromise) {
    initPromise = loadScript().then(() => {
      const authorizationCallback = (done: (token: string) => void) => {
        if (staticToken && !isJwtExpired(staticToken)) {
          done(staticToken)
          return
        }
        fetchDynamicToken()
          .then(done)
          .catch((e) => {
            error.value = e?.message || 'Failed to load MapKit token'
            done('')
          })
      }
      mapkit.init({ authorizationCallback })
      return mapkit
    })
  }

  void (async () => {
    try {
      await initPromise
      ready.value = true
      if (import.meta.client) {
        document.documentElement.dataset.mapkitLoaded = 'true'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'MapKit JS init failed'
    }
  })()

  return { mapkitReady: readonly(ready), mapkitError: readonly(error) }
}

/**
 * Returns a function to resolve the MapKit JWT (static from config or from /api/mapkit-token).
 * Use this in components that need the token without going through useMapKit() init.
 */
export function useMapkitToken() {
  const runtimeConfig = useRuntimeConfig()
  const staticToken = String(runtimeConfig.public.mapkitToken || '')

  async function getMapkitToken(): Promise<string> {
    if (staticToken && !isJwtExpired(staticToken)) return staticToken
    return fetchDynamicToken()
  }

  return { getMapkitToken }
}
