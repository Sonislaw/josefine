<script setup lang="ts">
import { useHead } from '@unhead/vue'
import CaravaningFooter from './components/CaravaningFooter.vue'
import CaravaningHeader from './components/CaravaningHeader.vue'

useHead({ htmlAttrs: { lang: 'pl' } })
</script>

<template>
  <!-- Module shell preserves the migrated app's UX while the platform layout stays reusable. -->
  <div class="caravaning-app flex min-h-screen flex-col bg-background text-foreground">
    <CaravaningHeader />
    <main class="flex-1"><RouterView /></main>
    <CaravaningFooter />
  </div>
</template>

<style scoped>
.caravaning-app {
  background: #fbfaf5;
}
:deep(.caravaning-tool-intro) {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-top: 1.5rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  border: 1px solid #dce7d9;
  border-radius: 25px;
  background:
    radial-gradient(circle at 85% 18%, #dcebd9, transparent 40%),
    linear-gradient(120deg, #ebf2e8, #f9f2df);
}
:deep(.caravaning-tool-intro::after) {
  position: absolute;
  z-index: -1;
  right: -65px;
  bottom: -105px;
  width: 320px;
  height: 320px;
  border: 2px solid #aacbb7;
  border-radius: 50%;
  box-shadow: 0 0 0 55px #e1ebe066;
  content: '';
}
:deep(.caravaning-tool-intro > p:first-child) {
  margin-top: 0;
  color: #a37355;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
:deep(.caravaning-tool-intro h1) {
  max-width: 760px;
  margin-top: 0.7rem;
  color: #244b38;
  font-size: clamp(2.3rem, 4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.12;
}
:deep(.caravaning-tool-intro > p:last-child) {
  max-width: 700px;
  margin-top: 1rem;
  color: #607768;
  line-height: 1.75;
}
:deep(.caravaning-form-panel) {
  border-color: #dce7da;
  border-radius: 22px;
  box-shadow: 0 16px 38px #214b3010;
}
:deep(.caravaning-result-panel) {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  background: radial-gradient(circle at 90% 0, #35634b, #173b32 58%, #102e28);
  box-shadow: 0 16px 34px #173b3228;
}
:deep(.caravaning-result-panel::after) {
  position: absolute;
  right: -50px;
  bottom: -110px;
  width: 240px;
  height: 240px;
  border: 1px solid #ffffff35;
  border-radius: 50%;
  content: '';
  pointer-events: none;
}
</style>
