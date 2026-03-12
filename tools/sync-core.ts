import { execSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import {
  FLEET_ROOT_SCRIPT_PATCHES,
  FLEET_WEB_SCRIPT_PATCHES,
  GENERATED_SYNC_FILES,
  RECURSIVE_SYNC_DIRECTORIES,
  STALE_SYNC_PATHS,
  VERBATIM_SYNC_FILES,
  getCanonicalCiContent,
} from './sync-manifest'

export interface RunAppSyncOptions {
  appDir: string
  templateDir: string
  mode?: 'full' | 'layer'
  dryRun?: boolean
  strict?: boolean
  skipQuality?: boolean
  allowDirtyTemplate?: boolean
  skipRewriteRepo?: boolean
  log?: (message: string) => void
}

interface SyncCounters {
  copied: number
  skipped: number
  removed: number
}

const DIRECTORY_IGNORE_PATTERN =
  /(^|\/)(node_modules|dist|\.turbo|\.nuxt|\.output|\.nitro|\.wrangler|\.data)(\/|$)/

function createCounters(): SyncCounters {
  return { copied: 0, skipped: 0, removed: 0 }
}

function run(command: string, cwd: string) {
  execSync(command, { cwd, stdio: 'inherit' })
}

function getOutput(command: string, cwd: string): string {
  try {
    return execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return ''
  }
}

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true })
}

function filesIdentical(left: string, right: string): boolean {
  try {
    return readFileSync(left).equals(readFileSync(right))
  } catch {
    return false
  }
}

function syncFile(
  sourcePath: string,
  targetPath: string,
  templateDir: string,
  counters: SyncCounters,
  dryRun: boolean,
  log: (message: string) => void,
) {
  if (!existsSync(sourcePath)) return

  if (existsSync(targetPath) && filesIdentical(sourcePath, targetPath)) {
    counters.skipped += 1
    return
  }

  const action = existsSync(targetPath) ? 'UPDATE' : 'ADD'
  log(`  ${action}: ${relative(templateDir, sourcePath)}`)

  if (!dryRun) {
    ensureDir(targetPath)
    copyFileSync(sourcePath, targetPath)
  }

  counters.copied += 1
}

function syncDirectoryRecursive(
  sourceRoot: string,
  targetRoot: string,
  templateDir: string,
  counters: SyncCounters,
  dryRun: boolean,
  log: (message: string) => void,
) {
  if (!existsSync(sourceRoot) || DIRECTORY_IGNORE_PATTERN.test(sourceRoot)) return

  const stat = statSync(sourceRoot)
  if (stat.isDirectory()) {
    if (!existsSync(targetRoot) && !dryRun) {
      mkdirSync(targetRoot, { recursive: true })
    }

    for (const entry of readdirSync(sourceRoot)) {
      syncDirectoryRecursive(
        join(sourceRoot, entry),
        join(targetRoot, entry),
        templateDir,
        counters,
        dryRun,
        log,
      )
    }
    return
  }

  syncFile(sourceRoot, targetRoot, templateDir, counters, dryRun, log)
}

function writeTextFile(
  targetPath: string,
  content: string,
  counters: SyncCounters,
  dryRun: boolean,
  label: string,
  log: (message: string) => void,
) {
  const existing = existsSync(targetPath) ? readFileSync(targetPath, 'utf-8') : null
  if (existing === content) {
    counters.skipped += 1
    return
  }

  log(`  ${existing === null ? 'ADD' : 'UPDATE'}: ${label}`)
  if (!dryRun) {
    ensureDir(targetPath)
    writeFileSync(targetPath, content, 'utf-8')
  }
  counters.copied += 1
}

function patchJsonFile<T extends object>(
  filePath: string,
  mutate: (value: T) => boolean,
  dryRun: boolean,
): boolean {
  if (!existsSync(filePath)) return false

  const current = JSON.parse(readFileSync(filePath, 'utf-8')) as T
  const changed = mutate(current)
  if (!changed || dryRun) return changed

  writeFileSync(filePath, JSON.stringify(current, null, 2) + '\n', 'utf-8')
  return changed
}

