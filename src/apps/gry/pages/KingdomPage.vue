<script setup lang="ts">
import KingdomGame from '../games/little-kingdom/KingdomGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('male-krolestwo', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Małe królestwo',
  description:
    'Turowa strategia bez limitu czasu. Rozwijaj osadę i odkrywaj wielu wrogich sąsiadów. Rekrutuj wojsko, grab skarbce, uszkadzaj zamki aż do trwałych zgliszczy albo negocjuj pokój. Osada zapisuje się lokalnie.',
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
