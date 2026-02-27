/**
 * Google Analytics 4 (gtag.js) — client-only plugin.
 *
 * Loads the GA4 measurement script and tracks SPA page navigations.
 * Set GA_MEASUREMENT_ID in your .env to activate.
 */
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const measurementId = runtimeConfig.public.gaMeasurementId as string

  if (!measurementId || import.meta.server) return

  // Skip on localhost
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', measurementId, {
    send_page_view: false // We handle SPA navigations manually
  })

  // Load the gtag.js script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  // Track page views on route changes
  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      gtag('event', 'page_view', {
        page_location: window.location.origin + to.fullPath,
        page_path: to.fullPath,
        page_title: document.title
      })
    })
  })
})

// Extend window type for dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