function ensureTemplateState(
  templateDir: string,
  allowDirtyTemplate: boolean,
  dryRun: boolean,
  log: (message: string) => void,
) {
  if (dryRun || allowDirtyTemplate) return

  const status = getOutput('git status --porcelain', templateDir)
  if (status) {
    log('❌ Template repository has uncommitted changes.')
    log('   Commit or stash changes before syncing the fleet.')
    throw new Error('template repository is dirty')
  }
}

function syncManagedFiles(
  templateDir: string,
  appDir: string,
  counters: SyncCounters,
  dryRun: boolean,
  mode: 'full' | 'layer',
  log: (message: string) => void,
) {
  if (mode === 'full') {
    log('Phase 1: Syncing managed template files...')
    for (const file of VERBATIM_SYNC_FILES) {
      syncFile(join(templateDir, file), join(appDir, file), templateDir, counters, dryRun, log)
    }
  } else {
    log('Phase 1: Syncing vendored layer...')
  }

  const directories =
    mode === 'full' ? RECURSIVE_SYNC_DIRECTORIES : (['layers/narduk-nuxt-layer'] as const)
  for (const directory of directories) {
    syncDirectoryRecursive(
      join(templateDir, directory),
      join(appDir, directory),
      templateDir,
      counters,
      dryRun,
      log,
    )
  }

  log(`  ${counters.copied} file(s) updated, ${counters.skipped} already current.`)
}

function syncGeneratedFiles(
  appDir: string,
  counters: SyncCounters,
  dryRun: boolean,
  mode: 'full' | 'layer',
  log: (message: string) => void,
) {
  if (mode !== 'full') return

  log('')
  log('Phase 2: Writing generated sync files...')

  for (const file of GENERATED_SYNC_FILES) {
    if (file === '.github/workflows/ci.yml') {
      writeTextFile(join(appDir, file), getCanonicalCiContent(), counters, dryRun, file, log)
    }
  }
}

function removeStalePaths(
  appDir: string,
  counters: SyncCounters,
  dryRun: boolean,
  mode: 'full' | 'layer',
  log: (message: string) => void,
) {
  if (mode !== 'full') return

  log('')
  log('Phase 3: Removing explicit stale paths...')

  let removedHere = 0
  for (const stalePath of STALE_SYNC_PATHS) {
    const absolutePath = join(appDir, stalePath)
    if (!existsSync(absolutePath)) continue

    log(`  DELETE: ${stalePath}`)
    if (!dryRun) {
      rmSync(absolutePath, { recursive: true, force: true })
    }
    removedHere += 1
  }

  counters.removed += removedHere
  if (removedHere === 0) {
    log('  No stale paths found.')
  }
}

function patchRootPackage(
  appDir: string,
  templateDir: string,
  dryRun: boolean,
  mode: 'full' | 'layer',
  log: (message: string) => void,
): boolean {
  const appPackagePath = join(appDir, 'package.json')
  if (!existsSync(appPackagePath)) return false

  const templatePackage = JSON.parse(readFileSync(join(templateDir, 'package.json'), 'utf-8')) as {
    packageManager?: string
    devDependencies?: Record<string, string>
    pnpm?: {
      overrides?: Record<string, string>
      onlyBuiltDependencies?: string[]
    }
  }

  let touched = false
  patchJsonFile<Record<string, any>>(
    appPackagePath,
    (pkg) => {
      let changed = false

      if (mode === 'full') {
        pkg.scripts = pkg.scripts || {}
        for (const [name, command] of Object.entries(FLEET_ROOT_SCRIPT_PATCHES)) {
          if (pkg.scripts[name] !== command) {
            pkg.scripts[name] = command
            changed = true
          }
        }

        pkg.packageManager = templatePackage.packageManager || pkg.packageManager

        const requiredDevDependencies = ['tsx', 'turbo', 'prettier']
        pkg.devDependencies = pkg.devDependencies || {}
        for (const dependency of requiredDevDependencies) {
          const version = templatePackage.devDependencies?.[dependency]
          if (version && pkg.devDependencies[dependency] !== version) {
            pkg.devDependencies[dependency] = version
            changed = true
          }
        }
      }

      pkg.pnpm = pkg.pnpm || {}
      const templateOverrides = templatePackage.pnpm?.overrides || {}
      const templateOnlyBuiltDependencies = templatePackage.pnpm?.onlyBuiltDependencies || []

      if (JSON.stringify(pkg.pnpm.overrides) !== JSON.stringify(templateOverrides)) {
        pkg.pnpm.overrides = templateOverrides
        changed = true
      }

      if (
        JSON.stringify(pkg.pnpm.onlyBuiltDependencies) !==
        JSON.stringify(templateOnlyBuiltDependencies)
      ) {
        pkg.pnpm.onlyBuiltDependencies = templateOnlyBuiltDependencies
        changed = true
      }

      touched ||= changed
      return changed
    },
    dryRun,
  )

  if (touched) {
    log(`  UPDATE: package.json${mode === 'layer' ? ' pnpm config' : ''}`)
  }

  return touched
}

