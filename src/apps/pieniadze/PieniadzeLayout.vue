<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { Coins, Download, Share2, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { pieniadzePath } from './seo/usePieniadzeSeo'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import PwaInstallHint from '@/shared/components/PwaInstallHint.vue'
const { canOfferInstall, isIos, install } = usePwaInstall()
const showIos = ref(false)
const installApp = async () => {
  if (isIos.value) showIos.value = !showIos.value
  else await install()
}
useHead({
  htmlAttrs: { lang: 'pl' },
  link: [
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'apple-touch-icon', href: '/pwa/pieniadze-icon.svg' },
  ],
  meta: [{ name: 'theme-color', content: '#173b67' }],
})
onMounted(() => {
  if (import.meta.env.PROD && 'serviceWorker' in navigator)
    void navigator.serviceWorker.register('/sw.js')
})
</script>
<template>
  <div class="flex min-h-screen flex-col bg-[#f8fafc] text-[#172033]">
    <header class="relative border-b border-[#dce5f0] bg-[#fffefa]">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <RouterLink :to="pieniadzePath('/')" class="flex items-center gap-3 font-bold">
          <span
            class="grid size-11 place-items-center rounded-2xl bg-[#173b67] text-[#f8d66d] shadow-sm"
            ><Coins class="size-6" aria-hidden="true"
          /></span>
          <span class="grid leading-tight"
            ><strong class="font-heading text-lg tracking-tight"
              >Pieniądze<span class="text-[#c5a054]">.</span></strong
            ><small class="text-[.65rem] font-bold uppercase tracking-widest text-[#8093a2]"
              >kalkulatory na co dzień</small
            ></span
          >
        </RouterLink>
        <PwaInstallHint v-if="canOfferInstall">
          <button
            type="button"
            aria-label="Dodaj do ekranu głównego"
            class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dce5f0] px-3 text-sm font-semibold"
            @click="installApp"
          >
            <Download class="size-4" /><span class="hidden sm:inline">Dodaj do ekranu</span>
          </button>
        </PwaInstallHint>
      </div>
      <div
        v-if="showIos"
        class="absolute right-5 top-full z-50 mt-2 flex max-w-sm gap-3 rounded-xl border bg-white p-4 text-sm shadow-xl"
      >
        <p>
          W Safari wybierz <Share2 class="inline size-4" /> <strong>Udostępnij</strong>, a potem
          <strong>Dodaj do ekranu początkowego</strong>.
        </p>
        <button @click="showIos = false"><X class="size-4" /></button>
      </div>
    </header>
    <main class="flex-1"><RouterView /></main>
    <footer class="mt-16 border-t border-[#dce5f0] bg-white">
      <div
        class="mx-auto flex max-w-7xl justify-between gap-4 px-5 py-8 text-sm text-[#64748b] lg:px-8"
      >
        <span>Pieniądze — prostsza droga od kwoty do decyzji.</span
        ><RouterLink :to="pieniadzePath('/polityka-prywatnosci')">Polityka prywatności</RouterLink>
      </div>
    </footer>
  </div>
</template>
