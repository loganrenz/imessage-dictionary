import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * UPDATE-LAYER.TS
 * ----------------------------------------------------------------
 * Pulls the latest layers/narduk-nuxt-layer from the template repository.
 *
 * Usage:
 *   pnpm run update-layer                                  # fetch from GitHub
 *   pnpm run update-layer -- --dry-run                     # show what would change
 *   pnpm run update-layer -- --from ~/new-code/narduk-nuxt-template  # use local template
 *
 * Options:
 *   --dry-run            Show diff without applying changes
 *   --no-rewrite-repo    Skip rewriting layers/narduk-nuxt-layer/package.json's repository.url
 *   --skip-quality       Skip the quality gate (lint + typecheck). Useful for fleet batch syncs.
 *   --from <path>        Use a local template directory instead of fetching from GitHub.
 *                         Sets the git remote to a local path so no push is required.
 */

const args = process.argv.slice(2)
const skipRewrite = args.includes('--no-rewrite-repo')
const skipQuality = args.includes('--skip-quality')
const dryRun = args.includes('--dry-run')
const fromIdx = args.indexOf('--from')
const localTemplatePath =
  fromIdx !== -1 ? args[fromIdx + 1]?.replace(/^~/, process.env.HOME || '') : ''

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const LAYER_PKG_PATH = path.join(ROOT_DIR, 'layers', 'narduk-nuxt-layer', 'package.json')

const GITHUB_TEMPLATE_URL = 'https://github.com/narduk-enterprises/narduk-nuxt-template.git'

function run(cmd: string) {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: ROOT_DIR })
}

function getOutput(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR }).trim()
  } catch {
    return ''
  }
}

