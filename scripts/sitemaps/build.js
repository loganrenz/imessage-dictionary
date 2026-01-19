import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { canonicalPath, classifyBucket, isPhraseTerm, normalizeTerm } from './lib/canonical.js'
import { hashEntry } from './lib/hash.js'
import { GzipUrlsetWriter } from './lib/writer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MAX_URLS = 50000
const MAX_BYTES = 50 * 1024 * 1024
const PAGE_SIZE = Number(process.env.SITEMAP_PAGE_SIZE || 5000)
const RECENT_DAYS = Number(process.env.SITEMAP_RECENT_DAYS || 30)
const SAMPLE_LIMIT = Number(process.env.SITEMAP_SAMPLE_LIMIT || 0)
const SOURCE = process.env.SITEMAP_SOURCE || 'auto'

const BASE_URL = process.env.SITEMAP_BASE_URL || 'https://dict.nard.uk'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'sitemaps')
const INDEX_PATH = path.join(process.cwd(), 'public', 'sitemap.xml')
const CACHE_DIR = path.join(process.cwd(), 'data')
const CACHE_PATH = path.join(CACHE_DIR, 'sitemap-cache.json')
const POPULAR_PATH = path.join(process.cwd(), 'data', 'popular.json')
const CATEGORIES_PATH = path.join(process.cwd(), 'data', 'categories.json')

const DB_ID = process.env.D1_DATABASE_ID
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

const RECENT_CUTOFF = (() => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - RECENT_DAYS)
  return date
})()

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function shouldUseD1() {
  return Boolean(DB_ID && ACCOUNT_ID && API_TOKEN)
}

async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

async function loadCache() {
  if (!existsSync(CACHE_PATH)) {
    return { entries: {} }
  }
  const content = await readFile(CACHE_PATH, 'utf-8')
  return JSON.parse(content)
}

async function saveCache(cache) {
  await ensureDir(CACHE_DIR)
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entries: cache.entries,
  }
  await writeFile(CACHE_PATH, JSON.stringify(payload))
}

async function loadPopular() {
  if (!existsSync(POPULAR_PATH)) {
    return new Set()
  }
  const content = await readFile(POPULAR_PATH, 'utf-8')
  const data = JSON.parse(content)
  if (Array.isArray(data)) {
    return new Set(data.map(term => normalizeTerm(term)))
  }
  if (Array.isArray(data?.terms)) {
    return new Set(data.terms.map(term => normalizeTerm(term)))
  }
  return new Set()
}

async function loadCategories() {
  if (!existsSync(CATEGORIES_PATH)) {
    return []
  }
  const content = await readFile(CATEGORIES_PATH, 'utf-8')
  const data = JSON.parse(content)
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.categories)) {
    return data.categories
  }
  return []
}

async function fetchD1(sql) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    }
  )

  const payload = await response.json()
  if (!payload.success) {
    throw new Error(payload.errors?.[0]?.message || 'D1 query failed')
  }
  return payload.result?.[0]?.results || []
}

