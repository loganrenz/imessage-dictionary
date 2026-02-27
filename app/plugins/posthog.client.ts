import { posthog } from 'posthog-js'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const posthogApiKey = runtimeConfig.public.posthogPublicKey
  const posthogHost = runtimeConfig.public.posthogHost

  if (!posthogApiKey || import.meta.server) return

  const posthogClient = posthog.init(posthogApiKey as string, {
    api_host: (posthogHost as string) || 'https://us.i.posthog.com',
    capture_pageview: false, // We'll handle this manually for Nuxt SPA navigation
    capture_pageleave: true,
    loaded: (ph) => {
      if (import.meta.dev) ph.debug()

      // Differentiate this app in the shared Narduk Analytics workspace
      ph.register({ app: runtimeConfig.public.appName })

      // Opt out on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        ph.opt_out_capturing()
        return
      }

      // Tag internal traffic
      if (window.location.hostname.endsWith('.pages.dev')) {
        ph.register({ is_internal_user: true })
      }
    }
  })

  // Capture initial pageview since Nuxt router.afterEach does not fire on SSR hydration
  nextTick(() => {
    posthog.capture('$pageview', {
      $current_url: window.location.href
    })
  })

  // Manual pageview tracking on subsequent route changes
  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      posthog.capture('$pageview', {
        $current_url: window.location.origin + to.fullPath
      })
    })
  })

  return {
    provide: {
      posthog: posthogClient
    }
  }
})
