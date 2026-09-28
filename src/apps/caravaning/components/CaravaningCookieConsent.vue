<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const measurementId = 'G-C3FLEN9P6J'
const storageKey = 'caravaning-cookie-consent'
const showBanner = ref(false)

const loadAnalytics = () => {
  if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return

  window.dataLayer = window.dataLayer || []
  function gtag(..._args: unknown[]) {
    window.dataLayer?.push(arguments)
  }
  window.gtag = gtag
  window.gtag('js', new Date())
  window.gtag('config', measurementId)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.dataset.gaId = measurementId
  document.head.appendChild(script)
}

const choose = (choice: 'accepted' | 'declined') => {
  localStorage.setItem(storageKey, choice)
  showBanner.value = false
  if (choice === 'accepted') loadAnalytics()
}

onMounted(() => {
  const savedChoice = localStorage.getItem(storageKey)
  if (savedChoice === 'accepted') loadAnalytics()
  else if (savedChoice !== 'declined') showBanner.value = true
})
</script>

<template>
  <aside
    v-if="showBanner"
    class="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/98 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] backdrop-blur"
    aria-label="Ustawienia plików cookie"
  >
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
        Używamy plików cookie analitycznych Google Analytics, aby rozumieć, jak działa serwis.
        Analityka uruchomi się wyłącznie po Twojej zgodzie. Szczegóły znajdziesz w
        <RouterLink :to="{ name: 'caravaning-privacy' }" class="font-medium text-primary underline underline-offset-4">polityce prywatności</RouterLink>.
      </p>
      <div class="flex shrink-0 flex-wrap gap-3">
        <button type="button" class="h-10 rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted" @click="choose('declined')">Odrzuć</button>
        <button type="button" class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90" @click="choose('accepted')">Akceptuję</button>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
declare global {
  interface Window {
    dataLayer?: IArguments[]
    gtag?: (...args: unknown[]) => void
  }
}
</script>
