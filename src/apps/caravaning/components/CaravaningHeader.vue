<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Caravan, Download, Share2, X } from '@lucide/vue'
import { Button } from '@/apps/caravaning/components/ui/button'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const installPrompt = ref<InstallPromptEvent | null>(null)
const isInstalled = ref(false)
const isIos = ref(false)
const showIosInstructions = ref(false)
const canOfferInstall = computed(() => !isInstalled.value && (!!installPrompt.value || isIos.value))

const onBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  installPrompt.value = event as InstallPromptEvent
}

const onAppInstalled = () => {
  isInstalled.value = true
  installPrompt.value = null
}

const installApp = async () => {
  if (!installPrompt.value) {
    showIosInstructions.value = !showIosInstructions.value
    return
  }

  const prompt = installPrompt.value
  await prompt.prompt()
  const choice = await prompt.userChoice

  if (choice.outcome === 'accepted') {
    installPrompt.value = null
  }
}

onMounted(() => {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean }
  isInstalled.value =
    window.matchMedia('(display-mode: standalone)').matches || standaloneNavigator.standalone === true
  isIos.value =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <RouterLink to="/karawaning/" class="flex items-center gap-2.5">
        <span
          class="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <Caravan class="size-5" aria-hidden="true" />
        </span>
        <span class="font-heading text-base font-bold tracking-normal text-foreground">
          Caravaning <span class="font-medium text-muted-foreground">Tools</span>
        </span>
      </RouterLink>

      <Button
        v-if="canOfferInstall"
        variant="outline"
        size="sm"
        aria-label="Dodaj do ekranu głównego"
        title="Dodaj do ekranu głównego"
        @click="installApp"
      >
        <Download class="size-4" aria-hidden="true" />
        <span class="hidden sm:inline">Dodaj do ekranu głównego</span>
      </Button>
    </div>

    <div
      v-if="showIosInstructions"
      role="status"
      class="absolute right-4 top-full mt-2 flex max-w-sm items-start gap-3 border border-border bg-background p-4 text-sm leading-6 shadow-lg sm:right-6 lg:right-8"
    >
      <p>
        W Safari wybierz <Share2 class="inline size-4 align-text-bottom" aria-hidden="true" />
        <strong>Udostępnij</strong>, a następnie <strong>Dodaj do ekranu początkowego</strong>.
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        class="shrink-0"
        aria-label="Zamknij instrukcję instalacji"
        @click="showIosInstructions = false"
      >
        <X class="size-4" aria-hidden="true" />
      </Button>
    </div>
  </header>
</template>
