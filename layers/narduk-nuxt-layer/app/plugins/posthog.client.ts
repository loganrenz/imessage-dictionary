import { posthog } from 'posthog-js'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const posthogApiKey = runtimeConfig.public.posthogPublicKey
  const posthogHost = runtimeConfig.public.posthogHost
  const appName = (runtimeConfig.public.appName as string) || 'Unknown App'

  if (!posthogApiKey || import.meta.server) return

  const posthogClient = posthog.init(posthogApiKey as string, {
    api_host: (posthogHost as string) || 'https://us.i.posthog.com',
    capture_pageview: false, // We'll handle this manually for Nuxt SPA navigation
    capture_pageleave: true,

    // --- Prevent sendBeacon 64KB payload limit ---
    // Flush more frequently so less accumulates for the unload beacon
    flush_interval: 5000, // default 10000ms
    flush_batch_size: 10, // default 50 — smaller batches = less queued at unload

    // Disable session recording — biggest payload contributor
    disable_session_recording: true,

    // Use XHR instead of sendBeacon on page unload (avoids 64KB cap entirely)
    transport: 'XHR',

    loaded: (ph) => {
      if (import.meta.dev) ph.debug()
    },
  })

  // Opt out on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    posthog.opt_out_capturing()
    return
  }

  // Expose broadly for any legacy integration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).$nuxt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).$nuxt = {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).$nuxt.$posthog = posthog

  // Tag internal traffic and uniquely identify the fleet application
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const superProperties: Record<string, any> = { app: appName }
  if (window.location.hostname.endsWith('.pages.dev')) {
    superProperties.is_internal_user = true
  }
  posthog.register(superProperties)

  // Capture initial pageview since Nuxt router.afterEach does not fire on SSR hydration
  nextTick(() => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    })
  })

  // Manual pageview tracking on subsequent route changes
  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      posthog.capture('$pageview', {
        $current_url: window.location.origin + to.fullPath,
      })
    })
  })

  return {
    provide: {
      posthog: posthogClient,
    },
  }
})
