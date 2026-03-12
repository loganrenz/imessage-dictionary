// @ts-check
// Shared ESLint configuration — now a thin re-export from @narduk-enterprises/eslint-config.
// The packages/eslint-config workspace package is kept as a stable internal alias
// so turbo/pnpm can still resolve @narduk/eslint-config from workspace apps.
export { sharedConfigs, nardukPlugin } from '@narduk-enterprises/eslint-config/config'
