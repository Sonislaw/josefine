<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { ModuleId } from '@/apps/registry'

const route = useRoute()
const moduleId = computed(() => route.meta.moduleId as ModuleId | undefined)
const privacyPath = computed(() => {
  if (!moduleId.value) return null

  // The matched parent route already knows whether this site uses a clean
  // subdomain path or a prefixed development path (including /karawaning).
  const moduleRoot = route.matched.find((record) => record.meta.moduleId === moduleId.value)?.path
  if (!moduleRoot) return null

  return `${moduleRoot === '/' ? '' : moduleRoot.replace(/\/$/, '')}/polityka-prywatnosci`
})

const ready = ref(false)
const dismissed = ref(false)

function storageKey(id: ModuleId): string {
  // Per-module keys keep local development apps independent on one origin.
  return `josefine:cookie-notice:dismissed:${id}`
}

function restoreDismissal(): void {
  if (!moduleId.value) {
    dismissed.value = false
    return
  }

  try {
    dismissed.value = window.localStorage.getItem(storageKey(moduleId.value)) === '1'
  } catch {
    // Private browsing/storage restrictions must not prevent showing the notice.
    dismissed.value = false
  }
}

function closeNotice(): void {
  dismissed.value = true
  if (!moduleId.value) return

  try {
    window.localStorage.setItem(storageKey(moduleId.value), '1')
  } catch {
    // The notice can still be closed for this page even without storage access.
  }
}

// Reading localStorage only after mount keeps SSG and hydration deterministic.
onMounted(() => {
  restoreDismissal()
  ready.value = true
})
watch(moduleId, () => {
  if (ready.value) restoreDismissal()
})
</script>

<template>
  <aside
    v-if="ready && moduleId && privacyPath && !dismissed"
    class="cookie-notice"
    aria-label="Informacja o plikach cookie"
  >
    <div class="cookie-notice__inner">
      <p>
        Korzystamy z plików cookie i Google Analytics do analizy ruchu. Szczegóły znajdziesz w
        <RouterLink :to="privacyPath">polityce prywatności</RouterLink>.
      </p>
      <button type="button" @click="closeNotice">Akceptuję</button>
    </div>
  </aside>
</template>

<style scoped>
.cookie-notice {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 100;
  border-top: 1px solid #dce3e8;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 -5px 24px rgba(20, 35, 50, 0.08);
  color: #344054;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.45;
}
.cookie-notice__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1280px;
  margin-inline: auto;
  padding: 0.65rem 1.25rem calc(0.65rem + env(safe-area-inset-bottom));
}
.cookie-notice p {
  margin: 0;
}
.cookie-notice a {
  color: #1c5d74;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.cookie-notice a:hover {
  color: #0f3d52;
}
.cookie-notice button {
  flex: none;
  min-height: 36px;
  padding: 0.4rem 0.85rem;
  border: 1px solid #1c5d74;
  border-radius: 8px;
  background: #1c5d74;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  white-space: nowrap;
}
.cookie-notice button:hover {
  background: #0f3d52;
}
.cookie-notice :focus-visible {
  outline: 2px solid #1c5d74;
  outline-offset: 3px;
}
</style>
