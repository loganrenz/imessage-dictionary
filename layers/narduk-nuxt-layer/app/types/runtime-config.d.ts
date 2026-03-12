/**
 * RuntimeConfig type augmentation.
 *
 * Provides full type safety for `useRuntimeConfig()` across the layer and
 * all downstream apps. Eliminates the need for `as any` or `as string` casts.
 */
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    googleServiceAccountKey: string
    posthogApiKey: string
    gaPropertyId: string
    posthogProjectId: string
  }

  interface PublicRuntimeConfig {
    appUrl: string
    appName: string
    posthogPublicKey: string
    posthogHost: string
    gaMeasurementId: string
    indexNowKey: string
    cspScriptSrc: string
    cspConnectSrc: string
    /** Set at build time for "latest build" checks (e.g. CI or curl script). */
    buildVersion: string
    /** ISO string set at build time. */
    buildTime: string
  }
}

export {}
