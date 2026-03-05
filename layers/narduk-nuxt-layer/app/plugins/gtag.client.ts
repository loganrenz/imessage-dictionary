/**
 * Google Analytics 4 (gtag.js) — client-only plugin.
 *
 * Loads the GA4 measurement script and tracks SPA page navigations.
 * Set GA_MEASUREMENT_ID in your .env to activate.
 */

/** A single gtag() command: the command name followed by its arguments. */
type GtagCommand = [string, ...unknown[]]

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const measurementId = runtimeConfig.public.gaMeasurementId

  if (!measurementId || import.meta.server) return

  // Skip on localhost
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return
  }

  // Initialize standard dataLayer
  window.dataLayer = window.dataLayer || []
  function gtag(command: string, ...args: unknown[]) {
    window.dataLayer.push([command, ...args])
  }

  // Define global function immediately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).gtag = gtag

  gtag('js', new Date())
  
  // Let Google handle page_views automatically via Enhanced Measurement
  gtag('config', measurementId)

  // Load the gtag.js script asynchronously
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)
})

// Extend window type for dataLayer
declare global {
  interface Window {
    dataLayer: GtagCommand[]
  }
}
