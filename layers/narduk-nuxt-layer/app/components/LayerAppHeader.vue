<script setup lang="ts">
/**
 * A highly configurable, responsive layer application header.
 */
import type { RouteLocationRaw } from 'vue-router'

interface NavLink {
  label: string
  to?: RouteLocationRaw
  href?: string
  icon?: string
}

const _props = withDefaults(
  defineProps<{
    appName?: string
    logoText?: string
    navLinks?: NavLink[]
    showColorModeToggle?: boolean
  }>(),
  {
    appName: '',
    logoText: 'N4',
    navLinks: () => [],
    showColorModeToggle: true,
  },
)

const route = useRoute()
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Color Mode types depend on build-time module resolution
const colorMode = useColorMode() as any

const colorModeIcon = computed(() => {
  if (colorMode.preference === 'system') return 'i-lucide-monitor'
  return colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
})

function cycleColorMode() {
  const modes = ['system', 'light', 'dark'] as const
  const idx = modes.indexOf(colorMode.preference as (typeof modes)[number])
  colorMode.preference = modes[(idx + 1) % modes.length]!
}

const mobileMenuOpen = ref(false)

// Close mobile menu on route change
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)
</script>

<template>
  <!-- eslint-disable-next-line narduk/no-native-layout -- layer scaffold: semantic landmark element -->
  <header class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand / Logo Area -->
      <slot name="logo">
        <NuxtLink to="/" class="flex items-center gap-2.5 group shrink-0">
          <div
            class="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm"
          >
            {{ logoText }}
          </div>
          <span class="font-display font-semibold text-lg hidden sm:block">
            {{ appName }}
          </span>
        </NuxtLink>
      </slot>

      <!-- Desktop nav -->
      <!-- eslint-disable-next-line narduk/no-native-layout -- layer scaffold: semantic landmark element -->
      <nav class="hidden md:flex items-center gap-1" aria-label="Main navigation">
        <slot name="navigation">
          <template v-if="navLinks.length">
            <template v-for="(link, index) in navLinks" :key="index">
              <!-- Internal Link -->
              <NuxtLink
                v-if="link.to"
                :to="link.to"
                class="px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                :class="
                  route.path === link.to
                    ? 'text-primary bg-primary/10'
                    : 'text-muted hover:text-default hover:bg-elevated'
                "
              >
                <UIcon v-if="link.icon" :name="link.icon" class="size-4" />
                {{ link.label }}
              </NuxtLink>

              <!-- eslint-disable-next-line narduk/prefer-ulink -- external link with target blank requires explicit rel -->
              <a
                v-else-if="link.href"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 text-muted hover:text-default hover:bg-elevated"
              >
                <UIcon v-if="link.icon" :name="link.icon" class="size-4" />
                {{ link.label }}
              </a>
            </template>
          </template>
        </slot>
      </nav>

      <!-- Actions (Color Mode, Mobile Menu, Custom Actions) -->
      <div class="flex items-center gap-1">
        <slot name="actions"></slot>

        <UButton
          v-if="showColorModeToggle"
          :icon="colorModeIcon"
          variant="ghost"
          color="neutral"
          aria-label="Toggle color mode"
          @click="cycleColorMode"
        />

        <!-- Mobile hamburger -->
        <UButton
          color="neutral"
          variant="ghost"
          class="md:hidden p-2 rounded-lg hover:bg-elevated"
          aria-label="Toggle navigation menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
        </UButton>
      </div>
    </div>

    <!-- Mobile nav drawer -->
    <Transition name="slide-down">
      <!-- eslint-disable-next-line narduk/no-native-layout -- layer scaffold: semantic landmark element -->
      <nav
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-default bg-default/95 backdrop-blur-xl"
        aria-label="Mobile navigation"
      >
        <div class="max-w-7xl mx-auto px-4 py-3 space-y-1">
          <slot name="mobile-navigation">
            <template v-if="navLinks.length">
              <template v-for="(link, index) in navLinks" :key="index">
                <!-- Internal Link -->
                <NuxtLink
                  v-if="link.to"
                  :to="link.to"
                  class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  :class="
                    route.path === link.to
                      ? 'text-primary bg-primary/10'
                      : 'text-muted hover:text-default hover:bg-elevated'
                  "
                >
                  <UIcon v-if="link.icon" :name="link.icon" class="size-4" />
                  {{ link.label }}
                </NuxtLink>

                <!-- eslint-disable-next-line narduk/prefer-ulink -- external link with target blank requires explicit rel -->
                <a
                  v-else-if="link.href"
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-muted hover:text-default hover:bg-elevated"
                >
                  <UIcon v-if="link.icon" :name="link.icon" class="size-4" />
                  {{ link.label }}
                </a>
              </template>
            </template>
          </slot>
        </div>
      </nav>
    </Transition>
  </header>
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
