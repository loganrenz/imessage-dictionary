/**
 * Global $fetch interceptor.
 *
 * Automatically adds the `X-Requested-With: XMLHttpRequest` header to every
 * outgoing API request. This satisfies the CSRF middleware which requires
 * the header on all state-changing methods (POST, PUT, PATCH, DELETE).
 *
 * Runs client-side only — server-side $fetch calls don't go through CSRF.
 */
export default defineNuxtPlugin(() => {
  const { $fetch: _fetch } = useNuxtApp()

  globalThis.$fetch = $fetch.create({
    onRequest({ options }) {
      // Cleanly construct a Headers object to satisfy DOM types
      options.headers = new Headers(options.headers || {})
      options.headers.set('X-Requested-With', 'XMLHttpRequest')
    },
  }) as typeof $fetch
})
