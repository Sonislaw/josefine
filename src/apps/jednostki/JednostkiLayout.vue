<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { ArrowUpRight, Download, Share2, X } from '@lucide/vue'
import { RouterLink, RouterView } from 'vue-router'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import PwaInstallHint from '@/shared/components/PwaInstallHint.vue'
import { jednostkiPath } from './seo/useJednostkiSeo'

const { canOfferInstall, isIos, install } = usePwaInstall()
const showIosInstructions = ref(false)

async function installApp() {
  if (isIos.value) showIosInstructions.value = !showIosInstructions.value
  else await install()
}

useHead({
  htmlAttrs: { lang: 'pl' },
  link: [{ rel: 'manifest', href: '/manifest.webmanifest' }],
  meta: [{ name: 'theme-color', content: '#142958' }],
})

onMounted(() => {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/sw.js')
  }
})
</script>

<template>
  <div class="jednostki-app">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink :to="jednostkiPath('/')" class="brand" aria-label="Jednostki — strona główna">
          <span class="brand-mark" aria-hidden="true">↔</span>
          <span><strong>jednostki</strong><small>przeliczniki online</small></span>
        </RouterLink>
        <div class="header-actions">
          <RouterLink :to="jednostkiPath('/')" class="browse-link">Wszystkie narzędzia <ArrowUpRight :size="17" aria-hidden="true" /></RouterLink>
          <PwaInstallHint v-if="canOfferInstall">
            <button type="button" class="install-button" aria-label="Dodaj do ekranu głównego" @click="installApp"><Download :size="16" aria-hidden="true" /> Dodaj do ekranu</button>
          </PwaInstallHint>
        </div>
      </div>
      <div v-if="showIosInstructions" class="ios-instructions" role="status">
        <span>W Safari wybierz <Share2 :size="16" aria-hidden="true" /> <strong>Udostępnij</strong>, a następnie <strong>Dodaj do ekranu początkowego</strong>.</span>
        <button type="button" aria-label="Zamknij wskazówkę" @click="showIosInstructions = false"><X :size="18" /></button>
      </div>
    </header>

    <main class="site-main"><RouterView :key="$route.path" /></main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div><strong>jednostki</strong><p>Małe obliczenia. Dużo jasności.</p></div>
        <nav aria-label="Linki w stopce"><RouterLink :to="jednostkiPath('/')">Przeliczniki</RouterLink><RouterLink :to="jednostkiPath('/polityka-prywatnosci')">Polityka prywatności</RouterLink></nav>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.jednostki-app { min-height: 100vh; display: flex; flex-direction: column; background: #f6f7fb; color: #172447; }
.site-header { position: relative; z-index: 10; background: #fff; border-bottom: 1px solid #e3e8f2; }
.header-inner, .footer-inner { width: min(100% - 2.5rem, 1280px); margin-inline: auto; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.header-inner { min-height: 86px; }
.brand { display: inline-flex; align-items: center; gap: .8rem; color: inherit; text-decoration: none; }
.brand-mark { display: grid; place-items: center; width: 47px; height: 47px; border-radius: 14px; background: #172f67; color: white; font-size: 31px; font-weight: 700; line-height: 1; box-shadow: 0 5px 14px #14295829; }
.brand strong { display: block; font-family: var(--font-heading); font-size: 1.25rem; line-height: 1.1; letter-spacing: -.05em; }
.brand small { display: block; margin-top: .2rem; color: #65718b; font-size: .67rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.header-actions { display: flex; align-items: center; gap: 1.5rem; }
.browse-link, .install-button { display: inline-flex; align-items: center; gap: .4rem; color: #233866; font-size: .875rem; font-weight: 700; text-decoration: none; }
.browse-link:hover { color: #586fe1; }
.install-button { padding: .65rem .85rem; border: 1px solid #d5dcf0; border-radius: 11px; background: white; cursor: pointer; }
.install-button:hover { background: #f4f5ff; }
.ios-instructions { position: absolute; right: max(1.25rem, calc((100vw - 1280px) / 2)); top: calc(100% + .5rem); display: flex; align-items: center; gap: 1rem; width: min(360px, calc(100vw - 2.5rem)); padding: 1rem; border: 1px solid #d5dcf0; border-radius: 14px; background: white; box-shadow: 0 18px 40px #14295824; font-size: .875rem; }
.ios-instructions span svg { display: inline-block; vertical-align: middle; }
.ios-instructions button { align-self: flex-start; padding: .2rem; border: 0; background: transparent; cursor: pointer; }
.site-main { flex: 1; }
.site-footer { margin-top: 5rem; border-top: 1px solid #e3e8f2; background: white; }
.footer-inner { align-items: flex-start; padding-block: 2.5rem; }
.footer-inner strong { font-family: var(--font-heading); font-size: 1.15rem; }
.footer-inner p { margin-top: .35rem; color: #69758e; font-size: .85rem; }
.footer-inner nav { display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: .85rem; }
.footer-inner nav a { color: #495877; text-decoration: none; }
.footer-inner nav a:hover { color: #586fe1; text-decoration: underline; }
@media (max-width: 640px) { .header-inner { min-height: 76px; } .browse-link { display: none; } .install-button { font-size: 0; gap: 0; } .install-button svg { width: 18px; height: 18px; } .footer-inner { flex-direction: column; } }
</style>
