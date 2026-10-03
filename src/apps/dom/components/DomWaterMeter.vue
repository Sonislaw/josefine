<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownToLine, Droplets } from '@lucide/vue'
import { parseDomNumber } from '../lib/calculations'
import { calculateMeterUsage } from '../lib/practical'

const previous = defineModel<string>('previous', { required: true })
const current = defineModel<string>('current', { required: true })
const emit = defineEmits<{ useVolume: [volume: number] }>()
const usage = computed(() => calculateMeterUsage(previous.value, current.value))
const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function applyUsage() {
  if (usage.value !== null) emit('useVolume', usage.value)
}
</script>

<template>
  <section class="practical-panel" aria-labelledby="water-meter-title">
    <div class="panel-title">
      <span class="panel-icon"><Droplets :size="21" aria-hidden="true" /></span>
      <div>
        <p>MASZ ODCZYTY?</p>
        <h3 id="water-meter-title">Policz zużycie z wodomierza</h3>
      </div>
    </div>
    <p class="intro">
      Nie musisz odejmować wskazań ręcznie. Podaj poprzedni i aktualny odczyt, a następnie przenieś
      zużycie do wybranego wariantu kalkulatora kosztu powyżej.
    </p>
    <div class="meter-grid">
      <div class="meter-fields">
        <label for="meter-previous">Poprzedni odczyt</label>
        <span class="input-wrap"
          ><input
            id="meter-previous"
            v-model="previous"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="previous !== '' && parseDomNumber(previous) === null"
          /><small>m³</small></span
        >
        <label for="meter-current">Aktualny odczyt</label>
        <span class="input-wrap"
          ><input
            id="meter-current"
            v-model="current"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="
              current !== '' &&
              (parseDomNumber(current) === null ||
                (parseDomNumber(previous) !== null && usage === null))
            "
          /><small>m³</small></span
        >
      </div>
      <div class="meter-result" aria-live="polite">
        <template v-if="usage !== null">
          <span>Zużycie w okresie</span>
          <strong>{{ format(usage) }} <small>m³</small></strong>
          <p>Czyli około {{ format(usage * 1000) }} litrów wody.</p>
          <button type="button" :disabled="usage === 0" @click="applyUsage">
            <ArrowDownToLine :size="17" aria-hidden="true" /> Wstaw zużycie do kalkulatora
          </button>
          <small v-if="usage === 0">Brak zużycia w podanym okresie.</small>
        </template>
        <p v-else>Wpisz oba odczyty. Aktualny nie może być mniejszy od poprzedniego.</p>
      </div>
    </div>
    <p class="caveat">
      Przy wymianie lub wyzerowaniu licznika sprawdź odczyty na rachunku. Ten pomocnik nie
      uwzględnia opłat stałych.
    </p>
  </section>
</template>

<style scoped>
.practical-panel {
  margin-top: 1.25rem;
  padding: 2rem;
  border: 1px solid #dce9e2;
  border-radius: 22px;
  background: linear-gradient(130deg, #fffefa, #edf7f1);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.panel-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #dcefe9;
  color: #3a7e76;
}
.panel-title p {
  color: #518479;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h3 {
  margin-top: 0.3rem;
  color: #274b3d;
  font-family: var(--font-heading);
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.intro {
  max-width: 780px;
  margin-top: 1rem;
  color: #697d73;
  font-size: 0.86rem;
  line-height: 1.7;
}
.meter-grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 1.4rem;
  margin-top: 1.5rem;
}
.meter-fields {
  display: grid;
  align-content: start;
  gap: 0.5rem;
}
.meter-fields label {
  color: #3c6351;
  font-size: 0.77rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid #cddfd4;
  border-radius: 10px;
  background: #fff;
}
.input-wrap:focus-within {
  border-color: #5b9683;
  box-shadow: 0 0 0 3px #5b968326;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #bc715b;
}
.input-wrap input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #254934;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 800;
}
.input-wrap small {
  color: #758979;
  font-size: 0.72rem;
}
.meter-result {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 175px;
  padding: 1.3rem 1.5rem;
  border: 1px solid #c9dfd5;
  border-radius: 16px;
  background: #e8f4ec;
  color: #315844;
}
.meter-result > span {
  color: #557e66;
  font-size: 0.76rem;
  font-weight: 800;
}
.meter-result strong {
  margin-top: 0.4rem;
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
}
.meter-result strong small {
  font-size: 0.6em;
}
.meter-result p {
  color: #668171;
  font-size: 0.79rem;
  line-height: 1.6;
}
.meter-result button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 1rem;
  padding: 0.7rem 0.9rem;
  border: 0;
  border-radius: 10px;
  background: #285b42;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
.meter-result button:hover {
  background: #1e4934;
}
.meter-result button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.meter-result button:focus-visible {
  outline: 2px solid #285b42;
  outline-offset: 3px;
}
.caveat {
  margin-top: 1.1rem;
  color: #758678;
  font-size: 0.72rem;
  line-height: 1.6;
}
@media (max-width: 800px) {
  .meter-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .practical-panel {
    padding: 1.3rem;
  }
}
</style>
