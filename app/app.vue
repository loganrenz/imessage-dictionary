<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val: boolean) => { colorMode.preference = val ? 'dark' : 'light' }
})

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
    <div class="app-shell min-h-screen flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur-xl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-2.5 group">
            <div class="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              N4
            </div>
            <span class="font-display font-semibold text-lg hidden sm:block">Nuxt 4 Demo</span>
          </NuxtLink>

          <!-- Desktop nav -->
          <nav class="hidden md:flex items-center gap-1">
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
          </nav>

          <div class="flex items-center gap-2">
            <USwitch
              v-model="isDark"
              on-icon="i-lucide-moon"
              off-icon="i-lucide-sun"
              size="lg"
            />

            <!-- Mobile hamburger -->
            <button class="md:hidden p-2 rounded-lg hover:bg-elevated" @click="mobileMenuOpen = !mobileMenuOpen">
              <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
            </button>
          </div>
        </div>

        <!-- Mobile nav -->
        <Transition name="slide-down">
          <nav v-if="mobileMenuOpen" class="md:hidden border-t border-default px-4 py-3 space-y-1">
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
          </nav>
        </Transition>
      </header>

      <!-- Main -->
      <main class="flex-1">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NuxtPage />
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-default py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-muted">
            Nuxt 4 Demo Template &middot; Nuxt UI 4 &middot; Cloudflare Workers &middot; {{ new Date().getFullYear() }}
          </p>
        </div>
      </footer>
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
