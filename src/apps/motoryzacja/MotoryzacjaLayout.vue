<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { ArrowUpRight, CarFront, Download, Share2, X } from '@lucide/vue'
import { RouterLink, RouterView } from 'vue-router'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import PwaInstallHint from '@/shared/components/PwaInstallHint.vue'
import { motoryzacjaPath } from './seo/useMotoryzacjaSeo'

const { canOfferInstall, isIos, install } = usePwaInstall()
const showIosInstructions = ref(false)

async function installApp() {
  if (isIos.value) showIosInstructions.value = !showIosInstructions.value
  else await install()
}

useHead({
  htmlAttrs: { lang: 'pl' },
  link: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/pwa/motoryzacja-icon.svg' }],
  meta: [{ name: 'theme-color', content: '#14313d' }],
})

onMounted(() => {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js')
})
</script>

<template>
  <div class="moto-app">
    <header class="site-header"><div class="header-inner"><RouterLink :to="motoryzacjaPath('/')" class="brand" aria-label="Motoryzacja — strona główna"><span class="brand-mark"><CarFront :size="27" :stroke-width="2.25" aria-hidden="true" /></span><span><strong>motoryzacja<span>.</span></strong><small>kalkulatory kierowcy</small></span></RouterLink><nav class="header-nav" aria-label="Główna nawigacja"><RouterLink :to="motoryzacjaPath('/')">Wszystkie narzędzia <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink></nav><PwaInstallHint v-if="canOfferInstall"><button type="button" class="install-button" aria-label="Dodaj do ekranu głównego" @click="installApp"><Download :size="17" aria-hidden="true" /><span>Dodaj do ekranu</span></button></PwaInstallHint></div><div v-if="showIosInstructions" class="ios-instructions" role="status"><span>W Safari wybierz <Share2 :size="16" aria-hidden="true" /> <strong>Udostępnij</strong>, a potem <strong>Dodaj do ekranu początkowego</strong>.</span><button type="button" aria-label="Zamknij wskazówkę" @click="showIosInstructions = false"><X :size="18" /></button></div></header>
    <main class="site-main"><RouterView :key="$route.path" /></main>
    <footer class="site-footer"><div class="footer-inner"><div class="footer-brand"><span class="footer-mark"><CarFront :size="21" aria-hidden="true" /></span><div><strong>motoryzacja.</strong><p>Lepszy plan na każdy kilometr.</p></div></div><nav aria-label="Linki w stopce"><RouterLink :to="motoryzacjaPath('/')">Kalkulatory</RouterLink><RouterLink :to="motoryzacjaPath('/polityka-prywatnosci')">Polityka prywatności</RouterLink></nav></div></footer>
  </div>
</template>

<style scoped>
.moto-app { min-height: 100vh; display: flex; flex-direction: column; background: #f5f8f4; color: #18333b; }
.site-header { position: relative; z-index: 10; border-bottom: 1px solid #dde9e0; background: #fcfefb; }
.header-inner, .footer-inner { width: min(100% - 2.5rem, 1280px); margin-inline: auto; display: flex; align-items: center; gap: 1.5rem; }
.header-inner { min-height: 84px; }
.brand { display: inline-flex; align-items: center; gap: .8rem; color: inherit; text-decoration: none; }
.brand-mark, .footer-mark { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 15px; background: #163845; color: #d5f498; }
.brand strong, .footer-brand strong { display: block; font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; letter-spacing: -.065em; line-height: 1.1; }
.brand strong span { color: #e9956e; }
.brand small { display: block; margin-top: .28rem; color: #7d9289; font-size: .64rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.header-nav { margin-left: auto; }
.header-nav a { display: inline-flex; align-items: center; gap: .3rem; color: #48645a; font-size: .83rem; font-weight: 800; text-decoration: none; }
.header-nav a:hover, .footer-inner a:hover { color: #c47755; }
.install-button { display: inline-flex; align-items: center; gap: .5rem; padding: .7rem .85rem; border: 1px solid #c8dcd2; border-radius: 10px; background: #eef8ee; color: #28514c; font-size: .79rem; font-weight: 800; cursor: pointer; }
.install-button:hover { background: #dff1df; }
.ios-instructions { position: absolute; right: max(1.25rem, calc((100vw - 1280px) / 2)); top: calc(100% + .5rem); display: flex; align-items: center; gap: 1rem; width: min(360px, calc(100vw - 2.5rem)); padding: 1rem; border: 1px solid #d4e3d8; border-radius: 14px; background: #fcfefb; box-shadow: 0 18px 40px #14313d29; font-size: .84rem; }
.ios-instructions span svg { display: inline-block; vertical-align: middle; }
.ios-instructions button { align-self: flex-start; border: 0; background: transparent; cursor: pointer; }
.site-main { flex: 1; }
.site-footer { margin-top: 5rem; border-top: 1px solid #dce9df; background: #fcfefb; }
.footer-inner { justify-content: space-between; padding-block: 2.6rem; }
.footer-brand { display: flex; align-items: center; gap: .75rem; }
.footer-mark { width: 40px; height: 40px; border-radius: 12px; }
.footer-brand strong { font-size: 1.08rem; }
.footer-brand p { margin-top: .3rem; color: #779086; font-size: .78rem; }
.footer-inner nav { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.footer-inner a { color: #57746b; font-size: .82rem; font-weight: 700; text-decoration: none; }
@media (max-width: 650px) { .header-nav { display: none; } .install-button { margin-left: auto; } .install-button span { display: none; } .footer-inner { flex-direction: column; align-items: flex-start; } }
</style>
