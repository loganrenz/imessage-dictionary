import { createWriteStream } from 'fs'
import { createGzip } from 'zlib'

const URLSET_HEADER =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
const URLSET_FOOTER = '</urlset>\n'

export class GzipUrlsetWriter {
  constructor(filePath) {
    this.filePath = filePath
    this.urlCount = 0
    this.byteCount = Buffer.byteLength(URLSET_HEADER)
    this.gzip = createGzip({ level: 9 })
    this.output = createWriteStream(filePath)
    this.gzip.pipe(this.output)
    this.gzip.write(URLSET_HEADER)
  }

  async writeUrl(loc, lastmod) {
    const entry =
      '  <url>\n' +
      `    <loc>${loc}</loc>\n` +
      (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
      '  </url>\n'
    this.urlCount += 1
    this.byteCount += Buffer.byteLength(entry)
    if (!this.gzip.write(entry)) {
      await new Promise(resolve => this.gzip.once('drain', resolve))
    }
  }

  async close() {
    this.gzip.write(URLSET_FOOTER)
    this.byteCount += Buffer.byteLength(URLSET_FOOTER)
    this.gzip.end()
    await new Promise(resolve => this.output.once('close', resolve))
  }
}
