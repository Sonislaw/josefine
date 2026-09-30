<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { Download, Share2, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { pracaPath } from './seo/usePracaSeo'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import pracaLogo from './assets/praca-logo.svg'
const { canOfferInstall, isIos, install } = usePwaInstall()
const showIosInstructions = ref(false)
const installApp = async () => {
  if (isIos.value) showIosInstructions.value = !showIosInstructions.value
  else await install()
}
useHead({
  htmlAttrs: { lang: 'pl' },
  link: [
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'apple-touch-icon', href: '/pwa/praca-icon.svg' },
  ],
  meta: [{ name: 'theme-color', content: '#123b2d' }],
})
onMounted(() => {
  if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js')
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#f7f8f6] text-[#19251f]">
    <header class="relative border-b border-[#e1e7e2] bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <RouterLink :to="pracaPath('/')" class="flex items-center gap-2.5 font-bold tracking-tight"
          ><img :src="pracaLogo" alt="" class="size-10" /><span
            >Praca<span class="text-[#25815c]">NaRękę</span></span
          ></RouterLink
        ><button
          v-if="canOfferInstall"
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d9e1db] px-3 text-sm font-semibold text-[#405348]"
          @click="installApp"
        >
          <Download class="size-4" /><span class="hidden sm:inline">Dodaj do ekranu</span>
        </button>
      </div>
      <div
        v-if="showIosInstructions"
        role="status"
        class="absolute right-5 top-full z-50 mt-2 flex max-w-sm items-start gap-3 rounded-xl border border-[#e1e7e2] bg-white p-4 text-sm leading-6 shadow-xl"
      >
        <p>
          W Safari wybierz <Share2 class="inline size-4" /> <strong>Udostępnij</strong>, a następnie
          <strong>Dodaj do ekranu początkowego</strong>.
        </p>
        <button
          class="shrink-0"
          aria-label="Zamknij instrukcję"
          @click="showIosInstructions = false"
        >
          <X class="size-4" />
        </button>
      </div>
    </header>
    <main class="flex-1"><RouterView /></main>
    <footer class="border-t border-[#e1e7e2] bg-white">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#66736b] sm:flex-row sm:items-end sm:justify-between lg:px-8"
      >
        <div>
          <p class="font-bold text-[#19251f]">Praca<span class="text-[#25815c]">NaRękę</span></p>
          <p class="mt-2">Wyniki mają charakter szacunkowy i nie stanowią porady podatkowej.</p>
        </div>
        <RouterLink :to="pracaPath('/polityka-prywatnosci')">Polityka prywatności</RouterLink>
      </div>
    </footer>
  </div>
</template>
