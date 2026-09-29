import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Browser-specific installation flow shared by modules which opt in to PWA. */
export function usePwaInstall() {
  const prompt = ref<InstallPromptEvent | null>(null)
  const isInstalled = ref(false)
  const isIos = ref(false)
  const canOfferInstall = computed(() => !isInstalled.value && (!!prompt.value || isIos.value))
  const receivePrompt = (event: Event) => { event.preventDefault(); prompt.value = event as InstallPromptEvent }
  const installed = () => { isInstalled.value = true; prompt.value = null }
  const install = async () => {
    if (!prompt.value) return false
    await prompt.value.prompt()
    if ((await prompt.value.userChoice).outcome === 'accepted') prompt.value = null
    return true
  }
  onMounted(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    isInstalled.value = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
    isIos.value = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    window.addEventListener('beforeinstallprompt', receivePrompt)
    window.addEventListener('appinstalled', installed)
  })
  onBeforeUnmount(() => { window.removeEventListener('beforeinstallprompt', receivePrompt); window.removeEventListener('appinstalled', installed) })
  return { canOfferInstall, isIos, install }
}
