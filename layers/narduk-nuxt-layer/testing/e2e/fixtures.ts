import { test as base, expect } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

const HYDRATION_PATTERNS = [
  /hydration/i,
  /mismatch/i,
  /hydration node mismatch/i,
  /data-server-rendered/i,
]

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const consoleLogs: string[] = []

    page.on('console', (msg) => {
      consoleLogs.push(msg.text())
    })

    await use(page)

    const hydrationErrors = consoleLogs.filter((log) =>
      HYDRATION_PATTERNS.some((pattern) => pattern.test(log)),
    )
    if (hydrationErrors.length > 0) {
      throw new Error(`Hydration errors detected in console:\n${hydrationErrors.join('\n')}`)
    }
  },
})

export async function waitForHydration(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(100)
}

export async function waitForBaseUrlReady(baseUrl: string, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const headResponse = await fetch(baseUrl, { method: 'HEAD' })
      if (headResponse.ok) {
        return
      }

      const getResponse = await fetch(baseUrl)
      if (getResponse.ok) {
        return
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }

  throw new Error(`Server at ${baseUrl} did not become ready within ${timeoutMs}ms`)
}

export async function warmUpApp(browser: Browser, baseUrl: string, path = '/') {
  const page = await browser.newPage()

  try {
    await page.goto(new URL(path, baseUrl).toString(), { timeout: 60_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
  } finally {
    await page.close()
  }
}

export function createUniqueEmail(prefix = 'e2e') {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}-${suffix}@example.com`
}

export { expect }
