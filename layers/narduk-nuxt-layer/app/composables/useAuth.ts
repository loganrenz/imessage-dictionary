/**
 * useAuth — Client-side auth composable backed by D1 sessions.
 *
 * Provides reactive `user` state, `isAuthenticated` computed, and
 * methods for login, register, logout, and session refresh.
 *
 * All mutations use `$csrfFetch` for CSRF protection if available,
 * falling back to `$fetch` with X-Requested-With header.
 */

export interface AuthUser {
  id: string
  email: string
  name: string | null
  isAdmin: boolean | null
  [key: string]: unknown
}

export function useAuth() {
  const nuxtApp = useNuxtApp()
  const headers = useRequestHeaders(['cookie'])

  const csrfFetch = (nuxtApp.$csrfFetch ?? $fetch) as typeof $fetch

  const { data: meData, refresh } = useFetch<{ user: AuthUser | null }>('/api/auth/me', {
    key: 'auth-me',
    headers,
    default: () => ({ user: null }),
    watch: false,
  })

  const user = computed(() => meData.value?.user ?? null)
  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser() {
    await refresh()
    return user.value
  }

  async function login(email: string, password: string) {
    const data = await csrfFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    await refresh()
    return data.user
  }

  async function register(params: {
    email: string
    name: string
    password: string
    [key: string]: unknown
  }) {
    const data = await csrfFetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: params,
    })
    await refresh()
    return data.user
  }

  async function logout() {
    await csrfFetch('/api/auth/logout', { method: 'POST' })
    await refresh()
  }

  return {
    user,
    isAuthenticated,
    fetchUser,
    login,
    register,
    logout,
    // Backwards compatibility aliases for older fleet applications
    loggedIn: isAuthenticated,
    signup: register,
  }
}
