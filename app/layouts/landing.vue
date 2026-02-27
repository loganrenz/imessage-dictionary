<script setup lang="ts">
/**
 * Landing layout — Full-bleed, minimal chrome.
 *
 * Usage: Add `definePageMeta({ layout: 'landing' })` to any page.
 * Great for marketing/landing pages where you want full control.
 */
const colorMode = useColorMode()
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <!-- Minimal transparent header -->
      <header class="fixed top-0 inset-x-0 z-50 backdrop-blur-lg bg-default/60 border-b border-default">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <NuxtLink to="/" class="font-display font-bold text-lg">
            <slot name="logo">
              <span class="text-primary">N4</span> Template
            </slot>
          </NuxtLink>

          <div class="flex items-center gap-2">
            <slot name="nav" />
            <UButton
              :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
              variant="ghost"
              color="neutral"
              @click="toggleTheme"
            />
          </div>
        </div>
      </header>

      <!-- Full-bleed content -->
      <main class="flex-1 pt-14">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>

      <!-- Minimal footer -->
      <footer class="border-t border-default py-6 text-center text-sm text-muted">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <slot name="footer">
            <p>&copy; {{ new Date().getFullYear() }} Your Company. All rights reserved.</p>
          </slot>
        </div>
      </footer>
    </div>
  </UApp>
</template>
