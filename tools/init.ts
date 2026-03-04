import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * INIT.TS — Nuxt v4 Template Initialization Script (Idempotent)
 * ----------------------------------------------------------------
 * Automates the transformation of a fresh `narduk-nuxt-template` clone into a ready-to-deploy app.
 * Safe to re-run — all steps check for existing state before making changes.
 * 
 * Usage:
 *   pnpm run setup -- --name="my-app" --display="My App Name" --url="https://myapp.com"
 * 
 * Re-run (repair mode — skip string replacement and README):
 *   pnpm run setup -- --name="my-app" --display="My App Name" --url="https://myapp.com" --repair
 * 
 * What this does:
 * 1. Safely finds and replaces all boilerplate strings (skipped in --repair mode)
 * 2. Provisions the Cloudflare D1 database (skips if exists)
 * 3. Rewrites `wrangler.json` with the D1 database ID
 * 4. Resets README.md (skipped in --repair mode)
 * 5. Provisions Doppler project and syncs hub secrets (additive only)
 * 6. Sets Doppler CI token on GitHub (skips if token exists)
 * 7. Runs analytics provisioning pipeline (each service skips if configured)
 * 8. Generates favicon assets for apps/web/public from source SVG
 * 9. Cleans up template-specific example apps and configuration.
 * 10. Done — script is kept for future re-runs
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
  console.error('  pnpm run setup -- --name="narduk-enterprises" --display="Narduk Enterprises" --url="https://nard.uk"')
  console.error()
  console.error('Re-run (repair infra only):')
  console.error('  pnpm run setup -- --name="narduk-enterprises" --display="Narduk Enterprises" --url="https://nard.uk" --repair')
  console.error()
  console.error('Please provide: --name, --display, and --url')
  process.exit(1)
}

const APP_NAME = args.name as string
const DISPLAY_NAME = args.display as string
const SITE_URL = (args.url as string).replace(/\/$/, '') // strip trailing slash
let REPAIR_MODE = !!args.repair

// Validate APP_NAME to prevent shell injection
if (!/^[a-z0-9][a-z0-9-]*$/.test(APP_NAME)) {
  console.error('❌ Invalid --name: must match /^[a-z0-9][a-z0-9-]*$/ (lowercase alphanumeric + hyphens).')
  process.exit(1)
}

