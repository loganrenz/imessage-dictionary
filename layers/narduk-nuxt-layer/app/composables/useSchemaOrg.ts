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
  const { headline, description, datePublished, dateModified, author, section, image, tags } = options

  const authors = Array.isArray(author) ? author : [author]

  const imageVal = Array.isArray(image) ? image[0] : image
  const articleInput = {
    headline,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: authors.map(a => ({
      name: a.name,
      url: a.url,
    })),
    ...(imageVal !== undefined && imageVal !== '' && { image: imageVal }),
    ...(section !== undefined && section !== '' && { articleSection: section }),
    ...(tags !== undefined && tags.length > 0 && { keywords: tags }),
  }
  useSchemaOrg([defineArticle(articleInput as Parameters<typeof defineArticle>[0])])
}

// --- Product schema ---
interface ProductOptions {
  name: string
  description?: string
  image?: string | string[]
  brand?: string
  sku?: string
  mpn?: string
  price?: number
  priceCurrency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued'
  itemCondition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition'
  url?: string
  seller?: { name: string; url?: string }
  ratingValue?: number
  reviewCount?: number
}

export function useProductSchema(options: ProductOptions) {
  const { name, description, image, brand, sku, mpn, price, priceCurrency = 'USD', availability, itemCondition, url, seller, ratingValue, reviewCount } = options

  useSchemaOrg([
    defineProduct({
      name,
      description,
      image,
      url,
      ...(brand && { brand: { '@type': 'Brand' as const, name: brand } }),
      ...(sku && { sku }),
      ...(mpn && { mpn }),
      ...(itemCondition && { itemCondition: `https://schema.org/${itemCondition}` }),
      ...(seller && { seller: { '@type': 'Organization' as const, name: seller.name, url: seller.url } }),
      ...(price !== undefined && {
        offers: {
          '@type': 'Offer' as const,
          price: price.toString(),
          priceCurrency,
          ...(availability && { availability: `https://schema.org/${availability}` }),
        },
      }),
      ...(ratingValue !== undefined && reviewCount !== undefined && {
        aggregateRating: {
          '@type': 'AggregateRating' as const,
          ratingValue,
          reviewCount,
        },
      }),
    }),
  ])
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
        '@type': 'Question' as const,
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer' as const,
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
  const { name, description, image, telephone, email, address, geo, openingHours, priceRange, url } = options

  useSchemaOrg([
    {
      '@type': 'LocalBusiness' as const,
      name,
      description,
      image,
      telephone,
      email,
      url,
      priceRange,
      address: {
        '@type': 'PostalAddress' as const,
        ...address,
        addressCountry: address.addressCountry || 'US',
      },
      ...(geo && {
        geo: {
          '@type': 'GeoCoordinates' as const,
          latitude: geo.latitude,
          longitude: geo.longitude,
        },
      }),
      ...(openingHours?.length && { openingHoursSpecification: openingHours }),
    },
  ])
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
        '@type': 'ListItem' as const,
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }),
  ])
}
