/**
 * Google Analytics 4 (gtag.js) — client-only plugin.
 *
 * Loads the GA4 measurement script and tracks SPA page navigations.
 * Set GA_MEASUREMENT_ID in your .env to activate.
 *
 * CRITICAL: The gtag() function MUST use `dataLayer.push(arguments)`, NOT
 * `dataLayer.push([...args])`. The gtag.js library only processes Arguments
 * objects as command tuples — regular Arrays are silently ignored.
 */

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const measurementId = runtimeConfig.public.gaMeasurementId

  if (!measurementId || import.meta.server) return

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return
  }

  window.dataLayer = window.dataLayer || []

  // Must use `arguments` — gtag.js silently drops Array-based pushes
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args as unknown as IArguments)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag must be attached to window for GA4 to pick it up; no type definition exists
  ;(window as any).gtag = gtag

  gtag('js', new Date())
  gtag('config', measurementId)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)
})

declare global {
  interface Window {
    dataLayer: IArguments[]
  }
}
