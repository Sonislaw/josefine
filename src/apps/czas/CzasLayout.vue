<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { Download, Share2, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { czasPath } from './seo/useCzasSeo'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
const { canOfferInstall, isIos, install } = usePwaInstall(); const ios = ref(false)
const installApp = async () => { if (isIos.value) ios.value = !ios.value; else await install() }
useHead({ htmlAttrs: { lang: 'pl' }, link: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/pwa/czas-icon.svg' }], meta: [{ name: 'theme-color', content: '#4b3d92' }] })
onMounted(() => { if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js') })
</script>
<template><div class="flex min-h-screen flex-col bg-[#f7f8fc] text-[#241f3e]"><header class="relative border-b border-[#e3dff2] bg-white"><div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><RouterLink :to="czasPath('/')" class="flex items-center gap-2.5 font-bold"><span class="grid size-10 place-items-center rounded-xl bg-[#4b3d92] text-lg text-white">◷</span><span>Czas</span></RouterLink><button v-if="canOfferInstall" class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e3dff2] px-3 text-sm font-semibold" @click="installApp"><Download class="size-4"/><span class="hidden sm:inline">Dodaj do ekranu</span></button></div><div v-if="ios" class="absolute right-5 top-full z-50 mt-2 flex max-w-sm gap-3 rounded-xl border bg-white p-4 text-sm shadow-xl"><p>W Safari wybierz <Share2 class="inline size-4"/> <strong>Udostępnij</strong>, potem <strong>Dodaj do ekranu początkowego</strong>.</p><button @click="ios=false"><X class="size-4"/></button></div></header><main class="flex-1"><RouterView/></main><footer class="mt-16 border-t border-[#e3dff2] bg-white"><div class="mx-auto max-w-7xl px-5 py-8 text-sm text-[#6b6682] lg:px-8">Czas — proste kalkulatory dat, godzin i minut.</div></footer></div></template>
