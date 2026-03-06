/**
 * Guest-only middleware — redirects authenticated users to the post-login path.
 *
 * Apply to pages that should only be visible to unauthenticated users
 * (login, register, index landing). Redirect path comes from app.config.auth.redirectPath.
 */
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()

  if (loggedIn.value) {
    const appConfig = useAppConfig()
    const redirectPath =
      (appConfig as { auth?: { redirectPath?: string } }).auth?.redirectPath ?? '/dashboard/'
    return navigateTo(redirectPath, { replace: true })
  }
})
