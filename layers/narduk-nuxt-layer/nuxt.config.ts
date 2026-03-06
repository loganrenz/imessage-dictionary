import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  alias: {
    '#layer': fileURLToPath(new URL('./', import.meta.url)),
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/seo',
    '@nuxt/eslint',
    'nuxt-auth-utils',
  ],
  css: [fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  runtimeConfig: {
    /** Optional: secret for cron routes (e.g. cache warming). Set CRON_SECRET in Doppler; init.ts provisions it. */
    cronSecret: process.env.CRON_SECRET || '',
    appleTeamId: process.env.APPLE_TEAM_ID || '',
    appleKeyId: process.env.APPLE_KEY_ID || '',
    appleSecretKey: process.env.APPLE_SECRET_KEY || '',
    mapkitServerApiKey: process.env.MAPKIT_SERVER_API_KEY || '',
    public: {
      mapkitToken: process.env.MAPKIT_TOKEN || '',
      buildVersion: process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA || '',
      buildTime: new Date().toISOString(),
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      cspScriptSrc: process.env.CSP_SCRIPT_SRC || '',
      cspConnectSrc: process.env.CSP_CONNECT_SRC || '',
    },
  },

  site: {
    url: process.env.SITE_URL || 'http://127.0.0.1:3000',
    name: process.env.APP_NAME || 'Nuxt 4 App',
    description: 'A Nuxt 4 application deployed on Cloudflare Workers.',
  },

  compatibilityDate: '2026-03-06',

  hooks: {
    // Workaround for nuxt/ui#6118: @nuxt/ui@4.5.0 auto-import scanner
    // incorrectly registers 'options' (a parameter name) as an export from useResizable.js
    'imports:extend'(imports) {
      for (let i = imports.length - 1; i >= 0; i--) {
        const entry = imports[i]
        if (
          entry?.name === 'options' &&
          typeof entry.from === 'string' &&
          entry.from.includes('useResizable')
        ) {
          imports.splice(i, 1)
        }
      }
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  ui: {
    colorMode: true,
  },

  ...(import.meta.dev
    ? {
        colorMode: {
          preference: 'system',
        },
      }
    : {}),

  ogImage: {
    runtimeCacheStorage: {
      driver: 'memory',
    },
  },

  image: {
    provider: 'cloudflare',
  },

  routeRules: {
    // Redirect legacy iOS apple-touch-icon-precomposed requests to the standard icon
    '/apple-touch-icon-precomposed.png': { redirect: '/apple-touch-icon.png' },
  },

  nitro: {
    preset: 'cloudflare-module',
    imports: {
      // Prevent nuxt-auth-utils password.js from being server-auto-imported;
      // the layer provides its own Web Crypto (PBKDF2) implementations.
      exclude: [/nuxt-auth-utils\/dist\/runtime\/server\/utils\/password/],
    },
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    externals: {
      inline: ['drizzle-orm'],
    },
  },

  // Expose the layer configurations and files to consumers
  components: [
    { path: fileURLToPath(new URL('./app/components', import.meta.url)), pathPrefix: false },
  ],
})
