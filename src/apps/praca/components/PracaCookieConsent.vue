<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { pracaPath } from '../seo/usePracaSeo'

const key = 'praca-cookie-consent'
const measurementId = 'G-NEDF1WH6RC'
const visible = ref(false)
const loadAnalytics = () => {
  if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return
  const analyticsWindow = window as typeof window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
  analyticsWindow.dataLayer ??= []
  analyticsWindow.gtag = (...args) => analyticsWindow.dataLayer?.push(args)
  analyticsWindow.gtag('js', new Date())
  analyticsWindow.gtag('config', measurementId)
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.dataset.gaId = measurementId
  document.head.appendChild(script)
}
const choose = (value: 'accepted' | 'declined') => { localStorage.setItem(key, value); visible.value = false; if (value === 'accepted') loadAnalytics() }
onMounted(() => { const saved = localStorage.getItem(key); if (saved === 'accepted') loadAnalytics(); else visible.value = !saved })
</script>

<template>
  <aside v-if="visible" class="fixed inset-x-0 bottom-0 z-[100] border-t border-[#d9e1db] bg-white/95 shadow-lg backdrop-blur" aria-label="Ustawienia plików cookie">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
      <p class="max-w-3xl text-sm leading-6 text-[#66736b]">Używamy opcjonalnych plików cookie analitycznych. Szczegóły znajdziesz w <RouterLink :to="pracaPath('/polityka-prywatnosci')" class="font-medium text-[#17613f] underline">polityce prywatności</RouterLink>.</p>
      <div class="flex shrink-0 gap-3"><button class="h-10 rounded-lg border border-[#d9e1db] px-4 text-sm" @click="choose('declined')">Odrzuć</button><button class="h-10 rounded-lg bg-[#17613f] px-4 text-sm font-semibold text-white" @click="choose('accepted')">Akceptuję</button></div>
    </div>
  </aside>
</template>
