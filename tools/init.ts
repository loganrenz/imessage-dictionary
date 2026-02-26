import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * INIT.TS — Nuxt v4 Template Initialization Script
 * ----------------------------------------------------
 * Automates the transformation of a fresh `nuxt-v4-template` clone into a ready-to-deploy app.
 * 
 * Usage:
 * npm run init -- --name="my-app" --display="My App Name" --url="https://myapp.com"
 * 
 * What this does:
 * 1. Safely finds and replaces all boilerplate strings (app names, URLs) in the codebase.
 * 2. Runs `npx wrangler d1 create <app-name>-db` to provision the Cloudflare database.
 * 3. Rewrites `wrangler.json` with the newly provisioned D1 database ID.
 * 4. Demolishes the boilerplate README and creates a fresh, app-specific README.
 * 5. Removes this script itself to prevent accidental re-runs.
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
  console.error('Please provide: --name, --display, and --url')
  process.exit(1)
}

const APP_NAME = args.name as string
const DISPLAY_NAME = args.display as string
const SITE_URL = (args.url as string).replace(/\/$/, '') // strip trailing slash

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

// --- execution ---

async function main() {
  console.log(`\n🚀 Initializing: ${DISPLAY_NAME} (${APP_NAME})`)
  
  // 1. Recursive String Replacement
  console.log('\nStep 1/4: Replacing boilerplate strings...')
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

  // 2. Database Provisioning
  console.log('\nStep 2/4: Provisioning D1 Database...')
  const dbName = `${APP_NAME}-db`
  console.log(`  Running: npx wrangler d1 create ${dbName}`)
  
  let d1Output = ''
  try {
    d1Output = execSync(`npx wrangler d1 create ${dbName}`, { encoding: 'utf-8', stdio: 'pipe' })
    console.log(`  ✅ Database created: ${dbName}`)
  } catch (error: any) {
    const stderr = error.stderr || ''
    if (stderr.includes('already exists')) {
      console.log(`  ⚠️ Database ${dbName} already exists.`)
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
  console.log('\nStep 3/4: Linking Database to wrangler.json...')
  const idMatch = d1Output.match(/database_id[=:]\s*"?([a-fA-F0-9-]+)"?/)
  
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
  console.log('\nStep 4/4: Resetting README.md...')
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

  // 5. Doppler Registration
  console.log('\\nStep 5/5: Provisioning Doppler Project...')
  console.log(`  Running: doppler projects create ${APP_NAME}`)
  try {
    execSync(`doppler projects create ${APP_NAME} --description "${DISPLAY_NAME} auto-provisioned"`, { encoding: 'utf-8', stdio: 'pipe' })
    console.log(`  ✅ Doppler project created: ${APP_NAME}`)
  } catch (error: any) {
    const stderr = error.stderr || ''
    if (stderr.includes('already exists')) {
      console.log(`  ⚠️ Doppler project ${APP_NAME} already exists.`)
    } else {
      console.error(`  ❌ Doppler creation failed: ${stderr || error.message}`)
      console.error('  Are you logged into Doppler? (doppler login)')
      process.exit(1)
    }
  }

  // 6. Cleanup
  console.log('\\n🧹 Self-Destruct Sequence...')
  // Remove this script
  await fs.unlink(path.join(ROOT_DIR, 'tools', 'init.ts'))
  // Attempt to remove tools directory if empty
  try {
    const remainingTools = await fs.readdir(path.join(ROOT_DIR, 'tools'))
    if (remainingTools.length === 0) {
      await fs.rmdir(path.join(ROOT_DIR, 'tools'))
    }
  } catch (_e) {
    // ignore
  }

  // Remove the initialize command from package.json
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json')
    const pkgStr = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgStr)
    if (pkg.scripts && pkg.scripts.init) {
      delete pkg.scripts.init
      await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    }
  } catch (_e) {
    // ignore
  }

  console.log(`  ✅ Removed initialization script and command.`)


  console.log('\\n🎉 Project initialization complete!')
  console.log('\\nNext steps:')
  console.log(`  1. Setup Doppler secrets (review AGENTS.md format)`)
  console.log(`  2. doppler setup && npm run db:migrate`)
  console.log(`  3. git add . && git commit -m "chore: initialize project"`)
  console.log()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
