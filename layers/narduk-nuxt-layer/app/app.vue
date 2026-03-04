<script setup lang="ts">
const route = useRoute()
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Color Mode types depend on build-time module resolution
const colorMode = useColorMode() as any
const appName = useRuntimeConfig().public.appName || ''

const colorModeIcon = computed(() => {
  if (colorMode.preference === 'system') return 'i-lucide-monitor'
  return colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
})

function cycleColorMode() {
  const modes = ['system', 'light', 'dark'] as const
  const idx = modes.indexOf(colorMode.preference as typeof modes[number])
  colorMode.preference = modes[(idx + 1) % modes.length]!
}

const navItems = [
  { label: 'Home', to: '/', icon: 'i-lucide-home' },
]

const mobileMenuOpen = ref(false)

watch(route, () => {
  mobileMenuOpen.value = false
})

/**
 * Site-wide SEO defaults are now handled by @nuxtjs/seo via nuxt.config.ts `site` block.
 * The titleTemplate is automatically set to `%s %separator %siteName`.
 * Individual pages use the `useSeo()` composable to set their own title/description/OG.
 */
</script>

<template>
  <UApp>
    <ULink to="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg">Skip to content</ULink>
    <div class="app-shell min-h-screen flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur-xl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-2.5 group">
            <div class="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              N4
            </div>
            <span class="font-display font-semibold text-lg hidden sm:block">{{ appName || 'Nuxt 4 Demo' }}</span>
          </NuxtLink>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="route.path === item.to
                ? 'text-primary bg-primary/10'
                : 'text-muted hover:text-default hover:bg-elevated'"
            >
              {{ item.label }}
            </NuxtLink>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              :icon="colorModeIcon"
              variant="ghost"
              color="neutral"
              aria-label="Toggle color mode"
              @click="cycleColorMode"
            />

            <!-- Mobile hamburger -->
            <UButton color="neutral" variant="ghost" class="md:hidden p-2 rounded-lg hover:bg-elevated" aria-label="Toggle navigation menu" @click="mobileMenuOpen = !mobileMenuOpen">
              <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
            </UButton>
          </div>
        </div>

        <!-- Mobile nav -->
        <Transition name="slide-down">
          <div v-if="mobileMenuOpen" class="md:hidden border-t border-default px-4 py-3 space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
              :class="route.path === item.to
                ? 'text-primary bg-primary/10'
                : 'text-muted hover:text-default hover:bg-elevated'"
            >
              <UIcon :name="item.icon" class="size-4" />
              {{ item.label }}
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <!-- Main -->
      <div id="main-content" class="flex-1">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-default py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-muted">
            {{ appName || 'Nuxt 4 Demo' }} &middot; Nuxt UI 4 &middot; Cloudflare Workers &middot; <NuxtTime :datetime="new Date()" year="numeric" />
          </p>
        </div>
      </div>
    </div>
  </UApp>
</template>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
