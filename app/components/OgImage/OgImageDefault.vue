<!-- 
  OG Image Default Template
  
  Rendered at the edge via Satori (part of nuxt-og-image / @nuxtjs/seo).
  This is the default template used when calling `defineOgImage()` or
  the `useSeo({ ogImage: {...} })` composable.
  
  Satori renders this Vue component to an SVG, then converts to PNG.
  Note: Satori has limited CSS support — use inline styles and flexbox only.
  No Tailwind classes, no CSS Grid, no pseudo-elements.
-->
<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string
  siteName?: string
}>(), {
  title: 'Nuxt 4 Template',
  description: 'Production-ready Nuxt 4 + Cloudflare Workers',
  icon: '✨',
  siteName: 'Nuxt 4 Demo',
})
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '80px',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #0f1729 40%, #111d33 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Accent gradient blob -->
    <div
      :style="{
        position: 'absolute',
        top: '-120px',
        right: '-80px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
      }"
    />

    <!-- Bottom accent line -->
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)',
      }"
    />

    <!-- Icon -->
    <div
      :style="{
        fontSize: '48px',
        marginBottom: '24px',
      }"
    >
      {{ icon }}
    </div>

    <!-- Title -->
    <div
      :style="{
        fontSize: '56px',
        fontWeight: '700',
        color: '#f1f5f9',
        lineHeight: '1.15',
        marginBottom: '16px',
        maxWidth: '900px',
        letterSpacing: '-0.02em',
      }"
    >
      {{ title }}
    </div>

    <!-- Description -->
    <div
      :style="{
        fontSize: '24px',
        fontWeight: '400',
        color: '#94a3b8',
        lineHeight: '1.5',
        maxWidth: '800px',
      }"
    >
      {{ description }}
    </div>

    <!-- Site name badge -->
    <div
      :style="{
        position: 'absolute',
        bottom: '40px',
        right: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }"
    >
      <div
        :style="{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: '700',
        }"
      >
        N4
      </div>
      <div
        :style="{
          fontSize: '18px',
          fontWeight: '600',
          color: '#64748b',
        }"
      >
        {{ siteName }}
      </div>
    </div>
  </div>
</template>
