import { google } from 'googleapis'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import 'dotenv/config'

/**
 * GSC Toolbox: Programmatically manage Google Search Console properties.
 * 
 * Usage:
 * npx jiti tools/gsc-toolbox.ts init <site_url>
 * npx jiti tools/gsc-toolbox.ts verify <site_url>
 * npx jiti tools/gsc-toolbox.ts submit <site_url>
 */

const siteUrl = process.argv[3] || process.env.SITE_URL

function loadCredentials(): Record<string, any> {
  // Option A: file path (recommended)
  const keyFilePath = process.env.GSC_SERVICE_ACCOUNT_JSON_PATH?.trim()
  if (keyFilePath) {
    const resolved = resolve(process.cwd(), keyFilePath)
    if (!existsSync(resolved)) {
      throw new Error(`Service account key file not found: ${resolved}`)
    }
    return JSON.parse(readFileSync(resolved, 'utf8'))
  }

  // Option B: inline JSON or base64
  const inline = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim()
  if (inline) {
    let str = inline
    if (!str.startsWith('{')) {
      str = Buffer.from(str, 'base64').toString('utf8')
    }
    return JSON.parse(str)
  }

  throw new Error(
    'No service account credentials found. Set GSC_SERVICE_ACCOUNT_JSON_PATH (path to key file) or GSC_SERVICE_ACCOUNT_JSON (inline JSON/base64) in your .env'
  )
}

async function getAuth() {
  const credentials = loadCredentials()
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/siteverification'
    ],
  })
}

async function addSite(url: string) {
  const auth = await getAuth()
  const searchconsole = google.searchconsole({ version: 'v1', auth })
  console.log(`🚀 Registering ${url} in Search Console...`)
  await searchconsole.sites.add({ siteUrl: url })
  console.log('✅ Site registered.')
}

async function getVerificationToken(url: string) {
  const auth = await getAuth()
  const siteVerification = google.siteVerification({ version: 'v1', auth })
  
  console.log(`🔍 Getting verification token for ${url}...`)
  const response = await siteVerification.webResource.getToken({
    requestBody: {
      site: { identifier: url, type: 'SITE' },
      verificationMethod: 'FILE'
    }
  })
  
  return response.data.token
}

async function verifySite(url: string) {
  const auth = await getAuth()
  const siteVerification = google.siteVerification({ version: 'v1', auth })
  
  console.log(`🛡️  Verifying ownership of ${url}...`)
  await siteVerification.webResource.insert({
    verificationMethod: 'FILE',
    requestBody: {
      site: { identifier: url, type: 'SITE' }
    }
  })
  console.log('✅ Ownership verified.')
}

async function grantAccess(url: string, email: string) {
  const auth = await getAuth()
  const siteVerification = google.siteVerification({ version: 'v1', auth })
  
  console.log(`👤 Granting "Owner" access to ${email}...`)
  // First get current owners to avoid overwriting them
  const resource = await siteVerification.webResource.get({
    id: `http${url.includes('https') ? 's' : ''}://${url.replace(/^https?:\/\//, '')}`
  }).catch(() => null)

  const owners = resource?.data.owners || []
  if (!owners.includes(email)) {
    owners.push(email)
  }

  await siteVerification.webResource.update({
    id: url,
    requestBody: {
      site: { identifier: url, type: 'SITE' },
      owners: owners
    }
  })
  console.log('✅ Access granted. Property should now appear in your GSC dashboard.')
}

async function submitSitemap(url: string) {
  const auth = await getAuth()
  const searchconsole = google.searchconsole({ version: 'v1', auth })
  const sitemapUrl = `${url.endsWith('/') ? url : url + '/' }sitemap.xml`
  
  console.log(`🚀 Submitting sitemap: ${sitemapUrl}`)
  await searchconsole.sitemaps.submit({
    siteUrl: url,
    feedpath: sitemapUrl
  })
  console.log('✅ Sitemap submitted.')
}

async function main() {
  const cmd = process.argv[2]
  
  if (!siteUrl) {
    console.error('❌ SITE_URL is required.')
    process.exit(1)
  }

  try {
    switch (cmd) {
      case 'init':
        await addSite(siteUrl)
        const token = await getVerificationToken(siteUrl)
        if (token) {
          // FILE verification expects:
          // 1) a file at `/${googleXXXXXXXXXXXX.html}`
          // 2) whose contents are exactly `google-site-verification: googleXXXXXXXXXXXX.html`
          //
          // The API response token format can vary (plain filename, or a formatted string).
          const m = token.match(/google[0-9a-z]+\.html/i)
          const fileName =
            token.match(/verification-file=([^:\s]+)/i)?.[1] ||
            (m ? m[0] : '') ||
            'google-verification.html'
          const content = token.includes('google-site-verification:')
            ? token
            : `google-site-verification: ${fileName}`
          const publicDir = join(process.cwd(), 'public')
          if (!existsSync(publicDir)) mkdirSync(publicDir)
          const filePath = join(publicDir, fileName)
          writeFileSync(filePath, content)
          console.log(`💾 Verification file created: public/${fileName}`)

          // Cloudflare Pages (and some hosting setups) may redirect `/foo.html` -> `/foo`.
          // Create a no-extension copy too so verification still succeeds.
          if (fileName.toLowerCase().endsWith('.html')) {
            const noExt = fileName.slice(0, -'.html'.length)
            if (noExt && noExt !== fileName) {
              writeFileSync(join(publicDir, noExt), content)
              console.log(`💾 Verification file created: public/${noExt}`)
            }
          }

          console.log('👉 Deploy your app, then run: npm run setup:gsc:verify')
        }
        break
      
      case 'verify':
        await verifySite(siteUrl)
        const userEmail = process.env.GSC_USER_EMAIL
        if (userEmail) {
          await grantAccess(siteUrl, userEmail)
        } else {
          console.log('⚠️  GSC_USER_EMAIL not set. Skipping automatic access grant.')
          console.log('👉 To see this property in your dashboard, add your email to .env and run: npm run setup:gsc:verify')
        }
        break

      case 'submit':
        await submitSitemap(siteUrl)
        break

      default:
        console.log('Usage: npx jiti tools/gsc-toolbox.ts [init|verify|submit]')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data?.error?.message || error.message)
    process.exit(1)
  }
}

main()
