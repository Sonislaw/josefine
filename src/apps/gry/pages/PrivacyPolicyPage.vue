<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('privacy')
</script>
<template>
  <div class="games-privacy">
    <PrivacyPolicyContent
      application-name="Gry — Zgrana"
      :site-url="grySiteUrl"
      :home-to="gryPath('/')"
    />
    <section class="local-data">
      <h2>Dane rozgrywki</h2>
      <p>
        Warcaby działają lokalnie na Twoim urządzeniu. W localStorage pod kluczem „arena-xp”
        zapisujemy wyłącznie sumę punktów doświadczenia. Możesz ją usunąć, czyszcząc dane witryny w
        przeglądarce. Bieżącej planszy nie zapisujemy ani nie wysyłamy na serwer. Pobrany plik gry
        działa offline i nie zawiera analityki.
      </p>
    </section>
  </div>
</template>
<style scoped>
.games-privacy {
  background: #f7f9f3;
  color: #17221a;
  min-height: 70vh;
  padding-bottom: 60px;
}
.local-data {
  max-width: 56rem;
  margin: auto;
  padding: 0 2rem;
  font-size: 14px;
  line-height: 1.8;
}
.local-data h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
}
</style>