function escapeSql(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

async function* streamEntriesFromD1() {
  let lastTerm = ''
  let yielded = 0

  while (true) {
    const sql =
      'SELECT term, senses_json, source, source_url, license, updated_at ' +
      'FROM dictionary_entries ' +
      (lastTerm
        ? `WHERE term > ${escapeSql(lastTerm)} `
        : "WHERE term != '' ") +
      'ORDER BY term LIMIT ' +
      PAGE_SIZE

    const rows = await fetchD1(sql)
    if (!rows.length) break

    for (const row of rows) {
      const entry = {
        term: row.term,
        senses: JSON.parse(row.senses_json || '[]'),
        source: row.source,
        sourceUrl: row.source_url,
        license: row.license,
        updatedAt: row.updated_at,
      }
      yield entry
      yielded += 1
      if (SAMPLE_LIMIT && yielded >= SAMPLE_LIMIT) return
    }

    lastTerm = rows[rows.length - 1].term
  }
}

async function* streamEntriesFromFile() {
  const filePath = path.join(process.cwd(), 'scripts', 'dictionary-data.json')
  const content = await readFile(filePath, 'utf-8')
  const entries = JSON.parse(content)
  const sorted = entries.sort((a, b) => normalizeTerm(a.term).localeCompare(normalizeTerm(b.term)))
  let yielded = 0

  for (const entry of sorted) {
    yield entry
    yielded += 1
    if (SAMPLE_LIMIT && yielded >= SAMPLE_LIMIT) return
  }
}

class SitemapGroup {
  constructor(baseName) {
    this.baseName = baseName
    this.partIndex = 0
    this.writer = null
    this.files = []
  }

  getCurrentName() {
    if (this.partIndex === 0) {
      return `${this.baseName}.xml.gz`
    }
    return `${this.baseName}-${this.partIndex}.xml.gz`
  }

  async ensureWriter() {
    if (this.writer) return
    const fileName = this.getCurrentName()
    const filePath = path.join(OUTPUT_DIR, fileName)
    this.files.push(fileName)
    this.writer = new GzipUrlsetWriter(filePath)
  }

  async addUrl(loc, lastmod) {
    await this.ensureWriter()
    const nextBytes =
      this.writer.byteCount +
      Buffer.byteLength('  <url>\n    <loc></loc>\n    <lastmod></lastmod>\n  </url>\n')

    if (this.writer.urlCount >= MAX_URLS || nextBytes >= MAX_BYTES) {
      await this.writer.close()
      this.writer = null
      this.partIndex += 1
      await this.ensureWriter()
    }

    await this.writer.writeUrl(loc, lastmod)
  }

  async close() {
    if (this.writer) {
      await this.writer.close()
      this.writer = null
    }
  }
}

function buildIndexXml(files) {
  const items = files
    .map(file => `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${file}</loc>\n  </sitemap>`)
    .join('\n')

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${items}\n` +
    '</sitemapindex>\n'
  )
}

function chooseLastmod(entry, cache, today) {
  const normalized = normalizeTerm(entry.term)
  const hash = hashEntry(entry)
  const cached = cache.entries[normalized]

  if (cached && cached.hash === hash) {
    return { hash, lastmod: cached.lastmod }
  }

  const updated = parseDate(entry.updatedAt)
  if (updated) {
    return { hash, lastmod: formatDate(updated) }
  }

  return { hash, lastmod: today }
}

async function main() {
  await ensureDir(OUTPUT_DIR)

  const cache = await loadCache()
  cache.entries = cache.entries || {}

  const popularSet = await loadPopular()
  const categories = await loadCategories()

  const groups = {
    phrases: new SitemapGroup('phrases'),
    popular: new SitemapGroup('popular'),
    recent: new SitemapGroup('recent'),
    categories: new SitemapGroup('categories'),
  }

  const letterGroups = new Map()
  const ensureLetterGroup = letter => {
    if (!letterGroups.has(letter)) {
      const name = letter === '0-9' ? 'words-0-9' : `words-${letter}`
      letterGroups.set(letter, new SitemapGroup(name))
    }
    return letterGroups.get(letter)
  }

  const today = formatDate(new Date())
  const useD1 = shouldUseD1() && SOURCE !== 'local'
  const entryStream = useD1 ? streamEntriesFromD1() : streamEntriesFromFile()

  if (!useD1) {
    console.warn('Using local dataset (scripts/dictionary-data.json) for sitemap generation.')
  }

  for await (const entry of entryStream) {
    const normalized = normalizeTerm(entry.term)
    if (!normalized) continue

    const { hash, lastmod } = chooseLastmod(entry, cache, today)
    cache.entries[normalized] = { hash, lastmod }

    const loc = `${BASE_URL}${canonicalPath(normalized)}`
    const isPhrase = isPhraseTerm(normalized)
    const bucket = classifyBucket(normalized)

    if (isPhrase) {
      await groups.phrases.addUrl(loc, lastmod)
    } else {
      await ensureLetterGroup(bucket).addUrl(loc, lastmod)
    }

    const lastmodDate = parseDate(lastmod)
    if (lastmodDate && lastmodDate >= RECENT_CUTOFF) {
      await groups.recent.addUrl(loc, lastmod)
    }

    if (popularSet.has(normalized)) {
      await groups.popular.addUrl(loc, lastmod)
    }
  }

  for (const category of categories) {
    if (!category) continue
    const loc = category.url
      ? category.url
      : `${BASE_URL}${category.path ? category.path : `/category/${encodeURIComponent(category.slug)}`}`
    const lastmod = category.lastmod ? formatDate(parseDate(category.lastmod) || new Date()) : null
    await groups.categories.addUrl(loc, lastmod)
  }

  const indexFiles = []
  for (const group of letterGroups.values()) {
    await group.close()
    indexFiles.push(...group.files)
  }

  for (const [name, group] of Object.entries(groups)) {
    await group.close()
    if (group.files.length) {
      indexFiles.push(...group.files)
    } else if (name === 'categories') {
      // no-op when categories are absent
    }
  }

  indexFiles.sort((a, b) => a.localeCompare(b))
  const indexXml = buildIndexXml(indexFiles)
  await writeFile(INDEX_PATH, indexXml)
  await saveCache(cache)

  console.log(`Generated sitemap index with ${indexFiles.length} files.`)
}

await main()
