import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const VERBATIM_SYNC_FILES = [
  '.githooks/pre-commit',
  'tools/update-layer.ts',
  'tools/sync-template.ts',
  'tools/sync-core.ts',
  'tools/sync-manifest.ts',
  'tools/check-drift-ci.ts',
  'tools/check-sync-health.ts',
  'tools/generate-favicons.ts',
  'tools/init.ts',
  'tools/tail.ts',
  'tools/ship.ts',
  'tools/db-migrate.sh',
  'tools/check-setup.cjs',
  'scripts/dev-kill.sh',
  '.github/workflows/weekly-drift-check.yml',
  'turbo.json',
  'pnpm-workspace.yaml',
  'renovate.json',
  '.github/copilot-instructions.md',
  'apps/web/eslint.config.mjs',
  'prettier.config.mjs',
  '.editorconfig',
  '.vscode/settings.json',
  '.vscode/extensions.json',
] as const

export const RECURSIVE_SYNC_DIRECTORIES = [
  'packages/eslint-config',
  '.agents/workflows',
  'layers/narduk-nuxt-layer',
] as const

export const STALE_SYNC_PATHS = [
  '.github/workflows/publish-layer.yml',
  '.github/workflows/deploy-showcase.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/version-bump.yml',
  '.github/workflows/template-sync-bot.yml',
  '.github/workflows/sync-fleet.yml',
  'tools/check-setup.js',
  '.env',
  '.env.local',
  '.env.example',
] as const

export const GENERATED_SYNC_FILES = ['.github/workflows/ci.yml'] as const

export const FLEET_ROOT_SCRIPT_PATCHES: Readonly<Record<string, string>> = {
  postinstall:
    "node -e \"if(!require('fs').existsSync('.setup-complete'))console.log('\\n⚠️  Run pnpm run setup before doing anything else! See AGENTS.md.\\n')\"",
  'build:plugins': 'pnpm --filter @narduk/eslint-config build',
  prelint: 'pnpm run build:plugins',
  predev: 'node tools/check-setup.cjs',
  prebuild: 'node tools/check-setup.cjs',
  predeploy: 'node tools/check-setup.cjs',
  preship:
    'node tools/check-setup.cjs && pnpm install --frozen-lockfile && npx tsx tools/check-drift-ci.ts && npx tsx tools/check-sync-health.ts && pnpm run quality',
  ship: 'npx tsx tools/ship.ts',
  'sync-template': 'npx tsx tools/sync-template.ts .',
  'update-layer': 'npx tsx tools/update-layer.ts',
  'check:sync-health': 'npx tsx tools/check-sync-health.ts',
  clean:
    "find . -type d \\( -name node_modules -o -name .nuxt -o -name .output -o -name .nitro -o -name .wrangler -o -name .turbo -o -name .data -o -name dist \\) -not -path './.git/*' -prune -exec rm -rf {} +",
  'clean:install': 'pnpm run clean && pnpm install && pnpm run db:ready:all',
  'dev:kill': 'sh scripts/dev-kill.sh',
  'generate:favicons': 'npx tsx tools/generate-favicons.ts',
  tail: 'npx tsx tools/tail.ts',
  quality: "turbo run quality --filter='./apps/*'",
  'quality:fix': 'turbo run lint --force -- --fix && pnpm run format',
  format:
    'prettier --write "**/*.{ts,mts,vue,js,mjs,json,yaml,yml,css,md}" --ignore-path .gitignore',
  'format:check':
    'prettier --check "**/*.{ts,mts,vue,js,mjs,json,yaml,yml,css,md}" --ignore-path .gitignore',
}

export const FLEET_WEB_SCRIPT_PATCHES: Readonly<Record<string, string>> = {
  lint: 'eslint . --max-warnings 0',
  quality: "echo 'Turbo dependsOn handles lint + typecheck + format:check'",
}

const TRANSIENT_DIRECTORY_PATTERN =
  /(^|\/)(node_modules|dist|\.turbo|\.nuxt|\.output|\.nitro|\.wrangler|\.data)(\/|$)/

export function getCanonicalCiContent(): string {
  return `name: CI

on:
  workflow_dispatch:

concurrency:
  group: ci-\${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

# CI is disabled (workflow_dispatch only) to conserve GitHub Actions minutes.
# Deploy is done locally via \`pnpm run deploy\` (wrangler deploy).
# See .agents/workflows/deploy.md for the local deploy workflow.

jobs:
  quality:
    uses: narduk-enterprises/narduk-nuxt-template/.github/workflows/reusable-quality.yml@main
    secrets:
      DOPPLER_TOKEN: \${{ secrets.DOPPLER_TOKEN }}
      GH_PACKAGES_TOKEN: \${{ secrets.GH_PACKAGES_TOKEN }}
`
}

function shouldIgnoreEntry(fullPath: string): boolean {
  return TRANSIENT_DIRECTORY_PATTERN.test(fullPath)
}

function collectFilesUnderDirectory(rootDir: string, relativeDir: string): string[] {
  const start = join(rootDir, relativeDir)
  if (!existsSync(start)) return []

  const files: string[] = []

  const visit = (fullPath: string, relativePath: string) => {
    if (shouldIgnoreEntry(fullPath)) return

    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(fullPath)) {
        const entryFullPath = join(fullPath, entry)
        const entryRelativePath = join(relativePath, entry)
        visit(entryFullPath, entryRelativePath)
      }
      return
    }

    files.push(relativePath)
  }

  visit(start, relativeDir)
  return files
}

export function collectManagedTemplateFiles(templateRoot: string): string[] {
  const tracked = new Set<string>()

  for (const file of VERBATIM_SYNC_FILES) {
    if (existsSync(join(templateRoot, file))) {
      tracked.add(file)
    }
  }

  for (const directory of RECURSIVE_SYNC_DIRECTORIES) {
    for (const file of collectFilesUnderDirectory(templateRoot, directory)) {
      tracked.add(file)
    }
  }

  tracked.add('.github/workflows/ci.yml')

  return [...tracked].sort()
}

export function normalizeManagedContent(relativePath: string, content: string): string {
  if (relativePath !== 'layers/narduk-nuxt-layer/package.json') {
    return content
  }

  try {
    const parsed = JSON.parse(content) as Record<string, any>
    if (parsed.repository) {
      parsed.repository = {
        ...parsed.repository,
        url: '__APP_ORIGIN__',
      }
    }

    return JSON.stringify(parsed, null, 2) + '\n'
  } catch {
    return content
  }
}
