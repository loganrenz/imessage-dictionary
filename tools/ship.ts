import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function run(cmd: string, cwd = process.cwd()) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd })
}

function runQuiet(cmd: string, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch (e) {
    return ''
  }
}

async function shipApp(appTarget: string) {
  // Find target directory
  let appDir = resolve(process.cwd(), 'apps', appTarget)
  if (!existsSync(appDir)) {
    appDir = resolve(process.cwd(), 'packages', appTarget)
    if (!existsSync(appDir)) {
      console.error(`❌ Target directory for ${appTarget} does not exist in apps/ or packages/`)
      process.exit(1)
    }
  }

  const pkgPath = resolve(appDir, 'package.json')
  let hasMigrate = false
  let pkg
  if (existsSync(pkgPath)) {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (pkg.scripts && pkg.scripts['db:migrate']) {
      hasMigrate = true
    }
  }

  // 1. Build Verification
  console.log(`\n🏗️ Building ${appTarget}...`)
  try {
    run(`doppler run -- pnpm --filter ${appTarget} run build`, appDir)
  } catch (error) {
    console.error(`\n❌ Build failed for ${appTarget}. Aborting ship to prevent broken commit.`)
    process.exit(1)
  }

  // 2. Git operations
  console.log(`\n📦 Checking git status...`)
  run('git add -A')

  let hasChanges = false
  try {
    execSync('git diff --cached --quiet')
  } catch (e) {
    hasChanges = true
  }

  if (hasChanges) {
    const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    run(`git commit -m "chore: ship ${date}"`)
  } else {
    console.log('No changes to commit.')
  }

  console.log(`\n🔄 Fetching remote...`)
  run('git fetch')
  try {
    execSync('git merge-base --is-ancestor @{u} HEAD')
  } catch (e) {
    console.error(
      '\n❌ Remote has changes not in local branch. Run: git pull --rebase && pnpm ship\n',
    )
    process.exit(1)
  }

  console.log(`\n🚀 Pushing to remote...`)
  run('git push')

  // 3. Remote Migrations
  if (hasMigrate && pkg) {
    console.log(`\n🗄️ Running remote D1 migrations for ${appTarget}...`)
    const migrateCmd = pkg.scripts['db:migrate'].replaceAll('--local', '--remote')
    const escaped = migrateCmd.replace(/\$/g, '\\$').replace(/"/g, '\\"')
    run(`doppler run -- bash -c "${escaped}"`, appDir)
  }

  // 4. Deploy
  console.log(`\n☁️ Deploying ${appTarget} to Edge...`)
  try {
    run(`doppler run -- pnpm --filter ${appTarget} run deploy`)
  } catch (error) {
    console.error(`\n❌ Deploy failed for ${appTarget}.`)
    process.exit(1)
  }

  // 5. Fleet Registry Sync
  console.log(`\n📡 Syncing with Control Plane Fleet Registry...`)
  try {
    const controlPlaneUrl =
      process.env.CONTROL_PLANE_URL ||
      runQuiet('doppler secrets get CONTROL_PLANE_URL --plain', appDir)
    const siteUrl = process.env.SITE_URL || runQuiet('doppler secrets get SITE_URL --plain', appDir)
    const appName =
      process.env.APP_NAME || runQuiet('doppler secrets get APP_NAME --plain', appDir) || appTarget

    if (controlPlaneUrl && siteUrl) {
      const curlCmd = `curl -s -X PUT "${controlPlaneUrl}/api/fleet/apps/${appName}" -H "Content-Type: application/json" -d '{"url": "${siteUrl}", "isActive": true}'`
      execSync(curlCmd, { stdio: 'ignore' })
      console.log(`✅ Fleet registry synced for ${appName}.`)
    } else {
      console.log(`⏭ CONTROL_PLANE_URL or SITE_URL not set — skipping fleet sync.`)
    }
  } catch (e) {
    console.log(`⚠️ Fleet sync failed (non-fatal).`)
  }

  console.log(`\n🎉 Successfully shipped ${appTarget}!`)
}

async function main() {
  const args = process.argv.slice(2)
  const targetArg = args[0] || 'web' // default to web target

  let targets = [targetArg]

  if (targetArg === 'showcase') {
    // Expand showcase macro
    targets = [
      'showcase',
      'example-auth',
      'example-blog',
      'example-marketing',
      'example-og-image',
      'example-apple-maps',
    ]
  } else if (targetArg.includes(',')) {
    targets = targetArg.split(',').map((t) => t.trim())
  }

  for (const target of targets) {
    console.log(`\n======================================================`)
    console.log(`🚀 INITIATING SHIP SEQUENCE FOR: ${target}`)
    console.log(`======================================================\n`)
    await shipApp(target)
  }
}

main()
