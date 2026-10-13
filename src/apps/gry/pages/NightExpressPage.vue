<script setup lang="ts">
import NightExpressGame from '../games/night-express/NightExpressGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('nocny-ekspres', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Nocny ekspres',
  description:
    'Buduj sieć kolejową, kieruj pociągami i przewoź pasażerów przez rosnące nocne miasto. Gra logistyczna na telefon i komputer.',
  url: new URL(gryPath('/nocny-ekspres'), grySiteUrl).href,
  inLanguage: 'pl',
  gamePlatform: 'Web browser',
  genre: 'Logistics strategy',
  playMode: 'SinglePlayer',
  numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
  isAccessibleForFree: true,
})
</script>
<template><NightExpressGame /></template>
