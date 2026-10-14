<script setup lang="ts">
import KingdomGame from '../games/little-kingdom/KingdomGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('male-krolestwo', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Małe królestwo',
  description:
    'Turowa strategia bez limitu czasu. Rozwijaj osadę, pomagaj mieszkańcom i odkrywaj przyjaznych oraz wrogich sąsiadów. Buduj koszary, rekrutuj wojsko, wybieraj taktykę lub rozejm. Osada zapisuje się lokalnie.',
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
