<script setup lang="ts">
import CaravaningTools from '@/apps/caravaning/components/CaravaningTools.vue'
import { caravaningModule } from '@/apps/caravaning/manifest'
import PracaTools from '@/apps/praca/components/PracaTools.vue'
import { pracaModule } from '@/apps/praca/manifest'
import PieniadzeTools from '@/apps/pieniadze/components/PieniadzeTools.vue'
import { pieniadzeModule } from '@/apps/pieniadze/manifest'
import CzasTools from '@/apps/czas/components/CzasTools.vue'
import { czasModule } from '@/apps/czas/manifest'
import JednostkiTools from '@/apps/jednostki/components/JednostkiTools.vue'
import { jednostkiModule } from '@/apps/jednostki/manifest'
import DomTools from '@/apps/dom/components/DomTools.vue'
import { domModule } from '@/apps/dom/manifest'
import MotoryzacjaTools from '@/apps/motoryzacja/components/MotoryzacjaTools.vue'
import { motoryzacjaModule } from '@/apps/motoryzacja/manifest'
</script>

<template>
  <section><h1>Josefine</h1><p>Dashboard dostępnych narzędzi platformy.</p></section>
  <section class="module"><h2>{{ caravaningModule.name }}</h2><p>{{ caravaningModule.description }}</p><CaravaningTools /></section>
  <section class="module"><h2>{{ pracaModule.name }}</h2><p>{{ pracaModule.description }}</p><PracaTools /></section>
  <section class="module"><h2>{{ pieniadzeModule.name }}</h2><p>{{ pieniadzeModule.description }}</p><PieniadzeTools /></section>
  <section class="module"><h2>{{ czasModule.name }}</h2><p>{{ czasModule.description }}</p><CzasTools /></section>
  <section class="module"><h2>{{ jednostkiModule.name }}</h2><p>{{ jednostkiModule.description }}</p><JednostkiTools /></section>
  <section class="module"><h2>{{ domModule.name }}</h2><p>{{ domModule.description }}</p><DomTools /></section>
  <section class="module"><h2>{{ motoryzacjaModule.name }}</h2><p>{{ motoryzacjaModule.description }}</p><MotoryzacjaTools /></section>
</template>
<style scoped>.module { margin-top: 2.5rem; }</style>
