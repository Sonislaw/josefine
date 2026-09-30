<script setup lang="ts">
import { useHead } from '@unhead/vue'
import CaravaningFooter from './components/CaravaningFooter.vue'
import CaravaningHeader from './components/CaravaningHeader.vue'

useHead({ htmlAttrs: { lang: 'pl' } })
</script>

<template>
  <!-- Module shell preserves the migrated app's UX while the platform layout stays reusable. -->
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <CaravaningHeader />
    <main class="flex-1"><RouterView /></main>
    <CaravaningFooter />
  </div>
</template>
