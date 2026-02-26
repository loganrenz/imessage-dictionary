<template>
  <UPage>
    <UPageHero
      title="Nuxt 4 Template"
      description="The definitive starting point for your next great application. Batteries included: UI, D1, Authentication, and more."
    >
      <template #links>
        <UButton
          to="https://ui3.nuxt.dev"
          target="_blank"
          icon="i-heroicons-book-open"
          color="neutral"
        >
          Nuxt UI Docs
        </UButton>
      </template>
    </UPageHero>
  </UPage>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Welcome to the Nuxt 4 Template',
  description: 'Your scalable foundation for everything.'
})
</script>
