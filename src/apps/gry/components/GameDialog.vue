<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
let previous: HTMLElement | null = null
onMounted(() => {
  previous = document.activeElement as HTMLElement
  dialog.value?.showModal()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  previous?.focus()
})
</script>
<template>
  <dialog
    ref="dialog"
    class="game-dialog"
    aria-labelledby="game-dialog-title"
    @cancel.prevent="emit('close')"
    @click="$event.target === dialog && emit('close')"
  >
    <div class="dialog-body">
      <button class="dialog-close" type="button" aria-label="Zamknij" @click="emit('close')">
        ×
      </button>
      <h2 id="game-dialog-title">{{ title }}</h2>
      <slot />
    </div>
  </dialog>
</template>
<style scoped>
.game-dialog {
  padding: 0;
  width: min(530px, calc(100% - 30px));
  max-height: calc(100dvh - 40px);
  margin: auto;
  color: #e9ecde;
  background: #18251f;
  border: 1px solid #40503d;
  border-radius: 14px;
  font:
    14px/1.7 system-ui,
    sans-serif;
}
.game-dialog::backdrop {
  background: #050d0acf;
  backdrop-filter: blur(5px);
}
.dialog-body {
  padding: 30px;
}
h2 {
  font-size: 25px;
  line-height: 1.2;
  margin: 12px 30px 24px 0;
  letter-spacing: -0.04em;
}
.dialog-close {
  position: absolute;
  right: 15px;
  top: 10px;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 0;
  color: #e9ecde;
  font-size: 27px;
  cursor: pointer;
}
:deep(p),
:deep(ul) {
  margin: 16px 0;
}
:deep(li) {
  margin: 8px 0;
}
:deep(button:focus-visible) {
  outline: 3px solid #d5ef89;
  outline-offset: 3px;
}
</style>
