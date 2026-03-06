/**
 * CI-Friendly Template Drift Detection
 *
 * Compares critical infrastructure files against the canonical narduk-nuxt-template.
 * Works in CI by fetching the template via git (no local template directory needed).
 *
 * Usage:
 *   npx tsx tools/check-drift-ci.ts              # compare against latest template main
 *   npx tsx tools/check-drift-ci.ts --strict      # exit 1 on any drift (for CI gates)
 *
 * Reads `.template-version` if present to compare against the exact SHA the app
 * was last synced to. Falls back to `template/main` (latest).
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const TEMPLATE_URL = 'https://github.com/narduk-enterprises/narduk-nuxt-template.git'

const args = process.argv.slice(2)
const strict = args.includes('--strict')

const CRITICAL_FILES = [
  // Tooling
  'tools/update-layer.ts',
  'tools/check-drift-ci.ts',
  'tools/check-sync-health.ts',
  'tools/generate-favicons.ts',
  'tools/check-setup.cjs',
  'tools/validate.ts',
  'tools/init.ts',
  'tools/tail.ts',

  // CI/CD
  '.github/workflows/weekly-drift-check.yml',

  // Build orchestration
  'turbo.json',

  // Renovate
  'renovate.json',

  // Copilot/agent infra
  '.github/copilot-instructions.md',

  // ESLint
  'apps/web/eslint.config.mjs',
  'packages/eslint-config/eslint.config.mjs',
  'packages/eslint-config/package.json',
  'packages/eslint-config/eslint-plugins/index.mjs',

  // Formatting
  'prettier.config.mjs',
  '.editorconfig',
  '.vscode/settings.json',
  '.vscode/extensions.json',
]

const STALE_FILES = [
  '.github/workflows/publish-layer.yml',
  '.github/workflows/deploy-showcase.yml',
  '.github/workflows/deploy.yml',
  '.env',
  '.env.example',
  '.env.local',
]

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR }).trim()
  } catch {
    return ''
  }
}

function isTemplateRepo(): boolean {
  try {
    const url = execSync('git config --get remote.origin.url', {
      encoding: 'utf-8',
      cwd: ROOT_DIR,
    }).trim()
    return url.includes('narduk-enterprises/narduk-nuxt-template')
  } catch {
    return false
  }
}

function getTemplateRef(): string {
  const versionFile = join(ROOT_DIR, '.template-version')
  if (existsSync(versionFile)) {
    const content = readFileSync(versionFile, 'utf-8')
    const shaMatch = content.match(/^sha=(.+)$/m)
    if (shaMatch?.[1]) return shaMatch[1]
  }
  return 'template/main'
}

function getFileAtRef(ref: string, filePath: string): string | null {
  try {
    return execSync(`git show ${ref}:${filePath}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: ROOT_DIR,
    })
  } catch {
    return null
  }
}

function getLocalFile(filePath: string): string | null {
  const full = join(ROOT_DIR, filePath)
  if (!existsSync(full)) return null
  return readFileSync(full, 'utf-8')
}

async function main() {
  if (isTemplateRepo()) {
    console.log('This is the template repository itself — drift check not applicable.')
    process.exit(0)
  }

  // Ensure template remote exists and is fetched
  const remotes = run('git remote -v')
  if (!remotes.includes('template')) {
    console.log('Adding template remote...')
    run(`git remote add template ${TEMPLATE_URL}`)
  }
  run('git fetch template main --depth=1')

  const ref = getTemplateRef()
  console.log(`\nTemplate Drift Check`)
  console.log(`════════════════════════════════════════════════════`)
  console.log(`  Comparing against: ${ref}`)
  console.log()

  const matched: string[] = []
  const drifted: string[] = []
  const missing: string[] = []

  for (const file of CRITICAL_FILES) {
    const templateContent = getFileAtRef(ref, file)
    if (!templateContent) continue

    const localContent = getLocalFile(file)
    if (!localContent) {
      missing.push(file)
    } else if (localContent !== templateContent) {
      drifted.push(file)
    } else {
      matched.push(file)
    }
  }

  const stale: string[] = []
  for (const file of STALE_FILES) {
    if (existsSync(join(ROOT_DIR, file))) {
      stale.push(file)
    }
  }

  // Report
  if (matched.length > 0) {
    console.log(` ✅ Up to date (${matched.length}):`)
    for (const f of matched) console.log(`    ${f}`)
    console.log()
  }

  if (drifted.length > 0) {
    console.log(` ❌ DRIFTED (${drifted.length}):`)
    for (const f of drifted) console.log(`    ${f}`)
    console.log()
    console.log('  Fix: run `pnpm run update-layer` and copy updated infra files.')
    console.log()
  }

  if (missing.length > 0) {
    console.log(` ⚠️  MISSING (${missing.length}):`)
    for (const f of missing) console.log(`    ${f}`)
    console.log()
  }

  if (stale.length > 0) {
    console.log(` 🗑  STALE (${stale.length}):`)
    for (const f of stale) console.log(`    ${f}`)
    console.log()
  }

  // Summary
  const total = CRITICAL_FILES.length
  console.log(`════════════════════════════════════════════════════`)
  console.log(` Score: ${matched.length}/${total} files match template`)

  if (drifted.length === 0 && missing.length === 0 && stale.length === 0) {
    console.log(' ✅ All infrastructure files are in sync!')
    process.exit(0)
  } else {
    console.log(` ❌ ${drifted.length} drifted, ${missing.length} missing, ${stale.length} stale`)
    if (strict) {
      console.log('\n  --strict mode: failing CI.')
      process.exit(1)
    }
  }
}

main().catch((e) => {
  console.error('Drift check failed:', e.message)
  process.exit(1)
})
