<script setup lang="ts">
/**
 * Layer Default Application Shell
 * This uses the layer's highly configurable components.
 */
const route = useRoute()
const appName = useRuntimeConfig().public.appName || 'Nuxt 4 Demo'

const navItems = [{ label: 'Home', to: '/', icon: 'i-lucide-home' }]

/**
 * Site-wide SEO defaults are now handled by @nuxtjs/seo via nuxt.config.ts `site` block.
 * The titleTemplate is automatically set to `%s %separator %siteName`.
 * Individual pages use the `useSeo()` composable to set their own title/description/OG.
 */
</script>

<template>
  <LayerAppShell>
    <!-- Configurable Header -->
    <template #header>
      <LayerAppHeader :app-name="appName" :nav-links="navItems" />
    </template>

    <!-- Main Content Container with standard max-w-7xl padding unless overridden by layout -->
    <div
      :class="[
        'flex-1',
        route.meta.layout === 'landing' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full',
      ]"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>

    <!-- Configurable Footer -->
    <template #footer>
      <LayerAppFooter :app-name="appName" />
    </template>
  </LayerAppShell>
</template>
