import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { request } from 'node:https'
import { URL } from 'node:url'
import 'dotenv/config'

/** HTTPS request helper (avoids TLS issues some envs have with fetch + PostHog). */
function httpsJson(
  method: string,
  urlStr: string,
  opts: { headers?: Record<string, string>; body?: object } = {}
): Promise<{ statusCode: number; data: any }> {
  const u = new URL(urlStr)
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers }
  if (opts.body) headers['Content-Type'] = 'application/json'
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers },
      (res) => {
        let buf = ''
        res.on('data', (c) => { buf += c })
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode!, data: buf ? JSON.parse(buf) : {} })
          } catch {
            reject(new Error(`Invalid JSON: ${buf.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    if (opts.body) req.write(JSON.stringify(opts.body))
    req.end()
  })
}

/**
 * Analytics Setup Script
 *
 * Single-command bootstrap (after keys are in Doppler/.env):
 *   npx jiti tools/setup-analytics.ts all
 * Then deploy, then: npx jiti tools/setup-analytics.ts gsc:verify
 *
 * Or run individual steps: posthog, ga, gsc, gsc:verify.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dopplerYamlPath = join(process.cwd(), 'doppler.yaml')

function env(key: string): string {
  return (process.env[key] || '').trim()
}

function check(label: string, value: string, hint: string): boolean {
  if (value) {
    console.log(`  ✅  ${label}`)
    return true
  } else {
    console.log(`  ⬜  ${label}  →  ${hint}`)
    return false
  }
}

function sectionHeader(title: string) {
  console.log()
  console.log(`━━━ ${title} ${'━'.repeat(Math.max(0, 50 - title.length))}`)
}

function loadCredentials(): Record<string, any> {
  // Option A: file path (recommended)
  const keyFilePath = env('GSC_SERVICE_ACCOUNT_JSON_PATH')
  if (keyFilePath) {
    const resolved = resolve(process.cwd(), keyFilePath)
    if (!existsSync(resolved)) {
      throw new Error(`Service account key file not found: ${resolved}`)
    }
    return JSON.parse(readFileSync(resolved, 'utf8'))
  }

  // Option B: inline JSON or base64
  const inline = env('GSC_SERVICE_ACCOUNT_JSON')
  if (inline) {
    let str = inline
    if (!str.startsWith('{')) {
      str = Buffer.from(str, 'base64').toString('utf8')
    }
    return JSON.parse(str)
  }

  throw new Error(
    'No service account credentials found. Set GSC_SERVICE_ACCOUNT_JSON_PATH or GSC_SERVICE_ACCOUNT_JSON in Doppler.'
  )
}

function hasGscCredentials(): boolean {
  return !!(env('GSC_SERVICE_ACCOUNT_JSON_PATH') || env('GSC_SERVICE_ACCOUNT_JSON'))
}

/** Read doppler.yaml (project + config) if present. */
function readDopplerYaml(): { project: string; config: string } | null {
  if (!existsSync(dopplerYamlPath)) return null
  const raw = readFileSync(dopplerYamlPath, 'utf8')
  const project = raw.match(/project:\s*(\S+)/)?.[1]?.trim()
  const config = raw.match(/config:\s*(\S+)/)?.[1]?.trim()
  if (project && config) return { project, config }
  return null
}

/**
 * Persist a setup-generated secret. Prefer Doppler (doppler secrets set); otherwise print instructions.
 */
function writeSetupSecret(key: string, value: string) {
  const doppler = readDopplerYaml()
  if (doppler) {
    const out = spawnSync('doppler', ['secrets', 'set', `${key}=${value}`, '--project', doppler.project, '--config', doppler.config], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
    if (out.status === 0) {
      console.log(`  ✅  ${key} written to Doppler (${doppler.project}/${doppler.config}).`)
      return
    }
  }
  console.log(`  📋  Add to Doppler: ${key}=${value}`)
}

// ---------------------------------------------------------------------------
// Status checks
// ---------------------------------------------------------------------------

interface StatusResult {
  posthog: boolean
  ga: boolean
  gscCredentials: boolean
  gscSiteUrl: boolean
  gscUserEmail: boolean
  indexNow: boolean
}

function checkStatus(): StatusResult {
  console.log()
  console.log('🔧  Analytics Setup Status')
  console.log('══════════════════════════════════════════════════════════')

  // PostHog
  sectionHeader('PostHog')
  const posthogKey = check(
    'POSTHOG_PUBLIC_KEY',
    env('POSTHOG_PUBLIC_KEY'),
    'Run: npm run setup:posthog (or set manually from Project Settings)'
  )
  check(
    'POSTHOG_PUBLIC_KEY',
    env('POSTHOG_PUBLIC_KEY'),
    'Set from Hubble/Analytics central project'
  )
  check(
    'POSTHOG_HOST',
    env('POSTHOG_HOST'),
    'Defaults to https://us.i.posthog.com (US) — set to https://eu.i.posthog.com for EU'
  )

  // Google Analytics
  sectionHeader('Google Analytics 4')
  const gaId = check(
    'GA_MEASUREMENT_ID',
    env('GA_MEASUREMENT_ID'),
    'Run: npm run setup:ga (or create GA4 property manually and copy G-XXXXXXX)'
  )
  check(
    'GA_ACCOUNT_ID',
    env('GA_ACCOUNT_ID'),
    'For automation: analytics.google.com → Admin → Account settings (numeric ID)'
  )

  // Google Search Console
  sectionHeader('Google Search Console')
  const gscCredsPath = env('GSC_SERVICE_ACCOUNT_JSON_PATH')
  const gscCredsInline = env('GSC_SERVICE_ACCOUNT_JSON')
  let gscCreds = false
  if (gscCredsPath) {
    const resolved = resolve(process.cwd(), gscCredsPath)
    if (existsSync(resolved)) {
      console.log(`  ✅  GSC_SERVICE_ACCOUNT_JSON_PATH  →  ${gscCredsPath}`)
      gscCreds = true
    } else {
      console.log(`  ❌  GSC_SERVICE_ACCOUNT_JSON_PATH  →  file not found: ${resolved}`)
    }
  } else if (gscCredsInline) {
    console.log(`  ✅  GSC_SERVICE_ACCOUNT_JSON (inline)`)
    gscCreds = true
  } else {
    console.log(`  ⬜  GSC credentials  →  Set GSC_SERVICE_ACCOUNT_JSON_PATH to your key file (e.g. ./my-key.json), or GSC_SERVICE_ACCOUNT_JSON for inline JSON/base64`)
  }
  const gscSite = check(
    'SITE_URL',
    env('SITE_URL'),
    'Set to your production URL, e.g. https://myapp.com'
  )
  const gscEmail = check(
    'GSC_USER_EMAIL',
    env('GSC_USER_EMAIL'),
    'Your Google account email — the GSC property will be shared with this account so it appears in your dashboard'
  )

  // Verification file
  const verificationFiles = findVerificationFiles()
  if (verificationFiles.length > 0) {
    console.log(`  ✅  Verification file(s): ${verificationFiles.join(', ')}`)
  } else if (gscCreds) {
    console.log(`  ⬜  No verification file yet — run: npm run setup:gsc`)
  }

  // IndexNow
  sectionHeader('IndexNow')
  const indexNowKey = check(
    'INDEXNOW_KEY',
    env('INDEXNOW_KEY'),
    'Run: npm run setup:all (auto-generates) or set manually (any 32-char hex string)'
  )

  console.log()
  console.log('══════════════════════════════════════════════════════════')

  const configured = [posthogKey, gaId, gscCreds && gscSite, indexNowKey].filter(Boolean).length
  console.log(`  ${configured}/4 services configured.`)

  if (configured < 4) {
    console.log()
    console.log('  Add the missing values in Doppler and re-run:')
    console.log('    npm run setup')
    console.log()
  } else {
    console.log('  All analytics services are configured! 🎉')
    console.log()
  }

  return {
    posthog: posthogKey,
    ga: gaId,
    gscCredentials: gscCreds,
    gscSiteUrl: gscSite,
    gscUserEmail: gscEmail,
    indexNow: indexNowKey
  }
}

function findVerificationFiles(): string[] {
  const publicDir = join(process.cwd(), 'public')
  const found: string[] = []
  try {
    const { readdirSync } = require('node:fs')
    for (const file of readdirSync(publicDir)) {
      if (file.startsWith('google') && (file.endsWith('.html') || /^google[0-9a-z]+$/.test(file))) {
        found.push(`public/${file}`)
      }
    }
  } catch { /* public dir may not exist */ }
  return found
}

function getAppName(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
    return (pkg.name || 'my-app').replace(/^@[^/]+\//, '')
  } catch {
    return 'my-app'
  }
}

// ---------------------------------------------------------------------------
// PostHog automation
// ---------------------------------------------------------------------------

async function runPosthogSetupOrSkip(): Promise<boolean> {
  if (env('POSTHOG_PUBLIC_KEY')) {
    console.log()
    console.log('  ⏭  PostHog: POSTHOG_PUBLIC_KEY already set, skipping.')
    return true
  }
  
  console.log()
  console.log('  ⚠️  PostHog: POSTHOG_PUBLIC_KEY not set.')
  console.log('      To use the shared Narduk Analytics project, bind the key from the Hub:')
  console.log('      doppler secrets set POSTHOG_PUBLIC_KEY="\\\\${narduk-analytics.prd.POSTHOG_PUBLIC_KEY}" --project YOUR_PROJECT --config prd')
  console.log()
  return false
}

// ---------------------------------------------------------------------------
// GA4 automation
// ---------------------------------------------------------------------------

async function runGaSetup() {
  const siteUrl = env('SITE_URL')
  const gaAccountId = env('GA_ACCOUNT_ID')

  if (!hasGscCredentials()) {
    console.error('❌  Service account credentials required. Set GSC_SERVICE_ACCOUNT_JSON_PATH or GSC_SERVICE_ACCOUNT_JSON in Doppler.')
    process.exit(1)
  }
  if (!gaAccountId) {
    console.error('❌  GA_ACCOUNT_ID is required.')
    console.error('   Find it at https://analytics.google.com → Admin → Account settings (e.g. 123456789).')
    process.exit(1)
  }
  if (!siteUrl) {
    console.error('❌  SITE_URL is required for the web data stream.')
    process.exit(1)
  }

  const { google } = await import('googleapis')
  const credentials = loadCredentials()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.edit']
  })

  const analyticsadmin = google.analyticsadmin({ version: 'v1beta', auth })
  const appName = getAppName()

  console.log()
  console.log('Step 1/3: Creating GA4 property...')
  const propertyRes = await analyticsadmin.properties.create({
    requestBody: {
      parent: `accounts/${gaAccountId}`,
      displayName: appName,
      timeZone: 'America/Los_Angeles',
      currencyCode: 'USD'
    }
  }).catch((e: any) => {
    throw new Error(e.message || 'Failed to create property')
  })

  const property = propertyRes.data
  const propertyName = property?.name
  if (!propertyName) throw new Error('Property created but no name in response')
  console.log(`  ✅  Property created: ${propertyName}`)

  console.log()
  console.log('Step 2/3: Creating web data stream...')
  const defaultUri = siteUrl.replace(/\/$/, '')
  const streamRes = await analyticsadmin.properties.dataStreams.create({
    parent: propertyName,
    requestBody: {
      displayName: `${appName} Web`,
      type: 'WEB_DATA_STREAM',
      webStreamData: {
        defaultUri
      }
    }
  }).catch((e: any) => {
    throw new Error(e.message || 'Failed to create data stream')
  })

  const stream = streamRes.data
  const measurementId = (stream as any)?.webStreamData?.measurementId
  if (!measurementId) {
    throw new Error('Data stream created but no measurementId in response')
  }
  console.log(`  ✅  Web stream created. Measurement ID: ${measurementId}`)

  console.log()
  console.log('Step 3/3: Writing GA_MEASUREMENT_ID to Doppler...')
  writeSetupSecret('GA_MEASUREMENT_ID', measurementId)

  console.log()
  console.log('🎉  Google Analytics 4 setup complete!')
  console.log()
}

function getServiceAccountEmail(): string {
  try {
    const creds = loadCredentials()
    return creds?.client_email || 'your-service-account@project.iam.gserviceaccount.com'
  } catch {
    return 'your-service-account@project.iam.gserviceaccount.com'
  }
}

async function runGaSetupOrSkip(): Promise<boolean> {
  if (env('GA_MEASUREMENT_ID')) {
    console.log()
    console.log('  ⏭  GA4: GA_MEASUREMENT_ID already set, skipping.')
    return true
  }
  if (!env('GA_ACCOUNT_ID') || !hasGscCredentials() || !env('SITE_URL')) {
    console.log()
    console.log('  ⏭  GA4: GA_ACCOUNT_ID, SITE_URL, or service account not set, skipping.')
    return false
  }
  try {
    await runGaSetup()
    return true
  } catch (e: any) {
    const msg = e?.message || String(e)
    if (msg.includes('permission') || msg.includes('403') || msg.includes('does not have permission')) {
      const email = getServiceAccountEmail()
      console.log()
      console.log('  ⚠️  GA4: Service account lacks access. Add it in Google Analytics:')
      console.log('      analytics.google.com → Admin → Account Access Management → Add users')
      console.log(`      Email: ${email}`)
      console.log('      Role: Editor')
      console.log('      Then re-run setup:all or add GA_MEASUREMENT_ID manually.')
      console.log()
      return false
    }
    throw e
  }
}

// ---------------------------------------------------------------------------
// GSC automation pipeline
// ---------------------------------------------------------------------------

async function runGscPipeline() {
  const siteUrl = env('SITE_URL')

  if (!hasGscCredentials() || !siteUrl) {
    console.error('❌  Service account credentials and SITE_URL are required for GSC setup.')
    console.error('   Set GSC_SERVICE_ACCOUNT_JSON_PATH (or GSC_SERVICE_ACCOUNT_JSON) and SITE_URL in Doppler.')
    process.exit(1)
  }

  const { google } = await import('googleapis')

  const credentials = loadCredentials()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/siteverification'
    ]
  })

  const searchconsole = google.searchconsole({ version: 'v1', auth })
  const siteVerification = google.siteVerification({ version: 'v1', auth })

  // Step 1: Register site
  console.log()
  console.log('Step 1/4: Registering site in Search Console...')
  try {
    await searchconsole.sites.add({ siteUrl })
    console.log(`  ✅  ${siteUrl} registered.`)
  } catch (e: any) {
    if (e.code === 409 || e.message?.includes('already exists')) {
      console.log(`  ✅  ${siteUrl} already registered.`)
    } else {
      throw e
    }
  }

  // Step 2: Get verification token and create file
  console.log()
  console.log('Step 2/4: Creating verification file...')
  const tokenResponse = await siteVerification.webResource.getToken({
    requestBody: {
      site: { identifier: siteUrl, type: 'SITE' },
      verificationMethod: 'FILE'
    }
  })
  const token = tokenResponse.data.token
  if (token) {
    const m = token.match(/google[0-9a-z]+\.html/i)
    const fileName =
      token.match(/verification-file=([^:\s]+)/i)?.[1] ||
      (m ? m[0] : '') ||
      'google-verification.html'
    const content = token.includes('google-site-verification:')
      ? token
      : `google-site-verification: ${fileName}`

    const publicDir = join(process.cwd(), 'public')
    if (!existsSync(publicDir)) {
      const { mkdirSync } = require('node:fs')
      mkdirSync(publicDir, { recursive: true })
    }

    writeFileSync(join(publicDir, fileName), content)
    console.log(`  ✅  Created public/${fileName}`)

    // Cloudflare Pages may strip .html extension
    if (fileName.endsWith('.html')) {
      const noExt = fileName.slice(0, -5)
      writeFileSync(join(publicDir, noExt), content)
      console.log(`  ✅  Created public/${noExt} (no-extension fallback)`)
    }

    console.log()
    console.log('  ⚠️   You must deploy now so Google can find the verification file.')
    console.log('       Run: npm run deploy')
    console.log('       Then run: npm run setup:gsc:verify')
  } else {
    console.log('  ⚠️   No verification token returned. Site may already be verified.')
  }
}

async function runGscVerify() {
  const siteUrl = env('SITE_URL')

  if (!hasGscCredentials() || !siteUrl) {
    console.error('❌  Service account credentials and SITE_URL are required.')
    console.error('   Set GSC_SERVICE_ACCOUNT_JSON_PATH (or GSC_SERVICE_ACCOUNT_JSON) and SITE_URL in Doppler.')
    process.exit(1)
  }

  const { google } = await import('googleapis')

  const credentials = loadCredentials()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/siteverification'
    ]
  })

  const searchconsole = google.searchconsole({ version: 'v1', auth })
  const siteVerification = google.siteVerification({ version: 'v1', auth })

  // Step 3: Verify ownership
  console.log()
  console.log('Step 3/4: Verifying ownership...')
  await siteVerification.webResource.insert({
    verificationMethod: 'FILE',
    requestBody: {
      site: { identifier: siteUrl, type: 'SITE' }
    }
  })
  console.log('  ✅  Ownership verified!')

  // Grant access to user's personal account
  const userEmail = env('GSC_USER_EMAIL')
  if (userEmail) {
    console.log(`  👤  Granting owner access to ${userEmail}...`)
    try {
      const resource = await siteVerification.webResource.get({
        id: siteUrl
      }).catch(() => null)

      const owners = resource?.data.owners || []
      if (!owners.includes(userEmail)) {
        owners.push(userEmail)
      }

      await siteVerification.webResource.update({
        id: siteUrl,
        requestBody: {
          site: { identifier: siteUrl, type: 'SITE' },
          owners
        }
      })
      console.log(`  ✅  ${userEmail} is now an owner. Property will appear in your GSC dashboard.`)
    } catch (e: any) {
      console.error(`  ⚠️   Could not grant access: ${e.message}`)
    }
  } else {
    console.log('  ⚠️   GSC_USER_EMAIL not set — skipping access grant.')
    console.log('       Add it to Doppler to see the property in your personal GSC dashboard.')
  }

  // Step 4: Submit sitemap
  console.log()
  console.log('Step 4/4: Submitting sitemap...')
  const sitemapUrl = `${siteUrl.replace(/\/$/, '')}/sitemap.xml`
  await searchconsole.sitemaps.submit({ siteUrl, feedpath: sitemapUrl })
  console.log(`  ✅  Sitemap submitted: ${sitemapUrl}`)

  console.log()
  console.log('🎉  Google Search Console setup complete!')
  console.log()
}

// ---------------------------------------------------------------------------
// IndexNow key generation
// ---------------------------------------------------------------------------

function runIndexNowSetup() {
  if (env('INDEXNOW_KEY')) {
    console.log()
    console.log('  ⏭  IndexNow: INDEXNOW_KEY already set, skipping.')
    return
  }

  console.log()
  console.log('Generating IndexNow API key...')
  const key = randomBytes(16).toString('hex') // 32-char hex string
  writeSetupSecret('INDEXNOW_KEY', key)
  console.log('  ✅  IndexNow key generated.')
  console.log('      The key is served dynamically at /{key}.txt by the server route.')
  console.log()
}

// ---------------------------------------------------------------------------
// Single-command bootstrap (all pre-deploy setup)
// ---------------------------------------------------------------------------

async function runSetupAll() {
  const missing: string[] = []
  if (!env('GA_ACCOUNT_ID')) missing.push('GA_ACCOUNT_ID')
  if (!env('SITE_URL')) missing.push('SITE_URL')
  if (!env('GSC_USER_EMAIL')) missing.push('GSC_USER_EMAIL')
  if (!hasGscCredentials()) missing.push('GSC_SERVICE_ACCOUNT_JSON or GSC_SERVICE_ACCOUNT_JSON_PATH')

  if (missing.length) {
    console.error('❌  Missing required keys (set in Doppler):')
    missing.forEach((k) => console.error(`     ${k}`))
    console.error()
    console.error('   Then run: doppler run -- npm run setup:all')
    process.exit(1)
  }

  console.log()
  console.log('══════════════════════════════════════════════════════════')
  console.log('  Bootstrap: PostHog → GA4 → GSC → IndexNow')
  console.log('══════════════════════════════════════════════════════════')

  await runPosthogSetupOrSkip()
  await runGaSetupOrSkip()
  await runGscPipeline()
  runIndexNowSetup()

  console.log()
  console.log('══════════════════════════════════════════════════════════')
  console.log('  Next steps (run after deploy):')
  console.log('    1. npm run deploy')
  console.log('    2. doppler run -- npm run setup:gsc:verify')
  console.log('══════════════════════════════════════════════════════════')
  console.log()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cmd = process.argv[2] || ''

  try {
    switch (cmd) {
      case 'status':
      case '':
        checkStatus()
        break

      case 'all':
      case 'bootstrap':
        await runSetupAll()
        break

      case 'gsc':
        await runGscPipeline()
        break

      case 'gsc:verify':
        await runGscVerify()
        break

      case 'posthog':
        console.log('PostHog projects are shared globally now. Link POSTHOG_PUBLIC_KEY from narduk-analytics.')
        break

      case 'ga':
        await runGaSetup()
        break

      case 'indexnow':
        runIndexNowSetup()
        break

      default:
        console.log('Usage:')
        console.log('  npx jiti tools/setup-analytics.ts all          # Full bootstrap (PostHog + GA4 + GSC + IndexNow), then deploy + gsc:verify')
        console.log('  npx jiti tools/setup-analytics.ts status       # Check status')
        console.log('  npx jiti tools/setup-analytics.ts posthog      # Create PostHog project only')
        console.log('  npx jiti tools/setup-analytics.ts ga           # Create GA4 property + stream only')
        console.log('  npx jiti tools/setup-analytics.ts gsc          # GSC: register + verification file only')
        console.log('  npx jiti tools/setup-analytics.ts gsc:verify   # GSC: verify ownership + submit sitemap (run after deploy)')
        console.log('  npx jiti tools/setup-analytics.ts indexnow     # Generate IndexNow API key only')
    }
  } catch (error: any) {
    console.error()
    console.error('❌  Error:', error.response?.data?.error?.message || error.message)
    process.exit(1)
  }
}

main()