function patchWebPackage(
  appDir: string,
  templateDir: string,
  dryRun: boolean,
  log: (message: string) => void,
): boolean {
  const webPackagePath = join(appDir, 'apps/web/package.json')
  if (!existsSync(webPackagePath)) return false

  const templateWebPackage = JSON.parse(
    readFileSync(join(templateDir, 'apps/web/package.json'), 'utf-8'),
  ) as {
    dependencies?: Record<string, string>
  }

  let touched = false
  patchJsonFile<Record<string, any>>(
    webPackagePath,
    (pkg) => {
      let changed = false

      pkg.scripts = pkg.scripts || {}
      for (const [name, command] of Object.entries(FLEET_WEB_SCRIPT_PATCHES)) {
        if (pkg.scripts[name] !== command) {
          pkg.scripts[name] = command
          changed = true
        }
      }

      const wranglerPath = join(appDir, 'apps/web/wrangler.json')
      if (existsSync(wranglerPath)) {
        const wrangler = JSON.parse(readFileSync(wranglerPath, 'utf-8')) as {
          d1_databases?: Array<{ database_name?: string }>
        }
        const databaseName = wrangler.d1_databases?.[0]?.database_name
        if (databaseName) {
          const expectedMigrate = `bash ../../tools/db-migrate.sh ${databaseName} --local --dir drizzle`
          const expectedReset = `bash ../../tools/db-migrate.sh ${databaseName} --local --dir drizzle --reset && pnpm run db:seed`
          const expectedReady = 'pnpm run db:migrate && pnpm run db:seed'

          if (pkg.scripts['db:migrate'] !== expectedMigrate) {
            pkg.scripts['db:migrate'] = expectedMigrate
            changed = true
          }

          if (pkg.scripts['db:reset'] !== expectedReset) {
            pkg.scripts['db:reset'] = expectedReset
            changed = true
          }

          if (pkg.scripts['db:ready'] !== expectedReady) {
            pkg.scripts['db:ready'] = expectedReady
            changed = true
          }
        }
      }

      pkg.dependencies = pkg.dependencies || {}
      const templateEslintVersion =
        templateWebPackage.dependencies?.['@narduk-enterprises/eslint-config']
      if (pkg.dependencies['@narduk/eslint-config']) {
        delete pkg.dependencies['@narduk/eslint-config']
        changed = true
      }
      if (
        templateEslintVersion &&
        pkg.dependencies['@narduk-enterprises/eslint-config'] !== templateEslintVersion
      ) {
        pkg.dependencies['@narduk-enterprises/eslint-config'] = templateEslintVersion
        changed = true
      }

      touched ||= changed
      return changed
    },
    dryRun,
  )

  if (touched) {
    log('  UPDATE: apps/web/package.json')
  }

  return touched
}

function patchGitignore(appDir: string, dryRun: boolean, log: (message: string) => void): boolean {
  const gitignorePath = join(appDir, '.gitignore')
  if (!existsSync(gitignorePath)) return false

  let content = readFileSync(gitignorePath, 'utf-8')
  const original = content

  if (!content.includes('.turbo')) {
    content = content.replace(/\.cache\n/, '.cache\n.turbo\n')
  }

  if (content.includes('tools/eslint-plugin-vue-official-best-practices')) {
    content = content.replace(/.*tools\/eslint-plugin-vue-official-best-practices.*\n?/g, '')
  }

  if (content === original) return false

  log('  UPDATE: .gitignore')
  if (!dryRun) {
    writeFileSync(gitignorePath, content, 'utf-8')
  }
  return true
}

