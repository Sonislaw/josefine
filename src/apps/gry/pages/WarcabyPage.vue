<script setup lang="ts">
import WarcabyGame from '../games/warcaby/WarcabyGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('warcaby-arena-mocy', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Warcaby — Arena Mocy',
  description:
    'Warcaby klasyczne i wariant z czterema mocami. Gra z komputerem lub we dwoje na jednym urządzeniu.',
  url: new URL(gryPath('/warcaby-arena-mocy'), grySiteUrl).href,
  inLanguage: 'pl',
  gamePlatform: 'Web browser',
  genre: 'Strategy',
  playMode: ['SinglePlayer', 'MultiPlayer'],
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2 },
  isAccessibleForFree: true,
})
</script>
<template><WarcabyGame /></template>
