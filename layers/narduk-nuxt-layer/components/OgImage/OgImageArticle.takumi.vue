<!--
  OG Image Article Template.

  A reusable article/blog-post social card used by `useSeo()` when
  `type === 'article'`. Rendered at the edge via Takumi (`.takumi.vue`).

  Props mirror the `ogImage` options in `SeoOptions`:
    title       – headline text
    description – excerpt / subtitle
    category    – badge text in the top-left corner (default: "Article")
    primaryColor – accent color hex (default: sky-blue #0ea5e9)
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    category?: string
    /** Brand color hex — defaults to sky-blue. Override to match your app's primary color. */
    primaryColor?: string
  }>(),
  {
    title: 'Article Title',
    description: 'This OG image is generated for article-type pages.',
    category: 'Article',
    // eslint-disable-next-line narduk/no-inline-hex -- OG image default brand color; Tailwind utilities are not available in component props defaults
    primaryColor: '#0ea5e9',
  },
)
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'linear-gradient(145deg, #020617 0%, #111827 70%, #0c4a6e 100%)',
      padding: '56px',
      fontFamily: 'Inter, sans-serif',
      // eslint-disable-next-line narduk/no-inline-hex
      color: '#e2e8f0',
    }"
  >
    <div
      :style="{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '8px',
        background: primaryColor,
        // eslint-disable-next-line narduk/no-inline-hex
        color: '#082f49',
        fontSize: '22px',
        fontWeight: '700',
        padding: '8px 14px',
      }"
    >
      {{ category }}
    </div>

    <div :style="{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '970px' }">
      <div
        :style="{
          fontSize: '64px',
          lineHeight: '1.1',
          letterSpacing: '-0.03em',
          fontWeight: '700',
        }"
      >
        {{ title }}
      </div>
      <div
        :style="{
          fontSize: '30px',
          // eslint-disable-next-line narduk/no-inline-hex
          color: '#cbd5e1',
          lineHeight: '1.35',
        }"
      >
        {{ description }}
      </div>
    </div>

    <div
      :style="{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '20px',
      }"
    >
      <div
        :style="{
          // eslint-disable-next-line narduk/no-inline-hex
          color: '#7dd3fc',
        }"
      >
        nuxt-og-image
      </div>
      <div
        :style="{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          background: primaryColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
        }"
      >
        N4
      </div>
    </div>
  </div>
</template>
