import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * VALIDATE.TS — Nuxt v4 Template Setup Validation Script
 * ----------------------------------------------------------------
 * Confirms that the necessary infrastructure and configurations have been successfully
 * provisioned for the current project.
 *
 * Usage:
 *   npm run validate
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

// --- Helper Functions ---
function checkCommand(command: string, successMessage: string, errorMessage: string) {
  try {
    execSync(command, { encoding: 'utf-8', stdio: 'pipe' })
    console.log(`  ✅ ${successMessage}`)
    return true
  } catch (error: any) {
    console.error(`  ❌ ${errorMessage}: ${error.stderr || error.message}`)
    return false
  }
}

async function main() {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  const APP_NAME = packageJson.name

  let allGood = true
  if (!APP_NAME || APP_NAME.includes('narduk-nuxt-template')) {
    console.error(`  ❌ Project name is still '${APP_NAME}'. Has init been run?`)
    allGood = false
  }

  console.log(`\n🔍 Validating Setup for: ${APP_NAME}`)

  // 1. Check D1 Databases (reads database_name from each app's wrangler.json)
  console.log('\nStep 1/6: Validating D1 Databases...')
  try {
    const appsDir = path.join(ROOT_DIR, 'apps')
    const entries = await fs.readdir(appsDir, { withFileTypes: true })
    const appDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)
    let checkedAny = false

    for (const appDir of appDirs) {
      const wranglerPath = path.join(appsDir, appDir, 'wrangler.json')
      try {
        const wranglerContent = await fs.readFile(wranglerPath, 'utf-8')
        const parsedWrangler = JSON.parse(wranglerContent)
        if (parsedWrangler.d1_databases && parsedWrangler.d1_databases.length > 0) {
          const dbName = parsedWrangler.d1_databases[0].database_name
          if (dbName) {
            checkedAny = true
            allGood =
              checkCommand(
                `npx wrangler d1 info ${dbName}`,
                `Database ${dbName} exists (apps/${appDir}).`,
                `Database ${dbName} not found (apps/${appDir})`,
              ) && allGood
          }
        }
      } catch {
        // App doesn't have a wrangler.json — skip
      }
    }
    if (!checkedAny) {
      console.log('  ⏭ No apps with D1 databases to validate.')
    }
  } catch (e: any) {
    console.error(`  ❌ Failed to scan apps directory: ${e.message}`)
    allGood = false
  }

  // 2. Check wrangler.json database_id values
  console.log('\nStep 2/6: Validating wrangler.json database IDs...')
  try {
    const appsDir = path.join(ROOT_DIR, 'apps')
    const entries = await fs.readdir(appsDir, { withFileTypes: true })
    const appDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)
    let foundAny = false

    for (const appDir of appDirs) {
      const wranglerPath = path.join(appsDir, appDir, 'wrangler.json')
      try {
        const wranglerContent = await fs.readFile(wranglerPath, 'utf-8')
        const parsedWrangler = JSON.parse(wranglerContent)
        foundAny = true

        if (parsedWrangler.d1_databases && parsedWrangler.d1_databases.length > 0) {
          const dbId = parsedWrangler.d1_databases[0].database_id
          if (dbId && dbId.length > 0 && dbId !== 'REPLACE_VIA_PNPM_SETUP') {
            console.log(`  ✅ apps/${appDir}/wrangler.json — database_id: ${dbId}`)
          } else {
            console.error(`  ❌ apps/${appDir}/wrangler.json — database_id missing or placeholder.`)
            allGood = false
          }
        }
        // Apps without d1_databases are valid (e.g. marketing, og-image) — skip silently
      } catch {
        // App doesn't have a wrangler.json — skip
      }
    }

    if (!foundAny) {
      console.error('  ❌ No wrangler.json files found in apps/*/')
      allGood = false
    }
  } catch (e: any) {
    console.error(`  ❌ Failed to scan apps directory: ${e.message}`)
    allGood = false
  }

  // 3. Doppler
  console.log('\nStep 3/6: Validating Doppler Configuration...')
  let dopplerOk = true
  dopplerOk = checkCommand(
    `doppler projects get ${APP_NAME}`,
    `Doppler project ${APP_NAME} exists.`,
    `Doppler project ${APP_NAME} not found`,
  )
  if (!dopplerOk) allGood = false

  if (dopplerOk) {
    try {
      const output = execSync(
        `doppler secrets --project ${APP_NAME} --config prd --only-names --plain`,
        { encoding: 'utf-8', stdio: 'pipe' },
      )
      const existing = new Set(output.trim().split('\n').filter(Boolean))
      const requiredSecrets = [
        'CLOUDFLARE_API_TOKEN',
        'CLOUDFLARE_ACCOUNT_ID',
        'APP_NAME',
        'SITE_URL',
      ]

      const missing = requiredSecrets.filter((s) => !existing.has(s))
      if (missing.length === 0) {
        console.log(`  ✅ Core Doppler secrets are present.`)
      } else {
        console.error(`  ❌ Missing Doppler secrets: ${missing.join(', ')}`)
        allGood = false
      }
    } catch {
      console.error('  ❌ Failed to fetch Doppler secrets.')
      allGood = false
    }
  }

  // 3b. Verify hub-and-spoke references resolve correctly
  console.log('\nStep 3b/6: Validating Doppler Hub References...')
  if (!dopplerOk) {
    console.log('  ⏭ Skipping (Doppler project not found).')
  } else {
    const hubChecks: Array<{ key: string; hub: string; config: string }> = [
      { key: 'CLOUDFLARE_API_TOKEN', hub: 'narduk-nuxt-template', config: 'prd' },
      { key: 'CLOUDFLARE_ACCOUNT_ID', hub: 'narduk-nuxt-template', config: 'prd' },
      { key: 'POSTHOG_PUBLIC_KEY', hub: 'narduk-nuxt-template', config: 'prd' },
    ]

    for (const { key, hub, config } of hubChecks) {
      try {
        const hubJson = execSync(
          `doppler secrets get ${key} --project ${hub} --config ${config} --json`,
          { encoding: 'utf-8', stdio: 'pipe' },
        )
        const hubValue = JSON.parse(hubJson)[key]?.computed || ''

        const spokeJson = execSync(
          `doppler secrets get ${key} --project ${APP_NAME} --config prd --json`,
          { encoding: 'utf-8', stdio: 'pipe' },
        )
        const spokeValue = JSON.parse(spokeJson)[key]?.computed || ''

        if (!spokeValue) {
          console.error(`  ❌ ${key} — not set in ${APP_NAME}/prd`)
          allGood = false
        } else if (spokeValue === hubValue) {
          console.log(`  ✅ ${key} — matches hub (${hub})`)
        } else {
          console.error(
            `  ❌ ${key} — STALE: does not match hub (${hub}). Run sync-template to fix.`,
          )
          allGood = false
        }
      } catch {
        console.warn(`  ⚠️ ${key} — could not verify (hub or spoke unavailable)`)
      }
    }
  }

  // 4. GitHub Secret
  console.log('\nStep 4/6: Validating GitHub Secrets...')

  // Check if gh CLI is available before attempting to list secrets
  let ghAvailable = false
  try {
    execSync('gh --version', { encoding: 'utf-8', stdio: 'pipe' })
    ghAvailable = true
  } catch {
    /* gh not installed */
  }

  if (!ghAvailable) {
    console.log('  ⏭ GitHub CLI (gh) not installed — skipping secret validation.')
    console.log('     Install: https://cli.github.com/ then run `gh auth login`.')
  } else {
    let targetRepoFlag = ''
    try {
      const remotesOutput = execSync('git remote -v', { encoding: 'utf-8', stdio: 'pipe' })
      const remotes = remotesOutput.split('\n').filter(Boolean)
      const targetRemoteLine = remotes.find(
        (line) => !line.includes('narduk-nuxt-template') && line.includes('(push)'),
      )
      if (targetRemoteLine) {
        let url = targetRemoteLine.split(/\s+/)[1]
        url = url
          .replace(/^(https?:\/\/|git@)/, '')
          .replace(/^github\.com[:/]/, '')
          .replace(/\.git$/, '')
        if (url) {
          targetRepoFlag = `--repo "${url}"`
          console.log(`  🎯 Checking secrets for repository: ${url}`)
        }
      }
    } catch {
      // Ignore error
    }

    try {
      const ghOutput = execSync(`gh secret list ${targetRepoFlag}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      if (ghOutput.includes('DOPPLER_TOKEN')) {
        console.log(`  ✅ DOPPLER_TOKEN is set in GitHub repository.`)
      } else {
        console.error('  ❌ DOPPLER_TOKEN is missing from GitHub repository.')
        allGood = false
      }
    } catch (error: any) {
      const stderr = error.stderr || error.message || ''
      if (stderr.includes('not logged') || stderr.includes('auth login')) {
        console.log('  ⏭ GitHub CLI not authenticated — skipping secret validation.')
        console.log('     Run `gh auth login` and re-run validate.')
      } else {
        console.error(`  ❌ Failed to list GitHub secrets: ${stderr}`)
        allGood = false
      }
    }
  }

  // 5. Package.json health (critical deps + script database names)
  console.log('\nStep 5/6: Validating apps/web/package.json...')
  try {
    const webPkgPath = path.join(ROOT_DIR, 'apps', 'web', 'package.json')
    const webPkgContent = await fs.readFile(webPkgPath, 'utf-8')
    const webPkg = JSON.parse(webPkgContent)

    const requiredDeps = ['drizzle-orm', 'zod']
    const requiredDevDeps = ['@cloudflare/workers-types', '@iconify-json/lucide']

    for (const dep of requiredDeps) {
      if (webPkg.dependencies?.[dep]) {
        console.log(`  ✅ ${dep} in dependencies`)
      } else {
        console.error(`  ❌ ${dep} missing from dependencies (typecheck will fail)`)
        allGood = false
      }
    }
    for (const dep of requiredDevDeps) {
      if (webPkg.devDependencies?.[dep]) {
        console.log(`  ✅ ${dep} in devDependencies`)
      } else {
        console.error(`  ❌ ${dep} missing from devDependencies`)
        allGood = false
      }
    }

    // Ensure db:migrate doesn't still reference the template database name
    const migrateScript = webPkg.scripts?.['db:migrate'] || ''
    if (migrateScript.includes('narduk-nuxt-template')) {
      console.error(
        `  ❌ db:migrate script still references 'narduk-nuxt-template' — run setup with --repair`,
      )
      allGood = false
    } else if (migrateScript) {
      console.log('  ✅ db:migrate script references correct database name')
    }
  } catch (e: any) {
    console.error(`  ❌ Failed to read apps/web/package.json: ${e.message}`)
    allGood = false
  }

  console.log('\n--- Validation Result ---')
  if (allGood) {
    console.log('🎉 All infrastructure checks passed successfully! Your project is ready.')
  } else {
    console.error(
      '⚠️ Some checks failed. Please review the errors above and fix the issues, or rerun init.',
    )
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
