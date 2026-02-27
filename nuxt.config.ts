// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/eslint',
  ],
  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4
  },

  ui: {
    colorMode: true
  },

  colorMode: {
    preference: 'dark'
  },

  runtimeConfig: {
    // Server-only (admin API routes)
    googleServiceAccountKey: process.env.GSC_SERVICE_ACCOUNT_JSON || '',
    posthogApiKey: process.env.POSTHOG_PERSONAL_API_KEY || '',
    gaPropertyId: process.env.GA_PROPERTY_ID || '',
    posthogProjectId: process.env.POSTHOG_PROJECT_ID || '',
    public: {
      appUrl: process.env.SITE_URL || 'https://nuxt-v4-template.workers.dev',
      appName: process.env.APP_NAME || 'Nuxt 4 Demo',
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
    url: process.env.SITE_URL || 'https://nuxt-v4-template.workers.dev',
    name: 'Nuxt 4 Demo',
    description: 'A production-ready demo template showcasing Nuxt 4, Nuxt UI 4, Tailwind CSS 4, and Cloudflare Workers with D1 database.',
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
      name: 'Nuxt 4 Demo',
      url: process.env.SITE_URL || 'https://nuxt-v4-template.workers.dev',
      logo: '/favicon.svg',
    },
  },

  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: process.env.SITE_URL || 'https://nuxt-v4-template.workers.dev',
    },
  },

  content: {
    // @nuxt/content v3 — edge-compatible, SQL-based storage
    build: {
      markdown: {
        toc: { depth: 3 },
        highlight: {
          langs: ['typescript', 'vue', 'bash', 'json', 'css', 'html'],
        },
      },
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
    preset: 'cloudflare-module',
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    externals: {
      inline: ['drizzle-orm']
    },
    rollupConfig: {
      plugins: [
        {
          name: 'fix-og-image-mock',
          resolveId(id: string) {
            if (id.includes('nuxt-og-image') && id.includes('proxy-cjs')) {
              return { id: './node_modules/nuxt-og-image/dist/runtime/mock/proxy-cjs.js', external: false }
            }
          },
        },
      ],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#0a0f1a' },
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
