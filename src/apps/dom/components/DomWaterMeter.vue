<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownToLine, Droplets } from '@lucide/vue'
import { parseDomNumber } from '../lib/calculations'
import { calculateMeterUsage } from '../lib/practical'
import { calculateWaterPeriod } from '../lib/water-cost'

const previous = defineModel<string>('previous', { required: true })
const current = defineModel<string>('current', { required: true })
const startDate = defineModel<string>('startDate', { required: true })
const endDate = defineModel<string>('endDate', { required: true })
const props = defineProps<{ unitRate: number | null }>()
const emit = defineEmits<{ useVolume: [volume: number] }>()
const usage = computed(() => calculateMeterUsage(previous.value, current.value))
const period = computed(() =>
  calculateWaterPeriod(usage.value, startDate.value, endDate.value, props.unitRate),
)
const hasDates = computed(() => startDate.value !== '' || endDate.value !== '')
const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const money = (value: number) =>
  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  )

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
    <div class="date-fields">
      <div>
        <label for="meter-start-date">Data poprzedniego odczytu <small>(opcjonalnie)</small></label>
        <input
          id="meter-start-date"
          v-model="startDate"
          type="date"
          :aria-invalid="hasDates && !period"
        />
      </div>
      <div>
        <label for="meter-end-date">Data aktualnego odczytu <small>(opcjonalnie)</small></label>
        <input
          id="meter-end-date"
          v-model="endDate"
          type="date"
          :aria-invalid="hasDates && !period"
        />
      </div>
    </div>
    <div v-if="period" class="period-summary" aria-live="polite">
      <strong>{{ period.days }} dni między odczytami</strong>
      <span>Średnio {{ format(period.litersPerDay) }} l dziennie</span>
      <span
        >Przy tym tempie przez 30 dni: {{ format(period.volume30Days) }} m³<span
          v-if="period.cost30Days !== null"
        >
          · około {{ money(period.cost30Days) }} zł za zużycie</span
        ></span
      >
      <small>Prognoza zakłada równe zużycie i nie obejmuje opłaty stałej.</small>
    </div>
    <p v-else-if="hasDates" class="date-error">
      Aby obliczyć średnią, wpisz oba odczyty i dwie daty; aktualna data musi być późniejsza.
    </p>
    <p class="caveat">
      Przy wymianie lub wyzerowaniu licznika sprawdź odczyty na rachunku. Ten pomocnik nie dolicza
      opłaty stałej do prognozy.
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
.date-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.2rem;
}
.date-fields label {
  display: block;
  margin-bottom: 0.45rem;
  color: #3c6351;
  font-size: 0.77rem;
  font-weight: 800;
}
.date-fields label small {
  color: #758979;
  font-weight: 500;
}
.date-fields input {
  box-sizing: border-box;
  width: 100%;
  min-height: 45px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #cddfd4;
  border-radius: 10px;
  background: #fff;
  color: #254934;
  font: inherit;
}
.date-fields input[aria-invalid='true'] {
  border-color: #bc715b;
}
.date-fields input:focus-visible {
  outline: 2px solid #285b42;
  outline-offset: 2px;
}
.period-summary {
  display: grid;
  gap: 0.4rem;
  margin-top: 1.2rem;
  padding: 1rem 1.25rem;
  border: 1px solid #c9dfd5;
  border-radius: 14px;
  background: #e8f4ec;
  color: #315844;
  font-size: 0.82rem;
}
.period-summary small {
  color: #668171;
}
.date-error {
  margin-top: 0.8rem;
  color: #a95242;
  font-size: 0.75rem;
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
  .date-fields {
    grid-template-columns: 1fr;
  }
}
</style>
