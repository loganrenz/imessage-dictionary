/**
 * check-setup.js — Bootstrap Guard
 * ─────────────────────────────────
 * Runs as a `pre*` hook before dev/build/deploy to ensure `pnpm run setup`
 * has been completed. If the `.setup-complete` sentinel is missing, the
 * script prints instructions and exits with code 1.
 *
 * The sentinel file is written by init.ts at the end of a successful setup.
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const SENTINEL = path.join(ROOT, '.setup-complete')

if (!fs.existsSync(SENTINEL)) {
  console.error()
  console.error('┌──────────────────────────────────────────────────────────────┐')
  console.error('│  🚨  PROJECT SETUP NOT COMPLETE                             │')
  console.error('│                                                              │')
  console.error('│  This app must be provisioned before dev/build.              │')
  console.error('│                                                              │')
  console.error('│  RECOMMENDED: Use the control plane provision API:           │')
  console.error('│    POST https://control-plane.nard.uk/api/fleet/provision    │')
  console.error('│                                                              │')
  console.error('│  MANUAL SETUP (if not using the provision API):              │')
  console.error('│                                                              │')
  console.error('│  1. Set up your git remote:                                  │')
  console.error('│     rm -rf .git && git init                                  │')
  console.error('│     git remote add origin git@github.com:you/your-app.git    │')
  console.error('│                                                              │')
  console.error('│  2. Install dependencies:                                    │')
  console.error('│     pnpm install                                             │')
  console.error('│                                                              │')
  console.error('│  3. Run the setup script:                                    │')
  console.error('│     pnpm run setup -- --name="app" --display="App" \\         │')
  console.error('│       --url="https://app.com"                                │')
  console.error('│                                                              │')
  console.error('│  See AGENTS.md § "Starting a New Project" for full details. │')
  console.error('└──────────────────────────────────────────────────────────────┘')
  console.error()
  process.exit(1)
}
