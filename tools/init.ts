import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * INIT.TS — Nuxt v4 Template Initialization Script (Idempotent)
 * ----------------------------------------------------------------
 * Automates the transformation of a fresh `nuxt-v4-template` clone into a ready-to-deploy app.
 * Safe to re-run — all steps check for existing state before making changes.
 * 
 * Usage:
 *   npm run init -- --name="my-app" --display="My App Name" --url="https://myapp.com"
 * 
 * Re-run (repair mode — skip string replacement and README):
 *   npm run init -- --name="my-app" --display="My App Name" --url="https://myapp.com" --repair
 * 
 * What this does:
 * 1. Safely finds and replaces all boilerplate strings (skipped in --repair mode)
 * 2. Provisions the Cloudflare D1 database (skips if exists)
 * 3. Rewrites `wrangler.json` with the D1 database ID
 * 4. Resets README.md (skipped in --repair mode)
 * 5. Provisions Doppler project and syncs hub secrets (additive only)
 * 6. Sets Doppler CI token on GitHub (skips if token exists)
 * 7. Runs analytics provisioning pipeline (each service skips if configured)
 * 8. Done — script is kept for future re-runs
 */

// --- 1. Argument Parsing ---

const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const match = arg.match(/^--([^=]+)=?(.*)$/)
    if (match) return [match[1], match[2] || true]
    return [arg, true]
  })
) as Record<string, string | true>

const requiredArgs = ['name', 'display', 'url']
const missingArgs = requiredArgs.filter(arg => !args[arg] || typeof args[arg] !== 'string')

if (missingArgs.length > 0) {
  console.error()
  console.error('❌ Missing arguments!')
  console.error()
  console.error('Usage example:')
  console.error('  npm run init -- --name="narduk-enterprises" --display="Narduk Enterprises" --url="https://nard.uk"')
  console.error()
  console.error('Re-run (repair infra only):')
  console.error('  npm run init -- --name="narduk-enterprises" --display="Narduk Enterprises" --url="https://nard.uk" --repair')
  console.error()
  console.error('Please provide: --name, --display, and --url')
  process.exit(1)
}

const APP_NAME = args.name as string
const DISPLAY_NAME = args.display as string
const SITE_URL = (args.url as string).replace(/\/$/, '') // strip trailing slash
const REPAIR_MODE = !!args.repair

// Boilerplate targets to replace
const REPLACEMENTS = [
  { from: /nuxt-v4-template-db/g, to: `${APP_NAME}-db` },
  { from: /nuxt-v4-template/g, to: APP_NAME },
  { from: /Nuxt 4 Demo/g, to: DISPLAY_NAME },
  { from: /https:\/\/nuxt-v4-template\.workers\.dev/g, to: SITE_URL }
]

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

// --- Helper Functions ---

async function walkDir(dir: string): Promise<string[]> {
  const omitDirs = new Set(['node_modules', '.git', '.nuxt', '.output', 'dist', 'playwright-report', 'test-results', '.DS_Store'])
  const files: string[] = []
  
  const entries = await fs.readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    if (omitDirs.has(entry.name)) continue
    
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath))
    } else {
      // Exclude binary formats and images
      if (!entry.name.match(/\.(png|jpe?g|gif|webp|svg|ico|ttf|woff2?|sqlite|db)$/i)) {
        files.push(fullPath)
      }
    }
  }
  return files
}

