<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DomCalculator from './DomCalculator.vue'
import DomPaintRoomCalculator from './DomPaintRoomCalculator.vue'

const route = useRoute()
const selectedMode = ref<'area' | 'room'>('area')
// One purchase choice follows the visitor when switching between area and room modes.
const canSize = ref('5')
const canPrice = ref('')

// SSG renders the simple mode for every URL; select query-dependent UI after hydration.
onMounted(() => {
  selectedMode.value = route.query.mode === 'room' ? 'room' : 'area'
})
watch(
  () => route.query.mode,
  (mode) => {
    selectedMode.value = mode === 'room' ? 'room' : 'area'
  },
)
</script>

<template>
  <section class="paint-mode" aria-labelledby="paint-mode-title">
    <div>
      <p class="eyebrow">JAK CHCESZ LICZYĆ?</p>
      <h2 id="paint-mode-title">Wybierz wygodny punkt startu</h2>
    </div>
    <div class="mode-options" role="group" aria-label="Sposób obliczenia farby">
      <button type="button" :aria-pressed="selectedMode === 'area'" @click="selectedMode = 'area'">
        Znam powierzchnię
      </button>
      <button type="button" :aria-pressed="selectedMode === 'room'" @click="selectedMode = 'room'">
        Mam wymiary pokoju
      </button>
    </div>
  </section>
  <div v-show="selectedMode === 'area'">
    <DomCalculator
      tool-id="ilosc-farby"
      v-model:paint-can-size="canSize"
      v-model:paint-can-price="canPrice"
    />
  </div>
  <div v-show="selectedMode === 'room'">
    <DomPaintRoomCalculator v-model:paint-can-size="canSize" v-model:paint-can-price="canPrice" />
  </div>
</template>

<style scoped>
.paint-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
  padding: 1.4rem 1.7rem;
  border: 1px solid #e2e8dc;
  border-radius: 20px;
  background: #fffefa;
}
.eyebrow {
  color: #b16b50;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
h2 {
  margin-top: 0.35rem;
  color: #2c513b;
  font-family: var(--font-heading);
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.mode-options {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0.3rem;
  border: 1px solid #dce6d7;
  border-radius: 14px;
  background: #f2f6ee;
}
.mode-options button {
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #5b7462;
  font: inherit;
  font-size: 0.81rem;
  font-weight: 800;
  cursor: pointer;
}
.mode-options button[aria-pressed='true'] {
  background: #28563f;
  box-shadow: 0 4px 10px #28563f26;
  color: #fff;
}
.mode-options button:focus-visible {
  outline: 2px solid #28563f;
  outline-offset: 2px;
}
@media (max-width: 700px) {
  .paint-mode {
    flex-direction: column;
    align-items: stretch;
    padding: 1.2rem;
  }
  .mode-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mode-options button {
    padding-inline: 0.55rem;
  }
}
@media (max-width: 380px) {
  .mode-options {
    grid-template-columns: 1fr;
  }
}
</style>