// Detect Doppler CLI availability
function isDopplerAvailable(): boolean {
  try {
    execSync('doppler --version', { encoding: 'utf-8', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}
const DOPPLER_AVAILABLE = isDopplerAvailable()

// Boilerplate targets to replace
// Order matters: more-specific patterns must come before less-specific ones
// Display name: "Nuxt 4 Demo" is the default app name in nuxt.config.ts (site.name,
// schemaOrg.identity.name, runtimeConfig fallback) and generate-favicons.mjs. The layer's
// app.vue reads runtimeConfig.public.appName at runtime, but these build-time values also
// need to be replaced so SEO metadata matches the project from the first deploy.
// The layer's scoped package name must NEVER be replaced — it's a stable
// published identity shared across all consuming apps. We match it first
// (identity replacement) so the generic `narduk-nuxt-template` pattern below
// cannot corrupt it.
const LAYER_PACKAGE = '@narduk-enterprises/narduk-nuxt-template-layer'
const LAYER_PACKAGE_PLACEHOLDER = '__LAYER_PKG_PLACEHOLDER__'
const REPLACEMENTS = [
  // 1. Temporarily replace the protected layer package name with a safe placeholder
  { from: /@narduk-enterprises\/narduk-nuxt-template-layer/g, to: LAYER_PACKAGE_PLACEHOLDER },

  // 2. Perform all standard project renames
  { from: /narduk-nuxt-template-examples-db/g, to: `${APP_NAME}-examples-db` },
  { from: /narduk-nuxt-template-examples/g, to: `${APP_NAME}-examples` },
  { from: /narduk-nuxt-template-db/g, to: `${APP_NAME}-db` },
  { from: /narduk-nuxt-template/g, to: APP_NAME },
  { from: /https:\/\/narduk-nuxt-template\.workers\.dev/g, to: SITE_URL },
  // Display names: replace both variants so SEO metadata, OG images, and manifest
  // all reflect the new project name from the first deploy.
  { from: /Nuxt 4 Template/g, to: DISPLAY_NAME },
  { from: /Nuxt 4 Demo/g, to: DISPLAY_NAME },
  // Template-specific site description — replace with a generic one the agent can customize.
  { from: /A production-ready demo template showcasing Nuxt 4, Nuxt UI 4, Tailwind CSS 4, and Cloudflare Workers with D1 database\./g, to: `${DISPLAY_NAME} — powered by Nuxt 4 and Cloudflare Workers.` },

  // 3. Restore the protected layer package name
  { from: new RegExp(LAYER_PACKAGE_PLACEHOLDER, 'g'), to: LAYER_PACKAGE },
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
  // Auto-detect if already initialized to protect existing projects
  try {
    const pkgContent = await fs.readFile(path.join(ROOT_DIR, 'package.json'), 'utf-8')
    if (!JSON.parse(pkgContent).name.includes('narduk-nuxt-template')) {
      REPAIR_MODE = true
    }
  } catch {
    // Ignore
  }

  // Determine if there is a target (non-template) git remote available
  let hasGitRemote = false
  try {
    const remotesCheck = execSync('git remote -v', { encoding: 'utf-8', stdio: 'pipe' }).trim()
    hasGitRemote = remotesCheck.split('\n').some(line => !line.includes('narduk-nuxt-template') && line.includes('(push)'))
  } catch { /* no git or no remotes */ }


  // Pre-flight check: Ensure git is initialized and remote is set properly
  if (!REPAIR_MODE) {
    let remotesCheck = ''
    try {
      remotesCheck = execSync('git remote -v', { encoding: 'utf-8', stdio: 'pipe' }).trim()
      if (remotesCheck.includes('narduk-nuxt-template')) {
        console.error('\n❌ CRITICAL: Template repository detected.')
        console.error('You must clear the template history and link to your own repository before running setup.')
        console.error('\nPlease run the following commands:')
        console.error('  rm -rf .git')
        console.error('  git init')
        console.error('  git remote add origin git@github.com:your-username/my-app.git')
        console.error('\nThen re-run your setup command.\n')
        process.exit(1)
      } else if (!remotesCheck) {
        throw new Error('No remotes configured')
      }
    } catch {
      console.error('\n❌ CRITICAL: No git repository or remote detected.')
      console.error('You must initialize a git repository and link to your remote before running setup.')
      console.error('This is required to properly securely bind CI tokens.')
      console.error('\nPlease run the following commands:')
      console.error('  git init')
      console.error('  git remote add origin git@github.com:your-username/my-app.git')
      console.error('\nThen re-run your setup command.\n')
      process.exit(1)
    }
  }

  console.log(`\n🚀 Initializing: ${DISPLAY_NAME} (${APP_NAME})${REPAIR_MODE ? ' [REPAIR MODE]' : ''}`)

  // 1. Recursive String Replacement
  if (REPAIR_MODE) {
    console.log('\nStep 1/10: Replacing boilerplate strings... ⏭ skipped (--repair)')
  } else {
    console.log('\nStep 1/10: Replacing boilerplate strings...')
    const files = await walkDir(ROOT_DIR)
    let changedFiles = 0

    for (const file of files) {
      // Skip this init script so we don't dynamically break the replacements
      if (file.endsWith('tools/init.ts')) continue
      // Skip documentation files — they reference the template name intentionally
      if (file.endsWith('.md')) continue

      const original = await fs.readFile(file, 'utf-8')
      let content = original

      // Protect the layer's package identity — the layer's `name` field must remain
      // stable because it's a published workspace dependency referenced by consuming apps.
      const isLayerPkg = /layers\/[^/]+\/package\.json$/.test(file)
      let preservedName: string | undefined
      if (isLayerPkg) {
        try {
          preservedName = JSON.parse(original).name
        } catch { /* not valid JSON, skip preservation */ }
      }

      for (const r of REPLACEMENTS) {
        content = content.replace(r.from, r.to)
      }

      // Restore the preserved layer package name after replacements
      if (preservedName && isLayerPkg) {
        try {
          const parsed = JSON.parse(content)
          parsed.name = preservedName
          content = JSON.stringify(parsed, null, 2) + '\n'
        } catch { /* not valid JSON after replacement, skip */ }
      }

      if (original !== content) {
        await fs.writeFile(file, content, 'utf-8')
        changedFiles++
      }
    }
    console.log(`  ✅ Updated ${changedFiles} files.`)

    // Targeted .md replacement: update Doppler project names and clone URLs in
    // CONTRIBUTING.md and example READMEs. We skip:
    //   - AGENTS.md files (intentional template/clone safety warnings)
    //   - Root README.md (overwritten in Step 4)
    //   - layers/ .md files (reference the layer's published package identity)
    //   - .agents/workflows/ .md files (instructional references to the template)
    const mdFiles = (await walkDir(ROOT_DIR))
      .filter(f =>
        f.endsWith('.md')
        && !f.endsWith('AGENTS.md')
        && f !== path.join(ROOT_DIR, 'README.md')
        && !f.includes(`${path.sep}layers${path.sep}`)
        && !f.includes(`${path.sep}.agents${path.sep}`)
      )
    let mdChanged = 0
    for (const file of mdFiles) {
      const original = await fs.readFile(file, 'utf-8')
      let content = original
      // Replace Doppler project name and template-specific display names
      content = content.replace(/narduk-nuxt-template/g, APP_NAME)
      content = content.replace(/Nuxt 4 Template/g, DISPLAY_NAME)
      content = content.replace(/Nuxt 4 Demo/g, DISPLAY_NAME)
      if (original !== content) {
        await fs.writeFile(file, content, 'utf-8')
        mdChanged++
      }
    }
    if (mdChanged > 0) {
      console.log(`  ✅ Updated ${mdChanged} markdown files (Doppler refs, display names).`)
    }
  }

  // 2. Database Provisioning (per-app — each app gets its own D1 database)
  console.log('\nStep 2/10: Provisioning D1 Databases...')

  /**
   * Provision a D1 database by name. Returns the database_id or null on failure.
   * Safe to call multiple times — skips if the database already exists.
   * Uses `wrangler d1 info --json` for reliable ID parsing (avoids brittle regex on table output).
   */
  function provisionD1(name: string): string | null {
    // Try to create first
    try {
      console.log(`  Running: npx wrangler d1 create ${name}`)
      execSync(`npx wrangler d1 create ${name}`, { encoding: 'utf-8', stdio: 'pipe' })
      console.log(`  ✅ Database created: ${name}`)
    } catch (error: any) {
      const stderr = error.stderr || ''
      if (!stderr.includes('already exists')) {
        console.error(`  ❌ D1 creation failed for ${name}: ${stderr || error.message}`)
        console.error('  Are you logged into Wrangler? (npx wrangler login)')
        return null
      }
      console.log(`  ⏭ Database ${name} already exists.`)
    }

    // Always fetch the ID via --json for reliable parsing
    try {
      const infoOutput = execSync(`npx wrangler d1 info ${name} --json`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      })
      const info = JSON.parse(infoOutput)
      const dbId = info.uuid || info.database_id
      if (dbId) {
        console.log(`  📋 Database ID: ${dbId}`)
        return dbId
      }
    } catch (e: any) {
      console.error(`  ❌ Failed to fetch DB info for ${name}: ${e.message}`)
    }
    return null
  }

  // 3. Link each app to its own dedicated D1 database
  console.log('\nStep 3/10: Linking Databases to wrangler.json...')
  const appsDir = path.join(ROOT_DIR, 'apps')
  let appDirs: string[] = []
  try {
    const entries = await fs.readdir(appsDir, { withFileTypes: true })
    // Only provision databases for actual production apps, not examples.
    appDirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => name !== 'showcase' && !name.startsWith('example-'))
  } catch {
    appDirs = []
  }

  let updatedCount = 0
  for (const appDir of appDirs) {
    const wranglerPath = path.join(appsDir, appDir, 'wrangler.json')
    try {
      const wranglerContent = await fs.readFile(wranglerPath, 'utf-8')
      const parsedWrangler = JSON.parse(wranglerContent)

      // Provision a dedicated D1 database for this app using its declared database_name
      if (parsedWrangler.d1_databases && parsedWrangler.d1_databases.length > 0) {
        const declaredDbName = parsedWrangler.d1_databases[0].database_name
        if (declaredDbName) {
          const dbId = provisionD1(declaredDbName)
          if (dbId) {
            parsedWrangler.d1_databases[0].database_id = dbId
          } else {
            console.warn(`  ⚠️ Could not provision DB for apps/${appDir} — manual update required.`)
          }
        }
        // Remove the corrupted preview_database_id placeholder ("DB" is the binding name, not an ID).
        // Most projects use `--remote` for preview; if a real preview DB is needed, provision it separately.
        delete parsedWrangler.d1_databases[0].preview_database_id
      }

      // Only set custom domains on the primary app (web), not companion apps (examples).
      // Skip workers.dev subdomains — they don't support custom domains.
      if (appDir === 'web') {
        try {
          const urlObj = new URL(SITE_URL)
          if (urlObj.hostname.endsWith('.workers.dev')) {
            console.log(`  ⏭ Skipping custom domain — ${urlObj.hostname} is a workers.dev subdomain.`)
          } else {
            if (!parsedWrangler.routes) {
              parsedWrangler.routes = []
            }
            const existingRoute = parsedWrangler.routes.find((r: any) => r.pattern === urlObj.hostname)
            if (!existingRoute) {
              parsedWrangler.routes.push({ pattern: urlObj.hostname, custom_domain: true })
            }
          }
        } catch (_e) {
          console.warn(`  ⚠️ Could not configure custom domain: Invalid SITE_URL (${SITE_URL})`)
        }
      }

      await fs.writeFile(wranglerPath, JSON.stringify(parsedWrangler, null, 2) + '\n', 'utf-8')
      updatedCount++
      console.log(`  ✅ Updated apps/${appDir}/wrangler.json`)
    } catch {
      // App doesn't have a wrangler.json — skip silently
    }
  }

  if (updatedCount === 0) {
    console.warn('  ⚠️ No wrangler.json files found in apps/*/')
  }

  // 4. Reset README
  if (REPAIR_MODE) {
    console.log('\nStep 4/10: Resetting README.md... ⏭ skipped (--repair)')
  } else {
    console.log('\nStep 4/10: Resetting README.md...')
    const readmeContent = `# ${DISPLAY_NAME}

**${APP_NAME}** — initialized from \`narduk-nuxt-template\`.

## Live Site
[${SITE_URL}](${SITE_URL})

## Local Development

1. Setup environment variables (e.g. via Doppler)
2. Run database migration: \`pnpm run db:migrate\`
3. Start dev server: \`pnpm run dev\`

## Deployment

Pushes to \`main\` are automatically built and deployed via the GitHub Actions CI/CD workflows utilizing \`pnpm run deploy\`.
`
    await fs.writeFile(path.join(ROOT_DIR, 'README.md'), readmeContent, 'utf-8')
    console.log(`  ✅ Generated fresh README.`)
  }

  // 5. Doppler Registration (additive — won't clobber existing secrets)
  console.log('\nStep 5/10: Provisioning Doppler Project...')
  if (!DOPPLER_AVAILABLE) {
    console.log('  ⏭ Doppler CLI not configured; skipping Doppler project provisioning.')
    console.log('     Run `doppler setup` and re-run with --repair to complete this step.')
  } else {
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

    // Set hub references — overwrites stale direct values with cross-project refs
    try {
      const existing = getDopplerSecretNames(APP_NAME, 'prd')

      // Hub cross-project references (always enforce these)
      const hubRefs: Record<string, string> = {
        CLOUDFLARE_API_TOKEN: '${narduk-nuxt-template.prd.CLOUDFLARE_API_TOKEN}',
        CLOUDFLARE_ACCOUNT_ID: '${narduk-nuxt-template.prd.CLOUDFLARE_ACCOUNT_ID}',
        POSTHOG_PUBLIC_KEY: '${narduk-nuxt-template.prd.POSTHOG_PUBLIC_KEY}',
        POSTHOG_PROJECT_ID: '${narduk-nuxt-template.prd.POSTHOG_PROJECT_ID}',
        POSTHOG_HOST: '${narduk-nuxt-template.prd.POSTHOG_HOST}',
        GA_ACCOUNT_ID: '${narduk-nuxt-template.prd.GA_ACCOUNT_ID}',
        GSC_SERVICE_ACCOUNT_JSON: '${narduk-nuxt-template.prd.GSC_SERVICE_ACCOUNT_JSON}',
      }

      // Per-app secrets (only set if missing — don't overwrite app-specific values)
      const appSecrets: Record<string, string> = {
        APP_NAME: APP_NAME,
        SITE_URL: SITE_URL,
      }

      // Hub refs: verify resolved value matches hub, overwrite if stale
      let hubToken = ''
      try {
        const hubJson = execSync(
          'doppler secrets get CLOUDFLARE_API_TOKEN --project narduk-nuxt-template --config prd --json',
          { encoding: 'utf-8', stdio: 'pipe' },
        )
        hubToken = JSON.parse(hubJson).CLOUDFLARE_API_TOKEN?.computed || ''
      } catch { /* hub unavailable */ }

      const toSet: string[] = []

      if (hubToken) {
        let spokeToken = ''
        try {
          const spokeJson = execSync(
            `doppler secrets get CLOUDFLARE_API_TOKEN --project ${APP_NAME} --config prd --json`,
            { encoding: 'utf-8', stdio: 'pipe' },
          )
          spokeToken = JSON.parse(spokeJson).CLOUDFLARE_API_TOKEN?.computed || ''
        } catch { /* not set */ }

        if (spokeToken !== hubToken) {
          // Stale or missing — force all hub refs
          for (const [key, val] of Object.entries(hubRefs)) {
            toSet.push(`${key}='${val}'`)
          }
        }
      } else {
        // Can't verify hub — only set missing refs
        for (const [key, val] of Object.entries(hubRefs)) {
          if (!existing.has(key)) toSet.push(`${key}='${val}'`)
        }
      }

      // Per-app secrets: only add if missing
      for (const [key, val] of Object.entries(appSecrets)) {
        if (!existing.has(key)) toSet.push(`${key}='${val}'`)
      }

      if (toSet.length > 0) {
        execSync(`doppler secrets set ${toSet.join(' ')} --project ${APP_NAME} --config prd`, { stdio: 'pipe' })
        console.log(`  ✅ Synced ${toSet.length} credentials: ${toSet.map(s => s.split('=')[0]).join(', ')}`)
      } else {
        console.log(`  ⏭ All credentials correctly configured (hub references verified).`)
      }
    } catch (error: any) {
      console.warn(`  ⚠️ Failed to sync hub credentials: ${error.message}`)
    }
  }

  // 6. Doppler Service Token → GitHub Secret (skip if token exists)
  console.log('\nStep 6/10: Adding Doppler token to GitHub repository...')
  if (!DOPPLER_AVAILABLE) {
    console.log('  ⏭ Doppler CLI not configured; skipping GitHub secret setup.')
    console.log('     Run `doppler setup` and re-run with --repair to complete this step.')
  } else {
    if (!hasGitRemote) {
      console.log('  ⏭ No git remote found (expected for fresh scaffolds).')
      console.log('    After adding a remote, re-run with --repair to set the GitHub secret.')
      console.log('    ⚠️  Deploy will fail on push to main until DOPPLER_TOKEN is set; run setup with --repair after adding your remote.')
    } else {
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

          // Automatically determine the target GitHub repository (excluding narduk-nuxt-template)
          let targetRepoFlag = ''
          try {
            const remotesOutput = execSync('git remote -v', { encoding: 'utf-8', stdio: 'pipe' })
            const remotes = remotesOutput.split('\n').filter(Boolean)
            const targetRemoteLine = remotes.find(line => !line.includes('narduk-nuxt-template') && line.includes('(push)'))
            if (targetRemoteLine) {
              let url = targetRemoteLine.split(/\s+/)[1]
              if (url) {
                url = url.replace(/^(https?:\/\/|git@)/, '')
                url = url.replace(/^github\.com[:/]/, '')
                url = url.replace(/\.git$/, '')
                if (url) {
                  targetRepoFlag = `--repo "${url}"`
                  console.log(`  🎯 Automatically selected GitHub repository for secrets: ${url}`)
                }
              }
            }
          } catch {
            // Fallback to default gh cli behavior if parsing fails
          }

          // Upload to GitHub as a repository secret via gh CLI
          execSync(`gh secret set DOPPLER_TOKEN ${targetRepoFlag} --body "${dopplerToken}"`, { encoding: 'utf-8', stdio: 'pipe' })
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
    }
  }

  // 6.5. Local Doppler Setup (skip if in CI)
  console.log('\nStep 6.5/10: Configuring local Doppler environment...')
  if (!DOPPLER_AVAILABLE) {
    console.log('  ⏭ Doppler CLI not configured; skipping local setup.')
  } else if (process.env.CI) {
    console.log('  ⏭ Running in CI; skipping local Doppler setup.')
  } else {
    try {
      execSync(`doppler setup --project ${APP_NAME} --config dev`, { encoding: 'utf-8', stdio: 'pipe' })
      console.log(`  ✅ Local Doppler environment configured for project: ${APP_NAME} (dev config)`)
    } catch (error: any) {
      const stderr = error.stderr || error.message || ''
      console.warn(`  ⚠️ Failed to configure local Doppler environment: ${stderr}`)
    }
  }

  // 7. Analytics Provisioning (each service internally skips if already configured)
  console.log('\nStep 7/10: Bootstrapping Google Analytics & IndexNow...')
  if (!DOPPLER_AVAILABLE) {
    console.log('  ⏭ Doppler CLI not configured; skipping analytics provisioning.')
    console.log('     Run `doppler setup` and re-run with --repair to complete this step.')
  } else {
    try {
      const toolsDir = path.join(ROOT_DIR, 'tools')
      if (await fs.stat(path.join(toolsDir, 'setup-analytics.ts')).catch(() => null)) {
        // Pre-check: analytics setup requires these keys in Doppler.
        // If they're not set yet, defer gracefully instead of letting the
        // analytics script hard-exit with process.exit(1).
        const analyticsSecrets = getDopplerSecretNames(APP_NAME, 'prd')
        const requiredAnalyticsKeys = ['GA_ACCOUNT_ID', 'SITE_URL', 'GSC_SERVICE_ACCOUNT_JSON']
        const missingAnalytics = requiredAnalyticsKeys.filter(k => !analyticsSecrets.has(k))

        if (missingAnalytics.length > 0) {
          console.log('  ⏭ Deferring analytics setup — missing Doppler secrets:')
          missingAnalytics.forEach(k => console.log(`    • ${k}`))
          console.log(`  Once set, run: doppler run --project ${APP_NAME} --config prd -- npx jiti tools/setup-analytics.ts all`)
        } else {
          console.log('  Installing ephemeral dependencies (googleapis, google-auth-library)...')
          execSync('pnpm add -w --save-dev googleapis google-auth-library', { encoding: 'utf-8', stdio: 'pipe' })

          console.log('  Executing Narduk Analytics provisioning pipeline...')
          // Run against the app's own Doppler project (prd config) so SITE_URL, GSC creds,
          // and hub references all resolve correctly. Command is `all`, not `setup:all`.
          execSync(`doppler run --project ${APP_NAME} --config prd -- npx jiti tools/setup-analytics.ts all`, {
            stdio: 'inherit',
            env: {
              ...process.env,
              APP_NAME,
              GSC_USER_EMAIL: process.env.GSC_USER_EMAIL || ''
            }
          })
          console.log(`  ✅ Analytics & Search Console setup successful.`)
        }
      } else {
        console.log('  ⚠️ tools/setup-analytics.ts missing. Skipping analytics.')
      }
    } catch (error: any) {
      console.warn(`  ⚠️ Failed to execute analytics pipeline: ${error.message}`)
    }
  }

  // 8. Generate Favicons for apps/web
  console.log('\nStep 8/10: Generating favicon assets for apps/web...')
  try {
    const webPublicDir = path.join(ROOT_DIR, 'apps', 'web', 'public')
    const webFaviconSvg = path.join(webPublicDir, 'favicon.svg')
    if (await fs.stat(webFaviconSvg).then(() => true).catch(() => false)) {
      console.log('  Installing ephemeral dependencies (sharp)...')
      execSync('pnpm add -w --save-dev sharp', { encoding: 'utf-8', stdio: 'pipe' })

      execSync(
        `npx tsx tools/generate-favicons.ts --target=apps/web/public --name="${DISPLAY_NAME}" --short-name="${DISPLAY_NAME.slice(0, 12)}"`,
        { stdio: 'inherit', cwd: ROOT_DIR }
      )
      console.log('  ✅ Favicon assets generated for apps/web.')
    } else {
      console.log('  ⏭ No favicon.svg found in apps/web/public. Skipping.')
      console.log('    Run the /generate-branding workflow to create branding assets.')
    }
  } catch (error: any) {
    console.warn(`  ⚠️ Favicon generation failed: ${error.message}`)
    console.warn('    Run manually: pnpm generate:favicons -- --target=apps/web/public')
  }

  // 9. Template Cleanup (removing template-specific robust boilerplate)
  if (REPAIR_MODE) {
    console.log('\nStep 9/10: Cleaning up template examples... ⏭ skipped (--repair)')
  } else {
    console.log('\nStep 9/10: Cleaning up template examples and configs...')
    try {
      const rmOptions = { recursive: true, force: true }
      // Remove example directories
      const dirsToRemove = [
        path.join(ROOT_DIR, 'apps', 'showcase'),
      ]

      const appsContent = await fs.readdir(path.join(ROOT_DIR, 'apps'), { withFileTypes: true }).catch(() => [])
      for (const entry of appsContent) {
        if (entry.isDirectory() && entry.name.startsWith('example-')) {
          dirsToRemove.push(path.join(ROOT_DIR, 'apps', entry.name))
        }
      }

      for (const dir of dirsToRemove) {
        await fs.rm(dir, rmOptions)
      }

      // Remove specific GitHub workflows
      await fs.rm(path.join(ROOT_DIR, '.github', 'workflows', 'deploy-showcase.yml'), rmOptions)
      await fs.rm(path.join(ROOT_DIR, '.github', 'workflows', 'publish-layer.yml'), rmOptions)

      // Prune root package.json scripts
      const rootPkgPath = path.join(ROOT_DIR, 'package.json')
      const rootPkgContent = await fs.readFile(rootPkgPath, 'utf-8')
      const rootPkg = JSON.parse(rootPkgContent)
      if (rootPkg.scripts) {
        const scriptsToRemove = [
          'dev:showcase', 'dev:auth', 'dev:blog', 'dev:marketing', 'dev:og-image', 'dev:apple-maps',
          'db:ready:all', 'db:ready:auth', 'db:ready:blog', 'db:migrate:auth', 'db:seed:auth',
          'build:showcase', 'deploy:showcase',
          'test:e2e:auth', 'test:e2e:blog', 'test:e2e:marketing', 'test:e2e:showcase', 'test:e2e:apple-maps'
        ]
        for (const script of scriptsToRemove) {
          delete rootPkg.scripts[script]
        }
        await fs.writeFile(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf-8')
      }

      // Strip test and quality scripts from all eslint packages so implementing repositories
      // don't run internal template tests or lint the linters.
      const eslintPkgPaths = [
        path.join(ROOT_DIR, 'packages', 'eslint-config', 'package.json'),
        path.join(ROOT_DIR, 'packages', 'eslint-config', 'eslint-plugin-nuxt-guardrails', 'package.json'),
        path.join(ROOT_DIR, 'packages', 'eslint-config', 'eslint-plugin-nuxt-ui', 'package.json'),
        path.join(ROOT_DIR, 'packages', 'eslint-config', 'eslint-plugin-vue-official-best-practices', 'package.json'),
      ]
      for (const pkgPath of eslintPkgPaths) {
        try {
          const pkgContent = await fs.readFile(pkgPath, 'utf-8')
          const pkg = JSON.parse(pkgContent)
          if (pkg.scripts) {
            const scriptsToRemove = ['quality', 'test', 'test:watch', 'test:plugins', 'lint', 'typecheck']
            for (const script of scriptsToRemove) {
              delete pkg.scripts[script]
            }
            await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
          }
        } catch (err: any) {
          // ignore
        }
      }

      // Replace ci.yml with a slim version that calls reusable workflows from the template repo.
      // This eliminates CI drift — when the template updates its workflows, all derived apps benefit.
      const ciYamlPath = path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml')
      try {
        const slimCi = `name: CI

on:
  workflow_dispatch:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-\${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    uses: narduk-enterprises/narduk-nuxt-template/.github/workflows/reusable-quality.yml@main

  deploy:
    if: github.event_name != 'pull_request'
    needs: [quality]
    permissions:
      contents: read
      deployments: write
    uses: narduk-enterprises/narduk-nuxt-template/.github/workflows/reusable-deploy.yml@main
    secrets:
      DOPPLER_TOKEN: \${{ secrets.DOPPLER_TOKEN }}
      CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
`
        await fs.writeFile(ciYamlPath, slimCi, 'utf-8')
      } catch (ciErr: any) {
        console.warn(`  ⚠️ Could not update ci.yml: ${ciErr.message}`)
      }

      // Remove reusable workflow definitions (they live in the template repo, not derived apps)
      for (const wf of ['reusable-quality.yml', 'reusable-deploy.yml']) {
        await fs.rm(path.join(ROOT_DIR, '.github', 'workflows', wf), { force: true })
      }

      // Rewrite playwright.config.ts to simple web configuration
      const playwrightConfigPath = path.join(ROOT_DIR, 'playwright.config.ts')
      const playwrightContent = `import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? undefined : 1,
  reporter: 'html',
  timeout: 15_000,
  expect: { timeout: 2_000 },
  use: {
    trace: 'on-first-retry',
    actionTimeout: 3_000,
    navigationTimeout: 5_000,
  },
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'web',
      testDir: 'apps/web/tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
  ],
})
`
      await fs.writeFile(playwrightConfigPath, playwrightContent, 'utf-8')

      console.log('  ✅ Cleaned up example apps, workflows, and package/playwright config.')
    } catch (error: any) {
      console.warn(`  ⚠️ Template cleanup failed: ${error.message}`)
    }
  }

  // 10. Done (script is kept for re-runs)
  // Write the bootstrap sentinel so pre* hooks allow dev/build/deploy
  await fs.writeFile(path.join(ROOT_DIR, '.setup-complete'), `initialized=${new Date().toISOString()}\napp=${APP_NAME}\n`, 'utf-8')

  // Record the template SHA this app was spawned from (used by drift detection in CI)
  let templateSha = ''
  try {
    templateSha = execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR }).trim()
  } catch { /* pre-init state — no commits yet */ }

  const templateVersionContent = [
    `sha=${templateSha || 'unknown'}`,
    `template=narduk-nuxt-template`,
    `spawned=${new Date().toISOString()}`,
    `app=${APP_NAME}`,
    '',
  ].join('\n')
  await fs.writeFile(path.join(ROOT_DIR, '.template-version'), templateVersionContent, 'utf-8')

  console.log('\nStep 10/10: Complete!')
  console.log('  ℹ️  init.ts is kept for re-runs. Use --repair to re-run infra steps only.')

  console.log('\n🎉 Project initialization complete!')
  if (!DOPPLER_AVAILABLE) {
    console.log('\n⚠️  Doppler was not available — Steps 5–7 were skipped.')
    console.log('\nNext steps:')
    console.log('  1. Install and configure Doppler: https://docs.doppler.com/docs/install-cli')
    console.log(`  2. doppler setup --project ${APP_NAME} --config dev`)
    console.log(`  3. pnpm run setup -- --name="${APP_NAME}" --display="${DISPLAY_NAME}" --url="${SITE_URL}" --repair`)
    console.log(`  4. pnpm run db:migrate`)
    console.log(`  5. doppler run -- pnpm run dev`)
    console.log(`  6. pnpm run validate`)
    console.log(`  7. git add . && git commit -m "chore: initialize project"`)
  } else {
    console.log('\nNext steps:')
    console.log(`  1. Review Doppler secrets: doppler secrets --project ${APP_NAME} --config prd`)
    if (process.env.CI) {
      console.log(`  2. Wire Doppler locally: doppler setup --project ${APP_NAME} --config dev`)
    } else {
      console.log(`  2. Verify local Doppler: doppler run -- doppler secrets`)
    }
    console.log(`  3. Run database migration: pnpm run db:migrate`)
    console.log(`  4. Start dev server: doppler run -- pnpm run dev`)
    console.log(`  5. Verify infrastructure: pnpm run validate`)
    console.log(`  6. git add . && git commit -m "chore: initialize project"`)
    if (!hasGitRemote) {
      console.log(`\n  ⚠️  DEPLOYMENT BLOCKED: No git remote was found during setup.`)
      console.log(`     GitHub CI deploy will fail on push to main until DOPPLER_TOKEN is set.`)
      console.log(`     Add a remote and re-run: pnpm run setup -- --name="${APP_NAME}" --display="${DISPLAY_NAME}" --url="${SITE_URL}" --repair`)
    }
    console.log()
    console.log('  💡 If analytics setup was deferred (missing Doppler secrets), run it later:')
    console.log(`     doppler run --project ${APP_NAME} --config prd -- npx jiti tools/setup-analytics.ts all`)
  }
  console.log()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
