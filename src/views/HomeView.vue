<script setup lang="ts">
import CaravaningTools from '@/apps/caravaning/components/CaravaningTools.vue'
import { caravaningModule } from '@/apps/caravaning/manifest'
import PracaTools from '@/apps/praca/components/PracaTools.vue'
import { pracaModule } from '@/apps/praca/manifest'
</script>

<template>
  <section><h1>Josefine</h1><p>Dashboard dostępnych narzędzi platformy.</p></section>
  <section class="module"><h2>{{ caravaningModule.name }}</h2><p>{{ caravaningModule.description }}</p><CaravaningTools /></section>
  <section class="module"><h2>{{ pracaModule.name }}</h2><p>{{ pracaModule.description }}</p><PracaTools /></section>
</template>
<style scoped>.module { margin-top: 2.5rem; }</style>
