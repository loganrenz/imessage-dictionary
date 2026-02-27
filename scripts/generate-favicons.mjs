#!/usr/bin/env node

/**
 * Favicon Generator Script
 *
 * Generates all required favicon assets from a source SVG file.
 *
 * Usage:
 *   node scripts/generate-favicons.mjs
 *
 * Prerequisites:
 *   npm install -D sharp
 *
 * Input:  public/favicon.svg (or provide a custom path)
 * Output: public/favicon.ico, public/apple-touch-icon.png,
 *         public/favicon-32x32.png, public/favicon-16x16.png,
 *         public/site.webmanifest
 *
 * The generated manifest and link tags are already configured in nuxt.config.ts.
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')

const SOURCE = resolve(publicDir, 'favicon.svg')

if (!existsSync(SOURCE)) {
  console.error(`❌ Source file not found: ${SOURCE}`)
  console.error('   Create a public/favicon.svg file first, then run this script.')
  process.exit(1)
}

const svgBuffer = readFileSync(SOURCE)

async function generate() {
  console.log('🎨 Generating favicons from public/favicon.svg...\n')

  // Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(resolve(publicDir, 'apple-touch-icon.png'))
  console.log('  ✅ apple-touch-icon.png (180x180)')

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(resolve(publicDir, 'favicon-32x32.png'))
  console.log('  ✅ favicon-32x32.png (32x32)')

  // Favicon 16x16
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(resolve(publicDir, 'favicon-16x16.png'))
  console.log('  ✅ favicon-16x16.png (16x16)')

  // favicon.ico (multi-size — use 32x32 as primary)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(resolve(publicDir, 'favicon.ico'))
  console.log('  ✅ favicon.ico (32x32)')

  // site.webmanifest
  const manifest = {
    name: 'Nuxt 4 Demo',
    short_name: 'N4 Demo',
    icons: [
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    theme_color: '#10b981',
    background_color: '#0B1120',
    display: 'standalone',
  }
  writeFileSync(resolve(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2))
  console.log('  ✅ site.webmanifest')

  console.log('\n🎉 Done! All favicons generated in public/')
  console.log('   Favicon link tags are already configured in nuxt.config.ts.')
}

generate().catch(console.error)