async function main() {
  const templateUrl = localTemplatePath || GITHUB_TEMPLATE_URL
  const isLocal = !!localTemplatePath

  if (isLocal) {
    console.log(`🔄 Updating Layer from local template: ${localTemplatePath}`)
  } else {
    console.log('🔄 Updating Layer from Template (GitHub)...')
  }

  // 1. Check/Add remote
  const remotes = getOutput('git remote -v')
  const hasCorrectRemote = remotes
    .split('\n')
    .some((line) => line.startsWith('template\t') && line.includes(templateUrl))

  if (!hasCorrectRemote) {
    if (remotes.includes('template\t')) {
      console.log(`  Updating "template" remote URL to ${isLocal ? 'local path' : 'GitHub'}...`)
      run(`git remote set-url template ${templateUrl}`)
    } else {
      console.log(`  Adding "template" remote (${isLocal ? 'local' : 'GitHub'})...`)
      run(`git remote add template ${templateUrl}`)
    }
  }

  // 2. Fetch main from template
  console.log('\n📥 Fetching latest layer code...')
  run('git fetch template main')

  // 2.5. Dry-run: show diff and exit without modifying anything
  if (dryRun) {
    console.log('\n📋 Dry-run mode — showing what would change:\n')
    const currentSha = getOutput(
      'git rev-parse HEAD:layers/narduk-nuxt-layer 2>/dev/null || echo none',
    )
    const templateSha = getOutput('git rev-parse template/main')
    const templateLayerSha = getOutput(
      'git rev-parse template/main:layers/narduk-nuxt-layer 2>/dev/null || echo none',
    )

    console.log(`  Current layer tree:  ${currentSha.slice(0, 12)}`)
    console.log(`  Template layer tree: ${templateLayerSha.slice(0, 12)}`)
    console.log(`  Template HEAD:       ${templateSha.slice(0, 12)}`)

    if (currentSha === templateLayerSha) {
      console.log('\n  ✅ Layer is already up to date — no changes needed.')
    } else {
      console.log('\n  Changed files:\n')
      const diffAgainstTemplate = getOutput(
        'git diff HEAD:layers/narduk-nuxt-layer template/main:layers/narduk-nuxt-layer --stat 2>/dev/null || echo "  (unable to compute stat diff)"',
      )
      console.log(diffAgainstTemplate || '  (no stat diff available)')
      console.log('\n  Run without --dry-run to apply these changes.')
    }
    return
  }

  // 3. Checkout layers/narduk-nuxt-layer
  console.log('\n📂 Checking out layers/narduk-nuxt-layer...')
  run('git checkout template/main -- layers/narduk-nuxt-layer')

  // 4. Rewrite package.json repository
  if (!skipRewrite) {
    console.log('\n📝 Ensuring layer package.json repository matches current project...')
    try {
      const originUrl = getOutput('git remote get-url origin')
      if (originUrl) {
        const pkgContent = await fs.readFile(LAYER_PKG_PATH, 'utf-8')
        const pkg = JSON.parse(pkgContent)

        if (pkg.repository?.url !== originUrl) {
          pkg.repository = pkg.repository || {}
          pkg.repository.type = 'git'
          pkg.repository.url = originUrl
          pkg.repository.directory = 'layers/narduk-nuxt-layer'

          await fs.writeFile(LAYER_PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
          run('git add layers/narduk-nuxt-layer/package.json')
          console.log(`  ✅ Updated repository.url to ${originUrl} and staged the change`)
        } else {
          console.log('  ⏭ repository.url already matches origin.')
        }
      } else {
        console.warn('  ⚠️ No origin remote found. Skipping repository rewrite.')
      }
    } catch (e: any) {
      console.warn(`  ⚠️ Failed to rewrite repository.url: ${e.message}`)
    }
  } else {
    console.log('\n⏭ Skipping repository rewrite (--no-rewrite-repo flag provided).')
  }

  // 5. Update .template-version with the fetched SHA
  console.log('\n📌 Recording template version...')
  try {
    const templateSha = getOutput('git rev-parse template/main')
    if (templateSha) {
      const versionContent = [
        `sha=${templateSha}`,
        `template=narduk-nuxt-template`,
        `synced=${new Date().toISOString()}`,
        '',
      ].join('\n')
      await fs.readFile(path.join(ROOT_DIR, '.template-version'), 'utf-8').catch(() => '')
      await fs.writeFile(path.join(ROOT_DIR, '.template-version'), versionContent, 'utf-8')
      run('git add .template-version')
      console.log(`  ✅ Recorded template SHA: ${templateSha.slice(0, 12)}`)
    }
  } catch (e: any) {
    console.warn(`  ⚠️ Could not record template version: ${e.message}`)
  }

  // 5.5 Enforce canonical pnpm overrides
  console.log('\n🔧 Enforcing canonical pnpm overrides...')
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json')
    const pkgContent = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgContent)

    pkg.pnpm = pkg.pnpm || {}
    pkg.pnpm.overrides = pkg.pnpm.overrides || {}

    // The v6 beta is strictly required for Cloudflare Workers (fixes proxy-cjs.js ENOTDIR)
    if (pkg.pnpm.overrides['nuxt-og-image'] !== '6.0.0-beta.47') {
      pkg.pnpm.overrides['nuxt-og-image'] = '6.0.0-beta.47'
      await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
      run('git add package.json')
      console.log('  ✅ Applied canonical pnpm.overrides for nuxt-og-image')
    } else {
      console.log('  ⏭ pnpm.overrides already canonical.')
    }
  } catch (e: any) {
    console.warn(`  ⚠️ Could not enforce pnpm overrides: ${e.message}`)
  }

  // 6. pnpm install (--no-frozen-lockfile because overrides may change lockfile config)
  console.log('\n📦 Running pnpm install to sync dependencies...')
  run('pnpm install --no-frozen-lockfile')
  run('git add pnpm-lock.yaml')

  // 7. Quality gate
  if (skipQuality) {
    console.log('\n⏭ Skipping quality gate (--skip-quality)')
  } else {
    console.log('\n🛡️ Running quality gate...')
    try {
      run('pnpm run quality')
      console.log('  ✅ Quality gate passed.')
    } catch (e: any) {
      console.error('\n❌ Quality gate failed.')
      console.error(
        '  ⚠️ Layer update received but it causes TypeScript or ESLint errors in this application.',
      )
      console.error(
        '  ⚠️ Please fix the issues locally or revert the update using `git checkout HEAD . && git clean -fd`.',
      )
      process.exit(1)
    }
  }

  console.log('\n🎉 Layer update complete!')
  console.log('⚠️  Note: Local layer customizations (if any) have been overwritten.')
  console.log(
    '    Layer changes are staged. Run `git diff --cached` to review, then `git commit` when ready.',
  )
}

main().catch((e) => {
  console.error('\n❌ Update failed:', e.message)
  process.exit(1)
})
