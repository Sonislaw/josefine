<script setup lang="ts">
import KingdomGame from '../games/little-kingdom/KingdomGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('male-krolestwo', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Małe królestwo',
  description:
    'Turowa strategia bez limitu czasu. Pomagaj mieszkańcom w 12 opcjonalnych prośbach, rozwijaj osadę do rangi Małego królestwa i odkrywaj zapomniane miejsca. Przygotuj zapasy na zimę i wróć do zapisanej osady.',
  url: new URL(gryPath('/male-krolestwo'), grySiteUrl).href,
  inLanguage: 'pl',
  gamePlatform: 'Web browser',
  genre: 'Turn-based strategy',
  playMode: 'SinglePlayer',
  numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
  isAccessibleForFree: true,
})
</script>
<template><KingdomGame /></template>
