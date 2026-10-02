<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Check, Copy, TriangleAlert } from '@lucide/vue'

const props = defineProps<{ getUrl: () => string; disabled?: boolean }>()
const status = ref<'idle' | 'copied' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | undefined

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}

async function copyLink() {
  if (props.disabled) return
  const url = props.getUrl()
  let copied = false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      copied = true
    }
  } catch {
    // A denied Clipboard API permission may still allow the legacy copy fallback.
  }
  if (!copied) {
    try {
      copied = fallbackCopy(url)
    } catch {
      copied = false
    }
  }
  status.value = copied ? 'copied' : 'error'
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    status.value = 'idle'
  }, 3500)
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <button class="share-result-button" type="button" :disabled="disabled" @click="copyLink">
    <Check v-if="status === 'copied'" :size="17" aria-hidden="true" />
    <TriangleAlert v-else-if="status === 'error'" :size="17" aria-hidden="true" />
    <Copy v-else :size="17" aria-hidden="true" />
    <span aria-live="polite">{{
      status === 'copied'
        ? 'Link skopiowany do schowka'
        : status === 'error'
          ? 'Nie udało się skopiować'
          : 'Kopiuj link do wyniku'
    }}</span>
  </button>
</template>

<style scoped>
.share-result-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  max-width: 100%;
  padding: 0.55rem 0.8rem;
  border: 1px solid currentColor;
  border-radius: 0.7rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  line-height: 1.3;
  cursor: pointer;
}
.share-result-button:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.1);
}
.share-result-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
.share-result-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
