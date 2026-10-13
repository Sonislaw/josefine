<script setup lang="ts">
import LighthouseGame from '../games/last-lighthouse/LighthouseGame.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('ostatnia-latarnia', {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Ostatnia latarnia',
  description:
    'Przetrwaj noc na wyspie, łącz automatyczne bronie i pokonaj bossa. Survival na telefon i komputer z odblokowywaniem bohaterów.',
  url: new URL(gryPath('/ostatnia-latarnia'), grySiteUrl).href,
  inLanguage: 'pl',
  gamePlatform: 'Web browser',
  genre: 'Survival action',
  playMode: 'SinglePlayer',
  numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
  isAccessibleForFree: true,
})
</script>
<template><LighthouseGame /></template>
