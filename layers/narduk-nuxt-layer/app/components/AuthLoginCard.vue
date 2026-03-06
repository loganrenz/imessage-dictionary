<script setup lang="ts">
import { z } from 'zod'

/**
 * AuthLoginCard — Self-contained login card built from Nuxt UI primitives.
 *
 * All styling uses semantic Nuxt UI color classes so the consuming app's
 * `app.config.ts` theme is inherited automatically.
 *
 * @example
 * <!-- Simplest usage (works out of the box): -->
 * <AuthLoginCard />
 *
 * @example
 * <!-- Custom branding: -->
 * <AuthLoginCard title="Welcome to Acme" subtitle="Sign in to continue">
 *   <template #logo>
 *     <img src="/logo.svg" class="h-10" />
 *   </template>
 * </AuthLoginCard>
 */

const appConfig = useAppConfig()

const props = withDefaults(
  defineProps<{
    /** Card heading */
    title?: string
    /** Card subheading */
    subtitle?: string
    /** Show link to register page */
    showRegisterLink?: boolean
    /** Path for the register link */
    registerPath?: string
    /** Where to redirect after successful login */
    redirectPath?: string
    /** Show the demo/test-user button */
    showDemoLogin?: boolean
  }>(),
  {
    title: 'Welcome back',
    subtitle: 'Sign in to your account',
    showRegisterLink: true,
    registerPath: '/register',
    redirectPath: undefined,
    showDemoLogin: false,
  },
)

const resolvedRedirectPath = computed(
  () =>
    props.redirectPath ??
    (appConfig as { auth?: { redirectPath?: string } }).auth?.redirectPath ??
    '/dashboard/',
)

const emit = defineEmits<{
  /** Emitted after a successful login with the logged-in user object */
  success: [user: { id: string; name: string; email: string }]
}>()

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const state = reactive({
  email: '',
  password: '',
})

const { login, loginAsTestUser } = useAuthApi()
const { fetch: fetchSession } = useUserSession()
const errorMsg = ref('')
const loading = ref(false)
const demoLoading = ref(false)

async function onSubmit() {
  const parsed = schema.safeParse(state)
  if (!parsed.success) {
    errorMsg.value = parsed.error.issues.map((e: { message: string }) => e.message).join('. ')
    return
  }
  errorMsg.value = ''
  loading.value = true

  try {
    const result = await login(state)
    await fetchSession()
    emit('success', result.user)
    await navigateTo(resolvedRedirectPath.value, { replace: true })
  } catch (err: unknown) {
    const error = err as {
      data?: { statusMessage?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    errorMsg.value =
      error.data?.statusMessage ||
      error.data?.message ||
      error.statusMessage ||
      error.message ||
      'Invalid credentials'
  } finally {
    loading.value = false
  }
}

async function onDemoLogin() {
  errorMsg.value = ''
  demoLoading.value = true

  try {
    const result = await loginAsTestUser()
    await fetchSession()
    emit('success', result.user)
    await navigateTo(resolvedRedirectPath.value, { replace: true })
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    errorMsg.value = error.data?.message || 'Unable to sign in with demo user'
  } finally {
    demoLoading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div class="text-center">
        <!-- Logo slot for app branding -->
        <div v-if="$slots.logo" class="flex justify-center mb-3">
          <slot name="logo" />
        </div>
        <h1 class="text-2xl font-bold">
          {{ title }}
        </h1>
        <p class="text-muted text-sm mt-1">
          {{ subtitle }}
        </p>
      </div>
    </template>

    <UAlert
      v-if="errorMsg"
      color="error"
      variant="subtle"
      title="Error"
      :description="errorMsg"
      data-testid="auth-login-error"
      class="mb-4"
    />

    <!-- Extra content above the form -->
    <slot name="before-form" />

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField name="email" label="Email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@example.com"
          class="w-full"
          data-testid="auth-login-email"
        />
      </UFormField>

      <UFormField name="password" label="Password">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          data-testid="auth-login-password"
        />
      </UFormField>

      <UButton
        type="button"
        color="primary"
        class="w-full"
        :loading="loading"
        block
        data-testid="auth-login-submit"
        @click="onSubmit"
      >
        Sign In
      </UButton>

      <UButton
        v-if="showDemoLogin"
        type="button"
        color="neutral"
        variant="soft"
        class="w-full"
        icon="i-lucide-zap"
        :loading="demoLoading"
        data-testid="auth-login-demo"
        @click="onDemoLogin"
      >
        Sign In as Demo User
      </UButton>
    </UForm>

    <!-- Extra content below the form -->
    <slot name="after-form" />

    <template v-if="showRegisterLink" #footer>
      <p class="text-center text-sm text-muted">
        Don't have an account?
        <ULink :to="registerPath" class="text-primary font-medium hover:underline"> Sign up </ULink>
      </p>
    </template>
  </UCard>
</template>
