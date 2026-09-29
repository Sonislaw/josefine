<script setup lang="ts">
import CaravaningTools from '@/apps/caravaning/components/CaravaningTools.vue'
import { caravaningModule } from '@/apps/caravaning/manifest'
import PracaTools from '@/apps/praca/components/PracaTools.vue'
import { pracaModule } from '@/apps/praca/manifest'
import PieniadzeTools from '@/apps/pieniadze/components/PieniadzeTools.vue'
import { pieniadzeModule } from '@/apps/pieniadze/manifest'
import CzasTools from '@/apps/czas/components/CzasTools.vue'
import { czasModule } from '@/apps/czas/manifest'
</script>

<template>
  <section><h1>Josefine</h1><p>Dashboard dostępnych narzędzi platformy.</p></section>
  <section class="module"><h2>{{ caravaningModule.name }}</h2><p>{{ caravaningModule.description }}</p><CaravaningTools /></section>
  <section class="module"><h2>{{ pracaModule.name }}</h2><p>{{ pracaModule.description }}</p><PracaTools /></section>
  <section class="module"><h2>{{ pieniadzeModule.name }}</h2><p>{{ pieniadzeModule.description }}</p><PieniadzeTools /></section>
  <section class="module"><h2>{{ czasModule.name }}</h2><p>{{ czasModule.description }}</p><CzasTools /></section>
</template>
<style scoped>.module { margin-top: 2.5rem; }</style>
