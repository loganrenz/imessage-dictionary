<script setup lang="ts">
import { z } from 'zod'

/**
 * AuthRegisterCard — Self-contained registration card built from Nuxt UI primitives.
 *
 * All styling uses semantic Nuxt UI color classes so the consuming app's
 * `app.config.ts` theme is inherited automatically.
 *
 * @example
 * <!-- Simplest usage (works out of the box): -->
 * <AuthRegisterCard />
 *
 * @example
 * <!-- Custom branding: -->
 * <AuthRegisterCard title="Join Acme" subtitle="Create your account">
 *   <template #logo>
 *     <img src="/logo.svg" class="h-10" />
 *   </template>
 * </AuthRegisterCard>
 */

const appConfig = useAppConfig()

const props = withDefaults(
  defineProps<{
    /** Card heading */
    title?: string
    /** Card subheading */
    subtitle?: string
    /** Show link to login page */
    showLoginLink?: boolean
    /** Path for the login link */
    loginPath?: string
    /** Where to redirect after successful registration */
    redirectPath?: string
  }>(),
  {
    title: 'Create an account',
    subtitle: 'Get started with a free account',
    showLoginLink: true,
    loginPath: '/login',
    redirectPath: undefined,
  },
)

const resolvedRedirectPath = computed(
  () =>
    props.redirectPath ??
    (appConfig as { auth?: { redirectPath?: string } }).auth?.redirectPath ??
    '/dashboard/',
)

const emit = defineEmits<{
  /** Emitted after a successful registration with the new user object */
  success: [user: { id: string; name: string; email: string }]
}>()

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const state = reactive({
  name: '',
  email: '',
  password: '',
})

const { register } = useAuthApi()
const { fetch: fetchSession } = useUserSession()
const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  const parsed = schema.safeParse(state)
  if (!parsed.success) {
    errorMsg.value = parsed.error.issues.map((e: { message: string }) => e.message).join('. ')
    return
  }
  errorMsg.value = ''
  loading.value = true

  try {
    const result = await register(state)
    await fetchSession()
    emit('success', result.user)
    await navigateTo(resolvedRedirectPath.value, { replace: true })
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; statusMessage?: string }
    errorMsg.value = error.data?.message || error.statusMessage || 'Failed to create account'
  } finally {
    loading.value = false
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
      data-testid="auth-register-error"
      class="mb-4"
    />

    <!-- Extra content above the form -->
    <slot name="before-form" />

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField name="name" label="Name">
        <UInput
          v-model="state.name"
          placeholder="John Doe"
          class="w-full"
          data-testid="auth-register-name"
        />
      </UFormField>

      <UFormField name="email" label="Email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@example.com"
          class="w-full"
          data-testid="auth-register-email"
        />
      </UFormField>

      <UFormField name="password" label="Password">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          data-testid="auth-register-password"
        />
      </UFormField>

      <UButton
        type="button"
        color="primary"
        class="w-full"
        :loading="loading"
        block
        data-testid="auth-register-submit"
        @click="onSubmit"
      >
        Create Account
      </UButton>
    </UForm>

    <!-- Extra content below the form -->
    <slot name="after-form" />

    <template v-if="showLoginLink" #footer>
      <p class="text-center text-sm text-muted">
        Already have an account?
        <ULink :to="loginPath" class="text-primary font-medium hover:underline"> Sign in </ULink>
      </p>
    </template>
  </UCard>
</template>
