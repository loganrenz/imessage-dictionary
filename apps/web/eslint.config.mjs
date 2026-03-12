// @ts-check
// ⚠️ SYNCED FILE — do not edit. App-specific rules go in eslint.overrides.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
import { sharedConfigs } from '@narduk-enterprises/eslint-config/config'

let appOverrides = []
try {
  const mod = await import('./eslint.overrides.mjs')
  appOverrides = mod.default || []
} catch {
  // No overrides file — using sharedConfigs only
}

export default withNuxt(...sharedConfigs, ...appOverrides)
