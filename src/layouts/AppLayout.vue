<script setup lang="ts">
import AppFooter from '@/shared/components/AppFooter.vue'
import AppHeader from '@/shared/components/AppHeader.vue'
import AppSidebar from '@/shared/components/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-shell__body"><AppSidebar /><main class="app-shell__main"><RouterView /></main></div>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.app-shell__body { display: flex; flex: 1; }
.app-shell__main { flex: 1; padding: 2rem; max-width: 1100px; width: 100%; }
@media (max-width: 700px) { .app-shell__body { display: block; } .app-shell__main { padding: 1.25rem; } }
</style>
