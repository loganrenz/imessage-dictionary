#!/usr/bin/env npx tsx

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface CheckResult {
  status: 'pass' | 'fail' | 'warn'
  summary: string
  detail?: string
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  pnpm?: {
    overrides?: Record<string, string>
  }
  overrides?: Record<string, string>
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith('--root='))
  ?.slice('--root='.length)
const ROOT_DIR = rootArg ? rootArg : join(__dirname, '..')
const ROOT_PACKAGE_PATH = join(ROOT_DIR, 'package.json')
const LAYER_PACKAGE_PATH = join(ROOT_DIR, 'layers', 'narduk-nuxt-layer', 'package.json')
const APP_NUXT_CONFIG_PATH = join(ROOT_DIR, 'apps', 'web', 'nuxt.config.ts')
const PUBLIC_DIR = join(ROOT_DIR, 'apps', 'web', 'public')
const INSTALLED_NUXT_OG_IMAGE = join(ROOT_DIR, 'node_modules', 'nuxt-og-image', 'package.json')

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function parseVersionParts(input: string | null | undefined): [number, number, number] | null {
  if (!input) return null
  const match = input.match(/(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return [
    Number.parseInt(match[1] ?? '0', 10),
    Number.parseInt(match[2] ?? '0', 10),
    Number.parseInt(match[3] ?? '0', 10),
  ]
}

function isOlderVersion(
  actual: string | null | undefined,
  minimum: string | null | undefined,
): boolean {
  const left = parseVersionParts(actual)
  const right = parseVersionParts(minimum)
  if (!left || !right) return false

  for (let index = 0; index < 3; index += 1) {
    if (left[index] < right[index]) return true
    if (left[index] > right[index]) return false
  }

  return false
}

function getDeclaredVersion(pkg: PackageJson, name: string): string | null {
  return pkg.dependencies?.[name] || pkg.devDependencies?.[name] || null
}

function getExpectedNuxtOgImageVersion(pkg: PackageJson): string | null {
  return pkg.pnpm?.overrides?.['nuxt-og-image'] || pkg.overrides?.['nuxt-og-image'] || null
}

function getInstalledPackageVersion(packageJsonPath: string): string | null {
  const pkg = readJson<{ version?: string }>(packageJsonPath)
  return pkg?.version || null
}

function findDsStore(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return []
  const matches: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      matches.push(...findDsStore(full, base))
      continue
    }

    if (entry.name === '.DS_Store') {
      matches.push(full.slice(base.length + 1))
    }
  }

  return matches
}

function run(command: string): string | null {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return null
  }
}

function checkFontsCompatibility(rootPkg: PackageJson, layerPkg: PackageJson | null): CheckResult {
  const declared = getDeclaredVersion(rootPkg, '@nuxt/fonts')
  if (!declared) {
    return {
      status: 'pass',
      summary: 'root package does not pin @nuxt/fonts',
    }
  }

  const layerDeclared =
    layerPkg?.overrides?.['@nuxt/fonts'] ||
    layerPkg?.dependencies?.['@nuxt/fonts'] ||
    layerPkg?.devDependencies?.['@nuxt/fonts'] ||
    '0.13.0'

  if (isOlderVersion(declared, layerDeclared)) {
    return {
      status: 'fail',
      summary: `@nuxt/fonts ${declared} is older than layer baseline ${layerDeclared}`,
      detail: 'Update the root package to match or exceed the layer version.',
    }
  }

  return {
    status: 'pass',
    summary: `@nuxt/fonts ${declared} meets layer baseline ${layerDeclared}`,
  }
}

function checkNuxtOgImageInstall(rootPkg: PackageJson): CheckResult {
  const expected = getExpectedNuxtOgImageVersion(rootPkg)
  if (!expected) {
    return {
      status: 'warn',
      summary: 'no nuxt-og-image override declared',
    }
  }

  if (!existsSync(INSTALLED_NUXT_OG_IMAGE)) {
    return {
      status: 'warn',
      summary: 'nuxt-og-image not installed',
      detail: 'Run `pnpm install --frozen-lockfile` before shipping.',
    }
  }

  const installed = getInstalledPackageVersion(INSTALLED_NUXT_OG_IMAGE)
  if (!installed) {
    return {
      status: 'fail',
      summary: 'unable to read installed nuxt-og-image version',
    }
  }

  if (installed !== expected) {
    return {
      status: 'fail',
      summary: `installed nuxt-og-image ${installed} does not match expected ${expected}`,
      detail:
        'The install state is stale or corrupted. Reinstall dependencies and verify node_modules symlinks.',
    }
  }

  return {
    status: 'pass',
    summary: `installed nuxt-og-image matches expected ${expected}`,
  }
}

