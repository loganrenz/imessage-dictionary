import { createReadStream, existsSync } from 'fs'
import { readdir } from 'fs/promises'
import path from 'path'
import zlib from 'zlib'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'sitemaps')
const INDEX_PATH = path.join(process.cwd(), 'public', 'sitemap.xml')
const MAX_URLS = 50000
const MAX_BYTES = 50 * 1024 * 1024

async function readIndexLocs() {
  if (!existsSync(INDEX_PATH)) {
    throw new Error('Missing sitemap index at public/sitemap.xml')
  }
  const content = await readTextFile(INDEX_PATH)
  const locs = []
  const regex = /<loc>([^<]+)<\/loc>/g
  let match
  while ((match = regex.exec(content))) {
    locs.push(match[1])
  }
  return locs
}

async function readTextFile(filePath) {
  return new Promise((resolve, reject) => {
    let data = ''
    const stream = createReadStream(filePath, 'utf-8')
    stream.on('data', chunk => {
      data += chunk
    })
    stream.on('end', () => resolve(data))
    stream.on('error', reject)
  })
}

async function validateGzipSitemap(filePath) {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip()
    const stream = createReadStream(filePath)
    let byteCount = 0
    let urlCount = 0
    let head = ''
    let tail = ''
    let carry = ''

    stream.pipe(gunzip)
    gunzip.on('data', chunk => {
      const text = chunk.toString('utf-8')
      if (!head) head = text.slice(0, 200)
      tail = (tail + text).slice(-200)
      byteCount += Buffer.byteLength(text)

      const combined = carry + text
      const matches = combined.match(/<url>/g)
      if (matches) urlCount += matches.length
      carry = combined.slice(-10)
    })
    gunzip.on('end', () => {
      if (!head.startsWith('<?xml')) {
        return reject(new Error(`Invalid XML header in ${filePath}`))
      }
      if (!tail.includes('</urlset>')) {
        return reject(new Error(`Missing closing urlset in ${filePath}`))
      }
      if (urlCount > MAX_URLS) {
        return reject(new Error(`URL limit exceeded in ${filePath}: ${urlCount}`))
      }
      if (byteCount > MAX_BYTES) {
        return reject(new Error(`Size limit exceeded in ${filePath}: ${byteCount}`))
      }
      resolve({ urlCount, byteCount })
    })
    gunzip.on('error', reject)
    stream.on('error', reject)
  })
}

async function main() {
  const indexLocs = await readIndexLocs()
  const files = await readdir(OUTPUT_DIR)

  const expected = new Set(
    indexLocs
      .map(loc => loc.split('/').pop())
      .filter(Boolean)
  )

  for (const fileName of expected) {
    if (!files.includes(fileName)) {
      throw new Error(`Sitemap index references missing file: ${fileName}`)
    }
  }

  const sitemapFiles = files.filter(file => file.endsWith('.xml.gz'))
  for (const fileName of sitemapFiles) {
    await validateGzipSitemap(path.join(OUTPUT_DIR, fileName))
  }

  console.log(`Validated ${sitemapFiles.length} sitemap files.`)
}

await main()
