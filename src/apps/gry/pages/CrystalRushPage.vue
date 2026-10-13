<script setup lang="ts">
import CrystalRushGame from '../games/crystal-rush/CrystalRushGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('jeszcze-jeden-krysztal', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Jeszcze jeden kryształ',
  description:
    'Zręcznościowa gra przeglądarkowa: zbieraj kryształy, unikaj niekończącego się napływu meteorów i pobij własny rekord.',
  url: new URL(gryPath('/jeszcze-jeden-krysztal'), grySiteUrl).href,
  inLanguage: 'pl',
  gamePlatform: 'Web browser',
  genre: 'Arcade',
  playMode: 'SinglePlayer',
  numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
  isAccessibleForFree: true,
})
</script>
<template><CrystalRushGame /></template>
