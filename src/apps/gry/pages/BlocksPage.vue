<script setup lang="ts">
import BlocksGame from '../games/blocks/BlocksGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('klocki', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Klocki — jeszcze jeden ruch',
  description:
    'Układaj kształty na planszy 8×8, kasuj linie i buduj serie. Gra logiczna bez limitu czasu z lokalnym zapisem rundy.',
  url: new URL(gryPath('/klocki'), grySiteUrl).href,
  inLanguage: 'pl',
  gamePlatform: 'Web browser',
  genre: 'Puzzle',
  playMode: 'SinglePlayer',
  numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
  isAccessibleForFree: true,
})
</script>
<template><BlocksGame /></template>
