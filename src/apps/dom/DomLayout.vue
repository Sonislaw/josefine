<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { ArrowUpRight, Download, House, Share2, X } from '@lucide/vue'
import { RouterLink, RouterView } from 'vue-router'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import PwaInstallHint from '@/shared/components/PwaInstallHint.vue'
import { domPath } from './seo/useDomSeo'

const { canOfferInstall, isIos, install } = usePwaInstall()
const showIosInstructions = ref(false)

async function installApp() {
  if (isIos.value) showIosInstructions.value = !showIosInstructions.value
  else await install()
}

useHead({
  htmlAttrs: { lang: 'pl' },
  link: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/pwa/dom-icon.svg' }],
  meta: [{ name: 'theme-color', content: '#244f3d' }],
})

onMounted(() => {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js')
})
</script>

<template>
  <div class="dom-app">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink :to="domPath('/')" class="brand" aria-label="Dom — strona główna">
          <span class="brand-mark"><House :size="25" :stroke-width="2.4" aria-hidden="true" /></span>
          <span><strong>dom<span class="brand-dot">.</span></strong><small>praktyczne kalkulatory</small></span>
        </RouterLink>
        <nav class="header-links" aria-label="Główna nawigacja"><RouterLink :to="domPath('/')">Wszystkie narzędzia <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink></nav>
        <PwaInstallHint v-if="canOfferInstall">
          <button type="button" class="install-button" aria-label="Dodaj do ekranu głównego" @click="installApp"><Download :size="17" aria-hidden="true" /> <span>Dodaj do ekranu</span></button>
        </PwaInstallHint>
      </div>
      <div v-if="showIosInstructions" class="ios-instructions" role="status"><span>W Safari wybierz <Share2 :size="16" aria-hidden="true" /> <strong>Udostępnij</strong>, a następnie <strong>Dodaj do ekranu początkowego</strong>.</span><button type="button" aria-label="Zamknij wskazówkę" @click="showIosInstructions = false"><X :size="18" /></button></div>
    </header>

    <main class="site-main"><RouterView :key="$route.path" /></main>

    <footer class="site-footer"><div class="footer-inner"><div class="footer-brand"><span class="footer-symbol"><House :size="21" aria-hidden="true" /></span><div><strong>dom.</strong><p>Mniej zgadywania. Więcej dobrych decyzji.</p></div></div><nav aria-label="Linki w stopce"><RouterLink :to="domPath('/')">Kalkulatory</RouterLink><RouterLink :to="domPath('/polityka-prywatnosci')">Polityka prywatności</RouterLink></nav></div></footer>
  </div>
</template>

<style scoped>
.dom-app { min-height: 100vh; display: flex; flex-direction: column; background: #faf8f3; color: #213a30; }
.site-header { position: relative; z-index: 10; border-bottom: 1px solid #e7e7dc; background: #fffefa; }
.header-inner, .footer-inner { width: min(100% - 2.5rem, 1280px); margin-inline: auto; display: flex; align-items: center; gap: 1.5rem; }
.header-inner { min-height: 82px; }
.brand { display: inline-flex; align-items: center; gap: .8rem; color: inherit; text-decoration: none; }
.brand-mark, .footer-symbol { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 15px; background: #275340; color: #fff8e8; }
.brand strong, .footer-brand strong { display: block; font-family: var(--font-heading); font-size: 1.42rem; font-weight: 800; letter-spacing: -.075em; line-height: 1; }
.brand-dot { color: #e3936d; }
.brand small { display: block; margin-top: .28rem; color: #829089; font-size: .64rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.header-links { margin-left: auto; }
.header-links a { display: inline-flex; align-items: center; gap: .3rem; color: #456154; font-size: .85rem; font-weight: 800; text-decoration: none; }
.header-links a:hover, .footer-inner a:hover { color: #bc694b; }
.install-button { display: inline-flex; align-items: center; gap: .5rem; padding: .7rem .85rem; border: 1px solid #cddcd0; border-radius: 11px; background: #f3f7ee; color: #26543e; font-size: .8rem; font-weight: 800; cursor: pointer; }
.install-button:hover { background: #e6f0df; }
.ios-instructions { position: absolute; right: max(1.25rem, calc((100vw - 1280px) / 2)); top: calc(100% + .5rem); display: flex; align-items: center; gap: 1rem; width: min(360px, calc(100vw - 2.5rem)); padding: 1rem; border: 1px solid #d4e0d3; border-radius: 14px; background: #fffefa; box-shadow: 0 18px 40px #213a3024; font-size: .85rem; }
.ios-instructions span svg { display: inline-block; vertical-align: middle; }
.ios-instructions button { align-self: flex-start; border: 0; background: transparent; cursor: pointer; }
.site-main { flex: 1; }
.site-footer { margin-top: 5rem; border-top: 1px solid #e0e5d9; background: #fffefa; }
.footer-inner { justify-content: space-between; padding-block: 2.5rem; }
.footer-brand { display: flex; align-items: center; gap: .8rem; }
.footer-symbol { width: 39px; height: 39px; border-radius: 12px; }
.footer-brand strong { font-size: 1.2rem; }
.footer-brand p { margin-top: .35rem; color: #77877e; font-size: .8rem; }
.footer-inner nav { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.footer-inner a { color: #52685c; font-size: .83rem; font-weight: 700; text-decoration: none; }
@media (max-width: 620px) { .header-links { display: none; } .install-button { margin-left: auto; } .install-button span { display: none; } .footer-inner { flex-direction: column; align-items: flex-start; } }
</style>
