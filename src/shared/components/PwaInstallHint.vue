<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from '@lucide/vue'

const isVisible = ref(false)
let hideTimer: number | undefined

function dismiss() {
  isVisible.value = false
  window.clearTimeout(hideTimer)
}

onMounted(() => {
  // The hint is client-only: SSR keeps the same markup for every viewport.
  if (!window.matchMedia('(max-width: 767px)').matches) return

  isVisible.value = true
  hideTimer = window.setTimeout(dismiss, 5_000)
})

onBeforeUnmount(() => window.clearTimeout(hideTimer))
</script>

<template>
  <div class="pwa-install-hint" @click="dismiss">
    <slot />
    <div v-if="isVisible" class="pwa-install-hint__bubble" role="status">
      <span>Miej pod ręką! Dodaj aplikację na telefon</span>
      <button
        type="button"
        class="pwa-install-hint__close"
        aria-label="Zamknij wskazówkę instalacji"
        @click.stop="dismiss"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pwa-install-hint {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  margin-left: auto;
}

.pwa-install-hint__bubble {
  position: absolute;
  z-index: 60;
  top: calc(100% + 10px);
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 194px;
  padding: 9px 8px 9px 11px;
  border: 1px solid #dce5df;
  border-radius: 11px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(20 40 32 / 14%);
  color: #20362d;
  font-family: system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
}

.pwa-install-hint__bubble::before {
  position: absolute;
  top: -5px;
  right: 13px;
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  border-top: 1px solid #dce5df;
  border-left: 1px solid #dce5df;
  background: #fff;
  content: '';
}

.pwa-install-hint__close {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: -3px -3px -3px 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #5e7168;
  cursor: pointer;
}

.pwa-install-hint__close:hover,
.pwa-install-hint__close:focus-visible {
  background: #edf3ee;
}

@media (min-width: 768px) {
  .pwa-install-hint__bubble {
    display: none;
  }
}
</style>