/** Get existing Doppler secret names for a project/config. */
function getDopplerSecretNames(project: string, config: string): Set<string> {
  try {
    const output = execSync(
      `doppler secrets --project ${project} --config ${config} --only-names --plain`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    return new Set(output.trim().split('\n').filter(Boolean))
  } catch {
    return new Set()
  }
}

// --- execution ---

async function main() {
  console.log(`\n🚀 Initializing: ${DISPLAY_NAME} (${APP_NAME})${REPAIR_MODE ? ' [REPAIR MODE]' : ''}`)
  
  // 1. Recursive String Replacement
  if (REPAIR_MODE) {
    console.log('\nStep 1/8: Replacing boilerplate strings... ⏭ skipped (--repair)')
  } else {
    console.log('\nStep 1/8: Replacing boilerplate strings...')
    const files = await walkDir(ROOT_DIR)
    let changedFiles = 0

    for (const file of files) {
      // Specifically skip this init script so we don't dynamically break the replacements
      if (file.endsWith('tools/init.ts')) continue

      const original = await fs.readFile(file, 'utf-8')
      let content = original

      for (const r of REPLACEMENTS) {
        content = content.replace(r.from, r.to)
      }

      if (original !== content) {
        await fs.writeFile(file, content, 'utf-8')
        changedFiles++
      }
    }
    console.log(`  ✅ Updated ${changedFiles} files.`)
  }

  // 2. Database Provisioning
  console.log('\nStep 2/8: Provisioning D1 Database...')
  const dbName = `${APP_NAME}-db`
  console.log(`  Running: npx wrangler d1 create ${dbName}`)
  
  let d1Output = ''
  try {
    d1Output = execSync(`npx wrangler d1 create ${dbName}`, { encoding: 'utf-8', stdio: 'pipe' })
    console.log(`  ✅ Database created: ${dbName}`)
  } catch (error: any) {
    const stderr = error.stderr || ''
    if (stderr.includes('already exists')) {
      console.log(`  ⏭ Database ${dbName} already exists.`)
      // Try to fetch existing DB info
      try {
        d1Output = execSync(`npx wrangler d1 info ${dbName}`, { encoding: 'utf-8', stdio: 'pipe' })
      } catch (e: any) {
        console.error(`  ❌ Failed to fetch info for existing DB: ${e.message}`)
        process.exit(1)
      }
    } else {
      console.error(`  ❌ D1 creation failed: ${stderr || error.message}`)
      console.error('  Are you logged into Wrangler? (npx wrangler login)')
      process.exit(1)
    }
  }

  // 3. Extract DB ID and rewrite wrangler.json
  console.log('\nStep 3/8: Linking Database to wrangler.json...')
  // Match both key=value format and wrangler table format (│ DB │ uuid │)
  const idMatch = d1Output.match(/database_id[=:]\s*"?([a-fA-F0-9-]+)"?/) || d1Output.match(/│\s*DB\s*│\s*([a-fA-F0-9-]+)\s*│/)
  
  if (!idMatch) {
    console.warn(`  ⚠️ Could not parse database_id from Wrangler output.`)
    console.warn('  You will need to manually update wrangler.json.')
    console.warn('  Wrangler output was:')
    console.warn(d1Output)
  } else {
    const dbId = idMatch[1]
    const wranglerPath = path.join(ROOT_DIR, 'wrangler.json')
    try {
      const wranglerContent = await fs.readFile(wranglerPath, 'utf-8')
      const parsedWrangler = JSON.parse(wranglerContent)
      
      if (parsedWrangler.d1_databases && parsedWrangler.d1_databases.length > 0) {
        parsedWrangler.d1_databases[0].database_id = dbId
      }
      
      try {
        const urlObj = new URL(SITE_URL)
        parsedWrangler.routes = [
          { pattern: urlObj.hostname, custom_domain: true }
        ]
      } catch (_e) {
        console.warn(`  ⚠️ Could not configure custom domain: Invalid SITE_URL (${SITE_URL})`)
      }

      await fs.writeFile(wranglerPath, JSON.stringify(parsedWrangler, null, 2) + '\n', 'utf-8')
      console.log(`  ✅ Injected database_id: ${dbId} and configured custom domain map.`)
    } catch (e: any) {
      console.warn(`  ⚠️ Failed to update wrangler.json: ${e.message}`)
    }
  }

  // 4. Reset README
  if (REPAIR_MODE) {
    console.log('\nStep 4/8: Resetting README.md... ⏭ skipped (--repair)')
  } else {
    console.log('\nStep 4/8: Resetting README.md...')
    const readmeContent = `# ${DISPLAY_NAME}

**${APP_NAME}** — initialized from \`nuxt-v4-template\`.

## Live Site
[${SITE_URL}](${SITE_URL})

## Local Development

1. Setup environment variables (e.g. via Doppler)
2. Run database migration: \`npm run db:migrate\`
3. Start dev server: \`npm run dev\`

## Deployment

Pushes to \`main\` are automatically built and deployed via the GitHub Actions CI/CD workflows utilizing \`npm run deploy\`.
`
    await fs.writeFile(path.join(ROOT_DIR, 'README.md'), readmeContent, 'utf-8')
    console.log(`  ✅ Generated fresh README.`)
  }

  // 5. Doppler Registration (additive — won't clobber existing secrets)
  console.log('\nStep 5/8: Provisioning Doppler Project...')
  console.log(`  Running: doppler projects create ${APP_NAME}`)
  try {
    execSync(`doppler projects create ${APP_NAME} --description "${DISPLAY_NAME} auto-provisioned"`, { encoding: 'utf-8', stdio: 'pipe' })
    console.log(`  ✅ Doppler project created: ${APP_NAME}`)
  } catch (error: any) {
    const stderr = error.stderr || ''
    if (stderr.includes('already exists')) {
      console.log(`  ⏭ Doppler project ${APP_NAME} already exists.`)
    } else {
      console.warn(`  ⚠️ Doppler creation failed: ${stderr || error.message}`)
    }
  }

  // Only set hub references for keys that aren't already configured
  try {
    const existing = getDopplerSecretNames(APP_NAME, 'prd')
    const hubSecrets: Record<string, string> = {
      CLOUDFLARE_API_TOKEN: '${narduk-enterprise-apps.prd.CLOUDFLARE_API_TOKEN}',
      CLOUDFLARE_ACCOUNT_ID: '${narduk-enterprise-apps.prd.CLOUDFLARE_ACCOUNT_ID}',
      POSTHOG_PUBLIC_KEY: '${narduk-analytics.prd.POSTHOG_PUBLIC_KEY}',
      POSTHOG_PROJECT_ID: '${narduk-analytics.prd.POSTHOG_PROJECT_ID}',
      POSTHOG_HOST: '${narduk-analytics.prd.POSTHOG_HOST}',
      APP_NAME: APP_NAME,
    }

    const toSet = Object.entries(hubSecrets)
      .filter(([key]) => !existing.has(key))
      .map(([key, val]) => `${key}='${val}'`)

    if (toSet.length > 0) {
      execSync(`doppler secrets set ${toSet.join(' ')} --project ${APP_NAME} --config prd`, { stdio: 'pipe' })
      console.log(`  ✅ Synced ${toSet.length} hub credentials: ${toSet.map(s => s.split('=')[0]).join(', ')}`)
    } else {
      console.log(`  ⏭ All core credentials already configured.`)
    }
  } catch (error: any) {
    console.warn(`  ⚠️ Failed to sync hub credentials: ${error.message}`)
  }

  // 6. Doppler Service Token → GitHub Secret (skip if token exists)
  console.log('\nStep 6/8: Adding Doppler token to GitHub repository...')
  try {
    // Check if ci-deploy token already exists
    let tokenExists = false
    try {
      const tokensOutput = execSync(
        `doppler configs tokens --project ${APP_NAME} --config prd --plain`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )
      tokenExists = tokensOutput.includes('ci-deploy')
    } catch {
      // If listing fails, proceed with creation attempt
    }

    if (tokenExists) {
      console.log(`  ⏭ ci-deploy token already exists. Skipping to avoid invalidating active CI token.`)
    } else {
      const dopplerToken = execSync(
        `doppler configs tokens create ci-deploy --project ${APP_NAME} --config prd --plain`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim()

      if (!dopplerToken) {
        throw new Error('Doppler returned an empty token.')
      }

      // Upload to GitHub as a repository secret via gh CLI
      execSync(`gh secret set DOPPLER_TOKEN --body "${dopplerToken}"`, { encoding: 'utf-8', stdio: 'pipe' })
      console.log(`  ✅ DOPPLER_TOKEN set as GitHub Actions secret.`)
    }
  } catch (error: any) {
    const stderr = error.stderr || error.message || ''
    if (stderr.includes('token') && stderr.includes('already exists')) {
      console.log(`  ⏭ Doppler CI token already exists. Skipping.`)
    } else {
      console.warn(`  ⚠️ Failed to set DOPPLER_TOKEN on GitHub: ${stderr}`)
      console.warn('  Ensure you are logged into gh (gh auth login) and have a git remote set.')
    }
  }

  // 7. Analytics Provisioning (each service internally skips if already configured)
  console.log('\nStep 7/8: Bootstrapping Google Analytics & IndexNow...')
  try {
    const toolsDir = path.join(ROOT_DIR, 'tools')
    if (await fs.stat(path.join(toolsDir, 'setup-analytics.ts')).catch(() => null)) {
      console.log('  Installing ephemeral dependencies (googleapis, google-auth-library)...')
      execSync('pnpm add --save-dev googleapis google-auth-library', { encoding: 'utf-8', stdio: 'pipe' })
      
      console.log('  Executing Narduk Analytics provisioning pipeline...')
      execSync(`doppler run --project narduk-analytics --config prd -- npx jiti tools/setup-analytics.ts setup:all`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          SITE_URL,
          APP_NAME,
          GSC_USER_EMAIL: 'narduk@gmail.com'
        }
      })
      console.log(`  ✅ Analytics & Search Console setup successful.`)
    } else {
      console.log('  ⚠️ tools/setup-analytics.ts missing. Skipping analytics.')
    }
  } catch (error: any) {
    console.warn(`  ⚠️ Failed to execute analytics pipeline: ${error.message}`)
  }

  // 8. Done (script is kept for re-runs)
  console.log('\nStep 8/8: Complete!')
  console.log('  ℹ️  init.ts is kept for re-runs. Use --repair to re-run infra steps only.')

  console.log('\n🎉 Project initialization complete!')
  console.log('\nNext steps:')
  console.log(`  1. Review Doppler secrets: doppler secrets --project ${APP_NAME} --config prd`)
  console.log(`  2. doppler setup && npm run db:migrate`)
  console.log(`  3. git add . && git commit -m "chore: initialize project"`)
  console.log()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
