<!--
  OG Image Default Template.

  Nuxt OG Image v6 resolves renderers by filename suffix, so this template
  is explicitly Takumi via `.takumi.vue`.
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    siteName?: string
    /** Brand color hex — defaults to emerald. Override to match your app's primary color. */
    primaryColor?: string
  }>(),
  {
    title: 'Nuxt 4 Template',
    description: 'Production-ready Nuxt 4 + Cloudflare Workers',
    icon: '✨',
    siteName: 'Nuxt 4 Demo',
    // eslint-disable-next-line narduk/no-inline-hex -- OG image default brand color; Tailwind utilities are not available in component props defaults
    primaryColor: '#10b981',
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
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '80px',
      background: `linear-gradient(135deg, #0a0f1a 0%, #0f1729 40%, #111d33 100%)`,
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <div
      :style="{
        position: 'absolute',
        top: '-120px',
        right: '-80px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${primaryColor}26 0%, transparent 70%)`,
      }"
    />

    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: `linear-gradient(90deg, ${primaryColor}, #3b82f6, #8b5cf6)`,
      }"
    />

    <div
      :style="{
        fontSize: '48px',
        marginBottom: '24px',
      }"
    >
      {{ icon }}
    </div>

    <div
      :style="{
        fontSize: '56px',
        fontWeight: '700',
        // eslint-disable-next-line narduk/no-inline-hex
        color: '#f1f5f9',
        lineHeight: '1.15',
        marginBottom: '16px',
        maxWidth: '900px',
        letterSpacing: '-0.02em',
      }"
    >
      {{ title }}
    </div>

    <div
      :style="{
        fontSize: '24px',
        fontWeight: '400',
        // eslint-disable-next-line narduk/no-inline-hex
        color: '#94a3b8',
        lineHeight: '1.5',
        maxWidth: '800px',
      }"
    >
      {{ description }}
    </div>

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
          background: primaryColor,
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
          // eslint-disable-next-line narduk/no-inline-hex
          color: '#64748b',
        }"
      >
        {{ siteName }}
      </div>
    </div>
  </div>
</template>