function checkOgImageConfig(): CheckResult {
  if (!existsSync(APP_NUXT_CONFIG_PATH)) {
    return {
      status: 'warn',
      summary: 'apps/web/nuxt.config.ts not found',
    }
  }

  const content = readFileSync(APP_NUXT_CONFIG_PATH, 'utf8')
  const hasObsoleteDefaultsComponent =
    /ogImage\s*:\s*\{[\s\S]*?defaults\s*:\s*\{[\s\S]*?component\s*:/m.test(content)

  if (hasObsoleteDefaultsComponent) {
    return {
      status: 'fail',
      summary: 'obsolete ogImage.defaults.component config detected',
      detail:
        'Move OG image component selection to defineOgImage() / useSeo() instead of nuxt.config.ts.',
    }
  }

  return {
    status: 'pass',
    summary: 'ogImage config shape is current',
  }
}

function checkPublicJunk(): CheckResult {
  const junk = findDsStore(PUBLIC_DIR)
  if (junk.length === 0) {
    return {
      status: 'pass',
      summary: 'no .DS_Store files in public assets',
    }
  }

  return {
    status: 'fail',
    summary: `${junk.length} junk asset(s) found`,
    detail: junk.map((file) => `apps/web/public/${file}`).join('\n'),
  }
}

function checkLockfileState(): CheckResult {
  const pnpmWhy = run('pnpm why nuxt-og-image')
  const installed = getInstalledPackageVersion(INSTALLED_NUXT_OG_IMAGE)

  if (!pnpmWhy || !installed) {
    return {
      status: 'warn',
      summary: 'unable to compare pnpm graph to installed nuxt-og-image',
    }
  }

  const match = pnpmWhy.match(/nuxt-og-image\s+([^\s]+)/)
  const resolved = match?.[1] || null
  if (!resolved) {
    return {
      status: 'warn',
      summary: 'unable to parse pnpm why output for nuxt-og-image',
    }
  }

  if (resolved !== installed) {
    return {
      status: 'fail',
      summary: `installed nuxt-og-image ${installed} differs from pnpm graph ${resolved}`,
      detail: 'node_modules is out of sync with the dependency graph.',
    }
  }

  return {
    status: 'pass',
    summary: 'pnpm graph matches installed nuxt-og-image',
  }
}

function main() {
  const rootPkg = readJson<PackageJson>(ROOT_PACKAGE_PATH)
  if (!rootPkg) {
    console.error('Missing package.json')
    process.exit(1)
  }

  const layerPkg = readJson<PackageJson>(LAYER_PACKAGE_PATH)
  const checks: Array<[string, CheckResult]> = [
    ['fonts', checkFontsCompatibility(rootPkg, layerPkg)],
    ['nuxt-og-image install', checkNuxtOgImageInstall(rootPkg)],
    ['pnpm graph', checkLockfileState()],
    ['og-image config', checkOgImageConfig()],
    ['public junk', checkPublicJunk()],
  ]

  console.log('\nSync Health Check')
  console.log('════════════════════════════════════════════════════')

  let failed = 0
  for (const [name, result] of checks) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️ ' : '❌'
    console.log(` ${icon} ${name}: ${result.summary}`)
    if (result.detail) {
      for (const line of result.detail.split('\n')) {
        console.log(`    ${line}`)
      }
    }
    if (result.status === 'fail') failed += 1
  }

  console.log('════════════════════════════════════════════════════')
  if (failed === 0) {
    console.log(' ✅ Sync health is clean.')
    process.exit(0)
  }

  console.log(` ❌ ${failed} sync health check(s) failed`)
  process.exit(1)
}

main()
