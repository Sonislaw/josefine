<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { RouterLink } from 'vue-router'
import PracaCookieConsent from './components/PracaCookieConsent.vue'
import { pracaPath } from './seo/usePracaSeo'
useHead({ htmlAttrs: { lang: 'pl' } })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#f7f8f6] text-[#19251f]">
    <header class="border-b border-[#e1e7e2] bg-white"><div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><RouterLink :to="pracaPath('/')" class="font-bold tracking-tight">Praca<span class="text-[#25815c]">NaRękę</span></RouterLink><nav class="flex gap-4 text-sm font-medium text-[#405348]"><RouterLink :to="pracaPath('/ile-na-reke-uop')">UoP</RouterLink><RouterLink :to="pracaPath('/ile-na-reke-b2b')">B2B</RouterLink><RouterLink :to="pracaPath('/b2b-vs-uop')">B2B vs UoP</RouterLink></nav></div></header>
    <main class="flex-1"><RouterView /></main>
    <footer class="mt-16 border-t border-[#e1e7e2] bg-white"><div class="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#66736b] sm:flex-row sm:items-end sm:justify-between lg:px-8"><div><p class="font-bold text-[#19251f]">Praca<span class="text-[#25815c]">NaRękę</span></p><p class="mt-2">Wyniki mają charakter szacunkowy i nie stanowią porady podatkowej.</p></div><RouterLink :to="pracaPath('/polityka-prywatnosci')">Polityka prywatności</RouterLink></div></footer>
    <PracaCookieConsent />
  </div>
</template>
