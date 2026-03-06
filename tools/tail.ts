#!/usr/bin/env npx tsx
/**
 * tail.ts — Tail logs for the current fleet app
 *
 * Infers the app name from the current directory and streams real-time logs
 * using `wrangler tail`.
 *
 * Usage:
 *   npx tsx tools/tail.ts
 */

import { spawn } from 'node:child_process'
import { basename } from 'node:path'

const appRoot = process.cwd()
const appName = basename(appRoot) || 'unknown'

console.log(`\n🚀 Starting log tailing for: \x1b[36m${appName}\x1b[0m`)
console.log(`Press Ctrl+C to stop.\n`)

const child = spawn('wrangler', ['tail', appName, '--format=pretty'], {
  stdio: 'inherit',
  cwd: appRoot,
})

child.on('error', (err) => {
  console.error(`❌ Failed to start wrangler: ${err.message}`)
})
