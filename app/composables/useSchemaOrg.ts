/**
 * useSchemaOrg helpers — Typed wrappers for common Schema.org structured data patterns.
 *
 * Built on top of `nuxt-schema-org` (part of @nuxtjs/seo).
 * Each function injects JSON-LD structured data into the page head.
 *
 * @example
 * ```ts
 * // In a page's <script setup>:
 * useWebPageSchema({ name: 'About Us', description: 'Our story...' })
 *
 * // For a blog article:
 * useArticleSchema({
 *   headline: 'How to Deploy Nuxt 4',
 *   description: 'A complete guide...',
 *   datePublished: '2026-02-20',
 *   author: { name: 'Jane Doe', url: 'https://jane.dev' },
 *   image: '/images/deploy-guide.png',
 * })
 *
 * // For an FAQ section:
 * useFAQSchema([
 *   { question: 'What is Nuxt 4?', answer: 'The latest version...' },
 *   { question: 'Is it fast?', answer: 'Extremely fast...' },
 * ])
 * ```
 */

// --- WebPage schema ---
interface WebPageOptions {
  name?: string
  description?: string
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage' | 'ItemPage' | 'SearchResultsPage'
}

export function useWebPageSchema(options: WebPageOptions = {}) {
  const { name, description, type = 'WebPage' } = options
  useSchemaOrg([
    defineWebPage({
      '@type': type,
      name,
      description,
    }),
  ])
}

// --- Article schema ---
interface ArticleAuthor {
  name: string
  url?: string
}

interface ArticleOptions {
  headline: string
  description?: string
  datePublished: string
  dateModified?: string
  author: ArticleAuthor | ArticleAuthor[]
  image?: string | string[]
  section?: string
  tags?: string[]
}

export function useArticleSchema(options: ArticleOptions) {
  const { headline, description, datePublished, dateModified, author, image, section, tags } = options

  const authors = Array.isArray(author) ? author : [author]

  useSchemaOrg([
    defineArticle({
      headline,
      description,
      datePublished,
      dateModified: dateModified || datePublished,
      author: authors.map(a => ({
        name: a.name,
        url: a.url,
      })),
      articleSection: section,
    } as any),
  ])
}

// --- Product schema ---
interface ProductOptions {
  name: string
  description?: string
  image?: string | string[]
  brand?: string
  sku?: string
  price?: number
  priceCurrency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued'
  ratingValue?: number
  reviewCount?: number
}

export function useProductSchema(options: ProductOptions) {
  const { name, description, image, brand, sku, price, priceCurrency = 'USD', availability, ratingValue, reviewCount } = options

  const product: Record<string, any> = {
    name,
    description,
    image,
  }

  if (brand) product.brand = { '@type': 'Brand', name: brand }
  if (sku) product.sku = sku

  if (price !== undefined) {
    product.offers = {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency,
      availability: availability ? `https://schema.org/${availability}` : undefined,
    }
  }

  if (ratingValue !== undefined && reviewCount !== undefined) {
    product.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    }
  }

  useSchemaOrg([defineProduct(product)])
}

// --- FAQ schema ---
interface FAQItem {
  question: string
  answer: string
}

export function useFAQSchema(items: FAQItem[]) {
  useSchemaOrg([
    {
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ])
}

// --- LocalBusiness schema ---
interface LocalBusinessOptions {
  name: string
  description?: string
  image?: string
  telephone?: string
  email?: string
  address: {
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry?: string
  }
  geo?: {
    latitude: number
    longitude: number
  }
  openingHours?: string[]
  priceRange?: string
  url?: string
}

export function useLocalBusinessSchema(options: LocalBusinessOptions) {
  const { name, description, _image, telephone, email, address, geo, openingHours, priceRange, url } = options

  const business: Record<string, any> = {
    '@type': 'LocalBusiness',
    name,
    description,
    image: _image,
    telephone,
    email,
    url,
    priceRange,
    address: {
      '@type': 'PostalAddress',
      ...address,
      addressCountry: address.addressCountry || 'US',
    },
  }

  if (geo) {
    business.geo = {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    }
  }

  if (openingHours?.length) {
    business.openingHoursSpecification = openingHours
  }

  useSchemaOrg([business])
}

// --- BreadcrumbList schema ---
interface BreadcrumbItem {
  name: string
  url: string
}

export function useBreadcrumbSchema(items: BreadcrumbItem[]) {
  useSchemaOrg([
    defineBreadcrumb({
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }),
  ])
}
