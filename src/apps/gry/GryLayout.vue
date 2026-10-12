<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { RouterLink, RouterView } from 'vue-router'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import PwaInstallHint from '@/shared/components/PwaInstallHint.vue'
import { gryPath } from './seo/useGrySeo'
const { canOfferInstall, isIos, install } = usePwaInstall()
const showIos = ref(false)
useHead({
  htmlAttrs: { lang: 'pl' },
  meta: [{ name: 'theme-color', content: '#101918' }],
  link: [{ rel: 'manifest', href: '/manifest.webmanifest' }],
})
onMounted(() => {
  if (import.meta.env.PROD && 'serviceWorker' in navigator)
    void navigator.serviceWorker.register('/sw.js').catch(() => {})
})
async function installApp() {
  if (isIos.value) showIos.value = !showIos.value
  else await install()
}
</script>
<template>
  <div class="gry-app">
    <header class="gry-header">
      <RouterLink :to="gryPath('/')" class="gry-brand"
        ><img src="/pwa/gry-icon.svg" width="35" height="35" alt="" /><span
          >gry<span class="brand-dot">.</span><small>ZGRANA</small></span
        ></RouterLink
      >
      <nav aria-label="Nawigacja gier">
        <RouterLink :to="gryPath('/')">Wszystkie gry ↗</RouterLink>
      </nav>
      <PwaInstallHint v-if="canOfferInstall"
        ><button
          class="install"
          type="button"
          aria-label="Dodaj aplikację Gry na telefon"
          @click="installApp"
        >
          ↓ <span>Dodaj aplikację</span>
        </button></PwaInstallHint
      >
      <div v-if="showIos" class="ios-note" role="status">
        W Safari wybierz Udostępnij → Dodaj do ekranu początkowego.<button
          type="button"
          aria-label="Zamknij instrukcję"
          @click="showIos = false"
        >
          ×
        </button>
      </div>
    </header>
    <main><RouterView /></main>
    <footer class="gry-footer">
      <RouterLink :to="gryPath('/')">◈ Gry / Zgrana</RouterLink><span>Małe gry. Duża frajda.</span
      ><RouterLink :to="gryPath('/polityka-prywatnosci')">Polityka prywatności</RouterLink>
    </footer>
  </div>
</template>
<style scoped>
.gry-app {
  min-height: 100vh;
  background: #101918;
  color: #e9ecde;
}
.gry-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 25px;
  padding: 14px 5%;
  border-bottom: 1px solid #2b3731;
}
.gry-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e9ecde;
  text-decoration: none;
  font-size: 27px;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.05em;
}
.brand-dot {
  color: #d5ef89;
}
.gry-brand small {
  display: block;
  font-size: 8px;
  letter-spacing: 0.22em;
  margin-top: 5px;
  color: #a4b0a5;
}
nav {
  margin-left: auto;
}
nav a {
  font-size: 12px;
  text-decoration: none;
  color: #d5ef89;
}
.install {
  background: #223024;
  border: 1px solid #40503d;
  color: #d5ef89;
  padding: 8px 12px;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
}
.ios-note {
  position: absolute;
  right: 5%;
  top: 100%;
  max-width: 300px;
  padding: 18px;
  background: #26362e;
  border: 1px solid #40503d;
  border-radius: 10px;
  z-index: 20;
  font-size: 13px;
}
.ios-note button {
  padding: 4px 10px;
  float: right;
}
.gry-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 30px 5% 85px;
  border-top: 1px solid #2b3731;
  color: #a4b0a5;
  font-size: 12px;
}
.gry-footer a {
  text-decoration: none;
  color: #c7d4b3;
}
@media (max-width: 560px) {
  .gry-header {
    gap: 14px;
    padding-inline: 15px;
  }
  .install span {
    display: none;
  }
  .gry-footer {
    flex-wrap: wrap;
    padding-inline: 15px;
  }
  .gry-footer > span {
    display: none;
  }
}
</style>