function patchNpmrc(appDir: string, dryRun: boolean, log: (message: string) => void): boolean {
  const npmrcPath = join(appDir, '.npmrc')
  const defaultContent = [
    '@narduk-enterprises:registry=https://npm.pkg.github.com',
    '',
    'strict-peer-dependencies=false',
    '',
  ].join('\n')

  if (!existsSync(npmrcPath)) {
    log('  ADD: .npmrc')
    if (!dryRun) {
      writeFileSync(npmrcPath, defaultContent, 'utf-8')
    }
    return true
  }

  let content = readFileSync(npmrcPath, 'utf-8')
  const original = content

  if (!content.includes('@narduk-enterprises:registry=https://npm.pkg.github.com')) {
    content = `@narduk-enterprises:registry=https://npm.pkg.github.com\n${content.trimStart()}`
    if (!content.endsWith('\n')) {
      content += '\n'
    }
  }

  if (content.includes('@loganrenz:registry')) {
    content = content.replace(/@loganrenz:registry/g, '@narduk-enterprises:registry')
  }

  if (content.includes('strict-peer-dependencies=true')) {
    content = content.replace('strict-peer-dependencies=true', 'strict-peer-dependencies=false')
  }

  if (!content.includes('strict-peer-dependencies=false')) {
    if (!content.endsWith('\n')) {
      content += '\n'
    }
    content += 'strict-peer-dependencies=false\n'
  }

  if (content === original) return false

  log('  UPDATE: .npmrc')
  if (!dryRun) {
    writeFileSync(npmrcPath, content, 'utf-8')
  }
  return true
}

function ensureSetupComplete(
  appDir: string,
  dryRun: boolean,
  log: (message: string) => void,
): boolean {
  const sentinelPath = join(appDir, '.setup-complete')
  if (existsSync(sentinelPath)) return false

  log('  ADD: .setup-complete')
  if (!dryRun) {
    writeFileSync(
      sentinelPath,
      `initialized=${new Date().toISOString()}\napp=${relative(dirname(appDir), appDir)}\nsource=sync-template\n`,
      'utf-8',
    )
  }
  return true
}

function ensureDopplerYaml(
  appDir: string,
  dryRun: boolean,
  log: (message: string) => void,
): boolean {
  const dopplerPath = join(appDir, 'doppler.yaml')
  const repoName = appDir.split('/').pop() || 'unknown'
  const expectedContent = `setup:\n  project: ${repoName}\n  config: prd\n`
  const currentContent = existsSync(dopplerPath) ? readFileSync(dopplerPath, 'utf-8') : null

  if (currentContent === expectedContent) return false

  log(`  ${currentContent === null ? 'ADD' : 'UPDATE'}: doppler.yaml`)
  if (!dryRun) {
    writeFileSync(dopplerPath, expectedContent, 'utf-8')
  }
  return true
}

function rewriteLayerRepository(
  appDir: string,
  dryRun: boolean,
  log: (message: string) => void,
): boolean {
  const layerPackagePath = join(appDir, 'layers/narduk-nuxt-layer/package.json')
  if (!existsSync(layerPackagePath)) return false

  const originUrl = getOutput('git remote get-url origin', appDir)
  if (!originUrl) return false

  let touched = false
  patchJsonFile<Record<string, any>>(
    layerPackagePath,
    (pkg) => {
      const nextRepository = {
        ...(pkg.repository || {}),
        type: 'git',
        url: originUrl,
        directory: 'layers/narduk-nuxt-layer',
      }

      if (JSON.stringify(pkg.repository) === JSON.stringify(nextRepository)) {
        return false
      }

      pkg.repository = nextRepository
      touched = true
      return true
    },
    dryRun,
  )

  if (touched) {
    log('  UPDATE: layers/narduk-nuxt-layer/package.json repository')
  }

  return touched
}

