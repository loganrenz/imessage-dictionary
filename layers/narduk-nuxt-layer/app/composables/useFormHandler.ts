/**
 * useFormHandler — Universal form handling composable.
 *
 * Integrates Zod validation, API submission via $fetch, toast notifications,
 * and loading/error state tracking into a single composable.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { z } from 'zod'
 *
 * const schema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 *   message: z.string().min(10, 'Message must be at least 10 characters'),
 * })
 *
 * const { state, errors, loading, submit, reset } = useFormHandler({
 *   schema,
 *   defaults: { name: '', email: '', message: '' },
 *   endpoint: '/api/contact',
 *   successMessage: 'Message sent successfully!',
 *   onSuccess: () => navigateTo('/thank-you'),
 * })
 * </script>
 *
 * <template>
 *   <form @submit.prevent="submit">
 *     <UFormField label="Name" :error="errors.name">
 *       <UInput v-model="state.name" />
 *     </UFormField>
 *     <UButton type="submit" :loading="loading">Send</UButton>
 *   </form>
 * </template>
 * ```
 */

import type { ZodObject, ZodRawShape } from 'zod'

interface FormHandlerOptions<T extends Record<string, unknown>> {
  /** Zod schema for validation */
  schema: ZodObject<ZodRawShape>
  /** Default form values */
  defaults: T
  /** API endpoint to submit to */
  endpoint?: string
  /** HTTP method (defaults to POST) */
  method?: 'POST' | 'PUT' | 'PATCH'
  /** Toast message on success */
  successMessage?: string
  /** Toast message on error */
  errorMessage?: string
  /** Callback after successful submission */
  onSuccess?: (data: unknown) => void | Promise<void>
  /** Callback after failed submission */
  onError?: (error: unknown) => void
  /** Custom submit function (overrides endpoint-based submission) */
  onSubmit?: (data: T) => Promise<unknown>
}

export function useFormHandler<T extends Record<string, unknown>>(options: FormHandlerOptions<T>) {
  const {
    schema,
    defaults,
    endpoint,
    method = 'POST',
    successMessage = 'Submitted successfully!',
    errorMessage = 'Something went wrong. Please try again.',
    onSuccess,
    onError,
    onSubmit,
  } = options

  const toast = useToast()
  const state = reactive<T>({ ...defaults }) as T
  const errors = reactive<Record<string, string>>({})
  const loading = ref(false)

  /** Clear all field errors */
  function clearErrors() {
    for (const key of Object.keys(errors)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keys are from Object.keys(errors), safe to delete dynamically
      delete errors[key]
    }
  }

  /** Validate the form against the Zod schema */
  function validate(): boolean {
    clearErrors()
    const result = schema.safeParse(state)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (field && typeof field === 'string') {
          errors[field] = issue.message
        }
      }
      return false
    }
    return true
  }

  /** Submit the form (validates first) */
  async function submit() {
    if (!validate()) return

    loading.value = true
    try {
      let result: unknown

      if (onSubmit) {
        result = await onSubmit({ ...state })
      } else if (endpoint) {
        result = await $fetch(endpoint, {
          method,
          body: { ...state },
        })
      } else {
        throw new Error('useFormHandler: provide either `endpoint` or `onSubmit`')
      }

      toast.add({
        title: 'Success',
        description: successMessage,
        color: 'success',
        icon: 'i-lucide-check-circle',
      })

      if (onSuccess) await onSuccess(result)
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string }; message?: string })?.data?.message ??
        (err as Error)?.message ??
        errorMessage
      toast.add({
        title: 'Error',
        description: message,
        color: 'error',
        icon: 'i-lucide-x-circle',
      })
      if (onError) onError(err)
    } finally {
      loading.value = false
    }
  }

  /** Reset form to defaults */
  function reset() {
    Object.assign(state, { ...defaults })
    clearErrors()
  }

  return {
    state,
    errors,
    loading: readonly(loading),
    submit,
    validate,
    reset,
    clearErrors,
  }
}
