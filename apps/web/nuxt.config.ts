// deploy-trigger: 2026-03-04T20:40:25Z
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['@narduk-enterprises/narduk-nuxt-template-layer'],
  modules: ['nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4
  },

  ui: {
    colorMode: true
  },

  fonts: {
    families: [
      { name: 'Crimson Pro', weights: [400, 500, 600, 700], global: true },
      { name: 'Inter', weights: [300, 400, 500, 600, 700], global: true },
    ],
  },

  colorMode: {
    preference: 'light'
  },

  runtimeConfig: {
    // Server-only (admin API routes)
    adminToken: process.env.ADMIN_TOKEN || '',
    googleServiceAccountKey: process.env.GSC_SERVICE_ACCOUNT_JSON || '',
    posthogApiKey: process.env.POSTHOG_PERSONAL_API_KEY || '',
    gaPropertyId: process.env.GA_PROPERTY_ID || '',
    posthogProjectId: process.env.POSTHOG_PROJECT_ID || '',
    public: {
      appUrl: process.env.SITE_URL || 'https://dictionary.nard.uk',
      appName: process.env.APP_NAME || 'iMessage Dictionary',
      // Analytics
      posthogPublicKey: process.env.POSTHOG_PUBLIC_KEY || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
      posthogProjectId: process.env.POSTHOG_PROJECT_ID || '',
      // IndexNow
      indexNowKey: process.env.INDEXNOW_KEY || '',
    }
  },

  // ─── SEO Configuration (@nuxtjs/seo) ──────────────────────────
  // This single config block powers sitemap, robots, schema.org,
  // OG images, and site-wide SEO defaults. Individual pages override
  // these via the `useSeo()` composable.

  site: {
    url: process.env.SITE_URL || 'https://dictionary.nard.uk',
    name: 'iMessage Dictionary',
    description: 'Look up words and share beautiful OG preview cards in iMessage. Over 200 curated definitions with one-tap sharing.',
    defaultLocale: 'en',
  },

  ogImage: {
    defaults: {
      component: 'OgImageDefault',
    },
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'iMessage Dictionary',
      url: process.env.SITE_URL || 'https://imessage-dictionary.workers.dev',
      logo: '/favicon.svg',
    },
  },

  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: process.env.SITE_URL || 'https://imessage-dictionary.workers.dev',
    },
  },

  sitemap: {},

  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },

  // ─── Nitro (Cloudflare Workers) ────────────────────────────────

  nitro: {
    cloudflareDev: { configPath: resolve(__dirname, 'wrangler.json') },
    preset: 'cloudflare-module',
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    externals: {
      inline: ['drizzle-orm']
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#f5f1e8' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  }
})