function writeTemplateVersion(
  appDir: string,
  templateSha: string,
  dryRun: boolean,
  log: (message: string) => void,
): boolean {
  const versionPath = join(appDir, '.template-version')
  const existing = existsSync(versionPath) ? readFileSync(versionPath, 'utf-8') : null
  const existingSha = existing?.match(/^sha=(.+)$/m)?.[1] || ''
  const existingTemplate = existing?.match(/^template=(.+)$/m)?.[1] || ''
  if (existingSha === templateSha && existingTemplate === 'narduk-nuxt-template') {
    return false
  }

  const content = [
    `sha=${templateSha}`,
    'template=narduk-nuxt-template',
    `synced=${new Date().toISOString()}`,
    '',
  ].join('\n')

  log(`  ${existing === null ? 'ADD' : 'UPDATE'}: .template-version (${templateSha.slice(0, 12)})`)
  if (!dryRun) {
    writeFileSync(versionPath, content, 'utf-8')
  }
  return true
}

function runInstallAndQuality(
  appDir: string,
  dryRun: boolean,
  skipQuality: boolean,
  log: (message: string) => void,
) {
  if (dryRun) {
    log('')
    log('Dry run complete. Skipping install and quality.')
    return
  }

  log('')
  log('Phase 5: Installing dependencies...')
  run('pnpm install --no-frozen-lockfile', appDir)

  if (skipQuality) {
    log('')
    log('Skipping quality gate (--skip-quality).')
    return
  }

  log('')
  log('Phase 6: Running quality gate...')
  run('pnpm run quality', appDir)
}

export async function runAppSync(options: RunAppSyncOptions) {
  const mode = options.mode ?? 'full'
  const dryRun = options.dryRun ?? false
  const skipQuality = options.skipQuality ?? false
  const strict = options.strict ?? false
  const allowDirtyTemplate = options.allowDirtyTemplate ?? false
  const skipRewriteRepo = options.skipRewriteRepo ?? false
  const log = options.log ?? console.log
  const counters = createCounters()

  ensureTemplateState(options.templateDir, allowDirtyTemplate, dryRun, log)
  const templateSha = getOutput('git rev-parse HEAD', options.templateDir)

  log('')
  log(
    `${mode === 'full' ? 'Template Sync' : 'Layer Sync'}: ${options.appDir}${dryRun ? ' [DRY RUN]' : ''}`,
  )
  log('═══════════════════════════════════════════════════════════════')
  log(`  App:      ${options.appDir}`)
  log(`  Template: ${options.templateDir}`)
  if (templateSha) {
    log(`  SHA:      ${templateSha.slice(0, 12)}`)
  }
  log('')

  syncManagedFiles(options.templateDir, options.appDir, counters, dryRun, mode, log)
  syncGeneratedFiles(options.appDir, counters, dryRun, mode, log)
  removeStalePaths(options.appDir, counters, dryRun, mode, log)

  log('')
  log(
    `Phase 4: Applying ${mode === 'full' ? 'package and repo' : 'layer compatibility'} patches...`,
  )

  const packageTouched = patchRootPackage(options.appDir, options.templateDir, dryRun, mode, log)
  if (mode === 'full') {
    patchWebPackage(options.appDir, options.templateDir, dryRun, log)
    patchGitignore(options.appDir, dryRun, log)
    patchNpmrc(options.appDir, dryRun, log)
    ensureSetupComplete(options.appDir, dryRun, log)
    ensureDopplerYaml(options.appDir, dryRun, log)
    if (templateSha) {
      writeTemplateVersion(options.appDir, templateSha, dryRun, log)
    }
  }

  if (!skipRewriteRepo) {
    rewriteLayerRepository(options.appDir, dryRun, log)
  }

  if (!packageTouched && mode === 'layer') {
    log('  Root pnpm config already current.')
  }

  runInstallAndQuality(options.appDir, dryRun, skipQuality, log)

  if (!dryRun && strict && mode === 'full') {
    log('')
    log('Phase 7: Verifying drift state...')
    run('npx tsx tools/check-drift-ci.ts --strict', options.appDir)
  }

  log('')
  log('═══════════════════════════════════════════════════════════════')
  if (dryRun) {
    log(' DRY RUN — no files were modified.')
    log(' Re-run without --dry-run to apply changes.')
  } else {
    log(' Sync complete.')
    log('')
    log(' Next steps:')
    log(`   cd ${options.appDir}`)
    log('   git status')
    log('   git diff')
    log('   git add -A && git commit -m "chore: sync with template"')
  }
}
