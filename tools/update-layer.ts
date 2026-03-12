import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAppSync } from './sync-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')

function resolveTemplateDir(args: string[]): string {
  const fromIndex = args.indexOf('--from')
  const fromValue =
    fromIndex !== -1 ? args[fromIndex + 1]?.replace(/^~/, process.env.HOME || '') : undefined

  if (fromValue) {
    return resolve(fromValue)
  }

  try {
    const originUrl = execSync('git remote get-url origin', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    if (originUrl.includes('narduk-enterprises/narduk-nuxt-template')) {
      return ROOT_DIR
    }
  } catch {
    /* fall through */
  }

  try {
    const rootPackage = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8')) as {
      name?: string
    }
    if (rootPackage.name === 'narduk-nuxt-template') {
      return ROOT_DIR
    }
  } catch {
    /* fall through */
  }

  const defaultTemplateDir = join(process.env.HOME || '', 'new-code', 'narduk-nuxt-template')
  if (existsSync(defaultTemplateDir)) {
    return defaultTemplateDir
  }

  return defaultTemplateDir
}

const args = process.argv.slice(2)
const templateDir = resolveTemplateDir(args)

if (!existsSync(join(templateDir, 'layers/narduk-nuxt-layer'))) {
  console.error('Local-first layer sync requires a template checkout.')
  console.error('Pass --from /path/to/narduk-nuxt-template to select the source template.')
  process.exit(1)
}

runAppSync({
  appDir: ROOT_DIR,
  templateDir,
  mode: 'layer',
  dryRun: args.includes('--dry-run'),
  skipQuality: args.includes('--skip-quality'),
  allowDirtyTemplate: args.includes('--allow-dirty-template'),
  skipRewriteRepo: args.includes('--no-rewrite-repo'),
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
