/**
 * useSeo — One-call composable for complete per-page SEO.
 *
 * Wraps `useSeoMeta()`, `useHead()`, and `defineOgImage()` into a single
 * ergonomic API. Every page should call this in its `<script setup>` block.
 *
 * @example
 * ```ts
 * // Minimal — just title + description
 * useSeo({
 *   title: 'About Us',
 *   description: 'Learn more about our team and mission.',
 * })
 *
 * // Full — with OG image, article metadata, canonical override
 * useSeo({
 *   title: 'How to Deploy Nuxt 4',
 *   description: 'Step-by-step guide to deploying Nuxt 4 on Cloudflare Workers.',
 *   image: '/images/deploy-guide.png',
 *   type: 'article',
 *   publishedAt: '2026-02-20',
 *   modifiedAt: '2026-02-25',
 *   author: 'Jane Doe',
 *   canonicalUrl: 'https://example.com/blog/deploy-nuxt-4',
 *   ogImage: {
 *     title: 'How to Deploy Nuxt 4',
 *     description: 'Step-by-step guide',
 *     icon: 'i-lucide-rocket',
 *   },
 * })
 * ```
 */

interface SeoOptions {
  /** Page title (used in <title>, og:title, twitter:title) */
  title: string
  /** Page description (used in <meta name="description">, og:description, twitter:description) */
  description: string
  /** Static image URL for og:image / twitter:image. Overridden by `ogImage` if set. */
  image?: string
  /** Open Graph type — defaults to 'website'. Use 'article' for blog posts. */
  type?: 'website' | 'article' | 'product' | 'profile'
  /** ISO 8601 date string — for articles */
  publishedAt?: string
  /** ISO 8601 date string — for articles */
  modifiedAt?: string
  /** Author name — for articles */
  author?: string
  /** Override canonical URL (defaults to current page URL via @nuxtjs/seo) */
  canonicalUrl?: string
  /** Keywords for meta keywords tag */
  keywords?: string[]
  /** Dynamic OG image options — renders via the OgImageDefault template at the edge */
  ogImage?: {
    title?: string
    description?: string
    icon?: string
  }
  /** Additional robots directives — e.g., 'noindex', 'nofollow' */
  robots?: string
}

export function useSeo(options: SeoOptions) {
  const {
    title,
    description,
    image,
    type = 'website',
    publishedAt,
    modifiedAt,
    author,
    canonicalUrl,
    keywords,
    ogImage,
    robots,
  } = options

  // --- Core meta tags ---
  const seoMeta: Record<string, any> = {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
  }

  // Static image fallback
  if (image) {
    seoMeta.ogImage = image
    seoMeta.twitterImage = image
  }

  // Article-specific
  if (type === 'article') {
    if (publishedAt) seoMeta.articlePublishedTime = publishedAt
    if (modifiedAt) seoMeta.articleModifiedTime = modifiedAt
    if (author) seoMeta.articleAuthor = author
  }

  // Keywords
  if (keywords?.length) {
    seoMeta.keywords = keywords.join(', ')
  }

  // Robots
  if (robots) {
    seoMeta.robots = robots
  }

  useSeoMeta(seoMeta)

  // --- Head extras ---
  const headConfig: Record<string, any> = {}

  if (canonicalUrl) {
    headConfig.link = [{ rel: 'canonical', href: canonicalUrl }]
  }

  if (Object.keys(headConfig).length) {
    useHead(headConfig)
  }

  // --- Dynamic OG Image ---
  if (ogImage) {
    defineOgImageComponent('OgImageDefault', {
      title: ogImage.title || title,
      description: ogImage.description || description,
      icon: ogImage.icon || 'i-lucide-sparkles',
    })
  }
}
