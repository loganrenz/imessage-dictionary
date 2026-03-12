import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAppSync } from './sync-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = join(__dirname, '..')

const args = process.argv.slice(2).filter((argument) => !argument.startsWith('--'))
const flags = new Set(process.argv.slice(2).filter((argument) => argument.startsWith('--')))

const appDir = args[0]?.replace(/^~/, process.env.HOME || '')

if (!appDir) {
  console.error(
    'Usage: npx tsx tools/sync-template.ts <app-directory> [--dry-run] [--strict] [--skip-quality] [--allow-dirty-template]',
  )
  process.exit(1)
}

const resolvedAppDir = resolve(appDir)
if (!existsSync(resolvedAppDir)) {
  console.error(`App directory not found: ${resolvedAppDir}`)
  process.exit(1)
}

runAppSync({
  appDir: resolvedAppDir,
  templateDir: TEMPLATE_DIR,
  mode: 'full',
  dryRun: flags.has('--dry-run'),
  strict: flags.has('--strict'),
  skipQuality: flags.has('--skip-quality'),
  allowDirtyTemplate: flags.has('--allow-dirty-template'),
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
