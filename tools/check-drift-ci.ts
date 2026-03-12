import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GENERATED_SYNC_FILES,
  RECURSIVE_SYNC_DIRECTORIES,
  STALE_SYNC_PATHS,
  VERBATIM_SYNC_FILES,
  getCanonicalCiContent,
  normalizeManagedContent,
} from './sync-manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const TEMPLATE_URL = 'https://github.com/narduk-enterprises/narduk-nuxt-template.git'

const strict = process.argv.includes('--strict')

function run(command: string): string {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

function isTemplateRepo(): boolean {
  const url = run('git config --get remote.origin.url')
  return url.includes('narduk-enterprises/narduk-nuxt-template')
}

function getTemplateRef(): string {
  const versionPath = join(ROOT_DIR, '.template-version')
  if (!existsSync(versionPath)) return 'template/main'

  const content = readFileSync(versionPath, 'utf-8')
  const match = content.match(/^sha=(.+)$/m)
  return match?.[1] || 'template/main'
}

function getFileAtRef(ref: string, relativePath: string): string | null {
  try {
    return execSync(`git show ${ref}:${relativePath}`, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } catch {
    return null
  }
}

function listFilesAtRef(ref: string, directory: string): string[] {
  try {
    return execSync(`git ls-tree -r --name-only ${ref} ${directory}`, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function getLocalFile(relativePath: string): string | null {
  const absolutePath = join(ROOT_DIR, relativePath)
  if (!existsSync(absolutePath)) return null
  return readFileSync(absolutePath, 'utf-8')
}

function buildTrackedFiles(ref: string): string[] {
  const tracked = new Set<string>()

  for (const file of VERBATIM_SYNC_FILES) {
    if (getFileAtRef(ref, file) !== null) {
      tracked.add(file)
    }
  }

  for (const directory of RECURSIVE_SYNC_DIRECTORIES) {
    for (const file of listFilesAtRef(ref, directory)) {
      tracked.add(file)
    }
  }

  for (const generatedFile of GENERATED_SYNC_FILES) {
    tracked.add(generatedFile)
  }

  return [...tracked].sort()
}

function getGeneratedFileContent(relativePath: string): string | null {
  if (relativePath === '.github/workflows/ci.yml') {
    return getCanonicalCiContent()
  }

  return null
}

async function main() {
  if (isTemplateRepo()) {
    console.log('This is the template repository itself — drift check not applicable.')
    process.exit(0)
  }

  const remotes = run('git remote -v')
  if (!remotes.includes('template')) {
    run(`git remote add template ${TEMPLATE_URL}`)
  }
  run('git fetch template main --depth=1')

  const ref = getTemplateRef()
  const trackedFiles = buildTrackedFiles(ref)
  const matched: string[] = []
  const drifted: string[] = []
  const missing: string[] = []

  console.log('\nTemplate Drift Check')
  console.log('════════════════════════════════════════════════════')
  console.log(`  Comparing against: ${ref}`)
  console.log('')

  for (const relativePath of trackedFiles) {
    const templateContent = getGeneratedFileContent(relativePath) ?? getFileAtRef(ref, relativePath)
    if (templateContent === null) continue

    const localContent = getLocalFile(relativePath)
    if (localContent === null) {
      missing.push(relativePath)
      continue
    }

    if (
      normalizeManagedContent(relativePath, localContent) !==
      normalizeManagedContent(relativePath, templateContent)
    ) {
      drifted.push(relativePath)
      continue
    }

    matched.push(relativePath)
  }

  const stale = STALE_SYNC_PATHS.filter((relativePath) => existsSync(join(ROOT_DIR, relativePath)))

  if (matched.length > 0) {
    console.log(` ✅ Up to date (${matched.length}):`)
    for (const file of matched) console.log(`    ${file}`)
    console.log('')
  }

  if (drifted.length > 0) {
    console.log(` ❌ DRIFTED (${drifted.length}):`)
    for (const file of drifted) console.log(`    ${file}`)
    console.log('')
    console.log('  Fix: run local-first sync from your template checkout:')
    console.log(`       pnpm sync-template ${ROOT_DIR}`)
    console.log('       or run `pnpm sync:fleet` from the template repo.')
    console.log('')
  }

  if (missing.length > 0) {
    console.log(` ⚠️  MISSING (${missing.length}):`)
    for (const file of missing) console.log(`    ${file}`)
    console.log('')
  }

  if (stale.length > 0) {
    console.log(` 🗑  STALE (${stale.length}):`)
    for (const file of stale) console.log(`    ${file}`)
    console.log('')
  }

  console.log('════════════════════════════════════════════════════')
  console.log(` Score: ${matched.length}/${trackedFiles.length} files match template`)

  if (drifted.length === 0 && missing.length === 0 && stale.length === 0) {
    console.log(' ✅ All infrastructure files are in sync!')
    process.exit(0)
  }

  console.log(` ❌ ${drifted.length} drifted, ${missing.length} missing, ${stale.length} stale`)
  if (strict) {
    console.log('\n  --strict mode: failing CI.')
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
