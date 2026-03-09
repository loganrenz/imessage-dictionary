import {
  createUniqueEmail,
  expect,
  test,
  waitForBaseUrlReady,
  waitForHydration,
  warmUpApp,
} from './fixtures.ts'

interface SharedAuthContractOptions {
  appName?: string
  basePath?: string
  loginPath?: string
  registerPath?: string
  protectedPath?: string
  dashboardHeading?: RegExp
  loginHeading?: RegExp
  registerHeading?: RegExp
}

export function defineSharedAuthContract(options: SharedAuthContractOptions = {}) {
  const {
    appName = 'app',
    basePath = '/',
    loginPath = '/login',
    registerPath = '/register',
    protectedPath = '/dashboard/',
    dashboardHeading = /Welcome/i,
    loginHeading = /Welcome back/i,
    registerHeading = /Create an account/i,
  } = options

  test.describe(`${appName} shared auth contract`, () => {
    async function registerViaApi(
      page: import('@playwright/test').Page,
      payload: { name: string; email: string; password: string },
    ) {
      return page.evaluate(async (body) => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        return response.json()
      }, payload)
    }

    async function loginViaApi(
      page: import('@playwright/test').Page,
      payload: { email: string; password: string },
    ) {
      return page.evaluate(async (body) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        return response.json()
      }, payload)
    }

    async function logoutViaApi(page: import('@playwright/test').Page) {
      return page.evaluate(async () => {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        return response.json()
      })
    }

    test.beforeAll(async ({ browser, baseURL }) => {
      if (!baseURL) {
        throw new Error('Shared auth contract requires Playwright baseURL to be configured.')
      }

      await waitForBaseUrlReady(baseURL)
      await warmUpApp(browser, baseURL, basePath)
    })

    test('login and register pages render', async ({ page }) => {
      await page.goto(loginPath)
      await expect(page.getByRole('heading', { name: loginHeading })).toBeVisible()

      await page.goto(registerPath)
      await expect(page.getByRole('heading', { name: registerHeading })).toBeVisible()
    })

    test('guest-only footer links navigate between login and register', async ({ page }) => {
      await page.goto(loginPath)
      await waitForHydration(page)
      await page.getByRole('link', { name: 'Sign up' }).click()
      await expect(page).toHaveURL(new RegExp(registerPath))

      await waitForHydration(page)
      await page.getByRole('link', { name: 'Sign in' }).click()
      await expect(page).toHaveURL(new RegExp(loginPath))
    })

    test('unauthenticated user is redirected from protected route', async ({ page }) => {
      await page.goto(protectedPath)
      await expect(page).toHaveURL(new RegExp(loginPath), { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: loginHeading })).toBeVisible()
    })

    test('register, logout, and login flow works', async ({ page }) => {
      const email = createUniqueEmail(appName.replaceAll(/\s+/g, '-').toLowerCase())
      const password = 'password123'

      await page.goto(registerPath)
      await waitForHydration(page)
      await registerViaApi(page, { name: 'E2E User', email, password })

      await page.goto(protectedPath)
      await expect(page).toHaveURL(new RegExp(protectedPath), { timeout: 15_000 })
      await expect(page.getByRole('heading', { name: dashboardHeading })).toBeVisible()

      await logoutViaApi(page)
      await page.goto(loginPath)
      await expect(page).toHaveURL(new RegExp(loginPath), { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: loginHeading })).toBeVisible()

      await loginViaApi(page, { email, password })

      await page.goto(protectedPath)
      await expect(page).toHaveURL(new RegExp(protectedPath), { timeout: 15_000 })
      await expect(page.getByRole('heading', { name: dashboardHeading })).toBeVisible()
    })

    test('authenticated users are redirected away from guest pages', async ({ page }) => {
      const email = createUniqueEmail(`${appName.replaceAll(/\s+/g, '-').toLowerCase()}-redirect`)

      await page.goto(registerPath)
      await waitForHydration(page)
      await registerViaApi(page, { name: 'Redirect User', email, password: 'password123' })

      await page.goto(protectedPath)
      await expect(page).toHaveURL(new RegExp(protectedPath), { timeout: 15_000 })

      await page.goto(loginPath)
      await expect(page).toHaveURL(new RegExp(protectedPath), { timeout: 10_000 })

      await page.goto(registerPath)
      await expect(page).toHaveURL(new RegExp(protectedPath), { timeout: 10_000 })
    })

    test('stale session cookie still allows login page to render', async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'nuxt-session',
          value: 'stale-invalid-token-value',
          domain: 'localhost',
          path: '/',
        },
      ])

      await page.goto(loginPath)
      await expect(page).toHaveURL(new RegExp(loginPath), { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: loginHeading })).toBeVisible()
    })

    test('stale session cookie on protected route redirects to login', async ({
      page,
      context,
    }) => {
      await context.addCookies([
        {
          name: 'nuxt-session',
          value: 'stale-invalid-token-value',
          domain: 'localhost',
          path: '/',
        },
      ])

      await page.goto(protectedPath)
      await expect(page).toHaveURL(new RegExp(loginPath), { timeout: 10_000 })
    })
  })
}
